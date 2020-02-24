/**
 * Created by lizhimin on 2017/12/8.
 */

'use strict';
const db = require("../lib/util").db;
const async = require('async');
const Traplog = db.cwmTraplog;
const Syslog = db.cwmSyslog;
const TrapDictionary = db.TrapDictionary;
const DeviceManaged = db.cwmDeviceManaged;
const trapTranslate = require('../lib/trapTranslate');

exports.getTraps = function (req, res) {
    let orgId = req.body.orgId;
    async.parallel([(callback)=>{
        Traplog.getTrapByOrgId(orgId, callback);
    },(callback)=>{
        TrapDictionary.getTrapOIDItemsByOrgId(orgId,callback);
    },(callback)=>{
        TrapDictionary.getBindingVariableItemsByOrgId(orgId,callback);
    }],(err,result)=>{
        async.map(result[0], (_data, callback)=> {
        /*    async.waterfall([(callback)=> {
                DeviceManaged.findNameByDevMac(_data.devMac, (err, result)=> {
                    if (result) {
                        _data.name = result.name;
                        _data.ip = result.ip;
                        _data.sortIP = result.sortIP;
                        callback(err, result);
                    }else{
                        callback(null,result);
                    }

                });
            }, (param,callback)=> {
               // if(!param) return callback(null,null);
                trapTranslate.translateTrapOID(result[1],result[2],_data,callback);
            }], (err, result)=> {
                callback(err, result);
            })*/
            trapTranslate.translateTrapOID(result[1],result[2],_data,callback);

        }, (err, data)=> {
            if (err) {
                res.json({success: false, error: err});
            } else {
               res.json({success: true, data: result[0]});
            }

        })
    })
};
exports.getSyslogs = function (req, res) {
    let orgId = req.body.orgId;
    Syslog.getLogByOrgId(orgId, function (err, data) {
        if (err) {
            res.json({success: false, error: err});
        }
        else {
            res.json({success: true, data: data});

        }
    });
}
