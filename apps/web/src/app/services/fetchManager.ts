import config from "../config";
import {
  getEndpointLists,
  resolveNetworkEndpoints,
  selectEndpoint,
  type EndpointKind,
} from "../utilities/network-endpoints";
import { findHealthyEndpoint, markEndpointFailed } from "./endpointHealth";

class CustomError extends Error {
  constructor(
    public data: unknown,
    message: string,
  ) {
    super(message);
  }
}

type Endpoints = string | string[] | Record<string, number>;
interface FetchParams {
  path?: string;
  params?: Record<string, string>;
  timeout?: number;
  retries?: number;
  method?: string;
  data?: unknown;
  body?: BodyInit;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

const FetchManager = {
  get(endpoints: Endpoints, params: FetchParams) {
    return this.fetchRetry(endpoints, { ...params, method: "GET" });
  },
  post(endpoints: Endpoints, params: FetchParams) {
    return this.fetchRetry(endpoints, {
      ...params,
      method: "POST",
      body: JSON.stringify(params.data),
    });
  },
  async fetchRetry(endpoints: Endpoints, params: FetchParams) {
    const supplied =
      typeof endpoints === "string"
        ? [endpoints]
        : Array.isArray(endpoints)
          ? [...endpoints]
          : Object.keys(endpoints);
    if (!supplied.length || !supplied[0]) throw new Error("Invalid endpoints");
    const path = params.path || "";
    const lists = getEndpointLists();
    const kind: EndpointKind | undefined =
      config.network_type === "localnet"
        ? undefined
        : path.startsWith("/v1/chain/get_")
          ? "rpc"
          : path.startsWith("/v2/")
            ? "historyV2"
            : path.startsWith("/api/")
              ? "lightApi"
              : path.startsWith("/atomicassets/")
                ? "atomic"
                : undefined;
    const configured = new Set(kind ? lists[kind] : []);
    const managed =
      kind && supplied.every((endpoint) => configured.has(endpoint))
        ? kind
        : undefined;
    const readOnly =
      params.method === "GET" ||
      (params.method === "POST" && path.startsWith("/v1/chain/get_"));
    const selected = managed
      ? resolveNetworkEndpoints()[`${managed}Endpoint`]
      : undefined;
    let endpoint = selected || supplied[0];
    const original = endpoint;
    const attempted = new Set<string>();
    for (let attempt = 0; ; attempt++) {
      params.signal?.throwIfAborted();
      attempted.add(endpoint);
      let url = `${endpoint.replace(/\/+$/, "")}${path}`;
      if (params.params && Object.keys(params.params).length)
        url += `${url.includes("?") ? "&" : "?"}${new URLSearchParams(params.params)}`;
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        params.timeout ?? 10000,
      );
      const signal = params.signal
        ? AbortSignal.any([params.signal, controller.signal])
        : controller.signal;
      let retryable = true;
      try {
        const response = await fetch(url, {
          method: params.method,
          headers: params.headers,
          body: params.body,
          signal,
        });
        if (!response.ok) {
          retryable =
            response.status === 408 ||
            response.status === 429 ||
            response.status >= 500;
          const body = await response.json().catch(() => null);
          // Chain assertion errors describe the request, not an unhealthy node.
          if (
            managed === "rpc" &&
            body?.error &&
            typeof body.error === "object"
          )
            retryable = false;
          const message =
            response.status === 400
              ? "BadRequest"
              : response.status === 404
                ? "MethodNotFound"
                : response.status === 408 || response.status === 504
                  ? "Timeout"
                  : response.status >= 500
                    ? "Server"
                    : "Unknown";
          throw new CustomError(
            { res: response, status: response.status, ...body },
            message,
          );
        }
        const data = await response.json();
        params.signal?.throwIfAborted();
        if (managed && endpoint !== original)
          selectEndpoint(managed, endpoint, original);
        return data;
      } catch (error) {
        if (params.signal?.aborted) throw params.signal.reason;
        if (!readOnly || !retryable) throw error;
        if (managed) markEndpointFailed(managed, endpoint);
        if (attempt >= (params.retries ?? 5)) throw error;
        clearTimeout(timer);
        const next = managed
          ? await findHealthyEndpoint(
              managed,
              endpoint,
              attempted,
              params.signal,
            )
          : supplied.find((candidate) => !attempted.has(candidate));
        if (!next) throw error;
        endpoint = next;
      } finally {
        clearTimeout(timer);
      }
    }
  },
};

export default FetchManager;
