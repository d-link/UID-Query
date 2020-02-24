/**
 * Created by lizhimin on 2016/3/22.
 */
'use strict';
const async = require('async');
const fs = require('fs');
const db = require("../lib/util").db;
const common = require("../lib/util").common;
const Network = db.cwmNetwork;
const Device = db.cwmDeviceManaged;
const Site = db.cwmSite;
const Org = db.cwmOrg;
const cwmClient = db.cwmClientHistory;
const QueueC = require("./taskQueue");
const DeviceC = require("./device");
const profile = db.cwmConfigProfile;
const moment = require('moment');

exports.createNetwork = function (network, callback) {
    Network.save(network, function (err, data) {
        if (err) {
            callback({success: false, error: err});
        } else {

            //创建Network时，如果添加了AGUUID，需要创建config并加入任务队列，同时创建状态主子表
            if (data.agentUUID && data.agentUUID != '') {
                profile.createAGProfile(data.orgId, data._id, data.agentUUID, (err, result)=> {
                    QueueC.addAgentQueue({common: common.taskType.common.createAGuuid}, data.agentUUID);
                })
            }

            callback({success: true, data: data});
        }
    });
};
exports.listNetworks = function (orgId, opeUser, callback) {
    let sites = [];
    Org.findOrgById(orgId, (err, org)=> {
        Network.findByOrgId(orgId, function (err, data) {
            if (err) {
                callback({success: false, error: err});
            } else {
                if (data.length == 0) {
                    callback({success: true, data: []});
                } else {
                    if (opeUser.role == "root admin" || opeUser.role == "root user") {
                    } else {
                        data = data.filter(function (value) {
                            return opeUser.privilege.find(t=>t == value._id);
                        });
                    }
                    async.map(data, function (network, callback) {
                        if (sites.indexOf(network.site) == -1) {
                            sites.push(network.site);
                        }
                        Device.findByNetworkId(network._id, function (err, devices) {
                            if (err) {
                                callback(err, network);
                            } else {
                                network.allDevs = devices.length;
                                let onlineDevs = 0;
                                let clients = 0;
                                let devMACS = [];
                                async.map(devices, (dev, callback)=> {
                                    if (dev.status != common.userStatus.offline && dev.isDelete == false) {
                                        //test for cs
                                        if (DeviceC.changeDeviceStatus(dev, org.keepAlive)) {
                                            callback(err, dev);
                                        } else {
                                            onlineDevs++;
                                            devMACS.push(dev.mac);
                                            callback(err, dev);
                                        }
                                    } else {
                                        callback(err, dev);
                                    }

                                }, function (err, rs) {
                                    network.clients = clients;
                                    network.onlineDevs = onlineDevs;
                                    cwmClient.getClientCountByAPMACs(network.agentUUID, devMACS, (err, result)=> {
                                        if (!err) {
                                            clients = result;
                                        }
                                        network.clients = clients;
                                        callback(err, network);
                                    })

                                })
                            }

                        })
                    }, function (err, rs) {
                        if (!err) {
                            if (rs.length > 0) {
                                callback({success: true, data: data, sites: sites});
                            } else {
                                callback({success: false, error: 1})
                            }
                        }
                        else callback({success: false, error: 1});
                    });
                }
            }
        })
    });
}

//还需定义接口传出的数据格式
exports.listShortNetworks = function (orgId, callback) {
    Network.getSiteAndNetworkByOrg(orgId, (err, result) => {
        if (err) {
            callback({success: false, error: err});
        } else {
            if (result) {
                for (let p of result) {
                    p.siteName = p._id;
                }
            }
            callback({success: true, data: result});
            /*      async.map(result, (site, cb)=> {
             async.map(site.networks, (net, cb)=> {
             Device.getCountByNetworkId(net._id, function (err, count) {
             net.devCount = count;
             cb(err, net);
             })
             }, (err, rs)=> {
             cb(err, rs);
             })
             }, (err, rs)=> {
             if (!err) callback({success: true, data: result});
             else callback({success: false, error: err});
             });*/

        }
    })
};

exports.deleteNetwork = function (networkId, uuid, callback) {

    Device.deleteDevByNetworkId(networkId, function (err, data) {
        if (err) {
            callback(err,data);
        } else {
            Network.removeById(networkId, function (err, data) {
                profile.deleteProfileByUUID(uuid, (err, result)=> {
                    QueueC.addAgentQueue({common: common.taskType.common.removeUUID}, uuid);
                })
               callback(err,data);


            });
        }
    })
};


//导出AG profle文件
exports.exportAgentUUID = function (networkId, uuid, callback) {
    Network.findById(networkId, function (err, data) {
        if (err || !data) {
            callback(err, null);
        } else {
            Org.findOrgById(data.orgId, (err, result)=> {
                if (!err && result) {
                    let alias = data.name;
                    let exportInfo = {
                        AgentGroupUUID: uuid,
                        NmsURL: result.devAccessAddress + ":" + result.devAccessPort,
                        PeriodicMsgInterval: result.keepAlive
                    };
                    callback(err, {alias: alias, exportInfo: exportInfo});
                } else {
                    callback(err, null);
                }

            })

        }
    })
};

exports.getSiteAndNetworkByOrg = function (orgId, callback) {
    Network.getSiteAndNetworkByOrg(orgId, (err, result) => {
        if (result) {
            for (let p of result) {
                p.siteName = p._id;
            }
        }
        callback(err, result);
    })
};
exports.getSiteAndNetwork = function (callback) {
    Network.getSiteAndNetwork((err, result) => {
        if (result) {
            for (let p of result) {
                p.siteName = p._id;
            }
        }
        callback(err, result);
    })
};

exports.getUsersNetworkIds = function (param, opeUserId, callback) {
    let filterRight = function (opeUserId, networkIds, callback) {
        db.User.getUserRoleById(opeUserId, function (err, opeUser) {
            if (err) {
                callback(networkIds);
            } else {
                if (opeUser.role == "root admin" || opeUser.role == "root user") {
                    callback(networkIds);
                } else {
                    networkIds = networkIds.filter(function (value) {
                        return opeUser.privilege.find(t=>t == value);
                    });
                    callback(networkIds);
                }
            }
        })
    }
    let orgId = param.orgId;
    let rights = [];
    if (param.networkId != "ALL") {
        rights.push(param.networkId);
        filterRight(opeUserId, rights, callback);
    } else if (param.siteId != "ALL") {
        Network.findBySiteId(param.orgId, param.siteId, (err, datas)=> {
            if(err){
                callback(rights);
            }else{
                for (let net of datas) {
                    rights.push(net._id.toString());
                }
                filterRight(opeUserId, rights, callback);
            }
        });
    } else {
        Network.findByOrgId(orgId, function (err, datas) {
            if(err){
                callback(rights);
            }else{
                for (let net of datas) {
                    rights.push(net._id.toString());
                }
                filterRight(opeUserId, rights, callback);
            }
        });
    }
};
