const schedule = require("node-schedule");
const cron = require("cron");
const logger = require("../config/logger");
const config = require("../config/config");
const BlockchainApiManager = require("../services/blockchainApiManager");
var globals = require("node-global-storage");
const moment = require("moment");
const producerHelper = require("../helpers/producer");
const proxyHelper = require("../helpers/proxy");
const tokenHelper = require("../helpers/token");

const chainInfoJob = require("../jobs/chainInfo");
const blocksJob = require("../jobs/blocks");

let cronJobs = {};
const createCronJobs = () => {
    const io = globals.get("io");
    const cacheStorage = globals.get("cacheStorage");

    const chainInfoCronJob = new cron.CronJob(
        "* * * * * *",
        chainInfoJob,
        null,
        false
    );

    const marketDataCronJob = new cron.CronJob(
        "*/5 * * * *",
        async function () {
            try {
                const marketData = await tokenHelper.getMarketData();
                const market_data = {
                    current_price: {
                        usd: marketData ? marketData.current_price.usd : 0
                    },
                    market_cap: {
                        usd: marketData ? marketData.market_cap.usd : 0
                    },
                    fully_diluted_valuation: {
                        usd: marketData ? marketData.fully_diluted_valuation.usd : 0
                    },
                    price_change_percentage_24h: marketData ? marketData.price_change_percentage_24h : 0
                };

                const cacheData = globals.get("cacheData");
                cacheData.statistics = {
                    ...cacheData.statistics,
                    token_price: market_data.current_price.usd,
                    market_data: market_data
                };

                cacheStorage.setItem("cacheData", cacheData).then(() => console.log('token_price statistics cacheData set success')).catch((err) => console.log('token_price statistics cacheData set error', err));
                io.emit("statistics", cacheData.statistics);
            } catch (error) {
            }
        },
        null,
        true
    );

    const totalAccountsCountCronJob = new cron.CronJob(
        "0 0 * * *",
        async function () {
            try {
                const total_accounts = await BlockchainApiManager.getUserCount();
                const cacheData = globals.get("cacheData");
                cacheData.statistics = {
                    ...cacheData.statistics,
                    total_accounts: total_accounts,
                    total_accounts_change: (total_accounts - (cacheData.statistics.total_accounts || total_accounts))
                };

                cacheStorage.setItem("cacheData", cacheData).then(() => console.log('total_accounts statistics cacheData set success')).catch((err) => console.log('total_accounts statistics cacheData set error', err));
                globals.set("cacheData", cacheData);
                io.emit("statistics", cacheData.statistics);
            } catch (error) {
            }
        },
        null,
        true
    );

    new cron.CronJob(
        "*/10 * * * * *",
        async function () {
            try {
                const global = await BlockchainApiManager.getTableRows({
                    code: "eosio",
                    scope: "eosio",
                    table: "global",
                }).catch((err) => console.log('global getTableRows error', err));
                const total_ram =
                        global && global.rows ? global.rows[0].total_ram_bytes_reserved : 0;
                const cpu_limit =
                        global && global.rows ? global.rows[0].max_transaction_cpu_usage : 0;

                const cacheData = globals.get("cacheData");
                cacheData.statistics = {
                    ...cacheData.statistics,
                    total_ram: total_ram,
                    cpu_limit: cpu_limit,
                };

                cacheStorage.setItem("cacheData", cacheData).then(() => console.log('global statistics cacheData set success')).catch((err) => console.log('global statistics cacheData set error', err));
                globals.set("cacheData", cacheData);
                io.emit("statistics", cacheData.statistics);
            } catch (error) {
            }
        },
        null,
        true
    );

    // schedule.scheduleJob("*/1 * * * *", async function () {
    //   const total_transactions = Math.random() * 10000000;
    //   const cacheData = globals.get("cacheData");
    //   cacheData.statistics = {
    //     ...cacheData.statistics,
    //     total_transactions: total_transactions,
    //   };

    //   cacheStorage.setItem("cacheData", cacheData);
    //   io.emit("statistics", cacheData.statistics);
    // });

    const producersCronJob = new cron.CronJob(
        "*/45 * * * *",
        async function () {
            try {
                const producerData = await producerHelper.generateProducersRank();
                const cacheData = globals.get("cacheData");

                // Store both the producer list and metadata
                cacheData.producers = producerData.producers;
                cacheData.producer_metadata = {
                    active_producer_count: producerData.active_producer_count,
                    num_standby_slots: producerData.num_standby_slots,
                    weighted_voting_enabled: producerData.weighted_voting_enabled,
                    guilds_contract: producerData.guilds_contract,
                    bp_score_scaling_factor: producerData.bp_score_scaling_factor,
                };

                cacheStorage.setItem("cacheData", cacheData).then(() => console.log('producers cacheData set success')).catch((err) => console.log('producers cacheData set error', err));
                globals.set("cacheData", cacheData);
                //console.log(producers)
            } catch (error) {
                console.log('producers cron error', error);
            }
        },
        null,
        true
    );

    const proxiesCronJob = new cron.CronJob(
        "*/30 * * * *",
        async function () {
            try {
                const proxies = await proxyHelper.generateProxiesRank();
                const cacheData = globals.get("cacheData");
                cacheData.proxies = proxies;

                cacheStorage.setItem("cacheData", cacheData).then(() => console.log('proxies cacheData set success')).catch((err) => console.log('proxies cacheData set error', err));
                globals.set("cacheData", cacheData);
            } catch (error) {
            }
        },
        null,
        true
    );

    //Only mainnet crons
    let tokensCronJob;
    if (config.network_type === "mainnet") {
        tokensCronJob = new cron.CronJob(
                "0 */6 * * *",
                async function () {
                    try {
                        const tokens = await tokenHelper.generateTokensRank();
                        const cacheData = globals.get("cacheData");
                        cacheData.tokens = tokens;

                        cacheStorage.setItem("cacheData", cacheData).then(() => console.log('tokens cacheData set success')).catch((err) => console.log('tokens cacheData set error', err));
                        globals.set("cacheData", cacheData);
                    } catch (error) {
                    }
                },
                null,
                true
                );
    }

    new cron.CronJob(
            "0 */1 * * *",
            async function () {
                try {
                    const atomicassetsTransfersCount = await BlockchainApiManager.getAtomicAssetsTransfersCount({
                        after: moment().subtract('24', 'h').utc().unix() * 1000
                    }).catch((err) => console.log('getAtomicAssetsTransfersCount error', err));

                    const cacheData = globals.get("cacheData");
                    cacheData.statistics = {
                        ...cacheData.statistics,
                        atomicassets: {
                            ...cacheData.statistics.atomicassets,
                            transfers_24h: atomicassetsTransfersCount ? atomicassetsTransfersCount.data : cacheData.statistics.atomicassets.transfers_24h
                        }

                    };

                    cacheStorage.setItem("cacheData", cacheData).then(() => console.log('atomicassets transfers statistics cacheData set success')).catch((err) => console.log('atomicassets transfers statistics cacheData set error', err));
                    globals.set("cacheData", cacheData);
                    io.emit("statistics", cacheData.statistics);
                } catch (error) {
                }
            },
            null,
            true
            );

    const atomicassetsCountCronJob = new cron.CronJob(
        "0 */2 * * *",
        async function () {
            try {
                const cacheDataTmp = globals.get("cacheData");
                const atomicassetsCount = await BlockchainApiManager.getAtomicAssetsCount({
                    after: cacheDataTmp.statistics && cacheDataTmp.statistics.atomicassets.assets_count_timestamp ? cacheDataTmp.statistics.atomicassets.assets_count_timestamp : config.data.atomicassets.assets_count_timestamp
                }).catch((err) => console.log('getAtomicAssetsCount error', err));


                const cacheData = globals.get("cacheData");
                cacheData.statistics = {
                    ...cacheData.statistics,
                    atomicassets: {
                        ...cacheData.statistics.atomicassets,
                        assets_count: atomicassetsCount ? (Number(cacheData.statistics.atomicassets.assets_count || config.data.atomicassets.assets_count) + Number(atomicassetsCount.data)) : cacheData.statistics.atomicassets.assets_count,
                        assets_count_timestamp: atomicassetsCount ? atomicassetsCount.query_time : cacheData.statistics.atomicassets.assets_count_timestamp
                    }

                };

                cacheStorage.setItem("cacheData", cacheData).then(() => console.log('atomicassets statistics cacheData set success')).catch((err) => console.log('atomicassets statistics cacheData set error', err));
                globals.set("cacheData", cacheData);
                io.emit("statistics", cacheData.statistics);
            } catch (error) {
                console.log(error)
            }
        },
        null,
        true
    );

    const blocksCronJob = new cron.CronJob(
            "*/2 * * * * *",
            blocksJob,
            null,
            false
            );

    const topDappsCronJob = new cron.CronJob(
            "* * * * * *",
            function () {
                const topDapps = globals.get("topDapps") || [];
                io.emit("topDapps", topDapps);
            },
            null,
            false
            );

    const topPerSecondDappsCronJob = new cron.CronJob(
            "* * * * * *",
            function () {
                const topPerSecondDapps = globals.get("topPerSecondDapps") || {};

                const timestamp = moment()
                        .utc()
                        .subtract(15, "seconds")
                        .format("YYYY-MM-DDTHH:mm:ss");

                if (!topPerSecondDapps[timestamp]) {
                    console.log('Missing topPerSecondDapps - timestamp:', timestamp, 'processed:', Object.keys(topPerSecondDapps).pop())
                }

                console.log('topPerSecondDappsCronJob - All OK Send', (topPerSecondDapps[timestamp] || []), ' Total Length', Object.keys(topPerSecondDapps).length)
                io.emit("topPerSecondDapps", {
                    timestamp: timestamp,
                    data: topPerSecondDapps[timestamp] || [],
                });
            },
            null,
            false
            );

    const txsPerSecondCronJob = new cron.CronJob(
            "* * * * * *",
            function () {
                const txsPerSecond = globals.get("txsPerSecond") || {};

                const timestamp = moment()
                        .utc()
                        .subtract(5, "seconds")
                        .format("YYYY-MM-DDTHH:mm:ss");
                //console.log(timestamp,topPerSecondDapps[timestamp])

                if (txsPerSecond[timestamp]) {
                    io.emit("txsPerSecond", {
                        timestamp: timestamp,
                        data: txsPerSecond[timestamp],
                    });
                }
            },
            null,
            false
            );

    //Set all cronJobs
    cronJobs = {
        chainInfoCronJob: chainInfoCronJob,
        blocksCronJob: blocksCronJob,
        topDappsCronJob: topDappsCronJob,
        topPerSecondDappsCronJob: topPerSecondDappsCronJob,
        txsPerSecondCronJob: txsPerSecondCronJob,
    };

    //Run important cron jobs immediately on startup if cache is empty
    (async () => {
        try {
            const cacheData = globals.get("cacheData");

            if (cacheData.statistics.total_accounts === 0) {
                totalAccountsCountCronJob.fireOnTick();
            }

            if (cacheData.statistics.atomicassets.assets_count === 0) {
                atomicassetsCountCronJob.fireOnTick();
            }

            if (!cacheData.statistics.market_data) {
                marketDataCronJob.fireOnTick();
            }

            if (!cacheData.producers || cacheData.producers.length === 0) {
                producersCronJob.fireOnTick();
            }

            if (!cacheData.proxies || cacheData.proxies.length === 0) {
                proxiesCronJob.fireOnTick();
            }

            //Only mainnet crons
            if (config.network_type === "mainnet") {
                if (!cacheData.tokens || cacheData.tokens.length === 0) {
                    tokensCronJob.fireOnTick();
                }
            }
        } catch (error) {
        }
    })();
};

const startRealtimeCronJobs = () => {
    logger.info("Start Realtime CronJobs");
    const {
        chainInfoCronJob,
        blocksCronJob,
        topDappsCronJob,
        topPerSecondDappsCronJob,
        txsPerSecondCronJob,
    } = cronJobs;

    chainInfoCronJob.start();
    blocksCronJob.start();
    topDappsCronJob.start();
    topPerSecondDappsCronJob.start();
    txsPerSecondCronJob.start();
};

const stopRealtimeCronJobs = () => {
    logger.info("Stop Realtime CronJobs");
    const {
        chainInfoCronJob,
        blocksCronJob,
        topDappsCronJob,
        topPerSecondDappsCronJob,
        txsPerSecondCronJob,
    } = cronJobs;

    chainInfoCronJob.stop();
    blocksCronJob.stop();
    topDappsCronJob.stop();
    topPerSecondDappsCronJob.stop();
    txsPerSecondCronJob.stop();
};

module.exports = {
    createCronJobs,
    startRealtimeCronJobs,
    stopRealtimeCronJobs,
};
