/**
 * Created by zhangwenyang on 2019/10/14.
 */
'use strict';
const stats = require("../../cwmcontroller/stats");
const util = require("../util");
const db = util.db;
const systemCli = util.common.systemCli;
db.statsEvent();
const cwmClientQuarterlyHrBin = db.cwmClientQuarterlyHrBin;
const cwmWlanQuarterlyHrBin = db.cwmWlanQuarterlyHrBin;
const cwmWlanHourlyBin = db.cwmWlanHourlyBin;
const cwmWlanDailyBin = db.cwmWlanDailyBin;
const cwmClientCountQuarterlyHrBin = db.cwmClientCountQuarterlyHrBin;
const cwmClientCountHourlyBin = db.cwmClientCountHourlyBin;
const cwmClientCountDailyBin = db.cwmClientCountDailyBin;
const async = require('async');
process.on('message', (config) => {
    switch (config.type) {
        case 'getLastHourUniqueClients':
            getLastHourUniqueClients(config.filter);
            break;
        case 'getLastHourTraffic':
            getLastHourTraffic(config.filter);
            break;
        case 'getLastHourTrafficTxRx':
            getLastHourTrafficTxRx(config.filter);
            break;
        case 'getLastHourTrafficSSID':
            getLastHourTrafficSSID(config.filter);
            break;
        case 'getHotTimeUniqueClientThreshold':
            getHotTimeUniqueClientThreshold(config.filter);
            break;
        case 'getHotTimeTrafficUsageThreshold':
            getHotTimeTrafficUsageThreshold(config.filter);
            break;
        case 'getHotTimeUniqueClient':
            getHotTimeUniqueClient(config.filter);
            break;
        case 'getHotTimeTrafficUsage':
            getHotTimeTrafficUsage(config.filter);
            break;
        case 'getUniqueClientsHourlyThreshold':
            getUniqueClientsHourlyThreshold(config.filter);
            break;
        case 'getTrafficHourlyThreshold':
            getTrafficHourlyThreshold(config.filter);
            break;
        case 'getUniqueClientsHourlyByDay':
            getUniqueClientsHourlyByDay(config.filter);
            break;
        case 'getTrafficHourlyByDay':
            getTrafficHourlyByDay(config.filter);
            break;
        case 'getUniqueClientDaily':
            getUniqueClientDaily(config.filter);
            break;
        case 'getTrafficUsageDaily':
            getTrafficUsageDaily(config.filter);
            break;
        case 'getHotApUniqueClientThreshold':
            getHotApUniqueClientThreshold(config.filter);
            break;
        case 'getHotApTrafficThreshold':
            getHotApTrafficThreshold(config.filter);
            break;
        case 'getUniqueClientsForAps':
            getUniqueClientsForAps(config.filter);
            break;
        case 'getTrafficUsageForAps':
            getTrafficUsageForAps(config.filter);
            break;
        case 'getQuarterlySiteNetworks':
            getQuarterlySiteNetworks(config.filter);
            break;
        case 'getHourlySiteNetworks':
            getHourlySiteNetworks(config.filter);
            break;
        case 'getDailySiteNetworks':
            getDailySiteNetworks(config.filter);
            break;
        case 'setStatsDatabase':
            setStatsDatabase(config);
            break;
        default:
    }
});
function setStatsDatabase(config) {
    console.log("Reinitialize stats database: " + JSON.stringify(config));
    let event = config.event;
    systemCli.setNtpStatus(config.ntpStatus);
    systemCli.setSdCardStatus(config.sdStatus);
    switch (event) {
        case 'sdUpdate':
            if(config.ntpStatus == 1) {
                systemCli.ntpStatusChangeEvent.emit('enable-finish', function () {});
            }
            break;
        case 'sdNotready':
            systemCli.sdCardEvent.emit('notready', function () {});
            break;
        case 'sdRemove':
            systemCli.sdCardEvent.emit('remove', function () {});
            break;
        case 'ntpDisable':
            systemCli.ntpStatusChangeEvent.emit('disable', function () {});
            break;
        case 'ntpEnable':
            systemCli.ntpStatusChangeEvent.emit('enable-finish', function () {});
            break;
        case 'manual':
            systemCli.ntpStatusChangeEvent.emit('manual', function () {});
            break;
        default:
    }
}

/**
 * 获取client和WLAN的15分钟stats里的site和network组合
 */
function getQuarterlySiteNetworks(filter) {
    let opeUserId = filter.opeUserId;
    cwmClientCountQuarterlyHrBin.getAllSiteNetworks(function (err, data1) {
        if (err) {
            process.send({type: 'getQuarterlySiteNetworks', data: {success: false, error: err}});
            return;
        }
        cwmWlanQuarterlyHrBin.getAllSiteNetworks(function (err, data2) {
            if (err) {
                process.send({type: 'getQuarterlySiteNetworks', data: {success: false, error: err}});
                return;
            }
            let result = mergeSiteNetworks(data1, data2);
            db.cwmNetwork.findAllUUIDs(function (err, uuids) {
                if (err) {
                    process.send({type: 'getQuarterlySiteNetworks', data: {success: false, error: err}});
                    return;
                }
                for (var i = 0; i < result.length; i++) {

                    if (!uuids.find(function (item) {
                        return item.site == result[i]._id;
                    })) {
                        result[i]._id += " (Deleted)";
                        result[i].siteName = result[i]._id;
                    }

                    for (var j = 0; j < result[i].networks.length; j++) {
                        if (!uuids.find(function (item) {
                            return item.agentUUID == result[i].networks[j].agentUUID;
                        })) {
                            result[i].networks[j].name += " (Deleted)";
                        }
                    }
                }
                db.cwmNetwork.getSiteAndNetwork(function (err, data3) {
                    result = mergeSiteNetworks(result, data3);
                    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
                        if (err) {
                            process.send({type: 'getQuarterlySiteNetworks', data: {success: false, error: err}});
                            return;
                        } else {

                            db.cwmNetwork.findUuidById(opeUser.privilege, function (err, uuids) {
                                if (err) {
                                    process.send({type: 'getQuarterlySiteNetworks', data: {success: false, error: err}});
                                    return;
                                } else {
                                    if (opeUser.role == "root admin" || opeUser.role == "root user") {
                                        process.send({type: 'getQuarterlySiteNetworks', data: {success: true, data: result}});
                                        return;
                                    } else {
                                        for (let i = 0; i < result.length; i++) {
                                            result[i].networks = result[i].networks.filter(function (network) {
                                                return uuids.find(function (item) {
                                                    return item.agentUUID == network.agentUUID;
                                                });
                                            })
                                        }
                                        result = result.filter(function (item) {
                                            return item.networks.length > 0;
                                        });
                                        process.send({type: 'getQuarterlySiteNetworks', data: {success: true, data: result}});
                                        return;
                                    }
                                }
                            });

                        }
                    });
                });
            });

        });

    });
}

/**
 * 获取client和WLAN的hour的stats里的site和network组合
 */
function getHourlySiteNetworks(filter) {
    let opeUserId = filter.opeUserId;
    cwmClientCountHourlyBin.getAllSiteNetworks(function (err, data1) {
        if (err) {
            process.send({type: 'getHourlySiteNetworks', data: {success: false, error: err}});
            return;
        }
        cwmWlanHourlyBin.getAllSiteNetworks(function (err, data2) {
            if (err) {
                process.send({type: 'getHourlySiteNetworks', data: {success: false, error: err}});
                return;
            }
            let result = mergeSiteNetworks(data1, data2);
            db.cwmNetwork.findAllUUIDs(function (err, uuids) {
                if (err) {
                    process.send({type: 'getHourlySiteNetworks', data: {success: false, error: err}});
                    return;
                }
                for (var i = 0; i < result.length; i++) {
                    if (!uuids.find(function (item) {
                        return item.site == result[i]._id;
                    })) {
                        result[i]._id += " (Deleted)";
                        result[i].siteName = result[i]._id;
                    }
                    for (var j = 0; j < result[i].networks.length; j++) {
                        if (!uuids.find(function (item) {
                            return item.agentUUID == result[i].networks[j].agentUUID;
                        })) {
                            result[i].networks[j].name += " (Deleted)";
                        }
                    }
                }
                db.cwmNetwork.getSiteAndNetwork(function (err, data3) {
                    result = mergeSiteNetworks(result, data3);
                    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
                        if (err) {
                            process.send({type: 'getHourlySiteNetworks', data: {success: false, error: err}});
                            return;
                        } else {

                            db.cwmNetwork.findUuidById(opeUser.privilege, function (err, uuids) {
                                if (err) {
                                    process.send({type: 'getHourlySiteNetworks', data: {success: false, error: err}});
                                    return;
                                } else {
                                    if (opeUser.role == "root admin" || opeUser.role == "root user") {
                                        process.send({type: 'getHourlySiteNetworks', data: {success: true, data: result}});
                                        return;
                                    } else {
                                        for (let i = 0; i < result.length; i++) {
                                            result[i].networks = result[i].networks.filter(function (network) {
                                                return uuids.find(function (item) {
                                                    return item.agentUUID == network.agentUUID;
                                                });
                                            })
                                        }
                                        result = result.filter(function (item) {
                                            return item.networks.length > 0;
                                        });
                                        process.send({type: 'getHourlySiteNetworks', data: {success: true, data: result}});
                                        return;
                                    }
                                }
                            });

                        }
                    });
                });
            });


        });

    });
};

/**
 * 获取client和WLAN的daily的 stats里的site和network组合
 */
function getDailySiteNetworks(filter) {
    let opeUserId = filter.opeUserId;
    cwmClientCountDailyBin.getAllSiteNetworks(function (err, data1) {
        if (err) {
            process.send({type: 'getDailySiteNetworks', data: {success: false, error: err}});
            return;
        }
        cwmWlanDailyBin.getAllSiteNetworks(function (err, data2) {
            if (err) {
                process.send({type: 'getDailySiteNetworks', data: {success: false, error: err}});
                return;
            }
            let result = mergeSiteNetworks(data1, data2);
            db.cwmNetwork.findAllUUIDs(function (err, uuids) {
                if (err) {
                    process.send({type: 'getDailySiteNetworks', data: {success: false, error: err}});
                    return;
                }
                for (var i = 0; i < result.length; i++) {

                    if (!uuids.find(function (item) {
                        return item.site == result[i]._id;
                    })) {
                        result[i]._id += " (Deleted)";
                        result[i].siteName = result[i]._id;
                    }

                    for (var j = 0; j < result[i].networks.length; j++) {
                        if (!uuids.find(function (item) {
                            return item.agentUUID == result[i].networks[j].agentUUID;
                        })) {
                            result[i].networks[j].name += " (Deleted)";
                        }
                    }
                }
                db.cwmNetwork.getSiteAndNetwork(function (err, data3) {
                    result = mergeSiteNetworks(result, data3);
                    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
                        if (err) {
                            process.send({type: 'getDailySiteNetworks', data: {success: false, error: err}});
                            return;
                        } else {

                            db.cwmNetwork.findUuidById(opeUser.privilege, function (err, uuids) {
                                if (err) {
                                    process.send({type: 'getDailySiteNetworks', data: {success: false, error: err}});
                                    return;
                                } else {
                                    if (opeUser.role == "root admin" || opeUser.role == "root user") {
                                        process.send({type: 'getDailySiteNetworks', data: {success: true, data: result}});
                                        return;
                                    } else {
                                        for (let i = 0; i < result.length; i++) {
                                            result[i].networks = result[i].networks.filter(function (network) {
                                                return uuids.find(function (item) {
                                                    return item.agentUUID == network.agentUUID;
                                                });
                                            })
                                        }
                                        result = result.filter(function (item) {
                                            return item.networks.length > 0;
                                        });
                                        process.send({type: 'getDailySiteNetworks', data: {success: true, data: result}});
                                        return;
                                    }
                                }
                            });

                        }
                    });
                });
            });

        });

    });
}

function getAuthorisedUUIDs(opeUserId, callback) {
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            callback(err, null);
        } else {
            if (opeUser.role == "root admin" || opeUser.role == "root user") {
                callback(null, null);
            } else {
                db.cwmNetwork.findUuidById(opeUser.privilege, function (err, uuids) {
                    if (err) {
                        callback(err, null);
                    } else {
                        let result = [];
                        if (uuids) {
                            for (let i = 0; i < uuids.length; i++) {
                                result.push(uuids[i].agentUUID);
                            }
                        }
                        callback(null, result);
                    }
                });
            }
        }
    });
}

/**
 * dashboard图一
 * @param filter
 */
function getLastHourUniqueClients(filter) {

    /* return res.json({
     success: true, data: {
     lastHour: [200, 100, 300, 600,],
     average: [400, 100, 200, 400, 100, 200, 100, 0],
     high: [100, 400, 800, 800, 800, 200, 100, 500]
     }
     });*/

    let obj = {site: filter.site, uuid: filter.uuid};
    let ntpStatus = filter.ntpStatus;
    let timestampMap = filter.timestampMap;
    let timestampArr = filter.timestampArr;
    let result = {lastHour: [], average: [], high: []};

    let opeUserId = filter.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getLastHourUniqueClients', data: {success: false, error: err}});
            return;
        }
        async.parallel([
                function (callback) {
                    if(ntpStatus == 1) {
                        async.mapSeries(timestampArr, (timestamp, callback) => {
                            let binDate = '';
                            for(let value of timestampMap) {
                                if(value.timestamp == timestamp) {
                                    binDate = value.binDate;
                                    break;
                                }
                            }
                            cwmClientCountQuarterlyHrBin.getUniqueClientsThresholdByTimestamp(obj, binDate, timestamp, filter.startDay, filter.endDay, uuids, function (err, data) {
                                if (err) {
                                    callback(err)
                                } else {
                                    if(data.hasOwnProperty("lastHour")){
                                        result.lastHour.push(data.lastHour);
                                    }
                                    result.average.push(data.average);
                                    result.high.push(data.high);
                                    callback(null);
                                }
                            })
                        }, callback);
                    }
                    else { //当未拿到NTP时间时，不取average和high数据
                        async.mapSeries(timestampMap, (item, callback) => {
                            cwmClientCountQuarterlyHrBin.getSumCountByTimestamp(obj, item.binDate, item.timestamp, uuids, function (err, data) {
                                if (err) {
                                    callback(err)
                                } else {
                                    result.lastHour.push(data);
                                    callback(null);
                                }
                            })
                        }, callback);
                    }
                }
            ],
            function () {
                process.send({curSequence: filter.curSequence, type: 'getLastHourUniqueClients', data: {success: true, data: result}});
                return;
            });
    });
}

/**
 * dashboard图二
 * @param filter
 */
function getLastHourTraffic(filter) {

    /*  return res.json({
     success: true, data: {
     lastHour: [300, 500, 800],
     average: [200, 500, 200, 100, 200, 400, 100, 200],
     high: [100, 200, 300, 400, 800, 800, 800, 200]
     }
     });*/

    let obj = {site: filter.site, uuid: filter.uuid};
    let ntpStatus = filter.ntpStatus;
    let timestampMap = filter.timestampMap;
    let timestampArr = filter.timestampArr;

    let result = {lastHour: [], average: [], high: []};

    let opeUserId = filter.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getLastHourTraffic', data: {success: false, error: err}});
            return;
        }
        async.parallel([
                function (callback) {
                    if(ntpStatus == 1) {
                        async.mapSeries(timestampArr, (timestamp, callback) => {
                            let binDate = '';
                            for(let value of timestampMap) {
                                if(value.timestamp == timestamp) {
                                    binDate = value.binDate;
                                    break;
                                }
                            }
                            cwmWlanQuarterlyHrBin.getTrafficThresholdByTimestamp(obj, binDate, timestamp, filter.startDay, filter.endDay, uuids, function (err, data) {
                                if (err) {
                                    callback(err)
                                } else {
                                    if(data.hasOwnProperty("lastHour")){
                                        result.lastHour.push(data.lastHour);
                                    }
                                    result.average.push(data.average);
                                    result.high.push(data.high);
                                    callback(null);
                                }
                            })
                        }, callback);
                    }
                    else {  //当未拿到NTP时间时，不取average和high数据
                        async.mapSeries(timestampMap, (item, callback) => {
                            cwmWlanQuarterlyHrBin.getSumTrafficByTimestamp(obj, item.binDate, item.timestamp, uuids, function (err, data) {
                                if (err) {
                                    callback(err)
                                } else {
                                    if (data && data.length > 0) {
                                        let sum = 0;
                                        for (let i = 0; i < data.length; i++) {
                                            sum += data[i].total;
                                        }
                                        result.lastHour.push(sum);
                                    } else {
                                        result.lastHour.push(0);
                                    }

                                    callback(null);
                                }
                            })
                        }, callback);
                    }
                }
            ], function () {
                let dataArr = [...result.lastHour, ...result.average, ...result.high];
                dataArr = [...dataArr];
                result.unit = getUnit(dataArr);
                for (let i = 0; i < result.lastHour.length; i++) {
                    result.lastHour[i] = transUnit(result.lastHour[i], result.unit);
                }
                for (let i = 0; i < result.average.length; i++) {
                    result.average[i] = transUnit(result.average[i], result.unit);
                }
                for (let i = 0; i < result.high.length; i++) {
                    result.high[i] = transUnit(result.high[i], result.unit);
                }
                process.send({curSequence: filter.curSequence, type: 'getLastHourTraffic', data: {success: true, data: result}});
                return;
            }
        );
    });
}

/**
 * dashboard图三
 * @param filter
 */
function getLastHourTrafficTxRx(filter) {

    /* return res.json({
     success: true, data: {
     tx: [400, 400, 400, 600, 200],
     rx: [200, 400, 800, 800, 200]
     }
     });*/

    let obj = {site: filter.site, uuid: filter.uuid};
    let timestampMap = filter.timestampMap;
    let result = {
        tx: [],
        rx: []
    }
    let opeUserId = filter.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getLastHourTrafficTxRx', data: {success: false, data: err}});
            return;
        }
        async.mapSeries(timestampMap, (item, callback) => {
            cwmWlanQuarterlyHrBin.getSumTrafficTxRxByTimestamp(obj, item.binDate, item.timestamp, uuids, function (err, data) {
                if (err) {
                    callback(err);
                } else {
                    let tx = 0;
                    let rx = 0;
                    if (data && data.length > 0) {
                        for (let i = 0; i < data.length; i++) {
                            tx += data[i].txTotal;
                            rx += data[i].rxTotal;
                        }
                    }
                    result.tx.push(tx);
                    result.rx.push(rx);
                    callback(null);
                }
            });
        }, function (err) {
            if (err) {
                process.send({curSequence: filter.curSequence, type: 'getLastHourTrafficTxRx', data: {success: false, error: err}});
                return;
            } else {
                let dataArr = [...result.tx, ...result.rx];
                dataArr = [...dataArr];
                result.unit = getUnit(dataArr);
                for (let i = 0; i < result.tx.length; i++) {
                    result.tx[i] = transUnit(result.tx[i], result.unit);
                }
                for (let i = 0; i < result.rx.length; i++) {
                    result.rx[i] = transUnit(result.rx[i], result.unit);
                }
                process.send({curSequence: filter.curSequence, type: 'getLastHourTrafficTxRx', data: {success: true, data: result}});
                return;
            }
        });
    });
}

/**
 * dashboard图四
 * @param filter
 */
function getLastHourTrafficSSID(filter) {
    /* return res.json({
     success: true, data: [
     {
     ssid: "D-LINKOne",
     value: [100, 200, 100, 200, 100]
     },
     {
     ssid: "D-LINKTwo",
     value: [300, 400, 400, 300, 400]
     },
     {
     ssid: "D-LINKThree",
     value: [500, 600, 500, 500, 600]
     }
     ]
     });*/
    let obj = {site: filter.site, uuid: filter.uuid};
    let timestampMap = filter.timestampMap;

    let opeUserId = filter.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getLastHourTrafficSSID', data: {success: false, error: err}});
            return;
        }
        async.mapSeries(timestampMap, (item, callback) => {
            cwmWlanQuarterlyHrBin.getTrafficItemsByTimestamp(obj, item.binDate, item.timestamp, uuids, callback);
        }, function (err, results) {
            if (err) {
                process.send({curSequence: filter.curSequence, type: 'getLastHourTrafficSSID', data: {success: false, error: err}});
                return;
            } else {
                let data = [];
                for (let i = 0; i < results.length; i++) {
                    for (let j = 0; j < results[i].length; j++) {
                        let find=null;
                        if(data.length>0){
                            let findIndex = data.findIndex( (item) =>{
                                return item.ssid == results[i][j].ssid;
                            });
                            if(findIndex!=-1){
                                find=data[findIndex];}
                        }

                        if (!find) {
                            find = {
                                ssid: results[i][j].ssid,
                                value: []
                            }
                            for (let k = 0; k < results.length; k++) {
                                find.value.push(0);
                            }
                            find.value[i] += results[i][j].total;
                            data.push(find);
                        } else {
                            find.value[i] += results[i][j].total;
                        }
                    }
                }
                data = getTop5TrafficSSID(data);
                let dataArr = [];
                for (let i = 0; i < data.length; i++) {
                    dataArr = dataArr.concat([...data[i].value]);
                }
                dataArr = [...dataArr];
                let unit = getUnit(dataArr);
                for (let i = 0; i < data.length; i++) {
                    for (let j = 0; j < data[i].value.length; j++) {
                        if (data[i].value[j] == 0) {
                            data[i].value[j] = 0;
                        } else {
                            data[i].value[j] = transUnit(data[i].value[j], unit);
                        }
                    }
                }
                process.send({curSequence: filter.curSequence, type: 'getLastHourTrafficSSID', data: {success: true, data: data, unit: unit}});
                return;
            }
        });
    });
}

function getTop5TrafficSSID(data) {
    if(data.length > 5) {
        //根据search的时刻流量大小进行降序排序
        data.sort((a, b)=> {
            if (a.value[a.value.length - 1] == b.value[a.value.length - 1]) return 0;
            if (a.value[a.value.length - 1] > b.value[a.value.length - 1]) return -1;
            if (a.value[a.value.length - 1] < b.value[a.value.length - 1]) return 1;
            return 0;
        });
        data = data.slice(0, 5);
        return data;
    }
    else {
        return data;
    }
}

/**
 * hourly图一的上下阈值
 * @param req
 */
function getUniqueClientsHourlyThreshold(filter) {
    let opeUserId = filter.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getUniqueClientsHourlyThreshold', data: {success: false, error: err}});
            return;
        }
        stats.getUniqueClientsHourlyThreshold(filter, uuids, function (err, data) {
            if (err) {
                process.send({curSequence: filter.curSequence, type: 'getUniqueClientsHourlyThreshold', data: {success: false, error: err}});
                return;
            } else {
                process.send({curSequence: filter.curSequence, type: 'getUniqueClientsHourlyThreshold', data: {success: true, data: data}});
                return;
            }
        });
    });
}

/**
 * hourly图二的上下阈值
 * @param filter
 */
function getTrafficHourlyThreshold(filter) {
    let opeUserId = filter.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getTrafficHourlyThreshold', data: {success: false, error: err}});
            return;
        }
        stats.getTrafficHourlyThreshold(filter, uuids, function (err, data) {
            if (err) {
                process.send({curSequence: filter.curSequence, type: 'getTrafficHourlyThreshold', data: {success: false, error: err}});
                return;
            } else {
                process.send({curSequence: filter.curSequence, type: 'getTrafficHourlyThreshold', data: {success: true, data: data}});
                return;
            }
        });
    });
}

/**
 * hourly图一某天的值
 * @param filter
 */
function getUniqueClientsHourlyByDay(filter) {
    let opeUserId = filter.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getUniqueClientsHourlyByDay', data: {success: false, error: err}});
            return;
        }
        stats.getUniqueClientsHourlyByDay(filter, uuids, function (err, data) {
            if (err) {
                process.send({curSequence: filter.curSequence, type: 'getUniqueClientsHourlyByDay', data: {success: false, error: err}});
                return;
            } else {
                process.send({curSequence: filter.curSequence, type: 'getUniqueClientsHourlyByDay', data: {success: true, data: data}});
                return;
            }
        });
    });
}

/**
 * hourly图二某天的值
 * @param filter
 */
function getTrafficHourlyByDay(filter) {
    let opeUserId = filter.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getTrafficHourlyByDay', data: {success: false, error: err}});
            return;
        }
        stats.getTrafficHourlyByDay(filter, uuids, function (err, data) {
            if (err) {
                process.send({curSequence: filter.curSequence, type: 'getTrafficHourlyByDay', data: {success: false, error: err}});
                return;
            } else {
                process.send({curSequence: filter.curSequence, type: 'getTrafficHourlyByDay', data: {success: true, data: data}});
                return;
            }
        });
    });
}

/**
 * hotTime图一
 * @param filter
 */
function getHotTimeUniqueClient(filter) {
    let opeUserId = filter.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getHotTimeUniqueClient', data: {success: false, error: err}});
            return;
        }
        stats.getHotTimeUniqueClient(filter, uuids, function (err, data) {
            if (err) {
                process.send({curSequence: filter.curSequence, type: 'getHotTimeUniqueClient', data: {success: false, error: err}});
                return;
            } else {
                process.send({curSequence: filter.curSequence, type: 'getHotTimeUniqueClient', data: {success: true, data: data}});
                return;
            }
        });
    });
}

/**
 * hotTime图二
 * @param filter
 */
function getHotTimeTrafficUsage(filter) {
    let opeUserId = filter.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getHotTimeTrafficUsage', data: {success: false, error: err}});
            return;
        }
        stats.getHotTimeTrafficUsage(filter, uuids, function (err, data) {
            if (err) {
                process.send({curSequence: filter.curSequence, type: 'getHotTimeTrafficUsage', data: {success: false, error: err}});
                return;
            } else {
                process.send({curSequence: filter.curSequence, type: 'getHotTimeTrafficUsage', data: {success: true, data: data}});
                return;
            }
        });
    });
}

/**
 * 获取Hot Time里某个日期范围内符合条件的所有AP的client Count之和的高位数
 * @param filter
 */
function getHotTimeUniqueClientThreshold(filter) {
    let opeUserId = filter.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getHotTimeUniqueClientThreshold', data: {success: false, error: err}});
            return;
        }
        cwmClientCountQuarterlyHrBin.getUniqueClientsThresholdByProbability(filter, uuids, function (err, data) {
            if (err) {
                process.send({curSequence: filter.curSequence, type: 'getHotTimeUniqueClientThreshold', data: {success: false, error: err}});
                return;
            } else {
                process.send({curSequence: filter.curSequence, type: 'getHotTimeUniqueClientThreshold', data: {success: true, data: data}});
                return;
            }
        });
    });
}

/**
 * 获取Hot Time里某个日期范围内符合条件的所有AP的traffic之和的高位数
 * @param filter
 */
function getHotTimeTrafficUsageThreshold(filter) {
    let opeUserId = filter.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getHotTimeTrafficUsageThreshold', data: {success: false, error: err}});
            return;
        }
        cwmWlanQuarterlyHrBin.getTrafficThresholdHighByProbability(filter, uuids, function (err, data) {
            if (err) {
                process.send({curSequence: filter.curSequence, type: 'getHotTimeTrafficUsageThreshold', data: {success: false, error: err}});
                return;
            } else {
                let dataArr = [data];
                let unit = getUnit(dataArr);
                let unitData = transUnit(data, unit, false);
                process.send({curSequence: filter.curSequence, type: 'getHotTimeTrafficUsageThreshold', data: {success: true, data: unitData, unit: unit}});
                return;
            }
        });
    });
}

/**
 * daily unique client的值
 * @param filter
 */
function getUniqueClientDaily(filter) {
    let opeUserId = filter.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getUniqueClientDaily', data: {success: false, error: err}});
            return;
        }
        stats.getUniqueClientDaily(filter, uuids, function (err, data) {
            if (err) {
                process.send({curSequence: filter.curSequence, type: 'getUniqueClientDaily', data: {success: false, error: err}});
                return;
            } else {
                process.send({curSequence: filter.curSequence, type: 'getUniqueClientDaily', data: {success: true, data: data}});
                return;
            }
        });
    });
}

/**
 * daily traffic usage的值
 * @param filter
 */
function getTrafficUsageDaily(filter) {
    let opeUserId = filter.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getTrafficUsageDaily', data: {success: false, error: err}});
            return;
        }
        stats.getTrafficUsageDaily(filter, uuids, function (err, data) {
            if (err) {
                process.send({curSequence: filter.curSequence, type: 'getTrafficUsageDaily', data: {success: false, error: err}});
                return;
            } else {
                process.send({curSequence: filter.curSequence, type: 'getTrafficUsageDaily', data: {success: true, data: data}});
                return;
            }
        });
    });
}

function getHotApUniqueClientThreshold(filter) {
    let opeUserId = filter.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getHotApUniqueClientThreshold', data: {success: false, error: err}});
            return;
        }
        cwmClientQuarterlyHrBin.getUniqueClientThresholdGroupByTimestampAP(filter.startDay, filter.endDay, uuids, function (err, data) {
            if (err) {
                process.send({curSequence: filter.curSequence, type: 'getHotApUniqueClientThreshold', data: {success: false, error: err}});
                return;
            } else {
                process.send({curSequence: filter.curSequence, type: 'getHotApUniqueClientThreshold', data: {success: true, data: data}});
                return;
            }
        });
    });
}

function getUniqueClientsForAps(filter) {
    stats.getUniqueClientsForAps(filter, function (err, data) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getUniqueClientsForAps', data: {success: false, error: err}});
            return;
        } else {
            process.send({curSequence: filter.curSequence, type: 'getUniqueClientsForAps', data: {success: true, data: data}});
            return;
        }
    });
};

function getHotApTrafficThreshold(filter) {
    let opeUserId = filter.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getHotApTrafficThreshold', data: {success: false, error: err}});
            return;
        }
        cwmWlanQuarterlyHrBin.getTrafficThresholdGroupByTimeStampAP(filter.startDay, filter.endDay, uuids, function (err, data) {
            if (err) {
                process.send({curSequence: filter.curSequence, type: 'getHotApTrafficThreshold', data: {success: false, error: err}});
                return;
            } else {
                let dataArr = [data.high, data.average];
                data.unit = getUnit(dataArr);
                data.average = transUnit(data.average, data.unit);
                data.high = transUnit(data.high, data.unit);
                process.send({curSequence: filter.curSequence, type: 'getHotApTrafficThreshold', data: {success: true, data: data}});
                return;
            }
        });
    });
}

function getTrafficUsageForAps(filter) {
    stats.getTrafficUsageForAps(filter, function (err, data) {
        if (err) {
            process.send({curSequence: filter.curSequence, type: 'getTrafficUsageForAps', data: {success: false, error: err}});
            return;
        } else {
            process.send({curSequence: filter.curSequence, type: 'getTrafficUsageForAps', data: {success: true, data: data}});
            return;
        }
    });
}

function mergeSiteNetworks(data1, data2) {
    if (!data1 || data1.length <= 0) {
        for (var k = 0; k < data2.length; k++) {
            data2[k].siteName = data2[k]._id;
        }
        return data2;
    }
    else if (!data2 || data2.length <= 0) {
        for (var k = 0; k < data1.length; k++) {
            data1[k].siteName = data1[k]._id;
        }
        return data1;
    }
    let result = [];

    for (let i = 0; i < data1.length; i++) {
        let k = -1;
        for (let j = 0; j < data2.length; j++) {
            if (data1[i]._id == data2[j]._id) {
                k = j;
                break;
            }
        }
        if (k != -1) {
            result.push(mergeSites(data1[i], data2[k]));
            data2.splice(k, 1);
        } else {
            data1[i].siteName = data1[i]._id;
            result.push(data1[i]);
        }
    }
    for (var k = 0; k < data2.length; k++) {
        data2[k].siteName = data2[k]._id;
    }
    result = result.concat(data2);

    function mergeSites(site1, site2) {
        for (let i = 0; i < site1.networks.length; i++) {
            let find = site2.networks.find(function (item) {
                return item.agentUUID == site1.networks[i].agentUUID;
            })
            if (!find) {
                site2.networks.push(site1.networks[i]);
            }
        }
        site2.siteName = site2._id;
        site2.networks = site2.networks.filter(function (item) {
            return item.name != null;
        });
        return site2;

    }

    return result.filter(function (item) {
        return item.siteName != null;
    });

}

function getRoundVal(total, power, round = true) {
    if(round) {
        return (total / Math.pow(1024, power)).toFixed(2);
    }
    else{
        return (parseInt((total / Math.pow(1024, power)) * 100 ) / 100 ).toFixed(2);
    }
}

function getUnit(dataArr) {
    dataArr = dataArr.filter(function (item) {
        return item;
    });
    if (dataArr.length <= 0)return 'MB';
    dataArr.sort((a, b)=> {
        if (a == b)return 0;
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
    })
    let totalBytes = dataArr[0];
    for(let i=0;i<dataArr.length;i++){
        if(dataArr[i]&&dataArr[i]>0){
            totalBytes=dataArr[i];
            break;
        }
    }
    let str = '';
    if(totalBytes==0){
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

function transUnit(totalBytes, unit, round = true) {
    if (unit == 'KB') {
        return getRoundVal(totalBytes, 1, round);
    } else if (unit == 'MB') {
        return getRoundVal(totalBytes, 2, round);
    }
    else if (unit == 'GB') {
        return getRoundVal(totalBytes, 3, round);
    }
    else if (unit == 'TB') {
        return getRoundVal(totalBytes, 4, round);
    } else {
        return getRoundVal(totalBytes, 5, round);
    }
}
