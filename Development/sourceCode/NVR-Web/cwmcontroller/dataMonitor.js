/**
 * Created by lizhimin on 2018/5/17.
 */
'use strict';
const util = require("../lib/util");
const db = util.db;
//const common = util.common;
const cwmNCStats = db.cwmNCStats;
const cwmClient = db.cwmClientHistory;
//const cwmClientRawData = db.cwmClientRawData;
const moment = require('moment');
const config = util.config;
const rp = require('request-promise');
function checkClientStatus() {
    cwmNCStats.checkCSOnlineStatus((err,result)=>{
        if(err || !result){
            let time1 = moment().subtract(180, 'seconds');
           // let tim2=moment().millisecond();
            cwmClient.findRealOfflineClients(time1,(err, result)=> {
              //  let tim3=moment().millisecond();
               // console.log(" search time:"+(tim3-tim2));
                if (!err) {
                    //let clientItems=[];
                    let clientList=[];
                    for (let clientInfo of result) {
                        clientInfo.status = common.userStatus.offline;
                        clientList.push({clientMACAddr: clientInfo.clientMACAddr});
                        // let newClientItem = {
                        //     clientMACAddr: clientInfo.clientMACAddr,
                        //     uuid: clientInfo.uuid,
                        //     apMACAddr: clientInfo.apMACAddr,
                        //     staToApRxDataBytes: 0,
                        //     apToStaTxDataBytes: 0,
                        //     reportTime: new Date(),
                        //     msgType:'disassociate'
                        // }
                        // clientItems.push(newClientItem);
                    }
                    if (clientList && clientList.length>0) {
                        cwmClient.updateClientStatusToOfflineByMACs(clientList,function(err,result){});
                    }
                    /*
                    if (clientItems.length > 0) {
                        let temp = clientItems.splice(0, clientItems.length);
                        cwmClientRawData.insertMany(temp, (err, result)=> {
                        });
                    }
                    */
                }
            });
        }
    })

}

function checkModulesOnline(){
    db.cwmOrg.findOrg(function (err, orgInfo) {
        let version = '';
        if (orgInfo) {
            version = orgInfo.supportListVersion;
        }
        const options = {
            method: 'GET',
            uri: config.supportModuleUrl,
            json: true
        };
        rp(options)
            .then(function (body) {
                let jsondata = body;
                if (jsondata.version == version) {
                    //不需要更新
                } else {

                    //移除旧列表，并保存新的支持列表
                    db.cwmModules.removeAll((err, result)=> {
                        if (!err) {
                            db.cwmModules.insertMany(jsondata.list, function (err, result) {
                                //更新支持设备列表的版本
                                if(!err){
                                    if(orgInfo){
                                        db.cwmOrg.updateSupportModelsVersion(orgInfo._id, jsondata.version, (err, result)=> {
                                        });
                                    }
                                }
                                //去掉给AS的任务
                                //  QueueC.addUpdateModelListQueue({common: common.taskType.common.updateModelList});
                            });
                        }

                    })
                }
            })
            .catch(function (err) {
                // Crawling failed...
            });
    });
}
function checkCSStatus(callback){
    cwmNCStats.checkCSOnlineStatus(callback);
}
checkModulesOnline();
module.exports = {
    checkClientStatus,
    checkModulesOnline,
    checkCSStatus
}