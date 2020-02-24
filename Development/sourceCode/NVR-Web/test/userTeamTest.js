/**********************************************
 * this file is part of DView8 Common Project
 * Copyright (C)2015-2020 D-Link Corp.
 *
 * Author       : HuiMiaomiao
 * Mail         : Miaomiao.Hui@cn.dlink.com
 * Create Date  : 2017/2/22
 * Summary      :
 *
 **********************************************/

'use strict';
const db = require("../lib/util").db;
const User = db.User;
const Workspace = db.DeviceWorkspace;
const Device = db.DeviceManaged;
const async = require('async');
const NotifyTrigger = db.NotifyTrigger;
//let orgId = "58abbc18325db74c1837dbec";

/*function test(networkId, groups, callback) {
    async.map(groups, function (group, cb) {

    }, function (err, rs) {
        if(err){
            callback(err)
        }else{
            callback(rs);
        }
    })

}*/
function test() {
    NotifyTrigger.getTriggerByNetworkId("", "",  function (err, triggers) {

    });
}
test("58edbcc037738d501e2c3343",[{name:"Firewall"},{name:"Switch"}], function (err, data) {
    if(err){
        console.log(err);
    }else{
        console.log(JSON.stringify(data));
    }
});
