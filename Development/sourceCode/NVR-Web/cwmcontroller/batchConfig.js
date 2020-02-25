/**********************************************
 * this file is part of DView8 Common Project
 * Copyright (C)2015-2020 D-Link Corp.
 *
 * Author       : HuiMiaomiao
 * Mail         : Miaomiao.Hui@cn.dlink.com
 * Create Date  : 2017/5/23
 * Summary      :
 *
 **********************************************/
'use strict';
const util = require("../lib/util");
const sshpk = require('sshpk');
const db = util.db;
const moment = require('moment');
const Network = db.cwmNetwork;
const async = require('async');
const Device = db.cwmDeviceManaged;
const ConfigProfile = db.cwmConfigProfile;
const history = db.cwmConfigProfileHistory;
const ConfigOperate = db.cwmConfigOperate;
const DeviceLog = db.cwmDeviceLog;
const cwmCounter = db.cwmCounter;
const QueueC = require("../cwmcontroller/taskQueue");
const common = util.common;
const multiparty = require('multiparty');
const fs = require('fs');
const gridFS = db.cwmFileAPI.gridFS;
const path = require('path');
const tar = require('tar-fs');
let customerDir = `/userdata/config/customer`;

//获取profile页面左侧的树

//[{siteName:''},networks:[{}]]
function getProfileTree(orgId, opeUserId, callback) {
    getNetworkInfo(orgId, opeUserId, (err, sites) => {
        async.map(sites, (site, cb) => {
            site.siteName = site.site;
            async.map(site.networks, (net, cb) => {
                ConfigProfile.findProfileByNetworkId(orgId, net._id, net.agentUUID, function (err, profiles) {
                    if (err) {
                        cb(err)
                    } else {
                        if (profiles) {
                            let apply = moment(profiles.applyTime);
                            let modifytime = moment(profiles.modifyTime);
                            if (modifytime.isAfter(apply)) {
                                net.isModifyed = true;
                            } else {
                                net.isModifyed = false;
                            }
                            net.applyTime = profiles.applyTime;
                            net.modifyTime = profiles.modifyTime;
                        }
                        cb(null, net);
                    }
                });
            }, function (err, rs) {
                if (err) {
                    cb(err);
                } else {
                    site.networks = rs;
                    cb(err, site);
                }
            });

        }, function (err, rs) {
            if (err) {
                callback(err);
            } else {
                callback(null, rs);
            }
        });
    })
}

function getNetworkInfo(orgId, opeUserId, callback) {
    Network.getSiteAndNetworkByOrg(orgId, (err, sites) => {
        async.map(sites, (site, cb) => {
            site.siteName = site._id;
            db.User.getUserRoleById(opeUserId, function (err, opeUser) {
                if (!err && opeUser) {
                    if (opeUser.role == "root admin" || opeUser.role == "root user") {
                    } else {
                        site.networks = site.networks.filter(function (value) {
                            return opeUser.privilege.find(t => t == value._id);
                        });
                    }
                    cb(err, site);
                } else {
                    cb(err, site);
                }
            })

        }, function (err, rs) {
            if (err) {
                callback(err);
            } else {
                rs = rs.filter(function (item) {
                    return item.networks.length > 0;
                });
                callback(null, rs);
            }
        });
    });
}

function getFWTree(orgId, opeUserId, callback) {
    getNetworkInfo(orgId, opeUserId, (err, sites) => {
        async.map(sites, (site, cb) => {
            site.siteName = site.site;
            async.map(site.networks, (net, cb) => {
                ConfigOperate.findOperationsByNetwork(net._id, 'fwUpgrade', function (err, profiles) {
                    if (err) {
                        cb(err)
                    } else {
                        if (profiles && profiles.length > 0) {
                            let apply = moment(profiles[0].applyTime);
                            let modifytime = moment(profiles[0].modifyTime);
                            if (modifytime.isAfter(apply)) {
                                net.isModifyed = true;
                            } else {
                                net.isModifyed = false;
                            }
                            net.applyTime = profiles[0].applyTime;
                            net.modifyTime = profiles[0].modifyTime;
                        }
                        cb(null, net);
                    }
                });
            }, function (err, rs) {
                if (err) {
                    cb(err);
                } else {
                    site.networks = rs;
                    cb(err, site);
                }
            });
        }, function (err, rs) {
            if (err) {
                callback(err);
            } else {
                callback(null, rs);
            }
        });
    });
}

function changeExecuteTime(mytime) {
    var copyTime = mytime,
        hour = copyTime.getHours(),
        minute = copyTime.getMinutes(),
        second = copyTime.getSeconds(),
        amPm = 'AM';

    function timeShowFormat(num) {
        return num >= 0 && num < 10 ? '0' + num : num;
    };
    if ((hour == 12 && (minute > 0 || second > 0)) || hour > 12) {
        amPm = 'PM';
        hour -= 12;

    }
    ;
    if (hour == 0) hour = 12;
    hour = timeShowFormat(hour);
    minute = timeShowFormat(minute);
    second = timeShowFormat(second);
    return hour + ':' + minute + ':' + second + ' ' + amPm;
}

function getProfileByNetwork(orgId, networkId, callback) {
    Network.findById(networkId, (err, net) => {
        if (net) {
            ConfigProfile.findProfileByNetworkId(orgId, networkId, net.agentUUID, function (err, profiles) {
                if (err) {
                    callback(err);
                } else {
                    if (profiles) {
                        callback(err, initDefaultValue(profiles));
                    }
                }
            })
        } else {
            callback(err);
        }

    })

}

function initDefaultValue(profile) {
    let bandlist = ['band24', 'band5', 'secBand5'];
    if (profile.contents.bandwidthOpt) {
        if (profile.contents.bandwidthOpt.downlinkBW === undefined) {
            profile.contents.bandwidthOpt.downlinkBW = 80;
        }
        if (profile.contents.bandwidthOpt.uplinkBW === undefined) {
            profile.contents.bandwidthOpt.uplinkBW = 80;
        }
    }
    if (profile.contents.performance) {
        let performanceTag = [0, 0, 0];
        for (let ssid of profile.contents.ssid.list) {
            if (ssid.band == 1 && (ssid.authentication == 10||ssid.authentication == 110) && profile.contents.performance.band24 && profile.contents.performance.band24.wirelessMode == 3) {
                performanceTag[0] = 1;
            }
            if (ssid.band == 2 && (ssid.authentication == 10||ssid.authentication == 110) && profile.contents.performance.band5 && profile.contents.performance.band5.wirelessMode == 6) {
                performanceTag[1] = 1;
            }
            if (ssid.band == 3 && (ssid.authentication == 10||ssid.authentication == 110) && profile.contents.performance.secBand5 && profile.contents.performance.secBand5.wirelessMode == 6) {
                performanceTag[2] = 1;
            }
        }
        for (let band of bandlist) {
            if (profile.contents.performance[band]) {
                if (profile.contents.performance[band].dataRate === undefined) profile.contents.performance[band].dataRate = 'Best';
                if (profile.contents.performance[band].wmm === undefined) {
                    if (band == 'band24') {
                        if (profile.contents.performance[band].wirelessMode != 2) {
                            profile.contents.performance[band].wmm = 1;
                        } else {
                            profile.contents.performance[band].wmm = 0;
                        }
                        if (performanceTag[0]) profile.contents.performance[band].wirelessMode = 1;
                    } else {
                        if (profile.contents.performance[band].wirelessMode != 6) {
                            profile.contents.performance[band].wmm = 1;
                        } else {
                            profile.contents.performance[band].wmm = 0;
                        }
                        if (band == 'band5') {
                            if (performanceTag[1]) profile.contents.performance[band].wirelessMode = 4;
                        }
                        if (band == 'secBand5') {
                            if (performanceTag[2]) profile.contents.performance[band].wirelessMode = 4;
                        }
                    }

                }
            } else {
                if (band == 'secBand5') {
                    profile.contents.performance[band] = ConfigProfile.getDefaultProfile.performance[band];
                }
            }
        }
        if (!profile.contents.performance.lan) {
            profile.contents.performance.lan = {stp: 0};
        }
    }
    if (profile.contents.wlanPartition) {
        if (!profile.contents.wlanPartition.secBand5) {
            profile.contents.wlanPartition.secBand5 = ConfigProfile.getDefaultProfile.wlanPartition.secBand5;
        }
    }
    if (profile.contents.wirelessResource) {
        for (let band of bandlist) {
            if (!profile.contents.wirelessResource[band]) {
                if (band == 'secBand5') {
                    profile.contents.wirelessResource.secBand5 = ConfigProfile.getDefaultProfile.wirelessResource.secBand5;
                }
            }
            if (profile.contents.wirelessResource[band]) {
                if (profile.contents.wirelessResource[band].aclRssiThreshod === undefined) profile.contents.wirelessResource[band].aclRssiThreshod = 10;
                if (profile.contents.wirelessResource[band].rssiThreshod === undefined) profile.contents.wirelessResource[band].rssiThreshod = 10;
                if (profile.contents.wirelessResource[band].dataRateThreshod === undefined) profile.contents.wirelessResource[band].dataRateThreshod = 6;
                if (profile.contents.wirelessResource[band].userLimit === undefined) profile.contents.wirelessResource[band].userLimit = 20;
                if (profile.contents.wirelessResource[band]['preferred11n'] === undefined) profile.contents.wirelessResource[band]['preferred11n'] = 1;
                if (profile.contents.wirelessResource[band].networkUtilization === undefined) profile.contents.wirelessResource[band].networkUtilization = 100;
            }

        }
    }
    return profile;
}

//更新VLAN-PVID信息
function updatePvid(profileId, pvid, callback) {
    getParseInt(pvid, ['mgmt', 'lan1', 'lan2', 'primary24g', 'ssid24g1', 'ssid24g2', 'ssid24g3', 'ssid24g4', 'ssid24g5', 'ssid24g6', 'ssid24g7',
        'primary5g', 'ssid5g1', 'ssid5g2', 'ssid5g3', 'ssid5g4', 'ssid5g5', 'ssid5g6', 'ssid5g7', 'primarySec5g', 'ssidSec5g1', 'ssidSec5g2', 'ssidSec5g3', 'ssidSec5g4', 'ssidSec5g5', 'ssidSec5g6', 'ssidSec5g7']);
    ConfigProfile.findById(profileId, (err, result) => {
        if (result) {
            if (result.contents.hasOwnProperty('vlan')) {
                let vlan = result.contents.vlan;
                let subCfgID = vlan.subCfgID;
                delete vlan.subCfgID;
                if (isObjectValueEqual(vlan.pvid, pvid)) {
                    callback(null, pvid);
                } else {
                    vlan.subCfgID = subCfgID + 1;
                    if (pvid.autoAssignStatus == 0) {
                        vlan.pvid = pvid;
                    } else {
                        vlan.pvid.autoAssignStatus = pvid.autoAssignStatus;
                    }
                    ConfigProfile.updateVLANProfile(profileId, vlan, (err, data) => {
                        if (err) {
                            callback(err);
                        } else {
                            //  addProfileTaskQueue(result);
                            callback(null, data);
                        }
                    })
                }

            } else {
                let vlan = {};
                vlan.subCfgID = 1;
                vlan.pvid = pvid;
                ConfigProfile.updateVLANProfile(profileId, vlan, (err, data) => {
                    if (err) {
                        callback(err);
                    } else {
                        //  addProfileTaskQueue(result);
                        callback(null, data);
                    }
                })
            }
        } else {
            callback(err);
        }
    })
}

//更新VLAN-Status状态信息
function updateVlanStatus(profileId, status, callback) {
    ConfigProfile.findById(profileId, (err, result) => {
        if (result) {
            if (result.contents.hasOwnProperty('vlan')) {
                let vlan = result.contents.vlan;
                if (vlan.status == status) {
                    callback(null, status);
                } else {
                    vlan.status = status;
                    let subCfgID = vlan.subCfgID + 1;
                    vlan.subCfgID = subCfgID;
                    ConfigProfile.updateVLANProfile(profileId, vlan, (err, data) => {
                        if (err) {
                            callback(err);
                        } else {
                            // addProfileTaskQueue(result);
                            callback(null, data);
                        }
                    })
                }
            } else {
                let vlan = {status: status};
                vlan.subCfgID = 1;
                ConfigProfile.updateVLANProfile(profileId, vlan, (err, data) => {
                    if (err) {
                        callback(err);
                    } else {
                        // addProfileTaskQueue(result);
                        callback(null, data);
                    }
                })
            }
        } else {
            callback(err);
        }
    })
}

function getLastVID(vlanlist, index) {
    var len = vlanlist.length;
    var pvid = '1';
    for (var i = 0; i < len; i++) {
        var temp = vlanlist[i][index] - 0;
        if (temp == 2) {
            pvid = vlanlist[i].vid;
        }
    }
    return pvid;
}

//更新VLAN-列表信息
function updateVlanList(profileId, vlan, callback) {
    getParseInt(vlan, ['mgmt', 'lan1', 'lan2', 'primary24g', 'ssid24g1', 'ssid24g2', 'ssid24g3', 'ssid24g4', 'ssid24g5', 'ssid24g6', 'ssid24g7',
        'primary5g', 'ssid5g1', 'ssid5g2', 'ssid5g3', 'ssid5g4', 'ssid5g5', 'ssid5g6', 'ssid5g7', 'primarySec5g', 'ssidSec5g1', 'ssidSec5g2', 'ssidSec5g3', 'ssidSec5g4', 'ssidSec5g5', 'ssidSec5g6', 'ssidSec5g7']);

    ConfigProfile.findById(profileId, (err, result) => {
        if (result) {
            if (result.contents.hasOwnProperty('vlan')) {
                let vlanOld = result.contents.vlan;
                let find = vlanOld.list.findIndex(function (value) {
                    return value.vid == vlan.vid;
                })
                if (find != -1) {
                    if (!isObjectValueEqual(vlanOld.list[find], vlan)) {
                        vlanOld.subCfgID = vlanOld.subCfgID + 1;
                        vlanOld.list[find] = vlan;
                        if (vlanOld.pvid.autoAssignStatus == 1) {
                            for (let key in vlan) {
                                if (key != 'name' && key != 'vid') {
                                    if (vlan[key] == 2) {
                                        vlanOld.pvid[key] = vlan.vid;
                                    } else {
                                        if (vlanOld.pvid[key] == vlan['vid']) {
                                            vlanOld.pvid[key] = getLastVID(vlanOld.list, key);
                                        }
                                    }
                                }
                            }
                        }
                        ConfigProfile.updateVLANProfile(profileId, vlanOld, (err, data) => {
                            if (err) {
                                callback(err);
                            } else {
                                //   addProfileTaskQueue(result);
                                callback(null, data);
                            }
                        })
                    } else {
                        let needChange = false;
                        if (vlanOld.pvid.autoAssignStatus == 1) {
                            for (let key in vlan) {
                                if (key != 'name' && key != 'vid') {
                                    if (vlan[key] == 2) {
                                        if (vlanOld.pvid[key] != vlan.vid) {
                                            needChange = true;
                                            vlanOld.pvid[key] = vlan.vid;
                                        }

                                    }
                                }
                            }
                        }
                        if (needChange) {
                            vlanOld.subCfgID = vlanOld.subCfgID + 1;
                            ConfigProfile.updateVLANProfile(profileId, vlanOld, (err, data) => {
                                if (err) {
                                    callback(err);
                                } else {
                                    //   addProfileTaskQueue(result);
                                    callback(null, data);
                                }
                            })
                        } else {
                            callback(null, vlan);
                        }


                    }

                }
            } else {
                callback('err');
            }
        } else {
            callback(err);
        }
    })
}

function addVlan(profileId, vlan, callback) {
    getParseInt(vlan, ['mgmt', 'lan1', 'lan2', 'primary24g', 'ssid24g1', 'ssid24g2', 'ssid24g3', 'ssid24g4', 'ssid24g5', 'ssid24g6', 'ssid24g7',
        'primary5g', 'ssid5g1', 'ssid5g2', 'ssid5g3', 'ssid5g4', 'ssid5g5', 'ssid5g6', 'ssid5g7', 'primarySec5g', 'ssidSec5g1', 'ssidSec5g2', 'ssidSec5g3', 'ssidSec5g4', 'ssidSec5g5', 'ssidSec5g6', 'ssidSec5g7']);

    ConfigProfile.findById(profileId, (err, result) => {
        if (result) {
            if (result.contents.hasOwnProperty('vlan')) {
                let vlanOld = result.contents.vlan;
                let find = vlanOld.list.findIndex(function (value) {
                    return value.vid == vlan.vid;
                });
                if (find != -1) {
                    callback(1); //vid重复
                } else {
                    vlanOld.subCfgID = vlanOld.subCfgID + 1;
                    vlanOld.list.push(vlan);
                    if (vlanOld.pvid.autoAssignStatus == 1) {
                        for (let key in vlan) {
                            if (key != 'name' && key != 'vid') {
                                if (vlan[key] == 2) {
                                    vlanOld.pvid[key] = vlan.vid;
                                }
                            }
                        }
                    }
                    ConfigProfile.updateVLANProfile(profileId, vlanOld, (err, data) => {
                        if (err) {
                            callback(err);
                        } else {
                            //  addProfileTaskQueue(result);
                            callback(null, data);
                        }
                    })
                }
            }
        } else {
            callback(err);
        }
    })
}

function delVlan(profileId, vlan, callback) {
    ConfigProfile.findById(profileId, (err, result) => {
        if (result) {
            if (result.contents.hasOwnProperty('vlan')) {
                let vlanOld = result.contents.vlan;
                let find = vlanOld.list.findIndex(function (value) {
                    return value.vid == vlan.vid;
                });
                if (find != -1) {
                    vlanOld.subCfgID = vlanOld.subCfgID + 1;
                    vlanOld.list.splice(find, 1);
                    if (vlanOld.pvid.autoAssignStatus == 1) {
                        for (var key in vlanOld.pvid) {
                            if (key != 'autoAssignStatus') {
                                vlanOld.pvid[key] = getLastVID(vlanOld.list, key);
                            }

                        }
                    }
                    //更新vlan list
                    ConfigProfile.updateVLANProfile(profileId, vlanOld, (err, data) => {
                        if (err) {
                            callback(err);
                        } else {
                            //  addProfileTaskQueue(result);
                            callback(null, data);
                        }
                    })
                }
            }
        } else {
            callback(err);
        }
    })
}

function updateProfileSchedule(profileId, schedule, callback) {
    ConfigProfile.updateProfileSchedule(profileId, schedule, function (err, data) {
        //已经callback了
        callback(err, data);
        if (!err && data) {
            //放入taskQueue
            let start = moment();
            if (data.schedule.cyclicalType == 'Once') {
                start = moment(data.schedule.scheduleStart);
                let starttime = moment(data.schedule.executeTime);
                start.startOf('day').add(starttime.hour(), 'h').add(starttime.minute(), 'm');
            }
            QueueC.addAgentTaskQueue({config: common.taskType.config.profile}, data._id.toString(), data.uuid, start);
        }
    })
}

function clearProfileSchedule(profileId, callback) {
    ConfigProfile.resetProfileSchedule(profileId, function (err, data) {
        //已经callback了
        callback(err, data);
        if (!err && data) {
            //移除taskQueue
            QueueC.removeAgentTaskQueue(data._id.toString(), data.uuid);
        }
    })
}

function getProfileResult(profileId, callback) {
    ConfigProfile.getProfileTaskByProfileId(profileId, function (err, profile) {
        if (err || !profile || profile.length == 0) {
            callback(err, null);
        } else {
            Device.findByNetworkId(profile[0].networkId, (err, devices) => {
                DeviceLog.getDeviceLogByTaskId(profile[0]._id.toString(), function (err, data) {
                    if (err) {
                        callback(err);
                    } else {
                        let data1 = [];
                        for (let _data of data) {
                            let find = devices.findIndex((dev) => {
                                return dev.mac == _data.target.mac;
                            })
                            if (find != -1) {
                                data1.push(_data);
                            }
                        }

                        let results = {
                            status: 0,
                            result: data1
                        };
                        let total = data1.length;
                        results.status = total + "/" + devices.length;
                        callback(null, results);
                    }
                })
            })

        }
    })
}

function updateBandwidthOptRule(profileId, bandwidth, callback) {
    getParseInt(bandwidth, ['downlinkBW', 'uplinkBW']);
    for (let _rule of bandwidth.rule) {
        getParseInt(_rule, ['band', 'type', 'ssidIndex', 'downSpeed', 'upSpeed']);
    }
    async.waterfall([
        function (cb) {
            ConfigProfile.findById(profileId, function (err, profile) {
                if (err || !profile) {
                    cb(err);
                } else {
                    let bandwidthOpt = profile.contents.bandwidthOpt;
                    let subCfgID = bandwidthOpt.subCfgID;
                    delete bandwidthOpt.subCfgID;
                    let value = isObjectValueEqual(bandwidthOpt, bandwidth);
                    if (value == true) {
                        cb(null, bandwidthOpt);
                    } else {
                        subCfgID++;
                        bandwidth.subCfgID = subCfgID;
                        cb(null, bandwidth);
                    }
                }
            })
        },
        function (band, cb) {
            if (band.subCfgID) {
                ConfigProfile.updateBandWidth(profileId, band, function (err, data) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, data);
                    }
                })
            } else {
                cb(null, band);
            }
        }
    ], function (err, rs) {
        callback(err, rs);
    })
}

function updateDeviceSetting(profileId, deviceSetting, callback) {
    trimBlank(deviceSetting, ['userName']);
    async.waterfall([
        function (cb) {
            ConfigProfile.findById(profileId, function (err, profile) {
                if (err || !profile) {
                    cb(err);
                } else {
                    let devSet = profile.contents.devSet;
                    let subCfgID = devSet.subCfgID;
                    delete devSet.subCfgID;
                    let value = isObjectValueEqual(devSet, deviceSetting);
                    if (value == true) {
                        cb(null, devSet);
                    } else {
                        subCfgID++;
                        deviceSetting.subCfgID = subCfgID;
                        cb(null, deviceSetting);
                    }
                }
            })
        },
        function (deviceSet, cb) {
            if (deviceSet.subCfgID) {
                ConfigProfile.updateDeviceSetting(profileId, deviceSet, function (err, data) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, data);
                    }
                })
            } else {
                cb(null, deviceSet);
            }
        }
    ], function (err, rs) {
        callback(err, rs);
    })
}

function getParseInt(obj, strAttr) {
    for (let str of strAttr) {
        if (obj.hasOwnProperty(str)) {
            let temp = parseInt(obj[str]);
            let tempInt = isNaN(temp) ? 0 : temp;
            obj[str] = tempInt;
        }
    }
};

function getParseIntForArray(objAttr, strAttr) {
    for (let obj of objAttr) {
        for (let str of strAttr) {
            if (obj.hasOwnProperty(str)) {
                let temp = parseInt(obj[str]);
                let tempInt = isNaN(temp) ? 0 : temp;
                obj[str] = tempInt;
            }
        }
    }
}

function trimBlank(obj, strAttr) {
    for (let str of strAttr) {
        if (obj.hasOwnProperty(str)) {
            let temp = obj[str].trim();
            obj[str] = temp;
        }
    }
}

function updatePerformance(profileId, performance, callback) {
    if (performance.band24) {
        getParseInt(performance.band24, ['beaconInterval', 'dtimInterval', 'ackTimeout', 'maxMulticastBW', 'rtsLength', 'fragmentLength']);
    }
    if (performance.band5) {
        getParseInt(performance.band5, ['beaconInterval', 'dtimInterval', 'ackTimeout', 'maxMulticastBW', 'rtsLength', 'fragmentLength']);
    }
    if (performance.secBand5) {
        getParseInt(performance.secBand5, ['beaconInterval', 'dtimInterval', 'ackTimeout', 'maxMulticastBW', 'rtsLength', 'fragmentLength']);
    }
    if (performance.lan) {
        getParseInt(performance.lan, ['stp']);
    }
    async.waterfall([
        function (cb) {
            ConfigProfile.findById(profileId, function (err, profile) {
                if (err || !profile) {
                    cb(err);
                } else {
                    let perforce = profile.contents.performance;
                    let subCfgID = perforce.subCfgID;
                    delete perforce.subCfgID;
                    let value = isObjectValueEqual(perforce, performance);
                    if (value == true) {
                        cb(null, perforce);
                    } else {
                        subCfgID++;
                        performance.subCfgID = subCfgID;
                        cb(null, performance);
                    }
                }
            })
        },
        function (performance, cb) {
            if (performance.subCfgID) {
                ConfigProfile.updatePerformance(profileId, performance, function (err, data) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, data);
                    }
                })
            } else {
                cb(null, performance);
            }
        }
    ], function (err, rs) {
        callback(err, rs);
    })
}

function updataWirelessSchedule(profileId, schedule, callback) {
    for (let rule of schedule.ruleList) {
        if (rule.daysSelect && Array.isArray(rule.daysSelect)) {
            for (let i = 0; i < rule.daysSelect.length; i++) {
                rule.daysSelect[i] = parseInt(rule.daysSelect[i]);
            }
        }

    }
    async.waterfall([
        function (cb) {
            ConfigProfile.findById(profileId, function (err, profile) {
                if (err || !profile) {
                    cb(err);
                } else {
                    let scheduleOld = profile.contents.schedule;
                    let subCfgID = scheduleOld.subCfgID;
                    delete scheduleOld.subCfgID;
                    let value = isObjectValueEqual(scheduleOld, schedule);
                    if (value == true) {
                        callback(null, scheduleOld);
                    } else {
                        subCfgID++;
                        schedule.subCfgID = subCfgID;
                        cb(null, schedule);
                    }
                }
            })
        },
        function (schedule, cb) {
            if (schedule.subCfgID) {
                ConfigProfile.updateSchedule(profileId, schedule, function (err, data) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, data);
                    }
                })
            } else {
                cb(null, schedule);
            }
        }
    ], function (err, rs) {
        callback(err, rs);
    })
}

function updateWlanPartition(profileId, wlanPartition, callback) {

    async.waterfall([
        function (cb) {
            ConfigProfile.findById(profileId, function (err, profile) {
                if (err || !profile) {
                    cb(err);
                } else {
                    let wlanPart = profile.contents.wlanPartition;
                    if (wlanPart) {
                        let subCfgID = wlanPart.subCfgID;
                        delete wlanPart.subCfgID;
                        let value = isObjectValueEqual(wlanPart, wlanPartition);
                        if (value == true) {
                            cb(null, wlanPart);
                        } else {
                            subCfgID++;
                            wlanPartition.subCfgID = subCfgID;
                            cb(null, wlanPartition);
                        }
                    } else {
                        wlanPartition.subCfgID = 1;
                        cb(null, wlanPartition);
                    }

                }
            })
        },
        function (wlanPartition, cb) {
            if (wlanPartition.subCfgID) {
                ConfigProfile.updateWLAN(profileId, wlanPartition, function (err, data) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, data);
                    }
                })
            } else {
                cb(null, wlanPartition);
            }
        }
    ], function (err, rs) {
        callback(err, rs);
    })
}

function updateWirelessResource(profileId, wirelessResource, callback) {
    if (wirelessResource.band24) {
        getParseInt(wirelessResource.band24, ['userLimit']);
    }
    if (wirelessResource.band5) {
        getParseInt(wirelessResource.band5, ['userLimit']);
    }
    if (wirelessResource.secBand5) {
        getParseInt(wirelessResource.secBand5, ['userLimit']);
    }
    async.waterfall([
        function (cb) {
            ConfigProfile.findById(profileId, function (err, profile) {
                if (err || !profile) {
                    cb(err);
                } else {
                    if(wirelessResource.bandSteer.status==1){
                        let ssidnames={};
                        for(let ssid of profile.contents.ssid.list){
                            if(ssid.band==1||ssid.band==2){
                                if(ssidnames.hasOwnProperty(ssid.ssid)){
                                    ssidnames[ssid.ssid]+=1;
                                }else{
                                    ssidnames[ssid.ssid]=1;
                                }
                            }
                        }
                        for(let key in ssidnames){
                            if(ssidnames[key]!=2){
                                cb(1);
                                return;
                            }
                        }
                    }
                    let wireless = profile.contents.wirelessResource;
                    let subCfgID = wireless.subCfgID;
                    delete wireless.subCfgID;
                    let value = isObjectValueEqual(wireless, wirelessResource);
                    if (value == true) {
                        //question
                        //这里callback，并不能阻止下一个方法的执行
                        //这里callback，只会是函数多执行一次回调
                        //应该把value通过cb传递给下一个方法，在下面的方法里判断update是否需要执行
                        cb(null, wireless);
                    } else {
                        subCfgID++;
                        wirelessResource.subCfgID = subCfgID;
                        cb(null, wirelessResource);
                    }
                }
            })
        },
        function (wirelessResource, cb) {
            if (wirelessResource.subCfgID) {
                ConfigProfile.updateWirelessResource(profileId, wirelessResource, function (err, data) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, data);
                    }
                })
            } else {
                cb(null, wirelessResource);
            }
        }
    ], function (err, rs) {
        callback(err, rs);
    })
}

function updateRFOpt(profileId, rfOpt, callback) {
    getParseInt(rfOpt, ['rfReportFrequency']);
    async.waterfall([
        function (cb) {
            ConfigProfile.findById(profileId, function (err, profile) {
                if (err || !profile) {
                    cb(err);
                } else {
                    let old = profile.contents.rfOpt;
                    if (!old) {
                        rfOpt.subCfgID = 1;
                        cb(null, rfOpt);
                    } else {
                        let subCfgID = old.subCfgID;
                        delete old.subCfgID;
                        let value = isObjectValueEqual(old, rfOpt);
                        if (value == true) {
                            //question
                            //这里callback，并不能阻止下一个方法的执行
                            //这里callback，只会是函数多执行一次回调
                            //应该把value通过cb传递给下一个方法，在下面的方法里判断update是否需要执行
                            cb(null, rfOpt);
                        } else {
                            subCfgID++;
                            rfOpt.subCfgID = subCfgID;
                            cb(null, rfOpt);
                        }
                    }

                }
            })
        },
        function (rfOpt, cb) {
            if (rfOpt.subCfgID) {
                ConfigProfile.updateRFOpt(profileId, rfOpt, function (err, data) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, data);
                    }
                })
            } else {
                cb(null, rfOpt);
            }
        }
    ], function (err, rs) {
        callback(err, rs);
    })
}

function delSSID(profileId, ssid, callback) {
    ConfigProfile.findById(profileId, function (err, profile) {
        if (err || !profile) {
            callback(err);
        } else {
            if (profile.contents.ssid) {
                let ssidOld = profile.contents.ssid;
                let find = ssidOld.list.findIndex(function (value) {
                    if (value.band == ssid.band && value.ssidIndex == ssid.ssidIndex) {
                        return value;
                    }
                });
                if (find != -1) {
                    ssidOld.subCfgID = ssidOld.subCfgID + 1;
                    //   ssidOld.list.splice(find, 1);
                    //存入数据库
                    if(profile.contents.wirelessResource.bandSteer.status==1){
                        ConfigProfile.delSSIDByName(profileId, ssidOld.subCfgID, ssidOld.list[find].ssid, (err, data) => {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, data);
                            }
                        })
                    }else{
                        ConfigProfile.delSSID(profileId, ssidOld.subCfgID, ssidOld.list[find].band, ssidOld.list[find].ssidIndex, (err, data) => {
                            if (err) {
                                callback(err);
                            } else {
                                //  addProfileTaskQueue(profile);
                                callback(null, data);
                            }
                        })
                    }

                }
            }
        }
    })
};

function isMACListEqual(obj1, obj2) {
    if (obj1.macAccessControl != obj2.macAccessControl) {
        return false;
    } else {
        if (obj1.macList && obj2.macList) {
            if (obj1.macList.length == obj2.macList.length) {
                let set = new Set(obj1.macList);
                for (let oj_2 of obj2.macList) {
                    if (!set.has(oj_2)) {
                        return false;
                    }
                }
            } else {
                return false;
            }
        } else {
            if (!obj1.macList) {
                return false;
            }
            else if (!obj2.macList) {
                return false;
            } else {
                return true;
            }
        }

    }
    return true;
}

function checkACLLengthById(profile, ssids, callback) {
    let isMore = false;
    for (let i = 0; i < ssids.length; i++) {
        if (!checkACLLength(profile, ssids[i])) {
            isMore = true;
            break;
        }
    }
    if (isMore) {
        callback(-2, null);
    } else {
        return callback(null, profile);
    }
}

function checkSSIDTypeById(profile, ssids, callback) {
    let isMore = false;
    for (let i = 0; i < ssids.length; i++) {
        if (!checkSSIDType(profile, ssids[i])) {
            isMore = true;
            break;
        }
    }
    if (isMore) {
        callback(-3, null);
    } else {
        return callback(null, profile);
    }

}

function updateSSID(profile, ssid, callback) {
    getParseInt(ssid, ['authType', 'idleTimeout', 'IPIFVlanGroup', 'primaryRadiusPort', 'backupRadiusPort', 'primaryAccountPort', 'backupAccountPort', 'firstRadiusPort', 'secondRadiusPort', 'thirdRadiusPort', 'LDAPPort', 'POP3Port', 'sessionTime', 'radiusPort', 'accountPort', 'ipFilterStatus', 'keyUpdateInterval']);
    trimBlank(ssid, ['ssid']);
    if (profile.contents && profile.contents.ssid) {
        let ssidOld = profile.contents.ssid;
        let find = ssidOld.list.findIndex(function (value) {
            return (value.band == ssid.band && value.ssidIndex == ssid.ssidIndex);
        });
        if (find != -1) {
            console.log("old " + JSON.stringify(ssidOld.list[find]));
            console.log("new " + JSON.stringify(ssid));
            if (isObjectValueEqual(ssidOld.list[find], ssid)) {
                if (!isMACListEqual(ssidOld.list[find], ssid)) {
                    ssid.subCfgIDMacACL = ssidOld.list[find].subCfgIDMacACL + 1;
                    ConfigProfile.updateSSIDByIndex(profile._id, ssidOld.subCfgID, ssid, (err, data) => {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, data);
                        }
                    })
                } else {
                    callback(null, ssidOld.list[find]);
                }


            } else {
                let cfgId = ssidOld.subCfgID + 1;
                //find存在（ssid更新）
                if (!isMACListEqual(ssidOld.list[find], ssid)) {
                    ssid.subCfgIDMacACL = ssidOld.list[find].subCfgIDMacACL + 1;

                } else {
                    ssid.subCfgIDMacACL = ssidOld.list[find].subCfgIDMacACL;
                }
                ConfigProfile.updateSSIDByIndex(profile._id, cfgId, ssid, (err, data) => {
                    if (err) {
                        callback(err);
                    } else {
                        //  addProfileTaskQueue(profile);
                        callback(null, data);
                    }
                })
            }
        }
        else {
            cwmCounter.getNextCount("SSID", (err, count) => {
                ssid.wlanId = count;
                if (ssid.macList && Array.isArray(ssid.macList) && ssid.macList.length > 0) {
                    ssid.subCfgIDMacACL = 1;
                } else {
                    ssid.subCfgIDMacACL = 0;
                }
                ConfigProfile.addSSID(profile._id, ssidOld.subCfgID, ssid, (err, data) => {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, data);
                    }
                })
            })
        }
    } else {
        callback('err');
    }
};

function copy(obj1, obj2) {
    var obj2 = obj2 || {}; //最初的时候给它一个初始值=它自己或者是一个json
    for (var name in obj1) {
        if (typeof obj1[name] === "object") { //先判断一下obj[name]是不是一个对象
            obj2[name] = (obj1[name].constructor === Array) ? [] : {}; //我们让要复制的对象的name项=数组或者是json
            copy(obj1[name], obj2[name]); //然后来无限调用函数自己 递归思想
        } else {
            obj2[name] = obj1[name];  //如果不是对象，直接等于即可，不会发生引用。
        }
    }
    return obj2; //然后在把复制好的对象给return出去
}

function checkACLLength(profile, _ssid) {
    if (!_ssid) return true;
    let ssidlist = profile.contents.ssid.list;
    let count = 0;
    let macset = new Set();
    for (let ssid of ssidlist) {
        if (ssid.band == _ssid.band && ssid.ssidIndex != _ssid.ssidIndex) {
            if (ssid.macAccessControl == 1 || ssid.macAccessControl == 2) {
                ssid.macList.forEach(x => macset.add(x));
            }
        }
    }
    if (_ssid.macAccessControl == 1 || _ssid.macAccessControl == 2) {
        _ssid.macList.forEach(x => macset.add(x));
    }
    console.log('maclist len is ' + macset.size);
    if (macset.size > 512) {
        return false;
    } else {
        return true;
    }
}

function checkSSIDType(profile, _ssid) {
    if (!_ssid) return true;
    if (_ssid.authType != 7) return true;
    let ssidlist = profile.contents.ssid.list;
    let count=0;
    for (let ssid of ssidlist) {
        if (ssid.band == _ssid.band && ssid.ssidIndex != _ssid.ssidIndex) {
            if (ssid.authType == 7) {
                count+=1;
            }
        }
    }
    if(count>=2){
        return false;
    }
    return true;
}

function verifySSIDInfo(ssid) {
    if (ssid.IPIFStatus == 0) {
        if (ssid.IPIFVlanGroup > 4094 || ssid.IPIFVlanGroup < 1) {
            ssid.IPIFVlanGroup = 1;
        }
    }
}

function addSSID1(profileId, ssid, flag, callback) {
    getParseInt(ssid, ['authType', 'idleTimeout', 'IPIFVlanGroup', 'primaryRadiusPort', 'backupRadiusPort', 'primaryAccountPort', 'backupAccountPort', 'firstRadiusPort', 'secondRadiusPort', 'thirdRadiusPort', 'LDAPPort', 'POP3Port', 'sessionTime', 'radiusPort', 'accountPort', 'ipFilterStatus', 'keyUpdateInterval']);
    trimBlank(ssid, ['ssid']);
    ConfigProfile.findById(profileId, function (err, profile) {
        if (err || !profile) {
            callback(err);
        } else {
            let ssidOld = profile.contents.ssid;
            //覆盖旧的配置
            if (flag) {
                let newssid = {};
                let newssid2 = {};
                newssid = copy(ssid, newssid);
                newssid2 = copy(ssid, newssid2);
                if (ssid.band == 1) {
                    newssid.band = 2;
                    newssid2.band = 3;
                }
                if (ssid.band == 2) {
                    newssid.band = 1;
                    newssid2.band = 3;
                }
                if (ssid.band == 3) {
                    newssid.band = 1;
                    newssid2.band = 2;
                }
                let find = ssidOld.list.findIndex(function (value) {
                    return (value.band == newssid.band && value.ssidIndex == newssid.ssidIndex);
                });
                let find2 = ssidOld.list.findIndex(function (value) {
                    return (value.band == newssid2.band && value.ssidIndex == newssid2.ssidIndex);
                });
                ssidOld.subCfgID = ssidOld.subCfgID + 1;
                //不存在旧的SSID，插入两个新的SSID
                if (flag == 'createAll') {
                    if (!checkSSIDType(profile, ssid)) return callback(-3, null);
                    if (!checkSSIDType(profile, newssid)) return callback(-3, null);
                    if (!checkSSIDType(profile, newssid2)) return callback(-3, null);
                    if (!checkACLLength(profile, newssid)) return callback(-2, null);
                    if (!checkACLLength(profile, newssid2)) return callback(-2, null);
                    if (!checkACLLength(profile, ssid)) return callback(-2, null);
                    cwmCounter.getNextCount("SSID", (err, count) => {
                        newssid.wlanId = count;
                        // ssidOld.list.push(newssid);
                        cwmCounter.getNextCount("SSID", (err, count) => {
                            newssid2.wlanId = count;
                            cwmCounter.getNextCount("SSID", (err, count) => {
                                ssid.wlanId = count;
                                if (ssid.macList && Array.isArray(ssid.macList) && ssid.macList.length > 0) {
                                    ssid.subCfgIDMacACL = 1;
                                    newssid.subCfgIDMacACL = 1;
                                    newssid2.subCfgIDMacACL = 1;
                                } else {
                                    ssid.subCfgIDMacACL = 0;
                                    newssid.subCfgIDMacACL = 0;
                                    newssid2.subCfgIDMacACL = 0;
                                }
                                // ssidOld.list.push(ssid);
                                ConfigProfile.addSSID(profileId, ssidOld.subCfgID, newssid2, (err, data) => {
                                    ConfigProfile.addSSID(profileId, ssidOld.subCfgID, newssid, (err, data) => {
                                        ConfigProfile.addSSID(profileId, ssidOld.subCfgID, ssid, (err, data) => {
                                            if (err) {
                                                callback(err);
                                            } else {
                                                callback(null, data);
                                            }
                                        })
                                    })
                                });
                            })
                        })
                    })
                } else if (flag == 'createOne') {
                    if (!checkSSIDType(profile, ssid)) return callback(-3, null);
                    if (!checkACLLength(profile, ssid)) return callback(-2, null);
                    cwmCounter.getNextCount("SSID", (err, count) => {
                        ssid.wlanId = count;
                        if (ssid.macList && Array.isArray(ssid.macList) && ssid.macList.length > 0) {
                            ssid.subCfgIDMacACL = 1;
                        } else {
                            ssid.subCfgIDMacACL = 0;
                        }
                        //  ssidOld.list.push(ssid);
                        ConfigProfile.addSSID(profileId, ssidOld.subCfgID, ssid, (err, data) => {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, data);
                            }
                        })
                    })
                }
                else {
                    if (!checkSSIDType(profile, ssid)) return callback(-3, null);
                    if (!checkSSIDType(profile, newssid)) return callback(-3, null);
                    if (!checkSSIDType(profile, newssid2)) return callback(-3, null);
                    if (!checkACLLength(profile, newssid)) return callback(-2, null);
                    if (!checkACLLength(profile, newssid2)) return callback(-2, null);
                    if (!checkACLLength(profile, ssid)) return callback(-2, null);


                    //相同名称的SSID已存在 ，替换旧的SSID，插入另一个band
                    if (find != -1) {
                        let newwlanID = ssidOld.list[find].wlanId;
                        newssid.wlanId = newwlanID + 1;
                        if (!isMACListEqual(ssidOld.list[find], newssid)) {
                            newssid.subCfgIDMacACL = ssidOld.list[find].subCfgIDMacACL + 1;

                        } else {
                            newssid.subCfgIDMacACL = ssidOld.list[find].subCfgIDMacACL;
                        }
                    }
                    if (find2 != -1) {
                        let newwlanID2 = ssidOld.list[find2].wlanId;
                        newssid2.wlanId = newwlanID2 + 1;
                        if (!isMACListEqual(ssidOld.list[find2], newssid2)) {
                            newssid2.subCfgIDMacACL = ssidOld.list[find2].subCfgIDMacACL + 1;

                        } else {
                            newssid2.subCfgIDMacACL = ssidOld.list[find2].subCfgIDMacACL;
                        }
                    }
                    cwmCounter.getNextCount("SSID", (err, count) => {
                        ssid.wlanId = count;
                        if (find == -1 || find2 == -1) {
                            cwmCounter.getNextCount("SSID", (err, count) => {
                                if (ssid.macList && Array.isArray(ssid.macList) && ssid.macList.length > 0) {
                                    ssid.subCfgIDMacACL = 1;
                                    if (find == -1) {
                                        newssid.wlanId = count;
                                        newssid.subCfgIDMacACL = 1;
                                    }
                                    if (find2 == -1) {
                                        newssid2.wlanId = count;
                                        newssid2.subCfgIDMacACL = 1;
                                    }
                                } else {
                                    ssid.subCfgIDMacACL = 0;
                                    if (find == -1) {
                                        newssid.wlanId = count;
                                        newssid.subCfgIDMacACL = 0;
                                    }
                                    if (find2 == -1) {
                                        newssid2.wlanId = count;
                                        newssid2.subCfgIDMacACL = 0;
                                    }
                                }

                                if (find == -1 || find2 == -1) {
                                    let tempssid = null; //新增
                                    let tempssid1 = null;
                                    if (find == -1) {
                                        tempssid = newssid;
                                        tempssid1 = newssid2;
                                    }
                                    if (find2 == -1) {
                                        tempssid = newssid2;
                                        tempssid1 = newssid;
                                    }

                                    ConfigProfile.updateSSIDByIndex(profileId, ssidOld.subCfgID, tempssid1, (err, da) => {
                                        ConfigProfile.addSSID(profileId, ssidOld.subCfgID, tempssid, (err, da) => {
                                            ConfigProfile.addSSID(profileId, ssidOld.subCfgID, ssid, (err, data) => {
                                                if (err) {
                                                    callback(err);
                                                } else {
                                                    callback(null, data);
                                                }
                                            })
                                        })
                                    })
                                } else {
                                    ConfigProfile.updateSSIDByIndex(profileId, ssidOld.subCfgID, newssid, (err, da) => {
                                        ConfigProfile.updateSSIDByIndex(profileId, ssidOld.subCfgID, newssid2, (err, da) => {
                                            ConfigProfile.addSSID(profileId, ssidOld.subCfgID, ssid, (err, data) => {
                                                if (err) {
                                                    callback(err);
                                                } else {
                                                    callback(null, data);
                                                }
                                            })
                                        })
                                    })
                                }

                            });

                        } else {
                            if (ssid.macList && Array.isArray(ssid.macList) && ssid.macList.length > 0) {
                                ssid.subCfgIDMacACL = 1;
                            } else {
                                ssid.subCfgIDMacACL = 0;
                            }

                            // ssidOld.list.push(ssid);
                            ConfigProfile.updateSSIDByIndex(profileId, ssidOld.subCfgID, newssid, (err, da) => {
                                ConfigProfile.updateSSIDByIndex(profileId, ssidOld.subCfgID, newssid2, (err, da) => {
                                    ConfigProfile.addSSID(profileId, ssidOld.subCfgID, ssid, (err, data) => {
                                        if (err) {
                                            callback(err);
                                        } else {
                                            callback(null, data);
                                        }
                                    })
                                })
                            })
                        }

                    })
                }

            } else {
                if (!checkSSIDType(profile, ssid)) return callback(-3, null);
                if (!checkACLLength(profile, ssid)) return callback(-2, null);
                ssidOld.subCfgID = ssidOld.subCfgID + 1;
                cwmCounter.getNextCount("SSID", (err, count) => {
                    ssid.wlanId = count;
                    if (ssid.macList && Array.isArray(ssid.macList) && ssid.macList.length > 0) {
                        ssid.subCfgIDMacACL = 1;
                    } else {
                        ssid.subCfgIDMacACL = 0;
                    }

                    //    ssidOld.list.push(ssid);
                    ConfigProfile.addSSID(profileId, ssidOld.subCfgID, ssid, (err, data) => {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, data);
                        }
                    })
                })
            }
        }
    })
}

function addSSID(profileId, ssid, flag, callback) {
    getParseInt(ssid, ['authType', 'idleTimeout', 'IPIFVlanGroup', 'primaryRadiusPort', 'backupRadiusPort', 'primaryAccountPort', 'backupAccountPort', 'firstRadiusPort', 'secondRadiusPort', 'thirdRadiusPort', 'LDAPPort', 'POP3Port', 'sessionTime', 'radiusPort', 'accountPort', 'ipFilterStatus', 'keyUpdateInterval']);
    trimBlank(ssid, ['ssid']);
    verifySSIDInfo(ssid);
    return new Promise((resolve, reject) => {
        ConfigProfile.findById(profileId, function (err, profile) {
            if (err || !profile) {
                reject(err);
            } else {
                resolve(profile);
            }
        });
    }).then((profile) => {
        let performanceTag = [0, 0, 0];
        if (profile.contents.performance.band24 && profile.contents.performance.band24.wirelessMode == 3 && (ssid.authentication == 10||ssid.authentication == 110)) {
            performanceTag[0] = 1;
        }
        if (profile.contents.performance.band5 && profile.contents.performance.band5.wirelessMode == 6 && (ssid.authentication == 10||ssid.authentication == 110)) {
            performanceTag[1] = 1;
        }
        if (profile.contents.performance.secBand5 && profile.contents.performance.secBand5.wirelessMode == 6 && (ssid.authentication == 10||ssid.authentication == 110)) {
            performanceTag[2] = 1;
        }
        let ssidOld = profile.contents.ssid;
        //覆盖旧的配置
        if (flag) {
            let newssid = {};
            let newssid2 = {};
            newssid = copy(ssid, newssid);
            newssid2 = copy(ssid, newssid2);
            if (ssid.band == 1) {
                newssid.band = 2;
                newssid2.band = 3;
                if (performanceTag[1]) {
                    newssid = null;
                    return callback(-5, null);
                }
                if (performanceTag[2]) newssid2 = null;
            }
            if (ssid.band == 2) {
                newssid.band = 1;
                newssid2.band = 3;
                if (performanceTag[0]) {
                    newssid = null;
                    return callback(-5, null);
                }
                if (performanceTag[2]) newssid2 = null;
            }
            if (ssid.band == 3) {
                newssid.band = 1;
                newssid2.band = 2;
                if (performanceTag[0]) newssid = null;
                if (performanceTag[1]) newssid2 = null;
                if(performanceTag[0]!=performanceTag[1]){
                    return callback(-5, null);
                }
            }
            let find = -1;
            if (newssid) {
                find = ssidOld.list.findIndex(function (value) {
                    return (value.band == newssid.band && value.ssidIndex == newssid.ssidIndex);
                });
            }
            let find2 = -1;
            if (newssid2) {
                find2 = ssidOld.list.findIndex(function (value) {
                    return (value.band == newssid2.band && value.ssidIndex == newssid2.ssidIndex);
                });
            }

            ssidOld.subCfgID = ssidOld.subCfgID + 1;
            //不存在旧的SSID，插入两个新的SSID
            //创建所有band
            if (flag == 'createAll') {
                if (!checkSSIDType(profile, ssid)) return callback(-3, null);
                if (!checkSSIDType(profile, newssid)) return callback(-3, null);
                if (!checkSSIDType(profile, newssid2)) return callback(-3, null);
                if (!checkACLLength(profile, newssid)) return callback(-2, null);
                if (!checkACLLength(profile, newssid2)) return callback(-2, null);
                if (!checkACLLength(profile, ssid)) return callback(-2, null);
                return new Promise((resolve, reject) => {
                    if (newssid) {
                        cwmCounter.getNextCount("SSID", (err, count) => {
                            newssid.wlanId = count;
                            resolve();
                        });
                    } else {
                        resolve();
                    }

                }).then(() => {
                    return new Promise((resolve, reject) => {
                        if (newssid2) {
                            cwmCounter.getNextCount("SSID", (err, count) => {
                                newssid2.wlanId = count;
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    })

                }).then(() => {
                    return new Promise((resolve, reject) => {
                        cwmCounter.getNextCount("SSID", (err, count) => {
                            ssid.wlanId = count;
                            if (ssid.macList && Array.isArray(ssid.macList) && ssid.macList.length > 0) {
                                ssid.subCfgIDMacACL = 1;
                                if (newssid) {
                                    newssid.subCfgIDMacACL = 1;
                                }
                                if (newssid2) {
                                    newssid2.subCfgIDMacACL = 1;
                                }

                            } else {
                                ssid.subCfgIDMacACL = 0;
                                if (newssid) {
                                    newssid.subCfgIDMacACL = 0;
                                }
                                if (newssid2) {
                                    newssid2.subCfgIDMacACL = 0;
                                }
                            }
                            resolve();
                        });
                    });
                }).then(() => {
                    return new Promise((resolve, reject) => {
                        if (newssid2) {
                            ConfigProfile.addSSID(profileId, ssidOld.subCfgID, newssid2, (err, data) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        } else {
                            resolve();
                        }
                    });
                }).then(() => {
                    return new Promise((resolve, reject) => {
                        if (newssid) {
                            ConfigProfile.addSSID(profileId, ssidOld.subCfgID, newssid, (err, data) => {
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    });
                }).then(() => {
                    return new Promise((resolve, reject) => {
                        if (ssid) {
                            ConfigProfile.addSSID(profileId, ssidOld.subCfgID, ssid, (err, data) => {
                                callback(null, null, performanceTag);
                            });
                        } else {
                            callback(null, null, performanceTag);
                        }
                    });
                })
            }
            //有tag， 只创建一个
            else if (flag == 'createOne') {
                if (profile.contents.wirelessResource.bandSteer.status == 1&&ssid.band!=3) {
                    return callback(-5, null);
                }
                if (!checkSSIDType(profile, ssid)) return callback(-3, null);
                if (!checkACLLength(profile, ssid)) return callback(-2, null);
                cwmCounter.getNextCount("SSID", (err, count) => {
                    ssid.wlanId = count;
                    if (ssid.macList && Array.isArray(ssid.macList) && ssid.macList.length > 0) {
                        ssid.subCfgIDMacACL = 1;
                    } else {
                        ssid.subCfgIDMacACL = 0;
                    }
                    //  ssidOld.list.push(ssid);
                    ConfigProfile.addSSID(profileId, ssidOld.subCfgID, ssid, (err, data) => {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, data);
                        }
                    })
                })
            }
            //有重名的，需要做覆盖
            else {
                if (!checkSSIDType(profile, ssid)) return callback(-3, null);
                if (!checkSSIDType(profile, newssid)) return callback(-3, null);
                if (!checkSSIDType(profile, newssid2)) return callback(-3, null);
                if (!checkACLLength(profile, newssid)) return callback(-2, null);
                if (!checkACLLength(profile, newssid2)) return callback(-2, null);
                if (!checkACLLength(profile, ssid)) return callback(-2, null);

                //相同名称的SSID已存在 ，替换旧的SSID，插入另一个band
                if (find != -1) {
                    let newwlanID = ssidOld.list[find].wlanId;
                    newssid.wlanId = newwlanID + 1;
                    if (!isMACListEqual(ssidOld.list[find], newssid)) {
                        newssid.subCfgIDMacACL = ssidOld.list[find].subCfgIDMacACL + 1;

                    } else {
                        newssid.subCfgIDMacACL = ssidOld.list[find].subCfgIDMacACL;
                    }

                }
                if (find2 != -1) {
                    let newwlanID2 = ssidOld.list[find2].wlanId;
                    newssid2.wlanId = newwlanID2 + 1;
                    if (!isMACListEqual(ssidOld.list[find2], newssid2)) {
                        newssid2.subCfgIDMacACL = ssidOld.list[find2].subCfgIDMacACL + 1;

                    } else {
                        newssid2.subCfgIDMacACL = ssidOld.list[find2].subCfgIDMacACL;
                    }

                }
                cwmCounter.getNextCount("SSID", (err, count) => {
                    ssid.wlanId = count;
                    if (find == -1 || find2 == -1) {
                        cwmCounter.getNextCount("SSID", (err, count) => {
                            if (ssid.macList && Array.isArray(ssid.macList) && ssid.macList.length > 0) {
                                ssid.subCfgIDMacACL = 1;
                                if (find == -1 && newssid) {
                                    newssid.wlanId = count;
                                    newssid.subCfgIDMacACL = 1;
                                }
                                if (find2 == -1 && newssid2) {
                                    newssid2.wlanId = count;
                                    newssid2.subCfgIDMacACL = 1;
                                }
                            } else {
                                ssid.subCfgIDMacACL = 0;
                                if (find == -1 && newssid) {
                                    newssid.wlanId = count;
                                    newssid.subCfgIDMacACL = 0;
                                }
                                if (find2 == -1 && newssid2) {
                                    newssid2.wlanId = count;
                                    newssid2.subCfgIDMacACL = 0;
                                }
                            }

                            if (find == -1 || find2 == -1) {
                                let tempssid = null; //新增
                                let tempssid1 = null;
                                if (find == -1) {
                                    tempssid = newssid;
                                    tempssid1 = newssid2;
                                }
                                if (find2 == -1) {
                                    tempssid = newssid2;
                                    tempssid1 = newssid;
                                }
                                return new Promise((resolve, reject) => {
                                    if (tempssid1) {
                                        ConfigProfile.updateSSIDByIndex(profileId, ssidOld.subCfgID, tempssid1, (err, da) => {
                                            resolve();
                                        })
                                    } else {
                                        resolve();
                                    }
                                }).then(() => {
                                    return new Promise((resolve, reject) => {
                                        if (tempssid) {
                                            ConfigProfile.updateSSIDByIndex(profileId, ssidOld.subCfgID, tempssid, (err, da) => {
                                                resolve();
                                            })
                                        } else {
                                            resolve();
                                        }
                                    });
                                }).then(() => {
                                    ConfigProfile.addSSID(profileId, ssidOld.subCfgID, ssid, (err, data) => {
                                        if (err) {
                                            callback(err);
                                        } else {
                                            callback(null, data, performanceTag);
                                        }
                                    })
                                })
                            } else {
                                return new Promise((resolve, reject) => {
                                    if (newssid) {
                                        ConfigProfile.updateSSIDByIndex(profileId, ssidOld.subCfgID, newssid, (err, da) => {
                                            resolve();
                                        });
                                    } else {
                                        resolve();
                                    }
                                }).then(() => {
                                        return new Promise((resolve, reject) => {
                                            if (newssid2) {
                                                ConfigProfile.updateSSIDByIndex(profileId, ssidOld.subCfgID, newssid2, (err, da) => {
                                                    resolve();
                                                });
                                            } else {
                                                resolve();
                                            }
                                        });
                                    }
                                ).then(() => {
                                    ConfigProfile.addSSID(profileId, ssidOld.subCfgID, ssid, (err, data) => {
                                        if (err) {
                                            callback(err);
                                        } else {
                                            callback(null, data, performanceTag);
                                        }
                                    })
                                })
                            }

                        });

                    } else {
                        if (ssid.macList && Array.isArray(ssid.macList) && ssid.macList.length > 0) {
                            ssid.subCfgIDMacACL = 1;
                        } else {
                            ssid.subCfgIDMacACL = 0;
                        }
                        return new Promise((resolve, reject) => {
                            if (newssid) {
                                ConfigProfile.updateSSIDByIndex(profileId, ssidOld.subCfgID, newssid, (err, da) => {
                                    resolve();
                                });
                            } else {
                                resolve();
                            }
                        }).then(() => {
                                return new Promise((resolve, reject) => {
                                    if (newssid2) {
                                        ConfigProfile.updateSSIDByIndex(profileId, ssidOld.subCfgID, newssid2, (err, da) => {
                                            resolve();
                                        });
                                    } else {
                                        resolve();
                                    }
                                });
                            }
                        ).then(() => {
                            ConfigProfile.addSSID(profileId, ssidOld.subCfgID, ssid, (err, data) => {
                                if (err) {
                                    callback(err);
                                } else {
                                    callback(null, data, performanceTag);
                                }
                            })
                        })
                    }

                })
            }

        }
        // 没有tag 不需要生成其他band
        else {
            if (profile.contents.wirelessResource.bandSteer.status == 1&&ssid.band!=3) {
                return callback(-5, null);
            }
            if (!checkSSIDType(profile, ssid)) return callback(-3, null);
            if (!checkACLLength(profile, ssid)) return callback(-2, null);
            ssidOld.subCfgID = ssidOld.subCfgID + 1;
            cwmCounter.getNextCount("SSID", (err, count) => {
                ssid.wlanId = count;
                if (ssid.macList && Array.isArray(ssid.macList) && ssid.macList.length > 0) {
                    ssid.subCfgIDMacACL = 1;
                } else {
                    ssid.subCfgIDMacACL = 0;
                }
                //    ssidOld.list.push(ssid);
                ConfigProfile.addSSID(profileId, ssidOld.subCfgID, ssid, (err, data) => {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, data);
                    }
                })
            })
        }
    }).done("", callback);
}

/**
 * 与数据库中的数据做比较，一致返回true，不一致返回false
 */
function isObjectValueEqual(object_1, object_2) {
    let props_1 = Object.getOwnPropertyNames(object_1);
    let props_2 = Object.getOwnPropertyNames(object_2);
    if (props_1.length != props_2.length) {
        return false;
    }
    for (let prop of props_1) {
        let propName = prop;
        if (propName == 'macAccessControl' || propName == 'macList' || propName == 'subCfgIDMacACL' || propName == 'wlanId') {
            continue;
        }
        if (Array.isArray(object_1[propName])) {
            if (object_1[propName].length == object_2[propName].length) {

                for (let oj_1 of object_1[propName]) {
                    var value = new Set();
                    for (let oj_2 of object_2[propName]) {
                        if (isObjectValueEqual(oj_1, oj_2)) {
                            value.add(true);
                            break;
                        } else {
                            value.add(false);
                        }
                    }
                    if (!value.has(true)) {
                        return false;
                    }
                }
            } else {
                return false;
            }

        }
        else if (!Array.isArray(object_1[propName]) && typeof object_1[propName] == "object") {
            return isObjectValueEqual(object_1[propName], object_2[propName]);
        } else {
            if (object_1[propName] != object_2[propName]) {
                return false;
            }
        }
    }
    return true;
}

/**
 * 创建ssidLoginFiles文件
 */
function createCustomer() {

    if (!fs.existsSync(customerDir)) {
        fs.mkdirSync(customerDir);
    }
}

function uploadLoginFile(req, callback) {
    let fields = req.body;
    let files = req.files;
    let inputFile = files.file;
    let fileName = fields.name; //判断名字是否重复
    /**
     * @desc 不信任前端输入，增加判断，强制过滤，并校验长度不超过251，避免系统报错崩溃。
     * */
    if(fileName){
        fileName = fileName.replace(/[.,;:?\[\]<>/\*{}^\|()@#$+=%!\s"'~&\\`~！￥…*（）—｛｝：“”《》？、。，；‘’【】、=·]/g, "");
    }
    if(!fileName || fileName.length == 0){
        fileName = new Date().getTime()+"";
    }
    if(fileName && fileName.length > 251){
        fileName = fileName.substring(0,251);
    }
    gridFS.getAllLoginFiles(fields.profileId, (err, result) => {

        let find = result.findIndex(function (value) {
            return (value.filename == fileName);
        });
        if (find != -1) {
            callback('-1', null);
            return;
        } else {
            createCustomer();
            let uploadDir = customerDir + '/LoginFiles';
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }
            let _fileName = path.dirname(inputFile.path);
            console.log("inputpath:" + _fileName);
            try {
                let notError=false;
                fs.createReadStream(`${inputFile.path}`).pipe(tar.extract(`${_fileName}`).on('error',function(err){
                    notError=true;
                })).on('error', function (err) {
                    notError=true;
                });
                setTimeout(function(){
                    if(!notError){
                        gridFS.writeFileFromPath(inputFile.path, `${fileName}.tar`, {
                            profileId: fields.profileId,
                            type: 'loginFiles',
                            tag: fields.profileId
                        }, (err, result) => {
                            callback(err, result);
                        })
                    }else{
                        callback(-2, null);
                    }
                },1000);
            } catch (e) {
                callback(-2, null);
            }

        }
    });

};

function downloadLoginFiles(path, id, callback) {
    gridFS.readFileToLocalById(path, id, (err) => {
        callback(err);
    })
}
function copyLoginFiles(profileId,newProfile,callback){
    let newProfileId=newProfile._id.toString();
    let ssid = newProfile.contents.ssid;
    let ssidList = ssid.list;
    let set = new Set();
    let splashArray = [];
    let authTypes=[2,4,5,6,7,11];
    if (ssidList && Array.isArray(ssidList) && ssidList.length > 0) {
        for (let i = 0; i < ssidList.length; i++) {
            let ssidItem = ssidList[i];
            if (authTypes.indexOf(ssidItem.authType)!=-1)
            {
                if (ssidItem.hasOwnProperty('splashPageCustom')) {
                    set.add(ssidItem.splashPageCustom);
                }
            }
        }
        splashArray = [...set];
    }
    gridFS.getAllLoginFiles(profileId, (err, result) => {
            let uploadDir = customerDir + '/copyFiles';
            if (!fs.existsSync(customerDir)) {
                fs.mkdirSync(customerDir);
            }
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }
            if (result && result.length > 0) {
                async.map(result, (_temp, cb) => {
                    if(!_temp.metadata.isDefault&& splashArray.includes(_temp.filename)){
                        let fileName = `${uploadDir}/${_temp.filename}`;
                        gridFS.readFileToLocalById(fileName, _temp._id, (err) => {
                            delete _temp._id;
                            _temp.metadata.profileId=newProfileId;
                            _temp.metadata.tag=newProfileId;
                            gridFS.writeFileFromPath(fileName,_temp.filename,_temp.metadata,(err,res)=>{
                                cb(null, null);
                            })

                        })
                    }else{
                        cb(null, null);
                    }

                }, function (err, rs) {
                    callback(err);
                });
            }
        }
    )
}

function getLoginFiles(profileId, callback) {
    gridFS.getAllLoginFiles(profileId, (err, result) => {
            let defaultjson = [];
            let customjson = [];
            let customerLocalDir = `${process.cwd()}/customer`;
            let uploadDir = customerLocalDir + '/LoginFiles';
            if (!fs.existsSync(customerLocalDir)) {
                fs.mkdirSync(customerLocalDir);
            }
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }

            if (result && result.length > 0) {
                async.map(result, (_temp, cb) => {
                    let fileName = _temp.filename.substring(0, _temp.filename.indexOf('.'));
                    gridFS.readFileToLocalById(`${uploadDir}/${_temp.filename}`, _temp._id, (err) => {
                        /*   fs.createReadStream(uploadDir + "/" + _temp.filename).pipe(unzip.Extract({path: `${uploadDir}/${fileName}`}).on('error', function (err) {
                         console.log("error to unzip", err);
                         //  return cb(err);
                         }));*/
                        try {
                            fs.createReadStream(`${uploadDir}/${_temp.filename}`).pipe(tar.extract(`${uploadDir}/${fileName}`)).on('error', function (err) {
                                console.log(err);
                            });
                            let file = {name: fileName, _id: _temp._id.toString()};
                            file.filePath = `./customer/LoginFiles/${fileName}/index.html`;
                            file.downPath = `./customer/LoginFiles/${_temp.filename}`;
                            file.isDefault = _temp.metadata.isDefault;
                            if (file.isDefault) {
                                defaultjson.push(file);
                            } else {
                                customjson.push(file);
                            }
                        } catch (e) {

                        }

                        cb(null, null);
                    })
                }, function (err, rs) {
                    if (err) {
                        callback(err);
                    } else {

                        defaultjson = defaultjson.sort((a, b) => a.name < b.name ? -1 : 1);
                        callback(err, defaultjson.concat(customjson));
                    }
                });
            }
        }
    )
};

function deleteLoginFiles(loginFiles, profileId, callback) {
    let authTypes=[2,4,5,6,7,11];
    ConfigProfile.findById(profileId, function (err, profile) {
        if (err || !profile) {
            callback(err);
        } else {
            let used = false;
            for (let ssid of profile.contents.ssid.list) {
                if (authTypes.indexOf(ssid.authType) > -1) {
                    if (ssid.splashPageCustom == loginFiles.name + '.tar') {
                        used = true;
                        break;
                    }
                }
            }
            if (!used) {
                history.findCurrentProfileByProfileId(profileId,(err,profile)=>{
                    if(err||!profile){
                        callback(1, null);
                    }else{
                        let used1 = false;
                        for (let ssid of profile.contents.ssid.list) {
                            if (authTypes.indexOf(ssid.authType) > -1) {
                                if (ssid.splashPageCustom == loginFiles.name + '.tar') {
                                    used1 = true;
                                    break;
                                }
                            }
                        }
                        if (!used1) {
                            gridFS.deleteFiles(loginFiles._id, (err, result) => {
                                callback(err, result);
                            });
                        }else{
                            callback(1, null);
                        }
                    }
                })
            } else {
                callback(1, null);
            }

        }
    });

};

function uploadWhiteList(req, callback) {
    let form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        if (err) {
            callback(err);
        } else {
            if (!files.file || files.file.length < 1) {
                callback(err, {});
            }
            let inputFile = files.file[0];
            let fileName = inputFile.path;
            fs.readFile(fileName, 'utf-8', function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    if (!result) {
                        return callback('empty');
                    }
                    let arr = result.split("\r\n");
                    let set = new Set(arr);
                    let arrMac = [...set];
                    let whiteList = [];
                    for (let a of arrMac) {
                        if (checkMAC(a)) {
                            whiteList.push(a);
                        }
                    }
                    if (whiteList.length == 0) {
                        return callback('empty');
                    }
                    callback(null, whiteList);
                }
            });
        }
    });
};

function uploadMacList(req, callback) {
    let form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        if (err) {
            callback(err);
        } else {
            if (!files.file || files.file.length < 1) {
                callback(err, {});
            }
            let inputFile = files.file[0];
            let fileName = inputFile.path;
            //let fileName = './ssidLoginFiles/test.txt';
            fs.readFile(fileName, 'utf-8', function (err, data) {
                if (err) {
                    callback(err);
                } else {
                    if (data) {
                        let arr = data.split("\r\n");
                        if (arr.length == 0) {
                            return callback("empty", null);
                        }
                        let set = new Set(arr);
                        let arrMac = [...set];
                        let macList = [];
                        for (let a of arrMac) {
                            if (checkMAC(a)) {
                                macList.push(a);
                            }
                        }
                        if (macList.length > 0) {
                            return callback(null, macList);
                        } else {
                            return callback("empty", null);
                        }

                    } else {
                        callback("empty", null);
                    }


                }
            });
        }
    });
};

function checkMAC(input) {
    var verifyRule1 = /([0-9a-fA-F]{2}(:[0-9a-fA-F]{2}){5})/;
    if (!verifyRule1.test(input)) {
        return false;
    }
    var verifyRule2 = ['00:00:00:00:00:00', 'FF:FF:FF:FF:FF:FF'];
    if ((verifyRule2.indexOf(input.toUpperCase()) != -1)) {
        return false;
    }
    return true;
}

function downloadWhiteList(macByPass, callback) {
    createCustomer();
    let filename = customerDir + '/cwmwhiteList.txt'
    let str = '';
    for (let i = 0; i < macByPass.length; i++) {
        str += macByPass[i];
        if (i != macByPass.length - 1) {
            str += "\r\n";
        }
    }
    fs.writeFile(filename, str, function (err, data) {
        if (err) {
            callback(err);
        }
        callback(null, filename);
    })
}

function downloadMacList(macList, callback) {
    createCustomer();
    let filename = customerDir + '/cwmmacList.txt';
    let str = '';
    for (let i = 0; i < macList.length; i++) {
        str += macList[i];
        if (i != macList.length - 1) {
            str += "\r\n";
        }
    }
    fs.writeFile(filename, str, function (err, data) {
        if (err) {
            callback(err);
        }
        callback(null, filename);
    })
}

function getFwResult(orgId, networkId, callback) {
    ConfigOperate.getOperateTaskByNetworkId(networkId, 'fwUpgrade', function (err, profile) {
        if (err || !profile || profile.length == 0) {
            callback(err, {status: '0/0', result: []});
        } else {
            Device.findByNetworkId(profile[0].networkId, (err, devices) => {
                DeviceLog.getDeviceLogByOperateId(profile[0]._id, function (err, data) {
                    if (err) {
                        callback(err);
                    } else {
                        let data1 = [];
                        for (let _data of data) {
                            let find = devices.findIndex((dev) => {
                                return dev.mac == _data.target.mac;
                            })
                            if (find != -1) {
                                data1.push(_data);
                            }
                        }

                        let results = {
                            status: 0,
                            result: data1
                        };
                        let total = data1.length;
                        results.status = `${total}/${ devices.length}`;
                        async.map(results.result, (result, cb) => {
                            Device.findDevInfoByMac(result.target.mac, function (err, device) {
                                if (err) {
                                    cb(err);
                                } else {
                                    if (device) {
                                        if (device.firmware) {
                                            result.target.fwVersion = device.firmware;
                                        } else {
                                            result.target.fwVersion = "";
                                        }
                                        if (!result.target.mac) {
                                            result.target.mac = "";
                                        }
                                    }

                                    cb(null, result);
                                }
                            })
                        }, function (err, rs) {
                            if (err) {
                                callback(err)
                            } else {
                                callback(null, results);
                            }
                        })

                    }
                })
            })

        }
    })

};

//分为已经配置过和未配置过两种情况
function getFwInfo(orgId, networkId, operateType, callback) {
    ConfigOperate.findOperationsByNetwork(networkId, operateType, function (err, fwInfos) {
        if (err) {
            callback(err);
        } else {
            if (fwInfos && fwInfos.length > 0) {
                //已配置fw了
                let fwInfo = fwInfos[0];
                let fwList = fwInfo.fwList;
                Device.getModuleTypeHwvByNetworkId(orgId, networkId, function (err, data) {
                    if (err) callback(err);
                    let list = [];
                    for (let d of data) {
                        let match = false;
                        for (let fw of fwList) {
                            //e只需要比较modelType,
                            //暂时先用seriesName
                            if (d.seriesName == fw.seriesName) {
                                /*   let arr = fw.active.urlFw.split("/");
                                 let len = arr.length;*/
                                let s = {
                                    moduleType: d.moduleType,
                                    modelOID: d._id.modelOID,
                                    hwVersion: d.hardware,
                                    seriesName: d.seriesName,
                                    active: fw.active,
                                    backup: fw.backup
                                };
                                list.push(s);
                                match = true;
                                break;
                            }
                        }
                        if (match == false) {
                            let s = {
                                moduleType: d.moduleType,
                                modelOID: d._id.modelOID,
                                hwVersion: d.hardware,
                                seriesName: d.seriesName,
                                active: {
                                    fwVersion: "",
                                    urlFw: "",
                                    fileName: ""

                                }, backup: {
                                    fwVersion: "",
                                    urlFw: "",
                                    fileName: ""
                                }
                            };
                            list.push(s);
                        }
                    }
                    fwInfo.fwList = list;
                    console.log("fwinfo:" + JSON.stringify(fwInfo));
                    callback(null, fwInfo);
                })
            } else {
                //还未配置fw
                Device.getModuleTypeHwvByNetworkId(orgId, networkId, function (err, data) {
                    if (err) callback(err);
                    //data返回数据格式 {_id:{soid:''},moduleType:'',hardware:''}
                    let list = [];
                    if (data && data.length > 0) {
                        for (let d of data) {
                            let s = {
                                moduleType: d.moduleType,
                                modelOID: d._id.modelOID,
                                hwVersion: d.hardware,
                                seriesName: d.seriesName,
                                active: {
                                    fwVersion: "",
                                    urlFw: "",
                                    fileName: ""

                                },
                                backup: {
                                    fwVersion: "",
                                    urlFw: "",
                                    fileName: ""
                                }
                            };
                            list.push(s);
                        }
                    }
                    let schedule = {
                        cyclicalType: 'Immediate',
                        executeTime: new Date(),
                        scheduleStart: new Date()
                    };
                    callback(null, {networkId: networkId, fwList: list, schedule: schedule});
                })
            }
        }
    })
};

function updateOperateByType(batchOper, operateType, callback) {
    return new Promise((resolve, reject) => {
        if (batchOper.uuid) {
            resolve(batchOper);
        } else {
            Network.findById(batchOper.networkId, (err, network) => {
                if (err) {
                    reject(err);
                }
                else {
                    batchOper.uuid = network.agentUUID;
                    resolve(batchOper);
                }
            });
        }
    }).then(_batchOper => {
        ConfigOperate.findOperationsByNetwork(_batchOper.networkId, operateType, function (err, data) {
            if (data && data.length > 0) {
                //更新fw配置信息
                _batchOper._id = data[0]._id;
                _batchOper.fwList = data[0].fwList;
                ConfigOperate.updateOperation(_batchOper, function (err, operate) {
                    if (err) {
                        callback(err)
                    } else {
                        //下发任务
                        let start = moment();
                        if (operateType == 'fwUpgrade') {
                            if (operate.schedule.cyclicalType == 'Once') {
                                start = moment(operate.schedule.scheduleStart);
                                let starttime = moment(operate.schedule.executeTime);
                                start.startOf('day').add(starttime.hour(), 'h').add(starttime.minute(), 'm');
                            }
                        }
                        QueueC.addAgentTaskQueue({config: common.taskType.config.operation}, operate._id.toString(), operate.uuid, start);
                        callback(err, operate);
                    }
                });
            } else {
                //创建fw配置信息
                ConfigOperate.saveOperation(_batchOper, function (err, operate) {
                    if (err) {
                        callback(err)
                    } else {
                        //下发任务
                        let start = moment();
                        if (operateType == 'fwUpgrade' && operate.schedule != null) {
                            if (operate.schedule.cyclicalType == 'Once') {
                                start = moment(operate.schedule.scheduleStart);
                                let starttime = moment(operate.schedule.executeTime);
                                start.startOf('day').add(starttime.hour(), 'h').add(starttime.minute(), 'm');
                            }
                        }

                        QueueC.addAgentTaskQueue({config: common.taskType.config.operation}, operate._id.toString(), operate.uuid, start);
                        callback(err, operate);
                    }
                });
            }
        })
    }).catch(err => {
        callback(err);
    });
}

function clearFwOperSchedule(networkId, callback) {
    ConfigOperate.clearFwOperSchedule(networkId, 'fwUpgrade', function (err, data) {
        if (data && !err) {
            //更新fw配置信息
            callback(err, data);
            QueueC.removeAgentTaskQueue(data._id.toString(), data.uuid);
        } else {
            callback(err, data);
        }
    })
}

function updateFWOperate(batchOper, callback) {
    ConfigOperate.findOperationsByNetwork(batchOper.networkId, 'fwUpgrade', function (err, data) {
        if (data && data.length > 0) {
            //更新fw配置信息
            batchOper._id = data[0]._id;
            ConfigOperate.updateFWOperate(data[0]._id, batchOper.fwList[0], function (err, operate) {
                if (err) {
                    callback(err)
                } else {
                    callback(err, operate);
                }
            });
        } else {
            //创建fw配置信息
            batchOper.schedule = {cyclicalType: 'Immediate'};
            batchOper.modifyTime = new Date();
            let curdate = new Date();
            let hour = curdate.getHours() - 1;
            curdate.setHours(hour);
            batchOper.applyTime = curdate;
            ConfigOperate.create(batchOper, function (err, operate) {
                if (err) {
                    callback(err)
                } else {
                    callback(err, operate);
                }
            });
        }
    })
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

function validationFwVersionFormat(str) {

    if (str[0] != 'v' && str[2] != '.') {
        return false;
    } else {
        if (!charIsNumber(str[1]) || !charIsNumber(str[3]) || !charIsNumber(str[4])) {
            return false;
        } else {
            let location_r = str.indexOf('r');
            if (!charIsNumber(str[location_r + 1]) || !charIsNumber(str[location_r + 2]) || !charIsNumber(str[location_r + 3])) {
                return false;
            } else {
                return true;
            }
        }
    }

    function charIsNumber(c) {
        if ('0123456789'.indexOf(c) !== -1) {
            return true;
        } else {
            return false;
        }
    }
};

function fwVersionFilter(str) {
    let location_r = str.indexOf('r');
    let finalStr = str.substring(0, location_r + 1 + 3);
    return finalStr;
};

function upLoadFwFile(req, callback) {
    //还需验证文件读出的moduleType与前台传过来的是否一致（还未做具体的验证）
    createCustomer();
    let uploadDir = customerDir;
    let fields = req.body;
    let files = req.files;
    if (!files.file) {
        return callback('error', {});
    }
    return new Promise((resolve, reject) => {
        Network.findById(fields.networkId, (err, network) => {
            if (err) reject(err);
            else resolve(network);
        });
    }).then(network => {
        let inputFile = files.file;
        let fileName = inputFile.originalFilename;
        let dstPath = `${uploadDir}/${fileName}`;
        var readStream = fs.createReadStream(inputFile.path);
        var writeStream = fs.createWriteStream(dstPath);
        readStream.pipe(writeStream);
        readStream.on('end', function () {
            fs.unlink(inputFile.path, (err) => {
                if (err) {
                    callback(err, null);
                } else {
                    let fwVersion, moduletypeHw;
                    fs.readFile(dstPath, (err, data) => {
                        if (err) {
                            callback(err, null);
                        }
                        if (data.length > 72) {
                            let versionbuf = Buffer.from(data.buffer, 40, 16);
                            if (!validationFwVersionFormat(Utf8ArrayToStr(versionbuf))) {
                                console.log('Fw Version Format error');
                                return callback(2, null);
                            }
                            let modelbuf = Buffer.from(data.buffer, 56, 16);
                            fwVersion = fwVersionFilter(Utf8ArrayToStr(versionbuf));
                            moduletypeHw = Utf8ArrayToStr(modelbuf);
                        }
                        console.log(`fwv:${fwVersion}`);
                        console.log(`model:${moduletypeHw}`);
                        let hwVersion = '';
                        let moduleName = '';
                        if (!moduletypeHw) {
                            return callback(2, null);
                        }
                        moduletypeHw = moduletypeHw.replace(/(\s*$)/g, "");
                        //比较与现在的moduleType是否一致，一致格式正确，否则格式错误
                        let seriesName = fields.seriesName.replace(new RegExp("-", "gm"), "");
                        if (moduletypeHw.toLowerCase() != seriesName.toLowerCase()) {
                            callback(2, null);
                        } else {
                            //先略过验证部分，直接把文件存进数据库
                            let url = path.resolve(dstPath);
                            gridFS.writeFileFromPath(url, fileName, {
                                orgId: fields.orgId,
                                type: "fw",
                                uuid: network.agentUUID,
                                moduleType: fields.moduleType,
                                modelOID: fields.modelOID,
                                hwVersion: fields.hwVersion,
                                tag: network.agentUUID
                            }, (err, result) => {
                                if (err) return callback(err);
                                let rs = {
                                    active: {
                                        fwVersion: fwVersion,
                                        urlFw: result._id,
                                        fileName: fileName
                                    },
                                    backup: {
                                        fwVersion: fwVersion,
                                        urlFw: result._id,
                                        fileName: fileName
                                    },
                                    modelOID: fields.modelOID,
                                    hwVersion: fields.hwVersion,
                                    moduleType: fields.moduleType,
                                    seriesName: fields.seriesName
                                };
                                let fw = {
                                    orgId: fields.orgId,
                                    networkId: fields.networkId,
                                    uuid: network.agentUUID,
                                    operateType: 'fwUpgrade',
                                    fwList: [rs]
                                }
                                updateFWOperate(fw, (err, result) => {
                                });
                                callback(null, rs);
                            });
                        }
                    });
                }
            });

        });
    }).catch(err => {
        callback(err);
    })

};

function removeFwFile(req, callback) {
    let networkId = req.networkId;
    let moduleType = req.moduleType;
    ConfigOperate.findOperationsByNetwork(networkId, 'fwUpgrade', function (err, data) {
        if (data && data.length > 0) {
            //更新fw配置信息
            ConfigOperate.removeFWFile(data[0]._id, moduleType, function (err, operate) {
                if (err) {
                    callback(err)
                } else {
                    callback(err, operate);
                }
            });
        }
    })
}

function getSSLCerInfo(orgId, networkId, operateType, callback) {
    ConfigOperate.findOperationsByNetwork(networkId, operateType, function (err, sslCerts) {
        if (err) {
            callback(err);
        } else {
            if (sslCerts && sslCerts.length > 0) {
                //已配置sslcert了
                let sslInfo = sslCerts[0];
                callback(null, sslInfo);
            } else {
                //还未配置sslcert
                callback(null, {sslCertification: {}});
            }
        }
    })
}

function uploadSSLCerInfo(req, callback) {
    let fields = req.body;
    let files = req.files;
    let sslVersion = "";
    return new Promise((resolve, reject) => {
        if (files.file[0].originalFilename.indexOf('.pem') == -1 || files.file[1].originalFilename.indexOf('.pem') == -1) {
            reject(1)
        } else {
            let keyBuf = fs.readFileSync(files.file[1].path);
            let certBuf = fs.readFileSync(files.file[0].path);
            let key = sshpk.parsePrivateKey(keyBuf, 'pem');
            let cert = sshpk.parseCertificate(certBuf, 'pem');
            if (key && cert) {
                let hashAlgorithm = cert.signatures.x509.signature.hashAlgorithm;
                // console.log(`type:${key.type}`);
                // console.log(`size:${key.size}`);
                // console.log(`Algorithm:${hashAlgorithm}`);
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
                    if (hashAlgorithm == "sha256" && key.type == 'rsa' && key.size == 2048) {
                        let validFrom = cert.validFrom;
                        let validUntil = cert.validUntil;
                        if (validFrom && validUntil) {
                            let temp = validUntil.getTime() - validFrom.getTime();
                            let days = Math.floor(temp / (24 * 3600 * 1000));
                            if (days == 7300) {
                                if (cert.isSignedByKey(key)) {
                                    console.log("is match");
                                    sslVersion = cert.fingerprint('md5').toString();
                                    resolve(sslVersion);
                                } else {
                                    reject(2);
                                    console.log("is not match");
                                }
                            } else {
                                reject(2);
                            }
                        } else {
                            reject(2);
                        }
                    } else {
                        reject(2);
                    }
                } else {//其他的不用验证
                    let validFrom = cert.validFrom;
                    let validUntil = cert.validUntil;
                    if (validFrom && validUntil) {
                        let temp = validUntil.getTime() - validFrom.getTime();
                        let days = Math.floor(temp / (24 * 3600 * 1000));
                        if (cert.isSignedByKey(key)) {
                            console.log("is match");
                            sslVersion = cert.fingerprint('md5').toString();
                            resolve(sslVersion);
                        } else {
                            reject(2);
                            console.log("is not match");
                        }
                    } else {
                        reject(2);
                    }
                }

            } else {
                reject(2);
            }

        }
    }).then(result => {
        return new Promise((resolve, reject) => {
            Network.findById(fields.networkId, (err, network) => {
                if (err) reject('data');
                else resolve(network);
            });
        })
    }).then(network => {
        if (network) {
            if (files.file && files.file.length == 2) {
                let certPath = files.file[0].path;
                let keyPath = files.file[1].path;
                certPath = path.resolve(certPath);
                keyPath = path.resolve(keyPath);
                let rs = {
                    urlCert: {name: files.file[0].originalFilename},
                    urlKeyFile: {name: files.file[1].originalFilename},
                    sslVer: sslVersion
                };
                let promises = [];
                promises.push(new Promise((resolve, reject) => {
                    gridFS.writeFileFromPath(certPath, rs.urlCert.name, {
                        orgId: fields.orgId,
                        type: "sslcert",
                        uuid: network.agentUUID,
                        tag: network.agentUUID
                    }, (err, result) => {
                        if (err) {
                            reject('data');
                        }
                        else {
                            resolve(result);
                        }
                    });
                }));
                promises.push(new Promise((resolve, reject) => {
                    gridFS.writeFileFromPath(keyPath, rs.urlKeyFile.name, {
                        orgId: fields.orgId,
                        type: "sslkey",
                        uuid: network.agentUUID,
                        tag: network.agentUUID
                    }, (err, result) => {
                        if (err) {
                            reject('data');
                        }
                        else {
                            resolve(result);
                        }
                    });
                }))
                Promise.all(promises).then((result) => {

                    rs.urlCert.fileId = result[0]._id.toString();
                    rs.urlKeyFile.fileId = result[1]._id.toString();
                    let cert = {
                        orgId: fields.orgId,
                        networkId: fields.networkId,
                        uuid: network.agentUUID,
                        operateType: 'sslCertificate',
                        sslCertification: rs
                    }
                    callback(null, cert);
                }).catch((err) => {
                    callback('data');
                })
            }
        }
    }).catch(err => {
        callback(err);
    })


}

function getSSLResult(orgId, networkId, callback) {
    ConfigOperate.getOperateTaskByNetworkId(networkId, 'sslCertificate', function (err, profile) {
        if (err || !profile || profile.length == 0) {
            callback(err, {status: '0/0', result: []});
        } else {
            Device.findByNetworkId(profile[0].networkId, (err, devices) => {
                console.log(JSON.stringify(profile));
                DeviceLog.getDeviceLogByOperateId(profile[0]._id, function (err, data) {
                    if (err) {
                        callback(err);
                    } else {
                        let data1 = [];
                        for (let _data of data) {
                            let find = devices.findIndex((dev) => {
                                return dev.mac == _data.target.mac;
                            })
                            if (find != -1) {
                                data1.push(_data);
                            }
                        }

                        let results = {
                            status: 0,
                            result: data1
                        };
                        let total = data1.length;
                        results.status = total + "/" + devices.length;
                        callback(null, results);

                    }
                })
            })

        }
    })

};


module.exports = {
    getProfileTree,
    getFWTree,
    getProfileByNetwork,
    updatePvid,
    updateVlanStatus,
    updateVlanList,
    addVlan,
    delVlan,
    updateProfileSchedule,
    clearProfileSchedule,
    getProfileResult,
    updateBandwidthOptRule,
    updateDeviceSetting,
    updatePerformance,
    updataWirelessSchedule,
    updateWlanPartition,
    updateWirelessResource,
    updateRFOpt,
    delSSID,
    updateSSID,
    addSSID,
    uploadLoginFile,
    downloadLoginFiles,
    getLoginFiles,
    deleteLoginFiles,
    uploadWhiteList,
    uploadMacList,
    downloadWhiteList,
    downloadMacList,
    getFwResult,
    getFwInfo,
    updateOperateByType,
    clearFwOperSchedule,
    upLoadFwFile,
    removeFwFile,
    getSSLCerInfo,
    uploadSSLCerInfo,
    getSSLResult,
    checkACLLengthById,
    checkSSIDTypeById,
    copyLoginFiles
}