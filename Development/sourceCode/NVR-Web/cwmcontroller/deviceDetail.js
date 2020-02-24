/**********************************************
 * this file is part of DView8 Common Project
 * Copyright (C)2015-2020 D-Link Corp.
 *
 * Author       : HuiMiaomiao
 * Mail         : Miaomiao.Hui@cn.dlink.com
 * Create Date  : 2017/9/13
 * Summary      :
 *
 **********************************************/
'use strict';
const util = require("../lib/util");
const db = util.db;
const common = util.common;
const Org = db.cwmOrg;
const Device = db.cwmDeviceManaged;
const Network = db.cwmNetwork;
const ConfigProfile = db.cwmConfigProfile;
const cwmClient = db.cwmClientHistory;
const QueueC = require("./taskQueue");
const DeviceC = require('./device');
const moment = require('moment');
const async = require('async');

function transferDeviceServerData(dev) {
    if (!dev.server) {
        dev.server = {};
        dev.server.channel24Ghz = dev.channel24Ghz;
        dev.server.channel5Ghz = dev.channel5Ghz;
        dev.server.channel5Ghz2 = dev.channel5Ghz2;
        dev.server.power24Ghz = dev.power24Ghz;
        dev.server.power5Ghz = dev.power5Ghz;
        dev.server.power5Ghz2 = dev.power5Ghz2;
        dev.server.name = dev.name;
        dev.server.location = dev.location;
        Device.saveServerData(dev.mac, dev.server, (err, result)=> {
        });

    } else {
        if (!dev.server.channel24Ghz)  dev.server.channel24Ghz = dev.channel24Ghz;
        if (!dev.server.channel5Ghz) dev.server.channel5Ghz = dev.channel5Ghz;
        if (!dev.server.channel5Ghz2)dev.server.channel5Ghz2 = dev.channel5Ghz2;
        if (!dev.server.power24Ghz || dev.server.power24Ghz == 'default')dev.server.power24Ghz = dev.power24Ghz;
        if (!dev.server.power5Ghz || dev.server.power5Ghz == 'default')dev.server.power5Ghz = dev.power5Ghz;
        if (!dev.server.power5Ghz2 || dev.server.power5Ghz2 == 'default')dev.server.power5Ghz2 = dev.power5Ghz2;
        if (dev.server.name==undefined)dev.server.name = dev.name;
        if (dev.server.location==undefined) dev.server.location = dev.location;
    }

}
//获取设备的基本信息
exports.getDeviceInfo = function (devId, callback) {
    Device.findById(devId, function (err, devInfo) {
        if (err || !devInfo) {
            callback(err);
        } else {
            transferDeviceServerData(devInfo);
            if(!devInfo.channelList24Ghz)devInfo.channelList24Ghz=[];
            devInfo.channelList24Ghz.splice(0, 0, 0);
            if(!devInfo.channelList5Ghz)devInfo.channelList5Ghz=[];
            devInfo.channelList5Ghz.splice(0, 0, 0);
            if(!devInfo.channelList5Ghz2)devInfo.channelList5Ghz2=[];
            devInfo.channelList5Ghz2.splice(0, 0, 0);
            Network.findNetworkByAgentUUID(devInfo.uuid, function (err, net) {
                if (err) {
                    callback(err)
                }
                else {
                    devInfo.network = net.name;
                    callback(null, devInfo);
                }
            });
        }
    })
};


exports.updateDeviceInfo = function (devMac, serverData, callback) {
    Device.getServerData(devMac, function (err, data) {
        if (err) {
            callback(err)
        } else {
            if (data) {
                if (!data.server) data.server = {};
                serverData.channel24Ghz = parseInt(serverData.channel24Ghz);
                serverData.channel5Ghz = parseInt(serverData.channel5Ghz);
                serverData.channel5Ghz2 = parseInt(serverData.channel5Ghz2);
                if (data.server.channel24Ghz != serverData.channel24Ghz || data.server.channel5Ghz != serverData.channel5Ghz || data.server.channel5Ghz2 != serverData.channel5Ghz2) {
                    let update = [];
                    if (data.server.channel24Ghz != serverData.channel24Ghz) {
                        Device.resetChannel24(devMac, serverData.channel24Ghz, (err, result)=> {
                        });
                        update.push('channel24Ghz');
                    }
                    if (data.server.channel5Ghz != serverData.channel5Ghz) {
                        Device.resetChannel5(devMac, serverData.channel5Ghz, (err, result)=> {
                        });
                        update.push('channel5Ghz');
                    }
                    if (data.server.channel5Ghz2 != serverData.channel5Ghz2) {
                        Device.resetChannel5G2(devMac, serverData.channel5Ghz2, (err, result)=> {
                        });
                        update.push('channel5Ghz2');
                    }
                    if (data.status == common.userStatus.online) {
                        data.mac = devMac;
                        getDeviceStatus(data, common.operateType.setApChannelNum, update);
                    }
                }
                if (data.server.power24Ghz != serverData.power24Ghz || data.server.power5Ghz != serverData.power5Ghz || data.server.power5Ghz2 != serverData.power5Ghz2) {
                    let update = [];
                    if (data.server.power24Ghz != serverData.power24Ghz) {
                        Device.resetPower24(devMac, serverData.power24Ghz, (err, result)=> {
                        });
                        update.push('power24Ghz');
                    }
                    if (data.server.power5Ghz != serverData.power5Ghz) {
                        Device.resetPower5(devMac, serverData.power5Ghz, (err, result)=> {
                        });
                        update.push('power5Ghz');
                    }
                    if (data.server.power5Ghz2 != serverData.power5Ghz2) {
                        Device.resetPower5G2(devMac, serverData.power5Ghz2, (err, result)=> {
                        });
                        update.push('power5Ghz2');
                    }
                    if (data.status == common.userStatus.online) {
                        data.mac = devMac;
                        getDeviceStatus(data, common.operateType.setApPower, update);
                    }
                }
                if (data.server.location != serverData.location) {
                    resetLocation(devMac, serverData.location, function (err, data) {

                    });
                }
                if (data.server.name != serverData.name) {
                    resetName(devMac, serverData.name, function (err, data) {

                    });
                }
                if (data.supplierId != serverData.supplierId) {
                    db.cwmDeviceManaged.resetSupplier(devMac, serverData.supplierId, function (err, data) {
                    })
                }
                callback(null, null);

            } else {
                callback(null, null);
            }

        }
    })
};

exports.getClientsInfo = function (devMAC, callback) {
    cwmClient.getClientInfosByAPMAC(devMAC, (err, result)=> {
        let index = 1;
        let clients = [];
        for (let client of result) {
            if (client.hasOwnProperty('_doc')) {
                client = client.toObject();
            }
            client.index = index;
            clients.push(client);
            index++;
        }
        callback(err, clients);
    })
}

exports.getSupplierInfo = function(supplierId, callback) {
    db.cwmSuppliers.findById(supplierId, (err, result)=> {
        if (err) {
            callback(err, null);
        } else {
            callback(err, result);
        }
    });
}

function getDeviceStatus(dev, operType, subType) {
    Org.findAll((err, result)=> {
        if (!err && result.length > 0) {
            let interval = result[0].keepAlive;
            if (dev.status == common.userStatus.online) {
                //test for cs
                if (!DeviceC.changeDeviceStatus(dev, interval)) {
                    if(operType == common.operateType.reboot){
                        Device.setRebootProcessing(dev.mac,true,(err,result)=>{

                        })
                    }
                    QueueC.addDAPTempTaskQueue(dev.mac,dev.uuid, operType, subType);
                }
            }
        }
    })
}
function resetChannel5(devMac, newChannel, callback) {
    Device.getServerData(devMac, function (err, data) {
        newChannel = parseInt(newChannel);
        if (!data.server || data.server.channel5Ghz != newChannel) {
            Device.resetChannel5(devMac, newChannel, (err, result)=> {
                if (!err && result) {
                    if (data.status == common.userStatus.online) {
                        getDeviceStatus(data, common.operateType.setApChannelNum, ['channel5Ghz']);
                    }

                }
                callback(err, result);
            })
        } else {
            callback(err, null);
        }

    });
}
function resetChannel5G2(devMac, newChannel, callback) {
    Device.getServerData(devMac, function (err, data) {
        newChannel = parseInt(newChannel);
        if (!data.server || data.server.channel5Ghz2 != newChannel) {
            Device.resetChannel5G2(devMac, newChannel, (err, result)=> {
                if (!err && result) {
                    if (data.status == common.userStatus.online) {
                        getDeviceStatus(data, common.operateType.setApChannelNum, ['channel5Ghz2']);
                    }
                }
                callback(err, result);
            })
        } else {
            callback(err, null);
        }
    });
}
function resetChannel24(devMac, newChannel, callback) {
    Device.getServerData(devMac, function (err, data) {
        newChannel = parseInt(newChannel);
        if (!data.server || data.server.channel24Ghz != newChannel) {
            Device.resetChannel24(devMac, newChannel, (err, result)=> {
                if (!err && result) {
                    if (data.status == common.userStatus.online) {
                        getDeviceStatus(data, common.operateType.setApChannelNum, ['channel24Ghz']);
                    }
                }
                callback(err, result);
            })
        } else {
            callback(err, null);
        }
    });

}

function resetPowerSetting24(devMac, power, callback) {
    Device.getServerData(devMac, function (err, data) {
        if (!data.server || data.server.power24Ghz != power) {
            Device.resetPower24(devMac, power, (err, result)=> {
                if (!err && result) {
                    if (data.status == common.userStatus.online) {
                        getDeviceStatus(data, common.operateType.setApPower, ['power24Ghz']);
                    }
                }
                callback(err, result);
            })
        } else {
            callback(err, null);
        }
    });
}
function resetPowerSetting5(devMac, power, callback) {
    Device.getServerData(devMac, function (err, data) {
        if (!data.server || data.server.power5Ghz != power) {
            Device.resetPower5(devMac, power, (err, result)=> {
                if (!err && result) {
                    if (data.status == common.userStatus.online) {
                        getDeviceStatus(data, common.operateType.setApPower, ['power5Ghz']);
                    }
                }
                callback(err, result);
            })
        } else {
            callback(err, null);
        }
    });

}
function resetPowerSetting5G2(devMac, power, callback) {
    Device.getServerData(devMac, function (err, data) {
        if (!data.server || data.server.power5Ghz2 != power) {
            Device.resetPower5G2(devMac, power, (err, result)=> {
                if (!err && result) {
                    if (data.status == common.userStatus.online) {
                        getDeviceStatus(data, common.operateType.setApPower, ['power5Ghz2']);
                    }
                }
                callback(err, result);
            })
        } else {
            callback(err, null);
        }
    });

}
function resetLocation(devMac, location, callback) {
    Device.getServerData(devMac, function (err, data) {
        if (!data.server || data.server.location != location) {
            Device.resetLocation(devMac, location, (err, result)=> {
                if (!err && result) {
                    if (data.status == common.userStatus.online) {
                        getDeviceStatus(data, common.operateType.setDeviceLocation);
                    }
                }
                callback(err, result);
            })
        } else {
            callback(err, null);
        }
    });

}
function resetName(devMac, name, callback) {
    Device.getServerData(devMac, function (err, data) {
        if (!data.server || data.server.name != name) {
            Device.resetName(devMac, name, (err, result)=> {
                if (!err && result) {
                    if (data.status == common.userStatus.online) {
                        getDeviceStatus(data, common.operateType.setDeviceName);
                    }
                }
                callback(err, result);
            })
        } else {
            callback(err, null);
        }
    });

}
function reboot(devMac, callback) {
    Device.findDevInfoByMac(devMac, (err, result)=> {
        if (!err && result) {
            if (result.status == common.userStatus.online) {
                getDeviceStatus(result, common.operateType.reboot);
            }
        }
    });
    callback(null);
}

function blockClient(uuid, sessionId, wlanId,band, clientMAC, callback) {
    ConfigProfile.blockClient(uuid, wlanId, band,clientMAC, (err, result)=> {
        if (!err&&result) {
            cwmClient.blockClient(sessionId, (err, result1)=> {
                if (!err) {
                    QueueC.addClientTaskQueue({config: common.taskType.config.tempTask}, uuid, common.operateType.blockClient, result);
                }
            });

        }
        callback(err, result);

    });
}
function unblockClient(uuid, wlanId, clientMAC, callback) {
    ConfigProfile.unblockClient(uuid, wlanId, clientMAC, (err, result)=> {
        if (result) {
            QueueC.addClientTaskQueue({config: common.taskType.config.tempTask}, uuid, common.operateType.unblockClient, result);
        }
        callback(err, result);
    });
}


function renameClient(devMac, clientMAC, newname, callback) {
    cwmClient.renameClient(devMac, clientMAC, newname, callback);
}


exports.resetChannel5 = resetChannel5;
exports.resetChannel5G2 = resetChannel5G2;
exports.resetChannel24 = resetChannel24;
exports.resetPowerSetting24 = resetPowerSetting24;
exports.resetPowerSetting5 = resetPowerSetting5;
exports.resetPowerSetting5G2 = resetPowerSetting5G2;
exports.resetLocation = resetLocation;
exports.resetName = resetName;
exports.reboot = reboot;
exports.renameClient = renameClient;
exports.blockClient = blockClient;
exports.unblockClient = unblockClient;