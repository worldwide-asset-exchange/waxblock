var globals = require("node-global-storage");
const BlockchainApiManager = require("../services/blockchainApiManager");
const config = require("../config/config");
const moment = require("moment");

let currentBlockId; //Current head block from chain info
let lastBlockId = null; //last processed block id,set to null
const maxBlocks = 5; //max blocks to be processed in a loop

const processBlocks = (blocks) => {
    const io = globals.get("io");
    var blocksStatistics = [];

    blocks.forEach(function (block) {
        var blockStatistics = {
            block_num: block.block_num,
            producer: block.producer,
            timestamp: block.timestamp,
            statistics: {
                transactions_count: 0,
                transactions_actions_count: 0,
                total_cpu: 0,
                total_net: 0,
            },
        };
        var transactions = [];
        block.transactions.forEach(function (transaction) {
            transactions.push(transaction);

            blockStatistics.statistics.transactions_count++;
            blockStatistics.statistics.transactions_actions_count += transaction.trx
                    .transaction
                    ? transaction.trx.transaction.actions.length
                    : 0;

            blockStatistics.statistics.total_cpu += transaction.cpu_usage_us;
            blockStatistics.statistics.total_net += transaction.net_usage_words;
        });
        blocksStatistics.push(blockStatistics);
        io.to("transactions").emit("transactions", transactions);

        processTopDapps(transactions);
    });
};

let topDapps = [];
const processTopDapps = (transactions) => {
    const io = globals.get("io");
    transactions.forEach(function (transaction) {
        var actions =
                transaction.trx &&
                transaction.trx.transaction &&
                transaction.trx.transaction.actions
                ? transaction.trx.transaction.actions
                : [];
        actions.forEach(function (action) {

            var topDapp = topDapps.find(function (topDapp) {
                //return topDapp.account === action.account;
                if (topDapp.accounts.includes(action.account))
                    return true;

                return false;
            });

            if (!topDapp) {
                topDapp = {
                    name: action.account,
                    accounts: [action.account],
                    count: 1,
                };
                topDapps.push(topDapp);
            } else {
                topDapp.accounts = [...new Set([...topDapp.accounts, action.account])];
                topDapp.count++;
            }
        });
    });
    topDapps.sort(function (a, b) {
        return b.count - a.count;
    });
    var topDappsSliced = topDapps.slice(0, 5);

    globals.set("topDapps", topDappsSliced);
    //io.emit("topDapps", topDappsSliced);
};

let topPerSecondDapps = {};
let txsPerSecond = {};
const processBlocksPerSecond = (blocks) => {
    blocks.forEach(function (block) {
        const previousTimestamp = Object.keys(topPerSecondDapps).pop();
        const timestamp = moment(block.timestamp).format("YYYY-MM-DDTHH:mm:ss");
        // console.log(block.timestamp, timestamp)
        if (!topPerSecondDapps[timestamp]) {
            topPerSecondDapps[timestamp] = [];
        }
        if (!txsPerSecond[timestamp]) {
            txsPerSecond[timestamp] = 0;
        }
        txsPerSecond[timestamp] += block.transactions.length;


        block.transactions.forEach(function (transaction) {
            var actions =
                    transaction.trx &&
                    transaction.trx.transaction &&
                    transaction.trx.transaction.actions
                    ? transaction.trx.transaction.actions
                    : [];
            actions.forEach(function (action) {

                var topPerSecondDapp = topPerSecondDapps[timestamp].find(function (
                        topPerSecondDapp
                        ) {
                    if (topPerSecondDapp.accounts.includes(action.account))
                        return true;

                    return false;
                });

                if (!topPerSecondDapp) {
                    topPerSecondDapp = {
                        name: action.account,
                        accounts: [action.account],
                        count: 1,
                    };
                    topPerSecondDapps[timestamp].push(topPerSecondDapp);
                } else {
                    topPerSecondDapp.accounts = [
                        ...new Set([...topPerSecondDapp.accounts, action.account]),
                    ];
                    topPerSecondDapp.count++;
                }
            });
        });
        topPerSecondDapps[timestamp].sort(function (a, b) {
            return b.count - a.count;
        });
        var topPerSecondDappsSliced = topPerSecondDapps[timestamp].slice(0, 5);
        topPerSecondDapps[timestamp] = topPerSecondDappsSliced;

        //Remove Old Entries
        if (Object.keys(topPerSecondDapps).length > 60) {
            var deleteTimestamp = Object.keys(topPerSecondDapps).shift();
            delete topPerSecondDapps[deleteTimestamp];
        }

        if (previousTimestamp != timestamp) {
            //console.log(timestamp, previousTimestamp);
            globals.set("topPerSecondDapps", topPerSecondDapps);
            globals.set("txsPerSecond", txsPerSecond);
        }
    });
};

module.exports = async function () {
    const cacheData = globals.get("cacheData");
    currentBlockId = cacheData.chainInfo?.head_block_num;
    const pendingBlocks = currentBlockId - lastBlockId;
    let limitBlocks = pendingBlocks > maxBlocks ? maxBlocks : pendingBlocks;
    lastBlockId = currentBlockId - limitBlocks;
    // console.log(lastBlockId + " " + currentBlockId);

    var promises = [];
    if (lastBlockId && lastBlockId < currentBlockId) {
        for (i = 0; i < limitBlocks; i++) {
            lastBlockId++;
            var promise = BlockchainApiManager.getBlock(lastBlockId).catch((err) => console.log('last getBlock promise error', err));
            promises.push(promise);
        }
    } else {
        lastBlockId = currentBlockId;
        var promise = BlockchainApiManager.getBlock(currentBlockId).catch((err) => console.log('current getBlock promise error', err));
        promises.push(promise);
    }

    Promise.all(promises).then(function (datas) {
        datas = datas.filter(data => data !== undefined);
        processBlocks(datas);
        processBlocksPerSecond(datas);
    }).catch((err) => console.log('getBlocks promises error', err));
};
