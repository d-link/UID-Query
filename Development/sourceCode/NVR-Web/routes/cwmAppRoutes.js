/* **************************************************************
* Copyright (C)2010-2020 Dlink Corp.
* 
* Author      : WangHui
* Mail        : Hui.Wang@cn.dlink.com
* Create Date : 2018-05-21
* Modify Date : 
* Summary     : appRoutes
* 
*************************************************************/
'use strict';
const express = require('express');
const router = express.Router();
const cwmMobile = require('./cwmMobile');



router.post('/getSiteAndNetworks', cwmMobile.getSiteAndNetworks);
router.post('/getAGProfile', cwmMobile.getAGProfile);
router.post('/getAppBreathing',cwmMobile.getAppBreathing);
module.exports = router;
