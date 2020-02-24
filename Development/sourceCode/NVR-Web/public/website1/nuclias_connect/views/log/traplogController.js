/**
 * Created by lizhimin on 2016/5/24.
 */
define(["app"], function (app) {
    app.register.controller('traplogController', function ($scope, $timeout, LogService, $window, $filter, DashboardService, utils, TS) {
        /**
         * 修改页面和表格高度
         */
        setHeight();
        $timeout(function () {
            setGridHeight('traploggrid', true);
        }, 100);
        $scope.timer = null;
        window.onresize = function () {
            setHeight();
            $timeout.cancel($scope.timer);
            $scope.timer = $timeout(function () {
                setGridHeight('traploggrid', true);
            }, 300);
        };
        /**
         * 搜索条件下拉选框数据
         */
        $scope.trapVersions = [{id: 'ALL', name: 'traplog.version.All'},
            {id: 'V1', name: 'V1'},
            {id: 'V2', name: 'V2'},
            {id: 'V3', name: 'V3'}];
        $scope.trapTypes = [{id: 'ALL', name: 'traplog.type.All'},
            {id: 'coldStart', name: 'coldStart'},
            {id: 'warmStart', name: 'warmStart'},
            {id: 'linkUp', name: 'linkUp'},
            {id: 'linkDown', name: 'linkDown'},
            {id: 'authenticationFailure', name: 'authenticationFailure'},
            {id: 'egpNeighborLoss', name: 'egpNeighborLoss'},
            {id: 'enterpriseSpecific', name: 'enterpriseSpecific'}];
        $scope.optionSites = [];
        $scope.optionTypes = [{id: 'ip', name: 'column.ipv4'}, {id: 'message', name: 'column.trapMsg'}];
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
        kalendaeData = {
            from: new Date(new Date(NCTime).setTime(curDay.getTime() - 604800000)),
            to: curDay
        };
        //初始化日期控件
        getKalenda('kalendae_timeFrom', 'from');
        getKalenda('kalendae_timeTo', 'to');

        // 搜索条件
        $scope.search = {
            snmpVersion: $scope.trapVersions[0],
            genericType: $scope.trapTypes[0],
            /* site:{_id: 'ALL', siteName: 'common.allSite', networks: [{name: 'common.allNetwork', _id: 'ALL'}]},
             network:{name: 'common.allNetwork', _id: 'ALL'},*/
            from: utils.pre7DayFromNC(NCTime),
            to: utils.dateConversionFromNC(NCTime),
            search: function () {
                getAllTraps($scope.gridOptions.paginationCurrentPage, $scope.gridOptions.paginationPageSize);
            },
            export: function () {
                $scope.exporting = true;
                LogService.exportTraplog(getSearchRule(), function (result, fileName) {
                    utils.exportLogCSV(result, fileName);
                    $scope.exporting = false;
                });
            }
        };


        //});
        /**
         * ui-grid表格配置信息
         */
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
                    if (getAllTraps) {
                        getAllTraps(newPage, pageSize);
                    }
                });
            }
            // useExternalPagination: true,
        };
        $scope.gridOptions.columnDefs = [
            {
                field: 'receiveTime',
                enableHiding: false,
                width: "13%",
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
                width: "13%",
                displayName: TS.ts('column.trapTime'),
                type: 'date',
                cellFilter: 'date:"yyyy-MM-dd HH:mm:ss"'
            },
            {field: 'target.name', enableHiding: false, displayName: TS.ts('column.name'), width: "8%"},
            {
                field: 'ip', enableHiding: false, width: "10%", displayName: TS.ts('column.ipv4'),
                sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                    var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                    return utils.sortByIP(nulls, a, b);

                }
            },
            {field: 'snmpVersion', enableHiding: false, width: "8%", displayName: TS.ts('column.snmpVersion')},
            {field: 'genericType', enableHiding: false, displayName: TS.ts('column.trapType'), width: "11%"},
            /*  {
                    field: 'message', displayName:TS.ts('column.trapMsg'),  minWidth: "600", cellClass: 'ofv',
                    cellTemplate: "<div class='ui-grid-cell-contents ui-grid-more-info'>" +
                    "<ul><li ng-repeat='ms in row.entity.message'>{{ms}}</li></ul></div>"
                },*/
            {
                field: 'message',
                minWidth: "280",
                enableSorting: false,
                enableColumnMenu: false,
                enableHiding: false,
                displayName: TS.ts('column.trapMsg'),
                cellTemplate: '<div class="ui-grid-cell-contents"  >' +
                    '<span ng-mouseover="grid.appScope.showDetail(row.entity.message,$event)" ng-mouseleave="grid.appScope.hideDetail(row.entity.message,$event)">{{row.entity.message}}</span></div>'
            }


        ];
        $scope.showDetail = function (log, e) {
            showLogDetail(log, e);
        };
        $scope.hideDetail = function (log, e) {
            hideLogDetail(log, e);
        };
        $scope.gridOptions.data = [];

        function getSearchRule() {
            var range = utils.calcTimeRange(kalendaeData);
            console.log('para:',JSON.stringify(kalendaeData));
            //console.log('range:',range);
            console.log('from:',new Date(range.from).toISOString());
            console.log('to  :',new Date(range.to).toISOString());
            var from = range.from;
            var to = range.to;

            var searchRule = {
                /* siteId:$scope.search.site._id,networkId:$scope.search.network._id,*/
                snmpVersion: $scope.search.snmpVersion.id,
                genericType: $scope.search.genericType.id,
                timeRange: {from: from, to: to},
            };
            if (from > to) {
                searchRule.timeRange = {from: to, to: from};
            }
            if ($scope.searchData.value && $scope.searchData.value != "") {
                var temp = $scope.searchData.value;
                searchRule[$scope.searchData.type.id] = temp;

            }
            return searchRule;
        };

        /**
         * 获取表格信息
         */
        var getAllTraps = function (curPage, pageSize) {

            LogService.getAllTraps(getSearchRule(), {start: curPage - 1, count: pageSize}, function (result) {
                $scope.gridOptions.isLoading = false;
                if (result.success) {
                    $scope.gridCopyData = result.data;
                    $scope.gridOptions.totalItems = result.total;
                    $scope.gridOptions.data = result.data;
                }
            });
        };


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
        getAllTraps(1, $scope.gridOptions.paginationPageSize);

    });
});