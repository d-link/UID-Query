/**
 * Created by lizhimin on 2017/12/7.
 */
'use strict';
const util = require("../lib/util");
const db = util.db;
const common = util.common;
const cwmDevice = db.cwmDeviceManaged;
const Org = db.cwmOrg;
const cwmQueueC = require('../cwmcontroller/taskQueue');
const async = require('async');
const moment = require('moment');
const cwmDeviceC = require('../cwmcontroller/device');
const cwmDeviceDetailC = require('../cwmcontroller/deviceDetail');

/**
 * 1、snmp显示发现设备和管理设备
 * 2、cwm显示管理设备
 * */
exports.listDeviceByManageType = function (req, res, next) {
    let orgId = req.body.orgId;
    let networkId = req.body.networkId;
    let type = req.body.manageType;
    cwmDeviceC.listManagedDevices(networkId, orgId, function (result) {
        return res.json(result);
    })
};

/**
 * 纳管设备
 * @param req
 * @param res
 * @param next
 */
exports.manageDevice = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin" && opeUser.role != "local admin") {
                return res.json({success: false, error: -1});
            } else {

                let manageDevs = req.body.manageDevs;
                let networkInfo = req.body.networkInfo;
                let networkId = networkInfo.networkId;
                let uuid = networkInfo.uuid;
                let curuuid = manageDevs[0].uuid;
                let devMacs = [];
                for (let dev of manageDevs) {
                    devMacs.push(dev.mac);
                }
                cwmDevice.reManageDevice(devMacs, networkId, uuid, (err, result)=> {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        //创建纳管任务
                        if (devMacs.length > 0) {
                            for (let dev of devMacs) {
                                getDeviceStatus(dev, {manage: common.taskType.manage.addManageDevs}, curuuid, uuid);
                            }
                        }
                        return res.json({success: true});
                    }

                })
            }
        }
    });

};

exports.listIgnoredDevice = function (req, res) {
    let networkId = req.body.networkId;
    cwmDevice.getIgnoreDeviceByNetworkId(networkId, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            let index = 1;
            for (let dev of data) {
                dev.index = index;
                index++;
            }
            return res.json({success: true, data: data});
        }
    })
};
//从纳管列表做ignore操作
exports.moveManagedDeviceToIgnore = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin" && opeUser.role != "local admin") {
                return res.json({success: false, error: -1});
            } else {

                let delDevs = req.body.devMacs;
                if (delDevs.length > 0) {
                    let devMacs = [];
                    let uuid = delDevs[0].uuid;
                    for (let dev of delDevs) {
                        devMacs.push(dev.devMac);
                    }
                    cwmDevice.ignoreDevice(devMacs, (err, data) => {
                        if (err) {
                            return res.json({success: false, error: err});
                        } else {
                            for (let dev of devMacs) {
                                getDeviceStatus(dev, {manage: common.taskType.manage.removeManagedDevs}, uuid);
                            }
                            return res.json({success: true});
                        }
                    });
                } else {
                    return res.json({success: true});
                }
            }
        }
    });

};
//ignore的设备删除
exports.delIgnoredDevices = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin" && opeUser.role != "local admin") {
                return res.json({success: false, error: -1});
            } else {

                let devMacs = req.body.devMacs;
                let uuid = req.body.uuid;
                Org.findAll((err, result)=> {
                    if (!err && result.length > 0) {
                        let interval = result[0].keepAlive;
                        cwmDevice.findDevInfoByMacs(devMacs, (err, devs)=> {
                            for (let dev of devs) {
                                if (dev && dev.status == common.userStatus.online) {
                                    let time = moment(dev.lastUpdateTime);
                                    let time1 = moment().subtract(interval + 90, 'seconds');
                                    if (!time1.isAfter(time)) {
                                        cwmQueueC.addAgentCommonQueue({manage: common.taskType.manage.deleteIgnorDev}, uuid, dev.mac);
                                    }
                                }
                            }
                            cwmDevice.deleteIgnoreDevice(devMacs, function (err, data) {
                                if (err) {
                                    return res.json({success: false, error: err});
                                } else {
                                    return res.json({success: true});
                                }
                            })
                        })

                    }
                })
            }
        }
    });

};

function getDeviceStatus(mac, taskType, uuid, newuuid) {
    Org.findAll((err, result)=> {
        if (!err && result.length > 0) {
            let interval = result[0].keepAlive;
            cwmDevice.findDevInfoByMac(mac, (err, dev)=> {
                if (dev && dev.status == common.userStatus.online) {
                    let time = moment(dev.lastUpdateTime);
                    let time1 = moment().subtract(interval + 90, 'seconds');
                    if (time1.isAfter(time)) {
                        dev.status = common.userStatus.offline;
                        cwmDevice.updateStatusByMac(dev.mac, common.userStatus.offline, (err, result)=> {
                        });
                    } else {
                        cwmQueueC.addAgentCommonQueue(taskType, uuid, dev.mac, newuuid);
                    }
                }
            })

        }
    })
}
exports.getDeviceByType = function (req, res) {
    let userId = req.body.userId;
    let devType = req.body.deviceType;
    let orgId = req.body.orgId;
    cwmDeviceC.getDeviceByType(devType, userId, orgId, (result) => {

        return res.json(result);
    });
};
exports.getDeviceById = function (req, res) {
    let devId = req.body.devId;
    Device.findById(devId, (err, result) => {
        if (!err)   return res.json({success: true, data: result});
        else return res.json({success: false, error: err});
    });
};

//获取所有设备的合计数量（纳管+未纳管）
exports.calcDevicesTotal = function (req, res) {
    cwmDevice.getDevicesTotal(function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data[0]});
        }
    });
};


//获取org下所有的设备
exports.getDevicesByOrg = function (req, res) {
    cwmDeviceC.getDevicesByOrgForWs(req.body.orgId, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    });
};


//获取org下所有设备，通过network和group分类
//cwm只分到network
exports.listDevicesByOrg = function (req, res) {
    let orgId = req.body.orgId;
    cwmDeviceC.listDevicesByOrg(orgId, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};

//返回所有devices，交前台判断；按workspace返回devices

exports.resetChannel5 = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {

                let devMac = req.body.devMac;
                let newChannel = req.body.newChannel;
                cwmDeviceDetailC.resetChannel5(devMac, newChannel, (err, data)=> {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                })
            }
        }
    });

}
exports.resetChannel5G2 = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {

                let devMac = req.body.devMac;
                let newChannel = req.body.newChannel;
                cwmDeviceDetailC.resetChannel5G2(devMac, newChannel, (err, data)=> {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                })
            }
        }
    });

}
exports.resetChannel24 = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {

                let devMac = req.body.devMac;
                let newChannel = req.body.newChannel;
                cwmDeviceDetailC.resetChannel24(devMac, newChannel, function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                })
            }
        }
    });

}

exports.resetPowerSetting24 = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {

                let devMac = req.body.devMac;
                let newPower = req.body.newPower;
                cwmDeviceDetailC.resetPowerSetting24(devMac, newPower, function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                })
            }
        }
    });

}
exports.resetPowerSetting5 = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {

                let devMac = req.body.devMac;
                let newPower = req.body.newPower;
                cwmDeviceDetailC.resetPowerSetting5(devMac, newPower, function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                })
            }
        }
    });

}
exports.resetPowerSetting5G2 = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {

                let devMac = req.body.devMac;
                let newPower = req.body.newPower;
                cwmDeviceDetailC.resetPowerSetting5G2(devMac, newPower, function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                })
            }
        }
    });

}

exports.resetSupplier = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {

                let devMac = req.body.devMac;
                cwmDevice.resetSupplier(devMac, req.body.supplierId, function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                })
            }
        }
    });

}

exports.resetLocation = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {

                let devMac = req.body.devMac;
                let newLocation = req.body.newLocation;
                cwmDeviceDetailC.resetLocation(devMac, newLocation, function (err, data) {
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
exports.resetName = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {

                let devMac = req.body.devMac;
                let newName = req.body.newName;
                cwmDeviceDetailC.resetName(devMac, newName, function (err, data) {
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
exports.reboot = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {

                let devMac = req.body.devMac;
                cwmDeviceDetailC.reboot(devMac, function (err, data) {
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
