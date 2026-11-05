import Chance from "chance";

class CustomError extends Error {
  data: unknown;
  constructor(data: unknown = null, ...args: ConstructorParameters<typeof Error>) {
    super(...args);
    this.data = data;
  }
}

const getTimeoutPromise = <T>(
  ms: number,
  promise: Promise<T>,
  signal?: AbortSignal,
) => {
  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new CustomError(null, "Timeout"));
    }, ms);

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        signal?.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        signal?.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
};

const FetchManager = {
  get(endpoints, params) {
    return this.fetchRetry(endpoints, {
      method: "GET",
      ...params,
    });
  },
  post(endpoints, params) {
    return this.fetchRetry(endpoints, {
      method: "POST",
      body: JSON.stringify(params.data),
      headers: {
        //"Content-Type": "application/json",
        ...params.headers,
      },
      ...params,
    });
  },
  fetchRetry(endpoints, params) {
    if (!params.path) params.path = "";
    if (!params.params) params.params = {};
    if (!params.timeout) params.timeout = 10000;
    if (params.retries === undefined) params.retries = 5;

    let endpoint;
    //if (params.timeout_endpoint) {
    // endpoint = params.timeout_endpoint;
    //} else
    if (typeof endpoints === "object") {
      if (Array.isArray(endpoints) && endpoints.length > 0) {
        endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      } else if (Object.keys(endpoints).length > 0) {
        endpoint = Chance().weighted(
          Object.keys(endpoints),
          Object.values(endpoints),
        );
      } else {
        return Promise.reject(new Error("Invalid endpoints"));
      }
    } else {
      endpoint = endpoints;
    }

    let url = `${endpoint}${params.path}`;

    if (Object.keys(params.params).length) {
      url +=
        "?" +
        new URLSearchParams({
          ...params.params,
        });
    }

    const fetchInit: RequestInit = {
      method: params.method,
      headers: params.headers,
      body: params.body,
      signal: params.signal,
    };

    return getTimeoutPromise(
      params.timeout,
      fetch(url, fetchInit),
      params.signal,
    )
      .then((res: Response) => {
        const { status } = res;

        switch (status) {
          case 200: {
            return res.json() as Promise<unknown>;
            break;
          }
          case 500: {
            throw new CustomError({ res, status }, "Server");
            break;
          }
          case 404: {
            throw new CustomError({ res, status }, "MethodNotFound");
            break;
          }
          case 400: {
            throw new CustomError({ res, status }, "BadRequest");
            break;
          }
          case 408:
          case 504: {
            throw new CustomError({ res, status }, "Timeout");
            break;
          }
          default: {
            throw new CustomError({ res, status }, "Unknown");
          }
        }
      })
      .then((resJSON) => {
        return resJSON;
      })
      .catch((error) => {
        if (error?.name === "AbortError") {
          throw error;
        }

        const { data, message } = error;

        //if (message !== "Timeout") {
        delete endpoints[endpoint]; //Remove endpoints from list
        //}

        if (Object.keys(endpoints).length === 0) {
          //Throw error if not endpoints to process
          throw error;
        } else if (params.retries > 0 && !params.signal?.aborted) {
          //Check if retry attempts exists
          return this.fetchRetry(
            endpoints,
            Object.assign({}, params, {
              retries: params.retries - 1,
              timeout:
                message === "Timeout" ? params.timeout + 1000 : params.timeout,
              //timeout_endpoint: message === "Timeout" ? endpoint : null
            }),
          );
        } else {
          //Handle final Error messages
          if (message === "Timeout") {
            //   if (params.retries > 0) {
            //     return this.fetch(
            //       endpoints,
            //       Object.assign({}, params, {
            //         retries: params.retries - 1,
            //         timeout: params.timeout + 1000,
            //       })
            //     );
            //   } else {
            throw error;
            //}
          } else if (message === "Server") {
            // thrown in getTimeoutPromise()'s first .then(..)
            return data.res.json().then((errorJSON) => {
              const { response } = errorJSON;
              const { errorFull } = response || { errorFull: {} };
              const { file, line, message } = errorFull;
              // throw new CustomError ({...data, file, line, message}, "Server")
              throw new CustomError(
                Object.assign({}, data, { file, line, message }),
                "Server",
              );
            });
          } else if (!data) {
            throw new CustomError({}, "NetworkRequestFailed");
          } else {
            throw error;
          }
        }
      });
  },
};

export default FetchManager;
