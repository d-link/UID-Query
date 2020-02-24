/**
 * Created by lizhimin on 2016/2/18.
 */
define(["filterModule", "moment"], function (filters, moment) {

    filters.filter('uuid', function () {
        return function (input) {
            var result = "";
            if (input && input.length > 0) {

                for (var i = 0; i < input.length; i++) {
                    var temp = input[i];
                    result += temp.uuid + ' ';
                }
            }
            return result;
        };
    });
    filters.filter('deviceIcon', function () {
        return function (input) {
            // input+=" 2";
            if (typeof input == "string") {
                input = input.replace(/ /g, "_");
                return 'images/deviceImg/product_' + input + '.svg';
            } else {
                return input;
            }
        }
    });

    filters.filter('uuidfilter', function () {
        return function (input) {
            var result = input;
            if (input) {
                result = '';
                for (var i = 0; i < input.length; i++) {
                    if (i != 0 && i % 4 == 0) {
                        result += " ";
                    }
                    result += input[i];
                }
            }
            return result;
        }
    });
    filters.filter('iprange', function () {
        return function (input) {
            var result = "";
            if (input && input.length > 0) {
                for (var i = 0; i < input.length; i++) {
                    if (input[i].range) {
                        var temp = input[i].range;
                        result += temp.from + ' - ' + temp.to + ' ';
                    } else {
                        var temp = input[i].subnet;
                        result += " " + temp;
                    }

                }
            }
            return result;
        };
    });

    filters.filter('eventLevel', function () {
        var genderHash = {
            1: 'Critical',
            2: 'Warning',
            3: 'Info'
        };

        return function (input) {
            if (!input) {
                return '';
            } else {
                return genderHash[input];
            }
        };
    });
    filters.filter('responseState', function () {
        var genderHash = {
            1: 'Critical',
            2: 'Warning',
            3: 'Info'
        };

        return function (input) {
            if (!input) {
                return '';
            } else {
                var key = 3;
                if (input > 100) {
                    key = 1;
                } else if (input > 50) {
                    key = 2
                }
                return genderHash[key];
            }
        };
    });

    //notification描述信息解析
    //ex:cpuload is >=20%
    filters.filter('alertDetail', function (utils) {
        return function (input) {
            if (!input) {
                return '';
            } else {
                var str = '';

                if (input.eventType) {
                    var _data;
                    if (Array.isArray(input.events)) {
                        _data = input.events[0];
                    } else {
                        _data = input.events;
                    }
                    if (input.eventType == 'devChange_mac') {
                        str = "MAC is Changed:" + "old mac (" + _data.oldData + "),new mac (" + _data.newData + ")";
                    } else if (input.eventType == 'devChange_soid' || input.eventType == 'macConflict_soid') {
                        str = "SOID is Changed:" + "old soid (" + _data.oldData + "),new soid (" + _data.newData + ")";
                    }
                    else if (input.eventType == 'macConflict_ip') {
                        str = "IP Address is Changed:" + "old ip (" + _data.oldData + "),new ip (" + _data.newData + ")";
                    }
                    else if (input.eventType == 'macConflict_probe') {
                        str = "Attached probe is Changed:" + "old probe uuid (" + _data.oldData + "),new probe uuid (" + _data.newData + ")";
                    }
                    else {
                        str = '---';
                    }
                } else {
                    if (input.events && input.events.length > 0) {

                        var len = input.events[0].dataSource.length;
                        var _data = input.events[0];
                        if (input.monitorType == 'Trap') {
                            temp = _data[0].fieldValue[0].message;
                            for (var i = 0; i < temp.length; i++) {
                                str += temp[i];
                            }
                        } else if (input.monitorType == 'Syslog') {
                            str = input[0].fieldValue[0].severity + ":" + input[0].fieldValue[0].log;
                        }
                        else {
                            var unit = '%';
                            for (var i = 0; i < len; i++) {
                                if (_data.monitorParam == 'ratePacketIn' || _data.monitorParam == 'ratePacketOut') {
                                    unit = 'pps';
                                } else if (_data.monitorParam == 'memoryFree') {
                                    unit = 'kb';
                                }
                                if (unit == 'kb') {
                                    str += "(" + _data.monitorParam + " " + _data.condition.expression + " " + utils.changeUnit(_data.condition.threshold, 'B');
                                } else {
                                    str += "(" + _data.monitorParam + " " + _data.condition.expression + " " + _data.condition.threshold + unit;
                                }
                                str += " for " + _data.condition.repeatTime + " times)";
                                if (len > 1 && i < len - 1) {
                                    str += ' AND ';
                                }
                            }
                        }
                    }
                }

                return str;
            }
        }
    });
    filters.filter('notification_commonFilter', function ($filter, utils) {
        return function (input) {
            if (!input) {
                return '';
            } else {
                var str = '';
                var unit = '%';
                var len = input.dataSource.length;
                if (input.monitorParam == 'memoryUtilization') {
                    unit = '%';
                } else if (input.monitorParam == 'memoryFree') {
                    unit = 'kb';
                }
                if (unit == 'kb') {
                    str += "(" + input.monitorParam + " " + input.condition.expression + " " + utils.changeUnit(input.condition.threshold, 'b');
                } else {
                    str += "(" + input.monitorParam + '  ' + input.condition.expression + " " + input.condition.threshold + unit;
                }
                str += " for " + input.condition.repeatTime + " times";
                var field = "";
                for (var j = 0; j < len; j++) {
                    var temp1 = input.dataSource[j].fieldValue;
                    var temp = parseFloat(temp1);
                    var tempfloat = isNaN(temp) ? temp1 : temp.toFixed(2);
                    field += $filter('date')(input.dataSource[j].time, 'yyyy-MM-dd HH:mm:ss') + "  ";
                    if (unit == 'kb' && !isNaN(temp)) {
                        field += utils.changeUnit(tempfloat, 'b');
                    } else {
                        field += tempfloat + unit;
                    }

                    if (j < len - 1) {
                        field += ",";
                    }
                }

                str += "; Values:[" + field + "])";
                if (len > 1 && i < len - 1) {
                    str += ' AND ';
                }
                return str;
            }
        };
    })
    filters.filter('notification_trapFilter', function () {
        return function (input) {
            if (!input) {
                return '';
            } else {
                var str = input[0].fieldValue[0].message;
                var temp = '';
                for (var i = 0; i < str.length; i++) {
                    temp += str[i];
                }
                return temp;
            }
        };
    })
    filters.filter('notification_syslogFilter', function () {
        return function (input) {
            if (!input) {
                return '';
            } else {
                var str = input[0].fieldValue[0].severity + ":" + input[0].fieldValue[0].log;

                return str;
            }
        };
    })
    filters.filter('bitsFilter', function (utils) {
        return function (input) {
            if (!input || input == 0) {
                return '';
            } else {
                return utils.ConvertToUnit(input, true);
            }
        };
    })
    filters.filter('bitsTobytesFilter', function (utils) {
        return function (input) {
            if (!input || input == 0) {
                return '';
            } else {
                return utils.ConvertToUnit(input, true);
            }
        };
    })
    filters.filter('bytesFilter', function (utils) {
        return function (input) {
            if (!input || input == 0) {
                return '';
            } else {
                return utils.ConvertToUnit(input, false);
            }
        };
    })
    filters.filter('MBFilter', function (utils) {
        return function (input) {
            if (!input || input == 0) {
                return '';
            } else {
                return utils.ConvertMBToUnit(input);
            }
        };
    })
    filters.filter('radioTypeFilter', function () {
        return function (input) {
            var result = '';
            if (!input) {
                return '';
            } else {
                if (input.type24 && input.type24.length > 0) {
                    for (var i = 0; i < input.type24.length; i++) {
                        if (result.length > 0) {
                            result += input.type24[i].replace(/11/, "/");
                        } else {
                            result += input.type24[i].replace(/11/, "");
                        }
                    }
                }
                if (input.type5 && input.type5.length > 0) {
                    for (var i = 0; i < input.type5.length; i++) {

                        if (result.length > 0) {
                            result += input.type5[i].replace(/11/, "/");
                        } else {
                            result += input.type5[i].replace(/11/, "");
                        }
                    }
                }
                return ("802.11" + result);
            }
        };
    })
    filters.filter('legacyClient', function () {
        return function (input) {
            var result = '';
            if (!input) {
                return 'NO';
            } else {
                return 'YES';
            }
        };
    })
    filters.filter('bandFilter', function (TS) {
        return function (input) {
            var result = TS.ts('configuration.band' + input);
            return result;
        };
    })
    filters.filter('bandTypeFilter', function (TS) {
        return function (input) {
            var result = TS.ts('about.band' + input);
            return result;
        };
    })
    filters.filter('managedByNMSFilter', function () {
        return function (input) {
            var result = 'standalone';
            if (input == 0) {
                result = 'standalone';
            }
            if (input == 1) {
                result = 'unregistered';
            }
            if (input == 2) {
                result = 'boarding';
            }
            if (input == 3) {
                result = 'managed';
            }
            if (input == 4) {
                result = 'unmanaged';
            }
            return result;
        };
    })

    filters.filter('unitFilter', function (utils) {
        return function (input, unit) {
            if (!input || input == 0) {
                return '0 Byte';
            } else {
                return utils.ConvertBytesByUnit(input, unit);
            }
        };
    })
    filters.filter('uptimeFilter', function () {
        return function (uptime) {
            let sysUptime = "00:00:00.00";
            if (uptime) {
                sysUptime = uptime;
                if (!isNaN(uptime)) {
                    var uptime = parseInt(uptime);
                    let milliSeconds = uptime % 100;
                    uptime = parseInt(uptime / 100);
                    let days = parseInt(uptime / (60 * 60 * 24));
                    let hours = parseInt(uptime / (60 * 60)) % 24;
                    if (days > 0) {
                        uptime = parseInt(uptime % (60 * 60 * 24));
                        sysUptime = days + "d " + hours + "h " + parseInt(uptime / 60) % 60 + "m " + parseInt(uptime) % 60 + "s";
                    } else if (hours > 0) {
                        sysUptime = hours + "h " + parseInt(uptime / 60) % 60 + "m " + parseInt(uptime) % 60 + "s";
                    } else {
                        sysUptime = parseInt(uptime / 60) % 60 + "m " + parseInt(uptime) % 60 + "s";
                    }
                }
            }

            return sysUptime;
        }
    });
    filters.filter('autoFilterForChannel', function () {
        return function (input) {
            if (input == 0) {
                return 'auto';
            }
            ;
            return input;
        };
    });
    filters.filter('autoFilterForPower', function () {
        return function (input) {
            if (input == 'default') {
                return 'default';
            }
            ;
            return input + '%';
        };
    })
    filters.filter('supplierFilter', function () {
        return function (supplier) {
            if (supplier) {
                return supplier.year + "," + supplier.name;
            }
            return " ";
        };
    });
    /**
     * @method 把所有mac地址中的大写字母换成小写--filter
     * @param ISOTime
     * @author 李莉红
     * @version
     * */
    filters.filter('macToLowerCaseFilter', function () {
        return function (mac) {
            if (mac) {
                return mac.toLowerCase();
            }
            return " ";
        };
    });
    /**
     * @method 将数据库存的ios时间根据板子的时间转换显示在浏览器里--filter
     * @param ISOTime
     * @author 李莉红
     * @version
     * */
    filters.filter('ISOTimeFilter', function () {
        return function (ISOTime) {
            if (ISOTime) {
                var time = ISOTime.replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '');
                time = time.replace(/Z/g, ' ');
                var date = moment(time).utcOffset(-NCTimeOffset)._d;
                var str = "";
                var month = date.getMonth() + 1;
                if (month < 10) month = "0" + month;
                var day = date.getDate();
                if (day < 10) day = "0" + day;
                var hour = date.getHours();
                if (hour < 10) hour = "0" + hour;
                var minute = date.getMinutes();
                if (minute < 10) minute = "0" + minute;
                var second = date.getSeconds();
                if (second < 10) second = "0" + second;
                str += date.getFullYear().toString() + "-" + month.toString() + "-" + day + " " + hour + ":" + minute + ":" + second.toString();
                return str;
            } else {
                return ISOTime;
            }
        };
    })
});