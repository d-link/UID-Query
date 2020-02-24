/**
 * Created by lizhimin on 2018/12/19.
 */
'use strict';
const async = require('async');
const util = require("../lib/util");
const moment = require('moment');
//const config = util.config;
const systemCli = util.common.systemCli;
const db = util.db;
const os = require('os');
const crypto = require('crypto');
const microtime = require('microtime');
const gridFS = db.cwmFileAPI.gridFS;
const fs = require('fs');
const path = require('path');
const tar = require('tar-fs');
const childProcess = require('child_process');
//var XLSX = require('xlsx');
//var nodeExcel = require('excel-export');
//const TrapDictionary = db.cwmTrapDictionary;
//const trapTranslate = require('../lib/trapTranslate');
const disk = util.common.disk;
const configPath = path.resolve(path.join(process.cwd(), './config/appconfig.json'));
//const autoLogPath = 'E:\\mnt\\ramdisk';
//const autoLogPath = '/mnt/ramdisk';
const autoBackupPath = "/mnt/sdcard";
const autoBackupFilterFiles = [
    "/mnt/ramdisk/log-data.db",
    "/mnt/ramdisk/log-data.db-shm",
    "/mnt/ramdisk/log-data.db-wal",
];//自动备份时-这些文件总大小做为判断依据
const minFileTotalSize = 10485760;//10MB，自动备份时，检测的文件总大小最低值
const systemconfig = require(configPath);
let tempPath = "";
function getTempPath() {
    let temp = `${process.cwd()}/temp`;
    if (!fs.existsSync(temp)) {
        fs.mkdirSync(temp);
    }
    tempPath = `${process.cwd()}/temp/BackupFiles`;
    if (!fs.existsSync(tempPath)) {
        fs.mkdirSync(tempPath);
    }
    return tempPath;
}
function getFileName(targetpath, ext, filename, type, isAuto) {
    let count = 1;
    let suffix = (type == "log" ? (isAuto ? "_log_auto" : "_log") : (isAuto ? " _configuration_auto" : "_configuration"));
    let temp = targetpath + "/" + filename + suffix + ext;
    while(fs.existsSync(temp)){
        temp = targetpath + "/" + filename + "-" + count + suffix + ext;
        count++;
    }
    return temp;
}
function getCFGName(){
    let date = moment();
    let toStr = date.format('YYYYMMDD');
    return toStr;
}
function autoLogBackup() {
    db.cwmDatabaseSetting.getDBSetting((err, setting)=> {
        if (setting) {
            const logCoverage = function(oldestLogTime) {
                //autoBackupType  0:Disabled 1:Micro SD 2: External Syslog Server
                if(setting.autoBackupType == 1 && (systemCli.getSdCardStatus() == 1)) {
                    disk.used(autoBackupPath).then(percent => {
                        if(percent > 60){
                            let expireAt = moment();
                            expireAt.startOf('day').add(31, 'days').add(12, 'h').add(0, 'm');
                            let eventlog = {
                                logTime: new Date(),
                                expireAt: expireAt,
                                logType: 8
                            };
                            if(percent > 99){
                                eventlog.message=`Your MicroSD card is full and it will not save new log files.`;
                            }else{
                                let xx=percent>90?'90':(percent>80?'80':(percent>70?'70':60));
                                eventlog.message=`Your MicroSD card is nearly out of free space (${xx}%) and it will not save new logs after hard drive is full.`;
                            }
                            db.cwmSystemEventLog.insert(eventlog,(err,re)=>{});
                        }
                        if(oldestLogTime) {
                            backupLog(oldestLogTime, autoBackupPath, true, (err, result)=> {
                                if(!err) {
                                    deleteLog(oldestLogTime, (err, result)=> {});
                                } else {
                                    console.error_log("Auto log backup failed: " + err);
                                }
                                deleteBackupLog(autoBackupPath);
                            });
                        }
                        else {
                            deleteBackupLog(autoBackupPath);
                        }
                    },(err)=>{
                        console.log("Error: "+err);
                    });
                }else {
                    deleteLog(oldestLogTime, (err, result)=> {});
                }
            };
            Promise.all(autoBackupFilterFiles.map(item => {
                return disk.fileSize(item);
            })).then((values) => {
                let fileTotalSize = 0;
                values.forEach(item => {
                    fileTotalSize += Number(item);
                })
                console.debug_log("File total size is "+fileTotalSize);
                if(fileTotalSize >= minFileTotalSize){
                    console.debug_log(`Total log data size: ${fileTotalSize} , the standard for backup is ${minFileTotalSize} , start to backup log and delete oldest log`);
                    getOldestLogTime((err, oldestLogTime)=> {
                        if(!err) {
                            logCoverage(oldestLogTime);
                        }
                    })
                }
            },(err) =>{
                console.error_log("Error: Auto Log backup: " + err);
            });
        }
    })
};

function deleteBackupLog(backupPath) {
    let maxSize = 1073741824; //backupLog最多保留1GB
    let expriredLogTime = (moment().subtract(3, 'months').hour(23).minute(59).second(59)).toISOString(); //backupLog保留3个月
    let oldestTime = (moment().hour(23).minute(59).second(59)).toISOString();
    let oldestFilename = "";
    backupPath = backupPath + "/Log";
    if (!fs.existsSync(backupPath)) {
        return;
    }
    fs.readdir(backupPath, function (err, list) {
        if(!err){
            list.forEach(function (filename) {
                let state = fs.statSync(path.join(backupPath, filename));
                if (state.isFile()) {
                    let updateTime = state.atime.toISOString();
                    if(updateTime <= expriredLogTime) {
                        try {
                            fs.unlinkSync(path.join(backupPath, filename));
                        }
                        catch(e) {
                            console.log(e.message);
                        }
                    }else{
                        if(updateTime <= oldestTime) {
                            oldestTime = updateTime;
                            oldestFilename = filename;
                        }
                    }
                }
            });
            disk.dirSize(backupPath).then(size => {
                if(size >= maxSize && oldestFilename) {
                    try{
                        fs.unlinkSync(path.join(backupPath, oldestFilename));
                    }
                    catch(e) {
                        console.log(e.message);
                    }
                }
            },(err)=>{
                console.error_log("Error: " + err);
            });
        }else{
            console.error_log("Error: " + err);
        }
    });
}

function backupConfiguration(callback) {
    async.parallel([(cb)=> {
        db.cwmOrg.findAll((err, result)=> {
            if (!err && result.length > 0) {
                cb(err, result[0]);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        db.cwmSite.findAll((err, result)=> {
            if (!err) {
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        db.cwmNetwork.findAll((err, result)=> {
            if (!err) {
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        db.cwmConfigProfile.findAll((err, result)=> {
            if (!err) {
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        db.cwmConfigProfileHistory.getAllCurrentProfile((err, result)=> {
            if (!err) {
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        db.User.findAll((err, result)=> {
            if (!err) {
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        db.cwmSSOStatus.findAll((err, result)=> {
            if (!err) {
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        db.cwmSSOInfo.findAll((err, result)=> {
            if (!err) {
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        db.cwmCounter.findAll((err, result)=> {
            if (!err) {
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        db.cwmSuppliers.findAll((err, result)=> {
            if (!err) {
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        db.cwmDeviceManaged.findAll((err, result)=> {
            if (!err) {
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        //Auto Log Backup
        db.cwmDatabaseSetting.findAll((err, result)=> {
            if (!err && result.length > 0) {
                cb(err, result[0]);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        //System
        db.System.getSystem((err, result)=> {
            if (!err) {
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        //LAN Setting
        systemCli.getLANSettingBySo(function (err, result) {
            if (!err) {
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        //Console Setting
        systemCli.getConsoleSettingBySo(function (err, result) {
            if (!err) {
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        //Date/Time Setting
        systemCli.getDateAndTimezoneBySo(function (err, result) {
            if (!err) {
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        //FTP server
        systemCli.getFtpDataBySo(function (err, result) {
            if (!err) {
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }], (err, results)=> {
        if (err) {
            callback(err);
        } else {

            let dbTables = {};
            let systemSettings = {};
            let payload = {dbTables: dbTables, systemSettings: systemSettings};
            if (results[0]) {
                dbTables.CWM_Org_Info = results[0];
            }
            if (results[1]) {
                dbTables.CWM_Site_Info = results[1];
            }
            if (results[2]) {
                dbTables.CWM_Network_Info = results[2];
            }
            if (results[3]) {
                dbTables.CWM_Config_Profile = results[3];
            }
            if (results[4]) {
                dbTables.CWM_Config_Profile_History = results[4];
            }
            if (results[5]) {
                dbTables.User_Info = results[5];
            }
            if (results[6]) {
               	dbTables.CWM_SSO_Status = results[6];
            }
            if (results[7]) {
                dbTables.CWM_SSO_Info = results[7];
            }
            if (results[8]) {
                dbTables.CWM_Counter = results[8];
            }
            if (results[9] && results[9].length > 0) {
                dbTables.CWM_Suppliers_Info = results[9];
            }
            if (results[10] && results[10].length > 0) {
                dbTables.CWM_Device_Managed = results[10];
            }
            if (results[11]) {
                dbTables.CWM_Database_Setting = results[11];
            }
            if (results[12]) {
                systemSettings.System = results[12];
            }
            if (results[13]) {
                systemSettings.LAN_Setting = results[13];
            }
            if (results[14]) {
                systemSettings.Console_Setting = results[14];
            }
            if (results[15]) {
                systemSettings.DateAndTime_Setting = results[15];
            }
            if (results[16]) {
                systemSettings.FTP_Setting = results[16];
            }
            packFiles(payload);

            callback(err)
        }
    });

}

function backupLog(time, backupPath, isAuto, callback) {
    var config = {
        time: time,
        backupPath: backupPath,
        isAuto: isAuto
    };
    var backupLog = childProcess.fork(path.join(__dirname,'../lib/process/backupLogProcess.js'));
    backupLog.on('message', (result) => {
        console.debug_log("Backup log process result: " + JSON.stringify(result));
        backupLog.kill('SIGTERM');
        callback(null, result);
    });
    backupLog.on('close', (code, signal) => {
        console.debug_log("Backup log process closed");
    });
    backupLog.send(config);
}


function deleteLog(logTime, callback) {
    async.parallel([(cb)=> {
        db.cwmDeviceLog.deleteDeviceLogByTime(logTime, (err, result)=> {
            if (!err) {
                //db.cwmDeviceLog.recycleDB((err, result)=> {});
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        db.cwmSyslog.deleteSysLogByTime(logTime, (err, result)=> {
            if (!err) {
                //db.cwmSyslog.recycleDB((err, result)=> {});
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        db.cwmSystemEventLog.deleteSystemEventLogByTime(logTime, (err, result)=> {
            if (!err) {
                //db.cwmSystemEventLog.recycleDB((err, result)=> {});
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }, (cb)=> {
        db.cwmTraplog.deleteTrapLogByTime(logTime, (err, result)=> {
            if (!err) {
                //db.cwmTraplog.recycleDB((err, result)=> {});
                cb(err, result);
            } else {
                cb(err, null);
            }
        })
    }], (err, results)=> {
        callback(err)
    });
}

function getOldestLogTime(callback) {
    db.cwmDeviceLog.getOldestLogTime((err, result)=> {
        if (err) {
            callback(err, null);
        } else {
            console.debug_log("oldestLogTime: " + JSON.stringify(result));
           if(result && result[0].oldestLogTime) {
               //let time = moment(result[0].oldestLogTime).format("YYYY-MM-DD HH:mm:ss.SSS");
               //let oldestLogTime = (moment(time).hour(23).minute(59).second(59).milliseconds(999)).toISOString();
               callback(null, result[0].oldestLogTime);
           }
           else {
               callback(null, null);
           }
        }
    })
}

let algorithm = 'aes-128-ctr';
let encrypt = function (key, iv, data) {
    let cipher = crypto.createCipheriv(algorithm, key, iv);
    let crypted = cipher.update(data, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
};

let decrypt = function (key, iv, data) {
    let decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decoded = decipher.update(data, 'hex', 'utf8');
    decoded += decipher.final('utf8');
    return decoded;
};
function encryptConfigBody(bodyObj, callback) {
    let filename = getCFGName();
    let headerBuffer = Buffer.alloc(34);
    let netinterface = os.networkInterfaces();
    let macStr = '00:00:00:00:00:00';
    for (let pp in netinterface) {
        if (netinterface[pp].length > 0) {
            macStr = netinterface[pp][0].mac;
            if (macStr != "00:00:00:00:00:00") {
                break;
            }
        }
    }
    macStr = macStr.toUpperCase();
    let charArr = macStr.split(":");
    let macArr = macStr.split(":");
    for (var i = 0; i < charArr.length; i++) {
        macArr[i] = parseInt(charArr[i], 16);
        charArr[i] = charArr[i].substring(0, 1);

    }
    let versionBuffer = Buffer.from('DNHv1.0.0.0', '');
    versionBuffer.copy(headerBuffer, 4, 0, 16);
    let macbuf = Buffer.from(macArr);
    macbuf.copy(headerBuffer, 20, 0, 6); //mac Address
    let timeX = microtime.nowStruct();
    headerBuffer.writeUInt32LE(timeX[0], 26, 4); //timestamp second
    headerBuffer.writeUInt32LE(timeX[1], 30, 4); //timestamp microsecond

    let hexKey = "0000000000000" + charArr[0] + charArr[1] + charArr[2] + charArr[3] + charArr[4] + charArr[5] + "0" + macStr.replace(new RegExp(":", "gm"), ""); //密钥
    let hexIV = "0000" + macStr.replace(new RegExp(":", "gm"), "") + "0000000000000000";

    let key = Buffer.from(hexKey, "hex");
    let iv = Buffer.from(hexIV, "hex");

    iv.writeUIntLE(timeX[0], 8, 4); //timestamp second
    iv.writeUIntLE(timeX[1], 12, 4);

    console.log("key:", key);
    console.log("iv:", iv);
    console.log("json:", JSON.stringify(bodyObj));
    let ciphertext = encrypt(key, iv, JSON.stringify(bodyObj));//加密
    let payloadBuffer = Buffer.from(ciphertext, "hex");
    const payloadLen = payloadBuffer.length;
    console.log("payloadLen:" + payloadLen);
    headerBuffer.writeUInt32LE(payloadLen, 0, 4);//payload lenght
    console.log("headerBuffer:", headerBuffer);
    var totalbuffer = Buffer.concat([headerBuffer, payloadBuffer]); //连接header和body部分
    let uploadDir = getTempPath();
    let filePath = `${uploadDir}/${filename}.cfg`;
    console.log(`cfg file path: ${uploadDir}/${filename}.cfg`);
    //写入文件
    fs.writeFile(filePath, totalbuffer, function (err) {
        if (err) {
            console.error_log(err);
        }
        callback(err);
    });
}

function packFiles(payload) {
    let set = new Set();
    let filesArray = [];
    let nucliasFiles = [];


    //读文件特征数据
    gridFS.getAllFiles((err, result)=> {
            let uploadDir = getTempPath();
            //清空临时文件夹中的文件
            var dirList = fs.readdirSync(uploadDir);
            dirList.forEach(function (fileName) {
                try{
                    fs.unlinkSync(uploadDir + '/' + fileName);
                }
                catch(e) {
                    console.log(e.message);
                }
            });

            if (result && result.length > 0) {
                async.map(result, (_temp, cb)=> {
                    nucliasFiles.push(_temp);
                    if (_temp.metadata.type == 'loginFiles' && !_temp.metadata.isDefault) {
                        filesArray.push(_temp.filename);
                        fs.copyFile(_temp.path,`${uploadDir}/${_temp.filename}`,(err)=>{
                            cb(null,null);
                        });
                    }
                    else if (_temp.metadata.type == 'servercert' && !_temp.metadata.isDefault) {
                        filesArray.push(_temp.filename);
                        fs.copyFile(_temp.path,`${uploadDir}/${_temp.filename}`,(err)=>{
                            cb(null,null);
                        });
                    }
                    else if (_temp.metadata.type == 'photo' || _temp.metadata.type == 'logo') {
                        filesArray.push(_temp.filename);
                        fs.copyFile(_temp.path,`${uploadDir}/${_temp.filename}`,(err)=>{
                            cb(null,null);
                        });
                    } else {
                        cb(null, null);
                    }

                }, function (err, rs) {


                    if (err) {
                        console.error_log("load Files error " + err);
                    } else {
                        let backupPath = systemconfig['backupPath'];
                        //压缩文件
                        if (!fs.existsSync(backupPath)) {
                            mkdirsSync(backupPath);
                        }
                        if (!fs.existsSync(backupPath + "/Configuration")) {
                            fs.mkdirSync(backupPath + "/Configuration");
                        }
                        let fileName = getCFGName();
                        let filePath = getFileName(backupPath + "/Configuration", ".tar", fileName, "configuration", false);
                        filesArray.push(getCFGName() + ".cfg");
                        console.log("filePath:" + filePath);
                        console.log("filesArray:" + filesArray);

                        payload.dbTables.CWM_Files = nucliasFiles;
                        // console.log(JSON.stringify(payload));
                        encryptConfigBody(payload, (err)=> {
                            tar.pack(uploadDir, {entries: filesArray}).pipe(fs.createWriteStream(filePath)).on('close', function () {
                                console.log('done');
                                fs.stat(filePath,
                                    function (err, stats) {
                                        if (err) {
                                            console.error_log(JSON.stringify(err));
                                            return null;
                                        }
                                    }
                                );
                            });
                        });
                    }
                });
            }
        }
    )
}
function restoreConfiguration(targetPath, payload, callback) {
    if (payload) {
        payload = JSON.parse(payload);
        let dbTables = payload.dbTables;
        let systemSettings = payload.systemSettings;
        async.series([(cb)=> {
            if (systemSettings && systemSettings.hasOwnProperty('System')) { //Admin password
                let adminPassword = util.decrptyMethod("admin", systemSettings.System.admin_password);
                systemCli.setAdminPasswordBySo([adminPassword], (err, result)=> {
                    cb(err, result);
                })
            } else {
                cb();
            }
        }, (cb)=> {
            if (systemSettings && systemSettings.hasOwnProperty('LAN_Setting')) { //LAN Settings
                let lanSetting = {
                    type: systemSettings.LAN_Setting.ipType,
                    ip: systemSettings.LAN_Setting.ipAddress,
                    mask: systemSettings.LAN_Setting.subnetMask,
                    gateway: systemSettings.LAN_Setting.defaultGateWay,
                    dns: systemSettings.LAN_Setting.primaryDNS,
                    secDNS: systemSettings.LAN_Setting.secondDNS,
                    changeDAA: systemSettings.LAN_Setting.changeDAA
                };
                systemCli.setLanBySo(lanSetting, (err, result)=> {
                    cb(err, result);
                })
            } else {
                cb();
            }
        }, (cb)=> {
            if (systemSettings && systemSettings.hasOwnProperty('Console_Setting')) { //Console Settings
                let consoleSetting = [
                    systemSettings.Console_Setting.enableConsole,
                    systemSettings.Console_Setting.consoleProtocol,
                    systemSettings.Console_Setting.timeout
                ];
                systemCli.setConsoleSettingBySo(consoleSetting, (err, result)=> {
                    cb(err, result);
                })
            } else {
                cb();
            }
        }, (cb)=> {
            if (systemSettings && systemSettings.hasOwnProperty('DateAndTime_Setting')) { //Date/Time Setting
                let timezone = null;
                if(systemSettings.DateAndTime_Setting.timeZone) {
                    timezone = systemSettings.DateAndTime_Setting.timeZone.id;
                }
                let dataAndTimeSetting = {
                    enableNtp: systemSettings.DateAndTime_Setting.enableNTP,
                    defaultNTPServer: systemSettings.DateAndTime_Setting.defaultNTPServer,
                    ntpServer: systemSettings.DateAndTime_Setting.NTPServer,
                    timezone: timezone,
                    strDatetime: systemSettings.DateAndTime_Setting.datetime
                };
                systemCli.setTimeAndTimeZoneBySo(dataAndTimeSetting, (err, result)=> {
                    cb(err, result);
                })
            } else {
                cb();
            }
        }, (cb)=> {
            if (systemSettings && systemSettings.hasOwnProperty('FTP_Setting')) {   //FTP server
                if(systemSettings.FTP_Setting.ftpServer && systemSettings.FTP_Setting.ftpPort &&
                    systemSettings.FTP_Setting.ftpUsername && systemSettings.FTP_Setting.ftpPassword
                ) {
                    let ntpSetting = [
                        systemSettings.FTP_Setting.ftpServer,
                        systemSettings.FTP_Setting.ftpPort,
                        systemSettings.FTP_Setting.ftpUsername,
                        systemSettings.FTP_Setting.ftpPassword
                    ];
                    systemCli.setFtpDataBySo(ntpSetting, (err, result)=> {
                        cb(err, result);
                    })
                } else {
                    cb();
                }
            } else {
                cb();
            }
        }], (err, results)=> {
            if(err) {
                callback(err);
            }
            else {
                async.series([
                    (cb)=> {
                        if (dbTables && dbTables.hasOwnProperty('User_Info')) {
                            db.User.clear((err, result)=> {
                                console.log("=======>User_Info.clear",err)
                                if (!err) {
                                    db.User.insertMany(dbTables.User_Info, (err, result)=> {
                                        console.log("=======>User_Info.insertMany",err)
                                        cb(err, result);
                                    });
                                }else{
                                    cb();
                                }
                            })
                        } else {
                            cb();
                        }
                    }, (cb)=> {
                        if (dbTables && dbTables.hasOwnProperty('CWM_Org_Info')) {
                            db.cwmOrg.findOrg((err,oldInfo)=>{
                                if(oldInfo){
                                    if(!dbTables.CWM_Org_Info.hasOwnProperty('devAccessAddress')){
                                        dbTables.CWM_Org_Info.devAccessAddress=oldInfo.devAccessAddress;
                                    }
                                    if(!dbTables.CWM_Org_Info.hasOwnProperty('devAccessPort')){
                                        dbTables.CWM_Org_Info.devAccessPort=oldInfo.devAccessPort;
                                    }
                                    if(!dbTables.CWM_Org_Info.hasOwnProperty('webAccessPort')){
                                        dbTables.CWM_Org_Info.webAccessPort=oldInfo.webAccessPort;
                                    }
                                    if(!dbTables.CWM_Org_Info.country){
                                        dbTables.CWM_Org_Info.country=oldInfo.country;
                                    }
                                    if(!dbTables.CWM_Org_Info.hasOwnProperty("sslCertification")){
                                        dbTables.CWM_Org_Info.sslCertification=oldInfo.sslCertification;
                                    }
                                    if(!dbTables.CWM_Org_Info.hasOwnProperty("basicConfigured")){
                                        dbTables.CWM_Org_Info.basicConfigured=oldInfo.basicConfigured;
                                    }
                                    if(oldInfo.uniqueKey){
                                        dbTables.CWM_Org_Info.uniqueKey=oldInfo.uniqueKey;
                                    }else{
                                        dbTables.CWM_Org_Info.uniqueKey=db.cwmOrg.getObjectId();
                                    }
                                }
                                db.cwmOrg.clear((err, result)=> {
                                    if (!err) {
                                        if(!dbTables.CWM_Org_Info.hasOwnProperty('name')){
                                            dbTables.CWM_Org_Info.name="";
                                        }
                                        if(!dbTables.CWM_Org_Info.hasOwnProperty('devAccessPort')){
                                            dbTables.CWM_Org_Info.devAccessPort=8443;
                                        }
                                        if(!dbTables.CWM_Org_Info.hasOwnProperty('payment')){
                                            dbTables.CWM_Org_Info.payment={  options: []};
                                        }
                                        if(!dbTables.CWM_Org_Info.hasOwnProperty('supportListVersion')){
                                            dbTables.CWM_Org_Info.supportListVersion='0.0';
                                        }
                                        if(!dbTables.CWM_Org_Info.hasOwnProperty('keepAlive')){
                                            dbTables.CWM_Org_Info.keepAlive=60;
                                        }
                                        let system = {
                                            device_name: dbTables.CWM_Org_Info.name,
                                            device_access_address: dbTables.CWM_Org_Info.devAccessAddress
                                        };
                                        delete dbTables.CWM_Org_Info.name;
                                        delete dbTables.CWM_Org_Info.devAccessAddress;
                                        db.cwmOrg.save(dbTables.CWM_Org_Info, (err, result)=> {
                                            console.log("=======>CWM_Org_Info",err)
                                            if(err) {
                                                cb(err, result);
                                            }
                                            else {
                                                db.System.updateSystem(system, (err, result)=>{
                                                    console.log("=======>System",err)
                                                    cb(err, result);
                                                })
                                            };
                                        })
                                    }else{
                                        cb();
                                    }
                                })
                            })
    
                        } else {
                            cb();
                        }
                    }, (cbOut) => {
                        async.parallel([(cb)=> {
                            if (dbTables && dbTables.hasOwnProperty('CWM_Database_Setting')) { //Auto Log Backup
                                db.cwmDatabaseSetting.clear((err, result)=> {
                                    if (!err) {
                                        db.cwmDatabaseSetting.save(dbTables.CWM_Database_Setting, (err, result)=> {
                                            cb(err, result);
                                        })
                                    }else{
                                        cb();
                                    }
                                })
                            } else {
                                cb();
                            }
                        }, (cb)=> {
                            if (dbTables && dbTables.hasOwnProperty('CWM_Site_Info')) {
                                db.cwmSite.clear((err, result)=> {
                                    if (!err) {
                                        db.cwmSite.insertMany(dbTables.CWM_Site_Info, (err, result)=> {
                                            cb(err, result);
                                        })
                                    }else{
                                        cb();
                                    }
                                })
                            } else {
                                cb();
                            }
                        }, (cb)=> {
                            if (dbTables && dbTables.hasOwnProperty('CWM_Network_Info')) {
                                db.cwmNetwork.clear((err, result)=> {
                                    if (!err) {
                                        db.cwmNetwork.insertMany(dbTables.CWM_Network_Info, (err, result)=> {
                                            cb(err, result);
                                        })
                                    }else{
                                        cb();
                                    }
                                })
                            } else {
                                cb();
                            }
                        }, (cb)=> {
                            if (dbTables && dbTables.hasOwnProperty('CWM_Config_Profile')) {
                                db.cwmConfigProfile.clear((err, result)=> {
                                    if (!err) {
                                        for(let profile of dbTables.CWM_Config_Profile){
                                            if(!profile.hasOwnProperty('schedule')){
                                                profile.schedule={cyclicalType:'Immediate'};
                                            }
                                        }
                                        db.cwmConfigProfile.insertMany(dbTables.CWM_Config_Profile, (err, result)=> {
                                            cb(err, result);
                                        })
                                    }else{
                                        cb();
                                    }
                                })
                            } else {
                                cb();
                            }
                        }, (cb)=> {
                            if (dbTables && dbTables.hasOwnProperty('CWM_Config_Profile_History')) {
                                db.cwmConfigProfileHistory.clear((err, result)=> {
                                    if (!err) {
                                        for(let profile of dbTables.CWM_Config_Profile_History){
                                            if(!profile.hasOwnProperty('schedule')){
                                                profile.schedule={cyclicalType:'Immediate'};
                                            }
                                        }
                                        db.cwmConfigProfileHistory.insertMany(dbTables.CWM_Config_Profile_History, (err, result)=> {
                                            cb(err, result);
                                        })
                                    }else{
                                        cb();
                                    }
                                })
                            } else {
                                cb();
                            }
                        },  (cb)=> {
                            if (dbTables && dbTables.hasOwnProperty('CWM_SSO_Status')) {
                                db.cwmSSOStatus.clear((err, result)=> {
                                    if (!err) {
                                        db.cwmSSOStatus.insertMany(dbTables.CWM_SSO_Status, (err, result)=> {
                                            cb(err, result);
                                        })
                                    }else{
                                        cb();
                                    }
                                })
                            } else {
                                cb();
                            }
                        }, (cb)=> {
                            if (dbTables && dbTables.hasOwnProperty('CWM_SSO_Info')) {
                                db.cwmSSOInfo.clear((err, result)=> {
                                    if (!err) {
                                        db.cwmSSOInfo.insertMany(dbTables.CWM_SSO_Info, (err, result)=> {
                                            cb(err, result);
                                        })
                                    }else{
                                        cb();
                                    }
                                })
                            } else {
                                cb();
                            }
                        }, (cb)=> {
                            if (dbTables && dbTables.hasOwnProperty('CWM_Counter')) {
                                db.cwmCounter.clear((err, result)=> {
                                    if (!err) {
                                        db.cwmCounter.insertMany(dbTables.CWM_Counter, (err, result)=> {
                                            cb(err, result);
                                        })
                                    }else{
                                        cb();
                                    }
                                })
                            } else {
                                cb();
                            }
                        }, (cb)=> {
                            if (dbTables && dbTables.hasOwnProperty('CWM_Suppliers_Info')) {
                                db.cwmSuppliers.clear((err, result)=> {
                                    if (!err) {
                                        db.cwmSuppliers.insertMany(dbTables.CWM_Suppliers_Info, (err, result)=> {
                                            cb(err, result);
                                        })
                                    }else{
                                        cb();
                                    }
                                })
                            } else {
                                cb();
                            }
                        }, (cb)=> {
                            if (dbTables && dbTables.hasOwnProperty('CWM_Device_Managed')) {
                                db.cwmDeviceManaged.clear((err, result)=> {
                                    if (!err) {
                                        db.cwmDeviceManaged.insertMany(dbTables.CWM_Device_Managed, (err, result)=> {
                                            cb(err, result);
                                        })
                                    }else{
                                        cb();
                                    }
                                })
                            } else {
                                cb();
                            }
                        }], (err, results)=> {
                            cbOut(err);
                        });
                    }, (cb)=> {
                        if (dbTables && dbTables.hasOwnProperty('CWM_Files')) {
                            let cwmFiles = dbTables.CWM_Files;
                            //console.log("CWM_Files:" + JSON.stringify(cwmFiles));
                            gridFS.deleteAllFiles((err, result)=> {
                                    if (cwmFiles.length > 0) {
                                        fs.readdir(targetPath, function (err, list) {
                                            if (err) {
                                                cb(err);
                                            }
                                            else {
                                                async.map(cwmFiles, (fileC, cb1)=> {
                                                    let copyFileToDB = false;
                                                    if (!fileC.metadata.isDefault) {
                                                        for (let i = 0; i < list.length; i++) {
                                                            let file = list[i];
                                                            if (file == fileC.filename) {
                                                                copyFileToDB = true;
                                                                file = path.join(targetPath, file);
                                                                db.cwmFileAPI.replace(fileC, (err, result)=> {})
                                                                gridFS.restoreFileFromPath(file, fileC, (err, result)=> {
                                                                    //cb1(err, result);
                                                                })
                                                                break;
                                                            }
                                                        }
                                                        if (!copyFileToDB) {
                                                            db.cwmFileAPI.replace(fileC, (err, result)=> {})
                                                            //cb1();
                                                        }
                                                    } else {
                                                        if (fileC.metadata.type == 'loginFiles') {
                                                            db.cwmConfigProfile.restoreTemplate(fileC, (err, result)=> {
                                                                //cb1();
                                                            })
                                                        }
                                                        else if (fileC.metadata.type == 'servercert') {
                                                            db.cwmOrg.restoreDefaultCert(fileC, (err, result)=> {
                                                                //cb1();
                                                            })
                                                        } else {
                                                            db.cwmFileAPI.replace(fileC, (err, result)=> {})
                                                            //cb1();
                                                        }
                                                    }
                                                });
                                                cb();
                                            }
                                        });
                                    } else {
                                        cb();
                                    }
                            })
                        } else {
                            cb();
                        }
                    }
                ],(err, results) => {
                    callback(err)
                });
            }
        });
    } else {
        callback('err');
    }

}

//判断restore是否会修改IP地址和WS/CS端口
function validateIPAddress(payload, callback) {
    if (payload) {
        payload = JSON.parse(payload);
        let dbTables = payload.dbTables;
        let systemSettings = payload.systemSettings;
        async.parallel([(cb)=> {
            if (systemSettings && systemSettings.hasOwnProperty('LAN_Setting')) {
                let ipType = systemSettings.LAN_Setting.ipType;
                let ipAddress = systemSettings.LAN_Setting.ipAddress;
                if(ipType == "dhcp") {
                    cb(null, {ipType: ipType, ipAddress: ipAddress});
                }
                else {
                    systemCli.getLANSettingBySo(function (err, result) {
                        if (!err) {
                            if(ipAddress == result.ipAddress) {
                                cb(null, null);
                            }
                            else {
                                cb(null, {ipType: ipType, ipAddress: ipAddress});
                            }
                        } else {
                            cb(null, {ipType: ipType, ipAddress: ipAddress});
                        }
                    })
                }
            } else {
                cb(null, null);
            }
        }, (cb)=> {
            if (dbTables && dbTables.hasOwnProperty('CWM_Org_Info')) {
                let webAccessPort = dbTables.CWM_Org_Info.webAccessPort;
                let devAccessPort = dbTables.CWM_Org_Info.devAccessPort;
                db.cwmOrg.findOrg((err, oldInfo)=> {
                    if (oldInfo) {
                        if(webAccessPort != oldInfo.webAccessPort ||
                            devAccessPort != oldInfo.devAccessPort) {
                            cb(null, {webAccessPort: webAccessPort, devAccessPort: devAccessPort});
                        }
                        else {
                            cb(null, null);
                        }
                    }
                    else {
                        cb(null, null);
                    }
                })
            } else {
                cb(null, null);
            }
        }], (err, results)=> {
            let flag = 0;
            let result = {};
            if(results[0]) {
                flag = 1;
                result.ipType = results[0].ipType;
                result.ipAddress = results[0].ipAddress;
            }
            if(results[1]) {
                flag = 2;
                result.webAccessPort = results[1].webAccessPort;
                result.devAccessPort = results[1].devAccessPort;
            }
            callback(flag, result);
        });
    }
    else {
        callback(0, null);
    }
}

function validateFiles(files, callback) {
    if (files.file) {
        let ext = undefined;
        if (files.file.originalFilename.indexOf('.tar') != -1) {
            ext = 'tar';
        } else if (files.file.originalFilename.indexOf('.cfg') != -1) {
            ext = 'cfg';
        }
        if (!ext) {
            return callback(1);
        }
        let temp = './temp';
        if (!fs.existsSync(temp)) {
            fs.mkdirSync(temp);
        }
        let fileName = files.file.originalFilename.substring(0, files.file.originalFilename.indexOf('.'));
        let filePath = path.resolve(files.file.path);
        let targetPath = `${temp}/${fileName}`;
        if (ext == "tar") {
            try {
                let errortime = 0;
                fs.createReadStream(`${filePath}`).pipe(tar.extract(`${targetPath}`)).on('error', function (err) {
                    console.log("on error:" + err);
                    errortime += 1;
                    if (errortime == 1) {
                        return callback(2);
                    }

                }).on('finish', function () {
                    console.log("on finish");
                    let tarFiles = fs.readdirSync(`${targetPath}`);
                    let hasCfg = false;
                    let cfgFile = "";
                    tarFiles.forEach(function (filename) {
                        let state = fs.statSync(path.join(targetPath, filename));
                        if (!state.isDirectory()) {
                            let index = filename.lastIndexOf('.');
                            if (index != -1) {
                                let name = filename.substr(0, index);
                                let ext = filename.substr(index + 1);
                                if (name.length < 1 || ext.length < 1 || ext == 'cfg') {
                                    hasCfg = true;
                                    cfgFile = filename;
                                    console.log("cfgFile:" + cfgFile);
                                }

                            }

                        }
                    });
                    if (!hasCfg) {
                        return callback(2);
                    } else {
                        checkCFGFile(targetPath, cfgFile, callback);
                    }
                });
            } catch (e) {
                console.error_log("catch ex " + e);
            }
        } else {
            let cfgFile=files.file.originalFilename;
            let readStream = fs.createReadStream(filePath);
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath);
            }
            var writeStream = fs.createWriteStream(`${targetPath}/${cfgFile}`);
            readStream.pipe(writeStream).on('finish', function () {
               // fs.unlinkSync(filePath);
                checkCFGFile(targetPath, cfgFile, callback);
            });

        }

    } else {
        return callback(1);
    }
}
function checkCFGFile(targetPath, cfgFile, callback) {
    var data1 = fs.readFileSync(`${targetPath}/${cfgFile}`);
    if (data1.length > 32) {
        let versionbuf1 = Buffer.from(data1.buffer, 4, 16);
        let fwVersion = Utf8ArrayToStr(versionbuf1);
        let versionbuf = data1.toString('utf8', 4, 16);
        if (versionbuf.indexOf('DNHv1.0.0.0') != -1) {
            let bodyLen = data1.readUInt32LE(0);
            let charArr = [];
            let macStr = "";
            for (let i = 0; i < 6; i++) {
                let mac = data1.readUInt8(20 + i).toString(16).toUpperCase();
                if (mac.length == 1) mac = "0" + mac;
                charArr.push(mac.substring(0, 1));
                macStr += mac;
            }
            let timeSecond = data1.readUInt32LE(26);
            let timeMiliSecond = data1.readUInt32LE(30);
            let payload = data1.toString('hex', 34);
            let hexKey = "0000000000000" + charArr[0] + charArr[1] + charArr[2] + charArr[3] + charArr[4] + charArr[5] + "0" + macStr; //密钥
            let hexIV = "0000" + macStr + "0000000000000000";
            let key = Buffer.from(hexKey, "hex");
            let iv = Buffer.from(hexIV, "hex");
            iv.writeUIntLE(timeSecond, 8, 4); //timestamp second
            iv.writeUIntLE(timeMiliSecond, 12, 4);
            //测试解密
            let plaintext = decrypt(key, iv, payload);

            fs.writeFile("../payload1.json", plaintext, function (err) {
                if (err) {
                    console.error_log(err);
                }
                try{
                    let test=JSON.parse(plaintext);
                }catch (e){
                    return callback(3);
                }
                return callback(targetPath, cfgFile, plaintext);
            });

        } else {
            return callback(3);
        }

    } else {
        return callback(2);
    }
}
function Utf8ArrayToStr(array) {
    let out, i, len, c;
    let char2, char3;

    out = "";
    len = array.length;
    i = 0;
    while (i < len) {
        c = array[i++];
        switch (c >> 4) {

            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                // 0xxxxxxx
                out += String.fromCharCode(c);
                break;
            case 12:
            case 13:
                // 110x xxxx   10xx xxxx
                char2 = array[i++];
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                // 1110 xxxx  10xx xxxx  10xx xxxx
                char2 = array[i++];
                char3 = array[i++];
                out += String.fromCharCode(((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
                break;
            default:
                break;
        }
    }

    return out;
}
function mkdirsSync(dirname) {
    //console.log(dirname);
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}
function checkPath(dirname,callback){
    console.log("process.platform");
    if (process.platform === 'win32') {
        let arr=dirname.split(':');
        if(arr.length>0){
            let diskPath = arr[0]+":";
            if(!fs.existsSync(diskPath)){
                callback(false);
            }else{
                callback(true);
            }
        }else{
            callback(false);
        }
    } else {
        if(dirname.indexOf(':')!=-1){
            return callback(false);
        }else{
            dirname=dirname.replace(/\\/g,"/");
            console.log("backup path : "+dirname);
            let arr=dirname.split('/');
            if(dirname.startsWith('/')){
                if(arr.length>1) {
                    let diskPath = "/"+arr[1];
                    console.log("check root backup path : " + diskPath);
                    if(!fs.existsSync(diskPath)){
                        callback(false);
                    }else{
                        callback(true);
                    }
                }else{
                    callback(false);
                }

            }else{
                if(arr.length>0) {
                    let diskPath = "/"+arr[0];
                    console.log("check root backup path : " + diskPath);
                    if(!fs.existsSync(diskPath)){
                        callback(false);
                    }else{
                        callback(true);
                    }
                }else{
                    callback(false);
                }
            }
        }

    }
}
module.exports = {
    autoLogBackup,
    backupConfiguration,
    backupLog,
    restoreConfiguration,
    validateFiles,
    validateIPAddress,
    mkdirsSync,
    checkPath,
}
