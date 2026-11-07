import type { APIClient } from "@wharfkit/antelope";
import { describe, expect, it, vi } from "vitest";
import {
  calculateVoterFunding,
  fetchWaxInflationPolicy,
  WAX_SECONDS_PER_YEAR,
} from "./waxInflation";

describe("fetchWaxInflationPolicy", () => {
  it("reads the live policy and RNG rate", async () => {
    const getTableRows = vi.fn(async ({ table }) => ({
      rows: [
        table === "global.c"
          ? { annual_rate_bps: 600, voters_bps: 1667 }
          : { rng_rate: 100 },
      ],
    }));
    const rpc = {
      v1: { chain: { get_table_rows: getTableRows } },
    } as unknown as APIClient;
    expect(await fetchWaxInflationPolicy(rpc)).toEqual({
      annualRateBps: 600,
      voterShareBps: 1667,
      rngRateBps: 100,
    });
    expect(getTableRows.mock.calls.map(([params]) => params.table)).toEqual([
      "global.c",
      "global5",
    ]);
  });

  it.each([undefined, null, -1, 10001, 0.5, "", true])(
    "rejects invalid policy values (%s)",
    async (value) => {
      const rpc = {
        v1: {
          chain: {
            get_table_rows: vi.fn(async ({ table }) => ({
              rows: [
                table === "global.c"
                  ? { annual_rate_bps: 600, voters_bps: value }
                  : { rng_rate: 100 },
              ],
            })),
          },
        },
      } as unknown as APIClient;
      await expect(fetchWaxInflationPolicy(rpc)).rejects.toThrow("invalid");
    },
  );

  it("does not fall back to legacy rates when a row is missing", async () => {
    const rpc = {
      v1: { chain: { get_table_rows: async () => ({ rows: [] }) } },
    } as unknown as APIClient;
    await expect(fetchWaxInflationPolicy(rpc)).rejects.toThrow("missing");
  });
});

describe("calculateVoterFunding", () => {
  it.each([
    [600, 1667, 100, 961_482_258n],
    [500, 4000, 0, 1_951_600_000n],
    [600, 1667, 0, 971_194_200n],
    [0, 1667, 100, 0n],
    [600, 0, 100, 0n],
  ])(
    "uses policy %s/%s with RNG %s",
    (annualRateBps, voterShareBps, rngRateBps, expected) => {
      expect(
        calculateVoterFunding(100_000_000_000, WAX_SECONDS_PER_YEAR, {
          annualRateBps,
          voterShareBps,
          rngRateBps,
        }),
      ).toBe(expected);
    },
  );

  it("preserves sub-token accrual and truncates the integer splits", () => {
    expect(
      calculateVoterFunding(100_000_000_000, 0.5, {
        annualRateBps: 600,
        voterShareBps: 1667,
        rngRateBps: 100,
      }),
    ).toBe(15n);
  });
});
