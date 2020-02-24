/**
 * Created by mp on 2016/3/15.
 */
'use strict';
const async = require('async');
const db = require("../lib/util").db;
const common = require("../lib/util").common;
const Org = db.cwmOrg;
const License = db.cwmLicense;
const Network = db.cwmNetwork;
const Device = db.cwmDeviceManaged;
const Notification = db.cwmNotifyAlert;
const SystemEvent = db.cwmSystemEventLog;
const User = db.User;

exports.findOrgByName = function (name, callback) {
    Org.findOrgByName(name, (err, data)=> {
        if (err || !data) {
            callback(err);
        } else {
            callback(null, data);
        }
    })
};

exports.getHotApMap = function (mapId, callback) {
    db.cwmHotapmap.findById(mapId, function (err, map) {
        if (err) {
            callback(err);
        } else {
            async.map(map.devices, (device, callback) => {
                db.cwmDeviceManaged.findNameByDevMac(device.apMACAddr, function (err, d) {
                    if (d) {
                        device.name = d.name;
                        device.location = d.location;
                    }
                    callback();
                });
            }, function () {
                callback(null, map);
            });
        }
    });
}

/**
 * 读取用户有权限的Org基本信息
 * @param userId String
 * @param callback Function(err,arr)
 */
exports.getOrgsByUserId = function (orgId, userId, callback) {
    if (typeof callback != 'function') return;
    if (userId != '') {
        new Promise((resolve, reject)=> {
            User.findById(userId, (err, data)=> {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            })
        }).then(user=> {
            if (user.right) {
                let len = user.right.length;
                let right = user.right.find((_right)=> {
                    if (_right.privilegeStatus = common.userStatus.enabled) {
                        if (orgId == '' || (orgId != '' && _right.orgId == orgId)) {
                            return true;
                        }
                    }
                    return false;

                });
                if (right) {
                    new Promise((resolve, reject)=> {
                        Org.findOrgById(right.orgId, (err, org)=> {
                            if (err) {
                                reject(err);
                            } else {
                                if (org) {
                                    right.name = org.name;
                                    right.logo = org.logo;
                                    right.smtpServer = org.smtpServer;
                                }
                                resolve(right);
                            }
                        })
                    }).then((right)=> {
                        Network.findCountByOrgId(right.orgId, function (err, network) {
                            if (err) {
                                callback({success: false});
                            } else {
                                if (network && network.length > 0) {
                                    right.networkCount = network.length;
                                    right.nodeCount = 0;
                                } else {
                                    right.networkCount = 0;
                                    right.nodeCount = 0;
                                }
                                /*测试数据*/
                                right.notifications = {Critical: 207, Warning: 54, Info: 6};

                                callback({success: true, data: right});
                            }
                        })
                    });
                } else {
                    callback({success: true, data: right});
                }
            }
        }, (err)=> {
            console.error_log();
        });
    }
};
function getNetworkCount(orgId) {
    Network.findCountByOrgId(param.orgId, function (err, network) {

    });
}

exports.getOrgsDetailByUserId = function (userId, callback) {
    if (typeof callback != 'function') return;
    if (userId != '') {
        let rights = [];
        User.findById(userId, function (err, teams) {
            if (!err && teams) {
                async.map(teams.right, function (right, callback) {
                    if (right.product == 'cwm' && right.privilegeStatus == common.userStatus.enabled) {
                        async.waterfall([
                                function (callback) {
                                    Org.findOrgById(right.orgId, function (err, org) {
                                        if (err) {
                                            callback(err)
                                        }
                                        if (org) {
                                            right.name = org.name;
                                            right.logo = org.logo;
                                            right.nmsUrl = org.nmsUrl;
                                            right.keepAlive = org.keepAlive;
                                            right.smtpServer = org.smtpServer;
                                            right.payment = org.payment;
                                        }
                                        callback(null, right);
                                    });
                                },
                                function (right, callback) {
                                    Network.findCountByOrgId(right.orgId, function (err, network) {
                                        if (err) {
                                            callback(err)
                                        }
                                        if (network) {
                                            right.networkCount = network.length;
                                        } else {
                                            right.networkCount = 0;
                                        }
                                        Notification.getGroupNotifyByOrg(right.orgId, (err, _event)=> {
                                            if (err) {
                                                callback(err)
                                            }
                                            right.notifications = {Critical: 0, Warning: 0, Info: 0, SystemEvent: 0};
                                            if (_event) {
                                                _event.forEach((_ev)=> {
                                                    right.notifications[_ev._id] = _ev.count;
                                                })
                                            }
                                            SystemEvent.getEventCount(right.orgId, (err, eventCount)=> {
                                                if (err) {
                                                    callback(err)
                                                }
                                                right.notifications['SystemEvent'] = eventCount;
                                                callback(null, right);
                                            })
                                        });
                                    })
                                },
                                function (right, callback) {
                                    //纳管设备数
                                    Device.getCountByOrgId(right.orgId, function (err, node) {
                                        if (err) {
                                            callback(err)
                                        }
                                        else {
                                            let online = 0, offline = 0;
                                            for (let t in node) {
                                                if (node[t]._id == "online") {
                                                    online = node[t].count;
                                                }
                                                if (node[t]._id == "offline") {
                                                    offline = node[t].count;
                                                }
                                            }

                                            right.onlineCount = online;
                                            right.nodeCount = offline + online;
                                            callback(null, right);
                                        }

                                    })
                                }],
                            function (err, right) {
                                if (err) {
                                    callback(err)
                                } else {
                                    rights.push(right);
                                    callback(null, right);
                                }
                            })
                    } else {
                        callback(null, right);
                    }
                }, function (err, rs) {
                    if (!err) {
                        if (rights.length > 0) {
                            callback({success: true, data: rights});
                        } else {
                            callback({success: false, error: 1})
                        }
                    }
                    else {
                        callback({success: false, error: 1});
                    }
                })
            }
        });
    } else {
        callback({success: false, error: ''});
    }
};

/*exports.getOrgsDetailByUserId = function (userId, callback) {
 if (typeof callback != 'function') return;
 if (userId != '') {
 User.findById(userId, function (err, data) {
 //let right = data.right;
 async.map(data.right, function (right, callback) {
 let orgId = right.orgId;
 let privilegeLevel = right.right;
 Org.findOrgById(right.orgId, function (err, org) {
 if (org) {
 right.name = org.name;
 right.logo = org.logo;
 right.smtpServer = org.smtpServer;
 }
 callback(err, right);
 })
 });
 });
 } else {
 callback({success: false, error: ''});
 }
 };*/


/*
 exports.testSMTP = function (smtpServer, toEmail, callback) {
 mailer.sendTestMail(smtpServer, toEmail, function (err, result) {
 if (err)
 return callback({success: false, error: err});
 else {
 return callback({success: true});
 }
 });
 };*/
