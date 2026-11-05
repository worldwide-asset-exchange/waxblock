import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactElement, ReactNode } from "react";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
};

const Tooltip = ({ content, children }: TooltipProps) => (
  <BaseTooltip.Provider>
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children as ReactElement} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner sideOffset={6}>
          <BaseTooltip.Popup className="wb-tooltip">
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  </BaseTooltip.Provider>
);

export default Tooltip;
