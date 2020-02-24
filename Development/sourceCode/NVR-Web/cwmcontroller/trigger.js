/**********************************************
 * this file is part of DView8 Common Project
 * Copyright (C)2015-2020 D-Link Corp.
 *
 * Author       : HuiMiaomiao
 * Mail         : Miaomiao.Hui@cn.dlink.com
 * Create Date  : 2017/3/28
 * Summary      :
 *
 **********************************************/
'use strict';
const async = require('async');
const db = require("../lib/util").db;
const Site = db.Site;
const common = require("../lib/util").common;
const NotifyTrigger = db.cwmNotifyTrigger;
const NotifyTriggerCondition = db.cwmNotifyCommonCondition;
const Network = db.cwmNetwork;
const DeviceM = db.cwmDeviceManaged;
const TrapDictionary = db.TrapDictionary;
const QueueC = require("./taskQueue");

//获取trigger的event级别与alter信息
function getMonitorType(group,callback) {
    NotifyTrigger.getAllMonitorItemsByGroup(group, function (err, monitorTypes){
        if(err){callback(err)}
        else{
            async.map(monitorTypes, function (monitorType, cb) {
                let monitorParam = [];
                if(monitorType.items){
                    let items = monitorType.items;
                        for(let item of items){
                            monitorParam.push(item.paramName);
                    }
                }
                monitorType.monitorParam = monitorParam;
                cb(null, monitorType);
            }, function (err, rs) {
                callback(err,rs);
            });
        }
    });
}

/* ************************************************私有函数**************************************************************** */

//获取trigger页面左侧的树数据
exports.getTriggerTree = function (orgId, callback) {
    Network.getSiteAndNetworkByOrg(orgId, (err, sites) => {
        async.map(sites, (site,cb)=> {
            site.siteName = site._id;
            async.map(site.networks, (net, cb) => {
                net.networkName= net.name;
                net.networkId = net._id;
                NotifyTrigger.getTriggerByNetworkId(orgId, net._id, function (err, triggers) {
                    let triggerNames = [];
                    for (let trigger of triggers) {
                        triggerNames.push({triggerId: trigger._id, name: trigger.name});
                    }
                    net.triggers = triggerNames;
                    getMonitorType('AG_DAP',function (err, data) {
                        net.monitorTypes = data;
                        cb(null, net);
                    });
                });
            }, function (err, rs) {
                if (err) {
                    cb(err);
                } else {
                    site.networks = rs;
                    cb(err, site);
                }
            });
        },function (err, rs) {
            if(err){
                callback(err);
            }else{
                callback(null, rs);
            }
        });
    });
};

exports.updateTrigger = function (updateTrigger, callback) {
    NotifyTrigger.findById(updateTrigger._id, (err, trigger) => {
        NotifyTrigger.updateTrigger(updateTrigger, function (err, data) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        })
    })
}

exports.getTriggerCondition = function (orgId, triggerId, monitorType, monitorParam, callback) {
    NotifyTrigger.getConditionsByMonitorType(triggerId, monitorType, monitorParam, function (err, data) {
        if (err) {
            callback(err);
        } else {
            //数据过滤
            if (data) {
                if (monitorType != "Trap" && monitorType != "Syslog") {
                    switch (true) {
                        case data.Info.enable:
                            data.repeatTime = data.Info.HCondition.repeatTime;
                            data.valueType = data.Info.HCondition.valueType;
                            break;
                        case data.Warning.enable:
                            data.repeatTime = data.Warning.HCondition.repeatTime;
                            data.valueType = data.Warning.HCondition.valueType;
                            break;
                        case data.Critical.enable:
                            data.repeatTime = data.Critical.HCondition.repeatTime;
                            data.valueType = data.Critical.HCondition.valueType;
                            break;
                        default:
                            data.repeatTime = "";
                            data.valueType = "";
                            break;
                    }
                    callback(null, data);
                }
                else if (monitorType == "Trap") {
                    let conditions = data.conditions;
                    async.map(conditions, function (condition, callback) {
                        let genericTypeH = condition.genericTypeH;
                        let genericTypeL = condition.genericTypeL;
                        if(genericTypeH || genericTypeL){
                            callback(null, condition);
                        } else{
                            TrapDictionary.getItemByOID(condition.trapOIDH, "trapOID", function (err, OIDH) {
                                if(err){
                                    callback(err);
                                }else{
                                    condition.genericTypeH = OIDH.name;
                                    TrapDictionary.getItemByOID(condition.trapOIDL, "trapOID", function (err, OIDL) {
                                        if(err){
                                            callback(err);
                                        }else{
                                            condition.genericTypeL = OIDL.name;
                                            callback(null, condition);
                                        }
                                    });
                                }
                            });
                        }
                    }, function (err, rs) {
                        if (err) {
                            callback(err);
                        } else {
                            data.conditions = rs;
                            callback(null, data);
                        }
                    });
                }
                else {
                    callback(null, data);
                }
            }else{
                callback(err,null);
            }
        }
    });
}
