/**
 * Created by lizhimin on 2016/3/24.
 */
'use strict';
const db = require("../lib/util").db;
const common = require("../lib/util").common;
const moment = require('moment');
const taskQueue = db.cwmTaskQueue;
const CoreServerInfo = db.CoreServerInfo;
const util = require("../lib/util");

//config类型以外的普通DAP任务，使用这个方法
exports.addAgentQueue = function (taskType, aguuid) {
    CoreServerInfo.findAllOnlineServer((err, result)=> {
        if (result && result.length > 0) {
            let now = moment();
            let queue = {
                taskType: taskType,
                createTime: now,
                executeTime: now,
                serverMarks: [],//这一项初始化，是为了更新时去掉标记
                uuid: aguuid,
                uuidMode: 'Agent'
            };
            taskQueue.createUniqueTaskByType(queue, function (err, data) {
                if (!err) {
                    console.info_log("Add task to task queue success [addAgentQueue]:  (" +  JSON.stringify(queue) + ")", "taskqueue");
                } else {
                    console.error_log("Add task to task queue failed [addAgentQueue]:  (" +  JSON.stringify(err) + ")", "taskqueue", __filename);
                }// callback({success: true, data: data});

            });
        } else {
            console.info_log("Add task to task queue failed:no CoreServer is online.");
        }
    });

};
exports.addDAPTempTaskQueue = function (targetId, aguuid, tempTaskType, subTypes) {
    let now = moment();
    let queue = {
        taskType: {config: common.taskType.config.tempTask},
        createTime: now,
        executeTime: now,
        uuidMode: 'Agent',
        uuid: aguuid,
        tempTaskType: tempTaskType,
        targetId: targetId
    };
    taskQueue.createDAPUniqueTask(queue, subTypes, function (err, data) {
        if (!err) {
            console.info_log("Add task to task queue success [addDAPTempTaskQueue]: (" + JSON.stringify(queue)+ ")", "taskqueue");
        } else {
            console.error_log("Add task to task queue failed [addDAPTempTaskQueue]: (" + JSON.stringify(err) + ")", "taskqueue", __filename);
        }// callback({success: true, data: data});

    });
};
//keeep alive使用这个方法

exports.addAgentKeepAliveQueue = function (taskType, targetId) {
    CoreServerInfo.findAllOnlineServer((err, result)=> {
        if (result && result.length > 0) {
            let now = moment();
            let queue = {
                taskType: taskType,
                createTime: now,
                executeTime: now,
                serverMarks: [],//这一项初始化，是为了更新时去掉标记
                uuidMode: 'Agent',
                taskId: targetId
            };
            taskQueue.createUniqueTaskByType(queue, function (err, data) {
                if (!err) {
                    console.info_log("Add task to task queue success:  (" +  JSON.stringify(queue) + ")", "taskqueue");
                } else {
                    console.error_log("Add task to task queue failed: (" + JSON.stringify(err) + ")", "taskqueue", __filename);
                }// callback({success: true, data: data});

            });
        } else {
            console.info_log("Add task to task queue failed:no CoreServer is online.");
        }
    });
};
exports.addUpdateModelListQueue = function (taskType) {
    CoreServerInfo.findAllOnlineServer((err, result)=> {
        if (result && result.length > 0) {
            let now = moment();
            let queue = {
                taskType: taskType,
                createTime: now,
                executeTime: now,
                serverMarks: [],//这一项初始化，是为了更新时去掉标记
                uuidMode: 'Agent'
            };
            taskQueue.createUniqueTaskByType(queue, function (err, data) {
                if (!err) {
                    console.info_log("addUpdateModelListQueue  success:  (" +  JSON.stringify(queue) + ")", "taskqueue");
                } else {
                    console.error_log("addUpdateModelListQueue  failed: (" + JSON.stringify(err) + ")", "taskqueue", __filename);
                }// callback({success: true, data: data});

            });
        } else {
            console.info_log("addUpdateModelListQueue failed:no CoreServer is online.");
        }
    });
};
//主要是设备的纳管删除
exports.addAgentCommonQueue = function (taskType, aguuid, targetId, newuuid) {
    let now = moment();
    let queue = {
        taskType: taskType,
        createTime: now,
        executeTime: now,
        uuid: aguuid,
        uuidMode: 'Agent',
        targetId: targetId
    };
    if (newuuid) {
        queue.newuuid = newuuid;
    }

    taskQueue.save(queue, function (err, data) {
        if (!err) {
            console.info_log("Add task to task queue success [addAgentCommonQueue]:  (" + JSON.stringify(queue) + ")", "taskqueue");
        } else {
            console.error_log("Add task to task queue failed [addAgentCommonQueue]: (" +  JSON.stringify(err) + ")", "taskqueue", __filename);
        }// callback({success: true, data: data});

    });
};
//将Agent类型的任务加入用户队列,CS没有启动时也放入队列，CS启动时对任务进行状态设置，以便AS取任务
exports.addAgentTaskQueue = function (taskType, taskId, aguuid, starttime) {
    let now = moment();
    let queue = {
        taskId: taskId,
        taskType: taskType,
        createTime: now,
        uuid: aguuid,
        serverMarks: [],//这一项初始化，是为了更新时去掉标记
        uuidMode: 'Agent',
        executeTime: starttime
    };
    taskQueue.createUniqueTaskByType(queue, function (err, data) {
        if (!err) {
            console.log("Add task to task queue success [addAgentTaskQueue]: (" +  JSON.stringify(queue) + ")", "task queue", __filename);
        } else {
            console.info_log("Add task to task queue success [addAgentTaskQueue]: (" +  JSON.stringify(queue) + ")", "task queue", __filename);
            console.error_log("Add task to task queue failed [addAgentTaskQueue]: (" +  JSON.stringify(err) + ")", "task queue", __filename);
        }// callback({success: true, data: data});
    });
}
exports.removeAgentTaskQueue=function(taskId, aguuid){

    taskQueue.deleteUniqueTaskByTaskId(taskId,aguuid, function (err, data) {
        if (!err) {
            console.info_log("remove task from task queue success [removeAgentTaskQueue]: (" + taskId + ")", "task queue", __filename);
        } else {
            console.error_log("remove task from task queue failed [removeAgentTaskQueue]: (" + taskId + ")", "task queue", __filename);
        }// callback({success: true, data: data});
    });
}
exports.addClientTaskQueue = function (taskType, aguuid, tempTaskType, clientInfo) {
    CoreServerInfo.findAllOnlineServer((err, result)=> {
        if (result && result.length > 0) {
            let now = moment();
            let queue = {
                taskType: taskType,
                createTime: now,
                executeTime: now,
                uuid: aguuid,
                serverMarks: [],//这一项初始化，是为了更新时去掉标记
                uuidMode: 'Agent',
                clientInfo: clientInfo,
                tempTaskType: tempTaskType
            };
            taskQueue.createUniqueTempTaskByType(queue, function (err, data) {
                if (!err) {
                    console.info_log("Add task to task queue success [addClientTaskQueue]: (" +  JSON.stringify(queue) + ")", "task queue", __filename);
                } else {
                    console.error_log("Add task to task queue failed [addClientTaskQueue]: (" +  JSON.stringify(err) + ")", "task queue", __filename);
                }// callback({success: true, data: data});
            });
        } else {
            console.info_log("Add task to task queue failed:no CoreServer is online.");
        }
    });
}


exports.addDiscoverQueue = function (network) {
    let discover = network.discover;
    CoreServerInfo.findAllOnlineServer((err, result)=> {
        if (result && result.length > 0) {
            let now = moment();
            if (discover.layer2) {
                let queue2 = {
                    taskType: {config: common.taskType.config.tempTask},
                    tempTaskType: "ddpv5L2",
                    ddpv5Func: {
                        action: "discovery",
                        "device": {
                            "mac": "FF:FF:FF:FF:FF:FF",
                            "ddpVersion": "V5"
                        }
                    },
                    createTime: now,
                    executeTime: now,
                    serverMarks: [],
                    uuid: network.agentUUID,
                    uuidMode: 'Agent'
                };

                taskQueue.createUniqueTaskByType(queue2, function (err, data) {
                    if (!err) {
                        console.info_log("Add task to task queue success:taskType is discovery by ddpv5L2");
                    } else {
                        console.error_log("Add task to task queue failed:taskType is discovery by ddpv5L2");
                    }
                });
            }
            if (discover.layer3) {
                let ipRange = [];
                for (let i = 0; i < discover.layer3List.length; i++) {
                    if (discover.layer3List[i].type == "IP") {
                        ipRange.push({
                            ipFrom: discover.layer3List[i].IP.from,
                            ipTo: discover.layer3List[i].IP.to
                        });
                    } else if (discover.layer3List[i].type == "Prefix") {
                        ipRange.push(util.getIpRange(discover.layer3List[i].Prefix));
                    }
                }
                let queue3 = {
                    taskType: {config: common.taskType.config.tempTask},
                    tempTaskType: "ddpv5L34",
                    ddpv5Func: {
                        action: "discovery",
                        "device": {
                            "mac": "",
                            "ip": ipRange,
                            "ddpVersion": "V5"
                        }
                    },
                    createTime: now,
                    executeTime: now,
                    serverMarks: [],
                    uuid: network.agentUUID,
                    uuidMode: 'Agent'
                };
                taskQueue.createUniqueTaskByType(queue3, function (err, data) {
                    if (!err) {
                        console.info_log("Add task to task queue success:taskType is discovery by ddpv5L34");
                    } else {
                        console.error_log("Add task to task queue failed:taskType is discovery by ddpv5L34");
                    }
                });
            }

        } else {
            console.info_log("Add task to task queue failed:no CoreServer is online.");
        }
    });

};

exports.setAGProfile = function (network, device, authentic, nmsURL, keepAlive) {
    CoreServerInfo.findAllOnlineServer((err, result)=> {
        if (result && result.length > 0) {
            let now = moment();
            if (network.discover.layer2) {
                let queue2 = {
                    taskType: {config: common.taskType.config.tempTask},
                    tempTaskType: "ddpv5L2",
                    ddpv5Func: {
                        action: "setAGProfile",
                        "device": {
                            mac: device.MACAddr,
                            systemServerPrecedence: 7,
                            authentic: authentic,
                            ddpVersion: "V5"
                        },
                        info: {
                            agentGroupUUID: network.agentUUID,
                            NMSurl: nmsURL,
                            msgInterval: keepAlive
                        }
                    },
                    createTime: now,
                    executeTime: now,
                    serverMarks: [],
                    uuid: network.agentUUID,
                    uuidMode: 'Agent'
                };
                taskQueue.createSpecialDDPTask(queue2, function (err, data) {
                    console.log(err);
                    if (!err) {
                        console.info_log("Add task to task queue success:taskType is setAGProfile by ddpv5L2");
                    } else {
                        console.error_log("Add task to task queue failed:taskType is setAGProfile by ddpv5L2");
                    }
                });
            }
            if (network.discover.layer3) {
                let queue3 = {
                    taskType: {config: common.taskType.config.tempTask},
                    tempTaskType: "ddpv5L34",
                    ddpv5Func: {
                        action: "setAGProfile",
                        device: {
                            ip: device.deviceIPAddr,
                            mac: device.MACAddr,
                            systemServerPrecedence: 7,
                            authentic: authentic,
                            ddpVersion: "V5"
                        },
                        info: {
                            agentGroupUUID: network.agentUUID,
                            NMSurl: nmsURL,
                            msgInterval: keepAlive
                        }
                    },
                    createTime: now,
                    executeTime: now,
                    serverMarks: [],
                    uuid: network.agentUUID,
                    uuidMode: 'Agent'
                };
                taskQueue.createSpecialDDPTask(queue3, function (err, data) {
                    if (!err) {
                        console.info_log("Add task to task queue success:taskType is setAGProfile by ddpv5L34");
                    } else {
                        console.error_log("Add task to task queue failed:taskType is setAGProfile by ddpv5L34");
                    }
                });
            }

        } else {
            console.info_log("Add task to task queue failed:no CoreServer is online.");
        }
    });

};

exports.addAPAllowedClient = function (client) {
    CoreServerInfo.findAllOnlineServer((err, result)=> {
        if (result && result.length > 0) {
            let now = moment();

            let queue = {
                taskType: {config: common.taskType.config.tempTask},
                tempTaskType: "addAPAllowClient",
                targetId: client.apMACAddr,
                clientInfo: client,
                createTime: now,
                executeTime: now,
                serverMarks: [],
                uuid: client.uuid,
                uuidMode: 'Agent'
            };
            taskQueue.createUniqueTaskByType(queue, function (err, data) {
                if (!err) {
                    console.info_log("Add task to task queue success:taskType is addAPAllowedClient");
                } else {
                    console.error_log("Add task to task queue failed:taskType is addAPAllowedClient");
                }
            });
        } else {
            console.info_log("Add task to task queue failed:no CoreServer is online.");
        }
    });


};