/**
 * Created by lizhimin on 2018/1/4.
 */
'use strict';
const db = require("../lib/util").db;
const async = require('async');
const Traplog = db.cwmTraplog;
const Syslog = db.cwmSyslog;
const TrapDictionary = db.cwmTrapDictionary;
const DeviceManaged = db.cwmDeviceManaged;
const operateLog=db.cwmOperationLog;
const eventLog=db.cwmSystemEventLog;
const deviceLog=db.cwmDeviceLog;
const  Network=db.cwmNetwork;
const deviceLogC = require("../cwmcontroller/deviceLog");
const trapTranslate = require('../lib/trapTranslate');
const networkC = require("../cwmcontroller/network");
exports.getLog=function(req,res){

}
function getDeviceMACs(orgId,opeUserId,callback){
    let MACs=[];
    let param={orgId:orgId,networkId:'ALL',siteId:'ALL'};

    return new Promise((resolve,reject)=>{
        networkC.getUsersNetworkIds(param, opeUserId, (networkIds)=> {
            let rule = {networkIds: networkIds};
                  resolve(rule);
        })
    }).then(rule=>{
        DeviceManaged.getDeviceMACsBySearchForLog(rule,(err,result)=>{
            if(!err){
                let macs=[];
                for(let re of result){
                    macs.push(re.mac);
                }
                callback(err,macs);
            }else{
                callback(err,[]);
            }
        })
    })
}
exports.getTraps = function (req, res) {
    let orgId = req.body.orgId;
    let searchRule=req.body.searchRule;
    let page=req.body.page;
    let opeUserId = req.opeUserId;
  /*  if(!page){page={start:0,count:10};}else{
        if(!page.start) page.start=0;
    }*/
    getDeviceMACs(orgId,opeUserId,(err,result)=>{
        searchRule.macs=result;
        async.parallel([(callback)=>{
            Traplog.getCount(orgId,searchRule,callback);
        }, (callback)=>{
            Traplog.getTrapByOrgId(orgId,searchRule,page, callback);
        },(callback)=>{
            TrapDictionary.getTrapOIDItemsByOrgId(orgId,callback);
        },(callback)=>{
            TrapDictionary.getBindingVariableItemsByOrgId(orgId,callback);
        }],(err,result)=>{
            async.map(result[1], (_data, callback)=> {
                trapTranslate.translateTrapOID(result[2],result[3],_data,callback);

            }, (err, data)=> {
                if (err) {
                    res.json({success: false, error: err});
                } else {
                    res.json({success: true, data:data,total:result[0]});
                }

            })
        })
    })


};
exports.getSyslogs = function (req, res) {
    let orgId = req.body.orgId;
    let searchRule=req.body.searchRule;
    let page=req.body.page;
    let opeUserId = req.opeUserId;
  /*  if(!page){page={start:0,count:10};}else{
        if(!page.start) page.start=0;
    }*/
    getDeviceMACs(orgId,opeUserId,(err,result)=>{
        searchRule.macs=result;
    Syslog.getLogCount(orgId,searchRule,(err,count)=>{
        Syslog.getLogByOrgId(orgId,searchRule,page, function (err, data) {
            if (err) {
                res.json({success: false, error: err});
            }
            else {
                res.json({success: true, data: data,total:count});

            }
        });
    })});

};
exports.getEUSyslogs = function (req, res) {
    let orgId = req.body.orgId;
    let searchRule=req.body.searchRule;
    let page=req.body.page;
    let opeUserId = req.opeUserId;
   /* if(!page){page={start:0,count:10};}else{
        if(!page.start) page.start=0;
    }*/
    getDeviceMACs(orgId,opeUserId,(err,result)=> {
        searchRule.macs=result;
        Syslog.getEULogCount(orgId, searchRule, (err, count)=> {
            Syslog.findEULogs(orgId, searchRule, page, function (err, data) {
                if (err) {
                    res.json({success: false, error: err});
                }
                else {
                    res.json({success: true, data: data, total: count});

                }
            });
        })
    });
};

exports.getEventLogs = function (req, res) {
    let orgId = req.body.orgId;
    let searchRule=req.body.searchRule;
    let page=req.body.page;
    let opeUserId = req.opeUserId;
   /* if(!page){page={start:0,count:10};}else{
        if(!page.start) page.start=0;
    }*/

    return new Promise((resolve,reject)=>{
        db.User.getUserRoleById(opeUserId, function (err, opeUser) {
            if (err) {
               reject(err);
            } else {
                if (opeUser.role == "root admin" || opeUser.role == "root user") {
                    resolve(searchRule);
                } else {
                    getDeviceMACs(orgId,opeUserId,(err,result)=> {
                        searchRule.macs=result;
                        resolve(searchRule);
                    });
                }
            }
        })

    }).then(rule=>{
        eventLog.getCount(orgId, searchRule, (err, count)=> {
            eventLog.getNotifyByOrg(orgId, searchRule, page, function (err, data) {
                async.map(data, (re, cb)=> {
                    if (re.hasOwnProperty('_doc')) {
                        re = re.toObject();
                    }
                    if (re.uuid&&!re.network) {
                        Network.findNetworkByAgentUUID(re.uuid, (err, net)=> {
                            if (net) {
                                re.network = net.name;
                                eventLog.updateNetworkInfo(re,(err,result2)=>{})
                            }
                            cb(err, re);
                        })
                    } else {
                        cb(null, re);
                    }
                }, (error, datas)=> {
                    if (err) {
                        res.json({success: false, error: err});
                    }
                    else {
                        res.json({success: true, data: datas, total: count});

                    }
                });
            });
        })
    })

}


exports.getDeviceLogs = function (req, res) {
    let orgId = req.body.orgId;
    let searchRule=req.body.searchRule;
    let page=req.body.page;
    let opeUserId = req.opeUserId;
  /*  if(!page){page={start:0,count:10};}else{
        if(!page.start) page.start=0;
    }*/
    getDeviceMACs(orgId,opeUserId,(err,result)=> {
        searchRule.macs=result;
        deviceLog.getCount(orgId, searchRule, (err, count)=> {
            deviceLogC.getDevices(orgId, searchRule, page, function (err, data) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    return res.json({success: true, data: data, total: count});
                }
            })
        });
    });
}
exports.getOperateLog=function(req,res){
    let orgId = req.body.orgId;
    let time = req.body.time;
    operateLog.findAll((err,result)=>{
        if(err){
            return res.json({success: false, error: err});
        }else{
            return res.json({success: true, data:result});
        }
    })
}