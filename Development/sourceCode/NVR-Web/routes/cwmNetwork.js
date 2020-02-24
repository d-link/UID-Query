/**
 * Created by lizhimin on 2017/12/8.
 */

'use strict';
const util = require("../lib/util");
const regCheck = require("../lib/regCheck");
const db = require("../lib/util").db;
const common = require("../lib/util").common;
const cwmNetworkC = require("../cwmcontroller/network");
const QueueC = require("../cwmcontroller/taskQueue");
const env = process.env.NODE_ENV || "development";
const cwmNetwork = db.cwmNetwork;
const cwmDiscovered = db.cwmDiscovered;
const profile = db.cwmConfigProfile;
const Org = db.cwmOrg;
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const os = require('os');
const crypto = require('crypto');
const microtime = require('microtime');
const BatchConfigC = require("../cwmcontroller/batchConfig");

exports.addNetwork = function (req, res) {
    let network = req.body.network;
    cwmNetworkC.createNetwork(network, function (result) {
        return res.json(result);
    })
};

exports.checkName = function (req, res) {
    let network = req.body.network;
    cwmNetwork.findNetworkByName(network.name, (err, result) => {
        if (err) {
            return res.json({success: false, error: err});
        } else if (result && ((network._id && network._id != result._id) || !network._id)) {
            return res.json({success: false, error: 1});
        } else {
            return res.json({success: true});
        }
    });
}

exports.checkSchoolID = function (req, res) {
    let network = req.body.network;
    cwmNetwork.findNetworkBySchoolId(network.schoolId, (err, result) => {
        if (err) {
            return res.json({success: false, error: err});
        } else if (result && ((network._id && network._id != result._id) || !network._id)) {
            return res.json({success: false, error: 1});
        } else {
            return res.json({success: true});
        }
    });
}

function checkAGUUID(uuid, callback) {
    cwmNetwork.findNetworkByAgentUUID(uuid, (err, result) => {
        if (result) {
            let objId = cwmNetwork.getObjectId().toString();
            let agentUUID = (objId.substr(0, 4) + "-" + objId.substr(4, 8) + "-" + objId.substr(12, 8) + "-" + objId.substr(20, 4)).toUpperCase();
            checkAGUUID(agentUUID, callback);
        } else {
            callback(uuid);
        }
    })
}

exports.addOrUpdateNetwork = function (req, res) {

    let network = req.body.network;
    let devSet = req.body.devSet;
    let ssid = req.body.ssid;

    let opeUserId = req.opeUserId;
    if(network){
        if(!regCheck.isNetwork(network.name)
           || !regCheck.isSite(network.site)
           || (network.guestSSIDAddEnabled == true && !regCheck.isGuestSSIDAddName(network.guestSSIDAddName))){
            return res.json({success: false, error: "Request parameter validation failed"}); 
        }
    }else{
        return res.json({success: false, error: "Request parameter validation failed"}); 
    }
    if(ssid){
        if(!regCheck.isSSID(ssid.ssid)
           || [1,8,101,108].indexOf(ssid.authentication) == -1
           || ([1,101].indexOf(ssid.authentication) == -1 && !regCheck.isPassPhrase(network.orgId,ssid.passPhrase,ssid.authentication))
           || [true,false].indexOf(ssid.guestSSIDEnabled) == -1
           || (ssid.guestSSIDEnabled == true && !regCheck.isGuestSSIDName(ssid.guestSSIDName))
        ){
            return res.json({success: false, error: "Request parameter validation failed"}); 
        }
    }
    if(devSet){
        if(!regCheck.isSntpTimeZoneIndex(devSet.sntpTimeZoneIndex)
           || !regCheck.isCountryCode(devSet.countrycode)
           || !regCheck.isDevSetUserName(devSet.userName)){
            return res.json({success: false, error: "Request parameter validation failed"});
        }
        if(!regCheck.passwordL1(util.decrptyMethod(network.orgId, devSet.password))){
            return res.json({success: false, error: 5}); 
        }
    }
    return new Promise((resolve, reject) => {
        if (!network.agentUUID) {
            let objId = cwmNetwork.getObjectId().toString();
            let agentUUID = (objId.substr(0, 4) + "-" + objId.substr(4, 8) + "-" + objId.substr(12, 8) + "-" + objId.substr(20, 4)).toUpperCase();
            checkAGUUID(agentUUID, (uuid) => {
                network.agentUUID = uuid;
                resolve();
            })
        } else {
            resolve();
        }
    }).then(() => {
        if (!network._id) {
            db.User.getUserRoleById(opeUserId, function (err, opeUser) {
                if (err) {
                    return res.json({success: false, err: err});
                } else {
                    if (opeUser.role != "root admin") {
                        return res.json({success: false, error: -1});
                    } else {
                        cwmNetwork.findNetworkByName(network.name, (err, result) => {
                            if (err) {
                                return res.json({success: false, error: err});
                            } else if (result) {
                                return res.json({success: false, error: 1});
                            } else {
                                if (env == "Production_hualian") {
                                    cwmNetwork.findNetworkBySchoolId(network.schoolId, (err, result) => {
                                        if (err) {
                                            return res.json({success: false, error: err});
                                        } else if (result) {
                                            return res.json({success: false, error: 2});
                                        } else {
                                            cwmNetwork.create(network, function (err, data) {
                                                if (err) {
                                                    return res.json({success: false, error: err});
                                                } else {
                                                    /*  trigger.createAGTrigger(data.orgId, data._id, (err, result)=> {
                                                     });*/

                                                    /*    cwmDeviceManaged.initDevice(data.orgId, data._id, data.agentUUID, (err, result)=> {
                                                     })*/

                                                    network._id = data._id;
                                                    upProfile();
                                                    return res.json({success: true, data: data});
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    cwmNetwork.create(network, function (err, data) {
                                        if (err) {
                                            return res.json({success: false, error: err});
                                        } else {
                                            /*  trigger.createAGTrigger(data.orgId, data._id, (err, result)=> {
                                             });*/

                                            /*    cwmDeviceManaged.initDevice(data.orgId, data._id, data.agentUUID, (err, result)=> {
                                             })*/

                                            network._id = data._id;
                                            upProfile();
                                            return res.json({success: true, data: data});
                                        }
                                    });
                                }

                            }

                        })

                    }
                }
            });

        } else {

            db.User.getUserRoleById(opeUserId, function (err, opeUser) {
                if (err) {
                    return res.json({success: false, err: err});
                } else {

                    if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t => t == network._id))
                        || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                        return res.json({success: false, error: -1});
                    } else {
                        cwmNetwork.findNetworkByName(network.name, (err, result) => {
                            if (err) {
                                return res.json({success: false, error: err});
                            } else if (result && result._id != network._id) {
                                return res.json({success: false, error: 1});
                            } else {

                                let checkGuestSSIDAdd = function (callback) {
                                    if (network.guestSSIDAddEnabled) {
                                        profile.getAllSSID(network.agentUUID, function (err, result) {
                                            let profileId = result._id;
                                            let ssids = result.ssids;
                                            if (ssids) {
                                                let find = ssids.find(function (item) {
                                                    return item.ssid == network.guestSSIDAddName;
                                                })
                                                if (find) {
                                                    callback(3);
                                                } else {
                                                    let index = 0;
                                                    do {
                                                        index++;
                                                        find = ssids.find(function (item) {
                                                            return item.ssidIndex == index;
                                                        })
                                                    }
                                                    while (find);
                                                    if (index > 8) {
                                                        callback(4);
                                                    } else {
                                                        //add new guest ssid
                                                        //profile.addGuestSSID(network.agentUUID, index, network.guestSSIDAddName, callback);
                                                        profile.addGuestSSID(network.agentUUID, index, network.guestSSIDAddName, (err, result) => {
                                                            let schedule = {
                                                                cyclicalType: "Immediate",
                                                                executeTime: new Date().toISOString(),
                                                                scheduleStart: new Date().toISOString(),
                                                            };
                                                            BatchConfigC.updateProfileSchedule(profileId, schedule, callback);
                                                        });
                                                    }
                                                }
                                            } else {
                                                callback(err);
                                            }


                                        });
                                    } else {
                                        callback();
                                    }
                                }

                                checkGuestSSIDAdd(function (err) {
                                    if (err) {
                                        return res.json({success: false, error: err});
                                    }
                                    delete network.guestSSIDAddEnabled;
                                    delete network.guestSSIDAddName;

                                    if (env == "Production_hualian") {
                                        cwmNetwork.findNetworkBySchoolId(network.schoolId, (err, result) => {
                                            if (err) {
                                                return res.json({success: false, error: err});
                                            } else if (result && result._id != network._id) {
                                                return res.json({success: false, error: 2});
                                            } else {
                                                cwmNetwork.updateBaseInfo(network._id, network, function (err, data) {
                                                    if (err) {
                                                        return res.json({success: false, error: err});
                                                    } else {
                                                        // upProfile();
                                                        return res.json({success: true, data: data});
                                                    }
                                                });
                                            }
                                        });
                                    } else {
                                        cwmNetwork.updateBaseInfo(network._id, network, function (err, data) {
                                            if (err) {
                                                return res.json({success: false, error: err});
                                            } else {
                                                // upProfile();
                                                return res.json({success: true, data: data});
                                            }
                                        });
                                    }
                                });

                            }

                        })
                    }
                }
            })


        }


        function upProfile() {
            let params = {};
            if (devSet && ssid) {
                if (devSet.countrycode) {
                    devSet.countrycode = devSet.countrycode.id;
                }
                if (devSet.sntpTimeZoneIndex) {
                    devSet.sntpTimeZoneIndex = devSet.sntpTimeZoneIndex.id;
                }
                if (ssid.passPhrase) {
                    ssid.passPhrase = util.decrptyMethod(network.orgId, ssid.passPhrase);
                }
                devSet.password = util.decrptyMethod(network.orgId, devSet.password);
                devSet.password = util.encrptyMethod(network.agentUUID, devSet.password);
                if (ssid.authentication == 1 || ssid.authentication == 2||ssid.authentication == 101) {
                    if (ssid.authentication == 1||ssid.authentication == 101) {
                        ssid.encryption = 0;
                    } else {
                        ssid.encryption = 1;
                    }
                    ssid.keySize = 1;
                    ssid.keyType = 1;
                    ssid.keyIndex = 1;
                    ssid.keyValue = ssid.passPhrase;
                    delete ssid.passPhrase;
                } else if (ssid.authentication == 8 || ssid.authentication == 108) {
                    ssid.cipherType = 1;
                    ssid.groupKeyUpdateInterval = 3600;
                    ssid.passPhrase = util.encrptyMethod(network.agentUUID, ssid.passPhrase);
                }
                profile.findPrimaryUuid(network.agentUUID, function (err, result) {
                    //console.log(result);
                    if (result && result.length > 0) {
                        profile.updateDevSetFromNetwork(network.agentUUID, devSet);
                        ssid.characterSet = 1;
                        ssid.broadcast = 0;
                        ssid.wmm = 0;
                        ssid.macAccessControl = 3;
                        ssid.authType = 0;
                        //这个不对，要传整个SSID的内容，不是list里的一个
                        //先注释了
                        // profile.updateSSIDFromNetwork(network.agentUUID, ssid,(err,result)=>{});
                    } else {
                        params.devSet = devSet;
                        params.ssid = ssid;

                        profile.createAGProfile(network.orgId, network._id, network.agentUUID, params, (err, result) => {
                            QueueC.addAgentQueue({common: common.taskType.common.createAGuuid}, network.agentUUID);
                        })
                    }
                })

            } else {
                profile.createAGProfile(network.orgId, network._id, network.agentUUID, (err, result) => {
                    QueueC.addAgentQueue({common: common.taskType.common.createAGuuid}, network.agentUUID);
                })
            }
        }

    })


}
;

function reencrptyProfilePass(aguuid, newaguuid, _profile) {
    if (_profile.ssid.list) {
        for (let i = 0; i < _profile.ssid.list.length; i++) {
            if (_profile.ssid.list[i].passPhrase) {
                _profile.ssid.list[i].passPhrase = util.decrptyMethod(aguuid, _profile.ssid.list[i].passPhrase);
                _profile.ssid.list[i].passPhrase = util.encrptyMethod(newaguuid, _profile.ssid.list[i].passPhrase);
            }
            if (_profile.ssid.list[i].userPwd) {
                for (let k = 0; k < _profile.ssid.list[i].userPwd.length; k++) {
                    if (_profile.ssid.list[i].userPwd[k].password) {
                        _profile.ssid.list[i].userPwd[k].password = util.decrptyMethod(aguuid, _profile.ssid.list[i].userPwd[k].password);
                        _profile.ssid.list[i].userPwd[k].password = util.encrptyMethod(newaguuid, _profile.ssid.list[i].userPwd[k].password);
                    }

                }
            }
        }
    }
    if (_profile.devSet && _profile.devSet.password) {
        _profile.devSet.password = util.decrptyMethod(aguuid, _profile.devSet.password);
        _profile.devSet.password = util.encrptyMethod(newaguuid, _profile.devSet.password);
    }
}

exports.copyFrom = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            let fromNetworkId = req.body.fromNetworkId;
            let toNetwork = req.body.toNetwork;
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t => t == toNetwork._id))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {
                profile.getProfileByNetworkId(fromNetworkId, (err, _profile) => {
                    if (_profile) {
                        reencrptyProfilePass(_profile.uuid, toNetwork.agentUUID, _profile.contents);
                        let fromId=_profile._id;
                        delete _profile._id;
                        _profile.uuid = toNetwork.agentUUID;
                        _profile.networkId = toNetwork._id;
                        profile.copyProfileByNetwork(toNetwork._id, _profile, function (err, data) {
                            //复制模板
                            profile.getProfileByNetworkId(toNetwork._id, (err, _profile) => {
                                BatchConfigC.copyLoginFiles(fromId.toString(),_profile,(err,result)=>{})
                            });
                            if (err) {
                                return res.json({success: false, error: err});
                            } else {

                                return res.json({success: true, data: data});
                            }
                        });
                    } else {
                        return res.json({success: false, error: err});
                    }

                })
            }
        }
    });

}

exports.listNetworks = function (req, res) {
    let opeUserId = req.opeUserId;
    let orgId = req.body.orgId;

    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            cwmNetworkC.listNetworks(orgId, opeUser, function (result) {
                return res.json(result);
            });
        }
    })

};

exports.listAllNetworks = function (req, res) {
    let orgId = req.body.orgId;
    cwmNetwork.findShortByOrgId(orgId, function (err, data) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
}

exports.listShortNetworks = function (req, res, next) {
    let orgId = req.body.orgId;
    let opeUserId = req.opeUserId;
    cwmNetworkC.listShortNetworks(orgId, function (result) {
        //  return res.json(result);
        db.User.getUserRoleById(opeUserId, function (err, opeUser) {
            if (err) {
                return res.json({success: false, err: err});
            } else {
                if (opeUser.role == "root admin" || opeUser.role == "root user") {
                    return res.json(result);
                } else {
                    for (let i = 0; i < result.data.length; i++) {
                        result.data[i].networks = result.data[i].networks.filter(function (value) {
                            return opeUser.privilege.find(t => t == value._id);
                        });
                    }
                    result.data = result.data.filter(function (item) {
                        return item.networks.length > 0;
                    });
                    return res.json(result);
                }
            }
        })
    });
};


exports.exportNetwork = function (req, res) {

    let networkId = req.body.networkId;
    let tempfile = "E:" + '/test.txt';
    writeFile(tempfile, 'Hello,how are you', function (err) {
        if (err)
            console.log("fail " + err);
        else
            res.download(tempfile, 'test.txt');
    });
};

function writeFile(file, content, callback) {
    // 测试用的中文
    // 把中文转换成字节数组
    var arr = iconv.encode(content, 'gbk');
    console.log(arr);
    // appendFile，如果文件不存在，会自动创建新文件
    // 如果用writeFile，那么会删除旧文件，直接写新文件
    fs.writeFile(file, arr, callback);
}

exports.delNetworks = function (req, res, next) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, err: -1});
            } else {
                cwmNetworkC.deleteNetwork(req.body.networkId, req.body.agentUUID, (err, result) => {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: result});
                    }
                })

            }
        }
    });

};

exports.generateUUID = function (req, res, next) {
    /* function s4() {
     let random = Math.floor((1 + Math.random()) * 0x10000).toString(16);
     return random.substring(1);
     }
     function s8() {
     let random = Math.floor((1 + Math.random()) * 0x100000000).toString(16);
     return random.substring(1);
     }
     let uuid = (s4() + "-" + s8() + "-" + s4() + "-" + s8() + "-" + s4()).toUpperCase();*/
    let objId = cwmNetwork.getObjectId().toString();
    let uuid = (objId.substr(0, 4) + "-" + objId.substr(4, 8) + "-" + objId.substr(12, 8) + "-" + objId.substr(20, 4)).toUpperCase();
    return res.json({success: true, data: uuid});

};

exports.exportNetworkProfile = function (req, res) {
    var network = req.body;
    Org.findOrgById(network.orgId, (err, org) => {
        if (!err && org) {
            let exportInfo = {
                AgentGroupUUID: network.agentUUID,
                NmsURL: org.devAccessAddress + ":" + org.devAccessPort,
                PeriodicMsgInterval: org.keepAlive
            };
            exportCWMFile(network.name, exportInfo, req, res);
        } else {
            return res.json({success: false, error: err});
        }

    })
};

exports.exportNetworkUUID = function (req, res) {
    var json = req.body;
    cwmNetworkC.exportAgentUUID(json.networkId, json.uuid, (err, data) => {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            exportCWMFile(data.alias, data.exportInfo, req, res);
        }
    });
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

    let macbuf = Buffer.from(macArr);
    macbuf.copy(burHeader, 2, 0, 6); //mac Address
    let timeX = microtime.nowStruct();
    burHeader.writeUIntLE(timeX[0], 8, 4); //timestamp second
    burHeader.writeUIntLE(timeX[1], 12, 4); //timestamp microsecond

    /*    var cipher = crypto.createCipher('aes-128-ctr', key);
     var encPayload = cipher.update(JSON.stringify(exportInfo), 'utf8', 'hex');//编码方式从utf-8转为hex;
     var enc = cipher.final('hex');//编码方式从转为hex;*/

    let hexKey = "0000000000000" + charArr[0] + charArr[1] + charArr[2] + charArr[3] + charArr[4] + charArr[5] + "0" + macStr.replace(new RegExp(":", "gm"), ""); //密钥
    //let hexIV = "0000" + charArr[0] + charArr[1] + charArr[2] + charArr[3] + charArr[4] + charArr[5] + timeX[0].toString() + timeX[1].toString();
    let hexIV = "0000" + macStr.replace(new RegExp(":", "gm"), "") + "0000000000000000";

    //let hexKey = "000000000000030848503402864C8853";
    //let hexIV = "00003402864C8853237B825A32810300";

    let key = Buffer.from(hexKey, "hex");
    let iv = Buffer.from(hexIV, "hex");
    /*let _tempbuf = new Buffer(charArr);
     _tempbuf.copy(iv, 2, 0, 6); //mac Address
     iv.writeUIntLE(timeX[0], 8, 4); //timestamp second
     iv.writeUIntLE(timeX[1], 12, 4); //timestamp microsecond*/

    iv.writeUIntLE(timeX[0], 8, 4); //timestamp second
    iv.writeUIntLE(timeX[1], 12, 4);

    console.log("key:", key);
    console.log("iv:", iv);
    console.log("json:", JSON.stringify(exportInfo));
    let ciphertext = encrypt(key, iv, JSON.stringify(exportInfo));
    console.log("ciphertext:", ciphertext);
    let plaintext = decrypt(key, iv, ciphertext);
    console.log("plaintext:", plaintext);

    //const bufPayload = Buffer.from(ciphertext);
    let bufPayload = Buffer.from(ciphertext, "hex");
    const bodylen = bufPayload.length;
    burHeader.writeUIntLE(bodylen, 0, 2);//payload lenght
    console.log("burHeader:", burHeader);
    var totalbuffer = Buffer.concat([burHeader, bufPayload]);
    let customer = `/userdata/config/customer`;
    if (!fs.existsSync(customer)) {
        fs.mkdirSync(customer);
    }
    var sz = /[/\\<>:?*\"|]/gi;//常见的特殊字符不够[]里面继续加
    if (alias.startsWith('.')) {
        alias = "_" + alias;
    }
    var removeStr = ['/', '\\', '<', '>', ':', '?', '*', '|', '"'];
    while (sz.test(alias)) {
        for (let i = 0; i < removeStr.length; i++) {
            alias = alias.replace(removeStr[i], "_");
        }
    }
    let filename = `/userdata/config/customer/${alias}.dat`;
    console.log(filename);
    fs.writeFile(filename, totalbuffer, function (err) {
        if (err) {
            //return res.json({success: false, error: err});
            console.log("------------------error--");
        } else {
            /*  fs.readFile(filename, function (err, chunk) {
                  if (err)
                      return console.error(err);

                  let bodyLen = chunk.readUInt16LE(0);
                  let charArr = [];
                  let macStr = "";
                  for (let i = 0; i < 6; i++) {
                      let mac = chunk.readUInt8(2 + i).toString(16).toUpperCase();
                      if (mac.length == 1) mac = "0" + mac;
                      charArr.push(mac.substring(0, 1));
                      macStr += mac;
                  }
                  let timeSecond = chunk.readUInt32LE(8);
                  let timeMiliSecond = chunk.readUInt32LE(12);
                  let payload = chunk.toString('hex', 16);
                  let hexKey = "0000000000000" + charArr[0] + charArr[1] + charArr[2] + charArr[3] + charArr[4] + charArr[5] + "0" + macStr; //密钥
                  let hexIV = "0000" + macStr + "0000000000000000";
                  let key = Buffer.from(hexKey, "hex");
                  let iv = Buffer.from(hexIV, "hex");
                  iv.writeUIntLE(timeSecond, 8, 4); //timestamp second
                  iv.writeUIntLE(timeMiliSecond, 12, 4);
                  //测试解密
                  let plaintext = decrypt(key, iv, payload);
                  console.log("decrypt:"+plaintext);
              });*/
            return res.download(filename, `${alias}.dat`);
        }
    });
}

exports.getSiteAndNetworkByOrg = function (req, res) {
    let orgId = req.body.orgId;
    let opeUserId = req.opeUserId;
    cwmNetworkC.getSiteAndNetworkByOrg(orgId, function (err, result) {
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
                        let len = result.length;
                        for (let i = len - 1; i >= 0; i--) {
                            result[i].networks = result[i].networks.filter(function (value) {
                                return opeUser.privilege.find(t => t == value._id);
                            });
                            if (result[i].networks.length == 0) {
                                result.splice(i, 1);
                            }
                        }

                        return res.json({success: true, data: result});
                    }
                }
            })
        }
    });
};
exports.getSiteByOrg = function (req, res) {
    let orgId = req.body.orgId;
    let opeUserId = req.opeUserId;
    cwmNetwork.getSiteAndNetworkByOrg(orgId, function (err, result) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            db.User.getUserRoleById(opeUserId, function (err, opeUser) {
                if (err) {
                    return res.json({success: false, err: err});
                } else {
                    if (opeUser.role == "root admin" || opeUser.role == "root user") {

                    } else {
                        let len = result.length;
                        for (let i = len - 1; i >= 0; i--) {
                            result[i].networks = result[i].networks.filter(function (value) {
                                return opeUser.privilege.find(t => t == value._id);
                            });
                            if (result[i].networks.length == 0) {
                                result.splice(i, 1);
                            }
                        }
                    }
                    let data = [];
                    for (let p of result) {
                        data.push(p._id);
                    }
                    return res.json({success: true, data: data});
                }
            })

        }
    });
};

exports.discoverByDDPv5 = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, err: -1});
            } else {
                let network = req.body;
                cwmDiscovered.removeDiscoveredDevices(network.agentUUID, function () {
                });
                QueueC.addDiscoverQueue(network);
                return res.json({success: true});
            }
        }
    });

};

exports.setAGProfile = function (req, res) {
    let devices = req.body.devices;
    let network = req.body.network;
    let authentic = req.body.authentic;
    let orgId = req.body.orgId;
    Org.findOrgById(orgId, function (err, org) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            let nmsURL = org.devAccessAddress + ":" + org.devAccessPort;
            authentic.authenticPassword = util.decrptyMethod(network.agentUUID, authentic.authenticPassword);
            for (let i = 0; i < devices.length; i++) {
                let device = devices[i];
                cwmDiscovered.update({_id: device._id}, {result: '{}'}, function (err, result) { //AG profile前清空状态
                    QueueC.setAGProfile(network, device, authentic, nmsURL, org.keepAlive);
                });
            }
            return res.json({success: true});
        }
    });
};

exports.getDiscoveredDevices = function (req, res) {
    let discoverTime = req.discoverTime;
    cwmDiscovered.findAll(function (err, data) {
        if (err) {
            return res.json({success: false, err: err});
        } else {

            return res.json({success: true, data: data});
        }
    });
};


