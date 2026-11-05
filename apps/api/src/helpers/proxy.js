
const FetchManager = require("../services/fetchManager");

const getProxies = () => {
    return new Promise(async (resolve, reject) => {
        const results = await FetchManager.get("https://www.alohaeos.com", {
          path: "/vote/proxy/waxmain?output=json"
        }).catch((err) => {
          return reject(err);
        });

        const proxies = results?.proxies ?? [];
  
        return resolve(proxies);
      });
  };

const generateProxiesRank = () => {
    return new Promise(async (resolve, reject) => { 
        const proxies = await getProxies().catch((err)=>{
            reject(err);
        });

        resolve(proxies);
    });
}

module.exports = { generateProxiesRank };