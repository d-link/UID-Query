/**
 * Created by chencheng on 17-11-22.
 *
 * API for frontDesk configuration
 */
'use strict';
var ipp = require('ipp');
var PDFDocument = require('pdfkit');
var blobStream = require('blob-stream');
var path = require('path');
var fs = require('fs');
const async = require('async');
const db = require("../lib/util").db;
const cwmPasscode = db.cwmPasscode;
const cwmConfigProfile = db.cwmConfigProfile;
//添加更新passcode
exports.Generate = function (req, res) {
    cwmPasscode.updatePasscode(req, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true});
        }
    });
};

//passcode生成
function GeneratePassCode(len, radix) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = [], i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
        // rfc4122, version 4 form
        var r;

        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random() * 16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }
    return uuid.join('');
}

//key: uuid, ssid, passcode, 数据库添加passcode记录
exports.createPassCode = function (req, res) {
    var arr = [];
    var arrPassCode = [];
    var strPassCode;
    db.User.findById(req.opeUserId,(err,user)=>{
        let userName="";
        if(user){
            userName=user.username;
        }
        for (let i = 0; i < req.body.passcodeQuantity; i++) {
            strPassCode = GeneratePassCode(8, 10);
            arrPassCode.push(strPassCode);
            arr.push({
                uuid: req.body.uuid, //ag uuid
                passcode: strPassCode,
                ssid: req.body.ssid,// ssid
                duration: req.body.duration, //单位：分钟。
                durationType: req.body.durationType,
                connectionLimit: req.body.connectionLimit, // 限制同时连接的个数。CAT中个数。CAT清除。    usedCount：Number,
                activeTime: null,//激活时间
                lastActiveTime: req.body.lastActiveTime,//最后激活时间。如果没有被激活，超过这个时间就不能再激活。
                clientMacAddressList: [],
                creator:req.opeUserId,
                creatorName: userName
            });
        }
        cwmPasscode.createManyPasscode(arr, function (err, data) {
            if (err) {
                return res.json({success: false, error: err});
            } else {
                return res.json({success: true, passCode: arrPassCode});
            }
        });
    })

};

exports.updatePassCode = function (req, res) {
    cwmPasscode.updatePasscodeById(req.body, function (err, result) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true});
        }
    });
};
//key: uuid, ssid, passcode, 数据库删除passcode记录
exports.deletePasscode = function (req, res) {
    let query = req.body;
    cwmPasscode.deletePasscode(query, function (err, result) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true});
        }
    });
};
//key: uuid, ssid, passcode,数据库查找passcode记录
exports.findPasscode = function (req, res) {

    let opeUserId = req.opeUserId;
    getUUid(opeUserId, function (err, arr) {
        if (err) {
            return res.json({success: false, error: err});
        } else {

            let param = req.body;
            if (!param.uuid)
                param.uuid = {$in: arr};

            cwmPasscode.findPasscode(param, function (err, result1) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {

                    if (param.purchaseTime || param.paypalAccount || param.purchaseStation) {
                        db.cwmPasscodeOrder.findOrders(param, function (err, result2) {
                            if (err) {
                                return res.json({success: false, error: err});
                            } else {

                                let result = [];
                                for (let i = result1.length - 1; i >= 0; i--) {
                                    let find = result2.find(function (item) {
                                        return item.passcode == result1[i].passcode;
                                    });
                                    if (find) {
                                        result1[i].purchaseStation = find.purchaseStation;
                                        result1[i].purchaseTime = find.purchaseTime;
                                        result1[i].PayerID = find.PayerID;
                                        result.push(result1[i]);
                                    }
                                }

                                getDetail(result, function (err, data) {
                                    if (err) {
                                        return res.json({success: false, error: err});
                                    } else {
                                        return res.json({success: true, data: data});
                                    }
                                });
                            }
                        });

                    } else {
                        db.cwmPasscodeOrder.findAll(function (err, result2) {
                            if (err) {
                                return res.json({success: false, error: err});
                            } else {
                                for (let i = result1.length - 1; i >= 0; i--) {
                                    let find = result2.find(function (item) {
                                        return item.passcode == result1[i].passcode;
                                    });
                                    if (find) {
                                        result1[i].purchaseStation = find.purchaseStation;
                                        result1[i].purchaseTime = find.purchaseTime;
                                        result1[i].PayerID = find.PayerID;
                                    }
                                }

                                getDetail(result1, function (err, data) {
                                    if (err) {
                                        return res.json({success: false, error: err});
                                    } else {
                                        return res.json({success: true, data: data});
                                    }
                                });
                            }
                        });
                    }


                }
            });
        }
    });

};

function getDetail(result, callback) {
    async.map(result, (passcode, callback) => {
        db.User.findByUserId(passcode.creator, function (err, user) {
            if (err) {
                callback(err)
            } else {
                if (user) {
                    passcode.creator = user.username;
                }else{
                    passcode.creator=passcode.creatorName;
                }
                callback(null);
            }
        });
    }, function (err) {
        if (err) {
            callback(err);
        } else {
            let current = new Date().getTime();
            for (let i = 0; i < result.length; i++) {
                if (result[i].activeTime && result[i].activeTime != 0) {
                    result[i].remain = result[i].activeTime + result[i].duration * 60 * 1000 - current;
                    if (result[i].remain > 0) {
                        result[i].status = "active";

                    } else {
                        result[i].status = "usedOut";
                    }
                } else if (result[i].lastActiveTime < current) {
                    result[i].status = "overdue";

                } else {
                    result[i].status = "inactive";
                }
            }
            result.sort((a, b)=> {
                if (a._id < b._id) return 1;
                if (a._id > b._id) return -1;
                return 0;
            })
            callback(null, result);
        }
    });
}

function getUUid(opeUserId, callback) {
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            callback(err);
        } else {
            db.cwmNetwork.findUuidById(opeUser.privilege, function (err, uuids) {
                if (err) {
                    callback(err);
                } else {
                    let arr = [];
                    for (let i = 0; i < uuids.length; i++) {
                        arr.push(uuids[i].agentUUID);
                    }
                    callback(null, arr);
                }
            });
        }
    });
}


//读配置文件
exports.readFdConfig = function (req, res) {
    let filePath = path.join(process.cwd(), req.body.filePath);
    fs.readFile(filePath, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        }
        return res.json({success: true, data: data.toString()});
    });
};
//写配置文件
exports.writeFdConfig = function (req, res) {
    let filePath = path.join(process.cwd(), req.body.filePath);
    let data = req.body.data;
    fs.writeFile(filePath, data, function (err) {
        if (err) {
            return res.json({success: false, error: err});
        }
        return res.json({success: true});
    });
};
//获取SSID by UUID
exports.getSSIDByUUID = function (req, res) {
    let uuid = req.body.uuid;
    cwmConfigProfile.getApplyedPasscodeAuthSSIDByUUID(uuid, function (err, result) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: result});
        }
    });
};
//判断passcode记录是否存在
exports.passcodeIsExist = function (req, res) {
    let code = req.body.passcode;
    cwmPasscode.findOnePasscode(code, function (err, result) {
        if (err) {
            return {success: false, error: err};
        } else {
            if (result == null) {
                return res.json({success: true, exist: false});
            } else {
                return res.json({success: true, exist: true});
            }
        }
    });
};
exports.findOrdersByPasscode = function (req, res) {
    let param = req.body;
    db.cwmPasscodeOrder.findOrdersByPasscode(param, function (err, result) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: result});
        }
    });
}