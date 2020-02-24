/**
 * Created by lizhimin on 10/26/16.
 */
'use strict';
const async = require('async');
const db = require("../lib/util").db;
const common = require("../lib/util").common;
const Device = db.cwmDeviceManaged;
const NotifyAlert = db.cwmNotifyAlert;
const NotifyEvent = db.cwmNotifyEvent;
const SystemEvent = db.cwmSystemEventLog;
const NotifyTrigger = db.cwmNotifyTrigger;
const TrapDictionary = db.cwmTrapDictionary;
const NotifySubscribeRule = db.cwmNotifySubscribeRule;
const moment = require('moment');
const trapTranslate = require('../lib/trapTranslate');
exports.getHealthEvent = function (orgId, callback) {

};
exports.getMACConflictEvent = function (orgId, callback) {
    let types = [];
    types.push(common.systemEvtType.macConflict);
    SystemEvent.getEventByTypes(orgId, types, (err, result) => {
        async.map(result, (rs, callback) => {
            Device.findNameByDevId(rs.devId, (err, dev) => {
                if (dev) {
                    rs.sysName = dev.sysName;
                    rs.ip = dev.ip;
                    rs.mac = dev.mac;
                } else {
                    rs = null;
                }
                callback(err, rs);
            });
        }, (err, result) => {
            callback(err, result);
        })
        callback({success: true, data: data});
    })
};
exports.getAllSystemEvent = function (orgId, callback) {
    SystemEvent.getNotifyByOrg(orgId, (err, result) => {
        if (err) {
            callback({success: false, error: err});
        } else {
            callback({success: true, data: result});
        }

    })
};
exports.getEventCount = function (orgId, callback) {
    async.parallel([(callback) => {
        NotifyAlert.getGroupNotifyByOrg(orgId, callback);
    }, (callback) => {
        SystemEvent.getEventCount(orgId, callback);
    }], (err, result) => {
        if (result && result.length == 2) {
            // let data = {_id: 'SystemEvent', count: result[1]};
            // result[0].push(data);
            result[0] = [{_id:'SystemEvent', count:0},{_id:'Critical', count:1},
                {_id:'Warning', count:1},{_id:'Info', count:1}];
            callback({success: true, data: result[0]});
        } else {
            callback({success: false, error: err});
        }
    });
}
exports.getEventsByIds = function (orgId, type, eventIds, callback) {
/*    NotifyEvent.findByIds(eventIds, (err, events) => {
        if (err) {
            callback({success: false, error: err});
        }
        else {
            if (type == "Trap") {
                getTrapEventContents(orgId, data, callback);
            }else{
                callback({success:true,data:events});
            }
        }
    })*/
    let data = [{
            eventTime:"2017-09-19T09:29:21.953Z",
            monitorType: "MemoryUtilization",
            monitorParam: "memoryUtilization",
            condition: {
                "expression": ">",
                "threshold": 80,
                "valueType": "absoluteValue",
                "repeatTime": 1
            },
            dataSource: [{
                time : "2017-09-19T09:29:21.953Z",
                fieldValue : 89.595794677734375
            }]
    }]
    callback(null, data);
}
function getTrapEventContents(orgId, data, callback) {
    async.parallel([(callback) => {
        TrapDictionary.getTrapOIDItemsByOrgId(orgId, callback);
    }, (callback) => {
        TrapDictionary.getBindingVariableItemsByOrgId(orgId, callback);
    }], (err, result) => {
        async.each(data, (rs, callback) => {
            async.parallel([
                /*        (callback) => {
                 //读取trigger的名称
                 NotifyTrigger.findById(rs.triggerId, (err, re) => {
                 if (re) {
                 rs.triggerName = re.name;
                 }
                 callback(err, rs);
                 })

                 },*/
                (callback) => {
                    //取完整的event信息
                    let ids = [];
                    if (rs.eventIds.length > 0) ids.push(rs.eventIds[0]);
                    NotifyEvent.findByIds(ids, (err, events) => {
                        if (events) {
                            rs.events = events;
                        }
                        callback(err, rs);
                    })
                }, (callback) => {
                    if (rs.monitorType == 'Trap') {
                        async.map(rs.events, (source, callback) => {
                            trapTranslate.translateTrapOID(result[0],
                                result[1], source.dataSource[0].fieldValue[0], callback);
                        }, (err, result) => {
                            callback(err, result);
                        })
                    } else {
                        callback(null, null);
                    }
                }], (err, result) => {
                callback(err, result);
            })
        }, (err, result) => {
            if(err){
                callback({success: false, data: null});
            }else{
                callback({success: true, data: data});
            }
        })
    });
}
exports.getAllNotification = function (orgId, callback) {
    // NotifyAlert.getNotifyByOrg(orgId, (err, data) => {
    //     if (err || !data) {
    //         callback({success: false, error: err});
    //     } else {
    //         getTrapEventContents(orgId, data, callback);
    //     }
    // })
    Device.findByOrgId(orgId, function (err, rs) {
        if(rs&&rs.length>0){
            let dev = rs[0];
            let data = [
                {
                    severity: "Critical",
                    monitorType: "MemoryUtilization",
                    lastTime:"2017-09-25T01:58:22.639Z" ,
                    firstTime:"2017-09-25T01:58:22.639Z",
                    repeatCount:1,
                    source: {
                        devId: dev._id,
                        sysName: dev.sysName,
                    },
                    events: [{
                        monitorType: "MemoryUtilization",
                        monitorParam: "memoryUtilization",
                        condition: {
                            "expression": ">",
                            "threshold": 80,
                            "valueType": "absoluteValue",
                            "repeatTime": 1
                        },
                        dataSource: [{
                            time : "2017-09-19T09:29:21.953Z",
                            fieldValue : 89.595794677734375
                        }]
                    }]
                }, {
                    severity: "Warning",
                    monitorType: "MemoryUtilization",
                    lastTime:"2017-09-25T01:58:22.639Z" ,
                    firstTime:"2017-09-25T01:58:22.639Z",
                    source: {
                        devId: dev._id,
                        sysName: dev.sysName,
                    },
                    repeatCount:1,
                    events: [{
                        monitorType: "MemoryUtilization",
                        monitorParam: "memoryUtilization",
                        condition: {
                            "expression": ">",
                            "threshold": 80,
                            "valueType": "absoluteValue",
                            "repeatTime": 1
                        },
                        dataSource: [{
                            time : "2017-09-19T09:29:21.953Z",
                            fieldValue : 89.595794677734375
                        }]
                    }]
                }, {
                    severity: "Info",
                    monitorType: "MemoryUtilization",
                    lastTime:"2017-09-25T01:58:22.639Z" ,
                    firstTime:"2017-09-25T01:58:22.639Z",
                    repeatCount:1,
                    source: {
                        devId: dev._id,
                        sysName: dev.sysName,
                    },
                    events: [{
                        monitorType: "MemoryUtilization",
                        monitorParam: "memoryUtilization",
                        condition: {
                            "expression": ">",
                            "threshold": 80,
                            "valueType": "absoluteValue",
                            "repeatTime": 1
                        },
                        dataSource: [{
                            time : "2017-09-19T09:29:21.953Z",
                            fieldValue : 89.595794677734375
                        }]
                    }]
                }]
            callback(err, data);
        }else{
            callback(err,[]);
        }


    })
}

//获取所有的notification rule信息
exports.getNotifyRulesByOrgId = function (orgId, callback) {
    NotifySubscribeRule.getRulesByOrgId(orgId, function (err, datas) {
        async.map(datas, (data, cb)=>{
            let dev = data.devIds.length;
            data.deviceNum = dev;
            //还要取最后一次发送邮件的时间
            cb(null, data);
        },(err, rs)=>{
            callback(err, rs);
        })
    })
};

exports.getMoniterItems = function (callback) {
    NotifyTrigger.getAllMonitorItemsByGroup('AG_DAP',(err, result) => {
        if(err){
            callback(err);
        }else{
            let items = result;
            async.map(items, (item, cb)=> {
                let monitorParam = [];
                if(item.items){
                    let params = item.items;
                    for(let p of params){
                        monitorParam.push(p.paramName);
                    }
                    item.monitorParam = monitorParam;
                    delete item.items;
                    cb(null, item);
                }else{
                    item.monitorParam = [item.monitorType];
                    cb(null, item);
                }
            }, (err, items)=>{
                callback(err, items);
            })
        }
    })
}