/* **************************************************************
* Copyright (C)2010-2020 Dlink Corp.
* 
* Author      : WangHui
* Mail        : Hui.Wang@cn.dlink.com
* Create Date : 2018-05-21
* Modify Date : 
* Summary     : app api
* 
*************************************************************/
'use strict';
const tokenmanager = require("./../lib/tokenManager");
const crypto = require('crypto');
const db = require("../lib/util").db;
const User = db.User;
const EmailCode = db.EmailCode;
const mailer = require("../lib/mailer");
const common = require("../lib/util").common;
var captchapng = require('captchapng');
const cwmNetworkC = require("../cwmcontroller/network");
const BatchConfigC = require("../cwmcontroller/batchConfig");
const fs = require('fs');
const os = require('os');
const microtime = require('microtime');
const Network = db.cwmNetwork;
const Org = db.cwmOrg;

exports.getSiteAndNetworks = function(headers,res){

    let authentication    = headers.headers.authentication;
    if(typeof(authentication) !== "undefined"){

    
    let space_flag_index = authentication.indexOf(' ');
    let token            = authentication.substring(space_flag_index,authentication.length)
                                          .replace(/(^\s*)|(\s*$)/g, "");
    let req = {};
    req.body = {};
    req.body.token = token;
    if (headers && authentication) {
        tokenmanager.verifyAppToken(req,res,(err,user)=>{
            if(err){
                return res.sendStatus(401);
            }else{
                if (user.privilegeStatus != "enabled") {
                    return res.json({success: false, error: -3});//账户冻结
                } else {
                    let opeUserId = user._id;  
                    cwmNetworkC.getSiteAndNetwork(function (err, result) {
                        if (err) {
                            return res.json({success: false, err: err});
                        } else {
                            db.User.getUserRoleById(opeUserId, function (err, opeUser) {
                                if (err) {
                                    return res.json({success: false, err: err});
                                } else {
                                    if (opeUser.role == "root admin" || opeUser.role == "root user") {
                                        return res.json({success: true, data: result});
                                    } else {
                                        for (let i = 0; i < result.length; i++) {
                                            result[i].networks = result[i].networks.filter(function (value) {
                                                return opeUser.privilege.find(t=>t == value._id);
                                            });
                                        }
                                        //2019.4.25 尹雪雪,将result[i].networks.length = 0 数据删除掉
                                        for (let i = 0; i < result.length; i++) {
                                            //将result[i].networks 为空的数据删除掉
                                            if(result[i].networks.length <= 0){
                                                result.splice(i,1);
                                                i--;
                                            };
                                        };
                                        return res.json({success: true, data: result});
                                    }
                                }
                            })
                        }
                    });                          
               };
            };
        });
    }else {
        return res.sendStatus(401);
    }
   }else{
    return res.sendStatus(401);
   }
};

exports.getAGProfile = function (headers,res) {    
    if(JSON.stringify(headers.body) !== "{}"){
        //对传入值进行捕获
        console.info_log("getAGProfile: headers.body.AgentUUID", headers.body.AgentUUID);
        console.info_log("getAGProfile: headers.body.ID", headers.body.ID);
        if(headers.body.AgentUUID  !== ""
        && headers.body.ID        !== ""
        && typeof(headers.body.ID)  !== "undefined"
        && typeof(headers.body.AgentUUID) !== "undefined"){
            //获取指定network
            let network_uuid = headers.body.AgentUUID;
            let network_id   = headers.body.ID;
            //获取authorization，并从中拿到token
            let authentication    = headers.headers.authentication;
            let space_flag_index = authentication.indexOf(' ');
            let token            = authentication.substring(space_flag_index,authentication.length)
                                                .replace(/(^\s*)|(\s*$)/g, "");
            headers.body.token = token;
            console.info_log("getAGProfile: headers.body.token", token);
            if (headers && authentication) {
                //验证token
                console.info_log("getAGProfile: run verifyAppToken");
                tokenmanager.verifyAppToken(headers,res,(err,user)=>{
                    if(err){
                        console.info_log("getAGProfile: verifyAppToken-sendStatus", "401");
                        return res.sendStatus(401);
                    }else{
                        if (user.privilegeStatus != "enabled") {
                            console.info_log("getAGProfile: verifyAppToken-error-sendStatus", "-3");
                            return res.json({success: false, error: -3});//账户冻结
                        } else {
                            //获取userId
                            let opeUserId = user._id;  
                            try{
                                //调用API
                                console.info_log("getAGProfile: run exportAgentUUID");
                                exportAgentUUID(network_id, network_uuid, (err, data)=> {
                                    if (err) {
                                        console.info_log("getAGProfile: exportAgentUUID-error-sendStatus", err);
                                        return res.json({success: false, error: err});
                                    } else {
                                        console.info_log("getAGProfile: run exportCWMFile");
                                        exportCWMFile(data.alias, data.exportInfo, headers, res);
                                    }
                                });
                            }catch (err){
                                console.info_log("getAGProfile: verifyAppToken-sendStatus", "500");
                                return res.sendStatus(500);
                            }
                        };
                    };
                });
            }else {
                console.info_log("getAGProfile: headers authentication-sendStatus", "401");
                return res.sendStatus(401);
            }
        }else{
            console.info_log("getAGProfile: undefined sendStatus", "500");
            return res.sendStatus(500);
        }
    }else{
        console.info_log("getAGProfile: headers.body sendStatus", "500");
        return res.sendStatus(500);
    }
};

//导出AG profle文件
function exportAgentUUID(networkId, uuid, callback) {

    Network.findById(networkId, function (err, data) {
        if (err) {
            callback(err, null);
        } else {
            try{
                Org.findOrgById(data.orgId, (err, result)=> {
                    if (!err && result) {
                        let alias = data.name;
                        let exportInfo = {
                            AgentGroupUUID: uuid,
                            NmsURL: result.devAccessAddress+":"+result.devAccessPort,
                            PeriodicMsgInterval: result.keepAlive
                        };
                        callback(err, {alias:alias, exportInfo:exportInfo});
                    } else {
                        callback(err, null);
                    }
                });
            }catch(err){
                callback({success: false, error: err});
            }
        }
    })
};

function exportCWMFile(alias, exportInfo, req, res) {

    let algorithm = 'aes-128-ctr';
    let encrypt = function (key, iv, data) {
        let cipher = crypto.createCipheriv(algorithm, key, iv);
        let crypted = cipher.update(data, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    };

    let decrypt = function (key, iv, data) {
        let decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decoded = decipher.update(data, 'hex', 'utf8');
        decoded += decipher.final('utf8');
        return decoded;
    };

    const arrayBuffer = new ArrayBuffer(16);
    const buffer = Buffer.from(arrayBuffer);
    let burHeader = Buffer.alloc(16);

    let netinterface = os.networkInterfaces();
    let macStr = '00:00:00:00:00:00';
    for (let pp in netinterface) {
        if (netinterface[pp].length > 0) {
            macStr = netinterface[pp][0].mac;
            if (macStr != "00:00:00:00:00:00") {
                break;
            }
        }
    }
    macStr = macStr.toUpperCase();
    let charArr = macStr.split(":");
    let macArr = macStr.split(":");
    for (var i = 0; i < charArr.length; i++) {
        macArr[i] = parseInt(charArr[i], 16);
        charArr[i] = charArr[i].substring(0, 1);

    }

    let macbuf = new Buffer(macArr);
    macbuf.copy(burHeader, 2, 0, 6); //mac Address
    let timeX = microtime.nowStruct();
    burHeader.writeUIntLE(timeX[0], 8, 4); //timestamp second
    burHeader.writeUIntLE(timeX[1], 12, 4); //timestamp microsecond


    let hexKey = "0000000000000" + charArr[0] + charArr[1] + charArr[2] + charArr[3] + charArr[4] + charArr[5] + "0" + macStr.replace(new RegExp(":", "gm"), ""); //密钥
    //let hexIV = "0000" + charArr[0] + charArr[1] + charArr[2] + charArr[3] + charArr[4] + charArr[5] + timeX[0].toString() + timeX[1].toString();
    let hexIV = "0000" + macStr.replace(new RegExp(":", "gm"), "") + "0000000000000000";


    let key = new Buffer(hexKey, "hex");
    let iv = new Buffer(hexIV, "hex");


    iv.writeUIntLE(timeX[0], 8, 4); //timestamp second
    iv.writeUIntLE(timeX[1], 12, 4);

    console.info_log("key:", key);
    console.info_log("iv:", iv);
    console.info_log("json:", JSON.stringify(exportInfo));
    let ciphertext = encrypt(key, iv, JSON.stringify(exportInfo));
    console.info_log("ciphertext:", ciphertext);
    let plaintext = decrypt(key, iv, ciphertext);
    console.info_log("plaintext:", plaintext);

    //const bufPayload = Buffer.from(ciphertext);
    let bufPayload = new Buffer(ciphertext, "hex");
    const bodylen = bufPayload.length;
    burHeader.writeUIntLE(bodylen, 0, 2);//payload lenght
    console.info_log("burHeader:", burHeader);
    var totalbuffer = Buffer.concat([burHeader, bufPayload]);
 
    console.info_log(totalbuffer);
    //buffer 转 json
    var kk = JSON.stringify(totalbuffer); 
    console.info_log(kk);
    //json  转 buffer
    var pp = Buffer.from(JSON.parse(kk));
    console.info_log(pp);
    console.info_log("getAGProfile: run exportCWMFile success: true");
    return res.json({success: true, data: totalbuffer});
}

//用于app呼吸链接
exports.getAppBreathing = function (req, res, next) {
    
    User.findById(req.body._id, function (err, user) {
        if (err) {
            return res.json({success: false, error: err});
        }
        if (user) {
            if(user.loginStatus.status !== 'online'){
                return res.json({success: true, data: user});
            }else{
                return res.json({success: true, data: user});
            }
        } else {
            return res.json({success: false, error: 1});
        }
    })
};