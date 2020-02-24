/**
 * Created by lizhimin on 2016/8/9.
 */
'use strict';
const async = require('async');
const util = require("../lib/util");
const db = util.db;
const common = util.common;
const Device = db.cwmDeviceManaged;
const QueueC = require("./taskQueue");
const Network = db.cwmNetwork;
const moment = require('moment');
const Org = db.cwmOrg;

function listManagedDevices(networkId, orgId, callback) {
    if (networkId) {
        Device.findByNetworkId(networkId, (err, rs) => {
            if (err) {
                return callback({success: false, error: err});
            } else {
                getDeviceStatus(rs, (device)=> {
                    return callback({success: true, data: device});
                })
            }
        });
    } else {
        Device.findByOrgId(orgId, (err, rs) => {
            if (err) {
                return callback({success: false, error: err});
            } else {
                getDeviceStatus(rs, (device)=> {
                    return callback({success: true, data: device});
                })

            }
        });
    }
};
function getDeviceStatus(devs, callback) {
    Org.findAll((err, result)=> {
        if (!err && result.length > 0) {
            let interval = result[0].keepAlive;
            let index = 1;
            var result = [];
            for (let dev of devs) {
                if (dev.hasOwnProperty('_doc')) {
                    dev = dev.toObject();
                }
                dev.index = index;
                index++;
                if (dev.status != common.userStatus.offline) {
                    //test for cs
                    changeDeviceStatus(dev, interval);
                }
                result.push(dev);
            }
        }
        callback(result);
    })

}
function changeDeviceStatus(dev, interval) {
    let time = moment(dev.lastUpdateTime);
    let time1 = moment().subtract(interval + 90, 'seconds');
    if (time1.isAfter(time)) {
        dev.status = common.userStatus.offline;
        Device.updateStatusByMac(dev.mac, 'offline', (err, result)=> {
        });
        return true;
    }
    return false;
}
function delIgnoredDevices(devs, uuid, callback) {
    Device.deleteIgnoreDevice(devs, function (err, data) {
        if (err) {
            callback(err);
        } else {
            //下发任务相关
            for (let dev of devs) {
                QueueC.addAgentCommonQueue({manage: common.taskType.manage.deleteIgnorDev}, uuid, dev);
            }

            callback(null, data);
        }
    })
}


//获取org下所有设备，通过network分类
function listDevicesByOrg(orgId, callback) {
    Network.findByOrgId(orgId, function (err, data) {
        if (err) {
            callback(err);
        } else {
            let networks = [];
            for (let d of data) {
                networks.push({networkId: d._id, networkName: d.name});
            }
            async.map(networks, (network, cb)=> {
                Device.findByNetworkId(network.networkId, function (err, data) {
                    if (err) {
                        cb(err);
                    } else {
                        let devices = [];
                        for (let d of data) {
                            devices.push({
                                _id: d._id,
                                name: d.name,
                                ip: d.ip,
                                networkName: network.networkName
                            })
                        }
                        network.devices = devices;
                        cb(null, network)
                    }
                })

            }, function (err, rs) {
                callback(err, rs);
            })
        }
    })
}


function getDevicesByOrgForWs(orgId, callback) {
    Device.findByOrgId(orgId, function (err, data) {
        if (err) {
            callback(err);
        } else {
            async.map(data, function (device, cb) {
                Network.findById(device.networkId, function (err, data) {
                    if (err) {
                        cb(err);
                    } else {
                        device.networkName = data.name;
                        cb(null, device);
                    }
                })
            }, function (err, data) {
                callback(err, data);
            })
        }
    })
}
module.exports = {
    changeDeviceStatus,
    listManagedDevices,
    delIgnoredDevices,
    listDevicesByOrg,
    getDevicesByOrgForWs,
}


