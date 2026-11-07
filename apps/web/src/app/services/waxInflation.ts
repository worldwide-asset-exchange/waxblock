import type { APIClient } from "@wharfkit/antelope";

export const WAX_SECONDS_PER_YEAR = 52 * 7 * 24 * 60 * 60;

export interface WaxInflationPolicy {
  annualRateBps: number;
  voterShareBps: number;
  rngRateBps: number;
}

export async function fetchWaxInflationPolicy(
  rpc: APIClient,
): Promise<WaxInflationPolicy> {
  const [inflation, rng] = await Promise.all(
    ["global.c", "global5"].map((table) =>
      rpc.v1.chain.get_table_rows({
        code: "eosio",
        scope: "eosio",
        table,
        json: true,
        limit: 1,
      }),
    ),
  );
  const values = [
    inflation.rows[0]?.annual_rate_bps,
    inflation.rows[0]?.voters_bps,
    rng.rows[0]?.rng_rate,
  ];
  if (
    values.some(
      (value) =>
        !/^[0-9]+$/.test(String(value)) ||
        !Number.isSafeInteger(Number(value)) ||
        Number(value) > 10_000,
    )
  ) {
    throw new Error("WAX inflation policy is missing or invalid");
  }
  return {
    annualRateBps: Number(values[0]),
    voterShareBps: Number(values[1]),
    rngRateBps: Number(values[2]),
  };
}

export function calculateVoterFunding(
  supplyUnits: number,
  elapsedSeconds: number,
  policy: WaxInflationPolicy,
): bigint {
  // Match eosio.system's truncation of the continuous rate and token amounts.
  const continuousRate =
    Math.floor(Math.log1p(policy.annualRateBps / 10_000) * 100_000) / 100_000;
  const distributed = BigInt(
    Math.floor(
      (continuousRate * supplyUnits * Math.max(0, elapsedSeconds)) /
        WAX_SECONDS_PER_YEAR,
    ),
  );
  // shortcut: assume the full RNG rate; model treasury refills if cap effects matter.
  const rng = (distributed * BigInt(policy.rngRateBps)) / 10_000n;
  return ((distributed - rng) * BigInt(policy.voterShareBps)) / 10_000n;
}
