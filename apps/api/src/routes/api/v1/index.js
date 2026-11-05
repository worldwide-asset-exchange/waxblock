const express = require('express');

const router = express.Router();

router.use(require('./producers'));
router.use(require('./proxies'));
router.use(require('./tokens'));
router.use(require('./test'));
router.use(require('./health'));


module.exports = router;
