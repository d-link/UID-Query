/**
 * Created by lizhimin on 2016/5/24.
 */
define(["controllerModule"], function (controllers) {
    controllers.controller('syslogController', function ($rootScope, $scope, $uibModal, $timeout, LogService, DashboardService, utils, TS) {

        function FormatDate(date) {
            return date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
        }

        //打开下拉菜单框
        $scope.openSysLogMenu = openSysLogMenu;
        //禁止弹出系统输入框
        $scope.preventSystemKeyboard = preventSystemKeyboard;
        //清除选择条件
        $scope.clearSysLogParams = clearSysLogParams;
        //根据选择的条件进行搜索
        $scope.searchSysLogByParams = searchSysLogByParams;


        // //阻止弹出框事件冒泡
        // $scope.stop=function(){
        //     event.stopPropagation();
        // };

        $(document).on('mousedown', function (e) {
            var dropdownMenu = $(e.target).parents('.dropdown-menu-right')[0];
            if (!dropdownMenu
                || dropdownMenu.getAttribute('class') !== 'dropdown-menu-right ng-scope dropdown-menu') {
                $scope.isOpenSysLogMenu = false;
            }
        });

        function searchSysLogByParams() {
            //判断必输是否填入
            if (!$scope.searchTab.severity
                || !$scope.searchTab.facility
                || !$scope.SysLogSelect.clooseFromDays
                || !$scope.SysLogSelect.clooseToDays) {
                return;
            }
            ;
            var from = new Date($scope.SysLogSelect.clooseFromDays.str).setHours(0, 0, 0, 0);
            var to = new Date($scope.SysLogSelect.clooseToDays.str).setHours(23, 59, 59, 0);
            //时间参数输入错误
            if (from > to) {
                //显示错误弹出框
                $.DialogByZ.Alert({
                    Title: "",
                    Content: TS.ts('invalid.timeRangeOver'),
                    BtnL: TS.ts('common.confirm'),
                    FunL: dailyError
                })
                $('#sysLogLoading').hide();
                //关闭弹出框
                $scope.isOpenSysLogMenu = false;
                return false;
            }
            ;
            getSyslogPage(1, $scope.gridOptions.paginationPageSize);
            //关闭弹出框
            $scope.isOpenSysLogMenu = false;
        };

        function clearSysLogParams() {
            //默认值
            $scope.searchTab.severity = '';
            $scope.SysLogSelect.clooseFromDays = '';
            $scope.SysLogSelect.clooseToDays = '';
            $scope.searchData.value = '';
            $scope.searchData.type = $scope.optionTypes[0];
            $scope.searchTab.facility = '';
        }

        function openSysLogMenu() {
            $scope.preventSystemKeyboard();
        }

        function preventSystemKeyboard() {
            //设置input 为readonly ，防止移动端打开系统自带的输入框
            var uiSelect = Array.prototype.slice.call(document.getElementsByClassName('uiSelect'));
            uiSelect.forEach(function (select, index) {
                var input = select.children[2];
                input.setAttribute('readonly', 'true');
            });
        }

        //选择每页显示条数时，防止移动端打开系统自带的输入框
        function paginationSystemKeyboard() {
            //设置input 为readonly ，防止移动端打开系统自带的输入框
            var uiSelect = Array.prototype.slice.call(document.getElementsByClassName('form-control ui-select-search'));
            uiSelect.forEach(function (input, index) {
                input.setAttribute('readonly', 'true');
            });
        }

        //初始值
        function initDate() {
            /**
             * 初始化时间参数
             */
            $scope.SysLogSelect = {};
            $scope.SysLogSelect.logFromDays = [];
            $scope.SysLogSelect.logToDays = [];
            var moment = new Date(NCTime);
            let flag = new Date('1970/1/1');
            for (var i = 0; i <= 7; i++) {
                var date = new Date(moment);
                date.setDate(date.getDate() - i);
                let dateSeconds = ((date.getTime() - flag.getTime()) / 1000);
                $scope.SysLogSelect.logFromDays.push({
                    value: parseInt(dateSeconds / 86400) * 86400,
                    //  str: date.toLocaleDateString()
                    str: FormatDate(date)
                });
                $scope.SysLogSelect.logToDays.push({
                    value: parseInt(dateSeconds / 86400) * 86400,
                    //  str: date.toLocaleDateString()
                    str: FormatDate(date)
                });
            }
            //console.log($scope.SysLogSelect.logFromDays);
            //默认值
            $scope.SysLogSelect.clooseFromDays = $scope.SysLogSelect.logFromDays[$scope.SysLogSelect.logFromDays.length - 1];
            $scope.SysLogSelect.clooseToDays = $scope.SysLogSelect.logToDays[0];

            // 搜索条件
            $scope.searchTab = {
                severity: $scope.severities[0],
                facility: $scope.facilities[0],
                from: utils.pre7DayFromNC(NCTime),
                to: utils.dateConversionFromNC(NCTime),
            };

        }

        utils.getNodeTime(function () {
            initDate();
            getSyslogPage(1, $scope.gridOptions.paginationPageSize);
        });

        /*
        * 搜索条件下拉选框数据
        */

        $scope.severities = ['All', 'Emergency', 'Alert', 'Critical', 'Error', 'Warning', 'Notice', 'Information', 'Debug'];
        $scope.facilities = ['All', 'kernel messages', 'user-level messages', 'mail system',
            'system daemons', 'security/authorization messages', 'messages generated internally by syslog', 'line printer subsystem', 'network news subsystem', 'UUCP subsystem',
            'clock daemon', 'security/authorization', 'FTP daemon', 'NTP subsystem', 'log audit', 'log alert', 'scheduling daemon', 'local use 0 (local0)',
            'local use 1 (local1)', 'local use 2 (local2)', 'local use 3 (local3)',
            'local use 4 (local4)', 'local use 5 (local5)', 'local use 6 (local6)', 'local use 7 (local7)'];
        $scope.optionTypes = [{id: 'ip', name: 'column.ipv4'}, {id: 'log', name: 'column.message'}];
        $scope.searchData = {
            type: $scope.optionTypes[0],
            value: ''
        };

        //    $scope.severities = sortArr($scope.severities);
        //    $scope.facilities = sortArr($scope.facilities);


        function sortArr(arr) {
            var sa = arr.slice(1);
            sa.sort(function (a, b) {
                if (a == b) return 0;
                if (a > b) return 1;
                if (a < b) return -1;
                return 0;
            });
            sa.unshift('All');
            return sa;
        }

        $scope.gridOptions = {
            //禁用滚动条
            // enableHorizontalScrollbar:0,
            // enableVerticalScrollbar:0,
            enableGridMenuTemplate: '',
            paginationPageSizes: [20, 50, 100],
            paginationPageSize: 20,
            useExternalPagination: true,//使用外部的分页组件
            enableGridMenu: false,
            paginationTemplate: './views/templates/gridBurster.html',
            //----------- 选中 ----------------------
            enableFooterTotalSelected: true, // 是否显示选中的总数，默认为true, 如果显示，showGridFooter 必须为true
            enableFullRowSelection: true, //是否点击行任意位置后选中,默认为false,当为true时，checkbox可以显示但是不可选中
            enableRowHeaderSelection: false, //是否显示选中checkbox框 ,默认为true
            enableRowSelection: true, // 行选择是否可用，默认为true;
            enableSelectAll: true, // 选择所有checkbox是否可用，默认为true;
            enableSelectionBatchEvent: true, //默认true
            isRowSelectable: function (row) { //GridRow
                if (row.entity.age > 45) {
                    row.grid.api.selection.selectRow(row.entity); // 选中行
                }
            },
            modifierKeysToMultiSelect: false,//默认false,为true时只能 按ctrl或shift键进行多选, multiSelect 必须为true;
            multiSelect: false,// 是否可以选择多个,默认为true;

            onRegisterApi: function (gridApi) {
                $scope.gridApi = gridApi;
                //分页按钮事件
                $scope.gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                    if (getSyslogPage) {
                        getSyslogPage(newPage, pageSize);
                    }
                });
            }
        };
        $scope.gridOptions.columnDefs = [
            {
                field: 'receiveTime',
                enableHiding: false,
                width: "53%",
                displayName: TS.ts('column.receiveTime'),
                type: 'date',
                cellFilter: 'ISOTimeFilter'
                //,cellClass: 'ofv',cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.receiveTime}}</span><div></div>',
            },
            {
                field: 'time',
                enableHiding: false,
                width: '53%',
                displayName: TS.ts('column.logTime'),
                type: 'date',
                cellFilter: 'date:"yyyy-MM-dd HH:mm:ss"'
                //,cellClass: 'ofv',cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.time}}</span><div></div>',
            },
            {field: 'target.name', enableHiding: false, displayName: TS.ts('column.name'), width: '40%',},
            {field: 'target.ip', enableHiding: false, width: '42%', displayName: TS.ts('column.ipv4')},
            {
                field: 'facility',
                enableHiding: false,
                displayName: TS.ts('column.facility'),
                width: '50%',
                cellFilter: 'syslog_facility'
            },
            {
                field: 'severity',
                enableHiding: false,
                displayName: TS.ts('column.severity'),
                width: '32%',
                cellFilter: 'syslog_severity'
            },
            {field: 'euDirectiveServer', enableHiding: false, displayName: TS.ts('column.euServer'), width: "40%"},
            {
                field: 'log',
                enableSorting: false,
                enableColumnMenu: false,
                enableHiding: false,
                minWidth: "200",
                displayName: TS.ts('column.message'),
                cellClass: 'ofv',
                cellTemplate: '<div class="ui-grid-cell-contents" >' +
                    '<span ng-mouseover="grid.appScope.showDetail(row.entity.log,$event)" ng-mouseleave="grid.appScope.hideDetail(row.entity.log,$event)">{{row.entity.log}}</span></div>'
            }
            /*{field: 'log', enableHiding:false, enableSorting: false, enableColumnMenu: false, displayName: TS.ts('column.message'),  width:'50%',cellClass: 'ofv',
                cellTemplate: "<div class='ui-grid-cell-contents ui-grid-more-info'>" +
                "<div><span>{{row.entity.log}}</span></div></div>"
            }*/
        ];
        //当表格内容过长，显示悬浮框
        $scope.showDetail = function (log, e) {
            showLogDetail(log, e);
        };
        $scope.hideDetail = function (log, e) {
            hideLogDetail(log, e);
        };

        function dailyError() {
            $.DialogByZ.Close();
        }

        function getSearchRule() {
            // var from=new Date(kalendaeData.from).setHours(0,0,0,0);
            // var to=new Date(kalendaeData.to).setHours(23,59,59,0);
            // var from = new Date($scope.SysLogSelect.clooseFromDays.str).setHours(0, 0, 0, 0);
            // var to = new Date($scope.SysLogSelect.clooseToDays.str).setHours(23, 59, 59, 0);
            var range = utils.calcTimeRange({
                from: new Date($scope.SysLogSelect.clooseFromDays.value * 1000).toISOString(),
                to: new Date($scope.SysLogSelect.clooseToDays.value * 1000).toISOString(),
            });
            var from = range.from;
            var to = range.to;
            var searchRule = {
                severity: $scope.severities.indexOf($scope.searchTab.severity) - 1,
                facility: $scope.facilities.indexOf($scope.searchTab.facility) - 1,
                timeRange: {from: from, to: to}
            };
            if ($scope.searchData.value && $scope.searchData.value != "") {
                var temp = $scope.searchData.value;
                searchRule[$scope.searchData.type.id] = temp;
            }
            console.log(searchRule);
            return searchRule;
        }

        var getSyslogPage = function (curPage, pageSize) {
            //loading
            $('#sysLogLoading').show();
            LogService.getAllSyslogs(getSearchRule(), {start: curPage - 1, count: pageSize}, function (result) {
                if (result.success) {
                    //  $scope.gridOptions.data=result.data;
                    $scope.gridOptions.totalItems = result.total;
                    $scope.gridOptions.data = result.data;

                    //表格刷新事件
                    setTimeout(function () {
                        //获取刷新按钮
                        var refreshBtn = $('#syslogRefresh');
                        //触发事件
                        $(refreshBtn).click(function () {
                            utils.getNodeTime(function () {
                                initDate();
                                //根据筛选条件刷新数据
                                getRefreshData(1, $scope.gridOptions.paginationPageSize);
                            });
                        });
                    }, 0);
                }
                $('#sysLogLoading').hide();
                setTimeout(function () {
                    //选择每页显示条数时，防止移动端打开系统自带的输入框
                    paginationSystemKeyboard();
                }, 300);
            })
        };

        var getRefreshData = function (curPage, pageSize) {
            //判断必输是否填入
            if (!$scope.searchTab.severity
                || !$scope.searchTab.facility
                || !$scope.SysLogSelect.clooseFromDays
                || !$scope.SysLogSelect.clooseToDays) {
                return;
            }
            ;
            //loading
            $('#sysLogLoading').show();
            LogService.getAllSyslogs(getSearchRule(), {start: curPage - 1, count: pageSize}, function (result) {
                if (result.success) {
                    //  $scope.gridOptions.data=result.data;
                    $scope.gridOptions.totalItems = result.total;
                    $scope.gridOptions.data = result.data;
                }
                $('#sysLogLoading').hide();
            })
        };
    })


    controllers.filter('syslog_facility', function () {
        var genderHash = {
            0: 'kernel messages',
            1: 'user-level messages',
            2: 'mail system',
            3: 'system daemons',
            4: 'security/authorization messages',
            5: 'messages generated internally by syslogd',
            6: 'line printer subsystem',
            7: 'network news subsystem',
            8: 'UUCP subsystem',
            9: 'clock daemon',
            10: 'security/authorization',
            11: 'FTP daemon',
            12: 'NTP subsystem',
            13: 'log audit',
            14: 'log alert',
            15: 'clock daemon',
            16: 'local use 0 (local0)',
            17: 'local use 1 (local1)',
            18: 'local use 2 (local2)',
            19: 'local use 3 (local3)',
            20: 'local use 4 (local4)',
            21: 'local use 5 (local5)',
            22: 'local use 6 (local6)',
            23: 'local use 7 (local7)',

        };

        return function (input) {
            if (!input) {
                return 'kernel messages';
            } else {
                return genderHash[input];
            }
        };
    });
    controllers.filter('syslog_severity', function () {
        var genderHash = {
            0: 'Emergency',
            1: 'Alert',
            2: 'Critical',
            3: 'Error',
            4: 'Warning',
            5: 'Notice',
            6: 'Information',
            7: 'Debug'
        };
        return function (input) {
            if (!input) {
                return 'Emergency';
            } else {
                return genderHash[input];
            }
        };
    });

});