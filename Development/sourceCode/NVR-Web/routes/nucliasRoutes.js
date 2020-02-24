/**
 * Create by Redd Lin on 2019/02/11
 */

'use strict';
const express = require('express');
const router = express.Router();

const cwmNucliasC = require("../cwmcontroller/nucliasManager");

router.get('/getPublicKey', cwmNucliasC.getNucliasPublicKey);    // service post(base_url + '/nuclias/getPublicKey/', ...)
router.post('/nucliasLogin', cwmNucliasC.nucliasLogin);
router.post('/nucliasQuest', cwmNucliasC.nucliasQuest);

router.post('/getSSOInfo', cwmNucliasC.getSSOInfo);
router.post('/enableSSO', cwmNucliasC.enableSSO);
router.post('/disableSSO', cwmNucliasC.disableSSO);
/*router.post('/statistic', cwmNucliasC.statistic);*/
router.get('/getConnectSSO', cwmNucliasC.getConnectSSO);
router.post('/refreshAccessToken', cwmNucliasC.refreshAccessToken);


module.exports = router;