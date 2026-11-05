import { useContext, useCallback, useEffect, useRef, useState } from "react";
import {
  createSearchParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import type { ChainInfo } from "../../app/types/blockchain";
import config from "../../app/config";
import { WalletContext } from "../../app/contexts/wallet-context";
import BlockchainApiManager from "../../app/services/blockchainApiManager";

const LocalnetSettings = () => {
  const wallet = useContext(WalletContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [settings, setSettings] = useState({
    nodeUrl: searchParams.get("nodeUrl") || "http://localhost:8888", //"http://localhost:8888",
    hyperionUrl: searchParams.get("hyperionUrl") || "",
    symbol: searchParams.get("coreSymbol") || "WAX",
    precision: searchParams.get("corePrecision") || 8,
  });

  const startExplorer = useCallback(async () => {
    config.endpoints.default = settings.nodeUrl;
    if (settings.hyperionUrl) {
      config.endpoints.historyV2[settings.hyperionUrl] = 100;
    }

    config.token_symbol = settings.symbol;
    config.token_precision = Number(settings.precision);

    const chainInfo = (await BlockchainApiManager.getInfo()) as ChainInfo;
    if (chainInfo && chainInfo.chain_id) {
      config.chain_id = chainInfo.chain_id;
    }

    const queryParams: Record<string, string> = {
      nodeUrl: settings.nodeUrl,
      coreSymbol: settings.symbol,
      corePrecision: String(settings.precision),
      hyperionUrl: settings.hyperionUrl,
    };

    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key] === null || queryParams[key] === "") {
        delete queryParams[key];
      }
    });

    wallet?.setGlobalQueryParams(queryParams);

    navigate(
      `${location.pathname}?${createSearchParams(queryParams).toString()}`,
    );
  }, [location.pathname, navigate, settings, wallet]);

  const didAutoStartRef = useRef(false);

  useEffect(() => {
    if (!wallet || didAutoStartRef.current) return;
    if (
      !searchParams.get("nodeUrl") &&
      !searchParams.get("coreSymbol") &&
      !searchParams.get("corePrecision") &&
      !searchParams.get("hyperionUrl")
    ) {
      return;
    }

    didAutoStartRef.current = true;
    void startExplorer();
  }, [searchParams, startExplorer, wallet]);

  if (!wallet) return null;

  return (
    <>
      {/*Tabbing Sec*/}
      <div className="mid_sec">
        <div className="form_sec local_setting">
          {/*FormBox 4*/}
          <div className="form_box active">
            <div className="logo_bar">
              <a href="#" className="site_logo">
                <img
                  src="/common/images/wax-block-header-logo.png"
                  alt="Wax-block Logo"
                />
              </a>
            </div>
            <form>
              <div className="field_row1">
                <label>Nodeos URL</label>
                <input
                  type="text"
                  value={settings.nodeUrl}
                  onChange={(event) =>
                    setSettings({ ...settings, nodeUrl: event.target.value })
                  }
                />
              </div>
              <div className="field_row1">
                <label>Hyperion URL (optional History API)</label>
                <input
                  type="text"
                  placeholder="Url to Hyperion (e.g. https://wax.your-local-hyperion)"
                  value={settings.hyperionUrl}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      hyperionUrl: event.target.value,
                    })
                  }
                />
              </div>
              <div className="field_row1">
                <label>Core Symbol</label>
                <input
                  type="text"
                  value={settings.symbol}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      symbol: event.target.value,
                    })
                  }
                />
              </div>
              <div className="field_row1">
                <label>Core Precision</label>
                <input
                  type="text"
                  value={settings.precision}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      precision: event.target.value,
                    })
                  }
                />
              </div>
              <div className="field_row1 text_center">
                <input
                  type="button"
                  defaultValue="Start Explorer"
                  onClick={startExplorer}
                />
              </div>
              {config.chain_id}
            </form>
          </div>
        </div>
      </div>
      {/*Tabbing Sec*/}
    </>
  );
};

export default LocalnetSettings;
