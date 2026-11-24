var globals = require("node-global-storage");
const BlockchainApiManager = require("../services/blockchainApiManager");

module.exports = async function () {
  try {
    const io = globals.get("io");
    const cacheStorage = globals.get("cacheStorage");
    const cacheData = globals.get("cacheData");

    let chainInfo = await BlockchainApiManager.getInfo().catch((err) => console.log('getInfo error', err));
    // get_info goes to a different provider each second (services/roundRobin.js), and providers
    // differ by a few blocks. Never let the head move backwards: the block feed would re-read
    // blocks it already processed.
    const previous = cacheData.chainInfo;
    if (chainInfo && previous && Number(chainInfo.head_block_num) < Number(previous.head_block_num)) {
      chainInfo = previous;
    }
    cacheData.chainInfo = chainInfo;

    globals.set("cacheData", cacheData);
    cacheStorage.setItem("cacheData", cacheData).then(()=>console.log('chainInfo cacheData set success')).catch((err)=>console.log('chainInfo cacheData set error',err));
    io.emit("chainInfo", chainInfo);
  } catch (error) {}
};
