const express = require('express');
var globals = require("node-global-storage");

const router = express.Router();

router.get('/test', async function (req, res) {
    res.send({status:'ok'});
});

router.get('/cache', async function (req, res) {
    const cacheData = globals.get("cacheData");
    res.send(cacheData);
});

module.exports = router;
