/**
 * Created by lizhimin on 2017/12/8.
 */
/**
 * Created by lizhimin on 2016/1/7.
 */
'use strict';
const util = require("../lib/util");
const db = util.db;
const cwmOrgC = require("../cwmcontroller/org");
const regCheck = require("../lib/regCheck");
const common = util.common;
const config = util.config;
const cwmOrg = db.cwmOrg;
const cwmModules = db.cwmModules;
const hotapmap = db.cwmHotapmap;
const dbSupplier = db.cwmSuppliers;
const env = (process.env.NODE_ENV) ? process.env.NODE_ENV : "development";
const fs = require("fs");
const sshpk = require('sshpk');
const mailer = require("../lib/mailer");
const QueueC = require('../cwmcontroller/taskQueue');
const async = require('async');
const crypto = require('crypto');
const gridFS = db.cwmFileAPI.gridFS;
const rp = require('request-promise');
const systemCli = require("../lib/util").common.systemCli;
const uuid = require('uuid');

exports.checkOrgName = function (req, res) {
    let name = req.body.name;
    cwmOrgC.findOrgByName(name, (err, data) => {
        if (err || !data) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true})
        }
    })
};

exports.updateCustomized = function (req, res, next) {
    let opeUserId = req.opeUserId;
    if( !regCheck.orgName(req.body.name)
        || [false,true,"true","false"].indexOf(req.body.needCAPTCHA) == -1){
        return res.json({success: false, error: "Request parameter validation failed"}); 
    }
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {
                // upload.uploadCustomizedLogo(req, res, null, (err, logo)=> {
                cwmOrg.updateLogo(req.body.orgId, req.files, (err, logo) => {
                    cwmOrg.updateCustomized(req.body.orgId, {
                        name: req.body.name,
                        needCAPTCHA: req.body.needCAPTCHA,
                        logo: logo
                    }, function (err, data) {
                        if (err) {
                            return res.json({success: false, error: err});
                        } else {
                            return res.json({success: true, data: data});
                        }
                    });
                });
            }
        }
    });

};

function validateFiles(files) {
    if (files.file[0].originalFilename.indexOf('.pem') == -1 || files.file[1].originalFilename.indexOf('.pem') == -1) {
        return 1;
    }
    try{
        let keyBuf = fs.readFileSync(files.file[1].path);
        let certBuf = fs.readFileSync(files.file[0].path);
        let key = sshpk.parsePrivateKey(keyBuf, 'pem');
        let cert = sshpk.parseCertificate(certBuf, 'pem');
        if (!key || !cert) {
            return 2;
        }
        let hashAlgorithm = cert.signatures.x509.signature.hashAlgorithm;
        //console.log("type:" + key.type);
        // console.log("size:" + key.size);
        // console.log("Algorithm:" + hashAlgorithm);
        //如果加载的证书不是DLINK的SSL证书即其他证书，删除以下四个要求。
        let subject = cert.subjects;
        let isDlinkSSL = false;
        if (subject[0] && subject[0].components.length > 0) {
            var components = subject[0].components;
            for (var x = 0; x < components.length; x++) {
                if (components[x].value == "D-Link Corporation") {
                    isDlinkSSL = true;
                    break;
                }
            }
        }

        if (isDlinkSSL) {//如果是dlink才要验证这个条件
            if (hashAlgorithm != "sha256" || key.type != 'rsa' || key.size != 2048) {
                return 2;
            }
        }

        let validFrom = cert.validFrom;
        let validUntil = cert.validUntil;
        if (validFrom && validUntil) {
            let temp = validUntil.getTime() - validFrom.getTime();
            let days = Math.floor(temp / (24 * 3600 * 1000));
            if (isDlinkSSL) {
                if (days == 7300) {
                    if (cert.isSignedByKey(key)) {
                        let sslVersion = cert.fingerprint('md5').toString();
                        return sslVersion;
                    } else {
                        return 2;
                    }
                } else {
                    return 2;
                }
            } else {
                if (cert.isSignedByKey(key)) {
                    let sslVersion = cert.fingerprint('md5').toString();
                    return sslVersion;
                } else {
                    return 2;
                }
            }
        } else {
            return 2;
        }
    }catch(e){
        return 2;
    }
}

exports.uploadCertificate = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {

                var orgId = req.body.orgId;
                let files = req.files;
                let result = validateFiles(files);
                if (result == 1 || result == 2) {
                    return res.json({success: false, error: result});
                }

                cwmOrg.updateSslCertification(orgId, files, function (err, result) {
                    if (!err) {
                        return res.json({success: true});
                    } else {
                        return res.json({success: false, error: err});
                    }
                })
            }
        }
    });

}

exports.updateSMTP = function (req, res, next) {
    let opeUserId = req.opeUserId;
    let smtpServer = req.body.smtpServer;
    if( !regCheck.isSMTPFromName(smtpServer.displayName)
        || !regCheck.isEmail(smtpServer.from)
        || !regCheck.isSMTPHost(smtpServer.host)
        || !regCheck.isSMTPPort(smtpServer.port)
        || [false,true].indexOf(smtpServer.secure) == -1
        || ['SSL','None'].indexOf(smtpServer.secureText) == -1
        || ['UTF-8','ASC-II'].indexOf(smtpServer.encoding) == -1
        || (smtpServer.auth && !regCheck.isEmail(smtpServer.auth.username))
        || (smtpServer.auth && !regCheck.isSMTPAuthPassword(smtpServer.auth.username,smtpServer.auth.password))){
        return res.json({success: false, error: "Request parameter validation failed"}); 
    }
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {
                var orgId = req.body.orgId;
                if (!smtpServer || !orgId) {
                    return res.json({success: false});
                }
                cwmOrg.updateSMTPServer(orgId, smtpServer, function (err, result) {
                    if (!err) {
                        return res.json({success: true});
                    } else {
                        return res.json({success: false, error: 1});
                    }
                })
            }
        }
    });

};
exports.updateConnection = function (req, res, next) {
    let opeUserId = req.opeUserId;
    //按照前端规则过滤传入
    let connection = req.body.connection;
    if(!regCheck.isIpOrWebsite(connection.devAccessAddress) 
        || !regCheck.isIpOrWebsite(connection.webAccessAddress)
        || !regCheck.isPort(connection.devAccessPort)
        || !regCheck.isPort(connection.webAccessPort)){
        return res.json({success: false, error: "Request parameter validation failed"}); 
    }
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {
                var orgId = req.body.orgId;
                if (!connection || !orgId) {
                    return res.json({success: false});
                }
                cwmOrg.updateConnection(orgId, connection, function (err, result) {
                    if (!err) {
                        //备注：这个地方不需要修改配置文件
                        // var result = util.changePort(connection);
                        // if (result) {
                        //     return res.json({success: true});
                        // } else {
                        //     return res.json({success: false, error: 1});
                        // }
                        return res.json({success: true});
                    } else {
                        return res.json({success: false, error: 1});
                    }
                })
            }
        }
    });

};

exports.updateBasic = function (req, res, next) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {
                let orgId = req.body.orgId;
                let basic = req.body.basic;
                if (!basic || !orgId) {
                    return res.json({success: false});
                }
                if([60,120,180,240,300].indexOf(basic.keepAlive) == -1){
                    return res.json({success: false, error: "Request parameter validation failed"});
                }
                cwmOrg.updateBasic(orgId, basic, function (err, result) {
                    if (!err) {
                        //modify by lizhimin
                        //2018/3/31
                        //放错位置了，导致没有生成任务
                        QueueC.addAgentKeepAliveQueue({common: common.taskType.common.changeKeepAlive}, orgId);
                        return res.json({success: true});
                    } else {

                        return res.json({success: false, error: 1});
                    }
                })
            }
        }
    });

};

exports.updateSystemSetting = function (req, res, next) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {
                cwmOrg.updateSystemSetting(req.body, function (err, result) {
                    if (!err) {
                        //备注：这个地方不需要修改配置文件
                        // var connection = {
                        //     devAccessPort: req.body.devAccessPort,
                        //     webAccessPort: req.body.webAccessPort
                        // };
                        // var result = util.changePort(connection);
                        // if (result) {
                        //     return res.json({success: true});
                        // } else {
                        //     return res.json({success: false, error: 1});
                        // }
                        return res.json({success: true});
                    } else {
                        return res.json({success: false, error: 1});
                    }
                })
            }
        }
    });

};
exports.updateChipSystemSetting = function (req, res, next) {
    let opeUserId = req.opeUserId;
    let cliSetting = req.body.cliSetting;
    //按照前端规则过滤传入
    let LAN = cliSetting.LAN;
    if(LAN){
        if( !regCheck.isIpAddress(LAN.ip)
            || regCheck.isMask(LAN.mask) == -1
            || ["dhcp","static"].indexOf(LAN.type) == -1
            || (LAN.changeDAA && [0,1].indexOf(LAN.changeDAA) == -1)
            || (LAN.gateway && !regCheck.isIpAddress(LAN.gateway))
            || (LAN.dns && !regCheck.isIpAddress(LAN.dns))
            || (LAN.secDNS && !regCheck.isIpAddress(LAN.secDNS))
            ){
            return res.json({success: false, error: "Request parameter validation failed"}); 
        }
    }
    let _Date = cliSetting.Date;
    if(_Date){
        if( (_Date.Datetime && !regCheck.isDateFormat(_Date.Datetime))
            || !regCheck.isTimeZone(_Date.Timezone)
            || !regCheck.isIpOrWebsite(cliSetting.defaultNTPServer)
            || (cliSetting.NTP && !regCheck.isIpOrWebsite(cliSetting.NTP))
            || [0,1,2].indexOf(cliSetting.enableNTP) == -1){
            return res.json({success: false, error: "Request parameter validation failed"});
        }
    }
    let Console = cliSetting.Console;
    if(Console){
        if([0,1].indexOf(Console.enable) == -1
           || ["telnet","ssh"].indexOf(Console.protocol) == -1
           || [300,0].indexOf(Console.timeout) == -1){
            return res.json({success: false, error: "Request parameter validation failed"});
        }
    }
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {
                systemCli.SaveConfig(cliSetting, function (err, result1) {
                    if (null == err) {
                        let dbSetting = req.body.dbSetting;
                        if (dbSetting) {

                            cwmOrg.updateChipSystemSetting(dbSetting, function (err, result2) {
                                if (!err) {
                                    return res.json({success: true});
                                } else {
                                    return res.json({success: false, error: 1});
                                }
                            })
                        } else {
                            return res.json({success: true});
                        }

                    } else {
                        return res.json({success: false, error: err});
                    }
                })
            }
        }
    });

};

exports.updatePayment = function (req, res, next) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {

                var orgId = req.body.orgId;
                var payment = req.body.payment;
                if (payment.options) {
                    for (let i = 0; i < payment.options.length; i++) {
                        if (!payment.options[i].hasOwnProperty('_id')) {
                            payment.options[i]._id = uuid.v1();
                        }
                        if(! regCheck.isPayPalOptions(payment.options[i])){
                            return res.json({success: false, error: "Request parameter validation failed"});
                        }
                    }
                }
                if (!payment || !orgId || !payment.APIPassword || !payment.APIUsername) {
                    return res.json({success: false});
                }
                cwmOrg.updatePayment(orgId, payment, function (err, result) {
                    if (!err) {
                        return res.json({success: true});
                    } else {
                        return res.json({success: false, error: err});
                    }
                })
            }
        }
    });

};
exports.testSMTP = function (req, res, next) {
    let smtpServer = req.body.smtpServer;
    let testEmail = req.body.testEmail;
    if (!smtpServer || !testEmail) {
        return res.json({success: false});
    } else {
        //按照前端规则过滤传入
        if( !regCheck.isEmail(testEmail)
            || !regCheck.isSMTPFromName(smtpServer.displayName)
            || !regCheck.isEmail(smtpServer.from)
            || !regCheck.isSMTPHost(smtpServer.host)
            || !regCheck.isSMTPPort(smtpServer.port)
            || [false,true].indexOf(smtpServer.secure) == -1
            || ['SSL','None'].indexOf(smtpServer.secureText) == -1
            || ['UTF-8','ASC-II'].indexOf(smtpServer.encoding) == -1
            || (smtpServer.auth && smtpServer.auth.username && !regCheck.isEmail(smtpServer.auth.username))
            || (smtpServer.auth && smtpServer.auth.username && smtpServer.auth.password && !regCheck.isSMTPAuthPassword(smtpServer.auth.username,smtpServer.auth.password))){
            return res.json({success: false, error: "Request parameter validation failed"}); 
        }
        if (smtpServer.auth.password) {
            smtpServer.auth.password = util.decrptyMethod(smtpServer.auth.username, smtpServer.auth.password);
        }
        let auth = {
            user: smtpServer.auth.username,
            pass: smtpServer.auth.password,
        };
        smtpServer.auth = auth;
    }
    delete smtpServer.secureText;
    console.log(smtpServer);
    mailer.sendTestMail(smtpServer, testEmail, function (err) {
        if (err)
            return res.json({success: false, error: err});
        else {
            return res.json({success: true});
        }
    });
};
exports.listOneOrg = function (req, res, next) {
    cwmOrgC.getOrgsByUserId('', req.body.userId, function (result) {
        return res.json(result);
    });
};
exports.getOrgById = function (req, res, next) {
    var orgId = req.body.orgId;
    var userId = req.body.userId;
    cwmOrgC.getOrgsByUserId(orgId, userId, function (result) {
        return res.json(result);
    });

};
exports.listOrgDetails = function (req, res, next) {
    cwmOrgC.getOrgsDetailByUserId(req.body.userId, function (result) {
        return res.json(result);
    });
};

exports.getNodeEnv = function (req, response) {
    return response.json({success: true, data: env});
}

exports.listModules = function (req, response) {
    db.cwmModules.findAllModules(function (err, result) {
        return response.json(result);
    });
}
exports.getVersion = function (req, response) {
    systemCli.getNCVersionBySo(function (err, result) {
        return response.json({success: true, data: result});
    })
}
exports.UpdateModules = function (req, response) {
    console.log("update url: " + config.supportModuleUrl);
    cwmOrg.findOrg(function (err, orgInfo) {
        let version = '';
        if (orgInfo) {
            version = orgInfo.supportListVersion;
        }
        const options = {
            method: 'GET',
            uri: config.supportModuleUrl,
            json: true
        };
        rp(options)
            .then(function (body) {
                let jsondata = body;
                if (jsondata.version == version) {
                    //不需要更新
                    return response.json({success: false, error: 1});
                } else {

                    //移除旧列表，并保存新的支持列表
                    cwmModules.removeAll((err, result) => {
                        if (!err) {
                            cwmModules.insertMany(jsondata.list, function (err, result) {
                                if (!err) {
                                    //更新支持设备列表的版本
                                    cwmOrg.updateSupportModelsVersion(orgInfo._id, jsondata.version, (err, result) => {
                                    });
                                }
                                //去掉给AS的任务
                                //  QueueC.addUpdateModelListQueue({common: common.taskType.common.updateModelList});
                            });
                        }

                    })
                    return response.json({success: true, data: jsondata.list});
                }
            })
            .catch(function (err) {
                // Crawling failed...
                if(err.error) {
                    return response.json({success: false, error: err.error.code});
                }else {
                    return response.json({success: false, error: err.code});
                }
            });
    });
}
let customerDir = `${process.cwd()}/customer`;
exports.listOrgs = function (req, res) {
    db.cwmOrg.findAll(function (err, result) {
        if (result.length > 0 && result[0].logo) {
            let uploadDir = customerDir + '/logo';
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            gridFS.getLogoFiles((err, results) => {
                if (results && results.length > 0) {
                    let _temp = results[0];
                    let fileName = _temp.filename;
                    gridFS.readFileToLocalById(`${uploadDir}/${fileName}`, result[0].logo, (err) => {
                        result[0].logo = `/customer/logo/${fileName}` + '?' + new Date().getTime();
                        return res.json(result);
                    });
                } else {
                    return res.json(result);
                }

            })

        } else {
            return res.json(result);
        }

    });
}

exports.saveHotApMap = function (req, res, next) {
    let opeUserId = req.opeUserId;
    hotapmap.findMapByName(req.body.mapName, opeUserId, function (err, map) {
        if (map && map._id != req.body._id) {
            return res.json({success: false, error: 1});
        } else {
            let files = req.files;
            var hotApMap = {_id: req.body._id, imagearea: req.body.imagearea, rate: req.body.rate};
            if (!hotApMap._id) {
                hotApMap._id = hotapmap.getObjectId();
            }
            cwmOrg.updateHotAPMap(hotApMap._id, req.files, (err, result) => {
                if (result) {
                    hotApMap.mapPath = result._id.toString();
                }
                hotApMap.mapName = req.body.mapName;
                hotApMap.userId = opeUserId;
                //hotApMap.devices = req.body.devices;
                hotapmap.saveHotAPMap(hotApMap, function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: hotApMap._id});
                    }
                });
            });
        }

    });
}

exports.saveHotApDevices = function (req, res, next) {
    hotapmap.saveHotApDevices(req.body.id, req.body.devices, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    });

}

exports.getAllHotApMaps = function (req, res) {
    let opeUserId = req.opeUserId;
    hotapmap.findMapsByUserId(opeUserId, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            data.sort((a, b) => {
                if (a.mapName == b.mapName) return 0;
                if (a.mapName > b.mapName) return 1;
                if (a.mapName < b.mapName) return -1;
                return 0;
            })
            downloadMaps(data, function (err, data) {
                async.mapSeries(data, (map, callback) => {
                    async.map(map.devices, (device, callback) => {
                        db.cwmDeviceManaged.findNameByDevMac(device.apMACAddr, function (err, d) {
                            if (d) {
                                device.name = d.name;
                                device.location = d.location;
                                device.isDelete = d.isDelete;
                            } else {
                                device.isDelete = true;
                            }
                            callback();
                        });
                    }, function (err) {
                        callback();
                    });
                }, function () {
                    return res.json({success: true, data: data});
                });
            });

        }
    });
}

function downloadMaps(data, callback) {
    async.mapSeries(data, (map, callback) => {
        if (map.mapPath) {
            let uploadDir = customerDir + '/hotApMaps';
            if (!fs.existsSync(customerDir)) {
                fs.mkdirSync(customerDir);
            }
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }
            gridFS.getHotApMapFile(map.mapPath, (err, results) => {
                if (results && results.length > 0) {
                    let _temp = results[0];
                    let fileName = _temp.filename;
                    gridFS.readFileToLocalById(`${uploadDir}/${fileName}`, map.mapPath, (err) => {
                        map.mapPath = `/customer/hotApMaps/${fileName}`;
                        callback(null);
                    });
                } else {
                    callback(null);
                }

            })

        } else {
            callback(null);
        }

    }, function (err) {
        callback(err, data);
    });
}

exports.delHotAPMap = function (req, res) {
    hotapmap.findById(req.body.mapId, function (err, map) {
        if (map && map.mapPath) {
            if (fs.existsSync("." + map.mapPath)) {
                fs.unlinkSync("." + map.mapPath);
            }
            gridFS.deleteFiles(map.mapPath, function () {
            });
        }
        hotapmap.removeById(req.body.mapId, function (err, data) {
            if (err) {
                return res.json({success: false, error: err});
            } else {
                return res.json({success: true, data: data});
            }
        });
    })

}
exports.getRestAPIKey = function (req, res) {
    let orgId = req.body.orgId;
    cwmOrg.getRestAPIKey(orgId, function (err, result) {
        if (!err && result) {
            return res.json({success: true, data: result.restAPIKey});
        } else {
            return res.json({success: false, error: 1});
        }
    })
}
exports.generateRestAPIKey = function (req, res) {
    let orgId = req.body.orgId;
    let restAPIKey = "";
    let chars = "abcdefghijklmnopqrstuvwxyz1234567890";
    let length = 8;
    let randomcode = '';
    for (var i = 0; i < length; i++) {
        randomcode += chars[parseInt(Math.random() * 1000) % chars.length];
    }
    let sha = crypto.createHash('sha256');
    sha.update(randomcode, 'utf8');
    restAPIKey = sha.digest("base64");
    cwmOrg.generateRestAPIKey(orgId, restAPIKey, function (err, result) {
        if (!err) {
            return res.json({success: true, data: restAPIKey});
        } else {
            return res.json({success: false, error: 1});
        }
    })
}

exports.saveSupplier = function (req, res) {

    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {
                var supplier = req.body;
                dbSupplier.findSupplier(supplier, function (err, data) {
                    if (data && (!supplier._id || supplier._id != data._id)) {
                        return res.json({success: false, error: 1});
                    } else {
                        if (!supplier._id) {
                            supplier._id = dbSupplier.getObjectId();
                        }
                        dbSupplier.saveSupplier(supplier, function (err, data) {
                            if (err) {
                                return res.json({success: false, error: err});
                            } else {
                                return res.json({success: true, data: supplier._id});
                            }
                        });
                    }
                })
            }
        }
    });

}

exports.listSuppliers = function (req, res) {
    dbSupplier.findAll(function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
}

exports.delSupplier = function (req, res) {
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {

                dbSupplier.removeById(req.body.supplierId, function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                });
            }
        }
    });

}
