/**********************************************
 * this file is part of DView8 Common Project
 * Copyright (C)2015-2020 D-Link Corp.
 *
 * Author       : HuiMiaomiao
 * Mail         : Miaomiao.Hui@cn.dlink.com
 * Create Date  : 2017/8/16
 * Summary      :
 *
 **********************************************/

const db = require("../lib/util").db;
const common=require("../lib/util").common;
const DeviceLog = db.cwmDeviceLog;
const Device = db.cwmDeviceManaged;
const ProfileHistory = db.cwmConfigProfileHistory;
const moment = require('moment');
const async = require('async');
function getKeyName(key){
    var keypaire={channel5Ghz:'5 Ghz',channel5Ghz2:'5 Ghz2',channel24Ghz:'2.4 Ghz',power24Ghz:'2.4 Ghz',power5Ghz:'5 Ghz',power5Ghz2:'5 Ghz2'};
    return keypaire[key];
}
exports.getDevices = function (orgId, searchRule, page, callback) {
    DeviceLog.getDeviceLogsByOrgId(orgId, searchRule, page, function (err, data) {
        callback(err, data);
    })
};