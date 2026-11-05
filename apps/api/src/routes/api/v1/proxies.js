const express = require('express');

const router = express.Router();

var globals = require("node-global-storage");

router.get('/proxies', async function (req, res, next) {
    try {
        const cacheData = globals.get('cacheData');
        res.send(cacheData.proxies);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
