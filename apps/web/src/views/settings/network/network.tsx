import { useContext, useState } from "react";
import config from "../../../app/config";
import { WalletContext } from "../../../app/contexts/wallet-context";
import {
  getEndpointLists,
  loadIndex,
  saveIndex,
} from "../../../app/utilities/network-endpoints";

const Network = () => {
  const wallet = useContext(WalletContext);
  const isLocalnet = config.network_type === "localnet";

  const [formData, setFormData] = useState(() => {
    if (isLocalnet) {
      return {
        rpcIndex: 0,
        lightApiIndex: 0,
        historyV2Index: 0,
        atomicIndex: 0,
        ipfsIndex: 0,
      };
    }
    const {
      rpc: rpcEndpoints,
      lightApi: lightApiEndpoints,
      historyV2: historyV2Endpoints,
      atomic: atomicEndpoints,
      ipfs: ipfsEndpoints,
    } = getEndpointLists();
    return {
      rpcIndex: loadIndex("rpc", rpcEndpoints),
      lightApiIndex: loadIndex("lightapi", lightApiEndpoints),
      historyV2Index: loadIndex("historyv2", historyV2Endpoints),
      atomicIndex: loadIndex("atomic", atomicEndpoints),
      ipfsIndex: loadIndex("ipfs", ipfsEndpoints),
    };
  });

  if (isLocalnet) {
    return (
      <div className="form_box active">
        <h2>Network settings are not available for localnet.</h2>
      </div>
    );
  }

  const {
    rpc: rpcEndpoints,
    lightApi: lightApiEndpoints,
    historyV2: historyV2Endpoints,
    atomic: atomicEndpoints,
    ipfs: ipfsEndpoints,
  } = getEndpointLists();

  const handleChange =
    (
      storageKey: string,
      endpoints: string[],
      indexKey: keyof typeof formData,
      endpointKey:
        | "rpcEndpoint"
        | "lightApiEndpoint"
        | "historyV2Endpoint"
        | "atomicEndpoint"
        | "ipfsEndpoint",
    ) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const idx = parseInt(e.target.value, 10);
      saveIndex(storageKey, idx);
      setFormData((prev) => ({ ...prev, [indexKey]: idx }));
      wallet?.setNetworkEndpoints({
        ...wallet.networkEndpoints,
        [endpointKey]: endpoints[idx],
      });
    };

  return (
    <div className="form_box active">
      <h2>Network Settings</h2>
      <form>
        <div className="field_row">
          <div className="field_col">
            <label>RPC Endpoint</label>
          </div>
          <div className="field_col">
            <select
              value={formData.rpcIndex}
              onChange={handleChange(
                "rpc",
                rpcEndpoints,
                "rpcIndex",
                "rpcEndpoint",
              )}
            >
              {rpcEndpoints.map((ep, i) => (
                <option key={ep} value={i}>
                  {ep}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field_row">
          <div className="field_col">
            <label>Light API Endpoint</label>
          </div>
          <div className="field_col">
            <select
              value={formData.lightApiIndex}
              onChange={handleChange(
                "lightapi",
                lightApiEndpoints,
                "lightApiIndex",
                "lightApiEndpoint",
              )}
            >
              {lightApiEndpoints.map((ep, i) => (
                <option key={ep} value={i}>
                  {ep}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field_row">
          <div className="field_col">
            <label>History Endpoint</label>
          </div>
          <div className="field_col">
            <select
              value={formData.historyV2Index}
              onChange={handleChange(
                "historyv2",
                historyV2Endpoints,
                "historyV2Index",
                "historyV2Endpoint",
              )}
            >
              {historyV2Endpoints.map((ep, i) => (
                <option key={ep} value={i}>
                  {ep}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field_row">
          <div className="field_col">
            <label>Atomic Endpoint</label>
          </div>
          <div className="field_col">
            <select
              value={formData.atomicIndex}
              onChange={handleChange(
                "atomic",
                atomicEndpoints,
                "atomicIndex",
                "atomicEndpoint",
              )}
            >
              {atomicEndpoints.map((ep, i) => (
                <option key={ep} value={i}>
                  {ep}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field_row">
          <div className="field_col">
            <label htmlFor="ipfs-endpoint">IPFS Endpoint</label>
          </div>
          <div className="field_col">
            <select
              id="ipfs-endpoint"
              value={formData.ipfsIndex}
              onChange={handleChange(
                "ipfs",
                ipfsEndpoints,
                "ipfsIndex",
                "ipfsEndpoint",
              )}
            >
              {ipfsEndpoints.map((ep, i) => (
                <option key={ep} value={i}>
                  {ep}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Network;
