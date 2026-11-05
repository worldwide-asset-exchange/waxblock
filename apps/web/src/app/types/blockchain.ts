export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type HyperionReceipt = {
  receiver?: string;
  global_sequence?: number | string;
};

export type HyperionAction = {
  trx_id?: string;
  block_num?: number | string;
  timestamp?: string;
  "@timestamp"?: string;
  act?: {
    account?: string;
    name?: string;
    authorization?: { actor?: string; permission?: string }[];
    data?: Record<string, unknown>;
  };
  receipts?: HyperionReceipt[];
  cpu_usage_us?: number | string;
  net_usage_words?: number | string;
  global_sequence?: number | string;
  action_ordinal?: number | string;
  creator_action_ordinal?: number | string;
  action_ordinals?: number[];
  account_ram_deltas?: unknown[];
  [key: string]: unknown;
};

export type HyperionTransactionResponse = {
  executed?: boolean;
  trx_id?: string;
  actions?: HyperionAction[];
  total?: { value?: number };
};

export type HyperionActionsResponse = {
  actions?: HyperionAction[];
  total?: { value?: number };
};

export type ChainAction = {
  account: string;
  name: string;
  authorization?: { actor: string; permission: string }[];
  data?: Record<string, unknown>;
};

export type WalletTransaction = {
  type?: string;
  account?: { account: string | null; permission: string };
  actions: ChainAction[];
};

export type TransactionAlert = {
  type: "success" | "error" | "warning" | "info";
  message: string;
  walletTransaction?: WalletTransaction | null;
} | null;

export type WalletBalance = {
  contract: string;
  decimals: number;
  currency: string;
  amount: string;
};

export type WalletAccount = {
  account: unknown | null;
  userres: unknown | null;
  delband: unknown | null;
  balances: WalletBalance[] | null;
  accInfo: unknown | null;
};

export type MultisigState = {
  mode: boolean;
  walletTransaction: WalletTransaction | null;
};

export type TableRowsResponse = {
  rows?: Record<string, unknown>[];
  more?: boolean;
  next_key?: string;
};

export type RammarketRow = {
  quote?: { balance?: string };
  base?: { balance?: string };
};

export type RammarketTableResponse = {
  rows?: RammarketRow[];
  more?: boolean;
  next_key?: string;
};

export type ChainInfo = {
  chain_id?: string;
  [key: string]: unknown;
};

export const toNumeric = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (
    value &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof value.toNumber === "function"
  ) {
    return value.toNumber();
  }
  return Number(value || 0) || 0;
};
