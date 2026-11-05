import config from "../config";
import FetchManager from "./fetchManager";

const ApiManager = {
  getTokenPrice() {
    return FetchManager.get(config.api.url, {
      path: `${config.api.path}/token/price`,
    });
  },
  getProducers() {
    return FetchManager.get(config.api.url, {
      path: `${config.api.path}/producers`,
    });
  },
  getProxies() {
    return FetchManager.get(config.api.url, {
      path: `${config.api.path}/proxies`,
    });
  },
  getTokens() {
    return FetchManager.get(config.api.url, {
      path: `${config.api.path}/tokens`,
    });
  },
  getTokensStats() {
    return FetchManager.get(config.api.url, {
      path: `${config.api.path}/tokens/stats`,
    });
  },
  getToken(key) {
    return FetchManager.get(config.api.url, {
      path: `${config.api.path}/tokens/${key}`,
    });
  },
  getTokenHoldersCount(key) {
    return FetchManager.get(config.api.url, {
      path: `${config.api.path}/tokens/holdersCount/${key}`,
    });
  },
  getTokenTopHolders(key) {
    return FetchManager.get(config.api.url, {
      path: `${config.api.path}/tokens/topHolders/${key}`,
    });
  },
};

export default ApiManager;
