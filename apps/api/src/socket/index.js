const socketIO = require("socket.io");
const logger = require("../config/logger");
var globals = require("node-global-storage");
const crons = require("../crons");
const originAuth = require("../middlewares/originAuth");

let io;
const createServer = (server) => {
  io = socketIO(server, {
    path: "/socket",
    allowRequest: originAuth.allowSocketRequest,
    cors: {
      origin: "*",
    },
  });

  io.on("connection", onConnection);

  return io;
};

const onConnection = async (socket) => {
  logger.info(`Client ${socket.id} connected`);

  const clients = await io.allSockets();
  if (clients.size == 1) {   
    crons.startRealtimeCronJobs();
  }

  const cacheData = globals.get("cacheData");
  socket.emit("statistics", cacheData.statistics);

  socket.on("join", onJoinRoom(socket));
  socket.on("leave", onLeaveRoom(socket));

  socket.on("disconnect", onDisconnect(socket));
  socket.on("disconnecting", onDisconnecting(socket));
  
  socket.on("error", onError(socket));
};

const onDisconnect = (socket) => async () => {
  logger.info(`Client ${socket.id} disconnected`);

  const clients = await io.allSockets();
  if (clients.size == 0) {    
    crons.stopRealtimeCronJobs();
  }
};

const onDisconnecting = (socket) => () => {
  logger.info(`Client ${socket.id} disconnecting`);
};

const onJoinRoom = (socket) => (room) => {
  logger.info(`Client ${socket.id} join room ${room} `);
  socket.join(room);

  switch (room) {
    case "transactions":
      //socket.emit("transactions", [{ trx_id: "52345234" }]);
      break;
  }
};

const onLeaveRoom = (socket) => (room) => {
  logger.info(`Client ${socket.id} leave room ${room}`);
  socket.leave(room);
};

const onError = (socket) => (err) => {
  logger.info(`Client ${socket.id} error`, err);
};

module.exports = { createServer };
