/**
 * Created by lizhimin on 2015/12/2.
 */
'use strict';
const express = require('express');
const router = express.Router();
const user = require('./users');
const paypal = require('./paypal');
const cwmSystemCli = require('./cwmSystemCli');
const cwmFwUpgrade = require('./cwmFwUpgrade');
const { checkLicense, checkLicenseOrigin } = require('./license');
/*var jwtCheck = expressJwt({
 secret: config.jwt_secret
 });*/

router.post('/emailExist', user.emailExist);
router.post('/usernameExist', user.usernameExist);
router.post('/needCAPTCHA', user.getNeedCAPTCHA);
router.post('/checkCaptcha', user.checkcaptcha);
router.post('/checkBlockIP', user.checkBlockIP);
router.post('/login', user.login);
router.post('/appLogin', user.appLogin);
router.post('/nucliasLogin', user.nucliasLogin);
router.post('/loginNC',user.loginNC);
router.post('/appLogout', user.appLogout);
router.post('/logout', user.logout);
router.post('/changePass', user.changePass);
router.post('/forgotPass', user.forgotPass);
router.post('/resetPass', user.resetPass);
router.get('/getCaptcha',user.getCaptcha);
router.post('/paypal/getPassCode', paypal.getPassCode);
router.post('/paypal/login', paypal.getPassCode);
router.post('/getAppToken',user.appCheck);
//router.get('/success', paypal.paySuccess);
router.post('/checkLicenseOrigin', checkLicenseOrigin);
router.post('/checkLicense', checkLicense);
router.post('/getSystemInfo', cwmSystemCli.getSystemInfo);
router.post('/getFirmwareUpgradeStatus', cwmFwUpgrade.getFirmwareUpgradeStatus);
router.post('/getDateAndTime', cwmSystemCli.getDateAndTime);
module.exports = router;
