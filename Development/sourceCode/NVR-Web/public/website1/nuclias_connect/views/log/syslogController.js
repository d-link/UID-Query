/**
 * Created by lizhimin on 2016/5/24.
 */
define(["app"], function (app) {
    app.register.controller('syslogController', function ($scope, $timeout, LogService, $filter, DashboardService, utils, TS) {
        setHeight('set-height', ['elementFlag'], 12);
        $timeout(function () {
            setGridHeight('syslog', true);
        }, 100);
        $scope.timer = null;
        window.onresize = function () {
            setHeight('set-height', ['elementFlag'], 12);
            $timeout.cancel($scope.timer);
            $scope.timer = $timeout(function () {
                var gridId = $scope.showTab;
                setGridHeight(gridId, true);
            }, 300);
        }
        $scope.showTab = 'syslog';
        $scope.changeTab = function (gridId) {
            $scope.showTab = gridId;
            if ($scope.showTab == 'syslog') {
                $scope.optionTypes = [{id: 'ip', name: 'column.ipv4'}, {id: 'log', name: 'column.message'}];
                $scope.searchData = {
                    type: $scope.optionTypes[0],
                    value: ''
                };
                getSyslogPage(1, $scope.gridOptions.paginationPageSize);
            } else {
                $scope.optionTypes = [{id: 'target.mac', name: 'column.apMAC'}, {
                    id: 'clientMACAddr',
                    name: 'column.stationMAC'
                }, {id: 'log', name: 'column.message'}];
                $scope.searchData = {
                    type: $scope.optionTypes[0],
                    value: ''
                };
                getEULogPage(1, $scope.eulogOptions.paginationPageSize);
            }
            $timeout(function () {
                setGridHeight(gridId, true);
            }, 100);
        };

        /*
         * 搜索条件下拉选框数据
         */
        $scope.severities = ['All', 'Emergency', 'Alert', 'Critical', 'Error', 'Warning', 'Notice', 'Information', 'Debug'];
        $scope.facilities = ['All', 'kernel messages', 'user-level messages', 'mail system',
            'system daemons', 'security/authorization messages', 'messages generated internally by syslog', 'line printer subsystem', 'network news subsystem', 'UUCP subsystem',
            'clock daemon', 'security/authorization', 'FTP daemon', 'NTP subsystem', 'log audit', 'log alert', 'scheduling daemon', 'local use 0 (local0)',
            'local use 1 (local1)', 'local use 2 (local2)', 'local use 3 (local3)',
            'local use 4 (local4)', 'local use 5 (local5)', 'local use 6 (local6)', 'local use 7 (local7)'];
        $scope.optionSites = [];
        $scope.optionTypes = [{id: 'ip', name: 'column.ipv4'}, {id: 'log', name: 'column.message'}]; // channel5Ghz2  power5Ghz2
        $scope.actions = ['All', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
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

        getKalenda('kalendae_timeFrom', 'from');
        getKalenda('kalendae_timeTo', 'to');
        // 搜索条件
        $scope.searchTab = {
            /* site:{_id: 'ALL', siteName: 'common.allSite', networks: [{name: 'common.allNetwork', _id: 'ALL'}]},
             network:{name: 'common.allNetwork', _id: 'ALL'},*/
            severity: $scope.severities[0],
            facility: $scope.facilities[0],
            action: $scope.actions[0],
            from: utils.pre7DayFromNC(NCTime),
            to: utils.dateConversionFromNC(NCTime),
            search: function () {
                if ($scope.showTab == 'syslog') {
                    getSyslogPage(1, $scope.gridOptions.paginationPageSize);
                    //getEULogPage(1, $scope.eulogOptions.paginationPageSize);
                } else {
                    getEULogPage(1, $scope.eulogOptions.paginationPageSize);
                    //getSyslogPage(1, $scope.gridOptions.paginationPageSize);
                }

            },
            export: function () {
                if ($scope.exporting) return;
                $scope.exporting = true;
                if ($scope.showTab == 'syslog') {
                    LogService.exportSyslog(getSearchRule('syslog'), function (result, fileName) {
                        utils.exportLogCSV(result, fileName);
                        $scope.exporting = false;
                    });
                } else {
                    LogService.exportEUlog(getSearchRule('syslog-eu'), function (result, fileName) {
                        utils.exportLogCSV(result, fileName);
                        $scope.exporting = false;
                    });
                }

            }
        }
        //});
        $scope.showDetail = function (log, e) {
            showLogDetail(log, e);
        };
        $scope.hideDetail = function (log, e) {
            hideLogDetail(log, e);
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
                displayName: TS.ts('column.logTime'),
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
            {
                field: 'facility',
                enableHiding: false,
                displayName: TS.ts('column.facility'),
                width: "10%",
                cellFilter: 'syslog_facility',
                sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                    var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                    return LogService.sortSyslog(nulls, a, b, 'syslog_facility');

                }
            },
            {
                field: 'severity',
                enableHiding: false,
                displayName: TS.ts('column.severity'),
                width: "8%",
                cellFilter: 'syslog_severity',
                sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                    var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                    return LogService.sortSyslog(nulls, a, b, 'syslog_severity');

                }
            },
            {field: 'euDirectiveServer', enableHiding: false, displayName: TS.ts('column.euServer'), width: "11%"},
            {
                field: 'log',
                enableSorting: false,
                enableColumnMenu: false,
                enableHiding: false,
                minWidth: "200",
                displayName: TS.ts('column.message'),
                cellTemplate: '<div class="ui-grid-cell-contents"  >' +
                    '<span ng-mouseover="grid.appScope.showDetail(row.entity.log,$event)" ng-mouseleave="grid.appScope.hideDetail(row.entity.log,$event)">{{row.entity.log}}</span></div>'
            }
        ];
        $scope.eulogOptions = {
            isLoading: true,
            paginationPageSizes: [20, 50, 100],
            paginationPageSize: 50,
            useExternalPagination: true,
            paginationTemplate: './views/templates/gridBurster.html',
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

        $scope.eulogOptions.columnDefs = [
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
                displayName: TS.ts('column.logTime'),
                type: 'date',
                cellFilter: 'date:"yyyy-MM-dd HH:mm:ss"'
            },
            {field: 'target.mac', enableHiding: false, displayName: TS.ts('column.apMAC'), width: "10%"},
            {field: 'clientMACAddr', enableHiding: false, displayName: TS.ts('column.stationMAC'), width: "10%"},
            {field: 'authType', enableHiding: false, displayName: TS.ts('column.authType'), width: "10%"},
            {field: 'userName', enableHiding: false, displayName: TS.ts('column.userId'), width: "8%"},
            {
                field: 'action',
                enableHiding: false,
                displayName: TS.ts('column.action'),
                width: "12%",
                cellFilter: 'euLogActionFilter'
            },
            {
                field: 'log',
                enableSorting: false,
                enableColumnMenu: false,
                enableHiding: false,
                minWidth: "200",
                displayName: TS.ts('column.message'),
                cellTemplate: '<div class="ui-grid-cell-contents"  >' +
                    '<span ng-mouseover="grid.appScope.showDetail(row.entity.log,$event)" ng-mouseleave="grid.appScope.hideDetail(row.entity.log,$event)">{{row.entity.log}}</span></div>'
            }
            /*  {field: 'log', displayName:TS.ts('column.message'),   width: "500",cellClass: 'ofv',cellTemplate: "<div class='ui-grid-cell-contents ui-grid-more-info'>" +
              "<div><span>{{row.entity.log}}</span></div></div>"}*/
        ];

        function getSearchRule(tag) {
            var range = utils.calcTimeRange(kalendaeData);
            console.log('para:',JSON.stringify(kalendaeData));
            //console.log('range:',range);
            console.log('from:',new Date(range.from).toISOString());
            console.log('to  :',new Date(range.to).toISOString());
            var from = range.from;
            var to = range.to;

            var searchRule = {
                timeRange: {from: from, to: to}
            };
            if (tag == 'syslog') {
                searchRule.severity = $scope.severities.indexOf($scope.searchTab.severity) - 1;
                searchRule.facility = $scope.facilities.indexOf($scope.searchTab.facility) - 1;
            } else {
                var actionIndex = $scope.actions.indexOf($scope.searchTab.action);
                if (actionIndex == 0) {
                    actionIndex = -1;
                }
                searchRule.action = actionIndex;
            }
            if ($scope.searchData.value && $scope.searchData.value != "") {
                var temp = $scope.searchData.value;
                searchRule[$scope.searchData.type.id] = temp;

            }
            return searchRule;
        }

        var getEULogPage = function (curPage, pageSize) {
            LogService.getEUSyslogs(getSearchRule('syslog-eu'), {
                start: curPage - 1,
                count: pageSize
            }, function (result) {
                $scope.eulogOptions.isLoading = false;
                if (result.success) {
                    //  $scope.gridOptions.data=result.data;
                    $scope.eulogOptions.totalItems = result.total;
                    $scope.eulogOptions.data = result.data;
                }
            })
            //或者像下面这种写法
            //$scope.myData = mydefalutData.slice(firstRow, firstRow + pageSize);
        };
        var getSyslogPage = function (curPage, pageSize) {
            LogService.getAllSyslogs(getSearchRule('syslog'), {start: curPage - 1, count: pageSize}, function (result) {
                $scope.gridOptions.isLoading = false;
                if (result.success) {
                    //  $scope.gridOptions.data=result.data;
                    $scope.gridOptions.totalItems = result.total;
                    $scope.gridOptions.data = result.data;
                }
            })
        }

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
        //getSyslogPage(1, $scope.gridOptions.paginationPageSize);
        //getEULogPage(1, $scope.eulogOptions.paginationPageSize);
    });
    var genderHash = {
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
    app.register.filter('syslog_facility', function () {

        return function (input) {
            if (!input) {
                return 'kernel messages';
            } else {
                return genderHash[input];
            }
        };
    });
    app.register.filter('syslog_severity', function () {
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
    app.register.filter('euLogActionFilter', function () {
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
