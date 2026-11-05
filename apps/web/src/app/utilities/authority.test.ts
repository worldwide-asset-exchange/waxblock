import { describe, expect, it } from "vitest";
import { PublicKey } from "@wharfkit/antelope";
import {
  buildSortedAuthority,
  normalizePublicKey,
  parseAuthorization,
} from "./authority";

const legacyKeyA = "EOS6MaytrNBhMraUmvYHqxyB6UFTdZmvA2jXgRu1f45m59aDqZb4K";
const legacyKeyB = "EOS7QMNPUqMaiSTK1TnbuaYEKyxXLk2doHvJqK2GRPSpCcixTFfsz";
const legacyKeyC = "EOS5pbxLm4KBHiQ3mKVgzrUr7zCximRqKkpdbGXrVfk9pAX4a2HM1";

describe("normalizePublicKey", () => {
  it("returns legacy EOS keys in modern PUB_K1 format", () => {
    expect(normalizePublicKey(legacyKeyA)).toBe(
      PublicKey.from(legacyKeyA).toString(),
    );
    expect(normalizePublicKey(legacyKeyA)).toMatch(/^PUB_K1_/);
  });
});

describe("buildSortedAuthority", () => {
  it("sorts keys in the returned authority", () => {
    const authority = buildSortedAuthority(1, [
      { type: "key", authority: legacyKeyB, weight: 1 },
      { type: "key", authority: legacyKeyA, weight: 1 },
      { type: "key", authority: legacyKeyC, weight: 1 },
    ]);
    const keys = authority.keys.map(({ key }) => key);

    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));
  });

  it("accepts legacy EOS keys and normalizes them with WharfKit", () => {
    const authority = buildSortedAuthority(1, [
      { type: "key", authority: legacyKeyA, weight: 1 },
    ]);

    expect(authority.keys[0].key).toBe(PublicKey.from(legacyKeyA).toString());
  });

  it("sorts accounts by canonical actor and permission", () => {
    const authority = buildSortedAuthority(1, [
      { type: "account", authority: "managed.wax@cosign", weight: 1 },
      { type: "account", authority: "abc.wam@owner", weight: 1 },
      { type: "account", authority: "abc.wam@active", weight: 1 },
    ]);
    const accounts = authority.accounts.map(
      ({ permission }) => `${permission.actor}@${permission.permission}`,
    );

    expect(accounts).toEqual([
      "abc.wam@active",
      "abc.wam@owner",
      "managed.wax@cosign",
    ]);
  });

  it("sorts waits numerically", () => {
    const authority = buildSortedAuthority(1, [
      { type: "wait", authority: "10", weight: 1 },
      { type: "wait", authority: "2", weight: 1 },
      { type: "wait", authority: "30", weight: 1 },
    ]);

    expect(authority.waits.map(({ wait_sec }) => wait_sec)).toEqual([
      2, 10, 30,
    ]);
  });

  it("converts string form values to numbers", () => {
    const authority = buildSortedAuthority("2", [
      { type: "key", authority: legacyKeyA, weight: "2" },
      { type: "wait", authority: "5", weight: "1" },
    ]);

    expect(authority.threshold).toBe(2);
    expect(authority.keys[0].weight).toBe(2);
    expect(authority.waits[0].wait_sec).toBe(5);
    expect(authority.waits[0].weight).toBe(1);
  });

  it("rejects duplicate keys, accounts, and waits", () => {
    expect(() =>
      buildSortedAuthority(1, [
        { type: "key", authority: legacyKeyA, weight: 1 },
        {
          type: "key",
          authority: PublicKey.from(legacyKeyA).toString(),
          weight: 1,
        },
      ]),
    ).toThrow(/Duplicate key/);

    expect(() =>
      buildSortedAuthority(1, [
        { type: "account", authority: "managed.wax@cosign", weight: 1 },
        { type: "account", authority: "managed.wax@cosign", weight: 1 },
      ]),
    ).toThrow(/Duplicate account permission/);

    expect(() =>
      buildSortedAuthority(1, [
        { type: "wait", authority: 10, weight: 1 },
        { type: "wait", authority: "10", weight: 1 },
      ]),
    ).toThrow(/Duplicate wait/);
  });

  it("rejects zero waits", () => {
    expect(() =>
      buildSortedAuthority(1, [{ type: "wait", authority: 0, weight: 1 }]),
    ).toThrow(/wait seconds must be a positive integer/);
  });

  it("rejects authorities with insufficient total weight", () => {
    expect(() =>
      buildSortedAuthority(3, [
        { type: "key", authority: legacyKeyA, weight: 2 },
      ]),
    ).toThrow(/total weight/);
  });

  it("rejects invalid keys and account permissions", () => {
    expect(() =>
      buildSortedAuthority(1, [
        { type: "key", authority: "not-a-key", weight: 1 },
      ]),
    ).toThrow();

    expect(() =>
      buildSortedAuthority(1, [
        { type: "account", authority: "managed.wax", weight: 1 },
      ]),
    ).toThrow();
  });
});

describe("parseAuthorization", () => {
  it("parses a valid actor permission pair", () => {
    expect(parseAuthorization(" managed.wax@cosign ")).toEqual({
      actor: "managed.wax",
      permission: "cosign",
    });
  });

  it("rejects invalid authorization values", () => {
    expect(() => parseAuthorization("managed.wax")).toThrow();
  });
});
