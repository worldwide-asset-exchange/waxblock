// @vitest-environment happy-dom
import { act, type ContextType, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { WalletContext } from "../../../app/contexts/wallet-context";
import BlockchainApiManager from "../../../app/services/blockchainApiManager";
import Tokens from "../../account/components/tokens";
import Transfer from "./transfer";

vi.mock("../../../app/contexts/wallet-context", async () => {
  const { createContext } = await import("react");
  return { WalletContext: createContext(null) };
});
vi.mock("../../../app/services/blockchainApiManager", () => ({
  default: { getBalances: vi.fn(), getCurrencyStats: vi.fn() },
}));
vi.mock("../../../app/services/apiManager", () => ({
  default: { getTokens: async () => [] },
}));
vi.mock("react-helmet-async", () => ({ Helmet: () => null }));
vi.mock("../../../app/hooks/useTokenLogos", () => ({
  default: () => () => [],
}));

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;
const renderRoot = (children: ReactNode) =>
  root.render(
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  );
const submitTransaction = vi.fn();
const wallet = {
  session: { actor: "sender" },
  refresh: null,
  submitTransaction,
} as unknown as ContextType<typeof WalletContext>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.mocked(BlockchainApiManager.getCurrencyStats).mockResolvedValue({});
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  queryClient.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("transfer precision", () => {
  test.each([
    {
      contract: "eosio.token",
      currency: "WAX",
      decimals: "8",
      amount: "424979.21997716",
      query: "&decimals=4",
    },
    {
      contract: "other.token",
      currency: "WAX",
      decimals: "6",
      amount: "12.345678",
      query: "&decimals=4",
    },
    {
      contract: "test.token",
      currency: "WHOLE",
      decimals: 0,
      amount: "12",
      query: "&decimals=4",
    },
    {
      contract: "eosio.token",
      currency: "WAX",
      decimals: 8,
      amount: "424979.21997716",
      query: "",
    },
  ])(
    "uses loaded precision for $contract/$currency with '$query'",
    async ({ query, ...balance }) => {
      vi.mocked(BlockchainApiManager.getBalances).mockResolvedValue({
        balances: [
          balance,
          {
            contract: "eosio.token",
            currency: "WAX",
            decimals: 8,
            amount: "1",
          },
        ],
      });
      await act(async () => {
        renderRoot(
          <MemoryRouter
            initialEntries={[
              `/wallet/transfer?contract=${balance.contract}&symbol=${balance.currency}${query}`,
            ]}
          >
            <WalletContext.Provider value={wallet}>
              <Transfer />
            </WalletContext.Provider>
          </MemoryRouter>,
        );
      });
      await act(async () => vi.advanceTimersByTimeAsync(400));
      await act(async () => {
        const recipient = container.querySelector<HTMLInputElement>(
          'input[placeholder="To"]',
        )!;
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        )!.set!.call(recipient, "receiver");
        recipient.dispatchEvent(new Event("input", { bubbles: true }));
        container.querySelector<HTMLElement>(".transfer-max")!.click();
      });
      await act(async () => {
        container
          .querySelector<HTMLInputElement>('input[type="submit"]')!
          .click();
      });
      expect(submitTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          actions: [
            expect.objectContaining({
              account: balance.contract,
              name: "transfer",
              data: {
                from: "sender",
                to: "receiver",
                quantity: `${balance.amount} ${balance.currency}`,
                memo: "",
              },
            }),
          ],
        }),
      );
    },
  );

  test.each(["8", "6", "0", 8, 0])(
    "includes API precision %s in the token list transfer link",
    async (decimals) => {
      await act(async () => {
        renderRoot(
          <MemoryRouter>
            <WalletContext.Provider value={wallet}>
              <Tokens
                balances={[
                  {
                    contract: "eosio.token",
                    currency: "WAX",
                    amount: "12",
                    decimals,
                  },
                ]}
                showTransferAction
              />
            </WalletContext.Provider>
          </MemoryRouter>,
        );
      });
      const link = container.querySelector<HTMLAnchorElement>(
        ".account-token-action a",
      )!;
      expect(new URL(link.href).searchParams.get("decimals")).toBe(
        String(decimals),
      );
    },
  );
});

const waxBalance = {
  contract: "eosio.token",
  currency: "WAX",
  decimals: 8,
  amount: "12.34567890",
};

const renderTransfer = async () => {
  await act(async () => {
    renderRoot(
      <MemoryRouter>
        <WalletContext.Provider value={wallet}>
          <Transfer />
        </WalletContext.Provider>
      </MemoryRouter>,
    );
  });
  await act(async () => vi.advanceTimersByTimeAsync(450));
};

const fill = async (field: string, value: string) => {
  await act(async () => {
    const input = container.querySelector<HTMLInputElement>(
      `#transfer-${field}`,
    )!;
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

const submit = async () => {
  await act(async () => {
    container.querySelector<HTMLInputElement>('input[type="submit"]')!.click();
  });
};

const selectToken = async (text: string) => {
  await act(async () => {
    container.querySelector<HTMLButtonElement>("#transfer-token")!.click();
  });
  await act(async () => {
    const option = [
      ...document.querySelectorAll<HTMLElement>('[role="option"]'),
    ].find((option) => option.textContent?.includes(text));
    expect(option).toBeDefined();
    option!.click();
  });
};

describe("transfer form", () => {
  beforeEach(() => {
    vi.mocked(BlockchainApiManager.getBalances).mockResolvedValue({
      balances: [
        waxBalance,
        {
          contract: "other.token",
          currency: "OTHER",
          decimals: 2,
          amount: "4.50",
        },
      ],
    });
  });

  test("shows required field errors, allows clearing From, and focuses the first error", async () => {
    await renderTransfer();
    await fill("from", "");
    await submit();
    expect(
      container.querySelector<HTMLInputElement>("#transfer-from")!.value,
    ).toBe("");
    expect(container.textContent).toContain("Enter the sender account.");
    expect(container.textContent).toContain("Enter the recipient account.");
    expect(container.textContent).toContain(
      "Enter a quantity greater than zero.",
    );
    expect(document.activeElement?.id).toBe("transfer-from");
    expect(submitTransaction).not.toHaveBeenCalled();
  });

  test.each(["", "0", "-1", "NaN", "Infinity", "1e-8", "0.000000001", "13"])(
    "blocks invalid quantity '%s'",
    async (quantity) => {
      await renderTransfer();
      await fill("to", "receiver");
      await fill("quantity", quantity);
      await submit();
      expect(
        container
          .querySelector("#transfer-quantity")!
          .getAttribute("aria-invalid"),
      ).toBe("true");
      expect(
        container.querySelector("#transfer-quantity-error")!.textContent,
      ).toBeTruthy();
      expect(submitTransaction).not.toHaveBeenCalled();
    },
  );

  test("updates balance and MAX when selecting a token and puts Custom token last", async () => {
    await renderTransfer();
    expect(container.querySelector(".transfer-balance")!.textContent).toBe(
      "Balance: 12.34567890 WAX",
    );
    await act(async () => {
      container.querySelector<HTMLButtonElement>("#transfer-token")!.click();
    });
    const options = document.querySelectorAll<HTMLElement>('[role="option"]');
    expect(options[options.length - 1].textContent).toContain("Custom token");
    expect(options[0].querySelector("img")).not.toBeNull();
    expect(options[0].querySelector("strong")).not.toBeNull();
    await act(async () => {
      [...options]
        .find((option) => option.textContent?.includes("OTHER"))!
        .click();
    });
    expect(container.querySelector(".transfer-balance")!.textContent).toBe(
      "Balance: 4.50 OTHER",
    );
    await act(async () => {
      container.querySelector<HTMLButtonElement>(".transfer-max")!.click();
    });
    expect(
      container.querySelector<HTMLInputElement>("#transfer-quantity")!.value,
    ).toBe("4.50");
    await fill("to", "receiver");
    await submit();
    expect(submitTransaction.mock.calls[0][0].actions[0].data.quantity).toBe(
      "4.50 OTHER",
    );
  });

  test("validates custom fields, loads precision, and returns to a listed token", async () => {
    vi.mocked(BlockchainApiManager.getCurrencyStats).mockResolvedValue({
      TEST: { supply: "1000.000000 TEST" },
    });
    await renderTransfer();
    await selectToken("Custom token");
    expect(container.querySelector("#transfer-symbol")).not.toBeNull();
    expect(
      container.querySelector<HTMLButtonElement>(".transfer-max")!.disabled,
    ).toBe(true);
    await fill("to", "receiver");
    await fill("quantity", "1.123456");
    await submit();
    expect(container.textContent).toContain(
      "Enter the token symbol and contract.",
    );
    await fill("symbol", "TEST");
    await fill("contract", "custom.token");
    await act(async () => vi.advanceTimersByTimeAsync(20));
    await submit();
    expect(submitTransaction.mock.calls[0][0].actions[0].data.quantity).toBe(
      "1.123456 TEST",
    );
    await selectToken("WAX");
    expect(container.querySelector("#transfer-symbol")).toBeNull();
    expect(container.querySelector(".transfer-balance")!.textContent).toContain(
      "12.34567890 WAX",
    );
  });

  test("shows a balance failure and keeps MAX disabled", async () => {
    vi.mocked(BlockchainApiManager.getBalances).mockRejectedValue(
      new Error("Offline"),
    );
    await renderTransfer();
    expect(container.textContent).toContain("Balance unavailable");
    expect(
      container.querySelector<HTMLButtonElement>(".transfer-max")!.disabled,
    ).toBe(true);
  });
});

describe("transfer loading safety", () => {
  test("does not reuse a previous sender's balance while the next sender loads", async () => {
    let resolveOld: (value: { balances: (typeof waxBalance)[] }) => void;
    vi.mocked(BlockchainApiManager.getBalances)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          }),
      )
      .mockResolvedValueOnce({
        balances: [{ ...waxBalance, amount: "2.00000000" }],
      });
    await renderTransfer();
    await fill("from", "newaccount");
    expect(
      container.querySelector<HTMLButtonElement>(".transfer-max")!.disabled,
    ).toBe(true);
    await act(async () => vi.advanceTimersByTimeAsync(450));
    expect(container.querySelector(".transfer-balance")!.textContent).toBe(
      "Balance: 2.00000000 WAX",
    );
    await act(async () => {
      resolveOld({ balances: [waxBalance] });
    });
    expect(container.querySelector(".transfer-balance")!.textContent).toBe(
      "Balance: 2.00000000 WAX",
    );
  });

  test("rejects a custom token whose contract lookup fails", async () => {
    vi.mocked(BlockchainApiManager.getBalances).mockResolvedValue({
      balances: [waxBalance],
    });
    vi.mocked(BlockchainApiManager.getCurrencyStats).mockRejectedValue(
      new Error("Unknown token"),
    );
    await renderTransfer();
    await selectToken("Custom token");
    await fill("to", "receiver");
    await fill("quantity", "1");
    await fill("symbol", "BAD");
    await fill("contract", "missing");
    await act(async () => vi.advanceTimersByTimeAsync(20));
    await submit();
    expect(container.textContent).toContain("Unable to verify this token.");
    expect(submitTransaction).not.toHaveBeenCalled();
  });
});
