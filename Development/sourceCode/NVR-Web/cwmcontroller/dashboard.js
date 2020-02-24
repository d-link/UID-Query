/**
 * Created by lizhimin on 2017/9/19.
 */
'use strict';
const async = require('async');
const db = require("../lib/util").db;
const common = require("../lib/util").common;
const cwmDevice = db.cwmDeviceManaged;
const ConfigProfile = db.cwmConfigProfile;
const EventLog = db.cwmSystemEventLog;
const Network = db.cwmNetwork;
const Org = db.cwmOrg;
const cwmClient = db.cwmClientHistory;
const cwmWlanHourlyBin = db.cwmWlanHourlyBin;
const networkC = require("./network");
const DeviceC = require('./device');

function getStateSummary(opeUser, orgId, callback) {
    let summary = {networkCount: 0, siteCount: 0, apCount: 0, apOnline: 0, clientCount: 0};
    async.waterfall([(cb) => {
        Network.findByOrgId(orgId, (err, result) => {
            let networkIds = [];
            if (err) {
                cb(err, networkIds);
            } else {

                if (opeUser.role == "root admin" || opeUser.role == "root user") {

                } else {
                    result = result.filter(function (value) {
                        return opeUser.privilege.find(t => t == value._id);
                    });
                }
                summary.networkCount = result.length;
                let sites = [];
                for (let net of result) {
                    networkIds.push(net._id);
                    if (!sites.includes(net.site)) {
                        sites.push(net.site);
                    }
                }
                summary.siteCount = sites.length;
                cb(err, networkIds);
            }
        });
    }, (networkIds, cb) => {
        Org.findOrgById(orgId, (err, org) => {
            cb(err, networkIds, org);
        });
    }, (networkIds, org, cb) => {
        cwmDevice.findByNetworkIds(networkIds, (err, result) => {
            if (err) {
                cb(err, summary);
            } else {
                summary.apCount = result.length;
                let onlineDevs = 0;
                let clients = 0;
                let devMacMaps = new Map();
                async.map(result, (dev, cb) => {
                    if (dev.status != common.userStatus.offline && dev.isDelete == false && dev.realDelete == false) {
                        //test for cs
                        if (DeviceC.changeDeviceStatus(dev, org.keepAlive)) {
                            cb(err, dev);
                        } else {
                            onlineDevs++;
                            if (devMacMaps.has(dev.uuid)) {
                                devMacMaps.get(dev.uuid).push(dev.mac);
                            } else {
                                devMacMaps.set(dev.uuid, [dev.mac]);
                            }
                            cb(err, dev);
                        }
                    } else {
                        cb(err, dev);
                    }

                }, function (err, rs) {
                    summary.apOnline = onlineDevs;
                    cb(err, devMacMaps);
                    /* cwmClient.getClientCountByAPMACs(devMACS, (err, result)=> {
                         if (!err) {
                             clients = result;
                         }
                         summary.clientCount = clients;
                         cb(err, rs);
                     })*/

                })
            }

        })
    }, (devMacMaps, cb) => {
        summary.clientCount = 0;
        async.map(devMacMaps.keys(), (key, cb) => {
            cwmClient.getClientCountByAPMACs(key, devMacMaps.get(key), (err, result) => {
                if (!err) {
                    summary.clientCount += result;
                }
                cb(err, null);
            })
        }, (err, rs) => {
            cb(err, rs);
        });
    }], function (err, result) {
        if (!err) {
            callback({success: true, data: summary});
        }
        else {
            callback({success: false, error: 1});
        }
    })

};

function getTopApByUsage(param, callback) {
    cwmDevice.getTotalUsage(param.orgId, (err, result) => {
        let usage = 1;
        if (result && result.length > 0) {
            usage = result[0].total;
        }
        if (param.networkId != "ALL") {
            cwmDevice.findDeviceBySortByUsage(param.orgId, param.networkId, (err, result) => {
                getDetail(result, usage, callback);
            })
        } else if (param.siteId != "ALL") {

            Network.findBySiteId(param.orgId, param.siteId, (err, datas) => {
                let networkIds = [];
                for (let net of datas) {
                    networkIds.push(net._id.toString());
                }
                cwmDevice.findDeviceByNetworkIdSSortByUsage(networkIds, (err, result) => {
                    getDetail(result, usage, callback);
                })
            });
        } else {
            cwmDevice.findDeviceBySortByUsage(param.orgId, null, (err, result) => {
                getDetail(result, usage, callback);
            })
        }
    })
}

function transferDeviceServerData(dev) {
    if (!dev) return;
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

    } else {
        if (!dev.server.channel24Ghz) dev.server.channel24Ghz = dev.channel24Ghz;
        if (!dev.server.channel5Ghz) dev.server.channel5Ghz = dev.channel5Ghz;
        if (!dev.server.channel5Ghz2) dev.server.channel5Ghz2 = dev.channel5Ghz2;
        if (!dev.server.power24Ghz || dev.server.power24Ghz == 'default') dev.server.power24Ghz = dev.power24Ghz;
        if (!dev.server.power5Ghz || dev.server.power5Ghz == 'default') dev.server.power5Ghz = dev.power5Ghz;
        if (!dev.server.power5Ghz2 || dev.server.power5Ghz2 == 'default') dev.server.power5Ghz2 = dev.power5Ghz2;
        if (dev.server.name == undefined) dev.server.name = dev.name;
        if (dev.server.location == undefined) dev.server.location = dev.location;
    }

}

function getDetail(devices, usage, callback) {

    async.map(devices, (dev, cb) => {
        if (dev.hasOwnProperty('_doc')) {
            dev = dev.toObject();
        }
        transferDeviceServerData(dev);
        dev.usagePercent = getParseFloat(dev.totalUsage * 100 / usage);
        Network.findById(dev.networkId, (err, result) => {
            if (result) {
                dev.network = result.name;
            }
            cb(err, dev);
        })

    }, (err, result) => {
        if (err) {
            callback({success: false, error: err});
        } else {
            callback({success: true, data: result});
        }
    })

}

function getLatestEvents(param, opeUserId, callback) {
    networkC.getUsersNetworkIds(param, opeUserId, (networkIds) => {
        EventLog.getLatestEvent(networkIds, (err, result) => {
            async.map(result, (re, cb) => {
                if (re.hasOwnProperty('_doc')) {
                    re = re.toObject();
                }
                Network.findNetworkByAgentUUID(re.uuid, (err, net) => {
                    if (net) {
                        re.network = net.name;
                    }
                    cb(err, re);
                })
            }, (error, datas) => {
                callback({success: true, data: datas});
            });
        });
    })

}

function getChannelUsedSummary(param, opeUserId, callback) {
    let channel24 = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]];
    let channel5 = [[36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 149, 153, 157, 161, 165]];
    let maxValue = 0;
    param.siteId = 'ALL';
    param.networkId = "ALL";
    networkC.getUsersNetworkIds(param, opeUserId, (networkIds) => {
        async.parallel([(cb) => {
            cwmDevice.findBynetworkIdsOrderByChannel24(networkIds, cb)
        }, (cb) => {
            cwmDevice.findBynetworkIdsOrderByChannel5(networkIds, cb)
        }, (cb) => {
            cwmDevice.findBynetworkIdsOrderByChannel52(networkIds, cb)
        }], (err, results) => {
            if (!err) {
                let ch24 = [];
                for (let chgroup of channel24) {
                    let tempch24 = [];
                    for (let ch of chgroup) {
                        let temp = [ch, 0];
                        for (let curch of results[0]) {
                            if (temp[0] == curch._id) {
                                temp[1] = curch.count;
                                if (temp[1] > maxValue) {
                                    maxValue = temp[1];
                                }
                            }
                        }
                        tempch24.push(temp);
                    }
                    ch24.push(tempch24);
                }
                let ch5 = [];
                for (let chgroup of channel5) {
                    let tempch5 = [];
                    for (let ch of chgroup) {
                        let temp = [ch, 0];
                        for (let curch of results[1]) {
                            if (temp[0] == curch._id) {
                                temp[1] = curch.count;
                                if (temp[1] > maxValue) {
                                    maxValue = temp[1];
                                }
                            }
                        }
                        for (let curch of results[2]) {
                            if (temp[0] == curch._id) {
                                temp[1] = curch.count;
                                if (temp[1] > maxValue) {
                                    maxValue = temp[1];
                                }
                            }
                        }
                        tempch5.push(temp);
                    }
                    ch5.push(tempch5);
                }
                let data = {ch24: ch24, ch5: ch5, maxValue: maxValue};
                callback({success: true, data: data});
            } else {
                callback({success: false});
            }
        });
    });

}

function getAccessPoints(param, page, opeUserId, callback) {
    function getDevice(rule, page, callback) {
        async.parallel([(cb) => {
            cwmDevice.getDeviceCountBySearch(rule, cb)
        }, (cb) => {
            cwmDevice.getDeviceOnlineCountBySearch(rule, cb)
        }, (cb) => {
            cwmDevice.getDevicesBySearch(rule, page, cb)
        }], (err, results) => {
            //todo 使用连接查询，优化该部分
            if (!err) {
                getDevDetail(results[2], function (err, data) {
                    callback(err, data, results[0], results[1])
                });
            } else {
                callback(err)
            }
        });
    }
    //todo 使用连接查询，优化该部分
    networkC.getUsersNetworkIds(param, opeUserId, (networkIds) => {
        let rule = {networkIds: networkIds};
        for (let pp in param) {
            if (pp != 'orgId' && pp != 'siteId' && pp != 'networkId') {
                rule[pp] = param[pp];
            }
        }
        getDevice(rule, page, callback);
    })

}

function getBinDate() {
    //let flag = new Date('1970/1/1');
    let date = new Date();
    let dateSeconds = (date.getTime() / 1000);
    //let dateSeconds = ( (date.getTime() - flag) / 1000);
    return parseInt(dateSeconds / 86400) * 86400;
}

function getTimestampArr(timestamp, length) {
    let result = [timestamp];
    for (let i = 1; i < length; i++) {
        result.push(timestamp + 60 * 60 * i);
    }
    return result;
}

function getBinTime() {
    let flag = new Date('1970/1/1');
    let date = new Date();
    let dateSeconds = ((date.getTime() - flag) / 1000);
    let endTime = parseInt(dateSeconds / 3600);
    endTime = (endTime % 24) * 3600;
    let startTime = endTime - 3600;
    if (startTime < 0) {
        startTime = 86400 + startTime;
        endTime = 86400;
    }
    return startTime;
}

function getAllUsageData(param, time, opeUserId, callback) {
    let data = {};

    function getUsage(uuids, callback) {
        let binDate = getBinDate();
        cwmWlanHourlyBin.getAPListSumTrafficByDate(uuids, binDate, (err, result) => {
            if (!err) {
                if (result.length < 24) {
                    cwmWlanHourlyBin.getAPListSumTrafficByDate(uuids, binDate - 86400, (err, result1) => {
                        if (!err) {
                            formatUsageData(time, result, result1, data);
                        }
                        callback(err, data);
                    })
                } else {
                    formatUsageData(time, result, null, data);
                    callback(err, data);
                }
            } else {
                callback(err, data);
            }

        })
    }

    networkC.getUsersNetworkIds(param, opeUserId, (networkIds) => {
        let uuids = [];
        if (networkIds && Array.isArray(networkIds) && networkIds.length > 0) {
            Network.findByIds(networkIds, (err, result) => {
                if (!err && result.length > 0) {
                    for (let re of result) {
                        uuids.push(re.agentUUID);
                    }
                    getUsage(uuids, callback);
                } else {
                    callback(err, null);
                }

            })
        } else {
            callback(null, null);
        }


    })
}

function getTimeStr(timestamp) {
    let hour = parseInt(timestamp / (60 * 60));
    let min = parseInt((timestamp % (60 * 60)) / 60);
    return (hour < 10 ? "0" + hour : hour) + ":" + (min < 10 ? "0" + min : min);
}

//aplist里面设置的时间点要移动一个
function formatUsageData(time, result, result1, data) {
    data.timeData = [];

    //  data.timeData=['0:00', '1:00', '3:00', '4:00', '5:00', '6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
    data.txData = [];
    data.rxData = [];
    data.unit = 'MB';

    let current = new Date().getHours();
    let offset = new Date().getTimezoneOffset();
    if (time) {
        current = time.startHour;
        offset = time.offset;
    }
    let ntpStatus = time.ntpStatus;
    let timestampAttr = [];
    if(ntpStatus != 1) { //当NTP未取得时间时，折线图以末尾点作为当前时间点
        for (let i = current + 1; i < 24; i++) {
            timestampAttr.push(60 * 60 * i);
        }
        for (let i = 0; i <= current; i++) {
            timestampAttr.push(60 * 60 * i);
        }
        // let timestampAttr = getTimestampArr(current, 24);
        // console.log(`getSumTrafficByDate:${JSON.stringify(result)}`);
        for (let i = 0; i < timestampAttr.length; i++) {
            // console.log(`binStartTimestamp:${timestampAttr[i]}`);
            let find = null;
            if (timestampAttr[i] > current * 60 * 60 ||
                ((timestampAttr[i] + offset * 60 < 0)&&(current * 60 * 60 + offset * 60 >= 0))) {
                find = result1.find((value)=> {
                    let temp = timestampAttr[i] + offset * 60;
                    if (temp < 0) temp = temp + 86400;
                    else if (temp >= 86400) temp = temp - 86400;
                    if (value._id == temp) {
                        return value;
                    }
                })
                if (find) {
                    data.timeData.push(getTimeStr(timestampAttr[i]));
                    data.rxData.push((find.rxTotal ? find.rxTotal : 0));
                    data.txData.push((find.txTotal ? find.txTotal : 0));
                }
                else {
                    data.timeData.push(getTimeStr(timestampAttr[i]));
                    data.rxData.push(0);
                    data.txData.push(0);
                }
            } else {
                find = result.find((value) => {
                    let temp = timestampAttr[i] + offset * 60;
                    if (temp < 0) temp = temp + 86400;
                    else if (temp >= 86400) temp = temp - 86400;
                    if (value._id == temp) {
                        return value;
                    }
                })
                if (find) {
                    data.timeData.push(getTimeStr(timestampAttr[i]));
                    data.rxData.push((find.rxTotal ? find.rxTotal : 0));
                    data.txData.push((find.txTotal ? find.txTotal : 0));
                }
                else {
                    data.timeData.push(getTimeStr(timestampAttr[i]));
                    data.rxData.push(0);
                    data.txData.push(0);
                }
            }
        }

    } else {  //当NTP取得时间时，折线图以起始点作为当前时间点
        for (let i = current; i < 24; i++) {
            timestampAttr.push(60 * 60 * i);
        }
        for (let i = 0; i <= current - 1; i++) {
            timestampAttr.push(60 * 60 * i);
        }
        // let timestampAttr = getTimestampArr(current, 24);
        // console.log(`getSumTrafficByDate:${JSON.stringify(result)}`);
        for (let i = 0; i < timestampAttr.length; i++) {
            // console.log(`binStartTimestamp:${timestampAttr[i]}`);
            let find = null;
            if (timestampAttr[i] >= current * 60 * 60 ||
                ((timestampAttr[i] + offset * 60 < 0))&&(current * 60 * 60 + offset * 60 >= 0)) {
                find = result1.find((value)=> {
                    let temp = timestampAttr[i] + offset * 60;
                    if (temp < 0) temp = temp + 86400;
                    else if (temp >= 86400) temp = temp - 86400;
                    if (value._id == temp) {
                        return value;
                    }
                })
                if (find) {
                    data.timeData.push(getTimeStr(timestampAttr[i]));
                    data.rxData.push((find.rxTotal ? find.rxTotal : 0));
                    data.txData.push((find.txTotal ? find.txTotal : 0));
                }
                else {
                    data.timeData.push(getTimeStr(timestampAttr[i]));
                    data.rxData.push(0);
                    data.txData.push(0);
                }
            } else {
                find = result.find((value) => {
                    let temp = timestampAttr[i] + offset * 60;
                    if (temp < 0) temp = temp + 86400;
                    else if (temp >= 86400) temp = temp - 86400;
                    if (value._id == temp) {
                        return value;
                    }
                })
                if (find) {
                    data.timeData.push(getTimeStr(timestampAttr[i]));
                    data.rxData.push((find.rxTotal ? find.rxTotal : 0));
                    data.txData.push((find.txTotal ? find.txTotal : 0));
                }
                else {
                    data.timeData.push(getTimeStr(timestampAttr[i]));
                    data.rxData.push(0);
                    data.txData.push(0);
                }
            }
        }
    }
    let temp = [...data.rxData, ...data.txData];
    temp.sort((a, b) => {
        if (a == b) return 0;
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
    })
    let value = temp.find((value) => {
        return value > 0;
    });
    if (!value) {
        value = 0;
    }
    data.unit = getUnit(value, 0);
    for (let i = 0; i < data.rxData.length; i++) {
        data.rxData[i] = transUnit(data.rxData[i], data.unit);
    }
    for (let i = 0; i < data.txData.length; i++) {
        data.txData[i] = transUnit(data.txData[i], data.unit);
    }

}

function transUnit(totalBytes, unit) {
    if (unit == "Byte") {
        return totalBytes;
    } else if (unit == 'KB') {
        return getRoundVal(totalBytes, 1);
    } else if (unit == 'MB') {
        return getRoundVal(totalBytes, 2);
    }
    else if (unit == 'GB') {
        return getRoundVal(totalBytes, 3);
    }
    else if (unit == 'TB') {
        return getRoundVal(totalBytes, 4);
    } else {
        return getRoundVal(totalBytes, 5);
    }
}

function getRoundVal(total, power) {
    return (total / Math.pow(1024, power)).toFixed(2);
}

function getUnit(bytes, type) { // type = 0 byte,1 kbyte,2 mbyte,3 gbyte,

    let totalBytes = bytes * Math.pow(1024, type);
    let str = '';
    if (totalBytes == 0) {
        str = 'MB';
    }
    else if (getRoundVal(totalBytes, 2) < 1024) {
        str = 'MB';
    }
    else if (getRoundVal(totalBytes, 3) < 1024) {
        str = 'GB';
    }
    else if (getRoundVal(totalBytes, 4) < 1024) {
        str = 'TB';
    }
    else {
        str = 'PB';
    }
    return str;
}

function parseToMB(bytes) {
    let mb = (bytes / (1024 * 1024)).toFixed(2);
    return mb;
}

function getUsageDataByAP(mac, time, callback) {
    let data = {};
    let binDate = getBinDate();
    cwmWlanHourlyBin.getAPSumTrafficByDate(mac, binDate, (err, result) => {
        if (!err) {
            if (result.length < 24) {
                cwmWlanHourlyBin.getAPSumTrafficByDate(mac, binDate - 86400, (err, result1) => {
                    if (!err) {
                        formatUsageData(time, result, result1, data);
                    }
                    callback(err, data);
                })
            } else {
                formatUsageData(time, result, null, data);
                callback(err, data);
            }
        } else {
            callback(err, data);
        }

    })
}

function getDevDetail(devs, callback) {
    Org.findAll((err, result) => {
        if (!err && result.length > 0) {
            let index = 1;
            let interval = result[0].keepAlive;
            async.map(devs, (dev, cb) => {
                if (dev.hasOwnProperty('_doc')) {
                    dev = dev.toObject();
                }
                dev.index = index;
                index++;
                if (!dev.channelList24Ghz) dev.channelList24Ghz = [];
                dev.channelList24Ghz.splice(0, 0, 0);
                if (!dev.channelList5Ghz) dev.channelList5Ghz = [];
                dev.channelList5Ghz.splice(0, 0, 0);
                if (!dev.channelList5Ghz2) dev.channelList5Ghz2 = [];
                dev.channelList5Ghz2.splice(0, 0, 0);
                transferDeviceServerData(dev);
                if (dev.status != common.userStatus.offline) {
                    DeviceC.changeDeviceStatus(dev, interval);
                }
                async.parallel([
                    function (callback) {
                        Network.findById(dev.networkId, function (err, data) {
                            if (data) {
                                dev.network = data.name;
                                dev.schoolId = data.schoolId;
                            }
                            callback(null, dev);
                        })
                    },
                    function (callback) {
                        if (dev.status == 'online') {
                            cwmClient.getClientCountByAPMAC(dev.uuid, dev.mac, (err, result) => {
                                if (!err) {
                                    dev.client = result;
                                }
                                callback(err, dev);
                            })
                        } else {
                            dev.client = 0;
                            callback(err, dev);
                        }

                    },
                    function (callback) {
                        cwmDevice.getTotalUsage(dev.orgId, function (err, data) {
                            if (data.length > 0) {
                                let total = data[0].total;
                                dev.percentUsage = getParseFloat(dev.totalUsage * 100 / total);
                            }
                            callback(null, dev);
                        })
                    }
                ], function (err, data) {
                    if (err) {
                        cb(err);
                    } else {
                        dev = data[0];
                        cb(null, dev);
                    }
                })
            }, function (err, rs) {
                callback(err, rs);
            })
        }
    });
}

function getBlockClient(param, opeUserId, callback) {
    networkC.getUsersNetworkIds(param, opeUserId, (networkIds) => {
        ConfigProfile.findProfileByNetworkIds(networkIds, (err, result) => {
            if (err) {
                callback({success: false, error: err});
            } else {
                let totalmacMap = [];
                for (let pp of result) {
                    let macMap = [];
                    for (let ssid of pp.contents.ssid.list) {

                        if (ssid.macAccessControl == 2 && ssid.macList) {
                            for (let mac of ssid.macList) {
                                macMap.push({
                                    clientMACAddr: mac,
                                    authType: ssid.authType,
                                    ssid: ssid.ssid,
                                    band: ssid.band,
                                    wlanId: ssid.wlanId,
                                    uuid: pp.uuid,
                                    apNetworkId: pp.networkId
                                })
                            }
                        }
                    }
                    totalmacMap = totalmacMap.concat(macMap);
                }
                let clientArr = [];
                async.map(totalmacMap, (client, cb) => {
                    Network.findById(client.apNetworkId, function (err, data) {
                        if (data) {
                            client.network = data.name;
                        }
                        cb(null, client);
                    })
                }, (err, result) => {
                    let data = [];
                    let index = 1;
                    for (let cc of result) {
                        if (cc != null) {
                            cc.index = index;
                            data.push(cc);
                            index += 1;
                        }
                    }
                    callback({success: true, data: data});
                })

            }
        })
    })

}

function getClientInfos(param, opeUserId, callback) {
    let searchRule = param.searchRule;
    let page = param.page;
    if (!page) {
        page = {start: 0, count: 10};
    } else {
        if (!page.start) page.start = 0;
    }
    Org.findOrg((err, org) => {
        networkC.getUsersNetworkIds(searchRule, opeUserId, (networkIds) => {
            let rule = {};
            for (let pp in searchRule) {
                if (pp != 'orgId' && pp != 'siteId' && pp != 'networkId') {
                    rule[pp] = searchRule[pp];
                }
            }
            cwmDevice.findByNetworkIds(networkIds, (err, result) => {
                let devMACS = [];
                async.map(result, (dev, cb) => {
                    if (dev.status != common.userStatus.offline && dev.isDelete == false && dev.realDelete == false) {
                        //test for cs
                        if (!DeviceC.changeDeviceStatus(dev, org.keepAlive)) {
                            devMACS.push(dev.mac);
                        }
                    }
                    cb(err, dev);
                }, function (err, rs) {
                    rule.macs = devMACS;
                    getClientDetail(rule, page, callback);
                })
            });

        });
    });

}

function getClientDetail(rule, page, callback) {
    async.parallel([(cb) => {
        cwmClient.getClientsCountByRule(rule, cb)
    }, (cb) => {
        cwmClient.getClientsByRule(rule, page, cb)
    }], (err, results) => {
        if (!err) {
            let clients = results[1];
            let count = results[0];
            if (clients) {
                let index = 1;
                let total = 0;
                let tempClients = [];
                async.map(clients, (client, cb) => {
                    if (client.hasOwnProperty('_doc')) {
                        client = client.toObject();
                    }
                    client.index = index;
                    if (!client.lastConnectedTime) {
                        client.lastConnectedTime = new Date();
                    }
                    total += client.totalUsage;
                    index++;
                    Network.findById(client.apNetworkId, function (err, data) {
                        if (data) {
                            client.network = data.name;
                        }
                        cb(null, client);
                    })

                }, (err, result) => {
                    tempClients = result;
                    for (let client of tempClients) {
                        client.usagePercent = getParseFloat(client.totalUsage * 100 / total);
                    }
                    callback({success: true, data: tempClients, total: count});
                });

            } else {
                callback({success: false, error: "no data"});
            }
        } else {
            callback({success: false, error: err});
        }
    });

}

function parseRadioType(radioTypes) {
    let radioStr = "";
    for (let type in radioTypes) {
        for (let radio of radioTypes[type]) {
            radioStr += radio;
        }
    }

    return radioStr;
}

function getParseFloat(str) {
    let temp = parseFloat(str);
    let tempfloat = isNaN(temp) ? 0 : temp.toFixed(2);
    return tempfloat;
};

module.exports = {
    getStateSummary,
    getTopApByUsage,
    getLatestEvents,
    getChannelUsedSummary,
    getAccessPoints,
    getBlockClient,
    getClientInfos,
    getAllUsageData,
    getUsageDataByAP

}