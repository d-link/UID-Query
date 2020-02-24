/**
 * Created by lizhimin on 2016/1/26.
 */
define(["app"], function (app) {
    app.register.controller('systemlogController', function ($scope, $timeout, LogService, DashboardService, $filter, utils, TS) {
        /**
         * 修改页面和表格高度
         */
        setHeight();
        $timeout(function () {
            setGridHeight('systemlogGrid', true)
        }, 100);
        $scope.timer = null;
        window.onresize = function () {
            setHeight();
            $timeout.cancel($scope.timer);
            $scope.timer = $timeout(function () {
                setGridHeight('systemlogGrid', true);
            }, 300);
        };

        /*
         * 搜索条件下拉选框数据
         */
        $scope.logTypes = [{id: 'ALL', name: 'systemlog.All'}, {id: 1, name: 'systemlog.logType1'},
            {id: 3, name: 'systemlog.logType3'},
            {id: 4, name: 'systemlog.logType4'}, {id: 5, name: 'systemlog.logType5'}, {
                id: 6,
                name: 'systemlog.logType6'
            }, {id: 8, name: 'systemlog.logType8'}, {id: 9, name: 'systemlog.logType9'}];
        $scope.optionSites = [];

        $scope.optionTypes = [{id: 'ip', name: 'column.ipv4'}, {id: 'message', name: 'column.message'}]; // channel5Ghz2  power5Ghz2
        /*
         * 根据 搜索条件 过滤表格数据
         */
        $scope.searchData = {
            type: $scope.optionTypes[0],
            value: ''
        };
        var kalendaeData = {};
        let year_iso = new Date(NCISOTime).getFullYear();
        let month_iso = new Date(NCISOTime).getMonth();
        let day_iso = new Date(NCISOTime).getDate();
        //utils.getNodeTime(function () {
        let curDay = new Date(Date.UTC(year_iso, month_iso, day_iso, 23, 59, 59, 999));
        //console.log('curDay:',curDay,typeof curDay);
        kalendaeData = {
            from: new Date(new Date(NCTime).setTime(curDay.getTime() - 604800000)),
            to: curDay
        };
        //初始化日期控件
        getKalenda('kalendae_timeFrom', 'from');
        getKalenda('kalendae_timeTo', 'to');
        // 搜索条件
        $scope.search = {
            logType: $scope.logTypes[0],
            /*  site:{_id: 'ALL', siteName: 'common.allSite', networks: [{name: 'common.allNetwork', _id: 'ALL'}]},
              network:{name: 'common.allNetwork', _id: 'ALL'},*/
            from: utils.pre7DayFromNC(NCTime),
            to: utils.dateConversionFromNC(curDay),
            search: function () {
                getEventLog($scope.gridOptions.paginationCurrentPage, $scope.gridOptions.paginationPageSize);
            },
            export: function () {
                $scope.exporting = true;
                LogService.exportEventlog(getSearchRule(), function (result, fileName) {
                    utils.exportLogCSV(result, fileName);
                    $scope.exporting = false;
                });
            }
        };
        //});

        $scope.exporting = false;


        function getKalenda(id, property) {
            return new Kalendae.Input(id, {
                months: 1,
                direction: 'any',
                mode: 'single',
                format: 'YYYY.MM.DD',
                closeButton: false,
                offsetTop: 1,
                offsetLeft: 1,
                subscribe: {
                    'change': function (date) {
                        //因为这个地方有可能是object，选择完 之后就是array
                        if (this.getSelectedAsDates().length > 0) {
                            var selectDay = this.getSelectedAsDates();
                            if (property == "to") {
                                if (kalendaeData['from'].length > 0) {
                                    var a = $filter('date')(selectDay[0], "yyyy-MM-dd");
                                    var b = $filter('date')(kalendaeData['from'][0], "yyyy-MM-dd");
                                    if (a < b) {
                                        return false;
                                    } else {
                                        kalendaeData[property] = selectDay;
                                        this.hide();
                                    }
                                } else {
                                    var a = $filter('date')(selectDay[0], "yyyy-MM-dd");
                                    var b = $filter('date')(kalendaeData['from'], "yyyy-MM-dd");
                                    if (a < b) {
                                        return false;
                                    } else {
                                        kalendaeData[property] = selectDay;
                                        this.hide();
                                    }
                                }
                            } else if (property == "from") {
                                if (kalendaeData['to'].length > 0) {
                                    var a = $filter('date')(selectDay[0], "yyyy-MM-dd");
                                    var b = $filter('date')(kalendaeData['to'][0], "yyyy-MM-dd");
                                    if (a > b) {
                                        return false;
                                    } else {
                                        kalendaeData[property] = selectDay;
                                        this.hide();
                                    }
                                } else {
                                    var a = $filter('date')(selectDay[0], "yyyy-MM-dd");
                                    var b = $filter('date')(kalendaeData['to'], "yyyy-MM-dd");
                                    if (a > b) {
                                        return false;
                                    } else {
                                        kalendaeData[property] = selectDay;
                                        this.hide();
                                    }
                                }

                            }

                        }
                    }
                },
                blackout: function (date) {

                    var today = Kalendae.moment(NCTime).hour(12).minutes(0);
                    var past = Kalendae.moment(NCTime).hour(12).minutes(0).subtract({d: 90});
                    return past > date || today < date;
                }
            });
        }

        $scope.showCalendae = function (tag) {
            //utils.getNodeTime(function () {
            if (tag == 'from') {
                document.getElementById('kalendae_timeFrom').focus();
            } else {
                document.getElementById('kalendae_timeTo').focus();
            }
            //});
        };
        $scope.gridOptions = {
            isLoading: true,
            paginationPageSizes: [20, 50, 100],
            paginationPageSize: 50,
            paginationTemplate: './views/templates/gridBurster.html',
            useExternalPagination: true,
            onRegisterApi: function (gridApi) {
                $scope.gridApi = gridApi;
                //分页按钮事件
                gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                    if (getEventLog) {
                        getEventLog(newPage, pageSize);
                    }
                });
            },
            // useExternalPagination: true,
            columnDefs: [{
                field: 'logTime',
                sort: {
                    direction: 'desc'
                },
                enableHiding: false,
                width: "13%",
                displayName: TS.ts('column.logTime'),
                type: 'date',
                cellFilter: 'ISOTimeFilter'
            },
                {
                    field: 'logType', enableHiding: false, width: "13%", displayName: TS.ts('column.eventType'),
                    cellTemplate: '<div class="ui-grid-cell-contents">{{\'systemlog.logType\'+row.entity.logType|translate}}</div>'
                },
                {
                    field: 'network', enableHiding: false, displayName: TS.ts('column.network'), width: '13%'
                },
                {
                    field: 'ip', enableHiding: false, displayName: TS.ts('column.ipv4'), width: "10%",
                    sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                        var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                        return utils.sortByIP(nulls, a, b);

                    }
                },
                {
                    field: 'mac', enableHiding: false, displayName: TS.ts('column.mac'), width: "11%",
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.mac|macToLowerCaseFilter}}</div>'
                },
                {
                    field: 'message',
                    minWidth: "200",
                    enableSorting: false,
                    enableColumnMenu: false,
                    enableHiding: false,
                    displayName: TS.ts('column.message'),
                    cellTemplate: "<div class='ui-grid-cell-contents'>" +
                        "<span ng-mouseover='grid.appScope.showDetail(row.entity.message,$event)' ng-mouseleave='grid.appScope.hideDetail(row.entity.message,$event)'>{{row.entity.message}}</span></div>"
                }]
        };
        $scope.showDetail = function (log, e) {
            showLogDetail(log, e);
        }
        $scope.hideDetail = function (log, e) {
            hideLogDetail(log, e);
        }

        function getSearchRule() {
            var range = utils.calcTimeRange(kalendaeData);
            console.log('para:',JSON.stringify(kalendaeData));
            //console.log('range:',range);
            console.log('from:',new Date(range.from).toISOString());
            console.log('to  :',new Date(range.to).toISOString());
            var from = range.from;
            var to = range.to;
            var searchRule = {
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
            LogService.getAllEvents(getSearchRule(), {start: curPage - 1, count: pageSize}, function (result) {
                $scope.gridOptions.isLoading = false;
                if (result.success) {
                    $scope.gridOptions.totalItems = result.total;
                    $scope.gridOptions.data = result.data;
                }
            });
        };
        getEventLog(1, $scope.gridOptions.paginationPageSize);
    });
});