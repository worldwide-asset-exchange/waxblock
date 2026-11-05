import { useContext, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { WalletContext } from "../../../app/contexts/wallet-context";
import config from "../../../app/config";
import { tokenInputFormat } from "../../../app/utilities/format";
import BlockchainApiManager from "../../../app/services/blockchainApiManager";
import { getPrecision } from "../../../app/utilities/utility";
import type { TokenBalance } from "../../../app/utilities/tokens";
import TokenSelect from "./token-select";
import "./transfer.css";

const Transfer = () => {
  const { session, refresh, submitTransaction } = useContext(WalletContext);
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    from: undefined as string | undefined,
    to: "",
    quantity: "",
    memo: "",
    custom: false,
    symbol: searchParams.get("symbol") || "",
    contract: searchParams.get("contract") || "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [balanceResult, setBalanceResult] = useState<{
    from: string;
    refresh: typeof refresh;
    balances: TokenBalance[];
    error: boolean;
  } | null>(null);
  const from = form.from ?? session?.actor?.toString() ?? "";
  const account = from.trim();
  const currentBalances =
    balanceResult?.from === account && balanceResult?.refresh === refresh;
  const balances = currentBalances ? balanceResult.balances : [];
  const loading = Boolean(account) && !currentBalances;
  const balanceError = currentBalances && balanceResult.error;

  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      BlockchainApiManager.getBalances(account).then(
        (response) => {
          if (!cancelled)
            setBalanceResult({
              from: account,
              refresh,
              balances: response.balances || [],
              error: false,
            });
        },
        () => {
          if (!cancelled)
            setBalanceResult({
              from: account,
              refresh,
              balances: [],
              error: true,
            });
        },
      );
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [account, refresh]);

  const defaultBalance =
    balances.find(
      (balance) =>
        balance.contract === "eosio.token" &&
        balance.currency === config.token_symbol,
    ) || balances[0];
  const contract = form.custom
    ? form.contract.trim()
    : form.contract || defaultBalance?.contract || "";
  const symbol = form.custom
    ? form.symbol.trim()
    : form.symbol || defaultBalance?.currency || "";
  const selectedBalance = balances.find(
    (balance) => balance.contract === contract && balance.currency === symbol,
  );
  const {
    data: stats,
    isFetching: checkingToken,
    isError: statsError,
  } = useQuery({
    queryKey: ["transfer-token-stats", contract, symbol],
    queryFn: () =>
      BlockchainApiManager.getCurrencyStats({ code: contract, symbol }),
    enabled: Boolean(contract && symbol && !loading && !selectedBalance),
    retry: false,
  });
  // Always use loaded precision, never a decimals hint from the URL.
  const decimals =
    selectedBalance?.decimals ??
    (stats?.[symbol]?.supply ? getPrecision(stats[symbol].supply) : undefined);
  const tokens = balances
    .filter(
      (balance) => Number(balance.amount) > 0 || balance === selectedBalance,
    )
    .sort(
      (a, b) =>
        a.currency.localeCompare(b.currency) ||
        a.contract.localeCompare(b.contract),
    );
  if (
    !form.custom &&
    contract &&
    symbol &&
    !tokens.some(
      (token) => token.contract === contract && token.currency === symbol,
    )
  ) {
    tokens.push({ contract, currency: symbol, amount: 0 });
  }

  const errors: Record<string, string> = {};
  if (!account) errors.from = "Enter the sender account.";
  if (!form.to.trim()) errors.to = "Enter the recipient account.";
  if (!contract || !symbol)
    errors.token = form.custom
      ? "Enter the token symbol and contract."
      : "Select a token.";
  else if (loading || checkingToken)
    errors.token = "Wait for the token details to load.";
  else if (statsError || decimals === undefined)
    errors.token =
      "Unable to verify this token. Check the symbol and contract.";
  const quantity = Number(form.quantity);
  if (!form.quantity.trim() || !Number.isFinite(quantity) || quantity <= 0)
    errors.quantity = "Enter a quantity greater than zero.";
  else if (!/^\d+(\.\d+)?$/.test(form.quantity))
    errors.quantity = "Enter a valid token amount.";
  else if (
    decimals !== undefined &&
    (form.quantity.split(".")[1]?.length || 0) > Number(decimals)
  )
    errors.quantity = `Use no more than ${decimals} decimal places.`;
  else if (selectedBalance && quantity > Number(selectedBalance.amount))
    errors.quantity = "Quantity exceeds your available balance.";
  const error = (field: string) =>
    submitted || touched[field] ? errors[field] : undefined;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      const firstField = ["from", "to", "quantity", "token"].find(
        (field) => errors[field],
      );
      event.currentTarget
        .querySelector<HTMLElement>(`#transfer-${firstField}`)
        ?.focus();
      return;
    }
    submitTransaction({
      type: "transfer",
      account: { account: null, permission: "active" },
      actions: [
        {
          account: contract,
          name: "transfer",
          data: {
            from: account,
            to: form.to.trim(),
            quantity: `${tokenInputFormat(form.quantity, decimals)} ${symbol}`,
            memo: form.memo,
          },
        },
      ],
    });
  };

  return (
    <>
      <Helmet>
        <title>Transfer Tokens | Wallet - WAX Explorer</title>
      </Helmet>
      <div className="form_box tranfer_form transfer-form active">
        <h2>Transfer Tokens</h2>
        <form noValidate onSubmit={handleSubmit}>
          <div className="field_row">
            {(["from", "to"] as const).map((field) => (
              <div className="field_col" key={field}>
                <label htmlFor={`transfer-${field}`}>
                  {field === "from" ? "From" : "To"}
                </label>
                <input
                  id={`transfer-${field}`}
                  type="text"
                  placeholder={field === "from" ? "From" : "To"}
                  value={field === "from" ? from : form.to}
                  required
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={Boolean(error(field))}
                  aria-describedby={
                    error(field) ? `transfer-${field}-error` : undefined
                  }
                  onBlur={() => setTouched({ ...touched, [field]: true })}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      [field]: event.target.value.toLowerCase(),
                    })
                  }
                />
                {error(field) && (
                  <p
                    id={`transfer-${field}-error`}
                    className="transfer-error"
                    role="alert"
                  >
                    {error(field)}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="field_row transfer-amount-row">
            <div className="field_col">
              <label htmlFor="transfer-quantity">Quantity</label>
              <div className="transfer-quantity-control">
                <input
                  id="transfer-quantity"
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={form.quantity}
                  required
                  aria-invalid={Boolean(error("quantity"))}
                  aria-describedby={
                    error("quantity") ? "transfer-quantity-error" : undefined
                  }
                  onBlur={() => setTouched({ ...touched, quantity: true })}
                  onChange={(event) =>
                    setForm({ ...form, quantity: event.target.value })
                  }
                />
                <button
                  type="button"
                  className="transfer-max"
                  disabled={!selectedBalance || loading}
                  aria-label="Use maximum balance"
                  onClick={() =>
                    setForm({
                      ...form,
                      quantity: String(selectedBalance.amount),
                    })
                  }
                >
                  MAX
                </button>
              </div>
              {error("quantity") && (
                <p
                  id="transfer-quantity-error"
                  className="transfer-error"
                  role="alert"
                >
                  {error("quantity")}
                </p>
              )}
            </div>
            <div className="field_col">
              <div className="transfer-token-heading">
                <label id="transfer-token-label" htmlFor="transfer-token">
                  Token
                </label>
                <span className="transfer-balance" aria-live="polite">
                  {loading
                    ? "Loading balance..."
                    : balanceError
                      ? "Balance unavailable"
                      : selectedBalance
                        ? `Balance: ${selectedBalance.amount} ${symbol}`
                        : "Balance: unavailable"}
                </span>
              </div>
              <TokenSelect
                value={
                  form.custom
                    ? "custom"
                    : contract && symbol
                      ? `${contract}:${symbol}`
                      : ""
                }
                tokens={tokens}
                invalid={Boolean(error("token"))}
                onValueChange={(value) => {
                  const [contract = "", symbol = ""] =
                    value === "custom" ? [] : value.split(":");
                  setForm({
                    ...form,
                    custom: value === "custom",
                    contract,
                    symbol,
                  });
                }}
              />
              {error("token") && (
                <p
                  id="transfer-token-error"
                  className="transfer-error"
                  role="alert"
                >
                  {error("token")}
                </p>
              )}
            </div>
          </div>
          {form.custom && (
            <div className="field_row">
              {(["symbol", "contract"] as const).map((field) => (
                <div className="field_col" key={field}>
                  <label htmlFor={`transfer-${field}`}>
                    {field === "symbol" ? "Symbol" : "Contract"}
                  </label>
                  <input
                    id={`transfer-${field}`}
                    type="text"
                    placeholder={
                      field === "symbol" ? "e.g. WAX" : "e.g. eosio.token"
                    }
                    value={form[field]}
                    required
                    spellCheck={false}
                    aria-invalid={Boolean(error("token"))}
                    aria-describedby={
                      error("token") ? "transfer-token-error" : undefined
                    }
                    onBlur={() => setTouched({ ...touched, token: true })}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        [field]:
                          field === "symbol"
                            ? event.target.value.toUpperCase()
                            : event.target.value.toLowerCase(),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )}
          <div className="field_row1">
            <label htmlFor="transfer-memo">Memo (optional)</label>
            <textarea
              id="transfer-memo"
              placeholder="Memo"
              value={form.memo}
              onChange={(event) =>
                setForm({ ...form, memo: event.target.value })
              }
            />
          </div>
          <div className="field_row1">
            <input
              type="submit"
              value={
                quantity > 0 && symbol
                  ? `Transfer ${form.quantity} ${symbol}`
                  : "Transfer"
              }
            />
          </div>
        </form>
      </div>
    </>
  );
};

export default Transfer;
