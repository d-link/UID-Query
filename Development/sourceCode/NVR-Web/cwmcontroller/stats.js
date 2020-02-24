/**
 * Created by zhiyuan on 2018/5/9.
 */
'use strict';
const db = require("../lib/util").db;
const cwmClientQuarterlyHrBin = db.cwmClientQuarterlyHrBin;
const cwmWlanQuarterlyHrBin = db.cwmWlanQuarterlyHrBin;
const cwmWlanHourlyBin = db.cwmWlanHourlyBin;
const cwmWlanDailyBin = db.cwmWlanDailyBin;
const cwmClientCountQuarterlyHrBin = db.cwmClientCountQuarterlyHrBin;
const cwmClientCountHourlyBin = db.cwmClientCountHourlyBin;
const cwmClientCountDailyBin = db.cwmClientCountDailyBin;
const async = require('async');

function getUTCBinDate() {
    let date = new Date();
    let flag = new Date('1970/1/1');
    let offset = new Date().getTimezoneOffset();
    let dateSeconds = ((date.getTime() - flag.getTime()) / 1000) + offset * 60;
    return parseInt(dateSeconds / 86400) * 86400;
}

exports.getHotTimeUniqueClient = function (params, uuids, callback) {
    let obj = {site: params.site, uuid: params.uuid};
    let threshold = params.thresholdClients;

    cwmClientCountQuarterlyHrBin.getUniqueClientsByThreshold(obj, params.startDay, params.endDay, threshold, uuids, function (err, data) {
        if (err) {
            callback(err)
        } else {
            //data = data.sort((a, b) => a._id.binDate < b._id.binDate ? -1 : 1);
            for (let i = 0; i < data.length; i++) {
                data[i] = [data[i]['_id']['binStartTimestamp'], data[i]['total'], data[i]['_id']['binDate']];
            }
            callback(null, data);
        }
    })
}


exports.getHotTimeTrafficUsage = function (params, uuids, callback) {
    let obj = {site: params.site, uuid: params.uuid};
    let threshold = params.thresholdTraffic;

    cwmWlanQuarterlyHrBin.getTrafficUsageByThreshold(obj, params.startDay, params.endDay, threshold, uuids, function (err, data) {
        if (err) {
            callback(err)
        } else {
            //data = data.sort((a, b) => a._id.binDate < b._id.binDate ? -1 : 1);
            let dataArr = [];
            for (let i = 0; i < data.length; i++) {
                data[i] = [data[i]['_id']['binStartTimestamp'], data[i]['total'], data[i]['_id']['binDate']];
                dataArr.push(data[i][1]);
            }
            dataArr = [...dataArr];
            let unit = getUnit(dataArr);
            for (let j = 0; j < data.length; j++) {
                data[j][1] = transUnit(data[j][1], unit);
            }
            callback(null, {
                data: data,
                unit: unit
            });
        }
    })

}


exports.getUniqueClientsHourlyThreshold = function (params, uuids, callback) {

    let obj = {site: params.site, uuid: params.uuid};
    let timestampArr = getHourlyAllTimestampArr(params.time);
    let result = {average: [], high: []};

    async.mapSeries(timestampArr, (timestamp, callback) => {
        cwmClientCountHourlyBin.getUniqueClientsThresholdByTimestamp(obj, timestamp[0], params.startDay, params.endDay, uuids, function (err, data) {
            if (err) {
                callback(err)
            } else {
                result.average.push(data.average);
                result.high.push(data.high);
                callback(null);
            }
        })
    }, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
}

exports.getTrafficHourlyThreshold = function (params, uuids, callback) {

    let obj = {site: params.site, uuid: params.uuid};
    let timestampArr = getHourlyAllTimestampArr(params.time);
    let result = {average: [], high: []};

    async.mapSeries(timestampArr, (timestamp, callback) => {
        cwmWlanHourlyBin.getTrafficThresholdByTimestamp(obj, timestamp[0], params.startDay, params.endDay, uuids, function (err, data) {
            if (err) {
                callback(err);
            } else {
                result.average.push(data.average);
                result.high.push(data.high);
                callback(null);
            }
        })
    }, function (err) {
        if (err) {
            callback(err);
        } else {
            let dataArr = [...result.average, ...result.high];
            dataArr = [...dataArr];
            let unit = getUnit(dataArr);
            for (let i = 0; i < result.average.length; i++) {
                result.average[i] = transUnit(result.average[i], unit);
            }
            for (let i = 0; i < result.high.length; i++) {
                result.high[i] = transUnit(result.high[i], unit);
            }
            callback(null, {data: result, unit: unit});
        }
    });
}


exports.getUniqueClientsHourlyByDay = function (params, uuids, callback) {

    let obj = {site: params.site, uuid: params.uuid};
    let binDate = params.binDate;
    let time = params.time;
    let timestampArr = getHourlyAllTimestampArr(time, binDate);
    let result = [];

    async.mapSeries(timestampArr, (timestamp, callback) => {
        cwmClientCountHourlyBin.getSumCountByTimestamp(obj, timestamp[1], timestamp[0], uuids, function (err, data) {
            if (err) {
                callback(err)
            } else {
                if (data) {
                    result.push(data);
                } else {
                    result.push(0);
                }
                callback(null);
            }
        })
    }, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
}

exports.getTrafficHourlyByDay = function (params, uuids, callback) {

    let obj = {site: params.site, uuid: params.uuid};
    let binDate = params.binDate;
    let time = params.time;
    let timestampArr = getHourlyAllTimestampArr(time, binDate);
    let result = [];

    async.mapSeries(timestampArr, (timestamp, callback) => {
        cwmWlanHourlyBin.getSumTrafficByTimestamp(obj, timestamp[1], timestamp[0], uuids, function (err, data) {
            if (err) {
                callback(err)
            } else {
                let sum = 0;
                if (data) {
                    for (let i = 0; i < data.length; i++) {
                        sum += data[i].total;
                    }
                }
                result.push(sum);
                callback(null);
            }
        })
    }, function (err) {
        if (err) {
            callback(err);
        } else {
            let dataArr = [...result];
            let unit = getUnit(dataArr);
            for (let i = 0; i < result.length; i++) {
                result[i] = transUnit(result[i], unit);
            }
            callback(null, {data: result, unit: unit});
        }
    });
}

exports.getUniqueClientDaily = function (params, uuids, callback) {
    let obj = {site: params.site, uuid: params.uuid};
    let binDateArr = params.binDateArr;
    let result = [];

    async.mapSeries(binDateArr, (binDate, callback) => {
        cwmClientCountDailyBin.getSumCount(obj, binDate, uuids, function (err, data) {
            if (err) {
                callback(err)
            } else {
                if (data && data.length == 1) {
                    result.push(data[0].total);
                } else {
                    result.push(0);
                }
                callback(null);
            }
        })
    }, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
}


exports.getTrafficUsageDaily = function (params, uuids, callback) {
    let obj = {site: params.site, uuid: params.uuid};
    let binDateArr = params.binDateArr;
    let result = [];

    async.mapSeries(binDateArr, (binDate, callback) => {
        cwmWlanDailyBin.getSumTrafficByTimestamp(obj, binDate, uuids, function (err, data) {
            if (err) {
                callback(err)
            } else {
                let sum = 0;
                if (data) {
                    for (let i = 0; i < data.length; i++) {
                        sum += data[i].total;
                    }
                }
                result.push(sum);
                callback(null);
            }
        })
    }, function (err) {
        if (err) {
            callback(err);
        } else {
            let dataArr = [...result];
            let unit = getUnit(dataArr);
            for (let i = 0; i < result.length; i++) {
                result[i] = transUnit(result[i], unit);
            }
            callback(null, {data: result, unit: unit});
        }
    });
}

exports.getUniqueClientsForAps = function (params, callback) {
    cwmClientQuarterlyHrBin.getUniqueClientsForAps(params.apList, params.binDate, params.timestamp, callback);
}

exports.getTrafficUsageForAps = function (params, callback) {
    cwmWlanQuarterlyHrBin.getTrafficUsageForAps(params.apList, params.binDate, params.timestamp, function (err, data) {
        if (err) {
            callback(err);
        } else {
            if (data) {
                for (let i = 0; i < data.length; i++) {
                    data[i].usage = transUnit(data[i].usage, params.unit);
                }
            }
            callback(null, data);
        }
    });
}

function getHourlyAllTimestampArr(time, binDate) {
    var moment = new Date();
    var offset = new Date().getTimezoneOffset();
    if(time) {
        moment = new Date(time.dateTime);
        offset = time.offset;
    }
    let flag = new Date('1970/1/1');
    let todaySeconds = parseInt(((moment.getTime() - flag.getTime()) / 1000) / 86400) * 86400;
    //let todaySeconds = parseInt((moment.getTime() / 1000) / 86400) * 86400;
    let result = [];
    for (var i = 0; i < 24; i++) {
        if (binDate && binDate == todaySeconds && i >= moment.getHours())continue;

        var timestamp = i * 60 * 60 + offset * 60;
        var tmpBinDate = binDate;
        if (timestamp < 0) {
            timestamp = timestamp + 86400;
            tmpBinDate = binDate - 86400;
        }
        else if (timestamp >= 86400) {
            timestamp = timestamp - 86400;
            tmpBinDate = binDate + 86400;
        }
        result.push([timestamp, tmpBinDate]);
    }
    return result;
}

function getRoundVal(total, power) {
    return (total / Math.pow(1024, power)).toFixed(2);
}

function getUnit(dataArr) {
    dataArr.sort((a, b)=> {
        if (a == b)return 0;
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
    })
    //console.debug_log("getUnit:" + JSON.stringify(dataArr));
    let totalBytes = dataArr.find((value)=>{
        return value>0;
    });
    if(!totalBytes){
        totalBytes=0;
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