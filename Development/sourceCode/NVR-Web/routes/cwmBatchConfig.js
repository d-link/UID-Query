/**
 * Created by lizhimin on 2017/12/8.
 */

'use strict';
const BatchConfigC = require("../cwmcontroller/batchConfig");
const regCheck = require("../lib/regCheck");
const util = require("../lib/util");
const db = require("../lib/util").db;
const cwmPasscode = db.cwmPasscode;
const async = require('async');
const validator = require('validator');
const path=require('path');
const filePathFilter=require("../middleware/filePathFilter");
var isUploadingFile = false;
exports.getProfileTree = function (req, res) {
    let orgId = req.body.orgId;
    let opeUserId = req.opeUserId;
    BatchConfigC.getProfileTree(orgId, opeUserId, function (err, result) {

        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: result});
        }
    });
};

exports.getProfileByNetworkId = function (req, res) {
    let orgId = req.body.orgId;
    let networkId = req.body.networkId;
    BatchConfigC.getProfileByNetwork(orgId, networkId, function (err, rs) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: rs});
        }
    });
};

exports.resetPVID = function (req, res) {
    let profileId = req.body.profileId;
    let pvid = req.body.pvid;
    BatchConfigC.updatePvid(profileId, pvid, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    });
}
exports.resetVLANStatus = function (req, res) {
    let opeUserId = req.opeUserId;
    let profileId = req.body.profileId;
    let status = req.body.status;
    if([0,1].indexOf(status) == -1){
        return res.json({success: false, error: "Request parameter validation failed"}); 
    }
    checkPrivilege(opeUserId, profileId, function (err) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            BatchConfigC.updateVlanStatus(profileId, status, function (err, data) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    return res.json({success: true, data: data});
                }
            });
        }
    });

}
exports.addVlan = function (req, res) {
    let opeUserId = req.opeUserId;
    let profileId = req.body.profileId;
    let vlan = req.body.vlan;
    if( !regCheck.checkVlanObject(vlan)){
        return res.json({success: false, error: "Request parameter validation failed"}); 
    }
    checkPrivilege(opeUserId, profileId, function (err) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            BatchConfigC.addVlan(profileId, vlan, function (err, data) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    return res.json({success: true, data: data});
                }
            });
        }
    });

};
exports.updateVlan = function (req, res) {

    let opeUserId = req.opeUserId;
    let profileId = req.body.profileId;
    let vlan = req.body.vlan;
    if( !regCheck.checkVlanObject(vlan)){
        return res.json({success: false, error: "Request parameter validation failed"}); 
    }
    checkPrivilege(opeUserId, profileId, function (err) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            BatchConfigC.updateVlanList(profileId, vlan, function (err, data) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    return res.json({success: true, data: data});
                }
            });
        }
    });
}
exports.delVlan = function (req, res) {

    let opeUserId = req.opeUserId;
    let profileId = req.body.profileId;

    checkPrivilege(opeUserId, profileId, function (err) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            let vlan = req.body.vlan;
            BatchConfigC.delVlan(profileId, vlan, function (err, data) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    return res.json({success: true, data: data});
                }
            });
        }
    });
};
exports.addProfile = function (req, res) {
    let profileModel = req.body;
    BatchConfigC.addProfile(profileModel, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    });
};
exports.deleteProfile = function (req, res) {
    let profileId = req.body.profileId;
    BatchConfigC.deleteProfile(profileId, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};
exports.saveSchedule = function (req, res) {

    let opeUserId = req.opeUserId;
    let profileId = req.body.profileId;

    checkPrivilege(opeUserId, profileId, function (err) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            let schedule = req.body.schedule;
            schedule.executeTime = new Date(schedule.executeTime).toISOString();
            schedule.scheduleStart = new Date(schedule.scheduleStart).toISOString();
            BatchConfigC.updateProfileSchedule(profileId, schedule, function (err, data) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    return res.json({success: true, data: data});
                }
            });
        }
    });

};
exports.clearSchedule = function (req, res) {

    let opeUserId = req.opeUserId;
    let profileId = req.body.profileId;

    checkPrivilege(opeUserId, profileId, function (err) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            BatchConfigC.clearProfileSchedule(profileId, function (err, data) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    return res.json({success: true, data: data});
                }
            });
        }
    });

}
exports.getProfileResult = function (req, res) {
    let profileId = req.body.profileId;
    BatchConfigC.getProfileResult(profileId, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};
exports.addBandwidthOptRule = function (req, res) {

    let opeUserId = req.opeUserId;
    let profileId = req.body.profileId;
    let bandwidth = req.body.bandwidth;
    if(!regCheck.checkBandWidthOptRule(bandwidth)){
        return res.json({success: false, error: "Request parameter validation failed"}); 
    }
    checkPrivilege(opeUserId, profileId, function (err) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            BatchConfigC.updateBandwidthOptRule(profileId, bandwidth, function (err, data) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    return res.json({success: true, data: data});
                }
            });
        }
    });

}
exports.updateDeviceSetting = function (req, res) {

    let opeUserId = req.opeUserId;
    let profileId = req.body.profileId;
    let aguuid = req.body.aguuid;
    let deviceSetting = req.body.deviceSetting;
    let settingCheck = regCheck.checkDeviceSetting(deviceSetting);
    if(!settingCheck.status){
        return res.json({success: false, error: `Request parameter validation failed: ${settingCheck.message}`});
    }
    checkPrivilege(opeUserId, profileId, function (err) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            if(deviceSetting && ! regCheck.passwordL1(util.decrptyMethod(aguuid, deviceSetting.password))){
                return res.json({success: false, error: "Privilege check failed"});
            }
            BatchConfigC.updateDeviceSetting(profileId, deviceSetting, function (err, data) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    return res.json({success: true, data: data});
                }
            });
        }
    });

}
exports.updatePerformance = function (req, res) {

    let opeUserId = req.opeUserId;
    let profileId = req.body.profileId;
    let performance = req.body.performance;
    if(!regCheck.checkPerformance(performance)){
        return res.json({success: false, error: "Request parameter validation failed"}); 
    }
    checkPrivilege(opeUserId, profileId, function (err) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            BatchConfigC.updatePerformance(profileId, performance, function (err, data) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    return res.json({success: true, data: data});
                }
            });
        }
    });

};
exports.updataWirelessSchedule = function (req, res) {

    let opeUserId = req.opeUserId;
    let profileId = req.body.profileId;
    let schedule = req.body.schedule;
    if(!regCheck.checkWirelessSchedule(schedule)){
        return res.json({success: false, error: "Request parameter validation failed"});
    }
    checkPrivilege(opeUserId, profileId, function (err) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            BatchConfigC.updataWirelessSchedule(profileId, schedule, function (err, data) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    return res.json({success: true, data: data});
                }
            });
        }
    });

}
exports.updateWlanPartition = function (req, res) {

    let opeUserId = req.opeUserId;
    let profileId = req.body.profileId;
    let wlanPartition = req.body.wlanPartition;
    if(!regCheck.checkWlanPartition(wlanPartition)){
        return res.json({success: false, error: "Request parameter validation failed"});
    }
    checkPrivilege(opeUserId, profileId, function (err) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            BatchConfigC.updateWlanPartition(profileId, wlanPartition, function (err, data) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    return res.json({success: true, data: data});
                }
            });
        }
    });

};
exports.updateWirelessResource = function (req, res) {

    let opeUserId = req.opeUserId;
    let profileId = req.body.profileId;
    let wirelessResource = req.body.wirelessResource;
    if(!regCheck.checkWirelessResource(wirelessResource)){
        return res.json({success: false, error: "Request parameter validation failed"});
    }
    checkPrivilege(opeUserId, profileId, function (err) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            BatchConfigC.updateWirelessResource(profileId, wirelessResource, function (err, data) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    return res.json({success: true, data: data});
                }
            });
        }
    });

};
exports.updateSSID = function (req, res) {
    let profileId = req.body.profileId;
    let ssid = req.body.ssid;
    let flag = req.body.flag;

    if(!regCheck.checkSSID(ssid)){
        return res.json({success: false, error: "Request parameter validation failed"});
    }

    function copy(obj1, obj2) {
        var obj2 = obj2 || {}; //最初的时候给它一个初始值=它自己或者是一个json
        for (var name in obj1) {
            if (typeof obj1[name] === "object") { //先判断一下obj[name]是不是一个对象
                obj2[name] = (obj1[name].constructor === Array) ? [] : {}; //我们让要复制的对象的name项=数组或者是json
                copy(obj1[name], obj2[name]); //然后来无限调用函数自己 递归思想
            } else {
                obj2[name] = obj1[name];  //如果不是对象，直接等于即可，不会发生引用。
            }
        }
        return obj2; //然后在把复制好的对象给return出去
    }

    db.cwmConfigProfile.findById(profileId,(err,profile)=> {

        if (flag == 'resave' || flag == 'resavesame' || flag == 'resavetosame') {
            let newssid = {},newssid1 = {};
            newssid = copy(ssid, newssid);
            newssid1 = copy(ssid, newssid1);
            let performanceTag = [0, 0, 0];
            if (profile.contents.performance.band24&&profile.contents.performance.band24.wirelessMode == 3&&(ssid.authentication==10||ssid.authentication==110)) {
                performanceTag[0] = 1;
            }
            if (profile.contents.performance.band5&&profile.contents.performance.band5.wirelessMode == 6&&(ssid.authentication==10||ssid.authentication==110)) {
                performanceTag[1] = 1;
            }
            if (profile.contents.performance.secBand5&&profile.contents.performance.secBand5.wirelessMode == 6&&(ssid.authentication==10||ssid.authentication==110)) {
                performanceTag[2] = 1;
            }
            if(performanceTag[0]||performanceTag[1]||performanceTag[2]){
                return res.json({success: false, error: -4,bandtags:performanceTag});
            }
            if (newssid.band == 1) {
                newssid.band = 2;
                newssid1.band = 3;
            }
            else if (newssid.band == 2) {
                newssid.band = 1;
                newssid1.band = 3;
            }else{
                newssid.band = 1;
                newssid1.band = 2;
            }
            return new Promise((resolve,reject)=>{
                BatchConfigC.checkSSIDTypeById(profile,[ssid, newssid,newssid1],(err,result)=>{
                    if(err) reject(err);
                    else{
                        resolve();
                    }
                });
            }).then(()=>{
                return new Promise((resolve,reject)=>{
                    BatchConfigC.checkACLLengthById(profile, [ssid, newssid,newssid1], (err, result)=> {
                        if(err) reject(err);
                        else{
                            resolve();
                        }
                    });
                })
            }).then(()=>{
                return new Promise((resolve,reject)=>{
                    BatchConfigC.updateSSID(profile, ssid, function (err, data) {
                        if(err) reject(err);
                        else{
                            resolve();
                        }
                    });
                })
            }).then(()=>{
                return new Promise((resolve,reject)=>{
                    BatchConfigC.updateSSID(profile, newssid, function (err, data) {
                        if(err) reject(err);
                        else{
                            resolve();
                        }
                    });
                })
            }).then(()=>{
                BatchConfigC.updateSSID(profile, newssid1, function (err, data) {
                    if(err)  return res.json({success: false, error: err});
                    else{
                        return res.json({success: true, data: data});
                    }
                });
            }).catch((err)=>{
                return res.json({success: false, error: err});
            })

        } else {
            BatchConfigC.checkSSIDTypeById(profile,[ssid],(err,result)=> {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    BatchConfigC.checkACLLengthById(profile, [ssid], (err, result)=> {
                        if (err) {
                            return res.json({success: false, error: err});
                        } else {

                            BatchConfigC.updateSSID(profile, ssid, function (err, data) {
                                if (err) {
                                    return res.json({success: false, error: err});
                                } else {
                                    return res.json({success: true, data: data});
                                }
                            });
                        }
                    });
                }
            });
        }
    })

};
exports.addSSID = function (req, res) {

    let opeUserId = req.opeUserId;
    let profileId = req.body.profileId;
    let ssid = req.body.ssid;
    let flag = req.body.flag;
    if(!regCheck.checkSSID(ssid)){
        return res.json({success: false, error: "Request parameter validation failed"});
    }
    checkPrivilege(opeUserId, profileId, function (err) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            if(ssid.ssid==''){
                return res.json({success: false});
            }else{
                BatchConfigC.addSSID(profileId, ssid, flag, function (err, data,bandtags) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data,bandtags:bandtags});
                    }
                });
            }
        }
    });

};
exports.delSSID = function (req, res) {

    let opeUserId = req.opeUserId;
    let profileId = req.body.profileId;

    checkPrivilege(opeUserId, profileId, function (err) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            let ssid = req.body.ssid;
            BatchConfigC.delSSID(profileId, ssid, function (err, data) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    return res.json({success: true, data: data});
                }
            });
        }
    });

};

exports.uploadLoginFile = function (req, res) {
    BatchConfigC.uploadLoginFile(req, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            /*  BatchConfigC.getLoginFiles(req.body.profileId,function (err, data) {
             if (err) {
             return res.json({success: false, error: err});
             } else {
             return res.json({success: true, data:data});
             }
             });*/
            return res.json({success: true, data: data});
        }
    });
};
exports.downloadLoginFile = function (req, res) {
    let name =validator.escape(req.body.name);
    let id = req.body._id;
    //let _path =path.resolve(req.body.downPath) ;
    let _path =path.resolve(filePathFilter(req.body.downPath));
    BatchConfigC.downloadLoginFiles(_path, id, (err)=> {
        if (!err) {
            return res.download(_path, `${name}.tar`);
        } else {

            return res.json({success: false});
        }
    })

};
exports.getLoginFiles = function (req, res) {
    let profileId = req.body.profileId;
    BatchConfigC.getLoginFiles(profileId, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    });
};
exports.deleteLoginFiles = function (req, res) {
    let loginFile = req.body.LoginFile;
    let profileId = req.body.profileId;
    BatchConfigC.deleteLoginFiles(loginFile, profileId, function (err, data) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            BatchConfigC.getLoginFiles(profileId, function (err, data) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    return res.json({success: true, data: data});
                }
            });
        }
    });
};
exports.uploadWhiteList = function (req, res) {
    BatchConfigC.uploadWhiteList(req, function (err, data) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            return res.json({success: true, data: data});
        }
    });
};
exports.uploadMacList = function (req, res) {
    BatchConfigC.uploadMacList(req, function (err, data) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            return res.json({success: true, data: data});
        }
    });
};
exports.downloadMacList = function (req, res) {
    let macList = req.body.macList;
    BatchConfigC.downloadMacList(macList, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.download(data, `macList.txt`); //mac地址不能一样，
        }
    });

};
exports.downloadWhiteList = function (req, res) {
    let macByPass = req.body.macByPass;
    BatchConfigC.downloadWhiteList(macByPass, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.download(data, `whiteList.txt`); //mac地址不能一样，
        }
    });
};

//Firmware upgrade
exports.getFWTree = function (req, res) {
    let orgId = req.body.orgId;
    let opeUserId = req.opeUserId;
    BatchConfigC.getFWTree(orgId, opeUserId, function (err, rs) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: rs});
        }
    });
}
exports.getFwInfo = function (req, res) {
    let orgId = req.body.orgId;
    let networkId = req.body.networkId;
    let operateType = 'fwUpgrade';
    BatchConfigC.getFwInfo(orgId, networkId, operateType, function (err, rs) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: rs});
        }
    });
};
exports.getFwResult = function (req, res) {
    let orgId = req.body.orgId;
    let networkId = req.body.networkId;
    if (networkId) {
        BatchConfigC.getFwResult(orgId, networkId, function (err, data) {
            if (err) {
                return res.json({success: false, error: err});
            } else {
                return res.json({success: true, data: data});
            }
        });
    } else {
        return res.json({success: false});
    }
};
exports.getFwUploadStatus = function (req, res) {
    if (isUploadingFile) {
        return res.json({success: true, data: 1});
    } else {
        return res.json({success: true, data: 0});
    }
};
exports.upLoadFwFile = function (req, res) {
    res.connection.setTimeout(0); //防止超时2分钟后node断开请求而浏览器会重新请求，导致upLoadFile重复执行
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {
                if(isUploadingFile){
                    return res.json({success: false, error: -2});
                }
                isUploadingFile = true;
                BatchConfigC.upLoadFwFile(req, function (err, data) {
                    isUploadingFile = false;
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                });
            }
        }
    });

};
exports.removeFwFile = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {

                BatchConfigC.removeFwFile(req, function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                });
            }
        }
    });
}
exports.updateFwOper = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {

                let fw = req.body;
                fw.operateType = 'fwUpgrade';
                BatchConfigC.updateOperateByType(fw, 'fwUpgrade', function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                });
            }
        }
    });

};
exports.clearFwOperSchedule = function (req, res) {
    let opeUserId = req.opeUserId;
    let networkId = req.body.networkId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {
                BatchConfigC.clearFwOperSchedule(networkId, function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                });
            }
        }
    });

};
exports.getSSLCerInfo = function (req, res) {
    let orgId = req.body.orgId;
    let networkId = req.body.networkId;
    let operateType = 'sslCertificate';
    BatchConfigC.getSSLCerInfo(orgId, networkId, operateType, function (err, rs) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: rs});
        }
    });
}
exports.uploadSSLCerInfo = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {

                BatchConfigC.uploadSSLCerInfo(req, function (err, cert) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        cert.operateType = 'sslCertificate';

                        BatchConfigC.updateOperateByType(cert, 'sslCertificate', function (err, data) {
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
exports.getSSLResult = function (req, res) {
    let orgId = req.body.orgId;
    let networkId = req.body.networkId;
    if (networkId) {
        BatchConfigC.getSSLResult(orgId, networkId, function (err, data) {
            if (err) {
                return res.json({success: false, error: err});
            } else {
                return res.json({success: true, data: data});
            }
        });
    } else {
        return res.json({success: false});
    }
}
exports.updateRFOpt = function (req, res) {

    let opeUserId = req.opeUserId;
    let profileId = req.body.profileId;
    let rfOpt = req.body.rfOpt;
    if(!regCheck.checkRFOptimization(rfOpt)){
        return res.json({success: false, error: "Request parameter validation failed"});
    }
    checkPrivilege(opeUserId, profileId, function (err) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            BatchConfigC.updateRFOpt(profileId, rfOpt, function (err, data) {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    return res.json({success: true, data: data});
                }
            });
        }
    });

}
exports.getPasscodeByUUID = function (req, res) {
    let uuid = req.body.uuid;
    let ssid = req.body.ssid;
    cwmPasscode.getPasscodeByUUIDSSID(uuid, ssid, (err, result)=> {
        if (err) {
            return res.json({success: false, error: err});
        } else {
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
                    return res.json({success: false, error: err});
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
                    return res.json({success: true, data: result});
                }
            });

        }
    })
}

function checkPrivilege(opeUserId, profileId, callback) {
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            callback(err);
        } else {
            if (opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                callback(err);
            } else if (opeUser.role == "local admin" && opeUser.privilege) {
                db.cwmConfigProfile.findById(profileId, function (err, profile) {
                    if (err) {
                        callback(err);
                    } else if (profile && opeUser.privilege.find(t=>t == profile.networkId)) {
                        callback(null);
                    } else {
                        callback(-1);
                    }
                })
            } else {
                callback(null);
            }
        }
    });
}