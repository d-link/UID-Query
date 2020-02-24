/**
 * Created by lizhimin on 2018/9/19.
 */
'use strict';
const express = require('express');
const router = express.Router();
const async = require('async');
const db = require("../lib/util").db;
const common = require("../lib/util").common;
const cwmNetwork = db.cwmNetwork;
const cwmDevice = db.cwmDeviceManaged;
const cwmOrg = db.cwmOrg;
const cwmClient = db.cwmClientHistory;
const cwmSuppliers = db.cwmSuppliers;
const cwmProfile = db.cwmConfigProfile;
const QueueC = require("../cwmcontroller/taskQueue");
const moment = require('moment');
//const DeviceC = require("../cwmcontroller/device");
const env = process.env.NODE_ENV || "development";
function verfyHeader(req, res, callback) {
    if (env == "Production_hualian") {
        let auth = req.headers.authorization;
        console.log("auth:" + auth);
        if (auth) {
            let part = auth.split(' ');
            let token = "";
            if (part.length == 2 && part[0] == "Token") {
                token = part[1].replace(/(^\s*)|(\s*$)/g, "");
            }
            console.log("token:" + token);
            if (token) {
                cwmOrg.getRestAPIKey(null, (err, result)=> {
                    if (result && result.restAPIKey && result.restAPIKey == token) {
                        callback(true);
                    } else {
                        callback(false);
                        return res.sendStatus(401);
                    }
                })
            } else {
                callback(false);
                return res.sendStatus(401);
            }
        } else {
            callback(false);
            return res.sendStatus(401);
        }

    } else {
        return res.sendStatus(404);
    }

}
router.get('/getAllSchoolItems', function (req, res) {
    verfyHeader(req, res, (result)=> {
        if (result) {
            cwmNetwork.findAllSchoolItems((err, data)=> {
                async.map(data, function (network, callback) {
                    cwmDevice.findByNetworkId(network._id, function (err, devices) {
                        if (err) {
                            callback(err, network);
                        } else {
                            network.networkName = network.name;
                            network.apCount = devices.length;
                            let devMACS = [];
                            for (let dev of devices) {
                                devMACS.push(dev.mac);
                            }
                            let clients = 0;
                            cwmClient.getClientCountByAPMACs(network.agentUUID, devMACS, (err, result)=> {
                                if (!err) {
                                    clients = result;
                                }
                                network.clientCount = clients;
                                delete network._id;
                                delete network.agentUUID;
                                delete network.name;
                                callback(err, network);
                            })
                        }

                    })
                }, function (err, rs) {
                    if (!err) {
                        return res.json({success: true, data: rs});
                    }
                    return res.json({success: false, error: err});
                });
            })

        }
    })
});
router.get('/getAPInfobySchoolId', function (req, res) {
    verfyHeader(req, res, (result)=> {
        if (result) {
            let params = req.query;
            let schoolId = params.schoolId;
            cwmNetwork.findNetworkBySchoolId(schoolId, (err, data)=> {
                if (!err) {
                    let redata = {schoolId: schoolId, info: []};
                    if (data) {
                        cwmDevice.findByNetworkId(data._id, (err, devices)=> {
                            async.map(devices, (dev, callback)=> {
                                if(dev._doc){
                                    dev=dev.toObject();
                                }
                                let info = {
                                    apMAC: dev.mac,
                                    ipAddr: dev.ip,
                                    modelName: dev.moduleType,
                                    apName: dev.name,
                                    location: dev.location,
                                    supplierId:"",
                                    status:dev.status=='offline'?0:1,
                                    firmware:dev.firmware,
                                    channel24Ghz:dev.channel24Ghz,
                                    channel5Ghz:dev.channel5Ghz,
                                    power24Ghz:dev.power24Ghz,
                                    power5Ghz:dev.power5Ghz,
                                    upTime:dev.upTime,
                                    wlan:[]
                                };
                                if(dev.wlan){
                                    info.wlan=dev.wlan;
                                }
                                if(dev.supplierId){
                                   info.supplierId= dev.supplierId;
                                }
                                callback(null, info);
                            }, function (err, rs) {
                                if (!err) {
                                    redata.info = rs;
                                    return res.json({success: true, data: redata});
                                } else {
                                    return res.json({success: false, error: err});
                                }
                            })
                        })
                    } else {
                        return res.json({success: true, data: redata});
                    }
                } else {
                    return res.json({success: false, error: err});
                }
            })
        }
    });
});
router.get('/getClientCountBySchoolId', function (req, res) {
    verfyHeader(req, res, (result)=> {
        if (result) {
            let params = req.query;
            let schoolId = params.schoolId;
            cwmNetwork.findNetworkBySchoolId(schoolId, (err, data)=> {
                let clientInfos = {schoolId: schoolId, clientCount: 0};
                if (!err) {
                    if (data) {
                        cwmClient.getClientsByNetworkId(data._id, (err, clients)=> {
                            if (!err) {
                                clientInfos.clientCount = clients.length;
                                return res.json({success: true, data: clientInfos});
                            } else {
                                return res.json({success: false, error: err});
                            }

                        })
                    } else {
                        return res.json({success: true, data: clientInfos});
                    }

                } else {
                    return res.json({success: false, error: err});
                }
            });
        }
    });
});
router.get('/GetAPAndClientCountBySchoolId', function (req, res) {
    verfyHeader(req, res, (result)=> {
        if (result) {
            let params = req.query;
            let schoolId = params.schoolId;
            cwmNetwork.findNetworkBySchoolId(schoolId, (err, data)=> {
                if (!err) {
                    let redata = {schoolId: schoolId, info: []};
                    if (data) {
                        cwmDevice.findByNetworkId(data._id, (err, devices)=> {
                            async.map(devices, (dev, callback)=> {
                                let info = {
                                    apMAC: dev.mac,
                                    clientCount: 0
                                };
                                if (dev.status == 'online') {
                                    cwmClient.getClientCountByAPMAC(dev.uuid, dev.mac, (err, result)=> {
                                        if (!err) {
                                            info.clientCount = result;
                                        }
                                        callback(err, info);
                                    })
                                } else {
                                    callback(err, info);
                                }
                            }, function (err, rs) {
                                if (!err) {
                                    redata.info = rs;
                                    return res.json({success: true, data: redata});
                                } else {
                                    return res.json({success: false, error: err});
                                }
                            })
                        })
                    } else {
                        return res.json({success: true, data: redata});
                    }
                } else {
                    return res.json({success: false, error: err});
                }
            })
        }
    });
});
router.get('/GetClientCountByAPMAC', function (req, res) {
    verfyHeader(req, res, (result)=> {
        if (result) {
            let params = req.query;
            let apMAC = params.apMAC;
            let data = {
                apMAC: apMAC,
                clientCount: 0
            };
            cwmDevice.findDevInfoByMac(apMAC, (err, device)=> {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    if (device && device.status == 'online') {
                        cwmClient.getClientCountByAPMAC(device.uuid, device.mac, (err, result)=> {
                            if (!err) {
                                data.clientCount = result;
                            }
                            return res.json({success: true, data: data});
                        })
                    } else {
                        return res.json({success: true, data: data});
                    }
                }

            })
        }
    });
});
router.get('/GetTotalClientCount', function (req, res) {
    verfyHeader(req, res, (result)=> {
        if (result) {
            let data = {clientCount: 0};
            cwmClient.getClientsCountByRule(null, (err, result)=> {
                if (err) {
                    return res.json({success: false, error: err});
                } else {
                    data.clientCount = result;
                    return res.json({success: true, data: data});
                }
            })
        }
    });
});
router.get('/GetClientInfoBySchoolId', function (req, res) {
    verfyHeader(req, res, (result)=> {
        if (result) {
            let params = req.query;
            let schoolId = params.schoolId;
            cwmNetwork.findNetworkBySchoolId(schoolId, (err, data)=> {
                if (!err) {
                    let redata = {schoolId: schoolId, info: []};
                    if (data) {
                        cwmDevice.findByNetworkId(data._id, (err, devices)=> {
                            async.map(devices, (dev, callback)=> {
                                let info = {
                                    apMAC: dev.mac,
                                    clientInfo: []
                                };
                                if (dev.status == 'online') {
                                    cwmClient.getClientInfosByAPMAC(dev.mac, (err, clients)=> {
                                        if (!err) {
                                            for (let client of clients) {
                                                let temp = {
                                                    clientMACAddr: client.clientMACAddr,
                                                    clientIPAddr: client.ipv4Addr,
                                                    band: client.band,
                                                    authType:client.authType,
                                                    ssid:client.ssid
                                                };
                                                info.clientInfo.push(temp);
                                            }
                                        }
                                        callback(err, info);
                                    })
                                } else {
                                    callback(err, info);
                                }
                            }, function (err, rs) {
                                if (!err) {
                                    redata.info = rs;
                                    return res.json({success: true, data: redata});
                                } else {
                                    return res.json({success: false, error: err});
                                }
                            })
                        })
                    } else {
                        return res.json({success: true, data: redata});
                    }
                } else {
                    return res.json({success: false, error: err});
                }
            })
        }
    });
});
router.get('/GetAllSuppliers', function (req, res) {
    verfyHeader(req, res, (result)=> {
        if (result) {
            cwmSuppliers.findAllSupplier((err, data)=> {
                if (!err) {

                    return res.json({success: true, data: data});
                } else {
                    return res.json({success: false, error: err});
                }
            })
        }
    });
});
router.get('/GetSSID4SecurityBySchoolId', function (req, res) {
    verfyHeader(req, res, (result)=> {
        if (result) {
            let params = req.query;
            let schoolId = params.schoolId;
            cwmNetwork.findNetworkBySchoolId(schoolId, (err, data)=> {
                if (data) {
                    cwmProfile.getProfileByUUIDForRestAPI(data.agentUUID, (err, data)=> {
                        if (!err) {
                            let ssidTemp = [];
                            let authenticates=[4,6,8,104,106,108];
                            if (data && data.contents.ssid.list) {
                                for (let ssid of data.contents.ssid.list) {
                                    if (ssid.ssidIndex == 5 && (authenticates.contains(ssid.authentication ))) {
                                        let temp = {band: ssid.band, ssid: ssid.ssid, passphrase: ssid.passPhrase};
                                        ssidTemp.push(temp);
                                    }
                                }
                            }

                            return res.json({success: true, data: ssidTemp});
                        } else {
                            return res.json({success: false, error: err});
                        }
                    })
                } else {
                    return res.json({success: false, error: err});
                }

            });
        }
    });
})
router.post('/SetSSID4SecurityBySchoolId', function (req, res) {
    verfyHeader(req, res, (result)=> {
        if (result) {
            let schoolId = req.body.schoolId;
            let passphrase = req.body.passphrase;
            cwmNetwork.findNetworkBySchoolId(schoolId, (err, data)=> {
                if (data) {
                    cwmProfile.setProfileSecurityForRestAPI(data.agentUUID, passphrase, (err, data)=> {
                        if (!err) {
                            return res.json({success: true,data:"Set success"});
                        } else {
                            return res.json({success: false, error: err});
                        }
                    })
                } else {
                    return res.json({success: false, error: err});
                }
            });
        }
    });
})
router.get('/ApplyNetworkProfile', function (req, res) {
    verfyHeader(req, res, (result)=> {
        if (result) {
            let params = req.query;
            let schoolId = params.schoolId;
            cwmNetwork.findNetworkBySchoolId(schoolId, (err, data)=> {
                if (data) {
                    cwmProfile.ApplyNetworkProfileImmediate(data.agentUUID, function (err, data) {

                        if (!err && data) {

                            //放入taskQueue
                            let start = moment();
                            QueueC.addAgentTaskQueue({config: common.taskType.config.profile}, data._id.toString(), data.uuid, start);
                            return res.json({success: true,data:"Apply success"});
                        }else{
                            return res.json({success: false, error: err});
                        }
                    })
                }

            });
        }
    });

})
router.get('/GetAPCountBySchoolId', function (req, res) {
    verfyHeader(req, res, (result)=> {
        if (result) {
            let params = req.query;
            let schoolId = params.schoolId;
            cwmNetwork.findNetworkBySchoolId(schoolId, (err, data)=> {
                if (!err) {
                    let redata = {apCount:0,onlineCount:0,info:[]};
                    if (data) {
                        cwmDevice.findByNetworkId(data._id, (err, devices)=> {
                            async.map(devices, (dev, callback)=> {
                                let info = {
                                    apMAC: dev.mac,
                                    ipAddr: dev.ip,
                                    status:dev.status=='offline'?0:1
                                };
                                if(dev.status!='offline'){
                                    redata.onlineCount+=1;
                                }
                                redata.apCount+=1;
                                redata.info.push(info);
                                callback(null, info);
                            }, function (err, rs) {
                                if (!err) {

                                    return res.json({success: true, data: redata});
                                } else {
                                    return res.json({success: false, error: err});
                                }
                            })
                        })
                    } else {
                        return res.json({success: true, data: redata});
                    }
                } else {
                    return res.json({success: false, error: err});
                }
            })
        }
    });
})
router.get('/GetTotalAPCount', function (req, res) {
    verfyHeader(req, res, (result)=> {
        if (result) {
            let redata = {apCount:0,onlineCount:0};
            cwmDevice.findAll((err, devices)=> {
                async.map(devices, (dev, callback)=> {
                    if(dev.status!='offline'){
                        redata.onlineCount+=1;
                    }
                    redata.apCount+=1;
                    callback(null, redata);
                }, function (err, rs) {
                    if (!err) {
                        return res.json({success: true, data: redata});
                    } else {
                        return res.json({success: false, error: err});
                    }
                })
            })
        }
    });
})
module.exports = router;