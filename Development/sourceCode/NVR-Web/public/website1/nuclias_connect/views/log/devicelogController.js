/**
 * Created by lizhimin on 2016/1/26.
 */
define(["app"], function (app) {
    app.register.controller('devicelogController', function ($scope, $timeout, $filter, LogService, DashboardService, utils, TS) {
        /**
         * 修改页面和表格高度
         */
        setHeight();
        $timeout(function () {
            setGridHeight('grid', true)
        }, 100);
        $scope.timer = null;
        window.onresize = function () {
            setHeight();
            $timeout.cancel($scope.timer);
            $scope.timer = $timeout(function () {
                setGridHeight('grid', true);
            }, 300);
        };
        /**
         * 搜索条件下拉选框数据
         */
        $scope.taskTypes = [{id: "ALL", name: 'devicelog.All'},
            {id: 'syncConfig', name: 'devicelog.syncConfig'},
            {id: 'setStatsInterval', name: 'devicelog.setStatsInterval'},
            {id: 'fwUpgrade', name: 'devicelog.fwUpgrade'},
            {id: 'sslCertificate', name: 'devicelog.sslCertificate'},
            {id: 'uploadCfg', name: 'devicelog.uploadCfg'},
            {id: 'setApChannelNum', name: 'devicelog.setApChannelNum'},
            {id: 'setDeviceLocation', name: 'devicelog.setDeviceLocation'},
            {id: 'setDeviceName', name: 'devicelog.setDeviceName'},
            {id: 'setApPower', name: 'devicelog.setApPower'},
            {id: 'reboot', name: 'devicelog.reboot'},
            {id: 'blockClient', name: 'devicelog.blockClient'},
            {id: 'unblockClient', name: 'devicelog.unblockClient'},
            {id: 'removeManagedDevs', name: 'devicelog.removeManagedDevs'},
            {id: 'addManageDevs', name: 'devicelog.addManageDevs'},
            {id: 'deleteIgnorDev', name: 'devicelog.deleteIgnorDev'},
            {id: 'getNeighborApInfo', name: 'devicelog.getNeighborApInfo'},
            {id: 'registerDevice', name: 'devicelog.registerDevice'},
            {id: 'channelIpChanged', name: 'devicelog.channelIpChanged'}];
        $scope.optionSites = [];

        $scope.optionTypes = [{id: 'target.ip', name: 'column.ipv4'}, {id: 'message1', name: 'column.resultMsg'}]; // channel5Ghz2  power5Ghz2
        /**
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
        let curDay = new Date(Date.UTC(year_iso, month_iso, day_iso, 23, 59, 59, 999));
        /**
         * @method 以NCTime也就是后台时间为准
         * @author 李莉红
         * @version
         * */
        //utils.getNodeTime(function () {
        //初始化
        kalendaeData = {
            from: new Date(new Date(NCTime).setTime(curDay.getTime() - 604800000)),
            to: curDay
        };
        //初始化日期控件
        var ca1 = getKalenda('kalendae_timeFrom', 'from');
        var ca2 = getKalenda('kalendae_timeTo', 'to');
        // 搜索条件，第一次进来的时候会显示搜索条件，只用到日期。
        $scope.search = {
            taskType: $scope.taskTypes[0],
            /* site:{_id: 'ALL', siteName: 'common.allSite', networks: [{name: 'common.allNetwork', _id: 'ALL'}]},
             network:{name: 'common.allNetwork', _id: 'ALL'},*/
            from: utils.pre7DayFromNC(NCTime),
            to: utils.dateConversionFromNC(NCTime),
            search: function () {
                getDevsLog($scope.gridOptions.paginationCurrentPage, $scope.gridOptions.paginationPageSize);
            },
            export: function () {
                $scope.exporting = true;
                //导出的时候需要显示当时系统时间的日期，在后台调查询的方法
                LogService.exportDevicelog(getSearchRule(), function (result, fileName) {
                    utils.exportLogCSV(result, fileName);
                    $scope.exporting = false;
                });
            }
        };

        //});

        /**
         * @method 初始化日期插件
         * */
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
            })
        };

        /*查询log*/
        function getSearchRule() {
            var range = utils.calcTimeRange(kalendaeData);
            console.log('para:',JSON.stringify(kalendaeData));
            //console.log('range:',range);
            console.log('from:',new Date(range.from).toISOString());
            console.log('to  :',new Date(range.to).toISOString());
            var from = range.from;
            var to = range.to;
            var searchRule = {
                taskType: $scope.search.taskType.id,
                timeRange: {from: from, to: to}
            };
            if ($scope.searchData.value && $scope.searchData.value != "") {
                var temp = $scope.searchData.value;
                searchRule[$scope.searchData.type.id] = temp;

            }
            return searchRule;
        }

        //是否导出
        $scope.exporting = false;
        /**
         * @method 显示日历的时候，blockout里面要时间，所以在这个地方查询
         * */
        $scope.showCalendae = function (tag) {
            //utils.getNodeTime(function () {
            if (tag == 'from') {
                document.getElementById('kalendae_timeFrom').focus();
            } else {
                document.getElementById('kalendae_timeTo').focus();
            }
            //})
        };
        /****
         * 表格的参数
         * */
        $scope.gridOptions = {
            isLoading: true,
            enablePagination: true, //是否分页，默认为true
            paginationPageSizes: [20, 50, 100],
            paginationPageSize: 50,
            paginationTemplate: './views/templates/gridBurster.html',
            useExternalPagination: true,
            onRegisterApi: function (gridApi) {
                $scope.gridApi = gridApi;
                //分页按钮事件
                gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                    if (getDevsLog) {
                        getDevsLog(newPage, pageSize);
                    }
                });
            }
        };
        /****
         * 表格的列显示数据，这个地方的iso时间转换要根据offset转换，一定要是最新的时区
         * */
        $scope.gridOptions.columnDefs = [
            {
                field: 'logTime', enableHiding: false,
                width: "13%",
                displayName: TS.ts('column.logTime'),
                type: 'date', sort: {
                    direction: 'desc'
                },
                cellFilter: 'ISOTimeFilter'
            },
            {field: 'target.name', enableHiding: false, displayName: TS.ts('column.name'), width: "13%"},
            {
                field: 'target.ip', enableHiding: false, width: "10%", displayName: TS.ts('column.ipv4'),
                sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                    var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                    return utils.sortByIP(nulls, a, b);

                }
            },
            {field: 'target.mac', enableHiding: false, displayName: TS.ts('column.mac'), width: "11%"},
            {
                field: 'taskType', enableHiding: false, displayName: TS.ts('column.taskType'), width: "11%",
                cellTemplate: '<div class="ui-grid-cell-contents">{{\'devicelog.\'+row.entity.taskType|translate}}</div>'
            },
            {field: 'resultType', enableHiding: false, displayName: TS.ts('column.result'), width: "7%"},
            {
                field: 'message1',
                minWidth: "200",
                displayName: TS.ts('column.resultMsg'),
                enableSorting: false,
                enableColumnMenu: false,
                cellTemplate: "<div class='ui-grid-cell-contents'><span ng-mouseover='grid.appScope.showDetail(row.entity,$event)' ng-mouseleave='grid.appScope.hideDetail(row.entity,$event)' ng-if='!row.entity.resultType||row.entity.resultType==\"Success\"'>{{row.entity.message1}}</span>" +
                    "<span ng-mouseover='grid.appScope.showDetail(row.entity,$event)' ng-mouseleave='grid.appScope.hideDetail(row.entity,$event)' ng-if='row.entity.resultType!=\"Success\"||row.entity.execResult!=\"Success\"'>{{row.entity.execResult}}</span></div>"
            }

        ];
        $scope.showDetail = function (row, e) {

            if (!row.resultType || row.resultType == 'Success') {
                if (row.execResult == 'Success') {
                    showLogDetail(row.message1, e);
                } else {
                    if (row.execResult) {
                        showLogDetail(row.message1 + " " + row.execResult, e);
                    }
                    else {
                        showLogDetail(row.message1, e);
                    }
                }
            } else {
                showLogDetail(row.execResult, e);
            }
        }
        $scope.hideDetail = function (log, e) {
            hideLogDetail(log, e);
        };

        /****
         * 第一次进页面的时候查询表格数据
         * */
        var getDevsLog = function (curPage, pageSize) {
            LogService.getAllDevs(getSearchRule(), {start: curPage - 1, count: pageSize}, function (result) {
                $scope.gridOptions.isLoading = false;
                if (result.success) {
                    $scope.gridOptions.totalItems = result.total;
                    $scope.gridOptions.data = result.data;
                }
            });
        };
        //查询devicelog
        getDevsLog(1, $scope.gridOptions.paginationPageSize);
    });
});