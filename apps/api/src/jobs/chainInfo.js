var globals = require("node-global-storage");
const BlockchainApiManager = require("../services/blockchainApiManager");

module.exports = async function () {
  try {
    const io = globals.get("io");
    const cacheStorage = globals.get("cacheStorage");
    const cacheData = globals.get("cacheData");

    const chainInfo = await BlockchainApiManager.getInfo().catch((err) => console.log('getInfo error', err));    
    cacheData.chainInfo = chainInfo;

    globals.set("cacheData", cacheData);
    cacheStorage.setItem("cacheData", cacheData).then(()=>console.log('chainInfo cacheData set success')).catch((err)=>console.log('chainInfo cacheData set error',err));
    io.emit("chainInfo", chainInfo);
  } catch (error) {}
};
