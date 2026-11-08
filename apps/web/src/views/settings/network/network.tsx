import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Select } from "@base-ui/react/select";
import { Check, ChevronsUpDown } from "lucide-react";
import "./network.css";
import config from "../../../app/config";
import { WalletContext } from "../../../app/contexts/wallet-context";
import {
  checkEndpointHealth,
  ensureHealthyEndpoint,
  type EndpointHealth,
} from "../../../app/services/endpointHealth";
import {
  ENDPOINT_CHANGE_EVENT,
  endpointSettings,
  getEndpointLists,
  loadIndex,
  resolveNetworkEndpoints,
  selectEndpoint,
  type EndpointSetting,
} from "../../../app/utilities/network-endpoints";

const EndpointLabel = ({
  endpoint,
  health,
}: {
  endpoint: string;
  health?: EndpointHealth;
}) => (
  <span className="endpoint-summary">
    <span className="endpoint-identity">
      <span className="endpoint-name" title={endpoint}>
        {endpoint.replace(/^https?:\/\//, "").replace(/\/+$/, "")}
      </span>
      <span className="endpoint-details">
        {health?.dataSince !== undefined
          ? `Data since ~${new Date(health.dataSince).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`
          : endpoint}
      </span>
    </span>
    <span
      className={
        health?.ping === null
          ? "endpoint-metrics endpoint-unavailable"
          : "endpoint-metrics"
      }
    >
      <span>
        {!health
          ? "Checking..."
          : health.ping === null
            ? "Unavailable"
            : `${health.ping} ms`}
      </span>
      {health?.coverage && (
        <span
          className={
            health.coverage === "partial"
              ? "endpoint-partial"
              : "endpoint-details"
          }
        >
          {health.coverage === "full"
            ? "Full history"
            : health.coverage === "partial"
              ? "Partial history"
              : "Unknown coverage"}
        </span>
      )}
    </span>
  </span>
);

const EndpointSelector = ({
  setting,
  endpoints,
}: {
  setting: EndpointSetting;
  endpoints: string[];
}) => {
  const wallet = useContext(WalletContext);
  const [index, setIndex] = useState(() =>
    loadIndex(setting.storageKey, endpoints),
  );
  const [health, setHealth] = useState<Record<string, EndpointHealth>>({});
  const checkController = useRef<AbortController | null>(null);
  const checkEndpoints = useCallback(
    async (signal?: AbortSignal) => {
      await Promise.all(
        endpoints.map(async (endpoint) => {
          const result = await checkEndpointHealth(setting.key, endpoint);
          if (!signal?.aborted)
            setHealth((previous) => ({ ...previous, [endpoint]: result }));
        }),
      );
      if (!signal?.aborted) await ensureHealthyEndpoint(setting.key, signal);
    },
    [endpoints, setting],
  );

  useEffect(() => {
    const sync = () => setIndex(loadIndex(setting.storageKey, endpoints));
    window.addEventListener(ENDPOINT_CHANGE_EVENT, sync);
    const controller = new AbortController();
    checkController.current = controller;
    void checkEndpoints(controller.signal).catch(() => {});
    return () => {
      controller.abort();
      window.removeEventListener(ENDPOINT_CHANGE_EVENT, sync);
    };
  }, [checkEndpoints, endpoints, setting.storageKey]);

  return (
    <div className="field_row">
      <div className="field_col">
        <label
          id={`${setting.key}-label`}
          htmlFor={`${setting.key.toLowerCase()}-endpoint`}
        >
          {setting.label}
        </label>
      </div>
      <div className="field_col">
        <Select.Root
          value={endpoints.length ? index : null}
          modal={false}
          disabled={!endpoints.length}
          onOpenChange={(open) => {
            if (open)
              void checkEndpoints(checkController.current?.signal).catch(
                () => {},
              );
          }}
          onValueChange={(selected) => {
            if (selected === null) return;
            selectEndpoint(setting.key, endpoints[selected]);
            wallet?.setNetworkEndpoints(resolveNetworkEndpoints());
          }}
        >
          <Select.Trigger
            id={`${setting.key.toLowerCase()}-endpoint`}
            className="endpoint-trigger"
            aria-labelledby={`${setting.key}-label`}
            aria-describedby={`${setting.key}-status`}
          >
            <Select.Value className="endpoint-value">
              {(selected: number | null) =>
                selected !== null && endpoints[selected] ? (
                  <EndpointLabel
                    endpoint={endpoints[selected]}
                    health={health[endpoints[selected]]}
                  />
                ) : (
                  "No endpoints configured"
                )
              }
            </Select.Value>
            <Select.Icon>
              <ChevronsUpDown size={16} aria-hidden="true" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner
              sideOffset={6}
              alignItemWithTrigger={false}
              className="endpoint-positioner"
            >
              <Select.Popup className="endpoint-popup">
                <Select.List>
                  {endpoints.map((endpoint, i) => (
                    <Select.Item
                      key={endpoint}
                      value={i}
                      label={endpoint}
                      className="endpoint-option"
                    >
                      <Select.ItemText className="endpoint-value">
                        <EndpointLabel
                          endpoint={endpoint}
                          health={health[endpoint]}
                        />
                      </Select.ItemText>
                      <Select.ItemIndicator className="endpoint-check">
                        <Check size={16} aria-hidden="true" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <p
          role="status"
          id={`${setting.key}-status`}
          className="endpoint-status"
        >
          {endpoints.length > 0 &&
          endpoints.every((endpoint) => health[endpoint]?.ping === null)
            ? "No healthy endpoints available."
            : health[endpoints[index]]?.ping === null
              ? "Finding a healthy endpoint..."
              : ""}
        </p>
      </div>
    </div>
  );
};

const Network = () => {
  const [lists] = useState(getEndpointLists);
  if (config.network_type === "localnet")
    return (
      <div className="form_box active">
        <h2>Network settings are not available for localnet.</h2>
      </div>
    );
  return (
    <div className="form_box active">
      <h2>Network Settings</h2>
      <form>
        {endpointSettings.map((setting) => (
          <EndpointSelector
            key={setting.key}
            setting={setting}
            endpoints={lists[setting.key]}
          />
        ))}
      </form>
    </div>
  );
};

export default Network;
