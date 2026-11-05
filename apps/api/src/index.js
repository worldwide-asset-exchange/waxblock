const app = require("./app");
const config = require("./config/config");
const logger = require("./config/logger");
const http = require("http");
const https = require("https");
const socket = require("./socket");
const crons = require("./crons");
var globals = require("node-global-storage");
var storage = require("node-persist");

let server, io;
// server = app.listen(config.port, () => {
//   logger.info(`Listening to port ${config.port}`);
// });
//var cacheData = { producers: [] };
var cacheStorage = storage.create({ dir: `${config.cache_dir}/${config.network_type}`, ttl: false, forgiveParseErrors: true });
(async () => {
  await cacheStorage.init().catch(function (error) {});
  const cacheData = await cacheStorage
    .getItem("cacheData")
    .catch((err) => console.log('cacheData get error',err));

  globals.set("cacheData", {
    ...{
      statistics: {
        token_price: 0,
        market_data: null,
        total_accounts: 0,
        total_accounts_change: 0,
        total_transactions: 0,
        daily_active_users: 0,
        total_ram: 0,
        cpu_limit: 0,
        atomicassets:{
            assets_count: 0,
            assets_count_timestamp: null,
            transfers_24h: 0
        }
      },
      producers: [],
      producer_metadata: {
        active_producer_count: 21,
        num_standby_slots: 0,
        weighted_voting_enabled: false,
        guilds_contract: "guilds.oig",
        bp_score_scaling_factor: 1000,
      },
      proxies: [],
      tokens: []
    },
    ...cacheData,
  });
  

  server = http.createServer(app);
  server.listen(config.port, function () {
    logger.info(`Express App and Socket Listening to port ${config.port}`);

    crons.createCronJobs();
  });

  io = socket.createServer(server);

  //Set Globals
  globals.set("server", server, { protected: true });
  globals.set("io", io, { protected: true });
  globals.set("cacheStorage", cacheStorage);
})();
// cacheStorage
//   .init()
//   .then(function () {
//     cacheStorage
//       .getItem("cacheData")
//       .then(function (cacheData) {
//         //...{ producers: [] },
//         globals.set("cacheData", {
//           ...{
//             statistics: {
//               token_price: 0,
//               total_accounts: 0,
//               total_transactions: 0,
//               daily_active_users: 0,
//               total_ram: 0,
//               cpu_limit: 0,
//             },
//             producers: [],
//           },
//           ...cacheData,
//         });
//         // if (data) {
//         //   cacheData = data;
//         // }
//       })
//       .catch(function (error) {})
//       .finally(function () {
//         server = http.createServer(app);
//         server.listen(config.port, function () {
//           logger.info(
//             `Express App and Socket Listening to port ${config.port}`
//           );

//           crons.createSchedule();
//         });

//         io = socket.createServer(server);

//         //Set Globals
//         globals.set("server", server, { protected: true });
//         globals.set("io", io, { protected: true });
//         globals.set("cacheStorage", cacheStorage);
//       });
//   })
//   .catch(function (error) {});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  console.log('unexpectedErrorHandler',error)
  logger.error(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});
