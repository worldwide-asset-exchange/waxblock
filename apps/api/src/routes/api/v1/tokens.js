const express = require('express');
const router = express.Router();
const BlockchainApiManager = require("../../../services/blockchainApiManager");
const config = require("../../../config/config");
var globals = require("node-global-storage");

router.get('/tokens', async function (req, res, next) {
    try {
        const cacheData = globals.get('cacheData');
        res.send(cacheData.tokens);
    } catch (err) {
        next(err);
    }
});

router.get('/tokens/stats', async function (req, res, next) {
    try {
        const cacheData = globals.get('cacheData');
        const marketData = cacheData.statistics.market_data;
        const tokens = cacheData.tokens;

        const stats = {
            token_price_usd: marketData ? marketData.current_price.usd : 0,
            market_cap_usd: marketData ? marketData.market_cap.usd : 0,
            tokens_market_cap_usd: 0,
            token_tokens_market_cap_usd: 0
        };

        stats.tokens_market_cap_usd = tokens.reduce(function (totalMarketCap, token) {
            return totalMarketCap + token.marketdata.marketcap_usd;
        }, 0);

        stats.token_tokens_market_cap_usd = stats.market_cap_usd + stats.tokens_market_cap_usd;

        res.send(stats);
    } catch (err) {
        next(err);
    }
});

router.get('/tokens/:key?', async function (req, res, next) {
    try {
        //const symbol = req.params.symbol ? req.params.symbol : null;
        //const chain = req.params.chain ? req.params.chain : null;
        //const account = req.params.account ? req.params.account : null;
        const key = req.params.key ? req.params.key : null;

        const cacheData = globals.get('cacheData');
        const tokens = cacheData.tokens;
        //const token = tokens.find((token) => token.account == account && token.symbol == symbol && token.chain == chain);
        const token = tokens.find((token) => token.key == key);

        res.send(token);
    } catch (err) {
        next(err);
    }
});

router.get('/tokens/topHolders/:key?', async function (req, res) {
    try {
        const key = req.params.key ? req.params.key : '';
        const [symbol, chain, account] = key.split('-');

        const topHolders = await BlockchainApiManager.getTokenTopHolders(account, symbol);

        res.json(topHolders);
    } catch (err) {console.log('topHolders',err)
        res.status(500).json([]);
    }
});

router.get('/tokens/holdersCount/:key?', async function (req, res) {
    try {
        const key = req.params.key ? req.params.key : '';
        const [symbol, chain, account] = key.split('-');

        const holdersCount = await BlockchainApiManager.getTokenHoldersCount(account, symbol);

        res.json(holdersCount);
    } catch (err) {
        res.status(500).json(0);
    }
});

module.exports = router;
