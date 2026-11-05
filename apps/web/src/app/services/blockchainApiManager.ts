import config from "../config";
import FetchManager from "./fetchManager";
import {
  buildV2ActionsQuery,
  normalizeLightApiKeyAccounts,
  normalizeV2Transaction,
} from "./historyAdapters";

const BlockchainApiManager = {
  getInfo() {
    return FetchManager.get({ [config.endpoints.default]: 100 }, {
      path: "/v1/chain/get_info",
    });
  },
  async getBlock(blockId) {
    if (!blockId) {
      throw new Error("Block ID is required");
    }
    return FetchManager.post({ [config.endpoints.default]: 100 }, {
      path: "/v1/chain/get_block",
      data: { block_num_or_id: blockId },
    });
  },
  async getTransaction(txnId) {
    if (!txnId) {
      throw new Error("Transaction ID is required");
    }
    const transaction = await FetchManager.get(
      { ...config.endpoints.historyV2 },
      {
        path: `/v2/history/get_transaction?id=${encodeURIComponent(txnId)}`,
      },
    );

    const normalizedTransaction = normalizeV2Transaction(transaction);

    if (!normalizedTransaction) {
      throw new Error("Transaction not found");
    }

    return normalizedTransaction;
  },
  getAbi(account_name) {
    return FetchManager.post({ [config.endpoints.default]: 100 }, {
      path: "/v1/chain/get_abi",
      data: { account_name: account_name },
    });
  },
  getAccount(account_name) {
    return FetchManager.post({ [config.endpoints.default]: 100 }, {
      path: "/v1/chain/get_account",
      data: { account_name: account_name },
    });
  },
  getTableRows(params) {
    return FetchManager.post({ [config.endpoints.default]: 100 }, {
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
        params,
      ),
    });
  },
  getTableByScope(params) {
    return FetchManager.post({ [config.endpoints.default]: 100 }, {
      path: "/v1/chain/get_table_by_scope",
      data: Object.assign(
        {
          code: "",
          table: "",
          lower_bound: "",
          upper_bound: "",
          limit: 5,
        },
        params,
      ),
    });
  },
  async getNameBids() {
    let more;
    let lower_bound = "";
    const results = { rows: [] };
    do {
      const response = await BlockchainApiManager.getTableRows({
        code: "eosio",
        scope: "eosio",
        table: "namebids",
        limit: -1,
        lower_bound: lower_bound,
      });

      results.rows.push(...response.rows);

      more = Boolean(response?.more);
      lower_bound = response?.next_key ?? "";
    } while (more);

    return results;
  },
  async getKeyAccounts(key) {
    if (!key) {
      throw new Error("Key is required");
    }
    const keyAccounts = await FetchManager.get(config.endpoints.lightapi, {
      path: `/api/key/${encodeURIComponent(key)}`,
    });

    return normalizeLightApiKeyAccounts(keyAccounts, config.network);
  },
  getBalances(account_name) {
    return FetchManager.get(config.endpoints.lightapi, {
      path: `/api/balances/${config.network}/${account_name}`,
    });
  },
  getCurrencyStats(params) {
    return FetchManager.post({ [config.endpoints.default]: 100 }, {
      path: "/v1/chain/get_currency_stats",
      data: Object.assign(
        {
          code: "",
          symbol: "",
          json: true,
        },
        params,
      ),
    });
  },
  getCurrencyBalance(params) {
    return FetchManager.post({ [config.endpoints.default]: 100 }, {
      path: "/v1/chain/get_currency_balance",
      data: Object.assign(
        {
          account: "",
          code: "",
          symbol: "",
        },
        params,
      ),
    });
  },
  getActivatedProtocolFeatures(params?: Record<string, unknown>) {
    return FetchManager.post({ [config.endpoints.default]: 100 }, {
      path: "/v1/chain/get_activated_protocol_features",
      data: Object.assign(
        {
          limit: 50,
          reverse: false,
          search_by_block_num: false,
        },
        params,
      ),
    });
  },
  getAccInfo(account_name) {
    return FetchManager.get(config.endpoints.lightapi, {
      path: `/api/accinfo/${config.network}/${account_name}`,
    });
  },
  getTopStakeHolders() {
    return FetchManager.get(config.endpoints.lightapi, {
      path: `/api/topstake/${config.network}/500`,
    });
  },
  getTopHolders() {
    return FetchManager.get(config.endpoints.lightapi, {
      path: `/api/topholders/${config.network}/eosio.token/${config.token_symbol}/500`,
    });
  },
  getTopRamHolders() {
    return FetchManager.get(config.endpoints.lightapi, {
      path: `/api/topram/${config.network}/500`,
    });
  },
  async getNfts(account_name, options: { signal?: AbortSignal } = {}) {
    const { signal } = options;

    const throwIfAborted = () => {
      if (signal?.aborted) {
        throw signal.reason ?? new DOMException("Aborted", "AbortError");
      }
    };

    const nfts = { total: 0, data: [] };
    let moreAtomicassets;
    const paramsAtomicassets = {
      page: 1,
      limit: 1000,
      sort: "asset_id",
      order: "desc",
    };
    do {
      throwIfAborted();

      const atomicassets = await BlockchainApiManager.getAtomicAssets(
        account_name,
        paramsAtomicassets,
        signal,
      );

      if (atomicassets && atomicassets.data) {
        nfts.total = nfts.total + atomicassets.data.length;
        nfts.data = [...nfts.data, ...atomicassets.data];
      }

      throwIfAborted();

      moreAtomicassets =
        atomicassets &&
        atomicassets.data &&
        atomicassets.data.length &&
        atomicassets.data.length === paramsAtomicassets.limit
          ? 1
          : 0;

      if (moreAtomicassets) paramsAtomicassets.page++;
    } while (moreAtomicassets === 1 && !signal?.aborted);

    throwIfAborted();

    if (config.endpoints.nfts.simpleassets) {
      const simpleassets = await BlockchainApiManager.getSimpleAssets(
        account_name,
        {
          page: 1,
          limit: 1000,
          sortField: "assetId",
          sortOrder: "asc",
        },
        signal,
      );

      if (simpleassets && simpleassets.results) {
        nfts.total = nfts.total + simpleassets.extra.total;
        nfts.data = [...nfts.data, ...simpleassets.results];
      }
    }

    return nfts;
  },
  getSimpleAssets(account_name, params, signal?: AbortSignal) {
    const queryParams = Object.assign(
      {
        page: 1,
        limit: 1000,
        sortField: "assetId",
        sortOrder: "asc",
      },
      params,
    );

    return FetchManager.get(config.endpoints.nfts.simpleassets, {
      path: `/v1/user/${account_name}/assets?page=${queryParams.page}&limit=${queryParams.limit}&sortField=${queryParams.sortField}&sortOrder=${queryParams.sortOrder}`,
      signal,
    });
  },
  getAtomicAssets(account_name, params, signal?: AbortSignal) {
    const queryParams = Object.assign(
      {
        owner: account_name,
        page: 1,
        limit: 1000,
        sort: "asset_id",
        order: "desc",
      },
      params,
    );

    return FetchManager.get(config.endpoints.nfts.atomicassets, {
      path: `/atomicassets/v1/assets?owner=${account_name}&page=${queryParams.page}&limit=${queryParams.limit}&order=${queryParams.order}&sort=${queryParams.sort}`,
      signal,
    });
  },
  async getNft(assetType, assetId) {
    if (!assetType || !assetId) {
      throw new Error("Require asset ID");
    }
    let nft;
    switch (assetType) {
      case "atomicassets": {
        const atomicasset = await BlockchainApiManager.getAtomicAsset(assetId);
        nft = atomicasset.data;
        break;
      }
      case "simpleassets": {
        const simpleasset = await BlockchainApiManager.getSimpleAsset(assetId);
        nft = simpleasset;
        break;
      }
      default:
        nft = null;
        break;
    }

    return nft;
  },
  getSimpleAsset(assetId) {
    return FetchManager.get(config.endpoints.nfts.simpleassets, {
      path: `/v1/assets/${assetId}`,
    });
  },
  getAtomicAsset(assetId) {
    return FetchManager.get(config.endpoints.nfts.atomicassets, {
      path: `/atomicassets/v1/assets/${assetId}`,
    });
  },
  /////////////////////V2 Calls Start//////////////////
  getV2Actions(account_name, params) {
    const queryString = buildV2ActionsQuery(account_name, params);

    return FetchManager.get(config.endpoints.historyV2, {
      path: `/v2/history/get_actions?${queryString}`,
    });
  },
  getV2Creator(account_name) {
    return FetchManager.get(config.endpoints.historyV2, {
      path: `/v2/history/get_creator?account=${account_name}`,
    });
  },
  getV2Tokens(account_name) {
    return FetchManager.get(config.endpoints.historyV2, {
      path: `/v2/state/get_tokens?account=${account_name}`,
    });
  },
  /////////////////////V2 Calls End//////////////////
};

export default BlockchainApiManager;
