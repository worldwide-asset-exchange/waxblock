var Chance = require('chance');
const fetch = require('node-fetch');


class CustomError extends Error {
    constructor(data = null, ...args) {
        super(...args);
        this.data = data;
    }
}

const getTimeoutPromise = (ms, promise, contentObj = { type: "Timeout" }) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(new CustomError(null, "Timeout"));
        }, ms);
        promise.then(resolve, reject);
    });
};

const FetchManager = {
    get(endpoint, params = {}) {
        return this.fetch(endpoint, {
            method: "GET",
            headers: {
                ...params.headers,
            },
            ...params,
        });
    },
    post(endpoint, params = {}) {
        return this.fetch(endpoint, {
            method: "POST",
            body: JSON.stringify(params.data),
            headers: {
                "Content-Type": "application/json",
                ...params.headers,
            },
            ...params,
        });
    },
    fetch(endpoint, params) {
        if (!params.path)
            params.path = "";
        if (!params.params)
            params.params = {};
        if (!params.timeout)
            params.timeout = 10000;


        let url = `${endpoint}${params.path}`;

        if (Object.keys(params.params).length) {
            url +=
                    "?" +
                    new URLSearchParams({
                        ...params.params,
                    });
        }

        return getTimeoutPromise(params.timeout, fetch(url, params))
                .then((res) => {
                    const {status} = res;

                    switch (status) {
                        case 200:
                        {
                            return res.json();
                            break;
                        }
                        case 500:
                        {
                            throw new CustomError({res, status}, "Server");
                            break;
                        }
                        case 403:
                        {
                            throw new CustomError({res, status}, "Forbidden");
                            break;
                        }
                        case 404:
                        {
                            throw new CustomError({res, status}, "MethodNotFound");
                            break;
                        }
                        case 400:
                        {
                            throw new CustomError({res, status}, "BadRequest");
                            break;
                        }
                        case 408:
                        case 504:
                        {
                            throw new CustomError({res, status}, "Timeout");
                            break;
                        }
                        case 429:
                        {
                            throw new CustomError({res, status}, "TooManyRequests");
                            break;
                        }
                        case 503:
                        {
                            throw new CustomError({res, status}, "ServiceUnavailable");
                            break;
                        }
                        default:
                        {
                            console.log(status)
                            throw new CustomError({res, status}, "Unknown");
                        }
                    }
                })
                .then((resJSON) => {
                    return resJSON;
                })
                .catch((error) => {
                    const {data, message} = error;

                    //Handle final Error messages
                    if (message === "Timeout") {
                        throw error;
                    } else if (message === "Server") {
                        // thrown in getTimeoutPromise()'s first .then(..)
                        return data.res.json().then((errorJSON) => {
                            const {response} = errorJSON;
                            const {errorFull} = response || {errorFull: {}};
                            const {file, line, message} = errorFull;
                            // throw new CustomError ({...data, file, line, message}, "Server")
                            throw new CustomError(
                                    Object.assign({}, data, {file, line, message}),
                                    "Server"
                                    );
                        });
                    } else if (!data) {
                        throw new CustomError({}, "NetworkRequestFailed");
                    } else {
                        throw error;
                    }

                });
    },
};

module.exports = FetchManager

