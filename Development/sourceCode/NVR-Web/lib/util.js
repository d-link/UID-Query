/**
 * Created by lizhimin on 2016/3/22.
 */
'use strict';
const path = require('path');
const fs = require("fs");
const os = require("os");
const beautify = require("json-beautify");
let configPath = path.resolve(path.join(process.cwd(), './config/appconfig.json'));
var systemconfig = require(configPath);
const env = (process.env.NODE_ENV && systemconfig[process.env.NODE_ENV]) ? process.env.NODE_ENV : "development";
const config = systemconfig[env];
const commonlib = require('dnh-common');
exports.db = commonlib.db;
exports.common = commonlib.common;
exports.log = commonlib.log;
exports.config = config;
exports.version = systemconfig['version'];
exports.model = "DNH-100";
/**
 * 输出当前方法路径：文件路径+"\"+方法名，用于日志错误中
 *EC6:反斜杠，模板字符串
 * @params 当前调用的文件路径
 * @returns {*}
 */
exports.getErrorPath = function () {
    return `${Array.from(arguments).join('\\')}`;
};
//module.exports.db =require(config.db_lib_path);

exports.getIpRange = function (Prefix) {
    let netMask = getNetMask(Prefix.mask);
    return {
        ipFrom: getLowAddr(Prefix.net, netMask),
        ipTo: getHighAddr(Prefix.net, netMask)
    }
};

exports.changePort = function (ports) {
    let newCorePort = ports.devAccessPort;
    let newWebPort = ports.webAccessPort;
    try {
        // let CfgPath = path.join(process.cwd(), '/userdata/config/appconfig.json');
        // let CfgStr = fs.readFileSync(CfgPath);
        //
        // let Cfg = JSON.parse(CfgStr);
        if(newCorePort) {
            systemconfig.serverPort = newCorePort;
        }
        if(newWebPort) {
            systemconfig['development'].sslport = newWebPort;
            systemconfig['Production_hualian'].sslport = newWebPort;
            systemconfig['production'].sslport = newWebPort;
        }
        fs.writeFileSync(configPath, beautify(systemconfig, null, 2, 100));
        return true;
    } catch (e) {
        console.error_log(e);
        return false;
    }
};

function getLowAddr(ip, netMask) {
    var lowAddr = "";
    var ipArray = new Array();
    var netMaskArray = new Array();
    // I参数不正确
    if (4 != ip.split(".").length || "" == netMask) {
        return "";
    }
    for (var i = 0; i < 4; i++) {
        ipArray[i] = ip.split(".")[i];
        netMaskArray[i] = netMask.split(".")[i];
        if (ipArray[i] > 255 || ipArray[i] < 0 || netMaskArray[i] > 255
            && netMaskArray[i] < 0) {
            return "";
        }
        ipArray[i] = ipArray[i] & netMaskArray[i];
    }
    // 构造最小地址
    for (var i = 0; i < 4; i++) {
        if (i == 3) {
            ipArray[i] = ipArray[i] + 1;
        }
        if ("" == lowAddr) {
            lowAddr += ipArray[i];
        } else {
            lowAddr += "." + ipArray[i];
        }
    }
    return lowAddr;
}

function getHighAddr(ip, netMask) {
    var lowAddr = getLowAddr(ip, netMask);
    var hostNumber = getHostNumber(netMask);
    if ("" == lowAddr || hostNumber == 0) {
        return "";
    }

    var lowAddrArray = new Array();
    for (var i = 0; i < 4; i++) {
        lowAddrArray[i] = lowAddr.split(".")[i];
        if (i == 3) {
            lowAddrArray[i] = Number(lowAddrArray[i] - 1);
        }
    }
    lowAddrArray[3] = lowAddrArray[3] + Number(hostNumber - 1);
    //alert(lowAddrArray[3]);
    if (lowAddrArray[3] > 255) {
        var k = parseInt(lowAddrArray[3] / 256);
        //alert(k);
        lowAddrArray[3] = lowAddrArray[3] % 256;
        //alert(lowAddrArray[3]);
        lowAddrArray[2] = Number(lowAddrArray[2]) + Number(k);
        //alert(lowAddrArray[2]);
        if (lowAddrArray[2] > 255) {
            k = parseInt(lowAddrArray[2] / 256);
            lowAddrArray[2] = lowAddrArray[2] % 256;
            lowAddrArray[1] = Number(lowAddrArray[1]) + Number(k);
            if (lowAddrArray[1] > 255) {
                k = parseInt(lowAddrArray[1] / 256);
                lowAddrArray[1] = lowAddrArray[1] % 256;
                lowAddrArray[0] = Number(lowAddrArray[0]) + Number(k);
            }
        }
    }

    var highAddr = "";
    for (var i = 0; i < 4; i++) {
        if (i == 3) {
            lowAddrArray[i] = lowAddrArray[i] - 1;
        }
        if ("" == highAddr) {
            highAddr = lowAddrArray[i];

        } else {
            highAddr += "." + lowAddrArray[i];
        }
    }

    return highAddr;
}

function getNetMask(inetMask) {
    var netMask = "";
    if (inetMask > 32) {
        return netMask;
    }
    //子网掩码为1占了几个字节
    var num1 = parseInt(inetMask / 8);
    //子网掩码的补位位数
    var num2 = inetMask % 8;
    var array = new Array();
    for (var i = 0; i < num1; i++) {
        array[i] = 255;
    }
    for (var i = num1; i < 4; i++) {
        array[i] = 0;
    }
    for (var i = 0; i < num2; num2--) {
        array[num1] += Math.pow(2, 8 - num2);
    }
    netMask = array[0] + "." + array[1] + "." + array[2] + "." + array[3];

    return netMask;
}

function getHostNumber(netMask) {
    var hostNumber = 0;
    var netMaskArray = new Array();
    for (var i = 0; i < 4; i++) {
        netMaskArray[i] = netMask.split(".")[i];
        if (netMaskArray[i] < 255) {
            hostNumber = Math.pow(256, 3 - i) * (256 - netMaskArray[i]);
            break;
        }
    }

    return hostNumber;
}

/**
 * @methods 将数据库存的iso时间转换为时间戳格式
 * @params date,ios时间
 * @returns 时间戳时间
 * @author 李莉红
 */
exports.renderTime = function (date) {
    //转换成比如“2014-07-10 10:21:12”这种时间
    let normalDate = new Date(date).toJSON();
    let normalDate1 = new Date(+new Date(normalDate) + 8 * 3600 * 1000).toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '')
    let date1 = new Date(normalDate1);
    //返回13位时间戳1554791697000
    return date1.getTime();
}
const CryptoJS = require("crypto-js");
exports.decrptyMethod = function (keyStr, value) {
    if (!keyStr) {
        keyStr = "test";
    }
    var key_str = keyStr.substring(0, 16);
    if (keyStr.length < 16) {
        for (var i = 16; i > keyStr.length; i--) {
            key_str += "0";
        }
    }
    var key = CryptoJS.enc.Utf8.parse(key_str);
    if (!value) value = '';
    var encryptedHexStr = CryptoJS.enc.Hex.parse(value);
    var encryptedBase64Str = CryptoJS.enc.Base64.stringify(encryptedHexStr);
    var decryptedData = CryptoJS.AES.decrypt(encryptedBase64Str, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    try {
        value = decryptedData.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        value = "";
    }

    return value;
}
exports.encrptyMethod = function (keyStr, value) {
    if (!keyStr) keyStr = "test";
    var key_str = keyStr.substring(0, 16);
    if (keyStr.length < 16) {
        for (var i = 16; i > keyStr.length; i--) {
            key_str += "0";
        }
    }
    var key = CryptoJS.enc.Utf8.parse(key_str);
    if (!value) value = '';
    var encryptedData = CryptoJS.AES.encrypt(value, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    value = encryptedData.ciphertext.toString();
    return value;
}

//将日期，时间去除偏移量转换为UTC标准
//格式：{binDate:1558915200,timestamp:54900}
exports.datetimeToUTCStamp = function datetimeToUTCStamp(dtObj) {
    // let d = 1558915200;
    // let t = 54900;

    if (dtObj != null && dtObj.constructor === Object && dtObj.hasOwnProperty("binDate") && dtObj.hasOwnProperty("timestamp")) {
        let offset = new Date().getTimezoneOffset();
        let utc = new Date((dtObj.binDate + dtObj.timestamp - (offset) * 60) * 1000);

        let uYear = utc.getUTCFullYear();
        let uMonth = utc.getUTCMonth();
        let uDate = utc.getUTCDate();
        let uHour = utc.getUTCHours();
        let uMinute = utc.getUTCMinutes();
        let uSecond = utc.getUTCSeconds();

        let dateUTC = Date.UTC(uYear, uMonth, uDate, 0, 0, 0) / 1000;
        let timeUTC = Date.UTC(1970, 0, 1, uHour, uMinute, uSecond) / 1000;
        return {binDate: dateUTC, timestamp: timeUTC};
    } else {
        return {binDate: null, timestamp: null};
    }
}

//将日期，时间Array去除偏移量转换为UTC标准
exports.datetimeArrayToUTCStamp = function datetimeArrayToUTCStamp(dtArray) {
    if (dtArray != null && dtArray instanceof Array) {
        let result = [];
        for (let i = 0; i < dtArray.length; i++) {
            let calc = datetimeToUTCStamp(dtArray[i]);
            result.push(calc);
        }
        return result;
    } else {
        return [];
    }
}

//将时间去除偏移量转换为UTC标准
exports.timeToUTCStamp = function timeToUTCStamp(t) {
    let d = 0;
    // let t = 54900;
    let offset = new Date().getTimezoneOffset();
    let utc = new Date((d + t - (offset) * 60) * 1000);

    let uYear = utc.getUTCFullYear();
    let uMonth = utc.getUTCMonth();
    let uDate = utc.getUTCDate();
    let uHour = utc.getUTCHours();
    let uMinute = utc.getUTCMinutes();
    let uSecond = utc.getUTCSeconds();

    let dateUTC = Date.UTC(uYear, uMonth, uDate, 0, 0, 0) / 1000;
    let timeUTC = Date.UTC(1970, 0, 1, uHour, uMinute, uSecond) / 1000;
    return timeUTC;
}

//将时间Array去除偏移量转换为UTC标准
exports.timeArrayToUTCStamp = function timeArrayToUTCStamp(tArray) {
    if (tArray != null && tArray instanceof Array) {
        let result = [];
        for (let i = 0; i < tArray.length; i++) {
            let calc = timeToUTCStamp(tArray[i]);
            result.push(calc);
        }
        return result;
    } else {
        return [];
    }
}

//获取dnh100中eth0网卡ip地址
exports.getSystemAddress = function(){
    var address = {
        ip: "",
        mac: ""
    };
    if(os.platform() == "linux"){
        var networkInterfaces = os.networkInterfaces();
        if(networkInterfaces.hasOwnProperty("eth0")){   //特定DNH100开发板
            var networkInterface = networkInterfaces["eth0"];
            for(var i = 0; i < networkInterface.length; i++){
                if(networkInterface[i].family == "IPv4"){
                    address.ip = networkInterface[i].address;
                    address.mac = networkInterface[i].mac;
                    break;
                }
            }
        }
    }
    return address;
}


