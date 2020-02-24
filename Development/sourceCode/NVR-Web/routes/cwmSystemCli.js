/**
 * Created by zhangwenyang on 2019/4/28.
 */

'use strict';

//const mq = require("../lib/util").common.mq;
//const client = mq.connect('dnhweb');
const util = require("../lib/util");
const systemCli = util.common.systemCli;
const db = util.db;
const cwmSysLogDAO = db.cwmSystemEventLog;
var isFormatting = false;
exports.getUSBStorage = function (req, res) {
    systemCli.GetUsbStorageList(function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};
exports.browserUSBFiles = function (req, res) {
    systemCli.BrowserUSBFiles(function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};
exports.getLanSetting = function (req, res) {
    systemCli.getLANSettingBySo(function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};
exports.getDateAndTime = function (req, res) {
    systemCli.getDateAndTimezoneBySo(function (err, data) {
        if(null == err){
            return res.send({success: true, data: data});
        }else {
            //var data={NTPServer:"11111",timeZone:{id:2}};
            //return res.send({success: true,data: data});
            return res.send({success: false, error: err});

        }
    })
};
exports.getNodeTime = function (req, res) {
    //得到本地时间
    var d = new Date();
    //得到1970年一月一日到现在的秒数
    var local = d.getTime();
    //本地时间与GMT时间的时间偏移差
    var offset = d.getTimezoneOffset() * 60000;

    //获取本地时区，判断如果是负的则相加得到格林尼治时间，正的则相减
    var localUtc = new Date().getTimezoneOffset() / 60;
    //得到现在的格林尼治时间
    var utcTime;
    if (localUtc > 0) {
        utcTime = local - offset;
    } else {
        utcTime = local + offset;
    }
    //得到时区的绝对值
    var localTime = utcTime + 3600000 * Math.abs(localUtc);

    var nd = new Date(localTime);
    var YY = nd.getFullYear();
    var MM = ('0' + (nd.getMonth() + 1)).slice(-2);
    var dd = ('0' + (nd.getDate())).slice(-2);
    var hh = ('0' + (nd.getHours())).slice(-2);
    var mm = ('0' + (nd.getMinutes())).slice(-2);
    var ss = ('0' + (nd.getSeconds())).slice(-2);
    var data = {};
    data.NCTime = YY + "-" + MM + "-" + dd + " " + hh + ":" + mm + ":" + ss;//获取当时环境的时间
    data.NCTimeZoneOffset = localUtc * 60;
    console.log("++++++++++++++++++++++++++++++++++++++++++时间：" + data.NCTime + "++++++++++++++++++++++++++++++++++++++++++");
    console.log("++++++++++++++++++++++++++++++++++++++++++时区：" + data.NCTimeZoneOffset + "+++++++++++++++++++++++++++++++++++++++");
    return res.json({success: true, data: data});
};
//初始进来的时候保存配置的数据同步到板子上
exports.saveChipConfig = function (req, res) {
    var config = req.body.config;
    systemCli.SaveConfig(config, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};

exports.getConsoleSetting = function (req, res) {
    systemCli.getConsoleSettingBySo(function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};

exports.restartMonitoring = function (req, res) {
    let address = util.getSystemAddress();
    let doc = {
        logTime: new Date(),//记录LOG时间
        ip: address.ip,
        mac: address.mac,
        logType: 6,
        message: "Restart Nuclias Connect due to Web/Device access port was changed."
    };
    cwmSysLogDAO.insert(doc, (err, eventLog) => {
        systemCli.restartMonitoringBySo(function (err, data) {
            if (err) {
                return res.json({success: false, error: err});
            } else {
                return res.json({success: true, data: data});
            }
        });
    });
};
//重启设备
exports.restartDevice = function (req, res) {
    systemCli.rebootBySo(function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};

//还原系统设置
exports.restoreDevice = function (req, res) {
    var exceptIPAddress = req.body.exceptIPAddress;
    systemCli.factoryResetByExec(exceptIPAddress, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};

//格式化SD卡
exports.formatMicroSDCard = function (req, res) {
    res.connection.setTimeout(0);
    if (isFormatting) {
        return res.json({success: false, error: -2});
    }
    isFormatting = true;
    //client.publish("/sdcard/format", "start", {qos: 0, retain: 1},(e)=>{});
    systemCli.formatSDCardBySo(function (err, data) {
        isFormatting = false;
        //client.publish("sdcard/format", "finish", {qos: 0, retain: 1},(e)=>{});
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};

exports.getSystemInfo = function (req, res) {
    systemCli.getSystemAboutBySo(function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};

exports.getSystemStatus = function (req, res) {
    var data = {
        ntpStatus: systemCli.getNtpStatus(),
        sdStatus: systemCli.getSdCardStatus()
    };
    return res.json({success: true, data: data});
};

exports.setFtpDataBySo = function (req, res) {
    var config = req.body.config;
    systemCli.setFtpDataBySo(config, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};

exports.getFtpDataBySo = function (req, res) {
    systemCli.getFtpDataBySo(function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};
