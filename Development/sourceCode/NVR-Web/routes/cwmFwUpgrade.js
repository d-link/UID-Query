/**
 * Created by zhangwenyang on 2019/4/30.
 */
'use strict';
const util = require("../lib/util");
const fs = require('fs');
const path = require('path');
const systemCli = util.common.systemCli;
const childProcess = require('child_process');
const tempPath = "/userdata/fwTmp/";
const untarFilename = "payload.tar";
var isUploadingFile = false;

exports.getFirmwareUpgradeStatus = function (req, res) {
    let status = systemCli.getFwUpgradeStatus();
    if(status) {
        return res.json({success: true, data: 40051});
    }
    else {
        return res.json({success: true, data: 40050});
    }
    // systemCli.getFirmwareUpgradeStatusBySo(function (err, data){
    //     if(null == err){
    //         return res.json({success: true, data: data});
    //     }else {
    //         //return res.json({success: true, data: 40050});
    //         return res.json({success: false, error: err});
    //     }
    // })
};

exports.firmwareUpgrade = function (req, res) {
    res.connection.setTimeout(0); //防止超时2分钟后node断开请求而浏览器会重新请求，导致uploadFile重复执行
    systemCli.getFirmwareUpgradeStatusBySo(function (err, result) {
        if(null == err){
            if(result == 40051) {
                console.error_log("Firmware upgrade is busy");
                return res.json({success: false, error: result});
            } else {
                console.debug_log("Start to upload the firmware file...");
                setFirmwareUpgradeStatus(1, (err, result)=>{});
                systemCli.killConsolesBySo((err, result)=>{});
                uploadFile(req, (err, result)=>{
                    if(err == null) {
                        console.debug_log("Finished to upload the firmware file");
                        checkFile(result, (err, result)=>{
                            if(err == null) {
                                untarFile((err, result)=>{
                                    if(err == null) {
                                        console.debug_log("Start to execute firmware upgrade now");
                                        setTimeout(function () {
                                            fwUpgrade((err, result) => {});
                                        }, 1000);
                                        return res.json({success: true, data: 'Success'});
                                    }
                                    else {
                                        console.error_log("Failed to untar the firmware file: " + err);
                                        setFirmwareUpgradeStatus(0, (err, result)=>{});
                                        return res.json({success: false, error: err});
                                    }
                                })
                            }
                            else {
                                console.error_log("Check the firmware file is invalid: " + err);
                                setFirmwareUpgradeStatus(0, (err, result)=>{});
                                return res.json({success: false, error: err});
                            }
                        })
                    }
                    else {
                        console.error_log("Failed to upload the firmware file: " + err);
                        setFirmwareUpgradeStatus(0, (err, result)=>{});
                        return res.json({success: false, error: err});
                    }
                })
            }
        }
        else {
            console.error_log("Failed to get the firmware upgrade status: " + err);
            return res.json({success: false, error: err});
        }
    })
};

function setFirmwareUpgradeStatus (status, callback) {
    systemCli.setFirmwareUpgradeStatusBySo([status], callback);
};

function uploadFile(config, callback) {
    if(isUploadingFile){
        callback(-2, null);
    }
    else {
        var location = config.body.location;
        if('computer' == location || 'usb' == location){
            var fwFilePath = '';
            var fwFilename = '';
            if('computer' == location) {
                fwFilePath = config.files.file.path;
                fwFilename = config.files.file.originalFilename;
            }else{
                fwFilePath = config.body.usbFilePath;
                fwFilename = fwFilePath.replace(/.*\//g, '');
            }
            fs.stat(fwFilePath, function (err, stat) {
                if(err) {
                    callback(-1, null);
                }
                else {
                    var fileSize = stat.size;
                    if(fileSize > 314572800) {
                        console.error_log("Upload file size is " + fileSize + " that is up to 300 MB");
                        callback(-3, null);
                    }
                    else {
                        var targetPath = path.join(tempPath, fwFilename);
                        if (!fs.existsSync(tempPath)) {
                            fs.mkdirSync(tempPath);
                        }
                        var readStream = fs.createReadStream(fwFilePath);
                        var writeStream = fs.createWriteStream(targetPath);
                        isUploadingFile = true;
                        readStream.pipe(writeStream).on('finish', function () {
                            isUploadingFile = false;
                            if('computer' == location) {
                                try {
                                    fs.unlinkSync(fwFilePath);
                                }
                                catch(e) {
                                    console.log(e.message);
                                }
                            }
                            callback(null, targetPath);
                        }).on('error', function (err) {
                            isUploadingFile = false;
                            callback(-1, null);
                        });
                    }
                }
            });
        }
        else if('ftp' == location) {
            var ftpFilePath = config.body.ftpFilePath;
            var strIpAddr = config.body.ftpServer;
            var nPort = parseInt(config.body.ftpPort);
            var strlogin = config.body.ftpUsername;
            var strPassword = "";
            if (config.body.ftpUsername && config.body.ftpPassword) {
                strPassword = util.decrptyMethod(config.body.ftpUsername, config.body.ftpPassword);
            }
            var strFileName = ftpFilePath.replace(/.*\//g, '');
            var strSrcFilePath = ftpFilePath.replace(strFileName, '');
            if('/' == strSrcFilePath[0]) {
                strSrcFilePath = strSrcFilePath.substring(1);   //FTP路径统一去掉前缀"/",适配不同的FTP服务
            }
            var param = [strIpAddr, nPort, strlogin, strPassword, strSrcFilePath, strFileName];
            var ftpProcess = childProcess.fork(path.join(__dirname,'../lib/process/ftpProcess.js'));
            isUploadingFile = true;
            ftpProcess.on('message', (result) => {
                isUploadingFile = false;
                console.debug_log("FTP child process result: " + JSON.stringify(result));
                ftpProcess.kill('SIGTERM');
                if(result.success) {
                    callback(null, result.data);
                }else {
                    callback(result.error, null);
                }
            });
            ftpProcess.on('close', (code, signal) => {
                isUploadingFile = false;
                console.debug_log("FTP child process closed");
            });
            ftpProcess.send(param);
        }
    }
};

function checkFile (filePath, callback) {
    var fwFilename = filePath.replace(/.*\//g, '');
    systemCli.checkHeaderAndPayloadBySo([tempPath, fwFilename], callback);
};

function untarFile (callback) {
    systemCli.unTarBySo([tempPath, untarFilename, tempPath], callback);
};

function fwUpgrade (callback) {
    systemCli.fwUpgradeBySo(callback);
};


