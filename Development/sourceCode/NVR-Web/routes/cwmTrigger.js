/**
 * Created by lizhimin on 2017/12/8.
 */
/**
 * Created by lizhimin on 2016/8/22.
 */
'use strict';
const async = require('async');
const db = require("../lib/util").db;
const NotifyTrapCondition = db.NotifyTrapCondition;
const cwmNotifyTrapCondition = db.cwmNotifyTrapCondition;
const NotifySyslogCondition = db.NotifySyslogCondition;
const cwmNotifySyslogCondition = db.cwmNotifySyslogCondition;
const NotifyTrigger = db.NotifyTrigger;
const cwmNotifyTrigger = db.cwmNotifyTrigger;
const Device = db.DeviceManaged;
const cwmDevice = db.cwmDeviceManaged;
const TrapDictionary = db.TrapDictionary;
const cwmTrapDictionary = db.cwmTrapDictionary;
const AbstractCommand = db.AbstractCommand;
const cwmtriggerC = require("../cwmcontroller/trigger");
/*
 读取系统支持的所有sensor类型，及每一种sensor的参数
 */
exports.getAllSensorItems = function (req, res) {
    AbstractCommand.getAllSensorItems((err, result) => {
        return res.json({success: true, data: result});
    })
};
exports.getAllSensorItemsByGroup=function(req, res){
    AbstractCommand.getAllMonitorItemsByGroup(req.body.groupId,(err, result) => {
        return res.json({success: true, data: result});
    })
};

exports.getTriggersByDeviceModule = function (req, res) {
    let orgId = req.body.orgId;
    let module = req.body.module;

    AbstractCommand.getSupportSensorItems(module, (err, result) => {
        let triggers = {General: [], WiredTraffic: [], Traplog: [], Syslog: []};
        async.parallel([(callback) => {
            NotifyTrigger.findAllTriggerView(orgId, (err, data) => {
                for (let trigger of data) {
                    if (trigger.groupType == 'General') {
                        for (let con of trigger.conditions) {
                            let find = result.find((value, index, arr) => {
                                return value.sensorType == con.sensorType;
                            })
                            if (find) {
                                triggers.General.push(trigger);
                                break;
                            }
                        }

                    } else {
                        let find = result.find((value, index, arr) => {
                            return value.sensorType == 'WiredTraffic';
                        })
                        if (find) {
                            triggers.WiredTraffic.push(trigger);
                        }
                    }
                }
                callback(err, triggers);
            })
        }, (callback) => {
            NotifyTrapCondition.findAllTriggerView(orgId, (err, data) => {
                let find = result.find((value, index, arr) => {
                    return value.sensorType == 'Traplog';
                })
                if (find) {
                    triggers.Traplog = triggers.Traplog.concat(data);
                }
                callback(err, triggers);
            })
        }, (callback) => {
            NotifySyslogCondition.findAllTriggerView(orgId, (err, data) => {
                let find = result.find((value, index, arr) => {
                    return value.sensorType == 'Syslog';
                })
                if (find) {
                    triggers.Syslog = triggers.Syslog.concat(data);
                }
                callback(err, triggers);
            })
        }], (err, result) => {
            if (err) {
                return res.json({success: false, error: err});
            }
            else {
                res.json({success: true, data: triggers});

            }
        })

    })

}
exports.getDefaultTrapType = function (req, res) {
    TrapDictionary.getDefaultItems((err, data) => {
        if (err) {
            return res.json({success: false, error: err});
        }
        else {
            res.json({success: true, data: data});

        }
    });
};
exports.getCustomerTrapOID = function (req, res) {
    let orgId = req.body.orgId;
    TrapDictionary.getCustomerTrapItems(orgId, 'trapOID', (err, data) => {
        if (err) {
            return res.json({success: false, error: err});
        }
        else {
            res.json({success: true, data: data});

        }
    });
};
exports.getCustomerBinding = function (req, res) {
    let orgId = req.body.orgId;
    TrapDictionary.getCustomerTrapItems(orgId, 'bindingVariable', (err, data) => {
        if (err) {
            return res.json({success: false, error: err});
        }
        else {
            res.json({success: true, data: data});
        }
    });
};

/* ===========================================================================================================*/
exports.getTriggerTree = function (req, res) {
    let orgId = req.body.orgId;
    cwmtriggerC.getTriggerTree(orgId, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};

exports.getTriggerByNetworkIdAndGroup = function (req, res) {
    let orgId = req.body.orgId;
    let networkId = req.body.networkId;
    let groupId = req.body.groupId;
    cwmtriggerC.getTriggerByNetworkId(orgId, networkId, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    });
};

exports.addTrigger = function (req, res) {
    let trigger = req.body.trigger;
    trigger.isDefault = false;
    if (!trigger.devIds) {
        trigger.devIds = [];
    }
    cwmNotifyTrigger.createTrigger(trigger, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};



exports.updateTrigger = function (req, res) {
    let updateTrigger = req.body.trigger;
    let product = req.params.product;
    cwmtriggerC.updateTrigger(updateTrigger, function (err, data) {
        if(err){
            return res.json({success: false, error: err});
        }else{
            return res.json({success: true, data: data});
        }
    })
};



exports.updateTriggerCondition = function (req, res) {
    let monitorItem = req.body.triCondition;
    let monitorType = monitorItem.monitorType;
    if (monitorType != "Trap" && monitorType != "Syslog") {
        let repeatTime = monitorItem.repeatTime;
        let valueType = monitorItem.valueType;
        let CriH = monitorItem.Critical.HCondition;
        let CriL = monitorItem.Critical.LCondition;
        let WarH = monitorItem.Warning.HCondition;
        let WarL = monitorItem.Warning.LCondition;
        let InfoH = monitorItem.Info.HCondition;
        let InfoL = monitorItem.Info.LCondition;
        delete monitorItem.repeatTime;
        delete monitorItem.valueType;
        if (CriH) {
            CriH.repeatTime = repeatTime;
            CriH.valueType = valueType;
        }
        if (CriL) {
            CriL.repeatTime = repeatTime;
            CriL.valueType = valueType;
        }
        if (WarH) {
            WarH.repeatTime = repeatTime;
            WarH.valueType = valueType;
        }
        if (WarL) {
            WarL.repeatTime = repeatTime;
            WarL.valueType = valueType;
        }
        if (InfoH) {
            InfoH.repeatTime = repeatTime;
            InfoH.valueType = valueType;
        }
        if (InfoL) {
            InfoL.repeatTime = repeatTime;
            InfoL.valueType = valueType;
        }
    }
    cwmNotifyTrigger.updateCondition(monitorType, monitorItem, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};

exports.getTriggerCondition = function (req, res) {
    let triggerId = req.body.triggerId;
    let monitorType = req.body.monitorType;
    let monitorParam = req.body.monitorParam;
    if(triggerId && monitorType){
        let orgId = req.body.orgId;
        cwmtriggerC.getTriggerCondition(orgId,triggerId, monitorType, monitorParam, function (err, data) {
            if(err){
                return res.json({success: false, error: err});
            }else{
                return res.json({success: true, data: data});
            }
        });
    }else{
        return res.json({success: false});
    }
};

exports.delTrigger = function (req, res) {
    let triggerId = req.body.triggerId;
    cwmNotifyTrigger.deleteTriggerById(triggerId, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};

exports.getTrapTypes = function (req, res) {
    let orgId = req.body.orgId;
    cwmTrapDictionary.getTrapOIDItemsByOrgId(orgId, function (err, items) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: items});
        }
    });
}



