import config from "../config";
import { createRoundRobin } from "../utilities/round-robin";
import FetchManager from "./fetchManager";

// Requests go to the API providers in turn, from a random start per page load. A provider that
// fails is skipped for 30 s, and the request is retried on the next provider.
const providers = createRoundRobin(config.api.urls ?? []);

const get = (path: string) =>
  FetchManager.get(providers.order(), {
    path: `${config.api.path}${path}`,
    onEndpointFailure: providers.markFailed,
  });

const ApiManager = {
  getTokenPrice() {
    return get("/token/price");
  },
  getProducers() {
    return get("/producers");
  },
  getProxies() {
    return get("/proxies");
  },
  getTokens() {
    return get("/tokens");
  },
  getTokensStats() {
    return get("/tokens/stats");
  },
  getToken(key) {
    return get(`/tokens/${key}`);
  },
  getTokenHoldersCount(key) {
    return get(`/tokens/holdersCount/${key}`);
  },
  getTokenTopHolders(key) {
    return get(`/tokens/topHolders/${key}`);
  },
};

export default ApiManager;
