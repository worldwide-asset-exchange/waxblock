const FetchManager = require("../services/fetchManager");
const BlockchainApiManager = require("../services/blockchainApiManager");
const fetch = require('node-fetch');
const getTokenPrice = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=WAX&vs_currencies=USD`;

            const response = await FetchManager.get(url).catch((error) => {
            });

            const price = response && response["wax"] ? response["wax"].usd : 0;

            resolve(price);
        } catch (error) {
            reject(error);
        }
    });
};

const getTokenMarketPrice = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=WAX&vs_currencies=USD&include_market_cap=true&include_24hr_change=true`;

            const response = await FetchManager.get(url).catch((error) => {
            });

            const result = response && response["wax"] ? response["wax"] : null;

            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

const getMarketData = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `https://api.coingecko.com/api/v3/coins/wax?tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;

            const response = await FetchManager.get(url).catch((error) => {
            });

            const result = response && response.market_data ? response.market_data : null;

            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
};

const generateTokensRank = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const marketData = await getMarketData();
            const token_usd_value = marketData ? marketData.current_price.usd : 0;

            const alcorMarketsResponse = await fetch('https://wax.alcor.exchange/api/markets');
            const alcorMarketsResults = await alcorMarketsResponse.json();

            const eoscafeResponse = await fetch('https://raw.githubusercontent.com/eoscafe/eos-airdrops/master/tokens.json');
            const eoscafeResults = await eoscafeResponse.json();

            var tokens = [];

            let newPair = {
                id: null,
                exchange: null,
                pair_base: null,
                pair_quote: null,
                quote: {
                    price: 0,
                    price_usd: 0,
                    volume_base_24hr: 0,
                    volume_quote_24hr: 0,
                    volume_base_24hr_usd: 0
                }
            };

            let newToken = {
                chain: null,
                account: null,
                symbol: null,
                key: null,
                metadata: {
                    name: null,
                    logo: null
                },
                supply: {
                    circulating: 0,
                    max: 0,
                    precision: 0
                },
                marketdata: {
                    price: 0,
                    price_usd: 0,
                    marketcap_usd: 0,
                    volume_24hr: 0,
                    volume_24hr_usd: 0,
                    change_24hr: 0
                },
                pairs: []
            };

            for (alcorMarketsResult of  alcorMarketsResults) {
                try {
                    if (alcorMarketsResult.base_token.str != `WAX@eosio.token`) {
                        continue;
                    }

                    let token = JSON.parse(JSON.stringify(newToken));
                    token.chain = alcorMarketsResult.chain;
                    token.account = alcorMarketsResult.quote_token.contract;
                    token.symbol = alcorMarketsResult.quote_token.symbol.name;
                    token.key = `${token.symbol}-${token.chain}-${token.account}`;
                    token.supply.precision = alcorMarketsResult.quote_token.symbol.precision;
                    token.metadata.name = alcorMarketsResult.quote_token.symbol.name;

                    const eoscafeResult = eoscafeResults.find((eoscafeResult) => eoscafeResult.account == token.account && eoscafeResult.symbol == token.symbol && eoscafeResult.chain === token.chain);
                    if (eoscafeResult) {
                        token.metadata.name = eoscafeResult.name;
                        token.metadata.logo = eoscafeResult.logo;
                    }

                    const stats = await BlockchainApiManager.getTableRows({code: token.account, scope: token.symbol, table: 'stat'}).catch((err) => {
                    });
                    token.supply.circulating = stats && stats.rows && stats.rows[0] && parseFloat(stats.rows[0].supply) || 0;
                    token.supply.max = stats && stats.rows && stats.rows[0] && parseFloat(stats.rows[0].max_supply) || 0;

                    token.marketdata.price = alcorMarketsResult.last_price;
                    token.marketdata.price_usd = token.marketdata.price * token_usd_value;
                    token.marketdata.marketcap_usd = token.supply.circulating * token.marketdata.price_usd;
                    token.marketdata.change_24hr = alcorMarketsResult.change24;
                    token.marketdata.volume_24hr = alcorMarketsResult.volume24;
                    token.marketdata.volume_24hr_usd = token.marketdata.volume_24hr * token.marketdata.price_usd;

                    let pair = JSON.parse(JSON.stringify(newPair));
                    pair.id = `${token.symbol}-${token.account}_WAX-eosio.token`;
                    pair.exchange = 'Alcor';
                    pair.pair_base = token.symbol;
                    pair.pair_quote = 'WAX';
                    pair.quote.price = alcorMarketsResult.last_price;
                    pair.quote.price_usd = pair.quote.price * token_usd_value;
                    pair.quote.volume_base_24hr = alcorMarketsResult.quote_volume;
                    pair.quote.volume_quote_24hr = alcorMarketsResult.base_volume;
                    pair.quote.volume_base_24hr_usd = pair.quote.volume_base_24hr * pair.quote.price_usd;

                    token.pairs.push(pair);
                    //console.log('alchor', token);

                    tokens.push(token);
                } catch (err) {
                    console.log(err)
                }
            }

            //Add extra tokens 
            for (eoscafeResult of  eoscafeResults) {
                try {
                    if (eoscafeResult.chain != `wax`) {
                        continue;
                    }

                    let tokenExists = tokens.find((token) => token.account == eoscafeResult.account && token.symbol == eoscafeResult.symbol && token.chain == eoscafeResult.chain);
                    if (tokenExists) {
                        continue;
                    }


                    let token = JSON.parse(JSON.stringify(newToken));
                    token.chain = eoscafeResult.chain;
                    token.account = eoscafeResult.account;
                    token.symbol = eoscafeResult.symbol;
                    token.key = `${token.symbol}-${token.chain}-${token.account}`;
                    if (token.key === 'WAX-wax-eosio.token') {
                        token.supply.precision = 8;
                    }

                    token.metadata.name = eoscafeResult.name;
                    token.metadata.logo = eoscafeResult.logo;

                    const stats = await BlockchainApiManager.getTableRows({code: token.account, scope: token.symbol, table: 'stat'}).catch((err) => {
                    });
                    token.supply.circulating = stats && stats.rows && stats.rows[0] && parseFloat(stats.rows[0].supply) || 0;
                    token.supply.max = stats && stats.rows && stats.rows[0] && parseFloat(stats.rows[0].max_supply) || 0;

                    if (token.symbol === 'WAX') {
                        token.marketdata.price = 0;
                        token.marketdata.price_usd = marketData ? marketData.current_price.usd : 0;
                        token.marketdata.marketcap_usd = marketData ? marketData.market_cap.usd : 0;
                        token.marketdata.change_24hr = marketData ? marketData.price_change_percentage_24h : 0;
                        token.marketdata.volume_24hr = 0;
                        token.marketdata.volume_24hr_usd = 0;

                    }
                    //console.log('eoscafe', token)
                    tokens.push(token);
                } catch (err) {
                    console.log(err)
                }
            }

            // Sorting logic to prioritize tokens with logos and higher market cap
            tokens = tokens.sort((a, b) => {
                // First, prioritize tokens that have a logo
                if (a.metadata.logo && !b.metadata.logo) return -1;
                if (!a.metadata.logo && b.metadata.logo) return 1;
                
                // If both have logos or both don't have logos, sort by marketcap_usd
                return a.marketdata.marketcap_usd < b.marketdata.marketcap_usd ? 1 : -1;
            });

            tokens.map((token, index) => {
                token.rank = index + 1;
                return token;
            })

            resolve(tokens);
        } catch (err) {
            console.log(err)
            reject(err);
        }
    });
}

module.exports = {getTokenPrice, getTokenMarketPrice, getMarketData, generateTokensRank};
