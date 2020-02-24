/**
 * Created by lizhimin on 2016/5/24.
 */
define(["controllerModule"], function (controllers) {
    controllers.controller('captiveController', function ($rootScope, $scope, $uibModal, $timeout, LogService, DashboardService, utils, TS) {

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

        //当表格内容过长，显示悬浮框
        $scope.showDetail = function (log, e) {
            showLogDetail(log, e);
        };
        //隐藏悬浮框
        $scope.hideDetail = function (log, e) {
            hideLogDetail(log, e);
        };

        $(document).on('mousedown', function (e) {
            var dropdownMenu = $(e.target).parents('.dropdown-menu-right')[0];
            if (!dropdownMenu
                || dropdownMenu.getAttribute('class') !== 'dropdown-menu-right ng-scope dropdown-menu') {
                $scope.isOpenSysLogMenu = false;
            }
        });

        function searchSysLogByParams() {
            if (!$scope.searchTab.action
                || !$scope.SysLogSelect.clooseFromDays
                || !$scope.SysLogSelect.clooseToDays) {
                return;
            }

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
                $('#captiveLogLoading').hide();
                //关闭弹出框
                $scope.isOpenSysLogMenu = false;
                return false;
            }
            getEULogPage(1, $scope.eulogOptions.paginationPageSize);
            //关闭弹出框
            $scope.isOpenSysLogMenu = false;
        }

        function clearSysLogParams() {
            //默认值
            $scope.SysLogSelect.clooseFromDays = '';
            $scope.SysLogSelect.clooseToDays = '';
            $scope.searchData.value = '';
            $scope.searchData.type = $scope.optionTypes[0];
            $scope.searchTab.action = $scope.actions[0];
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
                    // str: date.toLocaleDateString()
                    str: FormatDate(date)
                });
                $scope.SysLogSelect.logToDays.push({
                    value: parseInt(dateSeconds / 86400) * 86400,
                    // str: date.toLocaleDateString()
                    str: FormatDate(date)
                });
            }
            //默认值
            $scope.SysLogSelect.clooseFromDays = $scope.SysLogSelect.logFromDays[$scope.SysLogSelect.logFromDays.length - 1];
            $scope.SysLogSelect.clooseToDays = $scope.SysLogSelect.logToDays[0];
            // 搜索条件
            $scope.searchTab = {
                action: $scope.actions[0],
                from: utils.pre7DayFromNC(NCTime),
                to: utils.dateConversionFromNC(NCTime),
            };
        }

        utils.getNodeTime(function () {
            initDate();
            getEULogPage(1, $scope.eulogOptions.paginationPageSize);
        });

        /*
        * 搜索条件下拉选框数据
        */
        $scope.optionTypes = [{id: 'target.mac', name: 'column.apMAC'}, {
            id: 'clientMACAddr',
            name: 'column.stationMAC'
        }, {id: 'log', name: 'column.message'}];
        $scope.actions = ['All', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
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


        $scope.eulogOptions = {
            enableGridMenuTemplate: '',
            paginationPageSizes: [20, 50, 100],
            paginationPageSize: 50,
            useExternalPagination: true,
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
                $scope.EUgridApi = gridApi;
                //分页按钮事件
                $scope.EUgridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                    if (getEULogPage) {
                        getEULogPage(newPage, pageSize);
                    }
                });
            }
            // useExternalPagination: true
        };

        //2019.8.12 尹雪雪
        $scope.eulogOptions.columnDefs = [
            {
                field: 'receiveTime',
                enableHiding: false,
                width: "53%",
                displayName: TS.ts('column.receiveTime'),
                type: 'date',
                cellFilter: 'ISOTimeFilter'
            },
            {
                field: 'time',
                sort: {
                    direction: 'desc'
                },
                enableHiding: false,
                width: "53%",
                displayName: TS.ts('column.logTime'),
                type: 'date',
                cellFilter: 'date:"yyyy-MM-dd HH:mm:ss"'
            },
            {field: 'target.mac', enableHiding: false, displayName: TS.ts('column.apMAC'), width: "50%"},
            {field: 'clientMACAddr', enableHiding: false, displayName: TS.ts('column.stationMAC'), width: "50%"},
            {field: 'authType', enableHiding: false, displayName: TS.ts('column.authType'), width: "45%"},
            {field: 'userName', enableHiding: false, displayName: TS.ts('column.userId'), width: "40%"},
            {
                field: 'action', enableHiding: false, displayName: TS.ts('column.action'), width: "60%",
                cellFilter: 'euLogActionFilter',
            },
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
            /* {field: 'log', enableSorting: false, enableColumnMenu: false, enableHiding: false, minWidth: "200",displayName:TS.ts('column.message'),cellClass: 'ofv',
                cellTemplate: "<div class='ui-grid-cell-contents ui-grid-more-info'>" +
                        "<div><span>{{row.entity.log}}</span></div></div>"}  这种信息详情栏有bug*/
        ];

        function dailyError() {
            $.DialogByZ.Close();
        }

        function getSearchRule() {
            // var from = new Date($scope.SysLogSelect.clooseFromDays.str).setHours(0, 0, 0, 0);
            // var to = new Date($scope.SysLogSelect.clooseToDays.str).setHours(23, 59, 59, 0);
            var range = utils.calcTimeRange({
                from: new Date($scope.SysLogSelect.clooseFromDays.value * 1000).toISOString(),
                to: new Date($scope.SysLogSelect.clooseToDays.value * 1000).toISOString(),
            });
            var from = range.from;
            var to = range.to;
            var actionIndex = $scope.actions.indexOf($scope.searchTab.action);
            if (actionIndex == 0) {
                actionIndex = -1;
            }
            var searchRule = {
                action: actionIndex,
                timeRange: {from: from, to: to}
            };
            if ($scope.searchData.value && $scope.searchData.value != "") {
                var temp = $scope.searchData.value;
                searchRule[$scope.searchData.type.id] = temp;
            }
            return searchRule;
        }

        var getEULogPage = function (curPage, pageSize) {
            $('#captiveLogLoading').show();
            LogService.getEUSyslogs(getSearchRule(), {start: curPage - 1, count: pageSize}, function (result) {
                if (result.success) {
                    $scope.eulogOptions.totalItems = result.total;
                    $scope.eulogOptions.data = result.data;
                    $('#captiveLogLoading').hide();

                    //表格刷新事件
                    setTimeout(function () {
                        //获取刷新按钮
                        var refreshBtn = $('#captiveRefresh');
                        //触发事件
                        $(refreshBtn).click(function () {
                            //根据筛选条件刷新数据
                            utils.getNodeTime(function () {
                                initDate();
                                getRefreshData(1, $scope.eulogOptions.paginationPageSize);
                            });
                        });
                    }, 0);
                } else {
                    $scope.eulogOptions.totalItems = 0;
                    $scope.eulogOptions.data = [];
                    $('#captiveLogLoading').hide();
                }
                setTimeout(function () {
                    //选择每页显示条数时，防止移动端打开系统自带的输入框
                    paginationSystemKeyboard();
                }, 300);
            });
        };

        var getRefreshData = function (curPage, pageSize) {
            if (!$scope.searchTab.action
                || !$scope.SysLogSelect.clooseFromDays
                || !$scope.SysLogSelect.clooseToDays) {
                return;
            }
            //loading
            $('#captiveLogLoading').show();
            LogService.getEUSyslogs(getSearchRule(), {start: curPage - 1, count: pageSize}, function (result) {
                if (result.success) {
                    $scope.eulogOptions.totalItems = result.total;
                    $scope.eulogOptions.data = result.data;
                    $('#captiveLogLoading').hide();
                } else {
                    $scope.eulogOptions.totalItems = 0;
                    $scope.eulogOptions.data = [];
                    $('#captiveLogLoading').hide();
                }
            });
        };
    })

    controllers.filter('euLogActionFilter', function () {
        var genderHash = {
            1: 'Captive Portal login Success',
            2: 'Captive Portal Aging Out',
            3: 'Captive Portal Roaming Success',
            4: 'Captive Portal White List Success',
            5: 'Received Deauth',
            6: 'Received disassociate',
            7: 'Disassociate',
            8: 'STA MAC Association',
            9: 'Deauth: Aging',
            10: 'Deauth: STA'
        };
        return function (input) {
            if (!input) {
                return '';
            } else {
                return genderHash[input];
            }
        };
    });
});