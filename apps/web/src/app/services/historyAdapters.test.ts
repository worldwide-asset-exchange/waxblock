import { describe, expect, test } from "vitest";
import type { HyperionAction } from "../types/blockchain";
import {
  buildV2ActionsQuery,
  decrementDecimalString,
  getV2ActionSearchText,
  getV2ActionsPageRequest,
  HYPERION_RESULT_WINDOW,
  HYPERION_WINDOW_BOUNDARY_SKIP,
  isV2ActionAllowedBySpamFilter,
  isV2SmallIncomingTransfer,
  normalizeLightApiKeyAccounts,
  normalizeV2Transaction,
} from "./historyAdapters";

describe("normalizeLightApiKeyAccounts", () => {
  test("converts and sorts lightapi accounts", () => {
    const raw = {
      wax: {
        accounts: {
          bob: [{ perm: "active" }],
          alice: [{ perm: "owner" }],
        },
      },
    };

    expect(normalizeLightApiKeyAccounts(raw, "wax")).toEqual({
      account_names: ["alice", "bob"],
      accounts: [
        { account: "alice", permissions: [{ perm: "owner" }] },
        { account: "bob", permissions: [{ perm: "active" }] },
      ],
      raw,
    });
  });

  test("returns empty arrays when chain data is missing", () => {
    const raw = { proton: { accounts: {} } };

    expect(normalizeLightApiKeyAccounts(raw, "wax")).toEqual({
      account_names: [],
      accounts: [],
      raw,
    });
  });
});

describe("normalizeV2Transaction", () => {
  const action = (overrides: Partial<HyperionAction> = {}): HyperionAction => ({
    trx_id: "trx123",
    block_num: 10,
    timestamp: "2026-04-25T00:00:00.000",
    act: { account: "eosio", name: "noop", authorization: [], data: {} },
    receipts: [{ receiver: "eosio" }],
    cpu_usage_us: 0,
    net_usage_words: 0,
    global_sequence: 1,
    action_ordinal: 1,
    creator_action_ordinal: 0,
    ...overrides,
  });

  test("normalizes a v2 transaction into the existing transaction view model", () => {
    const normalized = normalizeV2Transaction({
      executed: true,
      trx_id: "trx123",
      actions: [
        action({
          global_sequence: 2,
          action_ordinal: 2,
          creator_action_ordinal: 1,
          cpu_usage_us: 3,
          net_usage_words: 4,
        }),
        action({
          global_sequence: 1,
          action_ordinal: 1,
          creator_action_ordinal: 0,
          cpu_usage_us: 5,
          net_usage_words: 6,
        }),
      ],
    });

    expect(normalized?.id).toBe("trx123");
    expect(normalized?.block_num).toBe(10);
    expect(normalized?.block_time).toBe("2026-04-25T00:00:00.000");
    expect(normalized?.trx.receipt.cpu_usage_us).toBe(8);
    expect(normalized?.trx.receipt.net_usage_words).toBe(10);
    expect(normalized?.trx.trx.actions).toHaveLength(1);
    expect(
      normalized?.traces[1].closest_unnotified_ancestor_action_ordinal,
    ).toBe(1);
    expect(normalized?.traces[0].receipts[0].receiver).toBe("eosio");
  });

  test("returns null for unexecuted or empty transactions", () => {
    expect(normalizeV2Transaction({ executed: false, actions: [] })).toBeNull();
    expect(normalizeV2Transaction({ executed: true, actions: [] })).toBeNull();
  });
});

describe("buildV2ActionsQuery", () => {
  test("encodes v2 action query params", () => {
    const query = buildV2ActionsQuery("alice", {
      limit: 100,
      skip: 200,
      after: "2026-04-01T00:00:00.000Z",
      "transfer.to": "alice",
      filter: "eosio:setcode,eosio:setabi",
    });
    const params = new URLSearchParams(query);

    expect(params.get("account")).toBe("alice");
    expect(params.get("limit")).toBe("100");
    expect(params.get("skip")).toBe("200");
    expect(params.get("sort")).toBe("desc");
    expect(params.get("track")).toBe("true");
    expect(params.get("after")).toBe("2026-04-01T00:00:00.000Z");
    expect(params.get("transfer.to")).toBe("alice");
    expect(params.get("filter")).toBe("eosio:setcode,eosio:setabi");
  });
});

describe("v2 action pagination windows", () => {
  test("uses direct skip while from plus size is inside the result window", () => {
    expect(
      getV2ActionsPageRequest({
        page: 99,
        itemsPerPage: 100,
        totalResults: 50000,
      }),
    ).toMatchObject({
      kind: "direct",
      limit: 100,
      skip: 9900,
      sort: "desc",
      readsFullTotal: true,
    });
  });

  test("uses a bounded window after the direct result window", () => {
    expect(
      getV2ActionsPageRequest({
        page: 100,
        itemsPerPage: 100,
        totalResults: 50000,
      }),
    ).toMatchObject({
      kind: "window",
      limit: 100,
      skip: 0,
      sort: "desc",
      windowIndex: 1,
      readsFullTotal: false,
    });
  });

  test("uses ascending tail access when the requested page is near the end", () => {
    expect(
      getV2ActionsPageRequest({
        page: 498,
        itemsPerPage: 100,
        totalResults: 50000,
      }),
    ).toMatchObject({
      kind: "tail",
      limit: 100,
      skip: 100,
      sort: "asc",
      after: "1",
      reverseResults: true,
    });
  });

  test("decrements decimal sequence strings without losing precision", () => {
    expect(decrementDecimalString("105532207023")).toBe("105532207022");
    expect(decrementDecimalString("1000")).toBe("999");
    expect(decrementDecimalString("0")).toBeNull();
  });

  test("exports the expected Hyperion result-window constants", () => {
    expect(HYPERION_RESULT_WINDOW).toBe(10000);
    expect(HYPERION_WINDOW_BOUNDARY_SKIP).toBe(9999);
  });
});

describe("v2 account transaction filters", () => {
  const transferAction = {
    trx_id: "abc123",
    act: {
      account: "eosio.token",
      name: "transfer",
      authorization: [{ actor: "bob", permission: "active" }],
      data: {
        from: "bob",
        to: "alice",
        quantity: "0.0001 WAX",
        memo: "test memo",
      },
    },
  };

  test("search text includes transaction, action, and data fields", () => {
    const text = getV2ActionSearchText(transferAction);

    expect(text).toContain("abc123");
    expect(text).toContain("eosio.token");
    expect(text).toContain("memo: test memo");
  });

  test("detects small incoming transfers from quantity strings", () => {
    expect(isV2SmallIncomingTransfer(transferAction, "alice", 0.001)).toBe(
      true,
    );
    expect(isV2SmallIncomingTransfer(transferAction, "bob", 0.001)).toBe(false);
  });

  test("keeps current spam filter allow and deny behavior", () => {
    expect(isV2ActionAllowedBySpamFilter(transferAction, "alice", [])).toBe(
      true,
    );
    expect(
      isV2ActionAllowedBySpamFilter(transferAction, "alice", [
        "eosio.token::transfer",
      ]),
    ).toBe(false);
  });
});
