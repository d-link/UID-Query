/**
 * Created by zhiyuan on 2017/12/18.
 */
'use strict';
const db = require("../lib/util").db;
const os = require('os');
const regCheck = require("../lib/regCheck");
exports.getServerIPs = function (req, res) {
    let result = [];
    let netinterface = os.networkInterfaces();
    for (let pp in netinterface) {
        if (netinterface[pp].length > 0) {
            for (let i = 0; i < netinterface[pp].length; i++) {
                if (netinterface[pp][i].family == "IPv4"&&netinterface[pp][i].address!='127.0.0.1'){
                    let find=result.findIndex(function (item) {
                        return item == netinterface[pp][i].address;
                    });
                    if(find==-1){
                        result.push(netinterface[pp][i].address);
                    }
                }
            }
        }
    }
    return res.json({success: true, data: result});
};
exports.setBackupSetting = function (req, res) {

    let opeUserId = req.opeUserId;
    //按照前端规则过滤传入
    let setting = req.body.setting;
    if( [0,1,2].indexOf(setting.autoBackupType) == -1
        || (setting.autoBackupType == 2 && !regCheck.isIpOrWebsite(setting.externalSyslogServer))){
        return res.json({success: false, error: "Request parameter validation failed"}); 
    }
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {
                db.cwmDatabaseSetting.updateDBSeting(setting, (err, result)=> {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: result});
                    }
                });
            }
        }
    });

};
exports.getBackupSetting = function (req, res) {
    db.cwmDatabaseSetting.getDBSetting((err, result)=> {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (result) {
                return res.json({success: true, data: result});
            } else {
                let setting = {autoBackupType: 0, externalSyslogServer: ""};
                return res.json({success: true, data: setting});
            }

        }
    });

};


