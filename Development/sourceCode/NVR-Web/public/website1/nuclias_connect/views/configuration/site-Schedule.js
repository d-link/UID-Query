/**
 * Created by lizhimin on 2017/6/9.
 */
define(["app"], function (app) {
    app.register.controller('siteScheduleController', function ($scope, Current, BatchConfigService, utils, $timeout, TS) {
        $scope.hasPrivilege = Current.user().role == "root admin" || Current.user().role == "local admin";
        /*
         * 页面固定参数
         */
        $scope.state = {
            schedule: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgTrue: 'configuration.schedule.msgTrue',
                msgFalse: 'Error'
            },
        };

        function initScheduleState() {
            $scope.state.schedule.processing = false;
            $scope.state.schedule.isSuccess = false;
            $scope.state.schedule.isError = false;
        };
        initScheduleState();
        $scope.scheduleChange = function () {
            initScheduleState();
        };
        $scope.statuses = ['0', 1];
        // $scope.scheduleIndexes = ['primary_band24', 'ssid1_band24', 'ssid2_band24', 'ssid3_band24', 'ssid4_band24',
        //     'ssid5_band24', 'ssid6_band24', 'ssid7_band24', 'primary_band5', 'ssid1_band5', 'ssid2_band5', 'ssid3_band5',
        //     'ssid4_band5', 'ssid5_band5', 'ssid6_band5', 'ssid7_band5'];
        $scope.scheduleIndexes = ['0', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
        // 0 = Primary SSID 2.4GHz, 1 = SSID 1 2.4GHz,2 = SSID 2 2.4GHz…7 = SSID 7 2.4GHz, 8 = Primary SSID 5GHz,9 = SSID 1 5GHz… 15 = SSID 7 5GHz
        // 设置SSID 默认值
        $scope.ssidNames = [];
        $scope.scheduleIndexes.forEach(function (i) {
            $scope.ssidNames[i] = 'dlink';
        });

        $scope.weekendItems = [1, 2, 4, 8, 16, 32, 64];
        // Sun 1 Mon 2 Tue 4 Wed 8 Thu 16 Fri 32 Sat 64 All week 0
        // time
        // 时间控件时间
        //改成板子时间---------llh
        $scope.scheduleValue = {};
        /**
         * @method 以NCTime也就是后台时间为准
         * @author 李莉红
         * @version
         * */
        //utils.getNodeTime(function () {
        $scope.scheduleValue.startTime = new Date(NCTime);
        //开始时间不能跟结束时间相等
        var temTime = utils.format((new Date(NCTime).getTime() + 60000), 'yyyy-MM-dd HH:mm:ss');
        $scope.scheduleValue.endTime = new Date(temTime);
        $scope.ismeridian = true;
        $scope.hstep = 1;
        $scope.mstep = 5;
        $scope.timeOverRange = false;
        //});

        $scope.timeNotSame = false;
        $scope.disableTimeOverNight = false;
        $scope.timeChanged = function (start) {
            var shour = $scope.scheduleValue.startTime.getHours(),
                sminute = $scope.scheduleValue.startTime.getMinutes();
            var ehour = $scope.scheduleValue.endTime.getHours(),
                eminute = $scope.scheduleValue.endTime.getMinutes();
            if (!$scope.temporary.overnight) {
                if (shour > ehour) {//开始时间大于结束时间的时候显示提示
                    $scope.timeOverRange = true;
                    $scope.timeNotSame = false;
                    enableCheckbox();
                } else if (shour == ehour) {
                    if (sminute > eminute) {
                        $scope.timeOverRange = true;
                        $scope.timeNotSame = false;
                        enableCheckbox();
                    } else if (sminute < eminute) {//开始时间小于结束时间
                        $scope.timeOverRange = false;
                        $scope.timeNotSame = false;
                        disableCheckbox();
                    } else {//等于的时候，弹出不可以等于，并且不能添加
                        $scope.timeOverRange = false;
                        $scope.timeNotSame = true;
                        //return false;
                        disableCheckbox();
                    }
                } else if (shour < ehour) {
                    //开始时间小于结束时间的时候要disable掉checkbox并且提示
                    //checkbox的不可点击显示
                    $scope.timeOverRange = false;
                    $scope.timeNotSame = false;
                    disableCheckbox();
                } else {
                    $scope.timeOverRange = false;
                    $scope.timeNotSame = false;
                    enableCheckbox();
                }
            } else {
                $scope.timeOverRange = false;
                $scope.timeNotSame = false;
                if (shour < ehour) {
                    //开始时间小于结束时间的时候要disable掉checkbox并且提示
                    //checkbox的不可点击显示
                    $scope.temporary.overnight = false;
                    document.getElementById("enable_schedule_checkbox").children[0].class = "ng-isolate-scope ng-hide";
                    disableCheckbox();
                } else if (shour == ehour) {
                    if (sminute > eminute) {
                        $scope.timeNotSame = false;
                        enableCheckbox();
                    } else if (sminute < eminute) {//开始时间小于结束时间
                        $scope.temporary.overnight = false;
                        $scope.timeNotSame = false;
                        document.getElementById("enable_schedule_checkbox").children[0].class = "ng-isolate-scope ng-hide";
                        disableCheckbox();
                    } else {
                        $scope.timeNotSame = true;
                        disableCheckbox();
                        //return false;
                    }
                } else {
                    enableCheckbox();
                }
            }
            if (typeof start === 'boolean') {
                processing.timeChanged(start)
            }

        };

        function disableCheckbox() {
            $scope.disableTimeOverNight = true;
            document.getElementById("enable_schedule_checkbox").style.backgroundColor = "#f5f5f5";
            document.getElementById("enable_schedule_checkbox").style.border = "1px dashed #ddd";
            document.getElementById("enable_schedule_checkbox").style.color = "#aaa";
        }

        function enableCheckbox() {
            $scope.disableTimeOverNight = false;
            document.getElementById("enable_schedule_checkbox").style.backgroundColor = "";
            document.getElementById("enable_schedule_checkbox").style.border = "";
            document.getElementById("enable_schedule_checkbox").style.color = "";
        }

        $scope.toggledStart = function (open) {
            var input = document.getElementById("startTime");
            open ? input.focus() : input.blur();
        };
        $scope.toggledEnd = function (open) {
            var input = document.getElementById("endTime");
            open ? input.focus() : input.blur();
        };
        $scope.indexChoice = function (item, model) {
            $scope.temporary.ssid = $scope.ssidNames[item];
        };
        // grid
        $scope.scheduleOptions = {
            columnDefs: [
                {
                    name: 'wirelessStatus',
                    displayName: TS.ts('column.status'),
                    width: "10%",
                    enableHiding: false,
                    sort: {
                        direction: 'asc',
                        priority: 1
                    },
                    cellTemplate: "<div class='ui-grid-cell-contents'><switch class='switch-default' ng-model='row.entity.nodeStatus'></switch></div>"
                },
                {
                    name: 'ruleName', enableHiding: false, sort: {
                        direction: 'asc',
                        priority: 2
                    }, displayName: TS.ts('column.name'), width: "10%"
                },
                {
                    name: 'ssidIndex', enableHiding: false, displayName: TS.ts('column.ssidIndex'), width: "15%",
                    cellTemplate: "<div class='ui-grid-cell-contents'>{{'configuration.schedule.ssid' + (row.entity.ssidIndex) | translate}}</div>"
                },
                // {name: 'ssid', displayName: 'SSID', width: "10%"},
                {
                    name: 'daysSelect', enableHiding: false, displayName: TS.ts('column.days'), width: "30%",
                    cellTemplate: "<div class='ui-grid-cell-contents'><span ng-repeat='day in (row.entity.daysSelect[0]==0?grid.appScope.weekendItems:row.entity.daysSelect)'>{{'configuration.schedule.week' + day | translate}}&nbsp;</span></div>"
                },
                {
                    name: 'Time Frame', enableHiding: false, displayName: TS.ts('column.timeFrame'), width: "15%",
                    cellTemplate: "<div class='ui-grid-cell-contents'>{{row.entity.allDaySelect=='1'?'label.allDay':(row.entity.startTime+'-'+row.entity.endTime)|translate}}</div>"

                },
                {
                    name: 'Wireless', enableHiding: false, displayName: TS.ts('column.wireless'), width: "10%",
                    cellTemplate: "<div class='ui-grid-cell-contents'>{{'configuration.perf.on'|translate}}</div>"
                },
                {
                    name: TS.ts('column.action'),
                    minWidth: "100", enableHiding: false, enableSorting: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><a class='btn-grid' ng-if='grid.appScope.power.hasEdit()'  title=\'" + TS.ts('column.edit') + "\'  ng-click='grid.appScope.editRule(row.entity)'><md-icon md-svg-icon='user:edit'></md-icon></a>" +
                        "<a class='btn-grid'  ng-if='grid.appScope.power.hasDelete()' ng-click='grid.appScope.removeRule(row.entity)' title=\'" + TS.ts('column.delete') + "\'><md-icon md-svg-icon='user:remove'></md-icon></a></div>"
                }
            ]
        };
        var userInfo = Current.user();
        $scope.power = {
            hasDelete: function () {
                if (userInfo.role == 'root admin') {
                    return true;
                }
                return false;
            },
            hasEdit: function () {
                if (userInfo.role == 'root admin') {
                    if ($scope.scheduleShowData.status == 1) {
                        return true;
                    }
                }
                return false;
            }
        }

        /*
         * 数据绑定
         */
        $scope.scheduleShowData = angular.copy($scope.scheduleData);
        $scope.scheduleOptions.data = $scope.scheduleShowData.ruleList || [];
        $timeout(function () {
            setGridHeight('scheduleGrid', true, 368);
        }, 100);

        /*
         * schedule时间验证列表
         * 相同ssidIndex下 需要对比的数据
         */
        function getContrastList(ssidIndex) {
            var contrastList = [];

            $scope.scheduleOptions.data.forEach(function (r) {
                if (r.ssidIndex == ssidIndex) {
                    if (!$scope.editRuleStatus || r.$$hashKey != $scope.editRuleStatus) {
                        var contrast = getContrast(r);
                        contrastList.push(contrast);
                    }
                }
            });
            return contrastList;
        }

        // 计算规则占用的时间区间
        function getContrast(data) {
            var weekTime = {
                1: 0,
                2: 1440,
                4: 2880,
                8: 4320,
                16: 5760,
                32: 7200,
                64: 8640
            };
            var contrast = [];
            if (data.daysSelect[0] == 0) {
                // all week 计算
                if (data.allDaySelect == 1) {
                    // all day 一定冲突
                    return false;
                }
                for (var x in weekTime) {
                    var temp = {
                        from: weekTime[x] + (data.startTime.substring(0, 2) - 0) * 60 + (data.startTime.substring(3, 5) - 0),
                        to: weekTime[x] + ((data.overnight == 1 ? 24 : 0) + (data.endTime.substring(0, 2) - 0)) * 60 + (data.endTime.substring(3, 5) - 0)
                    }
                    contrast.push(temp);
                }
            } else {
                // select week 计算
                for (var i = 0; i < data.daysSelect.length; i++) {
                    var temp = {
                        from: weekTime[data.daysSelect[i]] + (data.allDaySelect == 1 ? 0 : ((data.startTime.substring(0, 2) - 0) * 60 + (data.startTime.substring(3, 5) - 0))),
                        to: weekTime[data.daysSelect[i]] + (data.allDaySelect == 1 ? 1440 : (((data.overnight == 1 ? 24 : 0) + (data.endTime.substring(0, 2) - 0)) * 60 + (data.endTime.substring(3, 5) - 0)))
                    }
                    contrast.push(temp);
                }
            }

            return contrast;
        }

        $scope.checkdaysSelect = function () {
            var result = true;
            if ($scope.all.week == 'all') {
                return false;
            }
            for (var i = 0; i < $scope.weekendItems.length; i++) {
                if ($scope.temporary.daysSelect.hasOwnProperty($scope.weekendItems[i])) {
                    if ($scope.temporary.daysSelect[$scope.weekendItems[i]]) {
                        result = false;
                    }
                }
            }
            return result;
        }
        /*
         * 根据已添加SSID赋值名称
         */
        $scope.ssidUseData = angular.copy($scope.ssidData);
        // band 1,2 ssidIndex 1-8
        $scope.ssidUseData.list.forEach(function (l) {
            // (l.band-1)*7 + l.ssidIndex-1
            $scope.ssidNames[l.band * 8 + l.ssidIndex - 9] = l.ssid;
        });
        /*
         * 数据处理
         */
        var processing = {
            arrToJson: function (arr) {
                var obj = {}
                if (!arr || !arr.length) return obj;
                arr.forEach(function (v) {
                    obj[v] = true;
                });
                return obj;
            },
            jsonToArr: function (obj) {
                var arr = [];
                for (x in obj) {
                    if (obj[x]) arr.push(x);
                }
                ;
                return arr;
            },
            addSaveData: function (data) {
                var data = data;
                data.overnight = data.overnight ? 1 : 0;
                // data.wirelessStatus -= 0;
                data.ssidIndex -= 0;
                data.allDaySelect -= 0;
                if ($scope.all.week == 'all') data.daysSelect = [0];
                if ($scope.all.week == 'select') data.daysSelect = processing.jsonToArr(data.daysSelect);
                // 数据转化 Date

                var startTime = data.startTime;
                var endTime = data.endTime;
                var sh = startTime.substring(0, 2),
                    sm = startTime.substring(3, 5),
                    eh = endTime.substring(0, 2),
                    em = endTime.substring(3, 5);
                if (sh == 12) sh = 0;
                if (eh == 12) eh = 0;
                if (startTime.indexOf('PM') != -1) {
                    sh = sh - 0 + 12;
                }
                if (endTime.indexOf('PM') != -1) eh = eh - 0 + 12;
                // sm -= 0;
                // em -= 0;
                if (sh == 0) sh = "00";
                if (eh == 0) eh = "00";
                data.startTime = sh + ':' + sm;
                data.endTime = eh + ':' + em;
                return data;
            },
            editData: function (data) {
                var data = data;
                // var ssidIndex = data.ssidIndex - 1;
                // data.ssidIndex = $scope.scheduleIndexes[ssidIndex];
                if (data.daysSelect[0] == 0) {
                    $scope.all.week = 'all';
                    data.daysSelect = {};
                } else if (data.daysSelect[0] != 0) {
                    $scope.all.week = 'select';
                    data.daysSelect = processing.arrToJson(data.daysSelect);
                }
                data.overnight = data.overnight == 1;

                // 数据转化 Date
                var startTime = data.startTime;
                var endTime = data.endTime;
                // 添加AM PM
                var sh = startTime.substring(0, 2),
                    sm = startTime.substring(3, 5),
                    eh = endTime.substring(0, 2),
                    em = endTime.substring(3, 5);
                data.startTime = (sh % 12 > 0 && sh % 12 < 10 ? '0' + sh % 12 : 12) + ':' + sm + ' ' + (sh >= 12 ? 'PM' : 'AM');
                data.endTime = (eh % 12 > 0 && eh % 12 < 10 ? '0' + eh % 12 : 12) + ':' + em + ' ' + (eh >= 12 ? 'PM' : 'AM');
                // 设置时间控件的时间------改成板子时间---llh
                /**
                 * @method 以NCTime也就是后台时间为准
                 * @author 李莉红
                 * @version
                 * */
                    //utils.getNodeTime(function () {
                var sd = new Date(NCTime),
                    ed = new Date(NCTime);
                sd.setHours(sh);
                sd.setMinutes(sm);
                ed.setHours(eh);
                ed.setMinutes(em);
                $scope.scheduleValue.startTime = sd;
                $scope.scheduleValue.endTime = ed;

                return data;
                //})

            },
            timeChanged: function (start) {
                var _time = angular.copy(start ? $scope.scheduleValue.startTime : $scope.scheduleValue.endTime);
                var hour = _time.getHours();
                var minute = _time.getMinutes();
                var amPm = 'AM';

                function timeShowFormat(num) {
                    return num >= 0 && num < 10 ? '0' + num : num;
                };
                amPm = hour >= 12 ? 'PM' : 'AM';
                hour = hour === 0 || hour === 12 ? 12 : hour % 12;
                hour = timeShowFormat(hour);
                minute = timeShowFormat(minute);
                if (start) {
                    $scope.temporary.startTime = hour + ':' + minute + ' ' + amPm;
                } else {
                    $scope.temporary.endTime = hour + ':' + minute + ' ' + amPm;
                }
            },
            getDisabledArr: function () {
                var disableArr = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
                for (var i = 0; i < $scope.scheduleOptions.data.length; i++) {
                    var x = $scope.scheduleOptions.data[i].ssidIndex;
                    disableArr[x] = false;
                }
                return disableArr;
            }
        }

        /*
         * 页面操作
         */
        var resetting = function () {
            $scope.temporary = {
                // wirelessStatus: 0,
                ruleName: '',
                ssidIndex: 0,
                ssid: $scope.ssidNames[0],
                daysSelect: {},
                allDaySelect: 1,
                startTime: '',
                endTime: '',
                overnight: 0,
                nodeStatus: 1
            };
            $scope.all = {week: 'all'}
            $scope.editRuleStatus = null;
            // var disableArr = processing.getDisabledArr();
            // for (var i = 0; i < disableArr.length; i++) {
            //     if(disableArr[i]){
            //         $scope.temporary.ssidIndex = i;
            //         break;
            //     };
            // }

            $scope.timeChanged(true);
            $scope.timeChanged(false);
        };
        $scope.addRuleResult = {
            isError: false,
            msg: ''
        };
        resetting();
        $scope.addRule = function () {
            var data = angular.copy($scope.temporary);
            var temporary = processing.addSaveData(data);
            // 在over night未勾选时 判断时间大小(end大于start)
            if (checkRulesCount(data)) {
                if (proofTime(temporary)) {
                    $scope.addRuleResult.isError = false;
                    $scope.scheduleOptions.data.push(temporary);
                    $timeout(function () {
                        resetting();
                    }, 0); // 立即重置数据会出现表单提示信息 可设置button标签type属性值为button
                    initScheduleState();
                } else {
                    $scope.addRuleResult.isError = true;
                    $scope.addRuleResult.msg = 'configuration.schedule.alert1';
                    cancleAlert();
                }
            } else {
                $scope.addRuleResult.isError = true;
                $scope.addRuleResult.msg = 'configuration.schedule.maxRulesAlert';
                cancleAlert();
            }

        };

        function cancleAlert() {
            $timeout(function () {
                $scope.addRuleResult.isError = false;
                $scope.state.schedule.isSuccess = false;
                $scope.state.schedule.isError = false;
            }, 10000);
        }

        function checkRulesCount(temp) {
            var count = 0;
            for (var i = 0; i < $scope.scheduleOptions.data.length; i++) {
                if (temp.ssidIndex == $scope.scheduleOptions.data[i].ssidIndex) {
                    count++;
                }
            }
            if (count < 16) {
                return true;
            }
            return false;
        }

        function proofTime(data, isEdit) {
            // 编辑时 过滤掉编辑的rule的区间
            //已存在的时间表
            var contrastData = getContrastList(data.ssidIndex);
            //当前rule的时间表
            var minutesInterval = getContrast(data);

            if (Array.isArray(contrastData) && contrastData.length == 0) {
                // 列表中没有相同的SSID
                return true;
            }
            // 已存在的rule有 all week，all day
            for (var i = 0; i < contrastData.length; i++) {
                if (!contrastData[i]) return false;
            }
            //新添加的rule有 all week，all day
            if (!minutesInterval) return false;
            for (var i = 0; i < contrastData.length; i++) {
                for (var j = 0; j < contrastData[i].length; j++) {
                    for (var k = 0; k < minutesInterval.length; k++) {
                        if (contrastData[i][j].from <= minutesInterval[k].from && contrastData[i][j].to >= minutesInterval[k].to) return false;
                        if (contrastData[i][j].from >= minutesInterval[k].from && contrastData[i][j].to <= minutesInterval[k].to) return false;
                        if (contrastData[i][j].from <= minutesInterval[k].from && contrastData[i][j].to < minutesInterval[k].to && contrastData[i][j].to > minutesInterval[k].from) return false;
                        if (contrastData[i][j].from >= minutesInterval[k].from && contrastData[i][j].to > minutesInterval[k].to && contrastData[i][j].from < minutesInterval[k].to) return false;
                    }
                }
            }

            return true;
        };
        $scope.editRule = function (rule) {
            $scope.editRuleStatus = rule.$$hashKey;
            var data = angular.copy(rule)
            var temporary = processing.editData(data);
            $scope.temporary = temporary;
            $scope.timeOverRange = false;
            initScheduleState();
        };
        $scope.saveRule = function () {
            var data = angular.copy($scope.temporary)
            var temporary = processing.addSaveData(data);
            if (proofTime(temporary)) {
                for (var i = 0; i < $scope.scheduleOptions.data.length; i++) {
                    if ($scope.scheduleOptions.data[i].$$hashKey == $scope.editRuleStatus) {
                        $scope.scheduleOptions.data[i] = temporary;
                    }
                }
                resetting();
                initScheduleState();
            } else {
                $scope.addRuleResult.isError = true;
                $scope.addRuleResult.msg = 'configuration.schedule.alert1';
                cancleAlert();
            }

        };
        $scope.removeRule = function (rule) {
            var delIndex = rule.$$hashKey;
            if ($scope.editRuleStatus == delIndex) {
                // TODO
                // 清空表单数据
                $scope.addRuleResult.isError = true;
                $scope.addRuleResult.msg = 'configuration.schedule.alert2';
                cancleAlert();
                return;
            }
            for (var i = 0; i < $scope.scheduleOptions.data.length; i++) {
                if ($scope.scheduleOptions.data[i].$$hashKey == delIndex) {
                    $scope.scheduleOptions.data.splice(i, 1);
                    break;
                }
            }
        };
        $scope.clearRule = function () {
            $timeout(function () {
                resetting();
            }, 0); // 立即重置数据会出现表单提示信息
        }

        $scope.save = function () {
            $scope.state.schedule.processing = true;
            $scope.state.schedule.isSuccess = false;
            $scope.state.schedule.isError = false;
            if ($scope.editRuleStatus) {
                // TODO
                // 可不考虑正在编辑的状态，直接保存表格数据
                $scope.state.schedule.isError = true;
                $scope.state.schedule.msgFalse = 'configuration.schedule.alert2';
                cancleAlert();
                return;
            }
            ;

            $scope.scheduleSaveData = angular.copy($scope.scheduleShowData);
            $scope.scheduleSaveData.status -= 0;
            /*   if ($scope.scheduleSaveData.status == 0) {
             $scope.scheduleOptions.data = [];
             }*/
            $scope.scheduleSaveData.ruleList = angular.copy($scope.scheduleOptions.data);
            $scope.scheduleSaveData.ruleList.forEach(function (r) {
                r.nodeStatus = r.nodeStatus ? 1 : 0;
            });
            BatchConfigService.updateSchedule($scope.profileId, $scope.scheduleSaveData, function (result) {
                // $emit 事件  更新左侧列表数据
                $scope.state.schedule.processing = false;
                if (result.success) {
                    $scope.state.schedule.isSuccess = true;
                    cancleAlert();
                    $scope.$emit('refreshBCTree');
                    $scope.$emit('refreshActiveProfile');
                } else {
                    $scope.state.schedule.isError = true;
                    $scope.state.schedule.msgFalse = result.error;
                    cancleAlert();
                }
                ;
            });
        };
        $scope.indexFilter = function (item) {
            return true;
            // return processing.getDisabledArr()[item]
        }
    })
    app.register.directive('siteSchedule', function () {
        return {
            restrict: 'AE',
            templateUrl: "./views/configuration/site-Schedule.html",
            scope: {
                scheduleData: '=',
                ssidData: '=',
                profileId: '='
            },
            controller: 'siteScheduleController'
        };
    });
})