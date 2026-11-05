const express = require('express');

const router = express.Router();

var globals = require("node-global-storage");

router.get('/producers', async function (req, res, next) {
    try {
        const cacheData = globals.get('cacheData') || {};
        const response = {
            producers: cacheData.producers || [],
            metadata: cacheData.producer_metadata || {
                active_producer_count: 21,
                num_standby_slots: 0,
                weighted_voting_enabled: false,
                guilds_contract: "guilds.oig",
                bp_score_scaling_factor: 1000,
            },
        };
        res.send(response);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
