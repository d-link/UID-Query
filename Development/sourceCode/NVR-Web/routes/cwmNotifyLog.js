/**
 * Created by lizhimin on 2017/12/8.
 */

'use strict';
const db = require("../lib/util").db;
const cwmDevice = db.cwmDeviceManaged;

exports.getNotification = function (req, res) {
    let orgId = req.body.orgId;
    cwmDevice.findByOrgId(orgId, function (err, data) {
        if(err){
            return res.json({success: false, err:err});
        }else{
            let d = [{
                severity: "Critical",
                source: {
                    devMac: '',
                    name: "test",
                },
                monitorType: "MemoryUtilization",
                repeatCount:1,
                lastTime: new Date(),
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
                }],
                handler:"junnan.dai"
            }, {
                severity: "Warning",
                source: {
                    devMac: '',
                    name: "test",
                },
                monitorType: "MemoryUtilization",
                lastTime: new Date() ,
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
                }],
                handler:"junnan.dai"
            }, {
                severity: "Info",
                source: {
                    devMac: '',
                    name: "test",
                },
                monitorType: "MemoryUtilization",
                lastTime: new Date() ,
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
                }],
                handler:"junnan.dai"
            }]
            return res.json({success: true, data:d});
        }
    })
};
