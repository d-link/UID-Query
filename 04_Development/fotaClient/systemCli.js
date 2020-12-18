"use strict";

const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const fs = require('fs');
const os = require('os');
const ffi = require('ffi');
const async = require('async');
const env = process.env.NODE_ENV ? process.env.NODE_ENV : "development";
const watch = require('node-watch');
const si = require('systeminformation');
/*
const mq = require('./mq.js');
let client;
var connectAndSubscrite = setInterval(() => {
    try {
        client = mq.connect('systemCli');
        console.log('Try subscribing to the topic ...');
        mqSubscribe();
        clearInterval(connectAndSubscrite);
    } catch (e) {
        console.error_log('An error occurred while subscribing:', e.message);
    }
}, 10000);
*/
const EventEmitter = require('events').EventEmitter;
const sdCardEvent = new EventEmitter();
sdCardEvent.setMaxListeners(50);
const ntpStatusChangeEvent = new EventEmitter();
ntpStatusChangeEvent.setMaxListeners(50);
const fwUpgradeEvent = new EventEmitter();
fwUpgradeEvent.setMaxListeners(50);

const hddEvent = new EventEmitter();
hddEvent.setMaxListeners(50);

/**
 * 方法说明 设置系统时间
 * @method SetDate
 * @for SystemCli
 * @param {String} date 格式：yyyy-MM-dd HH:mm:ss
 * @callback {callback} callback(errorCode,message)
 */
function SetDate(date, callback) {
    if (os.platform() == "linux") {
        let cmd = 'date "+%Y-%m-%d %H:%M:%S"';
        if (date)
            cmd = 'date -s "' + date + '"';

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                callback(error, null);
            } else {
                callback(`${stderr}`, `${stdout}`);
            }
        });
    } else {
        callback(40001, null);
    }
}

/**
 * 方法说明 设置时区
 * @method SetTimezone
 * @for SystemCli
 * @param {String} date 格式：(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi
 * @callback {callback} callback(errorCode,message)
 */
function SetTimezone(zone, callback) {
    if (os.platform() == "linux") {
        let regex = /GMT([+|-]\d{2})?/;
        let match = regex.exec(zone);
        if (match) {
            let local = match[0];
            if (local.includes('+')) {
                local = local.replace('+', '-');
            } else {
                local = local.replace('-', '+');
            }
            if (local.includes('+0')) {
                local = local.replace('+0', '+');
            }
            if (local.includes('-0')) {
                local = local.replace('-0', '-');
            }

            let cmd = 'cp /usr/share/zoneinfo/Etc/' + local + ' /etc/localtime';
            console.log(cmd);
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    callback(error, null);
                } else {
                    callback(`${stderr}`, stdout);
                }
            });

        } else {
            callback(40002, null);
        }
    } else {
        callback(40001, null);
    }
}

/**
 * 方法说明 设置NTP服务器
 * @method SetNTPServer
 * @for SystemCli
 * @param {String} address 格式：ntp服务器地址 如：0.cn.pool.ntp.org
 * @callback {callback} callback(errorCode,message)
 */
function SetNTPServer(address, callback) {
    /*
    path: /etc/ntp.conf
    format:
    server ntp1.dlink.com
    */
    if (os.platform() == "linux") {
        let ntpServer = 'server 0.cn.pool.ntp.org\r\n' +
            'server 1.cn.pool.ntp.org\r\n' +
            'server 2.cn.pool.ntp.org\r\n' +
            'server 3.cn.pool.ntp.org\r\n';
        if (address && address != "") {
            ntpServer = 'server ' + address + '\r\n' + ntpServer;
        }
        fs.writeFile('/etc/ntp.conf', ntpServer, 'utf-8', function (error) {
            if (error) {
                callback(error, null);
            } else {
                callback(null, "success");
            }
        });
    } else {
        callback(40001, null);
    }
}

/**
 * 方法说明 设置DNS
 * @method SetDNS
 * @for SystemCli
 * @param {String} dns、secDNS 格式：DNS服务器地址 如：8.8.8.8
 * @callback {callback} callback(errorCode,message)
 */
function SetDNS(dns, secDNS, callback) {
    /*
    path: /etc/resolv.conf
    format:
    nameserver 127.0.0.53
    */

    if (os.platform() == "linux") {
        let nameServer = "";
        if (dns && dns != "") {
            nameServer += 'nameserver ' + dns + '\r\n';
        }
        if (secDNS && secDNS != "") {
            nameServer += 'nameserver ' + secDNS + '\r\n';
        }
        if (nameServer && nameServer != "") {
            fs.writeFile('/etc/resolv.conf', nameServer, 'utf-8', function (error) {
                if (error) {
                    callback('0', null);
                } else {
                    callback(null, "success");
                }
            });
        } else {
            callback(40003, null);
        }
    } else {
        callback(40001, null);
    }
}

/**
 * 方法说明 根据数字计算子网掩码
 * @method NumericToNetmask
 * @for SystemCli
 * @param {String} num大小范围：介于[1,32]之间的数字
 * @return [error,message]
 */
function NumericToNetmask(num) {
    let reg = /\d+/;
    let match = reg.exec(num);
    if (match) {
        let maskNum = match[0];
        if (maskNum >= 1 && maskNum <= 32) {
            let w1 = "";
            let w2 = "";
            let w3 = "";
            let w4 = "";
            for (let i = 0; i < 32; i++) {
                if (i < 8) {
                    if (i < maskNum)
                        w1 += "1";
                    else w1 += "0";
                }
                if (i >= 8 && i < 16) {
                    if (i < maskNum)
                        w2 += "1";
                    else w2 += "0";
                }
                if (i >= 16 && i < 24) {
                    if (i < maskNum)
                        w3 += "1";
                    else w3 += "0";
                }
                if (i >= 24 && i < 32) {
                    if (i < maskNum)
                        w4 += "1";
                    else w4 += "0";
                }
            }
            //console.log(w1, w2, w3, w4)
            let mask = parseInt(w1, 2) + "." + parseInt(w2, 2) + "." + parseInt(w3, 2) + "." + parseInt(w4, 2);
            //console.log(mask)
            return [null, mask];
        } else {
            return [40004, null];
        }

    } else {
        return [40002, null];
    }
}

/**
 * 方法说明 设置网络
 * @method SetLanIP
 * @for SystemCli
 * @param {Object} lanSetting 格式：{type:"dhcp|static",ip:"x.x.x.x",mask:"x.x.x.x|numeric",gateway:"x.x.x.x",dns:"x.x.x.x",secDNS:"x.x.x.x",changeDAA:1}
 * @callback {callback} callback(errorCode,message)
 */
function SetLanIP(lanSetting, callback) {
    /*
    path: /etc/network/interfaces
    format:

    auto lo
    iface lo inet loopback

    auto eth0
    iface eth0 inet static
      address 172.18.192.140
      netmask 255.255.255.0
      gateway 172.18.192.1

    */
    if (os.platform() == "linux") {
        if (lanSetting && lanSetting.hasOwnProperty("type")) {
            let cfg = "";
            if (lanSetting.type == "dhcp") {
                cfg = 'auto lo\r\n' +
                    'iface lo inet loopback\r\n\r\n' +
                    'auto eth0\r\n' +
                    'iface eth0 inet dhcp\r\n';
            }
            if (lanSetting.type == "static" && lanSetting.hasOwnProperty("mask") &&
                lanSetting.hasOwnProperty("ip") && lanSetting.hasOwnProperty("gateway")) {
                let reg = /\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3}/;
                let ipFormat = reg.test(lanSetting.mask);
                let mask = "";
                if (ipFormat) {
                    mask = lanSetting.mask;
                } else {
                    let result = NumericToNetmask(lanSetting.mask);
                    if (result[0]) {
                        callback(result[0], null);
                    } else {
                        mask = result[1];
                    }
                }

                cfg = 'auto lo\r\n' +
                    'iface lo inet loopback\r\n\r\n' +
                    'auto eth0\r\n' +
                    'iface eth0 inet static\r\n' +
                    'address ' + lanSetting.ip + '\r\n' +
                    'netmask ' + mask + '\r\n' +
                    'gateway ' + lanSetting.gateway + '\r\n';
            } else {
                callback(40002, null);
            }

            //console.log(cfg);
            fs.writeFile('/etc/network/interfaces', cfg, 'utf-8', function (error) {
                if (error) {
                    callback('0', null);
                } else {
                    callback(null, "success");
                }
            });

            SetDNS(lanSetting.dns, lanSetting.secDNS, function (err, data) {
                //callback(err, data)
                console.log(err, data);
            });
        } else {
            callback(40002, null);
        }
    } else {
        callback(40001, null);
    }
}

/**
 * 方法说明 获取已装载的USB存储设备
 * @method GetUsbStorageList
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function GetUsbStorageList(callback) {
    try {
        if (os.platform() == "linux") {
            let cmd = "df -h|grep '/dev/sd'|awk '{print $6}'";
            let result = execSync(cmd).toString();
            if (result && '' != result) {
                let reg = /\n/;
                let list = result.split(reg);
                list.pop("");
                callback(null, list);
            } else {
                callback(40010, null);
            }
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, null);
    }

}

/**
 * 方法说明 浏览U盘中固件文件（筛选扩展名为.bin .hex .mib的文件）
 * @method BrowserUSBFiles
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function BrowserUSBFiles(callback) {

    let list = [];

    function readDirSync(path) {
        let pa = fs.readdirSync(path);
        try {
            pa.forEach(function (ele, index) {
                let info = fs.statSync(path + "/" + ele);
                if (info.isDirectory()) {
                    //readDirSync(path + "/" + ele);
                } else {
                    try {
                        fs.accessSync(path + "/" + ele, fs.constants.F_OK);
                        if (info.isFile()) {
                            if (ele.endsWith(".bin") || ele.endsWith(".hex") || ele.endsWith(".mib") || ele.endsWith(".tar") || ele.endsWith(".cfg"))
                                list.push(path + "/" + ele);
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }
            });
        } catch (e) {
            console.log(e);
        }
    }

    GetUsbStorageList(function (err, data) {
        if (err) {
            callback(err, null);
        } else {
            if (data.length > 0) {
                for (let p in data) {
                    if (data[p] && '' != data[p])
                        readDirSync(data[p]);
                }
                callback(null, list);

            } else {
                callback(40010, null);
            }
        }
    });
}

/**
 * 方法说明 重启设备
 * @method RestartDevice
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function RestartDevice(callback) {
    if (os.platform() == "linux") {
        let cmd = 'reboot';
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                callback('0', null);
            } else {
                callback(null, `${stdout}${stderr}`);
            }
        });
    } else {
        callback(40001, null);
    }
}

/**
 * 方法说明 恢复出厂设置
 * @method RestoreDefaultSettings
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function RestoreDefaultSettings(callback) {
    //rm file
    //todo
    callback(null, "success");
}

/**
 * 方法说明 保存配置生效
 * @method SaveConfig
 * @for SystemCli
 * @param {Object} config 格式：
 * {
 *  "LAN":{"type":"dhcp|static","ip":"x.x.x.x","mask":"x.x.x.x|numeric","gateway":"x.x.x.x","dns":"x.x.x.x","secDNS":"x.x.x.x",changeDAA:1},
 *  "Date":{
 *          "datetime":"2019-04-25 11:11",
 *          "timezone":id,
 *          "enableNTP": 0|1|2,
 *          "defaultNTPServer":"np1.aliyun.com",
 *          "NTPServer":"0.cn.pool.ntp.org",
 *
 *          "enableDST": 1,      //0 | 1
 *			"offsetSeconds": 60, //15, 30, 45, 60, 75, 90, 105, 120
 *			"startMonth": 1,     //1~12
 *			"startWeek": 1,      //1~5
 *			"startDay": 0,       // 0~6,0表示星期日, 1表示星期一
 *			"startTime": 12:00,  //hh:mm
 *			"endMonth": 2,       //1~12
 *			"endWeek": 1,        //1~5
 *			"endDay": 1,         //0~6
 *			"endTime": 12:00     //hh:mm
 *  },
 *  "Console":{"enable":1,"protocol":"ssh","timeout":300}
 * }
 * @callback {callback} callback(errorCode,message)
 */
function SaveConfig(config, callback) {
    try {
        if (os.platform() == "linux") {
            if (env == "Production_dnh") {
                console.log(JSON.stringify(config));
            }
            if (config) {
                let dateCfg = {
                    timezone: "",
                    enableNTP: 0,
                    defaultNTPServer: "",
                    NTPServer: "",
                    datetime: "",
                    enableDST: 0,
                    offsetSeconds: 60,
                    startMonth: 1,
                    startWeek: 1,
                    startDay: 0,
                    startTime: "",
                    endMonth: 1,
                    endWeek: 1,
                    endDay: 0,
                    endTime: ""
                };

                //{timezone: null, enableNtp: 0, ntpServer: "", strDatetime: ""}
                if (config.hasOwnProperty("Date") && config.Date) {
                    if (config.Date.hasOwnProperty("enableNTP") && config.Date.enableNTP) {
                        dateCfg.enableNTP = config.Date.enableNTP;
                    }

                    if (config.Date.hasOwnProperty("enableDST") && config.Date.enableDST) {
                        dateCfg.enableDST = config.Date.enableDST;
                    }

                    if (config.Date.hasOwnProperty("datetime") && config.Date.datetime && "" != config.Date.datetime) {
                        dateCfg.datetime = config.Date.datetime;
                    }

                    if (config.Date.hasOwnProperty("timezone") && config.Date.timezone) {
                        dateCfg.timezone = config.Date.timezone;
                    }

                    if ((config.Date.hasOwnProperty("defaultNTPServer") || config.Date.hasOwnProperty("NTPServer")) && (config.Date.defaultNTPServer || config.Date.NTPServer)) {
                        dateCfg.defaultNTPServer = config.Date.defaultNTPServer != "" ? config.Date.defaultNTPServer : "ntp1.dlink.com";
                        dateCfg.NTPServer = config.Date.NTPServer;
                    }

                    if ((config.Date.hasOwnProperty("offsetSeconds")
                        || config.Date.hasOwnProperty("startMonth")
                        || config.Date.hasOwnProperty("startWeek")
                        || config.Date.hasOwnProperty("startDay")
                        || config.Date.hasOwnProperty("startTime")
                        || config.Date.hasOwnProperty("endMonth")
                        || config.Date.hasOwnProperty("endWeek")
                        || config.Date.hasOwnProperty("endDay")
                        || config.Date.hasOwnProperty("endTime"))
                        && (config.Date.offsetSeconds
                            || config.Date.startMonth
                            || config.Date.startWeek
                            || config.Date.startDay
                            || config.Date.startTime
                            || config.Date.endMonth
                            || config.Date.endWeek
                            || config.Date.endDay
                            || config.Date.endTime
                        )) {
                        dateCfg.offsetSeconds = config.Date.offsetSeconds;
                        dateCfg.startMonth = config.Date.startMonth;
                        dateCfg.startWeek = config.Date.startWeek;
                        dateCfg.startDay = config.Date.startDay;
                        dateCfg.startTime = config.Date.startTime;
                        dateCfg.endMonth = config.Date.endMonth;
                        dateCfg.endWeek = config.Date.endWeek;
                        dateCfg.endDay = config.Date.endDay;
                        dateCfg.endTime = config.Date.endTime;
                    }
                }

                async.parallel([
                    function (cb) {
                        if (config.hasOwnProperty("LAN") && config.LAN) {
                            setLanBySo(config.LAN, function (err, msg) {
                                if (err) {
                                    cb(err, null);
                                } else {
                                    cb(null, msg);
                                }
                            });
                        } else {
                            cb(null, null);
                        }
                    },
                    function (cb) {
                        if (config.hasOwnProperty("Date") && config.Date) {
                            setTimeAndTimeZoneBySo(dateCfg, (err, msg) => {
                                if (err) {
                                    cb(err, null);
                                } else {
                                    cb(null, msg);
                                }
                            });
                        } else {
                            cb(null, null);
                        }
                    },
                    function (cb) {
                        if (config.hasOwnProperty("Console") && config.Console &&
                            config.Console.hasOwnProperty("enable") &&
                            config.Console.hasOwnProperty("protocol") &&
                            config.Console.hasOwnProperty("timeout")) {
                            setConsoleSettingBySo([config.Console.enable, config.Console.protocol, config.Console.timeout], (err, msg) => {
                                if (err) {
                                    cb(err, null);
                                } else {
                                    cb(null, msg);
                                }
                            });
                        } else {
                            cb(null, null);
                        }
                    },
                ], function (err, result) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, "success");
                    }
                });
            } else {
                callback(40002, null);
            }
        } else {
            callback(null, null);
        }
    } catch (e) {
        callback(null, e);
    }
}


let soPath = '/lib/dnh';

/**
 * 方法说明 设置网络
 * @method SetLanBySo
 * @for SystemCli
 * @param {Object} lanSetting 格式：{type:"dhcp|static",ip:"x.x.x.x",mask:"x.x.x.x|numeric",gateway:"x.x.x.x",dns:"x.x.x.x",secDNS:"x.x.x.x",changeDAA:1}
 * @callback {callback} callback(errorCode,message)
 */
function setLanBySo(lanSetting, callback) {
    try {
        if (os.platform() == "linux") {
            if (env == "Production_dnh") {
                console.log(JSON.stringify(lanSetting));
            }
            if (lanSetting && lanSetting.hasOwnProperty("type")) {
                let config = new Array(8);
                //config 参数位置：isPermanent, isDHCP, ip, netmask, gateway, dns1, dns2, changeDAA
                config[0] = 1;
                config[5] = lanSetting.dns ? lanSetting.dns : "";
                config[6] = lanSetting.secDNS ? lanSetting.secDNS : "";
                config[7] = lanSetting.changeDAA ? lanSetting.changeDAA : 0;
                //console.log(config);
                let libLANSetting = ffi.Library(soPath + '/libLANSetting.so', {
                    'setLANSetting': ['int', ['int', 'int', 'string', 'string', 'string', 'string', 'string', 'int']]
                });
                switch (lanSetting.type) {
                    case "dhcp": {
                        config[1] = 1;
                        config[2] = "-1";
                        config[3] = "-1";
                        config[4] = "-1";
                        config[7] = 0;

                        break;
                    }
                    case "static": {
                        config[1] = 0;

                        if (lanSetting.type == "static" && lanSetting.hasOwnProperty("mask") && lanSetting.hasOwnProperty("ip")) {

                            config[2] = lanSetting.ip;
                            config[4] = null != lanSetting.gateway ? lanSetting.gateway : "";

                            let reg = /\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3}/;
                            let ipFormat = reg.test(lanSetting.mask);

                            if (ipFormat) {
                                config[3] = lanSetting.mask;

                                if (env == "Production_dnh") {
                                    console.log(config);
                                }
                            } else {
                                let submask = NumericToNetmask(lanSetting.mask);
                                if (submask[0]) {
                                    callback(submask[0], null);
                                } else {
                                    config[3] = submask[1];
                                }
                            }
                        } else {
                            callback(40002, null);
                        }
                        break;
                    }
                    default:
                        break;
                }
                libLANSetting.setLANSetting.async(config[0], config[1], config[2], config[3], config[4], config[5], config[6], config[7], (err, resp) => {
                    if (env == "Production_dnh") {
                        console.log("set lan result:", resp);
                    }
                    if (err) {
                        callback(40099, null);
                    } else {
                        if (resp == 1)
                            callback(null, "success");
                        else
                            callback('0', null);
                    }
                });
            } else {
                callback(40002, null);
            }
        } else {
            callback(40001, null);
        }
    } catch (e) {
        if (env == "Production_dnh") {
            console.log("set lan exception:", e);
        }
        callback(40099, e);
    }
}

//libLANSetting.so
/*
1. "ipmode": 回傳"static"或"dhcp"
2. "ip": 回傳ip address
3. "netmask": 回傳netmask
4. "gateway": 回傳gateway
5. "dns1": 回傳primary dns
6. "dns2": 回傳secondary dns
*/
/**
 * 方法说明 获取网络
 * @method getLANSettingBySo
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function getLANSettingBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libLANSetting = ffi.Library(soPath + '/libLANSetting.so', {
                'getLANSetting': ['string', []]
            });

            let setting = {
                ipType: "",
                ipAddress: "",
                subnetMask: "",
                defaultGateWay: "",
                primaryDNS: "",
                secondDNS: "",
                changeDAA: ""
            };

            libLANSetting.getLANSetting.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case null:
                            callback(null, setting);
                            break;
                        case "":
                            callback(null, setting);
                            break;
                        default:
                            let jsonObj = JSON.parse(resp);
                            setting.ipType = jsonObj.ipmode;
                            setting.ipAddress = jsonObj.ip;
                            setting.subnetMask = jsonObj.netmask;
                            setting.defaultGateWay = jsonObj.gateway;
                            setting.primaryDNS = jsonObj.dns1;
                            setting.secondDNS = jsonObj.dns2;
                            setting.changeDAA = jsonObj.chkDAA;
                            callback(null, setting);
                            break;
                    }
                }
            });


        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//libDatetimeSetting.so
/**
 * 方法说明 设置时间
 * @method setDateBySo
 * @for SystemCli
 * @param list config格式：[0|1|2 (0:禁用ntp，1:启用ntp，2:禁用ntp并设置时间),"ntpServerAddress","DatetimeString"]
 *         so中参数列表：(int isPermanent,int enableNTPServer,char* strServerAddress,char* strNtpServerUserInput,char* strDatetime)
 * @callback {callback} callback(errorCode,message)
 */
function setDateBySo(config, callback) {
    try {
        if (os.platform() == "linux") {
            if (env == "Production_dnh") {
                console.log(JSON.stringify(config));
            }
            let libDatetimeSetting = ffi.Library(soPath + '/libDatetimeSetting.so', {
                'setDatetime': ['int', ['int', 'int', 'string', 'string', 'string']],
            });
            libDatetimeSetting.setDatetime.async(1, config[0], config[1], config[2], config[3], (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case 1:
                            callback(null, "Success");
                            break;
                        case 2:
                            callback(40034, null);
                            break;
                        case 3:
                            callback(40030, null);
                            break;
                        case 4:
                            callback(40035, null);
                            break;
                        case 5:
                            callback(40036, null);
                            break;
                        case 6:
                            callback(40011, null);
                            break;
                        case 7:
                            callback(40012, null);
                            break;
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//libDatetimeSetting.so
/**
 * 方法说明 设置时区
 * @method setTimezoneBySo
 * @for SystemCli
 * @param list config格式：[时区id]
 *        so中参数列表：(int isPermanent,char* strTZName)
 * @callback {callback} callback(errorCode,message)
 */
function setTimezoneBySo(config, callback) {
    try {
        if (os.platform() == "linux") {
            if (env == "Production_dnh") {
                console.log(JSON.stringify(config));
            }
            let libDatetimeSetting = ffi.Library(soPath + '/libDatetimeSetting.so', {
                'setTimezone': ['int', ['int', 'string']],
            });
            libDatetimeSetting.setTimezone.async(1, String(config[0]), (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case 1:
                            callback(null, "success");
                            break;
                        case 2:
                            callback(40034, null);
                            break;
                        case 3:
                            callback(40030, null);
                            break;
                        case 4:
                            callback(40037, null);
                            break;
                        case 5:
                            callback(40012, null);
                            break;
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

function getTimezoneBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libDatetimeSetting = ffi.Library(soPath + '/libDatetimeSetting.so', {
                'getTimezone': ['string', []],
            });
            libDatetimeSetting.getTimezone.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case "ErrDB":
                            callback(40011, null);
                            break;
                        case "ErrTable":
                            callback(40012, null);
                            break;
                        default:
                            let result = {
                                tzID: null,
                                tzNameNC: null
                            };
                            let jsonObj = JSON.parse(resp);
                            result.tzID = jsonObj.tzID;
                            result.tzNameNC = jsonObj.tzNameNC;

                            callback(null, result);
                    }
                }
            });

        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//libDatetimeSetting.so
/**
 * 方法说明 设置夏令时
 * @method setDSTBySo
 * @for SystemCli
 * @param list config格式：[
 *                       enableDST: 1 - enable, 0 - disable
 *                       offsetSeconds: 偏移時間的秒數(UI上是15, 30, 45, 60, 75, 90, 105, 120分鐘)
 *                       startMonth: 1~12
 *                       startWeek: 1~5
 *                       startDay: 0~6, 0表示星期日, 1表示星期一
 *                       startTime: hh:mm
 *                       endMonth: 1~12
 *                       endWeek: 1~5
 *                       endDay: 0~6
 *                       endTime: hh:mm
 *                       ]
 *         so中参数列表：( int isdst: 1 - enable, 0 - disable
 *                       int offsetSeconds: 偏移時間的秒數(UI上是15, 30, 45, 60, 75, 90, 105, 120分鐘)
 *                       int startMonth: 1~12
 *                       int startWeek: 1~5
 *                       int startDay: 0~6, 0表示星期日, 1表示星期一
 *                     char* startTime: hh:mm
 *                       int endMonth: 1~12
 *                       int endWeek: 1~5
 *                       int endDay: 0~6
 *                     char* endTime: hh:mm
 *                     )
 * @callback {callback} callback(errorCode,message)
 */
function setDSTBySo(config, callback) {
    try {
        if (os.platform() == "linux") {
            if (env == "Production_dnh") {
                console.log(JSON.stringify(config));
            }
            let libDatetimeSetting = ffi.Library(soPath + '/libDatetimeSetting.so', {
                'setDaylightSaving': ['int', ['int', 'int', 'int', 'int', 'int', 'string', 'int', 'int', 'int', 'string']],
            });
            libDatetimeSetting.setDaylightSaving.async(config[0], config[1], config[2], config[3], config[4], config[5], config[6], config[7], config[8], config[9], (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case 0:
                            callback("0", null);
                            break;
                        case 1:
                            callback(null, "success");
                            break;
                        case 2:
                            callback(40080, null);
                            break;
                        case 3:
                            callback(40081, null);
                            break;
                        case 4:
                            callback(40082, null);
                            break;
                        case 5:
                            callback(40083, null);
                            break;
                        case 6:
                            callback(40084, null);
                            break;
                        case 7:
                            callback(40085, null);
                            break;
                        case 8:
                            callback(40086, null);
                            break;
                        case 9:
                            callback(40087, null);
                            break;
                        case 10:
                            callback(40088, null);
                            break;
                        case 11:
                            callback(40089, null);
                            break;
                        case 12:
                            callback(40090, null);
                            break;
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}



/**
 * 方法说明 获取时间、时区
 * @method getDateAndTimeBySo
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function getDateAndTimezoneBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libDatetimeSetting = ffi.Library(soPath + '/libDatetimeSetting.so', {
                'getDatetime': ['string', []],
                'getTimezone': ['string', []],
                'getDaylightSaving': ['string', []],
            });

            async.parallel([
                function (cb) {
                    libDatetimeSetting.getDatetime.async((err, dt) => {
                        cb(err, dt);
                    })
                },
                function (cb) {
                    libDatetimeSetting.getTimezone.async((err, tz) => {
                        cb(err, tz);
                    })
                },
                function (cb) {
                    libDatetimeSetting.getDaylightSaving.async((err, dst) => {
                        cb(err, dst);
                    })
                }],
                function (err, results) {
                    try {
                        if (err) {
                            callback(err, null);
                        } else {
                            let result = {
                                enableNTP: null,
                                defaultNTPServer: null,
                                NTPServer: null,
                                timezone: { id: null, name: null },
                                datetime: null,
                                enableDST: null,
                                offsetSeconds: null,
                                startMonth: null,
                                startWeek: null,
                                startDay: null,
                                startTime: null,
                                endMonth: null,
                                endWeek: null,
                                endDay: null,
                                endTime: null
                            };
                            let errCode = null;

                            switch (results[0]) {
                                case "ErrDB":
                                    errCode = 40011;
                                    break;
                                case "ErrTable":
                                    errCode = 40012;
                                    break;
                                default:
                                    let jsonObj = JSON.parse(results[0]);
                                    result.enableNTP = jsonObj.ntpEnable;
                                    result.defaultNTPServer = jsonObj.ntpServer1;
                                    result.NTPServer = jsonObj.ntpServer2;
                                    result.datetime = jsonObj.datetime.replace(/-/g, '/');
                            }
                            switch (results[1]) {
                                case "ErrDB":
                                    errCode = 40011;
                                    break;
                                case "ErrTable":
                                    errCode = 40012;
                                    break;
                                default:
                                    let jsonObj = JSON.parse(results[1]);
                                    result.timezone.id = jsonObj.tzID;
                                    result.timezone.name = jsonObj.tzNameNC;
                            }
                            switch (results[2]) {
                                case "ErrDB":
                                    errCode = 40011;
                                    break;
                                case "ErrTable":
                                    errCode = 40012;
                                    break;
                                default:
                                    let jsonObj = JSON.parse(results[2]);
                                    result.enableDST = jsonObj.isdst;
                                    result.offsetSeconds = jsonObj.offsetSeconds;
                                    result.startMonth = jsonObj.startMonth;
                                    result.startWeek = jsonObj.startWeek;
                                    result.startDay = jsonObj.startDay;
                                    result.startTime = jsonObj.startTime;
                                    result.endMonth = jsonObj.endMonth;
                                    result.endWeek = jsonObj.endWeek;
                                    result.endDay = jsonObj.endDay;
                                    result.endTime = jsonObj.endTime;
                            }
                            if (null != errCode) {
                                callback(errCode, null);
                            } else {
                                callback(null, result);
                            }
                        }
                    } catch (ex) {
                        callback(40099, ex.message);
                    }
                });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 方法说明 通过shell获取时区、时间
 * @method getDateAndTimezoneByShell
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function getDateAndTimezoneByShell(callback) {
    try {
        console.time('gettime');
        if (os.platform() == "linux") {

            async.parallel([
                function (cb) {
                    let cmd = "date -R|awk '{print $6}'";
                    exec(cmd, (error, stdout, stderr) => {
                        if (error || stderr) {
                            cb(error || stderr, null);
                        } else {
                            cb(null, stdout.replace('\n', ''));
                        }
                    });
                },
                function (cb) {
                    let cmd = "date +'%Y-%m-%d %H:%M:%S'";
                    exec(cmd, (error, stdout, stderr) => {
                        if (error || stderr) {
                            cb(error || stderr, null);
                        } else {
                            cb(null, stdout.replace('\n', ''));
                        }
                    });
                }],
                function (err, results) {
                    if (err) {
                        callback(err, null);
                    } else {
                        let result = {
                            timezone: results[0],
                            datetime: results[1]
                        };
                        callback(null, result);
                        console.timeEnd('gettime');
                    }
                });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 方法说明 设置时间和时区（异步）
 * @method setTimeAndTimeZoneBySo
 * @for SystemCli
 * @param config
 * @param callback
 */
function setTimeAndTimeZoneBySo(config, callback) {
    try {
        if (os.platform() == "linux") {
            if (env == "Production_dnh") {
                console.log(JSON.stringify(config));
            }
            let libDatetimeSetting = ffi.Library(soPath + '/libDatetimeSetting.so', {
                'setTimezone': ['int', ['int', 'string']],
                'setDatetime': ['int', ['int', 'int', 'string', 'string', 'string']],
                'setDaylightSaving': ['int', ['int', 'int', 'int', 'int', 'int', 'string', 'int', 'int', 'int', 'string']],
            });

            async.waterfall([
                function (cb) {
                    if (config.timezone && null != config.timezone) {
                        console.log("set timezone: " + JSON.stringify(config.timezone));
                        libDatetimeSetting.setTimezone.async(1, String(config.timezone), (err, resp) => {
                            if (env == "Production_dnh") {
                                console.log("set timezone result:", resp);
                            }
                            if (err) {
                                cb(40099, err);
                            } else {
                                switch (resp) {
                                    case 1:
                                        cb(null, "success");
                                        break;
                                    case 2:
                                        cb(40034, null);
                                        break;
                                    case 3:
                                        cb(40030, null);
                                        break;
                                    case 4:
                                        cb(40037, null);
                                        break;
                                    case 5:
                                        cb(40012, null);
                                        break;
                                    default:
                                        cb(resp, null);
                                        break;
                                }
                            }
                        });
                    } else {
                        cb(null, null);
                    }
                },
                function (result1, cb) {
                    if (config.enableNTP || config.NTPServer || config.datetime) {
                        console.log("set date time: " + [1, config.enableNTP, config.defaultNTPServer, config.NTPServer, config.datetime]);
                        libDatetimeSetting.setDatetime.async(1, config.enableNTP, config.defaultNTPServer, config.NTPServer, config.datetime, (err, resp) => {
                            if (env == "Production_dnh") {
                                console.log("set date time result:", resp);
                            }
                            if (err) {
                                cb(40099, err);
                            } else {
                                switch (resp) {
                                    case 1:
                                        cb(null, "Success");
                                        break;
                                    case 2:
                                        cb(40034, null);
                                        break;
                                    case 3:
                                        cb(40030, null);
                                        break;
                                    case 4:
                                        cb(40035, null);
                                        break;
                                    case 5:
                                        cb(40036, null);
                                        break;
                                    case 6:
                                        cb(40011, null);
                                        break;
                                    case 7:
                                        cb(40012, null);
                                        break;
                                    default:
                                        cb(resp, null);
                                        break;
                                }
                            }
                        });
                    } else {
                        cb(null, null);
                    }
                },
                function (result2, cb) {
                    if (config.enableDST
                        || config.offsetSeconds
                        || config.startMonth
                        || config.startWeek
                        || config.startDay
                        || config.startTime
                        || config.endMonth
                        || config.endWeek
                        || config.endDay
                        || config.endTime) {
                        console.log("set daylight saving: " + [config.enableDST,
                        config.offsetSeconds,
                        config.startMonth,
                        config.startWeek,
                        config.startDay,
                        config.startTime,
                        config.endMonth,
                        config.endWeek,
                        config.endDay,
                        config.endTime]);
                        libDatetimeSetting.setDaylightSaving.async(config.enableDST,
                            config.offsetSeconds,
                            config.startMonth,
                            config.startWeek,
                            config.startDay,
                            config.startTime,
                            config.endMonth,
                            config.endWeek,
                            config.endDay,
                            config.endTime, (err, resp) => {
                                if (env == "Production_dnh") {
                                    console.log("set daylight saving result:", resp);
                                }
                                if (err) {
                                    cb(40099, err);
                                } else {
                                    switch (resp) {
                                        case 0:
                                            cb("0", null);
                                            break;
                                        case 1:
                                            cb(null, "success");
                                            break;
                                        case 2:
                                            cb(40080, null);
                                            break;
                                        case 3:
                                            cb(40081, null);
                                            break;
                                        case 4:
                                            cb(40082, null);
                                            break;
                                        case 5:
                                            cb(40083, null);
                                            break;
                                        case 6:
                                            cb(40084, null);
                                            break;
                                        case 7:
                                            cb(40085, null);
                                            break;
                                        case 8:
                                            cb(40086, null);
                                            break;
                                        case 9:
                                            cb(40087, null);
                                            break;
                                        case 10:
                                            cb(40088, null);
                                            break;
                                        case 11:
                                            cb(40089, null);
                                            break;
                                        case 12:
                                            cb(40090, null);
                                            break;
                                        default:
                                            cb(resp, null);
                                            break;
                                    }
                                }
                            });
                    } else {
                        cb(null, null);
                    }
                },
            ],
                function (err, result) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, result);
                    }
                });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        if (env == "Production_dnh") {
            console.log("set time & timezone exception:", e);
        }
        callback(40099, null);
    }
}

/**
 * 方法说明 设置时间和时区（同步）
 * @method setTimeAndTimeZoneSync
 * @for SystemCli
 * @param config : {timezone: null, enableNtp: 0, ntpServer: "", strDatetime: ""};
 * @return {number}
 */
function setTimeAndTimeZoneSync(config) {
    try {
        if (os.platform() == "linux") {
            if (env == "Production_dnh") {
                console.log(JSON.stringify(config));
            }
            let libDatetimeSetting = ffi.Library(soPath + '/libDatetimeSetting.so', {
                'setTimezone': ['int', ['int', 'string']],
                'setDatetime': ['int', ['int', 'int', 'string', 'string', 'string']],
                'setDaylightSaving': ['int', ['int', 'int', 'int', 'int', 'int', 'string', 'int', 'int', 'int', 'string']],
            });
            let result1 = 1;
            let result2 = 1;
            let result3 = 1;
            if (config.timezone && null != config.timezone) {
                result1 = libDatetimeSetting.setTimezone(1, String(config.timezone));
                if (env == "Production_dnh") {
                    console.log("set timezone result:", result1);
                }
            }
            if (config.enableNTP || config.NTPServer || config.datetime) {
                result2 = libDatetimeSetting.setDatetime(1, config.enableNTP, config.defaultNTPServer, config.NTPServer, config.datetime);
                if (env == "Production_dnh") {
                    console.log("set time result:", result2);
                }
            }
            if (config.enableDST
                || config.offsetSeconds
                || config.startMonth
                || config.startWeek
                || config.startDay
                || config.startTime
                || config.endMonth
                || config.endWeek
                || config.endDay
                || config.endTime) {
                result3 = libDatetimeSetting.setDaylightSaving(config.enableDST,
                    config.offsetSeconds,
                    config.startMonth,
                    config.startWeek,
                    config.startDay,
                    config.startTime,
                    config.endMonth,
                    config.endWeek,
                    config.endDay,
                    config.endTime);
                if (env == "Production_dnh") {
                    console.log("set daylight saving result:", result3);
                }
            }
            return result1 + result2 + result3;
        } else {
            return 40001;
        }
    } catch (e) {
        if (env == "Production_dnh") {
            console.log("set time & timezone exception:", e);
        }
        return 40099;
    }
}

/**
 * 方法说明 获取当前系统时间
 * @method getDatetimeBySo
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function getDatetimeBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libDatetimeSetting = ffi.Library(soPath + '/libDatetimeSetting.so', {
                'getDatetime': ['string', []],
            });
            libDatetimeSetting.getDatetime.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case "ErrDB":
                            callback(40011, null);
                            break;
                        case "ErrTable":
                            callback(40012, null);
                            break;
                        default:
                            let result = {
                                enableNTP: null,
                                defaultNTPServer: null,
                                NTPServer: null,
                                datetime: null
                            };
                            let jsonObj = JSON.parse(resp);
                            result.enableNTP = jsonObj.ntpEnable;
                            result.defaultNTPServer = jsonObj.ntpServer1;
                            result.NTPServer = jsonObj.ntpServer2;
                            result.datetime = jsonObj.datetime.replace(/-/g, '/');

                            callback(null, result);
                    }
                }
            });

        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 方法说明 获取当前系统夏令时
 * @method getDSTBySo
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function getDSTBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libDatetimeSetting = ffi.Library(soPath + '/libDatetimeSetting.so', {
                'getDaylightSaving': ['string', []],
            });
            libDatetimeSetting.getDaylightSaving.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case 2:
                            callback(40011, null);
                            break;
                        case 3:
                            callback(40012, null);
                            break;
                        default:
                            let result = {
                                enableDST: null,
                                offsetSeconds: null,
                                startMonth: null,
                                startWeek: null,
                                startDay: null,
                                startTime: null,
                                endMonth: null,
                                endWeek: null,
                                endDay: null,
                                endTime: null
                            };
                            let jsonObj = JSON.parse(resp);
                            result.enableDST = jsonObj.isdst;
                            result.offsetSeconds = jsonObj.offsetSeconds;
                            result.startMonth = jsonObj.startMonth;
                            result.startWeek = jsonObj.startWeek;
                            result.startDay = jsonObj.startDay;
                            result.startTime = jsonObj.startTime;
                            result.endMonth = jsonObj.endMonth;
                            result.endWeek = jsonObj.endWeek;
                            result.endDay = jsonObj.endDay;
                            result.endTime = jsonObj.endTime;
                            callback(null, result);
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//libDB.so
/**
 * 方法说明 获取固件升级状态
 * @method getFirmwareUpgradeStatusBySo
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function getFirmwareUpgradeStatusBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libDB = ffi.Library(soPath + '/libDB.so', {
                'getFirmwareUpgradeStatus': ['int', []],
            });
            libDB.getFirmwareUpgradeStatus.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case 0:
                            callback(null, 40050);
                            break;
                        case 1:
                            callback(null, 40051);
                            break;
                        case 2:
                            callback(40011, null);
                            break;
                        case 3:
                            callback(40012, null);
                            break;
                    }
                }
            });
        } else {
            // callback(40001, null);
            callback(null, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//restart
/**
 * 方法说明 重启
 * @method rebootBySo
 * @for SystemCli
 * @param 无
 * @callback {callback} callback(errorCode,message)
 */
function rebootBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let cmd = '/usr/sbin/dnh/restart';
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, "info:" + stdout.replace('\n', '') + "\nerr:" + stderr.replace('\n', ''));
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//shutdown
/**
 * 方法说明 关闭
 * @method shutdownBySo
 * @for SystemCli
 * @param 无
 * @callback {callback} callback(errorCode,message)
 */
function shutdownBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let cmd = '/usr/sbin/dnh/shutdown';
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, "info:" + stdout.replace('\n', '') + "\nerr:" + stderr.replace('\n', ''));
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//libFactoryReset.so
/**
 * 方法说明 恢复出厂设置  废弃
 * @method setFactoryResetBySo
 * @for SystemCli
 * @param 无
 * @callback {callback} callback(errorCode,message)
 */
function setFactoryResetBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libFactoryReset = ffi.Library(soPath + '/libFactoryReset.so', {
                'setFactoryReset': ['int', []]
            });
            libFactoryReset.setFactoryReset.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    if (resp != 0)
                        callback(null, "success");
                    else
                        callback('0', null);
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//libCLI.so
/**
 * 方法说明 获取系统信息
 * @method getSystemAboutBySo
 * @for SystemCli
 * @param 无
 * @callback {callback} callback(errorCode,message)
 */
function getSystemAboutBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libCLI = ffi.Library(soPath + '/libCLI.so', {
                'getSystemInfo': ['string', []],
            });

            libCLI.getSystemInfo.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    let result = {
                        fwVersion: null,
                        nvrVersion: null,
                        macAddress: null,
                        ip: { ipMode: null, ipAddress: null, netmask: null, gateway: null, dns1: null, dns2: null },
                        ipv6: null,
                        NTPServer: null,
                        time: null,
                        timezone: null,
                        sysUsage: null,
                        sdUsage: null,
                        usbUsage: null,
                        upTime: null,
                        ncVersion: null,
                        hwVersion: null,
                        ddpClientVersion: null,
                        NTPStatus: null,
                        sdStatus: null,
                        webAccessPort: null,
                        lanPortStatus: null,
                        dstStatus: null,
                        dstOffset: null,
                        dstStart: null,
                        dstEnd: null
                    };
                    let errCode = null;
                    //console.debug_log(`getSystemInfo result: ${resp}`);
                    let jsonObj = JSON.parse(resp);
                    result.fwVersion = jsonObj.fwVersion;
                    result.nvrVersion = jsonObj.nvrVersion;
                    result.macAddress = jsonObj.macAddress;
                    result.ip.ipMode = jsonObj.ipMode;
                    result.ip.ipAddress = jsonObj.ipAddress;
                    result.ip.netmask = jsonObj.netmask;
                    result.ip.gateway = jsonObj.gateway;
                    result.ip.dns1 = jsonObj.dns1;
                    result.ip.dns2 = jsonObj.dns2;
                    result.NTPServer = jsonObj.ntp;
                    result.time = jsonObj.time;
                    result.timezone = jsonObj.timezone;
                    result.sysUsage = jsonObj.sysUsage;
                    result.sdUsage = jsonObj.sdUsage;
                    result.usbUsage = jsonObj.usbUsage;
                    result.upTime = jsonObj.upTime;
                    result.ncVersion = jsonObj.ncVersion;
                    result.hwVersion = jsonObj.hwVersion;
                    result.ddpClientVersion = jsonObj.ddpClientVersion;
                    result.NTPStatus = jsonObj.ntpStatus;
                    result.webAccessPort = jsonObj.webAccessPort;
                    result.lanPortStatus = jsonObj.lanPortStatus;
                    result.dstStatus = jsonObj.dstStatus;
                    result.dstOffset = jsonObj.dstOffset;
                    result.dstStart = jsonObj.dstStart;
                    result.dstEnd = jsonObj.dstEnd;

                    if (null != errCode) {
                        callback(errCode, null);
                    } else {
                        callback(null, result);
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//libCLI.so
/**
 * 方法说明 设置mac地址
 * @method setMACAddressBySo
 * @for SystemCli
 * @param @param list config格式：["mac地址字符串"]
 * @callback {callback} callback(errorCode,message)
 */
function setMACAddressBySo(config, callback) {
    try {
        if (os.platform() == "linux") {
            if (env == "Production_dnh") {
                console.log(JSON.stringify(config));
            }
            let libCLI = ffi.Library(soPath + '/libCLI.so', {
                'setMACAddress': ['int', ['string']],
            });
            libCLI.setMACAddress.async(config[0], (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    if (resp == 1)
                        callback(null, "success");
                    else
                        callback('0', null);
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 方法说明 设置admin用户密码
 * @method setAdminPasswordBySo
 * @for SystemCli
 * @param @param list config格式：["密码"]
 * @callback {callback} callback(errorCode,message)
 */
function setAdminPasswordBySo(config, callback) {
    try {
        if (os.platform() == "linux") {
            if (env == "Production_dnh") {
                console.log(JSON.stringify(config));
            }
            if (config && [] != config) {
                let libCLI = ffi.Library(soPath + '/libCLI.so', {
                    'setAdminPassword': ['int', ['string']],
                });
                libCLI.setAdminPassword.async(config[0], (err, resp) => {
                    if (err) {
                        callback(40099, err);
                    } else {
                        if (resp == 1)
                            callback(null, "success");
                        else
                            callback('0', null);
                    }
                });
            } else {
                callback(40005, null);
            }
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//libCLI.so
/**
 * 方法说明 保存配置
 * @method SaveBySo
 * @for SystemCli
 * @param 无
 * @callback {callback} callback(errorCode,message)
 */
function SaveBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libCLI = ffi.Library(soPath + '/libCLI.so', {
                'save': ['int', []],
            });
            libCLI.save.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    if (resp == 1)
                        callback(null, "success");
                    else
                        callback('0', null);
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//libCLI.so
/**
 * 方法说明 设置系统名称
 * @method setSystemNameBySo
 * @for SystemCli
 * @param name 系统名称
 * @callback {callback} callback(errorCode,message)
 */
function setSystemNameBySo(name, callback) {
    try {
        if (os.platform() == "linux") {
            let libCLI = ffi.Library(soPath + '/libCLI.so', {
                'setDeviceName': ['int', ['string']],
            });
            libCLI.setDeviceName.async(name, (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    if (resp == 1)
                        callback(null, "success");
                    else
                        callback('0', null);
                }
            });
        } else {
            callback(null, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//libFTPClient.so
/**
 * 方法说明 FTP下载
 * @method FTPDownloadBySo
 * @for SystemCli
 * @param @param list config格式：["FTP服务器地址",端口号,"用户名","密码","源文件路径","文件名","目标路径"]
 *         so中参数列表：(char*  strIpAddr, int nPort,char* strlogin, char* strPassword,
 *         char* strSrcFilePath, char* strFileName, char* strDesFilePath)
 * @callback {callback} callback(errorCode,message)
 */
function FTPDownloadBySo(config, callback) {
    try {
        if (os.platform() == "linux") {
            if (env == "Production_dnh") {
                console.log(JSON.stringify(config));
            }
            let libFTPClient = ffi.Library(soPath + '/libFTPClient.so', {
                'download': ['int', ['string', 'int', 'string', 'string', 'string', 'string', 'string']]
            });
            libFTPClient.download.async(config[0], config[1], config[2], config[3], config[4], config[5], "/userdata/fwTmp/", (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    /*
                    1. Success
                    2. Error: FTP server does not exist
                    3. Error: FW file does not exist
                    4. Error: Destination path does not existent
                    5. Error: Timeout
                    6. Error: Login Fail
                    */
                    switch (resp) {
                        case 1:
                            callback(null, config[5]);
                            break;
                        case 2:
                            callback(40020, null);
                            break;
                        case 3:
                            callback(40021, null);
                            break;
                        case 4:
                            callback(40022, null);
                            break;
                        case 5:
                            callback(40023, null);
                            break;
                        case 6:
                            callback(40024, null);
                            break;
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

function FTPUploadBySo(config, callback) {
    config.ftpPort = parseInt(config.ftpPort);
    console.log(config);
    try {
        if (os.platform() == "linux") {
            if (env == "development") {
                console.log(JSON.stringify(config));
            }
            let libFTPClient = ffi.Library(soPath + '/libFTPClient.so', {
                'upload': ['int', ['string', 'int', 'string', 'string', 'string', 'string']]
            });
            console.debug_log("调用 libFTPClient upload 方法");
            libFTPClient.upload.async(config.ftpHost, config.ftpPort, config.userName, config.password, config.ftpFolder, config.sourceFile, (err, resp) => {
                if (err) {
                    console.debug_log("libFTPClient upload error");
                    console.debug_log(err);
                    callback(40099, err);
                } else {
                    /*
                    1. Success
                   2. Error: FTP server does not exist
                   3. Error: FW file does not exist
                  4. Error: Destination path does not existent
                 5. Error: Timeout
                 6. Error: Login Fail
                    */
                    switch (resp) {
                        case 1:
                            callback(null, config.ftpFolder);
                            break;
                        case 2:
                        case 3:
                        case 4:
                        case 5:
                        case 6:
                            callback(resp, null);
                            break;
                        default:
                            callback(resp, null);
                            break;
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        console.debug_log("libFTPClient error");
        console.debug_log(e);
        callback(40099, e);
    }
}

//libFWValidate.so
/**
 * 方法说明 验证固件文件
 * @method checkHeaderAndPayloadBySo
 * @for SystemCli
 * @param @param list config格式：["源文件路径","文件名"]
 *         so中参数列表： (char* strFilePath, char* strFileName)
 * @callback {callback} callback(errorCode,message)
 */
function checkHeaderAndPayloadBySo(config, callback) {
    try {
        if (os.platform() == "linux") {
            if (env == "Production_dnh") {
                // console.log(JSON.stringify(config));
            }
            let libFWValidate = ffi.Library(soPath + '/libFWValidate.so', {
                'checkHeaderAndPayload': ['int', ['string', 'string']]
            });
            libFWValidate.checkHeaderAndPayload.async(config[0], config[1], (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    /*
                    1. Valid
                    2. Invalid: FW file does not exist
                    3. Invalid: Header is incorrect
                    4. Invalid: Payload is incorrect
                     */
                    switch (resp) {
                        case 1:
                            callback(null, "Valid");
                            break;
                        case 2:
                            callback(40021, null);
                            break;
                        case 3:
                            callback(40025, null);
                            break;
                        case 4:
                            callback(40026, null);
                            break;
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//libUtilityTar.so
/**
 * 方法说明 解压tar文件
 * @method unTarBySo
 * @for SystemCli
 * @param @param list config格式：["源文件路径","文件名","目标路径"]
 *         so中参数列表：  (char* strFilePath, char* strFileName, char* strDesFilePath)
 * @callback {callback} callback(errorCode,message)
 */
function unTarBySo(config, callback) {
    try {
        if (os.platform() == "linux") {
            if (env == "Production_dnh") {
                console.log(JSON.stringify(config));
            }
            let libUtilityTar = ffi.Library(soPath + '/libUtilityTar.so', {
                'unTar': ['int', ['string', 'string', 'string']]
            });
            libUtilityTar.unTar.async(config[0], config[1], config[2], (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    /*
                    1. Success
                    2. Error: File(tar) does not exist
                    3. Error: File is not tar format
                    4. Error: Destination path does not exist.
                     */
                    switch (resp) {
                        case 1:
                            callback(null, "Success");
                            break;
                        case 2:
                            callback(40028, null);
                            break;
                        case 3:
                            callback(40027, null);
                            break;
                        case 4:
                            callback(40022, null);
                            break;
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 方法说明 设置固件升级状态
 * @method setFirmwareUpgradeStatus
 * @for SystemCli list config格式：[0|1]
 *      说明：0. Idle 1. Busy
 * @callback {callback} callback(errorCode,message)
 */
function setFirmwareUpgradeStatusBySo(config, callback) {
    config = [].concat(config); //兼容之前的API格式
    try {
        if (os.platform() == "linux") {
            if (env == "Production_dnh") {
                // console.log(JSON.stringify(config));
            }
            let libDB = ffi.Library(soPath + '/libDB.so', {
                'setFirmwareUpgradeStatus': ['int', ['int']],
            });
            libDB.setFirmwareUpgradeStatus.async(config[0], (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case 1:
                            callback(null, "Success");
                            break;
                        case 2:
                            callback(40011, null);
                            break;
                        case 3:
                            callback(40012, null);
                            break;
                        case 4:
                            callback(40051, null);
                            break;
                    }
                }
            });
        } else {
            // callback(40001, null);
            callback(null, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 方法说明 获取nc版本
 * @method getNCVersionBySo
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function getNCVersionBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libDB = ffi.Library(soPath + '/libDB.so', {
                'getNCVersion': ['string', []],
            });
            libDB.getNCVersion.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    callback(null, resp);
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 方法说明 获取设备uuid
 * @method getDeviceUUIDBySo
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function getDeviceUUIDBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libDB = ffi.Library(soPath + '/libDB.so', {
                'getDeviceUUID': ['string', []],
            });
            libDB.getDeviceUUID.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    callback(null, resp);
                }
            });
        } else {
            callback(null, "FFFFFFFFFFFF");
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 方法说明 获取设备Web Access Port
 * @method getWebAccessPortBySo
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function getWebAccessPortBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libDB = ffi.Library(soPath + '/libDB.so', {
                'getWebAccessPort': ['int', []],
            });
            libDB.getWebAccessPort.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    callback(null, resp);
                }
            });
        } else {
            callback(null, "443");
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 方法说明 设置设备Web Access Port
 * @method getWebAccessPortBySo
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function setWebAccessPortBySo(port, callback) {
    try {
        if (os.platform() == "linux") {
            let libDB = ffi.Library(soPath + '/libDB.so', {
                'setWebAccessPort': ['int', ['int']],
            });
            libDB.setWebAccessPort.async(name, (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    if (resp == 1) {
                        callback(null, "success");
                    } else {
                        callback('0', null);
                    }
                }
            });
        } else {
            callback(null, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 方法说明 执行固件升级命令
 * @method fwUpgradeBySo
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function fwUpgradeBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let cmd = '/usr/sbin/dnh/fwUpgrade';
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, "info:" + stdout.replace('\n', '') + "\nerr:" + stderr.replace('\n', ''));
                    //todo 根据确定好的返回内容再进行修正
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//libConsoleSetting.so
/**
 * 方法说明 设置console配置(异步）
 * @method setConsoleSettingBySo
 * @for SystemCli
 * @param @param list config格式：["启用状态类型","协议类型","超时时间"]
 *      enableConsole: [0|1|-1],1 enable, 0 disable, -1 no change
 *      strProtocol: ["telnet"|"ssh"|"-1"], “telnet” for telnet , “ssh” for ssh, “-1” for no change
 *      nTimeoutSec: [300|0|-1], 300: 300 seconds, 0: no timeout, -1: no change
 *      so中参数列表：  (int enableConsole, char* strProtocol, int nTimeoutSec)
 * @callback {callback} callback(errorCode,message)
 */
function setConsoleSettingBySo(config, callback) {
    try {
        if (os.platform() == "linux") {
            if (env == "Production_dnh") {
                console.log(JSON.stringify(config));
            }
            let libConsoleSetting = ffi.Library(soPath + '/libConsoleSetting.so', {
                'setConsoleSetting': ['int', ['int', 'string', 'int']],
            });
            libConsoleSetting.setConsoleSetting.async(config[0], String(config[1]), config[2], (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    if (env == "Production_dnh") {
                        console.log("set console result:", resp);
                    }

                    switch (resp) {
                        case 1:
                            callback(null, 1);
                            break;
                        case 2:
                            callback(40030, null);
                            break;
                        case 3:
                            callback(40031, null);
                            break;
                        case 4:
                            callback(40032, null);
                            break;
                        case 5:
                            callback(40011, null);
                            break;
                        case 6:
                            callback(40012, null);
                            break;
                        default:
                            callback(40099, null);
                            break;
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        if (env == "Production_dnh") {
            console.log("set console exception:", e);
        }
        callback(40099, null);
    }
}

/**
 * 方法说明 设置console配置（同步）
 * @method setConsoleSettingBySoSync
 * @for SystemCli
 * @param @param list config格式：["启用状态类型","协议类型","超时时间"]
 *      enableConsole: [0|1|-1],1 enable, 0 disable, -1 no change
 *      strProtocol: ["telnet"|"ssh"|"-1"], “telnet” for telnet , “ssh” for ssh, “-1” for no change
 *      nTimeoutSec: [300|0|-1], 300: 300 seconds, 0: no timeout, -1: no change
 *      so中参数列表：  (int enableConsole, char* strProtocol, int nTimeoutSec)
 * @return 1|errorCode
 */
function setConsoleSettingBySoSync(config) {
    try {
        if (os.platform() == "linux") {
            if (env == "Production_dnh") {
                console.log(JSON.stringify(config));
            }
            let libConsoleSetting = ffi.Library(soPath + '/libConsoleSetting.so', {
                'setConsoleSetting': ['int', ['int', 'string', 'int']],
            });
            let result = libConsoleSetting.setConsoleSetting(config[0], String(config[1]), config[2]);
            if (env == "Production_dnh") {
                console.log("set console result:", result);
            }
            switch (result) {
                case 1:
                    return 1;
                case 2:
                    return 40030;
                case 3:
                    return 40031;
                case 4:
                    return 40032;
                case 5:
                    return 40011;
                case 6:
                    return 40012;
            }
        } else {
            return 40001;
        }
    } catch (e) {
        if (env == "Production_dnh") {
            console.log("set console exception:", e);
        }
        return 40099;
    }
}

//libConsoleSetting.so
/**
 * 方法说明 获取console配置
 * @method getConsoleSettingBySo
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function getConsoleSettingBySo(callback) {
    try {
        if (os.platform() == "linux") {

            let libConsoleSetting = ffi.Library(soPath + '/libConsoleSetting.so', {
                'getConsoleSetting': ['string', []],
            });

            libConsoleSetting.getConsoleSetting.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case "ErrItem":
                            callback(40033, null);
                            break;
                        case "ErrDB":
                            callback(40011, null);
                            break;
                        case "ErrTable":
                            callback(40012, null);
                            break;
                        default:
                            let adapter = { enableConsole: 1, consoleProtocol: "ssh", timeout: 300 };
                            if (null != resp || "" != resp) {
                                let result2json = JSON.parse(resp);
                                adapter.enableConsole = result2json.enable;
                                adapter.consoleProtocol = result2json.protocol;
                                adapter.timeout = result2json.timeout;
                            }
                            callback(null, adapter);
                            break;
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//factoryReset
/**
 * 方法说明 恢复出厂设置[可执行程序]
 * @method factoryResetByExec
 * @for SystemCli
 * @param keepLan (keepLan==true，恢复出厂设置但保留网络设置)
 * @callback {callback} callback(errorCode,message)
 */
function factoryResetByExec(keepLan, callback) {
    try {
        if (os.platform() == "linux") {
            let cmd = 'nohup /usr/sbin/dnh/factoryReset';
            if (keepLan) {
                cmd = 'nohup /usr/sbin/dnh/factoryReset keeplan';
            }
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, "info:" + stdout.replace('\n', '') + "\nerr:" + stderr.replace('\n', ''));
                    //todo 根据确定好的返回内容再进行修正
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//formatSDCardBySo
/**
 * 方法说明 格式化SD卡
 * @method formatSDCardBySo
 * @for SystemCli
 * @param 无
 * @callback {callback} callback(errorCode,message)
 */
function formatSDCardBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let cmd = 'echo "" > /usr/sbin/dnh/formatSD';
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, "success");
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//restartMonitoring
/**
 * 方法说明 重启monitor[可执行程序]
 * @method restartMonitoring
 * @for SystemCli
 * @param 无
 * @callback {callback} callback(errorCode,message)
 */
function restartMonitoringBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let cmd = 'echo "" > /usr/sbin/dnh/triger';
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, "success");
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//libUptime.so
/**
 * 方法说明 获取系统上线时间
 * @method getUptimeBySo
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function getUptimeBySo(callback) {
    try {
        if (os.platform() == "linux") {

            let libUptime = ffi.Library(soPath + '/libUptime.so', {
                'getUptime': ['string', []],
            });

            libUptime.getUptime.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    callback(null, parseInt(resp, 10));
                }
            });
        } else {
            callback(null, 4800);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//libFtpSetting.so
/**
 * 方法说明 修改FTP信息
 * @method setFtpDataBySo
 * @for SystemCli
 * @param list config格式：["ftpServer","ftpPort","ftpUsername","ftpPassword"]
 *      so中参数列表：(char* ftpServer, int ftpPort, char* ftpUsername, char* ftpPassword)
 * @callback {callback} callback(errorCode,message)
 */
function setFtpDataBySo(config, callback) {
    try {
        if (os.platform() == "linux") {
            if (env == "Production_dnh") {
                console.log(JSON.stringify(config));
            }
            let libFtpSetting = ffi.Library(soPath + '/libFtpSetting.so', {
                'setFtpData': ['int', ['string', 'int', 'string', 'string']],
            });

            libFtpSetting.setFtpData.async(config[0], config[1], config[2], config[3], (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    if (env == "Production_dnh") {
                        console.log("set ftp data result:", resp);
                    }
                    switch (resp) {
                        case 0:
                            callback(40011, null);
                            break;
                        case 1:
                            callback(null, "Success");
                            break;
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}
function getCityDatetime(callback) {
    try {
        if (os.platform() == "linux") {
            let libDatetimeSetting = ffi.Library(soPath + '/libDatetimeSetting.so', {
                'getCityDatetime': ['string', []],
            });
            libDatetimeSetting.getCityDatetime.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case "ErrDB":
                            callback(40011, null);
                            break;
                        case "ErrTable":
                            callback(40012, null);
                            break;
                        default:
                            let result = {
                                cityId: null,
                                offsetSeconds: null,
                                startMonth: null,
                                startWeek: null,
                                startDay: null,
                                startTime: null,
                                endMonth: null,
                                endWeek: null,
                                endDay: null,
                                isInDstPeriod: null,
                                dstPosix: null,
                            };
                            let jsonObj = JSON.parse(resp);
                            result.cityId = jsonObj.cityId;
                            result.offsetSeconds = jsonObj.offsetSeconds;
                            result.startMonth = jsonObj.startMonth;
                            result.startWeek = jsonObj.startWeek;
                            result.startDay = jsonObj.startDay;
                            result.startTime = jsonObj.startTime;
                            result.endMonth = jsonObj.endMonth;
                            result.endWeek = jsonObj.endWeek;
                            result.endDay = jsonObj.endDay;
                            result.isInDstPeriod = jsonObj.isInDstPeriod;
                            result.dstPosix = jsonObj.dstPosix;
                            callback(null, result);
                    }
                }
            });

        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}
//libFtpSetting.so
/**
 * 方法说明 获取FTP信息
 * @method getFtpDataBySo
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function getFtpDataBySo(callback) {
    try {
        if (os.platform() == "linux") {

            let libFtpSetting = ffi.Library(soPath + '/libFtpSetting.so', {
                'getFtpData': ['string', []],
            });

            libFtpSetting.getFtpData.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    let ftpData = { ftpServer: "", ftpPort: 21, ftpUsername: "", ftpPassword: "" };
                    if (null != resp || "" != resp) {
                        let result2json = JSON.parse(resp);
                        ftpData.ftpServer = result2json.address;
                        ftpData.ftpPort = result2json.port;
                        ftpData.ftpUsername = result2json.username;
                        ftpData.ftpPassword = result2json.password;
                    }
                    callback(null, ftpData);
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//libKiller.so
/**
 * 方法说明 终止console进程
 * @method killConsolesBySo
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function killConsolesBySo(callback) {
    try {
        if (os.platform() == "linux") {

            let libKiller = ffi.Library(soPath + '/libKiller.so', {
                'killConsoles': ['int', []],
            });

            libKiller.killConsoles.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case 0:
                            callback(40041, null);
                            break;
                        case 1:
                            callback(null, "Success");
                            break;
                    }
                }
            });
        } else {
            // callback(40001, null);
            callback(null, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//libLed.so
/**
 * 方法说明 設定SSO狀態
 * @method setSsoLedBySo
 * @for SystemCli
 * @param ssoMode
 *    0: disable
 *    1: enable
 *    2: enable, timeout
 *    3: enable, server stop
 * @callback {callback} callback(errorCode,message)
 */
function setSsoLedBySo(ssoMode, callback) {
    try {
        if (os.platform() == "linux") {

            let libLed = ffi.Library(soPath + '/libLed.so', {
                'setSsoLed': ['int', ['int']],
            });

            libLed.setSsoLed.async(ssoMode, (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case 0:
                            callback('0', null);
                            break;
                        case 1:
                            callback(null, "Success");
                            break;
                        case 2:
                            callback(40070, null);
                            break;
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * ledColor1
 0: off
 1: red
 2: green
 3: orange
 ledColor2
 -1: not blink
 0: off
 1: red
 2: green
 3: orange
 * @param config
 * @param callback
 */
function setPowerLedBySo(config, callback) {
    try {
        if (os.platform() == "linux") {

            let libLed = ffi.Library(soPath + '/libLed.so', {
                'setPowerLed': ['int', ['int', 'int']],
            });

            libLed.setPowerLed.async(config[0], config[1], (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case 0:
                            callback('0', null);
                            break;
                        case 1:
                            callback(null, "Success");
                            break;
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 方法说明 删除/mnt/ramdisk目录下所有统计资料db文件
 * @method removeRamStatsFile
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function removeRamStatsFile(callback) {
    try {
        if (os.platform() == "linux") {
            let cmd = 'rm -f /mnt/ramdisk/statistic-*';
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, "info:" + stdout.replace('\n', '') + "\nerr:" + stderr.replace('\n', ''));
                    //todo 根据确定好的返回内容再进行修正
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 方法说明 备份/mnt/ramdisk/log-data.db至sdcard
 * @method backupFromRamToSd
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function backupFromRamToSd(callback) {
    try {
        if (os.platform() == "linux") {
            let cmd = 'nohup /usr/sbin/dnh/pump';
            exec(cmd, (error, stdout, stderr) => {
                if (error || stderr) {
                    if (error) {
                        callback(error, null);
                    }
                    else {
                        callback(stderr, null);
                    }
                } else {
                    callback(null, 'Success');
                }
            });
        } else {
            callback(null, null);
        }
    } catch (e) {
        callback(40099, e);
    }
    /*
    try {
        if (os.platform() == "linux") {
            let cmd = 'sqlite3 /mnt/ramdisk/log-data.mongodb .dump > /mnt/sdcard/log-data.sql';
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, "info:" + stdout.replace('\n', '') + "\nerr:" + stderr.replace('\n', ''));
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
    */
}

/**
 * 方法说明 将/mnt/sdcard/log-data.sql恢复至ramdisk
 * @method recoverFromSdToRam
 * @for SystemCli
 * @callback {callback} callback(errorCode,message)
 */
function recoverFromSdToRam(callback) {
    try {
        if (os.platform() == "linux") {
            let cmd = 'sqlite3 /mnt/ramdisk/log-data.db < /mnt/sdcard/log-data.sql';
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, "info:" + stdout.replace('\n', '') + "\nerr:" + stderr.replace('\n', ''));
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 检查文件是否存在
 * @param path
 * @return {Promise<any>}
 */
function checkFile(path) {
    let p = new Promise(function (resolve, reject) {
        fs.access(path, fs.constants.F_OK, (err) => {
            if (err) {
                resolve(false);
            } else {
                resolve(true);
            }
        })
    });
    return p;
}

/**
 * 方法说明 获取当前系统状态(sd卡、ntp server)
 * @method getCurrStatus
 * @for SystemCli
 * @retrun object {"ntpStatus":0, "sdStatus":0}
 * ntpStatus: 0, ntp未取得時間. 1, ntp取得時間. 2, 手動設定時間
 * sdStatus : 0, 未插入MicroSD. 1, 已插入MicroSD(rw). 2, 已插入MicroSD(ro)或讀取MircoSD有問題
 */
function getCurrStatus() {
    let p = new Promise(function (resolve, reject) {
        try {
            Promise.all([
                checkFile('/mnt/ramdisk/sd_done'),
                checkFile('/mnt/ramdisk/sd_none'),
                checkFile('/mnt/ramdisk/time_done'),
                checkFile('/mnt/ramdisk/ntp_enabled')]).then(result => {
                    let curr = { sdStatus: 0, ntpStatus: 0 };
                    if (result[0]) {
                        curr.sdStatus = 1;
                    }
                    if (result[0] === false && result[1] === false) {
                        curr.sdStatus = 2;
                    }
                    if (result[2] && result[3]) {
                        curr.ntpStatus = 1;
                    }
                    if (result[2] === false && result[3] === false) {
                        curr.ntpStatus = 2;
                    }
                    resolve(curr);
                });
        } catch (e) {
            resolve({ sdStatus: 40099, ntpStatus: 40099 });
        }
    });
    return p;
}

function getPerformanceBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libCLI = ffi.Library(soPath + '/libCLI.so', {
                'getPerformance': ['string', []],
            });

            libCLI.getPerformance.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    let result = {
                        cpuTemp: null,
                        cpuLoading: null,
                        memUsage: null,
                        sysUsage: null,
                        usbUsage: null,
                        hddModel: null,
                        hddStorage: null,
                        hddNc: null,
                        hddNvrLog: null,
                        hddNvrRecord: null,
                        rxtx: null,
                        memUsageRaw: null,
                        hddStorageRaw: null,
                        rxtxRaw: null
                    };
                    let errCode = null;

                    let jsonObj = JSON.parse(resp);
                    result.cpuTemp = jsonObj.cpuTemp;
                    result.cpuLoading = jsonObj.cpuLoading;
                    result.memUsage = jsonObj.memUsage;
                    result.sysUsage = jsonObj.sysUsage;
                    result.usbUsage = jsonObj.usbUsage;
                    result.hddModel = jsonObj.hddModel;
                    result.hddStorage = jsonObj.hddStorage;
                    result.hddNc = jsonObj.hddNc;
                    result.hddNvrLog = jsonObj.hddNvrLog;
                    result.hddNvrRecord = jsonObj.hddNvrRecord;
                    result.rxtx = jsonObj.rxtx;
                    result.memUsageRaw = jsonObj.memUsageRaw;
                    result.hddStorageRaw = jsonObj.hddStorageRaw;
                    result.rxtxRaw = jsonObj.rxtxRaw;
                    if (null != errCode) {
                        callback(errCode, null);
                    } else {
                        callback(null, result);
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 获取设备名称
 * @param {*} callback 
 */
function getDeviceNameBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libCLI = ffi.Library(soPath + '/libCLI.so', {
                'getDeviceName': ['string', []],
            });

            libCLI.getDeviceName.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    callback(null, resp);
                }
            });
        } else {
            //callback(40001, null);
            callback(null, 'DNH-200'); //windows模拟值
        }
    } catch (e) {
        callback(40099, e);
    }
}
/**
 * "ntpStatus": 有3個狀態. 0, ntp未取得時間. 1, ntp取得時間. 2, 手動設定時間
 * "sdStatus": 有3個狀態. 0, 未插入MicroSD. 1, 已插入MicroSD(rw). 2, 已插入MicroSD(ro)或讀取MircoSD有問題
 */
let sdCardStatus = 1; //暂时都为1
let ntpStatus = 1;    //暂时都为1

//sd卡状态侦测. 插拔sd卡时通过fs.watch判断
function sdCardWatch(callback) {
    getCurrStatus().then(result => {
        sdCardStatus = result.sdStatus;
        ntpStatus = result.ntpStatus;

        watch('/mnt/ramdisk', function (evt, name) {
            let file = name.replace(new RegExp(/\\/, "g"), '/');
            if ((evt === "update" && file == '/mnt/ramdisk/sd_done')
                || (evt === "remove" && file == '/mnt/ramdisk/sd_done')
                || (evt === "update" && file == '/mnt/ramdisk/sd_none')
                || (evt === "remove" && file == '/mnt/ramdisk/sd_none')
            ) {
                getCurrStatus().then(result2 => {
                    if (sdCardStatus == result2.sdStatus) {
                        return;
                    }
                    console.log("MicroSD watch event:", file);
                    console.log('Current status: ', result2);
                    sdCardStatus = result2.sdStatus;
                    switch (sdCardStatus) {
                        case 1:
                            console.log("MicroSD card is ready.");
                            sdCardEvent.emit("update");
                            break;
                        case 0:
                            console.log("MicroSD card is not ready.");
                            sdCardEvent.emit("notready");
                            break;
                        default:
                            console.log("No microSD card.");
                            sdCardEvent.emit("remove");
                    }
                });
                // setTimeout(function () {
                //
                // }, 1000);
            }
        });
    });
}

/**
 * 方法说明 ntp状态监测
 * @method ntpWatch
 * @for SystemCli
 * @retrun true/false
 */
function ntpWatch(callback) {
    getCurrStatus().then(result => {
        sdCardStatus = result.sdStatus;
        ntpStatus = result.ntpStatus;

        watch('/mnt/ramdisk', function (evt, name) {
            let file = name.replace(new RegExp(/\\/, "g"), '/');
            if ((evt === "update" && file == "/mnt/ramdisk/ntp_enabled")
                || (evt === "remove" && file == "/mnt/ramdisk/ntp_enabled")
                || (evt === "update" && file == "/mnt/ramdisk/time_done")
                || (evt === "remove" && file == "/mnt/ramdisk/time_done")) {
                getCurrStatus().then(result2 => {
                    if (ntpStatus == result2.ntpStatus) {
                        return;
                    }
                    console.log("NTP watch event:", file);
                    console.log('Current status: ', result2);
                    ntpStatus = result2.ntpStatus;
                    switch (ntpStatus) {
                        case 0:
                            console.log("Time is not ready.");
                            ntpStatusChangeEvent.emit("disable");
                            break;
                        case 1:
                            console.log("Time is ready.");
                            ntpStatusChangeEvent.emit("enable");
                            break;
                        case 2:
                            console.log("Manually set the time.");
                            ntpStatusChangeEvent.emit("manual");
                            break;
                        default:
                    }
                });
            }
        });
    });
}

/**
 * 方法说明 订阅进行格式化SD卡的消息，格式化SD卡前主动关闭console log打印和统计资料db的读写，格式化SD卡后恢复console log打印和统计资料db的读写
 * @method mqSubscribe
 * @for SystemCli
 */
/*
function mqSubscribe() {
    client.subscribe('/sdcard/format', (err, echo) => {
        if (err) {
            console.error_log('An error occurred while subscribing：', err.message);
        } else {
            console.log('subscribe success.');
        }
    });

    client.on('message', (topic, message) => {
        const log = require('../log/log.js');
        if (message == "start") {
            log.shutdown();
            sdCardStatus = false;
            sdCardEvent.emit("remove");
        }
        if (message == "finish") {
            let jsonObj = getCurrStatus();
            if (jsonObj.sdStatus == 1) {
                log.resume();
                sdCardStatus = true;
                sdCardEvent.emit("update");
            }
        }

    })
}
*/

let cur_sd = 0;  //当前sd卡状态
let cur_ntp = 0; //当前NTP状态
/**
 * 方法说明 系统状态监听(sd卡、ntp server)
 * @method sysWatch
 * @for SystemCli
 */

function sysWatch() {
    setInterval(
        () => {
            try {
                if (os.platform() == "linux") {
                    let jsonObj = getCurrStatus();
                    if (cur_sd !== jsonObj.sdStatus) {
                        cur_sd = jsonObj.sdStatus;
                        console.log("MicroSD card status changed to: " + cur_sd);
                        switch (cur_sd) {
                            case 0:
                                sdCardStatus = 0;
                                sdCardEvent.emit("remove");
                                break;
                            case 1:
                                sdCardStatus = 1;
                                sdCardEvent.emit("update");
                                break;
                            case 2:
                                sdCardStatus = 2;
                                sdCardEvent.emit("notready");
                                break;
                            default:
                        }
                    }
                    if (cur_ntp !== jsonObj.ntpStatus) {
                        cur_ntp = jsonObj.ntpStatus;
                        console.log("NTP status changed to: " + cur_ntp);
                        switch (cur_ntp) {
                            case 0:
                                ntpStatus = 0;
                                ntpStatusChangeEvent.emit("disable");
                                break;
                            case 1:
                                ntpStatus = 1;
                                ntpStatusChangeEvent.emit("enable");
                                break;
                            case 2:
                                ntpStatus = 2;
                                ntpStatusChangeEvent.emit("manual");
                                break;
                            default:
                        }
                    }
                } else {
                    console.trace_log('unsupported platform.');
                }
            } catch (e) {
                console.error_log(e.message);
            }
        }, 2000
    );
}


let fwUpgradeStatus = false;

/**
 * 方法说明 固件升级状态监测
 * @method ntpWatch
 * @for SystemCli
 * @retrun true/false
 */
function fwUpgradeWatch(callback) {
    //固件升级状态监测. 初始化时检查/mnt/ramdisk/fw_upgrading是否存在
    setTimeout(function () {
        fs.access('/mnt/ramdisk/fw_upgrading', fs.constants.F_OK, (err) => {
            if (err) {
                fwUpgradeStatus = false;
            } else {
                fwUpgradeStatus = true;
                fwUpgradeEvent.emit('upgrading');
            }
            console.log('Current fwUpgrade status:', fwUpgradeStatus);
        });
    }, 2000);
    watch('/mnt/ramdisk', function (evt, name) {
        let file = name.replace(new RegExp(/\\/, "g"), '/');
        if (file == "/mnt/ramdisk/fw_upgrading") {
            console.log(`fwUpgrade watch event:${file}\t${evt}`);
            switch (evt) {
                case "update":
                    setTimeout(function () {
                        fs.access('/mnt/ramdisk/fw_upgrading', fs.constants.F_OK, (err) => {
                            if (err) {
                                fwUpgradeStatus = false;
                                fwUpgradeEvent.emit('normal');
                            } else {
                                fwUpgradeStatus = true;
                                fwUpgradeEvent.emit('upgrading');
                            }
                        });
                    }, 2000);
                    break;
                case "remove":
                    fwUpgradeStatus = false;
                    fwUpgradeEvent.emit('normal');
                    break;
                default:
                    break;
            }
        }
    });
}

/**
 * 方法说明 获取默认网络接口IP地址
 * @method getHostIP
 * @for SystemCli
 * @param {String} "v4"/"v6"
 * @retrun IPV4/IPV6 value
 */
function getHostIP(ipVerson, callback) {
    ipVerson = ipVerson || "v4";
    si.networkInterfaceDefault().then(defaultNic => {
        si.networkInterfaces()
            .then(ips => {
                if (ipVerson === "v4") {
                    callback(null, ips.filter(item => item.iface === defaultNic)[0].ip4)
                } else {
                    callback(null, ips.filter(item => item.iface === defaultNic)[0].ip6)
                }
            })
            .catch(error => {
                console.error(error.message);
                callback(error.message, null);
            });
    })
        .catch(error => {
            console.error(error.message);
            callback(error.message, null);
        });
}

function getFwUpgradeStatus() {
    return fwUpgradeStatus;
}

function getSdCardStatus() {
    return sdCardStatus;
}

function getNtpStatus() {
    return ntpStatus;
}

function setSdCardStatus(config) {
    sdCardStatus = config;
}

function setNtpStatus(config) {
    ntpStatus = config;
}

let hddStatus = 1;    //暂时都为1
function hddWatch() {
    try {
        if (os.platform() == "linux") {
            getHddFlag((err, result) => {
                if (!err) {
                    hddStatus = result;
                }
                watch(['/tmp'], { recursive: true }, function (evt, name) {
                    let file = name.replace(new RegExp(/\\/, "g"), '/');
                    if ((evt === "update" && file == '/tmp/newhdds')
                        || (evt === "remove" && file == '/tmp/newhdds')
                        || (evt === "update" && file == '/tmp/newhdd1')
                        || (evt === "remove" && file == '/tmp/newhdd1')
                        || (evt === "update" && file == '/tmp/newhdd2')
                        || (evt === "remove" && file == '/tmp/newhdd2')
                        || (evt === "update" && file == '/tmp/newhdd3')
                        || (evt === "remove" && file == '/tmp/newhdd3')
                    ) {
                        getHddFlag((err2, result2) => {
                            if (!err2) {
                                if (hddStatus == result2) {
                                    return;
                                }
                            }
                            console.log("HDD watch event:", file);
                            console.log('Current status: ', result2);
                            hddStatus = result2;
                            hddEvent.emit("hotplug", hddStatus);
                            switch (hddStatus) {
                                case 0:
                                    hddEvent.emit("remove");
                                    console.log("There is no HDD mounted on DNH-200.");
                                    break;
                                case 1:
                                    hddEvent.emit("notready");
                                    console.log("HDD is new or the format is not valid for DNH-200.");
                                    break;
                                case 2:
                                    hddEvent.emit("notready");
                                    console.log("HDD is failed to initialize on DNH-200.");
                                    break;
                                case 3:
                                    hddEvent.emit("update");
                                    console.log("HDD is ok to use for DNH-200 with the partition sizes for 1.0.0 version.");
                                    break;
                                case -1:
                                    console.log("  partitions error.");
                                    break;
                                default:
                                    console.log("No HDD.");
                            }
                        });
                    }
                });
            })
        }
    } catch (e) {
        console.log("Watch HDD Error.");
    }

}

/**
 * @param callback
 * 0: There is no HDD mounted on DNH-200.
 1: HDD is new or the format is not valid for DNH-200.
 2: HDD is failed to initialize on DNH-200.
 3: HDD is ok to use for DNH-200 with the partition sizes for 1.0.0 version.
 */
function getHddFlag(callback) {
    try {
        if (os.platform() == "linux") {

            let libHdd = ffi.Library(soPath + '/libHdd.so', {
                'getHddFlag': ['int', []],
            });

            libHdd.getHddFlag.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    callback(null, resp);
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 *
 * @param nResponse
 * 0: No, do not initialize the HDD. Append "N" to /ramdisk/hddflag, e.g. "1,N".
 1: Yes, initialize the HDD. Append "Y" to /ramdisk/hddflag, e.g. "1,Y".
 * @param callback
 * 0: Failed
 1: Successful
 2: Response value is invalid
 */
function setHddFlag(nResponse, callback) {
    try {
        if (os.platform() == "linux") {

            let libHdd = ffi.Library(soPath + '/libHdd.so', {
                'setHddFlag': ['int', ['int']],
            });

            libHdd.setHddFlag.async(nResponse, (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case 0:
                            callback('0', null);
                            break;
                        case 1:
                            callback(null, "Success");
                            break;
                        case 2:
                            callback(2, "Response value is invalid");
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * arg[1] device Type 0:SDCard 1:HDD
 * arg[2] file System 0:FAT32 1:EXT4
 * arg[3] HDD partitions
 * 1: format partition 1
 * 2:format partition 2
 * 3:format partition 1,2
 * 4:format partition 3
 * 5:format partition 1,3
 * 6:format partition 2,3
 * 7:format partition 1,2,3
 * @param callback
 */
function hddFormat(partition, callback) {
    try {
        if (os.platform() == "linux") {
            let cmd = 'echo "" > /usr/sbin/dnh/exeFormat 1 1 ';
            cmd += partition;
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, "success");
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

//shell
module.exports.SetDate = SetDate;
module.exports.SetNTPServer = SetNTPServer;
module.exports.SetDNS = SetDNS;
module.exports.SetLanIP = SetLanIP;
module.exports.BrowserUSBFiles = BrowserUSBFiles;
module.exports.RestartDevice = RestartDevice;
module.exports.SetTimezone = SetTimezone;
module.exports.NumericToNetmask = NumericToNetmask;
module.exports.SaveConfig = SaveConfig;
module.exports.GetUsbStorageList = GetUsbStorageList;
module.exports.RestoreDefaultSettings = RestoreDefaultSettings;
module.exports.getDateAndTimezoneByShell = getDateAndTimezoneByShell;
//libLANSetting.so
module.exports.setLanBySo = setLanBySo;
module.exports.getLANSettingBySo = getLANSettingBySo;
//libDatetimeSetting.so
module.exports.setDateBySo = setDateBySo;
module.exports.setTimezoneBySo = setTimezoneBySo;
module.exports.getTimezoneBySo = getTimezoneBySo;
module.exports.getDatetimeBySo = getDatetimeBySo;
module.exports.setDSTBySo = setDSTBySo;
module.exports.getDSTBySo = getDSTBySo;
module.exports.setTimeAndTimeZoneBySo = setTimeAndTimeZoneBySo;
module.exports.getDateAndTimezoneBySo = getDateAndTimezoneBySo;
//module.exports.setTimeAndTimeZoneSync = setTimeAndTimeZoneSync;
//restart
module.exports.rebootBySo = rebootBySo;
//shutdown
module.exports.shutdownBySo = shutdownBySo;

//libFactoryReset.so                   //废弃
module.exports.setFactoryResetBySo = setFactoryResetBySo;
//factoryReset
module.exports.factoryResetByExec = factoryResetByExec;

//libCLI.so
module.exports.getSystemAboutBySo = getSystemAboutBySo;
module.exports.setMACAddressBySo = setMACAddressBySo;
module.exports.setAdminPasswordBySo = setAdminPasswordBySo;
module.exports.SaveBySo = SaveBySo;
module.exports.setSystemNameBySo = setSystemNameBySo;
module.exports.getCurrStatus = getCurrStatus;
module.exports.getPerformanceBySo = getPerformanceBySo;
module.exports.getDeviceNameBySo = getDeviceNameBySo;
//libFTPClient.so
module.exports.FTPDownloadBySo = FTPDownloadBySo;
module.exports.FTPUploadBySo = FTPUploadBySo;
//libFWValidate.so
module.exports.checkHeaderAndPayloadBySo = checkHeaderAndPayloadBySo;
//libUtilityTar.so
module.exports.unTarBySo = unTarBySo;
//libDB.so
module.exports.getFirmwareUpgradeStatusBySo = getFirmwareUpgradeStatusBySo;
module.exports.setFirmwareUpgradeStatusBySo = setFirmwareUpgradeStatusBySo;
module.exports.getNCVersionBySo = getNCVersionBySo;
module.exports.getDeviceUUIDBySo = getDeviceUUIDBySo;
module.exports.getWebAccessPortBySo = getWebAccessPortBySo;
module.exports.setWebAccessPortBySo = setWebAccessPortBySo;

//fwUpgrade
module.exports.fwUpgradeBySo = fwUpgradeBySo;
module.exports.fwUpgradeEvent = fwUpgradeEvent;     //固件升级事件
module.exports.getFwUpgradeStatus = getFwUpgradeStatus;   //固件升级当前状态
module.exports.fwUpgradeWatch = fwUpgradeWatch;     //固件升级状态监听
//libConsoleSetting.so
module.exports.setConsoleSettingBySo = setConsoleSettingBySo;
module.exports.getConsoleSettingBySo = getConsoleSettingBySo;
//restartMonitoring
module.exports.restartMonitoringBySo = restartMonitoringBySo;
//libUptime.so
module.exports.getUptimeBySo = getUptimeBySo;
//libFtpSetting.so
module.exports.getFtpDataBySo = getFtpDataBySo;
module.exports.setFtpDataBySo = setFtpDataBySo;
//libKiller.so
module.exports.killConsolesBySo = killConsolesBySo;
//libLed.so
module.exports.setSsoLedBySo = setSsoLedBySo;
module.exports.setPowerLedBySo = setPowerLedBySo;
//其他
module.exports.removeRamStatsFile = removeRamStatsFile;
module.exports.backupFromRamToSd = backupFromRamToSd;
module.exports.recoverFromSdToRam = recoverFromSdToRam;
module.exports.getHostIP = getHostIP;
//系统状态监听(sd卡、ntp server)
module.exports.sysWatch = sysWatch; //废弃
//sd卡
module.exports.sdCardWatch = sdCardWatch;
module.exports.getSdCardStatus = getSdCardStatus;
module.exports.setSdCardStatus = setSdCardStatus;
module.exports.sdCardEvent = sdCardEvent;
module.exports.formatSDCardBySo = formatSDCardBySo;
//ntp
module.exports.ntpWatch = ntpWatch;
module.exports.getNtpStatus = getNtpStatus;
module.exports.setNtpStatus = setNtpStatus;
module.exports.ntpStatusChangeEvent = ntpStatusChangeEvent;

//libSystem.so
//module.exports.runMdns=runMdns;
//module.exports.runDnssd=runDnssd;
//module.exports.setFotaStauts=setFotaStauts;

// HDD
module.exports.hddWatch = hddWatch;
module.exports.getHddFlag = getHddFlag;
module.exports.setHddFlag = setHddFlag;
module.exports.hddEvent = hddEvent;
module.exports.hddFormat = hddFormat;

module.exports.getCityDatetime = getCityDatetime;
//libBuzzer.so
//module.exports.triggerBuzzer=triggerBuzzer;
/**
 * 方法说明 获取FOTA设置
 * @method getFOTASetting
 * @callback {callback} callback(errorCode,message)
 */
function getFOTASettingBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libDB = ffi.Library(soPath + '/libDB.so', {
                'getFOTASetting': ['string', []],
            });
            libDB.getFOTASetting.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    let obj = JSON.parse(resp);
                    switch (obj.result) {
                        case 1:
                            delete obj.result;
                            callback(null, obj);
                            break;
                        case 2:
                            callback(40011, null);
                            break;
                        case 3:
                            callback(40012, null);
                            break;
                        case 4:
                            callback(40016, null);
                            break;
                    }
                }
            });
        } else {
            // callback(40001, null);
            // windows 模拟数据
            callback(null, { enable: 1, weekday: 5, hour: 19, minute: 20, updateBetaFw: 1 });
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 设置FOTA配置
 * @param config
 * @param callback
 */
function setFOTASettingBySo(config, callback) {
    try {
        if (os.platform() == "linux") {
            if (env == "development") {
                console.log(JSON.stringify(config));
            }
            let libDB = ffi.Library(soPath + '/libDB.so', {
                'setFOTASetting': ['int', ['int', 'int', 'int', 'int', 'int']],
            });
            libDB.setFOTASetting.async(config[0], config[1], config[2], config[3], config[4], (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case 1:
                            callback(null, "Success");
                            break;
                        case 2:
                            callback(40002, null);
                            break;
                        case 3:
                            callback(40011, null);
                            break;
                        case 4:
                            callback(40012, null);
                            break;
                        case 5:
                            callback(40016, null);
                            break;
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 分析固件信息
 * @param config [int nMajor, int Minor, int nRev, char* strFirmwareInfoFromFOTA, int nUpdateBetaFw]
 * @param callback
 */
function analyzeFirmwareInfoBySo(config, callback) {
    try {
        if (os.platform() == "linux") {
            if (env == "development") {
                console.log(JSON.stringify(config));
            }
            let libDB = ffi.Library(soPath + '/libDB.so', {
                'analyzeFirmwareInfo': ['string', ['int', 'int', 'int', 'string', 'int']],
            });
            libDB.analyzeFirmwareInfo.async(config[0], config[1], config[2], config[3], config[4], (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    let obj = JSON.parse(resp);
                    switch (obj.result) {
                        case 1:
                            obj = JSON.parse(JSON.stringify(obj).replace(/\\\\/gi,'\\'));
                            callback(null, obj);
                            break;
                        case 2:
                            callback(40002, null);
                            break;
                        default:
                            callback(40099, null);
                    }
                }
            });
        } else {
            //callback(40001, null);
            //windows 下模拟数据
            callback(null, {
                "result": 1,
                "firmwareStatus": 2,
                "major": 3,
                "minor": 0,
                "rev": 1234,
                "url": "https://qa-fw.fota.dlink.com/DNH/DNH-200/Ax/Default/stable.bin",
                //"url": 'https://qa-fw.fota.dlink.com/DAP/DAP-2680/Ax/Default/intermediate.bin',
                "releaseNote": "http://example.com"
            })
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 获取FOTA升级状态（该状态与手动升级状态是否共享？）
 * @param callback
 */
function getFOTAUpdateStatusBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libDB = ffi.Library(soPath + '/libDB.so', {
                'getFOTAUpdateStatus': ['int', []],
            });
            libDB.getFOTAUpdateStatus.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case 0:
                            callback(null, 40050); //空闲
                            break;
                        case 1:
                            callback(null, 40051); //执行中
                            break;
                        case 2:
                            callback(40011, null);
                            break;
                        case 3:
                            callback(40012, null);
                            break;
                        case 4:
                            callback(40016, null);
                            break;
                    }
                }
            });
        } else {
            // callback(40001, null);
            callback(null, 40050);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 设置FOTA升级状态
 * @param para
 * @param callback
 */
function setFOTAUpdateStatusBySo(para, callback) {
    try {
        if (os.platform() == "linux") {
            let libDB = ffi.Library(soPath + '/libDB.so', {
                'setFOTAUpdateStatus': ['int', ['int']],
            });
            libDB.setFOTAUpdateStatus.async(para, (err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case 1:
                            callback(null, "Success");
                            break;
                        case 2:
                            callback(40002, null);
                            break;
                        case 3:
                            callback(40011, null);
                            break;
                        case 4:
                            callback(40012, null);
                            break;
                        case 5:
                            callback(40016, null);
                            break;
                    }
                }
            });
        } else {
            //callback(40001, null);
            callback(null, null);
        }
    } catch (e) {
        console.log(e.message);
        // callback(40099, e);
    }
}

/**
 * 获取固件版本信息
 * @param callback
 */
function getFirmwareVersionBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libDB = ffi.Library(soPath + '/libDB.so', {
                'getFirmwareVersion': ['string', []],
            });
            libDB.getFirmwareVersion.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case '2':
                            callback(40011, null);
                            break;
                        case '3':
                            callback(40012, null);
                            break;
                        case '4':
                            callback(40016, null);
                            break;
                        default:
                            callback(null, resp);
                            break;
                    }
                }
            });
        } else {
            //callback(40001, null);
            callback(null, '1.0.0.0_1014');
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 获取完整固件版本信息
 * @param callback
 */
function getFirmwareVersionFullBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libDB = ffi.Library(soPath + '/libDB.so', {
                'getFirmwareVersionFull': ['string', []],
            });
            libDB.getFirmwareVersionFull.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    switch (resp) {
                        case '2':
                            callback(40011, null);
                            break;
                        case '3':
                            callback(40012, null);
                            break;
                        case '4':
                            callback(40016, null);
                            break;
                        default:
                            callback(null, resp);
                            break;
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

/**
 * 获取硬件版本信息
 * @param callback
 */
function getHWVersionBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libDB = ffi.Library(soPath + '/libDB.so', {
                'getHWVersion': ['string', []],
            });
            libDB.getHWVersion.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    callback(null, resp);
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}


/**
 * 获取固件版本信息
 * @param callback
 */
function getFirmwareInfoBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libDB = ffi.Library(soPath + '/libDB.so', {
                'getFirmwareInfo': ['string', []],
            });
            libDB.getFirmwareInfo.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    let obj = JSON.parse(resp);
                    switch (obj.result) {
                        case 1:
                            delete obj.result;
                            callback(null, obj);
                            break;
                        case 2:
                            callback(40011, null);
                            break;
                        case 3:
                            callback(40012, null);
                            break;
                        case 4:
                            callback(40016, null);
                            break;
                    }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}

exports.getFOTASettingBySo = getFOTASettingBySo;
exports.setFOTASettingBySo = setFOTASettingBySo;
exports.analyzeFirmwareInfoBySo = analyzeFirmwareInfoBySo;
exports.getFOTAUpdateStatusBySo = getFOTAUpdateStatusBySo;
exports.setFOTAUpdateStatusBySo = setFOTAUpdateStatusBySo;
exports.getFirmwareVersionBySo = getFirmwareVersionBySo;
exports.getFirmwareVersionFullBySo = getFirmwareVersionFullBySo;
exports.getHWVersionBySo = getHWVersionBySo;
exports.getFirmwareInfoBySo = getFirmwareInfoBySo;

///////////FOTA相关

/**
 * 获取FOTA客户端信息
 * @param callback
 */
function getFotaClientDataBySo(callback) {
    try {
        if (os.platform() == "linux") {
            let libSys = ffi.Library(soPath + '/libSystem.so', {
                'getFotaClientData': ['string', []],
            });
            libSys.getFotaClientData.async((err, resp) => {
                if (err) {
                    callback(40099, err);
                } else {
                    let obj = JSON.parse(resp);
                    callback(null, obj);
                    // switch (obj.result) {
                    //     case 1:
                    //         delete obj.result;
                    //         callback(null, obj);
                    //         break;
                    //     case 2:
                    //         callback(40011, null);
                    //         break;
                    //     case 3:
                    //         callback(40012, null);
                    //         break;
                    //     case 4:
                    //         callback(40016, null);
                    //         break;
                    // }
                }
            });
        } else {
            callback(40001, null);
        }
    } catch (e) {
        callback(40099, e);
    }
}


exports.getFotaClientDataBySo = getFotaClientDataBySo;
