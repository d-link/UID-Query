/**
 * Create by Redd Lin on 2018/11/15
 */

'use strict';
const express = require('express');
const router = express.Router();

const cwmAvtC = require("../cwmcontroller/avtManager");

router.post('/getAvt', cwmAvtC.getAvt);    // service post(base_url + '/strav/getStrav/', ...)
router.post('/activateStrav', cwmAvtC.activateStrav);
router.post('/updateRemindMe', cwmAvtC.updateRemindMe);

module.exports = router;