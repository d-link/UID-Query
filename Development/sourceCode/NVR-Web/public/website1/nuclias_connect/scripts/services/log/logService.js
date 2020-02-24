/**
 * Created by lizhimin on 11/25/16.
 */
define(["app", "moment"], function (app, moment) {

    app.register.service("LogService", function (ajaxService, Current, TS, $filter, utils) {
        //rules :{snmpVersion:'',genericType:'',timeRange:{from:'date',to:'date'},siteId:'',networkId:'',}
        this.getAllTraps = function (rules, page, success, error) {
            ajaxService.post(base_url + '/log/traplog/getAll', {
                orgId: Current.org().orgId,
                searchRule: rules,
                page: page
            }, success, error);
        };
        //rules:{timeRange:{from:'date',to:'date'},siteId:'',networkId:'','severity':1}
        this.getAllSyslogs = function (rules, page, success, error) {
            ajaxService.post(base_url + '/log/syslog/getAll', {
                orgId: Current.org().orgId,
                searchRule: rules,
                page: page
            }, success, error);
        };
        //rules:{timeRange:{from:'date',to:'date'},siteId:'',networkId:'','severity':1}
        this.getEUSyslogs = function (rules, page, success, error) {
            ajaxService.post(base_url + '/log/syslog/getEU', {
                orgId: Current.org().orgId,
                searchRule: rules,
                page: page
            }, success, error);
        };
        //rules:{timeRange:{from:'date',to:'date'},siteId:'',networkId:'','taskType':''}
        this.getAllDevs = function (rules, page, success, error) {
            ajaxService.post(base_url + '/log/devicelog/getAll', {
                orgId: Current.org().orgId,
                searchRule: rules,
                page: page
            }, success, error);
        };
        //rules:{timeRange:{from:'date',to:'date'},siteId:'',networkId:'','logType':''}
        this.getAllEvents = function (rules, page, success, error) {
            ajaxService.post(base_url + '/log/eventlog/getAll', {
                orgId: Current.org().orgId,
                searchRule: rules,
                page: page
            }, success, error);
        };
        this.getAllOperateLogs = function (time, success, error) {
            ajaxService.post(base_url + '/log/operatelog/getAll', {
                orgId: Current.org().orgId,
                time: time
            }, success, error);
        };
        this.getAllNotification = function (success, error) {
            ajaxService.post(base_url + '/log/notifylog/getAll', {orgId: Current.org().orgId}, success, error);
        };
        this.sortSyslog = function (nulls, a, b, filtername) {
            if (nulls !== null) {
                return nulls;
            } else {
                a = $filter(filtername)(a);
                b = $filter(filtername)(b);
                return a.localeCompare(b);
            }
        };
        this.exportTraplog = function (rules, callback) {
            ajaxService.post(base_url + '/log/traplog/getAll', {
                orgId: Current.org().orgId,
                searchRule: rules
            }, function (result) {
                var array = [];
                array.push(TS.ts('column.receiveTime'));
                array.push(TS.ts('column.trapTime'));
                array.push(TS.ts('column.name'));
                array.push(TS.ts('column.ipv4'));
                array.push(TS.ts('column.snmpVersion'));
                array.push(TS.ts('column.trapType'));
                array.push(TS.ts('column.trapMsg'));
                var logItem = result.data;
                var outStr = "";
                for (var i = 0; i < array.length; i++) {//这里是写入列名，即在页面上显示的名称
                    var temp = (array[i]);
                    if (temp != null && temp != "") {
                        outStr += "\"" + temp + "\",";
                    }
                }
                outStr.substring(0, outStr.lastIndexOf(',') - 1);
                outStr += "\r\n";
                if (logItem && logItem.length > 0) {
                    for (i = 0; i < logItem.length; i++) {//这里是界面上的字段和返回的json中的数据字段匹配，匹配的就是界面要求显示的，不匹配的就不输出
                        var dataObj = logItem[i];
                        var tempTime = dataObj.receiveTime.replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '').replace(/Z/g, ' ');
                        dataObj.receiveTime = moment(tempTime).utcOffset(-NCTimeOffset)._d;
                        outStr += "\"" + $filter('date')(dataObj.receiveTime, "yyyy-MM-dd HH:mm:ss") + "\",";
                        outStr += "\"" + $filter('date')(dataObj.time, "yyyy-MM-dd HH:mm:ss") + "\",";
                        outStr += "\"" + dataObj.target.name + "\",";
                        outStr += "\"" + dataObj.ip + "\",";
                        outStr += "\"" + dataObj.snmpVersion + "\",";
                        outStr += "\"" + (dataObj.genericType) + "\",";
                        outStr += "\"" + (dataObj.message) + "\"";
                        outStr += "\r\n";
                    }
                }
                //utils.getNodeTime(function () {
                var date = NCTime.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "");
                var filename = "NucliasConnect_Traplog_" + date + ".csv";
                callback(outStr, filename);
                //});
            });

        };
        this.exportSyslog = function (rules, callback) {
            ajaxService.post(base_url + '/log/syslog/getAll', {
                orgId: Current.org().orgId,
                searchRule: rules
            }, function (result) {
                var array = [];
                array.push(TS.ts('column.receiveTime'));
                array.push(TS.ts('column.logTime'));
                array.push(TS.ts('column.name'));
                array.push(TS.ts('column.ipv4'));
                array.push(TS.ts('column.facility'));
                array.push(TS.ts('column.severity'));
                array.push(TS.ts('column.euServer'));
                array.push(TS.ts('column.message'));
                var logItem = result.data;
                var outStr = "";
                for (var i = 0; i < array.length; i++) {//这里是写入列名，即在页面上显示的名称
                    var temp = (array[i]);
                    if (temp != null && temp != "") {
                        outStr += "\"" + temp + "\",";
                    }
                }
                outStr.substring(0, outStr.lastIndexOf(',') - 1);
                outStr += "\r\n";
                if (logItem && logItem.length > 0) {
                    for (i = 0; i < logItem.length; i++) {//这里是界面上的字段和返回的json中的数据字段匹配，匹配的就是界面要求显示的，不匹配的就不输出
                        var dataObj = logItem[i];
                        var tempTime = dataObj.receiveTime.replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '').replace(/Z/g, ' ');
                        dataObj.receiveTime = moment(tempTime).utcOffset(-NCTimeOffset)._d;
                        outStr += "\"" + $filter('date')(dataObj.receiveTime, "yyyy-MM-dd HH:mm:ss") + "\",";
                        outStr += "\"" + $filter('date')(dataObj.time, "yyyy-MM-dd HH:mm:ss") + "\",";
                        outStr += "\"" + dataObj.target.name + "\",";
                        outStr += "\"" + dataObj.ip + "\",";
                        outStr += "\"" + $filter('syslog_facility')(dataObj.facility) + "\",";
                        outStr += "\"" + $filter('syslog_severity')(dataObj.severity) + "\",";
                        outStr += "\"" + (dataObj.euDirectiveServer) + "\",";
                        outStr += "\"" + (dataObj.log) + "\"";
                        outStr += "\r\n";
                    }
                }
                //utils.getNodeTime(function () {
                var date = NCTime.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "");
                var filename = "NucliasConnect_Syslog_" + date + ".csv";
                callback(outStr, filename);
                //});
            });
        };
        this.exportEUlog = function (rules, callback) {
            ajaxService.post(base_url + '/log/syslog/getEU', {
                orgId: Current.org().orgId,
                searchRule: rules
            }, function (result) {
                var array = [];
                array.push(TS.ts('column.receiveTime'));
                array.push(TS.ts('column.logTime'));
                array.push(TS.ts('column.apMAC'));
                array.push(TS.ts('column.stationMAC'));
                array.push(TS.ts('column.authType'));
                array.push(TS.ts('column.userId'));
                array.push(TS.ts('column.action'));
                array.push(TS.ts('column.message'));
                var logItem = result.data;
                var outStr = "";
                for (var i = 0; i < array.length; i++) {//这里是写入列名，即在页面上显示的名称
                    var temp = (array[i]);
                    if (temp != null && temp != "") {
                        outStr += "\"" + temp + "\",";
                    }
                }
                outStr.substring(0, outStr.lastIndexOf(',') - 1);
                outStr += "\r\n";
                if (logItem && logItem.length > 0) {
                    for (i = 0; i < logItem.length; i++) {//这里是界面上的字段和返回的json中的数据字段匹配，匹配的就是界面要求显示的，不匹配的就不输出
                        var dataObj = logItem[i];
                        var tempTime = dataObj.receiveTime.replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '').replace(/Z/g, ' ');
                        dataObj.receiveTime = moment(tempTime).utcOffset(-NCTimeOffset)._d;
                        outStr += "\"" + $filter('date')(dataObj.receiveTime, "yyyy-MM-dd HH:mm:ss") + "\",";
                        outStr += "\"" + $filter('date')(dataObj.time, "yyyy-MM-dd HH:mm:ss") + "\",";
                        outStr += "\"" + dataObj.target.mac + "\",";
                        if (dataObj.clientMACAddr) {
                            outStr += "\"" + dataObj.clientMACAddr + "\",";
                        } else {
                            outStr += "\"" + " " + "\",";
                        }
                        if (dataObj.authType) {
                            outStr += "\"" + dataObj.authType + "\",";
                        } else {
                            outStr += "\"" + " " + "\",";
                        }
                        if (dataObj.userName) {
                            outStr += "\"" + dataObj.userName + "\",";
                        } else {
                            outStr += "\"" + " " + "\",";
                        }
                        outStr += "\"" + $filter('euLogActionFilter')(dataObj.action) + "\",";
                        outStr += "\"" + (dataObj.log) + "\"";
                        outStr += "\r\n";
                    }
                }
                //utils.getNodeTime(function () {
                var date = NCTime.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "");
                var filename = "NucliasConnect_EUlog_" + date + ".csv";
                callback(outStr, filename);
                //});
            });
        }

        this.exportDevicelog = function (rules, callback) {
            ajaxService.post(base_url + '/log/devicelog/getAll', {
                orgId: Current.org().orgId,
                searchRule: rules
            }, function (result) {
                var array = [];
                array.push(TS.ts('column.logTime'));
                array.push(TS.ts('column.name'));
                array.push(TS.ts('column.ipv4'));
                array.push(TS.ts('column.mac'));
                array.push(TS.ts('column.taskType'));
                array.push(TS.ts('column.result'));
                array.push(TS.ts('column.resultMsg'));
                var logItem = result.data;
                var outStr = "";
                for (var i = 0; i < array.length; i++) {//这里是写入列名，即在页面上显示的名称
                    var temp = (array[i]);
                    if (temp != null && temp != "") {
                        outStr += "\"" + temp + "\",";
                    }
                }
                outStr.substring(0, outStr.lastIndexOf(',') - 1);
                outStr += "\r\n";
                if (logItem && logItem.length > 0) {
                    for (i = 0; i < logItem.length; i++) {//这里是界面上的字段和返回的json中的数据字段匹配，匹配的就是界面要求显示的，不匹配的就不输出
                        var dataObj = logItem[i];
                        var tempTime = dataObj.logTime.replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '').replace(/Z/g, ' ');
                        dataObj.logTime = moment(tempTime).utcOffset(-NCTimeOffset)._d;
                        outStr += "\"" + $filter('date')(dataObj.logTime, "yyyy-MM-dd HH:mm:ss") + "\",";
                        outStr += "\"" + dataObj.target.name + "\",";
                        outStr += "\"" + dataObj.target.ip + "\",";
                        outStr += "\"" + dataObj.target.mac + "\",";
                        outStr += "\"" + TS.ts('devicelog.' + dataObj.taskType) + "\",";
                        if (!dataObj.resultType) {
                            dataObj.resultType = "";
                        }
                        outStr += "\"" + dataObj.resultType + "\",";
                        if (!dataObj.resultType || dataObj.resultType == "Success") {
                            if (!dataObj.message1) {
                                dataObj.message1 = "";
                            }
                            outStr += "\"" + dataObj.message1 + "\"";
                        } else if (dataObj.resultType != "Success" || dataObj.execResult != "Success") {
                            if (!dataObj.execResult) {
                                dataObj.execResult = "";
                            }
                            outStr += "\"" + dataObj.execResult + "\"";
                        }
                        outStr += "\r\n";
                    }
                }
                //utils.getNodeTime(function () {
                var date = NCTime.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "");
                var filename = "NucliasConnect_Devicelog_" + date + ".csv";
                callback(outStr, filename);
                //});
            });
        }
        this.exportEventlog = function (rules, callback) {
            ajaxService.post(base_url + '/log/eventlog/getAll', {
                orgId: Current.org().orgId,
                searchRule: rules
            }, function (result) {
                var array = [];
                array.push(TS.ts('column.logTime'));
                array.push(TS.ts('column.eventType'));
                array.push(TS.ts('column.network'));
                array.push(TS.ts('column.mac'));
                array.push(TS.ts('column.ipv4'));
                array.push(TS.ts('column.message'));
                var logItem = result.data;
                var outStr = "";
                for (var i = 0; i < array.length; i++) {//这里是写入列名，即在页面上显示的名称
                    var temp = (array[i]);
                    if (temp != null && temp != "") {
                        outStr += "\"" + temp + "\",";
                    }
                }
                outStr.substring(0, outStr.lastIndexOf(',') - 1);
                outStr += "\r\n";
                if (logItem && logItem.length > 0) {
                    for (i = 0; i < logItem.length; i++) {//这里是界面上的字段和返回的json中的数据字段匹配，匹配的就是界面要求显示的，不匹配的就不输出
                        var dataObj = logItem[i];
                        var tempTime = dataObj.logTime.replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '').replace(/Z/g, ' ');
                        dataObj.logTime = moment(tempTime).utcOffset(-NCTimeOffset)._d;
                        outStr += "\"" + $filter('date')(dataObj.logTime, "yyyy-MM-dd HH:mm:ss") + "\",";
                        outStr += "\"" + TS.ts('systemlog.logType' + dataObj.logType) + "\",";
                        outStr += "\"" + (dataObj.network ? dataObj.network : " ") + "\",";
                        outStr += "\"" + dataObj.mac + "\",";
                        outStr += "\"" + dataObj.ip + "\",";
                        outStr += "\"" + (dataObj.message) + "\"";
                        outStr += "\r\n";
                    }
                }
                //utils.getNodeTime(function () {
                var date = NCTime.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "");
                var filename = "NucliasConnect_SystemEventlog_" + date + ".csv";
                callback(outStr, filename);
                //});
            });
        }
    });
});