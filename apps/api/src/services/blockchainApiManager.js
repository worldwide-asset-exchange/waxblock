const config = require("../config/config");
const FetchManager = require("./fetchManager");
const {getPool} = require("./roundRobin");

// Every chain and NFT endpoint variable may hold a provider list (see services/roundRobin.js).
// getPool() returns one shared round robin per configured value.
const providers = (value) => getPool(value);
const COUNT_TIMEOUT_MS = 30 * 1000;
const isUnknownBlock = (error) => {
    const body = error && error.data && error.data.body;
    return !!(body && body.error && (body.error.code === 3100002 || body.error.name === "unknown_block_exception"));
};


const BlockchainApiManager = {
    getInfo() {
        return new Promise(async (resolve, reject) => {
            const chaininfo = await FetchManager.get(providers(config.endpoints.state), {
                path: "/v1/chain/get_info",
            }).catch((err) => {
                return reject(err);
            });

            return resolve(chaininfo);
        });
    },
    getBlock(blockId) {
        return new Promise(async (resolve, reject) => {
            const block = await FetchManager.post(providers(config.endpoints.block), {
                path: "/v1/chain/get_block",
                data: {block_num_or_id: blockId},
                // The head block number comes from one provider and get_block may go to another
                // that is one or two blocks behind. Its "unknown block" answer is not a failure.
                tryNextOn: isUnknownBlock,
            }).catch((err) => {
                return reject(err);
            });

            return resolve(block);
        });
    },
    getTransaction(txnId) {
        return new Promise(async (resolve, reject) => {
            const transaction = await FetchManager.post(
                    providers(config.endpoints.transaction),
                    {
                        path: "/v1/history/get_transaction",
                        data: {id: txnId, block_num_hint: 0},
                    }
            ).catch((err) => {
                return reject(err);
            });

            return resolve(transaction);
        });
    },
    getAbi(account_name) {
        return new Promise(async (resolve, reject) => {
            const block = await FetchManager.post(providers(config.endpoints.state), {
                path: "/v1/chain/get_abi",
                data: {account_name: account_name},
            }).catch((err) => {
                return reject(err);
            });

            return resolve(block);
        });
    },
    getAccount(account_name) {
        return new Promise(async (resolve, reject) => {
            const block = await FetchManager.post(providers(config.endpoints.state), {
                path: "/v1/chain/get_account",
                data: {account_name: account_name},
            }).catch((err) => {
                return reject(err);
            });

            return resolve(block);
        });
    },
    getActions(params) {
        return new Promise(async (resolve, reject) => {
            const results = await FetchManager.post(providers(config.endpoints.history), {
                path: "/v1/history/get_actions",
                data: Object.assign(
                        {
                            account_name: "",
                            offset: -100,
                            pos: -1,
                        },
                        params
                        ),
            }).catch((err) => {
                return reject(err);
            });

            return resolve(results);
        });
    },
    getTableRows(params) {
        return new Promise(async (resolve, reject) => {
            const results = await FetchManager.post(providers(config.endpoints.history), {
                path: "/v1/chain/get_table_rows",
                data: Object.assign(
                        {
                            code: "",
                            scope: "",
                            table: "",
                            lower_bound: "",
                            upper_bound: "",
                            index_position: 1,
                            key_type: "i64",
                            limit: -1,
                            reverse: false,
                            json: true,
                            show_payer: false,
                        },
                        params
                        ),
            }).catch((err) => {
                return reject(err);
            });

            return resolve(results);
        });
    },
    getTableByScope(params) {
        return new Promise(async (resolve, reject) => {
            const results = await FetchManager.post(providers(config.endpoints.state), {
                path: "/v1/chain/get_table_by_scope",
                data: Object.assign(
                        {
                            code: "",
                            table: "",
                            lower_bound: "",
                            upper_bound: "",
                            limit: 5,
                        },
                        params
                        ),
            }).catch((err) => {
                return reject(err);
            });

            return resolve(results);
        });
    },
    getBalances(account_name) {
        return new Promise(async (resolve, reject) => {
            const results = await FetchManager.get(providers(config.endpoints.lightapi), {
                path: `/api/balances/${config.network}/${account_name}`,
            }).catch((err) => {
                return reject(err);
            });

            return resolve(results);
        });
    },
    getUserCount() {
        return new Promise(async (resolve, reject) => {
            const result = await FetchManager.get(providers(config.endpoints.lightapi), {
                path: `/api/usercount/${config.network}`,
            }).catch((err) => {
                return reject(err);
            });

            return resolve(result);
        });
    },
    getTokenTopHolders(account, symbol) {
        return new Promise(async (resolve, reject) => {
            const result = await FetchManager.get(providers(config.endpoints.lightapi), {
                path: `/api/topholders/${config.network}/${account}/${symbol}/500`,
            }).catch((err) => {
                return reject(err);
            });

            return resolve(result);
        });
    },
    getTokenHoldersCount(account, symbol) {
        return new Promise(async (resolve, reject) => {
            const result = await FetchManager.get(providers(config.endpoints.lightapi), {
                path: `/api/holdercount/${config.network}/${account}/${symbol}`,
            }).catch((err) => {
                return reject(err);
            });

            return resolve(result);
        });
    },
    getNfts(account_name, params) {
        return new Promise(async (resolve, reject) => {
            let nfts = {total: 0, data: []};

            const atomicassets = await BlockchainApiManager.getAtomicAssets(
                    account_name,
                    {
                        page: 1,
                        limit: 1000,
                        sort: "asset_id",
                        order: "desc",
                    }
            ).catch((err) => {
                return reject(err);
            });

            if (atomicassets && atomicassets.data) {
                nfts.total = nfts.total + atomicassets.data.length;
                nfts.data = [...nfts.data, ...atomicassets.data];
            }

            const simpleassets = await BlockchainApiManager.getSimpleAssets(
                    account_name,
                    {
                        page: 1,
                        limit: 1000,
                        sortField: "assetId",
                        sortOrder: "asc",
                    }
            ).catch((err) => {
                return reject(err);
            });

            if (simpleassets && simpleassets.results) {
                nfts.total = nfts.total + simpleassets.extra.total;
                nfts.data = [...nfts.data, ...simpleassets.results];
            }

            return resolve(nfts);
        });
    },
    getSimpleAssets(account_name, params) {
        const queryParams = Object.assign(
                {
                    page: 1,
                    limit: 1000,
                    sortField: "assetId",
                    sortOrder: "asc",
                },
                params
                );

        return new Promise(async (resolve, reject) => {
            const results = await FetchManager.get(
                    providers(config.endpoints.nfts.simpleassets),
                    {
                        path: `/v1/user/${account_name}/assets?page=1&limit=1000&sortField=assetId&sortOrder=asc`,
                    }
            ).catch((err) => {
                return reject(err);
            });

            return resolve(results);
        });
    },
    getAtomicAssets(account_name, params) {
        const queryParams = Object.assign(
                {
                    owner: account_name,
                    page: 1,
                    limit: 1000,
                    sort: "asset_id",
                    order: "desc",
                },
                params
                );

        return new Promise(async (resolve, reject) => {
            const results = await FetchManager.get(
                    providers(config.endpoints.nfts.atomicassets),
                    {
                        path: `/atomicassets/v1/assets?owner=${account_name}&page=1&limit=1000&order=desc&sort=asset_id`,
                    }
            ).catch((err) => {
                return reject(err);
            });

            return resolve(results);
        });
    },
    getNft(assetType, assetId) {
        return new Promise(async (resolve, reject) => {
            let nft;
            switch (assetType) {
                case "atomicassets":
                    const atomicasset = await BlockchainApiManager.getAtomicAsset(
                            assetId
                            ).catch((err) => {
                        return reject(err);
                    });
                    nft = atomicasset.data;
                    break;
                case "simpleassets":
                    const simpleasset = await BlockchainApiManager.getSimpleAsset(
                            assetId
                            ).catch((err) => {
                        return reject(err);
                    });
                    nft = simpleasset;
                    break;
                default:
                    nft = null;
                    break;
            }

            return resolve(nft);
        });
    },
    getSimpleAsset(assetId) {
        return new Promise(async (resolve, reject) => {
            const results = await FetchManager.get(
                    providers(config.endpoints.nfts.simpleassets),
                    {
                        path: `/v1/assets/${assetId}`,
                    }
            ).catch((err) => {
                return reject(err);
            });

            return resolve(results);
        });
    },
    getAtomicAsset(assetId) {
        return new Promise(async (resolve, reject) => {
            const results = await FetchManager.get(
                    providers(config.endpoints.nfts.atomicassets),
                    {
                        path: `/atomicassets/v1/assets/${assetId}`,
                    }
            ).catch((err) => {
                return reject(err);
            });

            return resolve(results);
        });
    },
    getAtomicAssetsCount(params) {
        const queryParams = Object.assign(
                {
                    after: null
                },
                params
                );
        return new Promise(async (resolve, reject) => {
            const result = await FetchManager.get(providers(config.endpoints.nfts.atomicassets), {
                path: `/atomicassets/v1/assets/_count?after=${queryParams.after}`,
                // Counts are aggregate queries: a first run from an old seed timestamp took 16 s
                // on a healthy provider (2026-11-24). A short timeout would only repeat the
                // expensive query on the next provider.
                timeout: COUNT_TIMEOUT_MS,
            }).catch((err) => {
                return reject(err);
            });

            return resolve(result);
        });
    },
    getAtomicAssetsTransfersCount(params) {
        const queryParams = Object.assign(
                {
                    after: null
                },
                params
                );
        return new Promise(async (resolve, reject) => {
            const result = await FetchManager.get(providers(config.endpoints.nfts.atomicassets), {
                path: `/atomicassets/v1/transfers/_count?after=${queryParams.after}`,
                // Counts are aggregate queries: a first run from an old seed timestamp took 16 s
                // on a healthy provider (2026-11-24). A short timeout would only repeat the
                // expensive query on the next provider.
                timeout: COUNT_TIMEOUT_MS,
            }).catch((err) => {
                return reject(err);
            });

            return resolve(result);
        });
    }
};

module.exports = BlockchainApiManager

