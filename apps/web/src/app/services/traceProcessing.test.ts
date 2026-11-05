import { describe, expect, test } from "vitest";
import { getRepeatChunkLength, processTraces } from "./traceProcessing";
import { normalizeV2Transaction } from "./historyAdapters";

import type { HyperionAction } from "../types/blockchain";

const action = (overrides: Partial<HyperionAction> = {}): HyperionAction => ({
  trx_id: "trx123",
  block_num: 10,
  timestamp: "2026-04-25T00:00:00.000",
  act: { account: "eosio", name: "noop", authorization: [], data: {} },
  receipts: [{ receiver: "eosio", global_sequence: 100 }],
  cpu_usage_us: 0,
  net_usage_words: 0,
  global_sequence: 100,
  action_ordinal: 1,
  creator_action_ordinal: 0,
  ...overrides,
});

describe("getRepeatChunkLength", () => {
  test("returns total when receivers are all distinct", () => {
    expect(getRepeatChunkLength(["a", "b", "c"])).toBe(3);
  });

  test("detects repeating receiver pattern", () => {
    expect(getRepeatChunkLength(["a", "b", "a", "b"])).toBe(2);
  });
});

describe("processTraces", () => {
  test("recovers notification ordinals for merged receipts", () => {
    const processed = processTraces([
      action({
        action_ordinal: 1,
        creator_action_ordinal: 0,
        global_sequence: 10,
        receipts: [
          { receiver: "eosio.token", global_sequence: 10 },
          { receiver: "alice", global_sequence: 11 },
          { receiver: "bob", global_sequence: 12 },
        ],
      }),
      action({
        action_ordinal: 5,
        creator_action_ordinal: 0,
        global_sequence: 15,
        receipts: [{ receiver: "eosio", global_sequence: 15 }],
      }),
      action({
        action_ordinal: 4,
        creator_action_ordinal: 0,
        global_sequence: 20,
        receipts: [
          { receiver: "eosio.token", global_sequence: 20 },
          { receiver: "charlie", global_sequence: 22 },
        ],
      }),
      action({
        action_ordinal: 7,
        creator_action_ordinal: 3,
        global_sequence: 25,
        act: { account: "child", name: "act", authorization: [], data: {} },
        receipts: [{ receiver: "child", global_sequence: 25 }],
      }),
    ]);

    const action1 = processed.find((trace) => trace.action_ordinal === 1);
    const action4 = processed.find((trace) => trace.action_ordinal === 4);
    const child = processed.find((trace) => trace.action_ordinal === 7);

    expect(action1?.action_ordinals).toEqual([1, 2, 3]);
    expect(action4?.action_ordinals).toEqual([4, 6]);
    expect(child?.creator_action_ordinal).toBe(1);
  });

  test("splits repeated-receiver actions into separate traces", () => {
    const processed = processTraces([
      action({
        action_ordinal: 1,
        creator_action_ordinal: 0,
        global_sequence: 10,
        receipts: [
          { receiver: "alice", global_sequence: 10 },
          { receiver: "bob", global_sequence: 11 },
          { receiver: "alice", global_sequence: 12 },
          { receiver: "bob", global_sequence: 13 },
        ],
      }),
      action({
        action_ordinal: 5,
        creator_action_ordinal: 2,
        global_sequence: 20,
        act: { account: "child", name: "first", authorization: [], data: {} },
        receipts: [{ receiver: "child", global_sequence: 20 }],
      }),
      action({
        action_ordinal: 6,
        creator_action_ordinal: 4,
        global_sequence: 25,
        act: { account: "child", name: "second", authorization: [], data: {} },
        receipts: [{ receiver: "child", global_sequence: 25 }],
      }),
    ]);

    expect(processed).toHaveLength(4);
    const chunks = processed.filter((trace) => trace.act.name === "noop");
    const children = processed.filter((trace) => trace.act.name !== "noop");
    expect(chunks).toHaveLength(2);
    expect(chunks[0].receipts).toHaveLength(2);
    expect(chunks[1].receipts).toHaveLength(2);
    expect(chunks[0].action_ordinal).not.toBe(chunks[1].action_ordinal);
    expect(children[0].creator_action_ordinal).toBe(chunks[0].action_ordinal);
    expect(children[0].act.name).toBe("first");
    expect(children[1].creator_action_ordinal).toBe(chunks[1].action_ordinal);
    expect(children[1].act.name).toBe("second");
  });
});

describe("normalizeV2Transaction with trace processing", () => {
  test("maps closest_unnotified_ancestor_action_ordinal from remapped creators", () => {
    const normalized = normalizeV2Transaction({
      executed: true,
      trx_id: "trx123",
      actions: [
        action({
          action_ordinal: 1,
          creator_action_ordinal: 0,
          global_sequence: 10,
          receipts: [
            { receiver: "eosio.token", global_sequence: 10 },
            { receiver: "alice", global_sequence: 11 },
            { receiver: "bob", global_sequence: 12 },
          ],
        }),
        action({
          action_ordinal: 4,
          creator_action_ordinal: 3,
          global_sequence: 20,
          act: { account: "child", name: "act", authorization: [], data: {} },
          receipts: [{ receiver: "child", global_sequence: 20 }],
        }),
      ],
    });

    const childTrace = normalized?.traces.find(
      (trace) => trace.action_ordinal === 4,
    );
    expect(childTrace?.closest_unnotified_ancestor_action_ordinal).toBe(1);
  });

  test("nests children under action 1 for merged notification receipts (a95aec6f pattern)", () => {
    const normalized = normalizeV2Transaction({
      executed: true,
      trx_id: "a95aec6f",
      actions: [
        action({
          action_ordinal: 1,
          creator_action_ordinal: 0,
          global_sequence: 108589471021,
          act: {
            account: "eosio.token",
            name: "transfer",
            authorization: [],
            data: {},
          },
          receipts: [
            { receiver: "eosio.token", global_sequence: 108589471021 },
            { receiver: "novyautomat2", global_sequence: 108589471022 },
            { receiver: "swap.we", global_sequence: 108589471023 },
          ],
        }),
        action({
          action_ordinal: 5,
          creator_action_ordinal: 3,
          global_sequence: 108589471024,
          act: {
            account: "swap.we",
            name: "runstep",
            authorization: [],
            data: {},
          },
          receipts: [{ receiver: "swap.we", global_sequence: 108589471024 }],
        }),
        action({
          action_ordinal: 4,
          creator_action_ordinal: 3,
          global_sequence: 108589471025,
          act: {
            account: "eosio.token",
            name: "transfer",
            authorization: [],
            data: {},
          },
          receipts: [
            { receiver: "eosio.token", global_sequence: 108589471025 },
            { receiver: "swap.alcor", global_sequence: 108589471027 },
          ],
        }),
      ],
    });

    const action1 = normalized?.traces.find(
      (trace) => trace.action_ordinal === 1,
    );
    const childrenOf1 = normalized?.traces.filter(
      (trace) => trace.closest_unnotified_ancestor_action_ordinal === 1,
    );

    expect(action1?.action_ordinals).toEqual([1, 2, 3]);
    expect(childrenOf1?.map((trace) => trace.action_ordinal).sort()).toEqual([
      4, 5,
    ]);

    const orphaned = normalized?.traces.filter((trace) => {
      const parent = trace.closest_unnotified_ancestor_action_ordinal;
      if (parent === 0) return false;
      return !normalized?.traces.some(
        (candidate) => candidate.action_ordinal === parent,
      );
    });
    expect(orphaned).toEqual([]);
  });
});
