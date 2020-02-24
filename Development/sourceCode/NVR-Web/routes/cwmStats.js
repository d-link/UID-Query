/**
 * Created by zhangwenyang on 2019/10/16.
 * 说明:
 *  1、统计资料数据查询和转换过程在子进程中进行，防止数据量大时主进程阻塞情况；
 *  2、父进程使用单一on message接收子进程数据, 防止setMaxListeners告警；
 *  3、父子进程之间数据匹配使用curSequence。
 */

'use strict';
const childProcess = require('child_process');
const path = require('path');
const util = require("../lib/util");
const systemCli = util.common.systemCli;
var currentStatsFrom = 'ramDisk';
var hasConnected = false;
var curSequence = 1;
var statsProcess;
var resCache = new Map();
sysStatusEvent();
initStatsProcess();
setInterval(function () {
    if(!hasConnected){
        for(var [curSequence, res] of resCache) {
            if(curSequence && res) {
                resCache.delete(curSequence);
                return res.json({success: false, error: 'Stats child process closed'});
            }
        }
    }
}, 10 * 1000);

function getSequence() {
    curSequence++;
    if (curSequence == 65535) {
        curSequence = 1;
    }
}

function sysStatusEvent() {
    systemCli.sdCardEvent.on('update', function () {
        if(systemCli.getNtpStatus() == 1) {
            setTimeout(function () {
                console.debug_log("Send ntp status change event: enable-finish");
                systemCli.ntpStatusChangeEvent.emit('enable-finish');
                currentStatsFrom = 'sdCard';
                let config = {
                    type: 'setStatsDatabase',
                    event: 'sdUpdate',
                    ntpStatus: systemCli.getNtpStatus(),
                    sdStatus: systemCli.getSdCardStatus()
                };
                statsProcess.send(config);
            }, 2000)
        }
    });
    systemCli.sdCardEvent.on('notready', function () {
        currentStatsFrom = 'ramDisk';
        let config = {
            type: 'setStatsDatabase',
            event: 'sdNotready',
            ntpStatus: systemCli.getNtpStatus(),
            sdStatus: systemCli.getSdCardStatus()
        };
        statsProcess.send(config);
    });
    systemCli.sdCardEvent.on('remove', function () {
        currentStatsFrom = 'ramDisk';
        let config = {
            type: 'setStatsDatabase',
            event: 'sdRemove',
            ntpStatus: systemCli.getNtpStatus(),
            sdStatus: systemCli.getSdCardStatus()
        };
        statsProcess.send(config);
    });
    systemCli.ntpStatusChangeEvent.on('disable', function () {
        currentStatsFrom = 'ramDisk';
        let config = {
            type: 'setStatsDatabase',
            event: 'ntpDisable',
            ntpStatus: systemCli.getNtpStatus(),
            sdStatus: systemCli.getSdCardStatus()
        };
        statsProcess.send(config);
    });
    //当系统拿到NTP时间时，触发初始化db连接到sd卡
    systemCli.ntpStatusChangeEvent.on('enable', function () {
        if(currentStatsFrom == 'sdCard') {
            return;
        }
        if(systemCli.getSdCardStatus() == 1) {
            setTimeout(function () {
                console.debug_log("Send ntp status change event: enable-finish");
                systemCli.ntpStatusChangeEvent.emit('enable-finish');
                currentStatsFrom = 'sdCard';
                let config = {
                    type: 'setStatsDatabase',
                    event: 'ntpEnable',
                    ntpStatus: systemCli.getNtpStatus(),
                    sdStatus: systemCli.getSdCardStatus()
                };
                statsProcess.send(config);
            }, 2000)
        }
    });
    systemCli.ntpStatusChangeEvent.on('manual', function () {
        currentStatsFrom = 'ramDisk';
        let config = {
            type: 'setStatsDatabase',
            event: 'manual',
            ntpStatus: systemCli.getNtpStatus(),
            sdStatus: systemCli.getSdCardStatus()
        };
        statsProcess.send(config);
    });
}

function initStatsProcess() {
    console.log("Init stats child process");
    statsProcess = childProcess.fork(path.join(__dirname, '../lib/process/statsProcess.js'));
    statsProcess.on('error', function (err) {
        console.error_log("Stats child process closed: " + err);
        hasConnected = false;
        statsProcess = null;

    });
    statsProcess.on('close', function (code) {
        console.error_log("Stats child process closed: " + code);
        hasConnected = false;
        statsProcess = null;
    });
}

function getDataFromProcess (res, config) {
    if (!statsProcess) {
        initStatsProcess();
    }
    getSequence();
    resCache.set(curSequence, res);
    config.filter.curSequence = curSequence;
    if(!hasConnected) {
        hasConnected = true;
        statsProcess.on('message', (result) => {
            var res = resCache.get(result.curSequence);
            resCache.delete(result.curSequence);
            if(res) {
                return res.json(result.data);
            }
        });
    }
    statsProcess.send(config);
};

/**
 * 获取client和WLAN的15分钟stats里的site和network组合
 */
exports.getQuarterlySiteNetworks = function (req, res) {
    res.connection.setTimeout(0);
    let config = {
        type: 'getQuarterlySiteNetworks',
        filter: {
            opeUserId: req.opeUserId
        }
    };
    getDataFromProcess(res, config);
};

/**
 * 获取client和WLAN的hour的stats里的site和network组合
 */
exports.getHourlySiteNetworks = function (req, res) {
    res.connection.setTimeout(0);
    let config = {
        type: 'getHourlySiteNetworks',
        filter: {
            opeUserId: req.opeUserId
        }
    };
    getDataFromProcess(res, config);
};

/**
 * 获取client和WLAN的daily的 stats里的site和network组合
 */
exports.getDailySiteNetworks = function (req, res) {
    res.connection.setTimeout(0);
    let config = {
        type: 'getDailySiteNetworks',
        filter: {
            opeUserId: req.opeUserId
        }
    };
    getDataFromProcess(res, config);
};

function getDataFromProcessTest1 (res, config) {
    console.log("cwmStats getDataFromProcessTest1 config:", config);
    if (!statsProcess) {
        console.log("cwmStats getDataFromProcessTest1 initStatsProcess");
        initStatsProcess();
    };
    console.log("cwmStats getDataFromProcessTest1 getSequence");
    getSequence();
    resCache.set(curSequence, res);
    console.log("cwmStats getDataFromProcessTest1 curSequence:", curSequence);
    config.filter.curSequence = curSequence;
    if(!hasConnected) {
        hasConnected = true;
        statsProcess.on('message', (result) => {
            console.log("cwmStats getDataFromProcessTest1 statsProcess on");
            var res = resCache.get(result.curSequence);
            resCache.delete(result.curSequence);
            console.log("cwmStats getDataFromProcessTest1 statsProcess on res");
            if(res) {
                console.log("cwmStats getDataFromProcessTest1 statsProcess on result:");
                return res.json(result.data);
            };
        });
    };
    console.log("cwmStats getDataFromProcessTest1 statsProcess send config:", config);
    statsProcess.send(config);
};

/**
 * dashboard图一
 * @param req
 * @param res
 */
exports.getLastHourUniqueClients = function (req, res) {
    // console.log("cwmStats getLastHourUniqueClients", res);
    res.connection.setTimeout(0);
    if (!statsProcess) {
        initStatsProcess();
        // console.log("cwmStats getLastHourUniqueClients: initStatsProcess");
    }
    let config = {
        type: 'getLastHourUniqueClients',
        filter: {
            opeUserId: req.opeUserId,
            site: req.body.site,
            uuid: req.body.uuid,
            ntpStatus: req.body.ntpStatus,
            startDay: req.body.startDay,
            endDay: req.body.endDay,
            timestampMap: req.body.timestampMap,
            timestampArr: req.body.timestampArr
        }
    };
    // console.log("cwmStats getLastHourUniqueClients config:", config);
    // console.log("cwmStats getLastHourUniqueClients run getDataFromProcessTest1");
    //发布时
    getDataFromProcess(res, config);
    //测试用
    // getDataFromProcessTest1(res, config);
};

/**
 * dashboard图二
 * @param req
 * @param res
 */
exports.getLastHourTraffic = function (req, res) {
    res.connection.setTimeout(0);
    let config = {
        type: 'getLastHourTraffic',
        filter: {
            opeUserId: req.opeUserId,
            site: req.body.site,
            uuid: req.body.uuid,
            ntpStatus: req.body.ntpStatus,
            startDay: req.body.startDay,
            endDay: req.body.endDay,
            timestampMap: req.body.timestampMap,
            timestampArr: req.body.timestampArr
        }
    };
    getDataFromProcess(res, config);
};

/**
 * dashboard图三
 * @param req
 * @param res
 */
exports.getLastHourTrafficTxRx = function (req, res) {
    res.connection.setTimeout(0);
    let config = {
        type: 'getLastHourTrafficTxRx',
        filter: {
            opeUserId: req.opeUserId,
            site: req.body.site,
            uuid: req.body.uuid,
            timestampMap: req.body.timestampMap
        }
    };
    getDataFromProcess(res, config);
};

/**
 * dashboard图四
 * @param req
 * @param res
 */
exports.getLastHourTrafficSSID = function (req, res) {
    res.connection.setTimeout(0);
    let config = {
        type: 'getLastHourTrafficSSID',
        filter: {
            opeUserId: req.opeUserId,
            site: req.body.site,
            uuid: req.body.uuid,
            timestampMap: req.body.timestampMap
        }
    };
    getDataFromProcess(res, config);
};

/**
 * hourly图一的上下阈值
 * @param req
 * @param res
 */
exports.getUniqueClientsHourlyThreshold = function (req, res) {
    res.connection.setTimeout(0);
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        res.json({success: true, data: {average: [], high: []}});
    }
    else {
        let config = {
            type: 'getUniqueClientsHourlyThreshold',
            filter: {
                opeUserId: req.opeUserId,
                site: req.body.site,
                uuid: req.body.uuid,
                time: req.body.time,
                startDay: req.body.startDay,
                endDay: req.body.endDay
            }
        };
        getDataFromProcess(res, config);
    }
};

/**
 * hourly图二的上下阈值
 * @param req
 * @param res
 */
exports.getTrafficHourlyThreshold = function (req, res) {
    res.connection.setTimeout(0);
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        res.json({success: true, data: {data: {average:[], high:[]}, unit: "MB"}});
    }
    else {
        let config = {
            type: 'getTrafficHourlyThreshold',
            filter: {
                opeUserId: req.opeUserId,
                site: req.body.site,
                uuid: req.body.uuid,
                time: req.body.time,
                startDay: req.body.startDay,
                endDay: req.body.endDay
            }
        };
        getDataFromProcess(res, config);
    }
};

/**
 * hourly图一某天的值
 * @param req
 * @param res
 */
exports.getUniqueClientsHourlyByDay = function (req, res) {
    res.connection.setTimeout(0);
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        res.json({success: true, data: []});
    }
    else {
        let config = {
            type: 'getUniqueClientsHourlyByDay',
            filter: {
                opeUserId: req.opeUserId,
                site: req.body.site,
                uuid: req.body.uuid,
                time: req.body.time,
                binDate: req.body.binDate
            }
        };
        getDataFromProcess(res, config);
    }
};

/**
 * hourly图二某天的值
 * @param req
 * @param res
 */
exports.getTrafficHourlyByDay = function (req, res) {
    res.connection.setTimeout(0);
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        res.json({success: true, data: [], unit: "MB"});
    }
    else {
        let config = {
            type: 'getTrafficHourlyByDay',
            filter: {
                opeUserId: req.opeUserId,
                site: req.body.site,
                uuid: req.body.uuid,
                time: req.body.time,
                binDate: req.body.binDate
            }
        };
        getDataFromProcess(res, config);
    }
};

/**
 * hotTime图一
 * @param req
 * @param res
 */
exports.getHotTimeUniqueClient = function (req, res) {
    res.connection.setTimeout(0);
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        res.json({success: true, data: []});
    }
    else {
        let config = {
            type: 'getHotTimeUniqueClient',
            filter: {
                opeUserId: req.opeUserId,
                site: req.body.site,
                uuid: req.body.uuid,
                thresholdClients: req.body.thresholdClients,
                startDay: req.body.startDay,
                endDay: req.body.endDay
            }
        };
        getDataFromProcess(res, config);
    }
};

/**
 * hotTime图二
 * @param req
 * @param res
 */
exports.getHotTimeTrafficUsage = function (req, res) {
    res.connection.setTimeout(0);
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        res.json({success: true, data: {data: [], unit: "MB"}});
    }
    else {
        let config = {
            type: 'getHotTimeTrafficUsage',
            filter: {
                opeUserId: req.opeUserId,
                site: req.body.site,
                uuid: req.body.uuid,
                thresholdClients: req.body.thresholdClients,
                thresholdTraffic: req.body.thresholdTraffic,
                startDay: req.body.startDay,
                endDay: req.body.endDay
            }
        };
        getDataFromProcess(res, config);
    }
};

/**
 * 获取Hot Time里某个日期范围内符合条件的所有AP的client Count之和的高位数
 * @param req
 * @param res
 */
exports.getHotTimeUniqueClientThreshold = function (req, res) {
    res.connection.setTimeout(0);
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        res.json({success: true, data: 0});
    }
    else {
        let config = {
            type: 'getHotTimeUniqueClientThreshold',
            filter: {
                opeUserId: req.opeUserId,
                site: req.body.site,
                uuid: req.body.uuid,
                startDay: req.body.startDay,
                endDay: req.body.endDay,
                probability: req.body.probability
            }
        };
        getDataFromProcess(res, config);
    }
};

/**
 * 获取Hot Time里某个日期范围内符合条件的所有AP的traffic之和的高位数
 * @param req
 * @param res
 */
exports.getHotTimeTrafficUsageThreshold = function (req, res) {
    res.connection.setTimeout(0);
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        res.json({success: true, data: 0, unit: "MB"});
    }
    else {
        let config = {
            type: 'getHotTimeTrafficUsageThreshold',
            filter: {
                opeUserId: req.opeUserId,
                site: req.body.site,
                uuid: req.body.uuid,
                startDay: req.body.startDay,
                endDay: req.body.endDay,
                probability: req.body.probability
            }
        };
        getDataFromProcess(res, config);
    }
};

/**
 * daily unique client的值
 * @param req
 * @param res
 */
exports.getUniqueClientDaily = function (req, res) {
    res.connection.setTimeout(0);
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        res.json({success: true, data: []});
    }
    else {
        let config = {
            type: 'getUniqueClientDaily',
            filter: {
                opeUserId: req.opeUserId,
                site: req.body.site,
                uuid: req.body.uuid,
                binDateArr: req.body.binDateArr
            }
        };
        getDataFromProcess(res, config);
    }
};

/**
 * daily traffic usage的值
 * @param req
 * @param res
 */
exports.getTrafficUsageDaily = function (req, res) {
    res.connection.setTimeout(0);
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        res.json({success: true, data: {data: [], unit:"MB"}});
    }
    else {
        let config = {
            type: 'getTrafficUsageDaily',
            filter: {
                opeUserId: req.opeUserId,
                site: req.body.site,
                uuid: req.body.uuid,
                binDateArr: req.body.binDateArr
            }
        };
        getDataFromProcess(res, config);
    }
};

exports.getHotApUniqueClientThreshold = function (req, res) {
    res.connection.setTimeout(0);
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        res.json({success: true, data: {average: 0, high: 0}});
    }
    else {
        let config = {
            type: 'getHotApUniqueClientThreshold',
            filter: {
                opeUserId: req.opeUserId,
                startDay: req.body.startDay,
                endDay: req.body.endDay
            }
        };
        getDataFromProcess(res, config);
    }
};

exports.getUniqueClientsForAps = function (req, res) {
    res.connection.setTimeout(0);
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        res.json({success: true, data: []});
    }
    else {
        let config = {
            type: 'getUniqueClientsForAps',
            filter: {
                opeUserId: req.opeUserId,
                apList: req.body.apList,
                binDate: req.body.binDate,
                timestamp: req.body.timestamp
            }
        };
        getDataFromProcess(res, config);
    }
};

exports.getHotApTrafficThreshold = function (req, res) {
    res.connection.setTimeout(0);
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        res.json({success: true, data: {average: "", high: "", unit: "MB"}});
    }
    else {
        let config = {
            type: 'getHotApTrafficThreshold',
            filter: {
                opeUserId: req.opeUserId,
                startDay: req.body.startDay,
                endDay: req.body.endDay
            }
        };
        getDataFromProcess(res, config);
    }
};

exports.getTrafficUsageForAps = function (req, res) {
    res.connection.setTimeout(0);
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        res.json({success: true, data: []});
    }
    else {
        let config = {
            type: 'getTrafficUsageForAps',
            filter: {
                opeUserId: req.opeUserId,
                apList: req.body.apList,
                binDate: req.body.binDate,
                timestamp: req.body.timestamp,
                unit:req.body.unit,
            }
        };
        getDataFromProcess(res, config);
    }
};

