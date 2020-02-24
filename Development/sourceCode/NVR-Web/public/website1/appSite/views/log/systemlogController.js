/**
 * Created by lizhimin on 2016/1/26.
 */
define(["controllerModule"], function (controllers) {
    controllers.controller('systemlogController', function ($rootScope, $scope, $timeout, LogService, DashboardService, utils, TS) {

        function FormatDate(date) {
            return date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
        }

        $scope.openSysEventLogMenu = openSysEventLogMenu;
        //禁止弹出系统输入框
        $scope.preventSystemKeyboard = preventSystemKeyboard;
        //清空选值
        $scope.clearSysEventLogParams = clearSysEventLogParams;
        //查询
        $scope.searchSysEventLogByParams = searchSysEventLogByParams;

        //阻止弹出框事件冒泡
        $scope.stop = function () {
            event.stopPropagation();
        };
        $(document).on('mousedown', function (e) {
            var dropdownMenu = $(e.target).parents('.dropdown-menu-right')[0];
            if (!dropdownMenu || dropdownMenu.getAttribute('class') !== 'dropdown-menu-right ng-scope dropdown-menu') {
                $scope.isOpenSysEventLogMenu = false;
            }
            ;
        });

        function openSysEventLogMenu() {
            $scope.preventSystemKeyboard();
        };

        function preventSystemKeyboard() {
            //设置input 为readonly ，防止移动端打开系统自带的输入框
            var uiSelect = Array.prototype.slice.call(document.getElementsByClassName('uiSelect'));
            uiSelect.forEach(function (select, index) {
                var input = select.children[2];
                input.setAttribute('readonly', 'true');
            });
        };

        //选择每页显示条数时，防止移动端打开系统自带的输入框
        function paginationSystemKeyboard() {
            //设置input 为readonly ，防止移动端打开系统自带的输入框
            var uiSelect = Array.prototype.slice.call(document.getElementsByClassName('form-control ui-select-search'));
            uiSelect.forEach(function (input, index) {
                input.setAttribute('readonly', 'true');
            });
        };

        function clearSysEventLogParams() {
            //默认值
            $scope.search.logType = '';
            $scope.SysEventLogSelect.clooseFromDays = '';
            $scope.SysEventLogSelect.clooseToDays = '';
        };

        function searchSysEventLogByParams() {
            if (!$scope.search.logType
                || !$scope.SysEventLogSelect.clooseFromDays
                || !$scope.SysEventLogSelect.clooseToDays) {
                return;
            }
            ;
            var from = new Date($scope.SysEventLogSelect.clooseFromDays.str).setHours(0, 0, 0, 0);
            var to = new Date($scope.SysEventLogSelect.clooseToDays.str).setHours(23, 59, 59, 0);
            //时间参数输入错误
            if (from > to) {
                //显示错误弹出框
                $.DialogByZ.Alert({
                    Title: "",
                    Content: TS.ts('invalid.timeRangeOver'),
                    BtnL: TS.ts('common.confirm'),
                    FunL: dailyError
                })
                $('#sysLogEventLoading').hide();
                //关闭弹出框
                $scope.isOpenSysEventLogMenu = false;
                return false;
            }
            ;
            getEventLog(1, $scope.gridOptions.paginationPageSize);
            //关闭弹出框
            $scope.isOpenSysEventLogMenu = false;
        };

        //当表格内容过长，显示悬浮框
        $scope.showDetail = function (log, e) {
            showLogDetail(log, e);
        };
        //隐藏悬浮框
        $scope.hideDetail = function (log, e) {
            hideLogDetail(log, e);
        };


        /*
        * 搜索条件下拉选框数据
        */
        $scope.logTypes = [{id: 'ALL', name: 'systemlog.All'},
            {id: 1, name: 'systemlog.logType1'},
            //{id:2,name:'systemlog.logType2'},
            {id: 3, name: 'systemlog.logType3'},
            {id: 4, name: 'systemlog.logType4'},
            {id: 5, name: 'systemlog.logType5'},
            {id: 6, name: 'systemlog.logType6'},
            {id: 8, name: 'systemlog.logType8'}, 
            {id: 9, name: 'systemlog.logType9'}
        ];

        $scope.logTypes.sort(function (a, b) {
            if (a.id == "ALL") return -1;
            if (b.id == "ALL") return 1;
            if (a.id == b.id) return 0;
            if (a.id > b.id) return 1;
            if (a.id < b.id) return -1;
            return 0;
        });

        $scope.optionSites = [];

        function initDate() {
            //初始化
            $scope.SysEventLogSelect = {};
            $scope.SysEventLogSelect.logFromDays = [];
            $scope.SysEventLogSelect.logToDays = [];
            var moment = new Date(NCTime);
            let flag = new Date('1970/1/1');
            for (var i = 0; i <= 7; i++) {
                var date = new Date(moment);
                date.setDate(date.getDate() - i);
                let dateSeconds = ((date.getTime() - flag.getTime()) / 1000);
                $scope.SysEventLogSelect.logFromDays.push({
                    value: parseInt(dateSeconds / 86400) * 86400,
                    // str: date.toLocaleDateString()
                    str: FormatDate(date)
                });
                $scope.SysEventLogSelect.logToDays.push({
                    value: parseInt(dateSeconds / 86400) * 86400,
                    // str: date.toLocaleDateString()
                    str: FormatDate(date)
                });
            }
            //默认值
            $scope.SysEventLogSelect.clooseFromDays = $scope.SysEventLogSelect.logFromDays[$scope.SysEventLogSelect.logFromDays.length - 1];
            $scope.SysEventLogSelect.clooseToDays = $scope.SysEventLogSelect.logToDays[0];
            // 搜索条件
            $scope.search = {
                logType: $scope.logTypes[0],
                /*  site:{_id: 'ALL', siteName: 'common.allSite', networks: [{name: 'common.allNetwork', _id: 'ALL'}]},
                network:{name: 'common.allNetwork', _id: 'ALL'},*/
                from: utils.pre7DayFromNC(NCTime),
                to: utils.dateConversionFromNC(NCTime),
                search: function () {
                    getEventLog($scope.gridOptions.paginationCurrentPage, $scope.gridOptions.paginationPageSize);
                },
                export: function () {
                    alert('export');
                }
            };
        }

        //先获取时间
        utils.getNodeTime(function () {
            initDate();
            getEventLog(1, $scope.gridOptions.paginationPageSize);
        });

        $scope.optionTypes = [{id: 'ip', name: 'column.ipv4'}, {id: 'message', name: 'column.message'}]; // channel5Ghz2  power5Ghz2

        $scope.searchData = {
            type: $scope.optionTypes[0],
            value: ''
        };
        $scope.gridOptions = {
            enableGridMenuTemplate: '',
            paginationPageSizes: [20, 50, 100],
            paginationPageSize: 20,
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
                $scope.gridApi = gridApi;
                //分页按钮事件
                gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                    console.log(newPage, pageSize);
                    if (getEventLog) {
                        getEventLog(newPage, pageSize);
                    }
                });
            },
            // useExternalPagination: true,
            columnDefs: [
                {
                    field: 'logTime',
                    sort: {direction: 'desc'},
                    enableHiding: false,
                    width: '53%',
                    displayName: TS.ts('column.logTime'),
                    type: 'date',
                    cellFilter: 'ISOTimeFilter',
                    //cellClass: 'ofv',cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.logTime}}</span><div></div>',
                },
                {
                    field: 'logType',
                    enableHiding: false,
                    width: '47%',
                    displayName: TS.ts('column.eventType'),
                    cellClass: 'ofv',
                    cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{\'systemlog.logType\'+row.entity.logType|translate}}</span><div></div>'
                },
                {field: 'network', enableHiding: false, displayName: TS.ts('column.network'), width: '42%'},
                {
                    field: 'ip', enableHiding: false, displayName: TS.ts('column.ipv4'), width: '42%',
                    sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                        var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                        return utils.sortByIP(nulls, a, b);
                    }
                },
                {
                    field: 'mac', enableHiding: false, width: '50%', displayName: TS.ts('column.mac'), cellClass: 'ofv',
                    cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.mac}}</span><div></div>'
                },

                {
                    field: 'message',
                    enableHiding: false,
                    enableSorting: false,
                    enableColumnMenu: false,
                    displayName: TS.ts('column.message'),
                    width: "50%",
                    cellClass: 'ofv',
                    cellTemplate: '<div class="ui-grid-cell-contents" >' +
                        '<span ng-mouseover="grid.appScope.showDetail(row.entity.message,$event)" ng-mouseleave="grid.appScope.hideDetail(row.entity.message,$event)">{{row.entity.message}}</span></div>'
                }

                /*{field: 'message', enableHiding:false, enableSorting: false, enableColumnMenu: false, displayName: TS.ts('column.message'),  width: "50%",cellClass: 'ofv',
                    cellTemplate: "<div class='ui-grid-cell-contents ui-grid-more-info'>" +
                    "<div><span>{{row.entity.message}}</span></div></div>"
                }*/
            ]
        };

        function dailyError() {
            $.DialogByZ.Close();
        }

        function getSearchRule() {
            // var from=new Date(kalendaeData.from).setHours(0,0,0,0);
            // var to=new Date(kalendaeData.to).setHours(23,59,59,0);
            // var from = new Date($scope.SysEventLogSelect.clooseFromDays.str).setHours(0, 0, 0, 0);
            // var to = new Date($scope.SysEventLogSelect.clooseToDays.str).setHours(23, 59, 59, 0);
            var range = utils.calcTimeRange({
                from: new Date($scope.SysEventLogSelect.clooseFromDays.value * 1000).toISOString(),
                to: new Date($scope.SysEventLogSelect.clooseToDays.value * 1000).toISOString(),
            });
            var from = range.from;
            var to = range.to;
            var searchRule = {
                /* siteId:$scope.search.site._id,networkId:$scope.search.network._id,*/
                logType: $scope.search.logType.id,
                timeRange: {from: from, to: to}
            };
            if ($scope.searchData.value && $scope.searchData.value != "") {
                var temp = $scope.searchData.value;
                searchRule[$scope.searchData.type.id] = temp;
            }
            return searchRule;
        }

        var getEventLog = function (curPage, pageSize) {
            $('#sysLogEventLoading').show();
            LogService.getAllEvents(getSearchRule(), {start: curPage - 1, count: pageSize}, function (result) {
                if (result.success) {
                    $scope.gridOptions.totalItems = result.total;
                    $scope.gridOptions.data = result.data;
                    //表格刷新事件
                    setTimeout(function () {
                        //获取刷新按钮
                        var refreshBtn = $('#sysTemRefresh')[0];
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
                $('#sysLogEventLoading').hide();
                setTimeout(function () {
                    //选择每页显示条数时，防止移动端打开系统自带的输入框
                    paginationSystemKeyboard();
                }, 300);
            });
        };

        var getRefreshData = function (curPage, pageSize) {
            if (!$scope.search.logType
                || !$scope.SysEventLogSelect.clooseFromDays
                || !$scope.SysEventLogSelect.clooseToDays) {
                return;
            }
            ;
            $('#sysLogEventLoading').show();
            LogService.getAllEvents(getSearchRule(), {start: curPage - 1, count: pageSize}, function (result) {
                if (result.success) {
                    $scope.gridOptions.totalItems = result.total;
                    $scope.gridOptions.data = result.data;
                }
                $('#sysLogEventLoading').hide();
            });
        };
    });
});