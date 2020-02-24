/**
 * Created by lizhimin on 2018/12/20.
 */
'use strict';
const util = require("../lib/util");
const db = util.db;
const systemCli = util.common.systemCli;
const disk = util.common.disk;
const backupC = require('../cwmcontroller/dbBackupRestore');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const configPath = path.resolve(path.join(process.cwd(), './config/appconfig.json'));
const systemconfig = require(configPath);
const tar = require('tar-fs');
const autoBackupPath = "/mnt/sdcard";
var curSequence = 1;
var restoreCache = new Map();
setInterval(function () {
    let now = parseInt((new Date()).getTime() / 1000);
    for(var [curSequence, restore] of restoreCache) {
        if(curSequence && restore && (restore.expireAt <= now)) {
            resCache.delete(curSequence);
        }
    }
}, 10 * 60 * 1000);

function getSequence() {
    curSequence++;
    if (curSequence == 65535) {
        curSequence = 1;
    }
}
const filePathFilter = require("../middleware/filePathFilter");
exports.backupNow = function (req, res) {
    res.connection.setTimeout(0);
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {
                let type = req.body.backupType;
                let backupPath = systemconfig['backupPath'];
                if (!fs.existsSync(backupPath)) {
                    backupC.mkdirsSync(backupPath);
                }
                disk.used(backupPath).then(percent => {
                    if(percent > 60){
                        let expireAt = moment();
                        expireAt.startOf('day').add(31, 'days').add(12, 'h').add(0, 'm');
                        let eventlog = {
                            logTime: new Date(),
                            expireAt: expireAt,
                            logType: 8
                        };
                        if(percent > 99){
                            eventlog.message=`Your system storage is full and it will not save new log files.`;
                        }else{
                            let xx=percent>90?'90':(percent>80?'80':(percent>70?'70':60));
                            eventlog.message=`Your system storage is nearly out of free space (${xx}%) and it will not save new logs after hard drive is full.`;
                        }
                        db.cwmSystemEventLog.insert(eventlog,(err,re)=>{});
                    }
                    if (percent > 99) {
                        return res.json({success: false,error:"Your system storage is full and it will not save new log files."});
                    }
                    if (percent < 99) {
                        if (type == 1) {
                            backupC.backupConfiguration((err, result)=> {
                                if(err) {
                                    return res.json({success: false, error: err});
                                }
                                else {
                                    return res.json({success: true});
                                }

                            });
                        } else {
                            let backupPath = systemconfig['backupPath'];
                            backupC.backupLog(null, backupPath, false, (err, result)=> {
                                if(err) {
                                    return res.json({success: false, error: err});
                                }
                                else {
                                    return res.json({success: true});
                                }
                            });
                        }
                    }

                }, (err)=> {
                    console.error_log("Error: " + err);
                    return res.json({success: false,error:err});
                });
            }
        }
    })
};

exports.deleteBackup = function (req, res) {
    res.connection.setTimeout(0);
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {
                let type = req.body.backupType;
                let deleteBackupList = req.body.deleteBackupList;
                let backupPath = systemconfig['backupPath'];
                if(!deleteBackupList || deleteBackupList.length == 0) {
                    return res.json({success: true, data: null});
                }
                if(type == 1) {
                    deleteBackupList.forEach(function (fileName) {
                        try{
                            fs.unlinkSync(backupPath + "/Configuration/" + fileName);
                        }
                        catch (e){
                            console.log(e.message);
                        }
                    });
                }
                else if(type == 2) {
                    deleteBackupList.forEach(function (fileName) {
                        if(fileName.indexOf("log_auto") != -1) {
                            try{
                                fs.unlinkSync(autoBackupPath + "/Log/" + fileName);
                            }
                            catch(e) {
                                console.log(e.message);
                            }
                        }
                        else {
                            try{
                                fs.unlinkSync(backupPath + "/Log/" + fileName);
                            }
                            catch(e) {
                                console.log(e.message);
                            }
                        }
                    });
                }
                return res.json({success: true, data: null});
            }
        }
    })
};
exports.getBackupList = function (req, res) {
    res.connection.setTimeout(0);
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {
                let type = req.body.backupType;
                let backupPath = systemconfig['backupPath'];
                if(type == 1){
                    backupPath = backupPath + "/Configuration";
                }else{
                    backupPath = backupPath + "/Log";
                }
                let promises = [];
                promises.push(new Promise((resolve, reject)=> {
                        fs.readdir(backupPath, function (err, list) {
                            let filenameList = [];
                            if (!err) {
                                list.sort(function (a, b) {
                                    return fs.statSync(backupPath + "/" + b).birthtimeMs - fs.statSync(backupPath + "/" + a).birthtimeMs
                                })
                                list.forEach(function (filename) {
                                    let state = fs.statSync(path.join(backupPath, filename));
                                    if (state.isFile()) {
                                        filenameList.push(filename);
                                    }
                                });
                                resolve(filenameList);
                            }else {
                                resolve(filenameList);
                            }
                        });
                    }
                ));
                if(type == 2 && fs.existsSync(autoBackupPath + "/Log")) {
                    promises.push(new Promise((resolve, reject)=> {
                            fs.readdir(autoBackupPath + "/Log", function (err, list) {
                                let filenameList = [];
                                if (!err) {
                                    list.forEach(function (filename) {
                                        let state = fs.statSync(path.join(autoBackupPath + "/Log", filename));
                                        if (state.isFile()) {
                                            filenameList.push(filename);
                                        }
                                    });
                                    resolve(filenameList);
                                } else {
                                    resolve(filenameList);
                                }
                            });
                        }
                    ));
                }
                Promise.all(promises).then((results)=>{
                    let backupList = []
                    if(results.length == 1) {
                        backupList = results[0];
                    }
                    else {
                        backupList = results[0].concat(results[1]);
                    }
                    return res.json({success: true, data: backupList});
                });
            }
        }
    });
};
exports.restoreConfig = function (req, res) {
    res.connection.setTimeout(0);
    let opeUserId = req.opeUserId;
    let step = req.body.step;
    if (step == 0) {
        db.User.getUserRoleById(opeUserId, function (err, opeUser) {
            if (err) {
                return res.json({success: false, err: err});
            } else {
                if (opeUser.role != "root admin") {
                    return res.json({success: false, err: -1});
                } else {
                    var files = {};
                    var location = req.body.location;
                    if ('computer' == location) {
                        files = req.files;
                    }
                    else if ('usb' == location) {
                        var usbFilePath = req.body.usbFilePath;
                        files.file = {
                            path: usbFilePath,
                            originalFilename: usbFilePath.replace(/.*\//g, "")
                        };
                    }
                    backupC.validateFiles(files, (targetPath, cfgFile, payload) => {
                        if (targetPath == 1 || targetPath == 2 || targetPath == 3) {
                            return res.json({success: false, error: targetPath});
                        }
                        backupC.validateIPAddress(payload, (flag, result) => {  //校验restore是否会改DNH的IP和WS/CS端口，若是先回应前端出提示，若不是直接执行restore
                            if (flag == 0) {
                                backupC.restoreConfiguration(targetPath, payload, function (err, result) {
                                    if (!err) {
                                        systemCli.restartMonitoringBySo(function (err, data) {
                                            if (err) {
                                                return res.json({success: false, error: err});
                                            } else {
                                                return res.json({success: true, data: data});
                                            }
                                        });
                                    } else {
                                        return res.json({success: false, error: err});
                                    }
                                })
                            } else {
                                getSequence();
                                result.curSequence = curSequence;
                                let expireAt = parseInt((new Date()).getTime() / 1000) + 10 * 60;
                                restoreCache.set(curSequence, {
                                    targetPath: targetPath,
                                    payload: payload,
                                    expireAt: expireAt
                                }); //解析出的restore数据先存入缓存，等step=1时执行restore
                                return res.json({success: true, data: result});
                            }
                        });
                    });

                }
            }
        });
    }
    else if (step == 1) { //执行restore后并重启NC
        let temp = restoreCache.get(req.body.curSequence);
        restoreCache.delete(req.body.curSequence);
        backupC.restoreConfiguration(temp.targetPath, temp.payload, function (err, result) {
            if (!err) {
                systemCli.restartMonitoringBySo(function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                });
            } else {
                return res.json({success: false, error: err});
            }
        })
    }
    else if (step == -1) { //取消restore，删除缓存的解析数据
        restoreCache.delete(req.body.curSequence);
        return res.json({success: true});
    }
    else {
        return res.json({success: false, error: "Illegal steps"});
    }
};

exports.downloadBackup = function (req, res) {
    res.connection.setTimeout(0);
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, err: -1});
            } else {
                let type=req.body.backupType;
                let filename = req.body.fileName;
                let location = req.body.location;
                let usbStoragePath = req.body.usbStoragePath;
                let backupPath = systemconfig['backupPath'];
                if(type==1){
                    backupPath=backupPath+"/Configuration";
                }else{
                    backupPath=backupPath+"/Log";
                }
                let autoPath = autoBackupPath+"/Log";
                let filelist = filePathFilter(filename).split(',');
                if (filelist.length > 1){
                    let fList = filelist.filter(i => (!/auto/.test(i)));
                    let autoList = filelist.filter(i => (/auto/.test(i)));
                    let now = new Date();
                    let logType = type === 1 ? "configuration" : "log";
                    let downFilename = `${moment().format('YYYYMMDD')}_${logType}_batch.tar`;
                    let localPath = path.join(backupPath, downFilename);
                    var pack = tar.pack(backupPath, {
                            finalize: false, entries: fList,
                            finish: function (others) {
                                tar.pack(autoPath, {
                                    entries: autoList,
                                    pack: others
                                })
                            }
                        }
                    ).pipe(fs.createWriteStream(localPath))
                        .on('close', function () {
                            if (fs.existsSync(localPath)) {
                                console.log("download localPath :" + localPath);
                                if (location && location == 'usb') {
                                    var destPath = path.join(usbStoragePath, downFilename);
                                    fs.copyFile(localPath, destPath, function (err) {
                                        try{
                                            fs.unlinkSync(localPath);
                                        }
                                        catch(e) {
                                            console.log(e.message);
                                        }
                                        if (err) {
                                            console.error_log("download error :" + err);
                                            return res.json({success: false, error: -1});
                                        } else {
                                            return res.json({
                                                success: true,
                                                data: {localPath: localPath, destPath: destPath}
                                            });
                                        }
                                    });
                                } else {
                                    return res.download(localPath, downFilename, {}, function (err) {
                                        try{
                                            fs.unlinkSync(localPath);
                                        }
                                        catch(e) {
                                            console.log(e.message);
                                        }
                                        if (err) {
                                            console.error_log("download error :" + err);
                                        } else {
                                        }
                                    });
                                }
                            } else {
                                try{
                                    fs.unlinkSync(localPath);
                                }
                                catch(e) {
                                    console.log(e.message);
                                }
                                return res.json({success: false, error: -1});
                            }
                        })
                } else{
                    backupPath = /auto/.test(filename) ? autoBackupPath + "/Log" : backupPath;
                    let localPath=path.join(backupPath, filename);
                    if(fs.existsSync(localPath)){
                        console.log("download localPath :"+localPath);
                        if(location && location == 'usb'){
                            var destPath = path.join(usbStoragePath, filename);
                            fs.copyFile(localPath, destPath, function(err){
                                if(err){
                                    console.error_log("download error :"+err);
                                    return res.json({success:false, error:-1});
                                }else{
                                    return res.json({success:true, data:{localPath: localPath, destPath: destPath}});
                                }
                            });
                        }else{
                            return res.download(localPath, filename,function(err){
                                if(err){
                                    console.error_log("download error :"+err);
                                }
                            });
                        }
                    }else{
                        return res.json({success:false,error:-1});
                    }
                }
            }
        }
    });

};
exports.changePath=function(req,res){
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, err: -1});
            } else {
                let backupPath=req.body.backupPath;
                console.log("**********check path");
                backupC.checkPath(backupPath,(result)=>{
                    if(!result){
                        console.log("**********check path back failed");
                        return res.json({success:false,error:"Could not create path : "+backupPath})
                    }
                    console.log("**********create path");
                    if(!backupC.mkdirsSync(backupPath)){
                        console.log("**********create path failed");
                        return res.json({success:false,error:""})
                    }
                    console.log("**********check path free spaces");
                    disk.used(backupPath).then(percent => {
                        let expireAt = moment();
                        expireAt.startOf('day').add(31, 'days').add(12, 'h').add(0, 'm');
                        if (percent > 99) {
                            let eventlog = {
                                logTime: new Date(),
                                expireAt: expireAt,
                                logType:8,
                                message: `Your hard disk is full and it will not save new log files.`
                            }
                            db.cwmSystemEventLog.insert(eventlog, (err, re)=> {
                            });
                            return res.json({success: false,error:"Your hard disk is full and it will not save new log files."});
                        }
                        if (percent < 99) {
                            db.cwmDatabaseSetting.updateDBSeting({backupPath:backupPath},(err,result)=>{
                                return res.json({success: true});
                            });
                        }

                    }, (err)=> {
                        console.error_log("Error: " + err);
                        return res.json({success: false,error:err});
                    });
                })

            }
        }
    });
};