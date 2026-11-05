import { Switch as BaseSwitch } from "@base-ui/react/switch";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  "aria-label"?: string;
};

const Switch = ({
  checked,
  onCheckedChange,
  className,
  "aria-label": ariaLabel,
}: SwitchProps) => (
  <BaseSwitch.Root
    checked={checked}
    onCheckedChange={onCheckedChange}
    className={`wb-switch ${className || ""}`}
    aria-label={ariaLabel}
  >
    <BaseSwitch.Thumb className="wb-switch-thumb" />
  </BaseSwitch.Root>
);

export default Switch;
