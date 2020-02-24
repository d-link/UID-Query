/**
 * Created by lizhimin on 2019/4/12.
 */
'use strict';
const express = require('express');
const router = express.Router();
const cwmNucliasC = require("../cwmcontroller/nucliasManager");
router.post('/ncLaunch', cwmNucliasC.ncLaunch);
router.get('/ncCheck',cwmNucliasC.ncCheck);
module.exports = router;