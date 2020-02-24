/**
 * Created by zhangwenyang on 2019/10/10.
 */
'use strict';
var XLSX = require('xlsx');
const async = require('async');
const fs = require('fs');
const util = require("../util");
const db = util.db;
const moment = require('moment');
const TrapDictionary = db.cwmTrapDictionary;
const trapTranslate = require('../trapTranslate');
process.on('message', (config) => {
    console.debug_log('Backup log process receives message: ' + JSON.stringify(config));
    let time = config.time;
    let backupPath = config.backupPath;
    let isAuto = config.isAuto;
    async.parallel([(cb)=> {
        deviceLogSheet(time, cb);
    }, (cb)=> {
        eventLogSheet(time, cb);
    }, (cb)=> {
        sysLogSheet(time, cb);
    }, (cb)=> {
        trapLogSheet(time, cb);
    }
    ], (err, sheets)=> {
        if(err) {
            process.send('Error: ' + err);
        } else {
            //let content = nodeExcel.execute(sheets);
            var isDataEmpty = true;
            for(var i = 0; i < sheets.length; i++) {
                if(sheets[i].data && sheets[i].data.length > 0){
                    isDataEmpty = false;
                    break;
                }
            }
            if(isDataEmpty){
                console.debug_log('Backup log data is empty');
                process.send('Success');
            }
            else {
                var wb = XLSX.utils.book_new();
                for(var i = 0; i < sheets.length; i++) {
                    var data = XLSX.utils.json_to_sheet(sheets[i].data);
                    XLSX.utils.book_append_sheet(wb, data, sheets[i].name);
                }
                //压缩文件
                if (!fs.existsSync(backupPath)) {
                    mkdirsSync(backupPath);
                }
                if (!fs.existsSync(backupPath + "/Log")) {
                    fs.mkdirSync(backupPath + "/Log");
                }
                let filename = '';
                if(time) {
                    filename = moment(time).format('YYYYMMDD');
                }else {
                    filename = getCFGName();
                }
                let filePath = getFileName(backupPath + "/Log", ".xlsx", filename, "log", isAuto);
                // fs.writeFile(filePath, content, 'binary', function (err) {
                //     if (err) {
                //         console.error_log(err);
                //     }
                //     callback(err);
                // });
                XLSX.writeFile(wb, filePath);
                process.send('Success');
            }
        }
    })
});

function deviceLogSheet(time, callback) {
    let taskType = {
        "syncConfig": "Synchronize Device Settings",
        "profile": "Synchronize AP profile",
        "setStatsInterval": "Set Statistics Interval",
        "fwUpgrade": "Firmware Upgrade",
        "sslCertificate": "SSL Certificate Upload",
        "uploadCfg": "Upload Configuration",
        "setApChannelNum": "Set AP Channel Number",
        "setDeviceLocation": "Set Device Location",
        "setDeviceName": "Set Device Name",
        "setApPower": "Set AP Power",
        "setKaInterval": "Set Keep-Alive Interval",
        "removeManagedDevs": "Move to Unmanaged",
        "addManageDevs": "Move to Managed",
        "deleteIgnorDev": "Delete Device",
        "getNeighborApInfo": "Retrieve Neighbor AP Information",
        "reboot": "Reboot",
        "unblockClient": "Unblock Client",
        "blockClient": "Block Client",
        "ddpDiscover": "DDP Discover",
        "ddpv5L2": "DDPv5L2",
        "ddpv5L34": "DDPv5L34",
        "registerDevice": "Register Device",
        "channelIpChanged": "Channel or IP Address Changed"
    }
    db.cwmDeviceLog.getDeviceLogByTime(time, (err, result)=> {
        if (!err) {
            /*
            let sheet = {name: "Device-Log"};
            // sheet.stylesXmlFile = "styles.xml";
            sheet.stylesXmlFile=path.join(__dirname,"../styles.xml");
            // conf.stylesXmlFile = "styles.xml";
            sheet.cols = [{
                caption: 'Log Time',
                type: 'string',
                width: 30
            }, {
                caption: 'Name',
                type: 'string'
            }, {
                caption: 'IP Address',
                type: 'string'
            }, {
                caption: 'MAC Address',
                type: 'string'
            }, {
                caption: 'Operation Type',
                type: 'string'
            }, {
                caption: 'Result',
                type: 'string'
            }, {
                caption: 'Log Details',
                type: 'string',
                width: 200
            }];
            sheet.rows = [];
            for (let data of result) {
                let row = [];
                row.push(moment(data.logTime).format("YYYY-MM-DD HH:mm:ss"));
                row.push(data.target.name);
                row.push(data.target.ip);
                row.push(data.target.mac);
                row.push(taskType[data.taskType]);
                row.push(data.resultType ? data.resultType : '');
                row.push(data.message1);
                sheet.rows.push(row);
            }
            sheet = JSON.parse(JSON.stringify(sheet));
            */
            let sheet = {name: "Device-Log", data: []};
            if(!result || result.length <= 0){
                callback(err, sheet);
                return;
            }
            for (let data of result) {
                let row = {};
                row['Log Time'] = (moment(data.logTime).format("YYYY-MM-DD HH:mm:ss"));
                row['Name'] = data.target.name;
                row['IP Address'] = data.target.ip;
                row['MAC Address'] = data.target.mac;
                row['Operation Type'] = taskType[data.taskType];
                row['Result'] = data.resultType ? data.resultType : '';
                row['Log Details'] = data.message1;
                sheet.data.push(row);
            }
            callback(err, sheet);
        } else {
            callback(err, null);
        }
    })

}
function eventLogSheet(time, callback) {
    var logType = {
        1: "Device Management",
        2: "Synchronization",
        3: "Duplicate Task",
        4: "Timeout Task",
        5: "Invalid HTTP Message",
        6: "Initialization",
        7: "Validate Http Message",
        8: "Backup"
    };
    db.cwmSystemEventLog.getSystemEventLogByTime(time, (err, result)=> {
        if (!err) {
            /*
            let sheet = {name: "System-Event-Log"};
            sheet.stylesXmlFile=path.join(__dirname,"../styles.xml");
            sheet.cols = [{
                caption: 'Log Time',
                type: 'string',
                width: 30
            }, {
                caption: 'Event Type',
                type: 'string'
            },{
                caption: 'UUID',
                type: 'string'
            }, {
                caption: 'Network',
                type: 'string'
            }, {
                caption: 'IP Address',
                type: 'string'
            }, {
                caption: 'MAC Address',
                type: 'string'
            }, {
                caption: 'Message',
                type: 'string',
                width: 200
            }];
            sheet.rows = [];
            for (let data of result) {
                let row = [];
                row.push(moment(data.logTime).format("YYYY-MM-DD HH:mm:ss"));
                row.push(logType[data.logType]);
                row.push(data.uuid ? data.uuid : '');
                row.push(data.network ? data.network : '');
                row.push(data.ip ? data.ip : '');
                row.push(data.mac ? data.mac : '');
                row.push(data.message);
                sheet.rows.push(row);
            }
            sheet = JSON.parse(JSON.stringify(sheet));
            */
            let sheet = {name: "System-Event-Log", data: []};
            if(!result || result.length <= 0){
                callback(err, sheet);
                return;
            }
            for (let data of result) {
                let row = {};
                row['Log Time'] = moment(data.logTime).format("YYYY-MM-DD HH:mm:ss");
                row['Event Type'] = logType[data.logType];
                row['UUID'] = data.uuid ? data.uuid : '';
                row['Network'] = data.network ? data.network : '';
                row['IP Address'] = data.ip ? data.ip : '';
                row['MAC Address'] = data.mac ? data.mac : '';
                row['Message'] = data.message;
                sheet.data.push(row);
            }
            callback(err, sheet);
        } else {
            callback(err, null);
        }
    })

}

function sysLogSheet(time, callback) {
    var severityHash = {
        0: 'Emergency',
        1: 'Alert',
        2: 'Critical',
        3: 'Error',
        4: 'Warning',
        5: 'Notice',
        6: 'Information',
        7: 'Debug'
    };
    var facilityHash = {
        0: 'kernel messages',
        1: 'user-level messages',
        2: 'mail system',
        3: 'system daemons',
        4: 'security/authorization messages',
        5: 'messages generated internally by syslog',
        6: 'line printer subsystem',
        7: 'network news subsystem',
        8: 'UUCP subsystem',
        9: 'clock daemon',
        10: 'security/authorization',
        11: 'FTP daemon',
        12: 'NTP subsystem',
        13: 'log audit',
        14: 'log alert',
        15: 'scheduling daemon',
        16: 'local use 0 (local0)',
        17: 'local use 1 (local1)',
        18: 'local use 2 (local2)',
        19: 'local use 3 (local3)',
        20: 'local use 4 (local4)',
        21: 'local use 5 (local5)',
        22: 'local use 6 (local6)',
        23: 'local use 7 (local7)'

    };
    db.cwmSyslog.getSysLogByTime(time, (err, result)=> {
        if (!err) {
            /*
            let sheet = {name: "Syslog"};
            sheet.stylesXmlFile=path.join(__dirname,"../styles.xml");
            sheet.cols = [{
                caption: 'Receive Time',
                type: 'string',
                width: 30
            }, {
                caption: 'Log Time',
                type: 'string',
                width: 30
            }, {
                caption: 'Name',
                type: 'string'
            }, {
                caption: 'IP Address',
                type: 'string'
            }, {
                caption: 'Facility',
                type: 'string'
            }, {
                caption: 'Severity',
                type: 'string'
            }, {
                caption: 'Directive Server',
                type: 'string'
            }, {
                caption: 'Message',
                type: 'string',
                width: 200
            }];
            sheet.rows = [];
            for (let data of result) {
                let row = [];
                row.push(moment(data.receiveTime).format("YYYY-MM-DD HH:mm:ss"));
                row.push(moment(data.time,"MMM DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"));
                row.push(data.target.name ? data.target.name : '');
                row.push(data.target.ip);
                row.push(facilityHash[data.facility]);
                row.push(severityHash[data.severity]);
                row.push(data.euDirectiveServer ? data.euDirectiveServer : '');
                row.push(data.log);
                sheet.rows.push(row);
            }
            sheet = JSON.parse(JSON.stringify(sheet));
            */
            let sheet = {name: "Syslog", data: []};
            if(!result || result.length <= 0){
                callback(err, sheet);
                return;
            }
            for (let data of result) {
                let row = [];
                row['Receive Time'] = (moment(data.receiveTime).format("YYYY-MM-DD HH:mm:ss"));
                row['Log Time'] = (moment(data.time,"MMM DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"));
                row['Name'] = (data.target.name ? data.target.name : '');
                row['IP Address'] = (data.target.ip);
                row['Facility'] = (facilityHash[data.facility]);
                row['Severity'] = (severityHash[data.severity]);
                row['Directive Server'] = (data.euDirectiveServer ? data.euDirectiveServer : '');
                row['Message'] = (data.log);
                sheet.data.push(row);
            }
            callback(err, sheet);
        } else {
            callback(err, null);
        }
    })

}
function trapLogSheet(time, callback) {
    db.cwmTraplog.getTrapLogByTime(time, (err, trapDatas)=> {
        if (!err) {
            /*
            let sheet = {name: "Trap-Log"};
            sheet.stylesXmlFile=path.join(__dirname,"../styles.xml");
            sheet.cols = [{
                caption: 'Receive Time',
                type: 'string',
                width: 30
            }, {
                caption: 'Time of Trap',
                type: 'string',
                width: 30
            }, {
                caption: 'Name',
                type: 'string'
            }, {
                caption: 'IP Address',
                type: 'string'
            }, {
                caption: 'SNMP Version',
                type: 'string'
            }, {
                caption: 'Trap Type',
                type: 'string'
            }, {
                caption: 'Trap Details',
                type: 'string',
                width: 200
            }];
            sheet.rows = [];
            async.parallel([(callback)=> {
                TrapDictionary.getTrapOIDItemsByOrgId(null, callback);
            }, (callback)=> {
                TrapDictionary.getBindingVariableItemsByOrgId(null, callback);
            }], (err, result)=> {
                async.map(trapDatas, (_data, callback)=> {
                    trapTranslate.translateTrapOID(result[0], result[1], _data, callback);
                }, (err, result)=> {
                    console.timeEnd("translateTrapOID");

                    console.time("trapTranslate to row");
                    for (let data of result) {
                        let row = [];
                        row.push(moment(data.receiveTime).format("YYYY-MM-DD HH:mm:ss"));
                        row.push(moment(data.time).format("YYYY-MM-DD HH:mm:ss"));
                        row.push(data.target.name ? data.target.name : '');
                        row.push(data.ip ? data.ip : '');
                        row.push(data.snmpVersion);
                        row.push(data.genericType);
                        if (data.message && data.message.length == 2) {
                            row.push(data.message[0] + "  " + data.message[1]);
                        } else {
                            row.push('');
                        }

                        sheet.rows.push(row);
                    }
                    console.timeEnd("trapTranslate to row");
                    sheet = JSON.parse(JSON.stringify(sheet));


                    callback(err, sheet);
                })
            })
            */
            let sheet = {name: "Trap-Log", data: []};
            if(!trapDatas || trapDatas.length <= 0){
                callback(err, sheet);
                return;
            }
            async.parallel([(callback)=> {
                TrapDictionary.getTrapOIDItemsByOrgId(null, callback);
            }, (callback)=> {
                TrapDictionary.getBindingVariableItemsByOrgId(null, callback);
            }], (err, result)=> {
                async.map(trapDatas, (_data, callback)=> {
                    trapTranslate.translateTrapOID(result[0], result[1], _data, callback);
                }, (err, result)=> {
                    for (let data of result) {
                        let row = {};
                        row['Receive Time'] = (moment(data.receiveTime).format("YYYY-MM-DD HH:mm:ss"));
                        row['Time of Trap'] = (moment(data.time).format("YYYY-MM-DD HH:mm:ss"));
                        row['Name'] = (data.target.name ? data.target.name : '');
                        row['IP Address'] = (data.ip ? data.ip : '');
                        row['SNMP Version'] = (data.snmpVersion);
                        row['Trap Type'] = (data.genericType);
                        if (data.message && data.message.length == 2) {
                            row['Trap Details'] = (data.message[0] + "  " + data.message[1]);
                        } else {
                            row['Trap Details'] = ('');
                        }
                        sheet.data.push(row);
                    }
                    callback(err, sheet);
                })
            })
        } else {
            callback(err, null);
        }
    })

};

function getFileName(targetpath, ext, filename, type, isAuto) {
    let count = 1;
    let suffix = (type == "log" ? (isAuto ? "_log_auto" : "_log") : (isAuto ? " _configuration_auto" : "_configuration"));
    let temp = targetpath + "/" + filename + suffix + ext;
    while(fs.existsSync(temp)){
        temp = targetpath + "/" + filename + "-" + count + suffix + ext;
        count++;
    }
    return temp;
};

function getCFGName(){
    let date = moment();
    let toStr = date.format('YYYYMMDD');
    return toStr;
};