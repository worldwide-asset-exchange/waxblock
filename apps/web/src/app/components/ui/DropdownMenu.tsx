import { Popover } from "@base-ui/react/popover";
import type { ReactElement, ReactNode } from "react";

type DropdownMenuProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  positionerClassName?: string;
  popupClassName?: string;
};

const DropdownMenu = ({
  open,
  onOpenChange,
  trigger,
  children,
  className,
  positionerClassName,
  popupClassName,
}: DropdownMenuProps) => (
  <Popover.Root open={open} onOpenChange={onOpenChange}>
    <span className={className}>
      <Popover.Trigger render={trigger as ReactElement} />
    </span>
    <Popover.Portal>
      <Popover.Positioner sideOffset={8} className={positionerClassName}>
        <Popover.Popup className={popupClassName}>{children}</Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  </Popover.Root>
);

export default DropdownMenu;
