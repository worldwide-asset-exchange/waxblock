import { processTraces } from "./traceProcessing";
import {
  HyperionAction,
  HyperionTransactionResponse,
  toNumeric,
} from "../types/blockchain";

export const toNumber = toNumeric;

export const normalizeLightApiKeyAccounts = (
  response: Record<string, unknown>,
  network: string,
) => {
  const chain = response?.[network] as
    | { accounts?: Record<string, unknown[]> }
    | undefined;
  const sourceAccounts = chain?.accounts || {};

  const accounts = Object.entries(sourceAccounts)
    .map(([account, permissions]) => ({
      account,
      permissions: Array.isArray(permissions) ? permissions : [],
    }))
    .sort((a, b) =>
      a.account > b.account ? 1 : b.account > a.account ? -1 : 0,
    );

  return {
    account_names: accounts.map((account) => account.account),
    accounts,
    raw: response,
  };
};

export const normalizeV2Transaction = (response: HyperionTransactionResponse) => {
  if (!response || response.executed !== true || !response.actions?.length) {
    return null;
  }

  const rawActions = [...response.actions].sort((a, b) => {
    const globalDiff =
      toNumber(a.global_sequence) - toNumber(b.global_sequence);
    if (globalDiff !== 0) return globalDiff;
    return toNumber(a.action_ordinal) - toNumber(b.action_ordinal);
  });

  const processedActions = processTraces(response.actions);
  const firstAction = rawActions[0];
  const rootActions = processedActions
    .filter((action) => toNumber(action.creator_action_ordinal) === 0)
    .sort((a, b) => toNumber(a.action_ordinal) - toNumber(b.action_ordinal))
    .map((action) => action.act);

  const traces = processedActions.map((action) => ({
    ...action,
    receipts: action.receipts || [],
    account_ram_deltas: action.account_ram_deltas || [],
    receiver: action.receipts?.[0]?.receiver || action.act?.account,
    closest_unnotified_ancestor_action_ordinal:
      toNumber(action.creator_action_ordinal) || 0,
  }));

  const cpuUsage = rawActions.reduce(
    (total, action) => total + toNumber(action.cpu_usage_us),
    0,
  );
  const netUsage = rawActions.reduce(
    (total, action) => total + toNumber(action.net_usage_words),
    0,
  );

  return {
    id: response.trx_id,
    block_num: toNumber(firstAction.block_num),
    block_time: firstAction.timestamp || firstAction["@timestamp"],
    trx: {
      receipt: {
        cpu_usage_us: cpuUsage,
        net_usage_words: netUsage,
        status: "executed",
      },
      trx: {
        actions: rootActions,
      },
    },
    traces,
    raw: response,
  };
};

export const buildV2ActionsQuery = (
  accountName: string,
  params: Record<string, string | number | boolean | null | undefined> = {},
) => {
  const queryParams = {
    account: accountName,
    limit: 1000,
    skip: 0,
    sort: "desc",
    track: true,
    ...params,
  };

  const searchParams = new URLSearchParams();

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }
    searchParams.set(key, String(value));
  });

  return searchParams.toString();
};

export const HYPERION_RESULT_WINDOW = 10000;
export const HYPERION_WINDOW_BOUNDARY_SKIP = HYPERION_RESULT_WINDOW - 1;

export type V2ActionsPageRequest = {
  kind: "direct" | "tail" | "window";
  limit: number;
  skip: number;
  sort: "asc" | "desc";
  after?: string;
  windowIndex?: number;
  reverseResults: boolean;
  readsFullTotal: boolean;
};

export const decrementDecimalString = (value: string) => {
  const digits = value.replace(/^0+/, "") || "0";
  if (digits === "0") {
    return null;
  }

  const chars = digits.split("");
  for (let i = chars.length - 1; i >= 0; i -= 1) {
    if (chars[i] !== "0") {
      chars[i] = String(Number(chars[i]) - 1);
      break;
    }

    chars[i] = "9";
  }

  return chars.join("").replace(/^0+/, "") || "0";
};

const isBlockNumber = (value: string | null) =>
  value !== null && /^[1-9]\d*$/.test(value);

const getPageResultCount = (
  page: number,
  itemsPerPage: number,
  totalResults: number | null,
) => {
  if (totalResults === null) {
    return itemsPerPage;
  }

  const offset = page * itemsPerPage;
  return Math.max(0, Math.min(itemsPerPage, totalResults - offset));
};

export const getV2ActionsPageRequest = ({
  page,
  itemsPerPage,
  totalResults,
  after,
  before,
}: {
  page: number;
  itemsPerPage: number;
  totalResults: number | null;
  after?: string | null;
  before?: string | null;
}): V2ActionsPageRequest | null => {
  if (page < 0 || itemsPerPage < 1) {
    return null;
  }

  const offset = page * itemsPerPage;
  const pageResultCount = getPageResultCount(page, itemsPerPage, totalResults);
  if (pageResultCount === 0) {
    return null;
  }

  if (offset + pageResultCount <= HYPERION_RESULT_WINDOW) {
    return {
      kind: "direct",
      limit: pageResultCount,
      skip: offset,
      sort: "desc",
      reverseResults: false,
      readsFullTotal: true,
    };
  }

  const canUseAscendingTail = !after || isBlockNumber(after);
  if (totalResults !== null && canUseAscendingTail) {
    const ascSkip = totalResults - offset - pageResultCount;

    if (ascSkip >= 0 && ascSkip + pageResultCount <= HYPERION_RESULT_WINDOW) {
      return {
        kind: "tail",
        limit: pageResultCount,
        skip: ascSkip,
        sort: "asc",
        after: after || before ? undefined : "1",
        reverseResults: true,
        readsFullTotal: true,
      };
    }
  }

  return {
    kind: "window",
    limit: pageResultCount,
    skip: offset % HYPERION_RESULT_WINDOW,
    sort: "desc",
    windowIndex: Math.floor(offset / HYPERION_RESULT_WINDOW),
    reverseResults: false,
    readsFullTotal: false,
  };
};

export const getV2ActionSearchText = (action: HyperionAction) => {
  const items = [action?.trx_id, action?.act?.account, action?.act?.name];
  const data = action?.act?.data;

  if (data) {
    Object.keys(data).forEach((key) => {
      items.push([key, data[key]].join(": "));
    });
  }

  return items.filter(Boolean).join(" ");
};

export const isV2SmallIncomingTransfer = (
  action: HyperionAction,
  accountName: string,
  threshold: number,
) => {
  const data = action?.act?.data;
  const amount =
    data?.amount !== undefined
      ? Number(data.amount)
      : data?.quantity
        ? parseFloat(data.quantity)
        : null;

  return Boolean(amount && amount < threshold && data?.to === accountName);
};

export const isV2ActionAllowedBySpamFilter = (
  action: HyperionAction,
  accountName: string,
  spamActions: string[] = [],
) => {
  const contract = action?.act?.account;
  const actionName = action?.act?.name;
  const data = action?.act?.data;
  const actor = action?.act?.authorization?.[0]?.actor || null;
  const contractActionName = [contract, "::", actionName].join("");

  if (contractActionName && spamActions.includes(contractActionName)) {
    return false;
  }

  if (actor && actor === accountName) {
    return true;
  }

  if (
    actionName === "transfer" &&
    data &&
    data.to === accountName &&
    actor &&
    actor === data.from
  ) {
    return true;
  }

  if (contract === accountName) {
    return true;
  }

  return Boolean(
    contract &&
    (contract.startsWith("eosio") ||
      contract.startsWith("eosio.") ||
      contract.startsWith("atomicassets")),
  );
};
