import { Popover } from "@base-ui/react/popover";
import type { RefObject } from "react";
import config from "../../app/config";
import Icon from "../../app/components/ui/Icon";

const NetworkOptionList = () => (
  <ul className="network_list">
    <li>
      <a
        href="https://waxblock.io"
        target="_blank"
        rel="noopener noreferrer"
        className={config.network_type === "mainnet" ? "active" : ""}
      >
        <div className="network_info">
          <img src="/common/images/wax_icon.png" alt="" />
          <h4>WAX Mainnet</h4>
        </div>
        {config.network_type === "mainnet" && (
          <span className="check_icon">
            <Icon name="check" />
          </span>
        )}
      </a>
    </li>
    <li>
      <a
        href="https://testnet.waxblock.io"
        target="_blank"
        rel="noopener noreferrer"
        className={config.network_type === "testnet" ? "active" : ""}
      >
        <div className="network_info">
          <img src="/common/images/wax_icon.png" alt="" />
          <h4>WAX Testnet</h4>
        </div>
        {config.network_type === "testnet" && (
          <span className="check_icon">
            <Icon name="check" />
          </span>
        )}
      </a>
    </li>
    <li>
      <a
        href="https://local.waxblock.io"
        target="_blank"
        rel="noopener noreferrer"
        className={config.network_type === "localnet" ? "active" : ""}
      >
        <div className="network_info">
          <img src="/common/images/wax_icon.png" alt="" />
          <h4>Local Testnet</h4>
        </div>
        {config.network_type === "localnet" && (
          <span className="check_icon">
            <Icon name="check" />
          </span>
        )}
      </a>
    </li>
  </ul>
);

type NetworkSelectorProps = {
  className?: string;
  id?: string;
  portalContainer?: RefObject<HTMLDialogElement | null>;
  side?: "bottom" | "top";
};

const NetworkSelector = ({
  className = "",
  id = "network_selector",
  portalContainer,
  side = "bottom",
}: NetworkSelectorProps) => {
  const activeNetwork =
    config.network_type === "mainnet"
      ? "WAX Mainnet"
      : config.network_type === "localnet"
        ? "Local Testnet"
        : "WAX Testnet";

  const popup = (
    <Popover.Positioner
      side={side}
      sideOffset={8}
      className="network-positioner"
    >
      <Popover.Popup className="network_detail">
        <NetworkOptionList />
      </Popover.Popup>
    </Popover.Positioner>
  );

  return (
    <Popover.Root>
      <div className={`network_box ${className}`}>
        <Popover.Trigger className="network" id={id}>
          <img
            src="/common/images/wax_icon.png"
            alt=""
            className="network_icon"
          />
          {activeNetwork}
        </Popover.Trigger>
        <Popover.Portal container={portalContainer}>{popup}</Popover.Portal>
      </div>
    </Popover.Root>
  );
};

export default NetworkSelector;
