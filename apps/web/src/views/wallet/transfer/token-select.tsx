import { Select } from "@base-ui/react/select";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import TokenLogo from "../../../app/components/token-logo";
import useTokenLogos from "../../../app/hooks/useTokenLogos";
import { type TokenBalance } from "../../../app/utilities/tokens";

type Props = {
  value: string;
  tokens: Pick<TokenBalance, "contract" | "currency">[];
  onValueChange: (value: string) => void;
  invalid: boolean;
};

const TokenSelect = ({ value, tokens, onValueChange, invalid }: Props) => {
  const getLogoCandidates = useTokenLogos();
  const items = tokens.map((token) => ({
    value: `${token.contract}:${token.currency}`,
    label: (
      <span className="transfer-token-identity">
        <TokenLogo
          contract={token.contract}
          symbol={token.currency}
          candidates={getLogoCandidates(token.contract, token.currency)}
          width={28}
          height={28}
        />
        <span>
          <strong>{token.currency}</strong>
          <span className="transfer-token-contract">{token.contract}</span>
        </span>
      </span>
    ),
    text: `${token.currency} ${token.contract}`,
  }));
  items.push({
    value: "custom",
    label: (
      <span className="transfer-token-identity">
        <Plus size={20} aria-hidden="true" />
        <span>Custom token</span>
      </span>
    ),
    text: "Custom token",
  });

  return (
    <Select.Root
      value={value || null}
      items={items}
      onValueChange={(value) => onValueChange(value || "")}
    >
      <Select.Trigger
        id="transfer-token"
        className="transfer-token-trigger"
        aria-labelledby="transfer-token-label"
        aria-invalid={invalid}
        aria-describedby={invalid ? "transfer-token-error" : undefined}
      >
        <Select.Value placeholder="Select a token" />
        <ChevronsUpDown size={16} aria-hidden="true" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          sideOffset={6}
          alignItemWithTrigger={false}
          className="transfer-token-positioner"
        >
          <Select.Popup className="transfer-token-popup">
            <Select.List>
              {items.map((item) => (
                <Select.Item
                  key={item.value}
                  value={item.value}
                  label={item.text}
                  className={
                    item.value === "custom"
                      ? "transfer-token-option transfer-token-custom"
                      : "transfer-token-option"
                  }
                >
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} aria-hidden="true" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
};

export default TokenSelect;
