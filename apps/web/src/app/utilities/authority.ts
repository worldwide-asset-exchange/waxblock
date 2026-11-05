import {
  Authority,
  Name,
  PermissionLevel,
  PublicKey,
  Serializer,
} from "@wharfkit/antelope";

export type EditableAuthority = {
  type: "key" | "account" | "wait";
  authority: string | number;
  weight: string | number;
};

export type BuiltAuthority = {
  threshold: number;
  keys: { key: string; weight: number }[];
  accounts: {
    permission: { actor: string; permission: string };
    weight: number;
  }[];
  waits: { wait_sec: number; weight: number }[];
};

export type ParsedAuthorization = {
  actor: string;
  permission: string;
};

const comparePublicKeys = (
  a: { key: string; weight: number },
  b: { key: string; weight: number },
) => {
  const left = PublicKey.from(a.key).toString();
  const right = PublicKey.from(b.key).toString();
  return left.localeCompare(right);
};

const comparePermissionLevels = (
  a: { permission: { actor: string; permission: string }; weight: number },
  b: { permission: { actor: string; permission: string }; weight: number },
) => {
  const left = `${a.permission.actor}@${a.permission.permission}`;
  const right = `${b.permission.actor}@${b.permission.permission}`;
  return left.localeCompare(right);
};

const toPositiveInteger = (value: string | number, label: string) => {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return numberValue;
};

const toCanonicalPermissionLevel = (value: string | number) => {
  const permission = PermissionLevel.from(String(value).trim());
  return {
    actor: permission.actor.toString(),
    permission: permission.permission.toString(),
  };
};

const assertValidName = (name: string, label: string) => {
  if (!Name.pattern.test(name) || name.length === 0 || name.length > 12) {
    throw new Error(`${label} must be a valid Antelope account name.`);
  }
};

const assertUnique = (seen: Set<string>, value: string, label: string) => {
  if (seen.has(value)) {
    throw new Error(`Duplicate ${label}: ${value}`);
  }

  seen.add(value);
};

export const normalizePublicKey = (value: string | number) =>
  PublicKey.from(String(value).trim()).toString();

export const parseAuthorization = (value: string): ParsedAuthorization => {
  const trimmedValue = value.trim();
  const permission = toCanonicalPermissionLevel(trimmedValue);

  assertValidName(permission.actor, "Authorized actor");
  assertValidName(permission.permission, "Authorized permission");

  return permission;
};

export const buildSortedAuthority = (
  threshold: string | number,
  authorities: EditableAuthority[],
): BuiltAuthority => {
  const normalizedThreshold = toPositiveInteger(threshold, "Threshold");
  const keys = [];
  const accounts = [];
  const waits = [];
  const seenKeys = new Set<string>();
  const seenAccounts = new Set<string>();
  const seenWaits = new Set<string>();
  let totalWeight = 0;

  authorities.forEach((authority, index) => {
    const rowLabel = `Authority row ${index + 1}`;
    const weight = toPositiveInteger(authority.weight, `${rowLabel} weight`);
    totalWeight += weight;

    if (authority.type === "key") {
      const key = normalizePublicKey(authority.authority);
      assertUnique(seenKeys, key, "key");
      keys.push({ key, weight });
      return;
    }

    if (authority.type === "account") {
      const permission = toCanonicalPermissionLevel(authority.authority);
      assertValidName(permission.actor, `${rowLabel} actor`);
      assertValidName(permission.permission, `${rowLabel} permission`);

      const permissionString = `${permission.actor}@${permission.permission}`;
      assertUnique(seenAccounts, permissionString, "account permission");
      accounts.push({ permission, weight });
      return;
    }

    if (authority.type === "wait") {
      const waitSec = toPositiveInteger(
        authority.authority,
        `${rowLabel} wait seconds`,
      );
      const waitKey = String(waitSec);
      assertUnique(seenWaits, waitKey, "wait");
      waits.push({ wait_sec: waitSec, weight });
      return;
    }

    throw new Error(`${rowLabel} has an unsupported authority type.`);
  });

  if (totalWeight < normalizedThreshold) {
    throw new Error("Authority total weight must meet or exceed threshold.");
  }

  const authority = Authority.from({
    threshold: normalizedThreshold,
    keys,
    accounts,
    waits,
  });
  authority.sort();

  const builtAuthority = Serializer.objectify(authority) as BuiltAuthority;

  builtAuthority.threshold = normalizedThreshold;
  builtAuthority.keys = builtAuthority.keys.sort(comparePublicKeys);
  builtAuthority.accounts = builtAuthority.accounts.sort(
    comparePermissionLevels,
  );
  builtAuthority.waits = builtAuthority.waits.sort(
    (a, b) => a.wait_sec - b.wait_sec,
  );

  return builtAuthority;
};
