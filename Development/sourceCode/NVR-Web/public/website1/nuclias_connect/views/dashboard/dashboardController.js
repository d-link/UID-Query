/**
 * Created by lizhimin on 2016/1/14.
 */
define(["app", "echarts"], function (app, echarts) {

    app.register.controller('dashboardController', function ($rootScope, $scope, $uibModal, $timeout, $window,
                                                             DashboardService, statsService, $state, Current, utils, CustomService, OrganizationService, TS) {
        /*
         * 获控制内容区域高度
         */
        setHeight('set-height', [], 48);
        window.onresize = function () {
            setHeight('set-height', [], 48);
            resetChartSize();
        };
        $scope.$watch('isHide', function (val) {
            resetChartSize();
        });
        /*
         * 用于顶部四个小模块显示
         */
        $scope.summarys = [
            {name: 'site', value: 0, class: 'violet', moudleId: 'network', parentId: 'configuration'},
            {name: 'networks', value: 0, class: 'blue', moudleId: 'network', parentId: 'configuration'},
            {name: 'access', value: 0, class: 'gray', moudleId: 'accessPoint', parentId: 'monitor'},
            {name: 'clients', value: 0, class: 'green', moudleId: 'wirelessClient', parentId: 'monitor'}
        ];


        /**
         * @method 去取一下about的状态
         * @author 李莉红
         * @version
         * */
        $scope.NTPStatus1 = 0;

        function initData(isSave, isRefresh) {
            $scope.LHSelect = {};
            $scope.LHSelect.networkdays = [];
            var todaySeconds = "";
            OrganizationService.getSystemStatus(function (result) {
                if (result.success) {
                    $scope.NTPStatus1 = result.data.ntpStatus;
                }
                // $scope.NTPStatus1 = 0;
                //没找到ntp的状态
                let flag = new Date('1970/1/1');
                //$scope.NTPStatus1 = 1;
                if ($scope.NTPStatus1 == 1) {
                    var moment = new Date(NCTime) || new Date();
                    todaySeconds = parseInt((((moment.getTime() - flag.getTime()) / 1000) / 86400)) * 86400;
                    var temp = moment.getHours() * 60 * 60 + (parseInt(moment.getMinutes() / 15) - 1) * 15 * 60;
                    for (var i = 0; i < 7; i++) {
                        var date = new Date(moment);
                        date.setDate(date.getDate() - i);
                        $scope.LHSelect.networkdays.push({
                            value: todaySeconds - i * 86400,
                            str: date.Format("yyyy/MM/dd")
                        });
                    }
                    $scope.LHSelect.networkday = $scope.LHSelect.networkdays[0];
                } else {
                    //计算统计资料的时间
                    var moment = new Date(NCTime) || new Date();
                    todaySeconds = parseInt((((moment.getTime() - flag.getTime()) / 1000) / 86400)) * 86400;
                    for (var i = 0; i < 7; i++) {
                        var date = new Date(moment);
                        date.setDate(date.getDate() - i);
                        $scope.LHSelect.networkdays.push({
                            value: todaySeconds - i * 86400,
                            str: date.Format("yyyy/MM/dd")
                        });
                    }
                    $scope.LHSelect.networkday = $scope.LHSelect.networkdays[0];
                    var temp = moment.getHours() * 60 * 60 + (parseInt(moment.getMinutes() / 15) - 1) * 15 * 60;
                }
                if (temp < 0) {
                    temp = temp + 86400;
                    $scope.LHSelect.networkday = $scope.LHSelect.networkdays[1];
                }
                else if (temp >= 86400) {
                    temp = temp - 86400;
                }
                var seconds = moment.getHours() * 60 * 60 + moment.getMinutes() * 60 + moment.getSeconds();
                $scope.LHSelect.networkHours = [];
                var index = 0;
                for (var i = 0; i < 24; i++) {
                    for (var j = 0; j < 60; j += 15) {
                        var item = {
                            index: index++,
                            value: i * 60 * 60 + j * 60,
                            str: (i < 10 ? "0" + i : i) + ":" + (j < 10 ? "0" + j : j)
                        };
                        $scope.LHSelect.networkHours.push(item);
                        if (item.value == temp) {
                            $scope.LHSelect.networkHour = item;
                        }
                    }
                }

                getDashboardData(isSave, isRefresh);
                /**
                 * 折线图mock数据
                 */
                $scope.searchLasthourDiagram = function (isSave, isRefresh) {
                    if (!isRefresh) {
                        showChartsLoading();
                    }
                    if (isSave) {
                        if (!$rootScope.customAction) {
                            $rootScope.customAction = {};
                        }
                        $rootScope.customAction.site = $scope.LHSelect.site._id;
                        $rootScope.customAction.network = $scope.LHSelect.network.agentUUID;
                    }

                    var offset = NCTimeOffset;
                    if ($scope.NTPStatus1 == 1) {
                        var startDay = new Date(NCTime);
                        startDay.setDate(startDay.getDate() - 6);
                        var endDay = new Date(NCTime);
                        endDay.setDate(endDay.getDate());
                        var param = {
                            ntpStatus: $scope.NTPStatus1,
                            timestampArr: getTimestampArr($scope.LHSelect.networkHour.value, 8),
                            timestampMap: getTimestampMap($scope.LHSelect.networkday.value, $scope.LHSelect.networkHour.value, 5),
                            site: $scope.LHSelect.site._id,
                            uuid: $scope.LHSelect.network.agentUUID ? $scope.LHSelect.network.agentUUID : $scope.LHSelect.network._id,
                            startDay: getBinDate(startDay),
                            endDay: getBinDate(endDay)
                        };
                    } else {
                        var param = {
                            ntpStatus: $scope.NTPStatus1,
                            timestampMap: getTimestampMap($scope.LHSelect.networkday.value, $scope.LHSelect.networkHour.value, 5),
                            site: $scope.LHSelect.site._id,
                            uuid: $scope.LHSelect.network.agentUUID ? $scope.LHSelect.network.agentUUID : $scope.LHSelect.network._id,
                        };
                    }


                    function getBinDate(date) {
                        let flag = new Date('1970/1/1');
                        date = new Date(date);
                        var dateSeconds = ((date.getTime() - flag.getTime()) / 1000);
                        return parseInt((dateSeconds + offset * 60) / 86400) * 86400;
                    }

                    function getTimestampMap(binDate, timestamp, length) {
                        var result = [];
                        for (var i = -4; i < length - 4; i++) {
                            var temp = timestamp + 15 * 60 * i + offset * 60;
                            if ((binDate == todaySeconds && timestamp + 15 * 60 * i > seconds) || binDate > todaySeconds) {
                                continue;
                            }
                            if (temp < 0) {
                                temp = temp + 86400;
                                result.push({binDate: binDate - 86400, timestamp: temp});
                            }
                            else if (temp >= 86400) {
                                temp = temp - 86400;
                                result.push({binDate: binDate + 86400, timestamp: temp});
                            } else {
                                result.push({binDate: binDate, timestamp: temp});
                            }
                        }
                        return result;
                    }

                    function getTimestampArr(timestamp, length) {
                        var result = [];
                        for (var i = -4; i < length - 4; i++) {
                            var temp = timestamp + 15 * 60 * i + offset * 60;
                            if (temp < 0) temp = temp + 86400;
                            else if (temp >= 86400) temp = temp - 86400;
                            result.push(temp);
                        }
                        return result;
                    }

                    var index = $scope.LHSelect.networkHour.index;
                    var fiveArrLabel = [];
                    var eightArrLabel = [];
                    if ($scope.NTPStatus1 == 1) {
                        for (var i = -4; i < 4; i++) {
                            var s = index + i;
                            if (s >= 96) s = s - 96;
                            else if (s < 0) s = s + 96;
                            if (i <= 0) {
                                fiveArrLabel.push($scope.LHSelect.networkHours[s].str);
                            }
                            eightArrLabel.push($scope.LHSelect.networkHours[s].str);
                        }
                        $scope.lastHourNumberCharts.options.xAxis[0].data = eightArrLabel;
                        $scope.lastHourTrafficCharts.options.xAxis[0].data = eightArrLabel;
                        $scope.lastHourTrafficDownUpCharts.options.xAxis[0].data = fiveArrLabel;
                        $scope.lastHourTrafficSsidCharts.options.xAxis[0].data = fiveArrLabel;
                    } else {
                        for (var i = -5; i < 0; i++) {
                            var s = index + i;
                            if (s >= 96) s = s - 96;
                            else if (s < 0) s = s + 96;
                            if (i <= 0) {
                                fiveArrLabel.push($scope.LHSelect.networkHours[s].str);
                            }
                        }
                        fiveArrLabel[0] = TS.ts("dashboard.last60");
                        fiveArrLabel[1] = TS.ts("dashboard.last45");
                        fiveArrLabel[2] = TS.ts("dashboard.last30");
                        fiveArrLabel[3] = TS.ts("dashboard.last15");
                        fiveArrLabel[4] = TS.ts("dashboard.now");
                        $scope.lastHourNumberCharts.options.xAxis[0].data = fiveArrLabel;
                        $scope.lastHourTrafficCharts.options.xAxis[0].data = fiveArrLabel;
                        $scope.lastHourTrafficDownUpCharts.options.xAxis[0].data = fiveArrLabel;
                        $scope.lastHourTrafficSsidCharts.options.xAxis[0].data = fiveArrLabel;
                    }

                    statsService.getLastHourUniqueClients(param, function (result) {
                        if (result.success && result.data) {
                            var title = "";
                            if ($scope.NTPStatus1 == 1) {
                                title = TS.ts('dashboard.lastHourNumber') + TS.ts('dashboard.clientsPer7days');
                                $scope.lastHourNumberCharts.options.legend.data = [TS.ts('report.average'), TS.ts('report.high'), TS.ts('report.lasthour')];
                            } else {
                                title = TS.ts('dashboard.lastHourNumber');
                                $scope.lastHourNumberCharts.options.legend.data = [];
                            }
                            $scope.lastHourNumberCharts.options.title.text = title + (result.data.unit ? (" (" + result.data.unit + ")") : "");
                            $scope.lastHourNumberCharts.options.series[0].name = TS.ts('report.average');
                            $scope.lastHourNumberCharts.options.series[1].name = TS.ts('report.high');
                            $scope.lastHourNumberCharts.options.series[2].name = TS.ts('report.lasthour');
                            $scope.lastHourNumberCharts.options.series[0].data = result.data.average;
                            $scope.lastHourNumberCharts.options.series[1].data = result.data.high;
                            $scope.lastHourNumberCharts.options.series[2].data = result.data.lastHour;
                            $scope.lastHourNumberCharts.options.needInit = true;
                            $scope.numCharts.hideLoading();
                        } else {
                            $scope.numCharts.hideLoading();
                        }
                    });
                    statsService.getLastHourTraffic(param, function (result) {
                        if (result.success && result.data) {
                            var title = "";
                            if ($scope.NTPStatus1 == 1) {
                                title = TS.ts('dashboard.lastHourTraffic') + TS.ts('dashboard.trafficPer7days');
                                $scope.lastHourTrafficCharts.options.legend.data = [TS.ts('report.average'), TS.ts('report.high'), TS.ts('report.lasthour')];
                            } else {
                                title = TS.ts('dashboard.lastHourTraffic');
                                $scope.lastHourTrafficCharts.options.legend.data = [];
                            }
                            $scope.lastHourTrafficCharts.options.title.text = title + (result.data.unit ? (" (" + result.data.unit + ")") : "");
                            $scope.lastHourTrafficCharts.options.series[0].name = TS.ts('report.average');
                            $scope.lastHourTrafficCharts.options.series[1].name = TS.ts('report.high');
                            $scope.lastHourTrafficCharts.options.series[2].name = TS.ts('report.lasthour');
                            $scope.lastHourTrafficCharts.options.series[0].data = result.data.average;
                            $scope.lastHourTrafficCharts.options.series[1].data = result.data.high;
                            $scope.lastHourTrafficCharts.options.series[2].data = result.data.lastHour;
                            $scope.lastHourTrafficCharts.options.needInit = true;
                            $scope.trafficCharts.hideLoading();
                        } else {
                            $scope.trafficCharts.hideLoading();
                        }
                    })
                    statsService.getLastHourTrafficTxRx(param, function (result) {
                        if (result.success && result.data) {
                            $scope.lastHourTrafficDownUpCharts.options.title.text = TS.ts('dashboard.lastHourTrafficDownUp') + (result.data.unit ? (" (" + result.data.unit + ")") : "");
                            $scope.lastHourTrafficDownUpCharts.options.legend.data = [TS.ts('label.downlink'), TS.ts('label.uplink')];
                            $scope.lastHourTrafficDownUpCharts.options.series[0].name = TS.ts('label.downlink');
                            $scope.lastHourTrafficDownUpCharts.options.series[1].name = TS.ts('label.uplink');
                            $scope.lastHourTrafficDownUpCharts.options.series[0].data = result.data.tx;
                            $scope.lastHourTrafficDownUpCharts.options.series[1].data = result.data.rx;
                            $scope.lastHourTrafficDownUpCharts.options.needInit = true;
                            $scope.downCharts.hideLoading();
                        } else {
                            $scope.downCharts.hideLoading();
                        }
                    })
                    //注明：重新设置option跟showloading有关，暂时去掉
                    //$scope.lastHourTrafficSsidCharts.options.legend.data = [];
                    //$scope.lastHourTrafficSsidCharts.options.series = [];
                    statsService.getLastHourTrafficSSID(param, function (result) {
                        if (result.success && result.data) {
                            $scope.lastHourTrafficSsidCharts.options.title.text = TS.ts('dashboard.lastHourTrafficSsid') + (result.unit ? (" (" + result.unit + ")") : "");
                            var tempLegend = [];
                            var tempSeries = [];
                            for (var i = 0; i < result.data.length; i++) {
                                tempLegend.push(result.data[i].ssid);
                                var index = (parseInt(i / 5) + i % 5 * 4) % 10;
                                tempSeries.push(
                                    {
                                        name: result.data[i].ssid,
                                        color: [pieColor[index]],
                                        type: 'line',
                                        stack: '总量',
                                        areaStyle: {
                                            normal: {
                                                color: areaColor[index],
                                                default: i == 0 ? 'default' : undefined
                                            }
                                        },
                                        symbol: 'circle',
                                        symbolSize: 4,
                                        smooth: false,
                                        hoverAnimation: false,
                                        data: result.data[i].value
                                    }
                                );
                            }
                            $scope.lastHourTrafficSsidCharts.options.legend.data = tempLegend;
                            $scope.lastHourTrafficSsidCharts.options.series = tempSeries;
                            $scope.lastHourTrafficSsidCharts.options.needInit = true;
                            $scope.ssidCharts.hideLoading();
                        } else {
                            $scope.ssidCharts.hideLoading();
                        }
                    })
                };
            });
        }

        initData();

        //做日期减一天的操作
        $scope.subtractionTimeDay = function () {
            for (var i = 0; i < $scope.LHSelect.networkdays.length; i++) {
                if ($scope.LHSelect.networkday == $scope.LHSelect.networkdays[i]) {
                    if (i == $scope.LHSelect.networkdays.length - 1) {
                        $scope.LHSelect.networkday = $scope.LHSelect.networkdays[0];
                    } else {
                        $scope.LHSelect.networkday = $scope.LHSelect.networkdays[i + 1];
                    }
                    break;
                }
            }
        };
        //做日期加一天的操作
        $scope.addTimeDay = function () {
            for (var i = 0; i < $scope.LHSelect.networkdays.length; i++) {
                if ($scope.LHSelect.networkday == $scope.LHSelect.networkdays[i]) {
                    if (i == 0) {
                        $scope.LHSelect.networkday = $scope.LHSelect.networkdays[$scope.LHSelect.networkdays.length - 1];
                    } else {
                        $scope.LHSelect.networkday = $scope.LHSelect.networkdays[i - 1];
                    }
                    break;
                }
            }
        };
        //做时间段加一段的操作
        $scope.addTimeHour = function () {
            for (var i = 0; i < $scope.LHSelect.networkHours.length; i++) {
                if ($scope.LHSelect.networkHour == $scope.LHSelect.networkHours[i]) {
                    if (i == $scope.LHSelect.networkHour.length - 1) {
                        $scope.LHSelect.networkHour = $scope.LHSelect.networkHours[0];
                    } else {
                        $scope.LHSelect.networkHour = $scope.LHSelect.networkHours[i + 1];
                    }
                    break;
                }
            }
        };
        //做时间段减一段的操作
        $scope.subtractionTimeHour = function () {
            for (var i = 0; i < $scope.LHSelect.networkHours.length; i++) {
                if ($scope.LHSelect.networkHour == $scope.LHSelect.networkHours[i]) {
                    if (i == 0) {
                        $scope.LHSelect.networkHour = $scope.LHSelect.networkHours[$scope.LHSelect.networkHours.length - 1];
                    } else {
                        $scope.LHSelect.networkHour = $scope.LHSelect.networkHours[i - 1];
                    }
                    break;
                }
            }
        };
        /*
         * 跳转链接
         */
        $scope.gotoOtherPage = function (moudleId, parentId) {
            $state.go('user.org.subdetail', {moudleId: moudleId, parentId: parentId});
        }

        /*
         * 获取数据
         */
        function getStateSummary() {
            DashboardService.getStateSummary(function (result) {
                if (result.success) {
                    $scope.summarys[0].value = result.data.siteCount;
                    $scope.summarys[1].value = result.data.networkCount;
                    $scope.summarys[2].value = {online: result.data.apOnline, total: result.data.apCount};
                    $scope.summarys[3].value = result.data.clientCount;
                }
            });
        }


        /*
         * 下拉选框内容
         */
        $scope.optionSites = [];

        // 获取site、network下拉框数据
        function getDashboardData(isSave, isRefresh) {
            getStateSummary();
            getChannelUsed();
            DashboardService.getSiteAndNetwork(function (result) {
                if (result.success) {
                    $scope.optionSites = result.data;
                    // 添加 all network
                    var allNetwork = [{name: 'common.allNetwork', _id: 'ALL', agentUUID: 'ALL'}];
                    for (var i = 0; i < $scope.optionSites.length; i++) {
                        allNetwork = allNetwork.concat($scope.optionSites[i].networks);
                        $scope.optionSites[i].networks.unshift({
                            name: 'common.allNetwork',
                            _id: 'ALL',
                            agentUUID: 'ALL'
                        });
                    }
                    $scope.optionSites.unshift({siteName: 'common.allSite', networks: allNetwork, _id: 'ALL'});

                    $scope.optionSites.sort(function (a, b) {
                        if (a._id == "ALL") return -1;
                        if (b._id == "ALL") return 1;
                        if (a.siteName == b.siteName) return 0;
                        if (a.siteName > b.siteName) return 1;
                        if (a.siteName < b.siteName) return -1;
                        return 0;
                    });
                    for (var i = 0; i < $scope.optionSites.length; i++) {
                        $scope.optionSites[i].networks.sort(function (a, b) {
                            if (a._id == "ALL") return -1;
                            if (b._id == "ALL") return 1;
                            if (a.name == b.name) return 0;
                            if (a.name > b.name) return 1;
                            if (a.name < b.name) return -1;
                            return 0;
                        })
                    }

                    // select 赋值
                    $scope.LHSelect.site = $scope.optionSites[0];
                    $scope.LHSelect.network = $scope.LHSelect.site.networks[0];
                    $scope.LESelect = {site: $scope.optionSites[0]};
                    $scope.LESelect.network = $scope.LESelect.site.networks[0];


                    // test code
                    /*
                     * 获取并设置用户使用记录
                     *
                     */
                    CustomService.getPageAction(function (result) {
                        if (result.success) {
                            var data = result.data;
                            $rootScope.customAction = result.data;
                            if (data) {
                                // 根据用户习惯，初始化select选择
                                for (var i = 0; i < $scope.optionSites.length; i++) {
                                    if (data) {
                                        if ($scope.optionSites[i]._id == data.site) {
                                            for (var j = 0; j < $scope.optionSites[i].networks.length; j++) {
                                                if ($scope.optionSites[i].networks[j].agentUUID == data.network) {
                                                    $scope.LHSelect.site = $scope.optionSites[i];
                                                    $scope.LHSelect.network = $scope.optionSites[i].networks[j];
                                                    $scope.LESelect.site = $scope.optionSites[i];
                                                    $scope.LESelect.network = $scope.optionSites[i].networks[j];
                                                }
                                            }
                                        }
                                    }

                                }
                            }

                            //  getTOPApUsage($scope.APSelect.site._id, $scope.APSelect.network._id);
                            $scope.searchLasthourDiagram(isSave, isRefresh);
                            getLatestEvents($scope.LESelect.site, $scope.LESelect.network);
                        }
                    });
                    // test code
                }
            })
        }

        /*
         * 选择site时，设置network选择第一项
         */
        $scope.changeLHSite = function () {
            $scope.LHSelect.network = $scope.LHSelect.site.networks[0];
        };
        /*
         * 选择site时，设置network选择第一项
         */
        $scope.changeLESite = function () {
            $scope.LESelect.network = $scope.LESelect.site.networks[0];
        };
        /*
         * 跳转页面 Monitor -> Access Point
         */
        $scope.gotoAP = function () {
            Current.setDeviceList('AP');
            $state.go('user.org.subdetail', {moudleId: 'accessPoint', parentId: 'monitor'});
        };
        /*
         * 跳转页面 Log -> System Event Log
         */
        $scope.gotoLE = function () {
            $state.go('user.org.subdetail', {moudleId: 'systemlog', parentId: 'log'});
        };
        $scope.gotoNetwork = function () {
            $state.go('user.org.subdetail', {moudleId: 'network', parentId: 'configuration'});
        }
        /*
         * ui-grid表格配置信息
         */
        $scope.lastEventsOptions = {
            //  enableGridMenu: true,
            isLoading: true,
            enableSorting: true,
            columnDefs: [
                {
                    field: 'logTime',
                    displayName: TS.ts('column.logTime'),
                    cellFilter: 'ISOTimeFilter',
                    width: '15%',
                    sort: {
                        direction: 'desc'
                    }
                },
                {
                    field: 'logType', displayName: TS.ts('column.eventType'), width: '15%',
                    cellTemplate: '<div class="ui-grid-cell-contents">{{\'systemlog.logType\'+row.entity.logType|translate}}</div>'
                },
                {
                    field: 'network', displayName: TS.ts('column.network'), width: '10%',
                    cellTemplate: '<div class="ui-grid-cell-contents"><a style="cursor:pointer;" ref="friend" ng-click="grid.appScope.gotoNetwork()">{{row.entity.network}}</a></div>'
                },
                {
                    field: 'ip', displayName: TS.ts('column.ipv4'), width: '12%',
                    cellTemplate: '<div class="ui-grid-cell-contents"><a target="_blank" ref="friend" href="http://{{row.entity.ip}}" rel="noopener noreferrer">{{row.entity.ip}}</a></div>',

                    sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                        var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                        return utils.sortByIP(nulls, a, b);

                    }
                },
                {field: 'mac', displayName: TS.ts('column.mac'), width: "16%"},


                {
                    field: 'message',
                    displayName: TS.ts('column.message'),
                    width: "30%",
                    cellTemplate: '<div class="ui-grid-cell-contents"  >' +
                        '<span  ng-mouseover="grid.appScope.showDetail(row.entity.message,$event)" ng-mouseleave="grid.appScope.hideDetail(row.entity.message,$event)">{{row.entity.message}}</span></div>'
                },
            ],
            data: [],
            onRegisterApi: function (gridApi) {
                $scope.gridApi = gridApi;
            }
        };
        $scope.showDetail = function (message, e) {
            showLogDetail(message, e);
        }
        $scope.hideDetail = function (message, e) {
            hideLogDetail(message, e);
        }
        /*
         * 存储查看的设备信息
         */
        $scope.saveCurrentDevice = function (device) {
            Current.setDevice(device);
        };


        function resetChartSize() {
            var left = 212;
            if ($scope.isHide) {
                left = 96;
            }
            $scope.Chartsize = {
                width: (document.body.clientWidth - left) / 2 - 24,
                height: 231
            }
            $scope.size1 = {
                width: (document.body.clientWidth - left) - 24,
                height: 160
            };
            $scope.size2 = {
                width: (document.body.clientWidth - left) - 24,
                height: 160
            };
            if (document.body.clientWidth < 992) {
                $scope.size = {
                    width: (document.body.clientWidth - left) - 24,
                    height: 231
                };

            } else {
                $scope.size = {
                    width: (document.body.clientWidth - left) / 2 - 24,
                    height: 231
                };
            }

        }

        /*
         * echart 折线图标大小
         */
        $scope.Chartsize = {
            width: (document.body.clientWidth - 212) / 2 - 24,
            height: 231
        }
        /*
         * echart Pie图表大小
         */
        $scope.size = {
            width: (document.body.clientWidth - 212) / 2 - 24,
            height: 231
        };
        $scope.size1 = {
            width: (document.body.clientWidth - 212) - 24,
            height: 160
        };
        $scope.size2 = {
            width: (document.body.clientWidth - 212) - 24,
            height: 160
        };
        //showChartsLoading();
        /*显示正在加载*/
        function showChartsLoading() {
            //setTimeout(() => {
            $scope.numCharts = echarts.init(document.getElementById('lastHourNumberCharts'));
            $scope.trafficCharts = echarts.init(document.getElementById('lastHourTrafficCharts'));
            $scope.downCharts = echarts.init(document.getElementById('lastHourTrafficDownUpCharts'));
            $scope.ssidCharts = echarts.init(document.getElementById('lastHourTrafficSsidCharts'));
            // 调用showLoading方法
            $scope.numCharts.showLoading({
                text: TS.ts('column.loading'),
                color: '#D5D5D5',
                textColor: '#000',
                maskColor: 'rgba(255, 255, 255, 0.8)',
                zlevel: 0,
            });
            $scope.trafficCharts.showLoading({
                text: TS.ts('column.loading'),
                color: '#D5D5D5',
                textColor: '#000',
                maskColor: 'rgba(255, 255, 255, 0.8)',
                zlevel: 0,
            });
            $scope.downCharts.showLoading({
                text: TS.ts('column.loading'),
                color: '#D5D5D5',
                textColor: '#000',
                maskColor: 'rgba(255, 255, 255, 0.8)',
                zlevel: 0,
            });
            $scope.ssidCharts.showLoading({
                text: TS.ts('column.loading'),
                color: '#D5D5D5',
                textColor: '#000',
                maskColor: 'rgba(255, 255, 255, 0.8)',
                zlevel: 0,
            });
            //}, 0);
        }
        /*
         * 折线图配置参数
         */
        $scope.lastHourNumberCharts = {
            options: {
                title: {
                    top: 0,
                    left: 24,
                    display: true,
                    text: TS.ts('dashboard.lastHourNumber')
                },
                legend: {
                    icon: 'rect',
                    selectedMode: true,
                    formatter: "{name}",
                    bottom: 0,
                    right: 8,
                    data: ['Average', 'High', 'Last Hour']
                },
                grid: {
                    show: true,
                    left: 24,
                    top: 44,
                    right: 24,
                    bottom: 48,
                    containLabel: true
                },
                xAxis: [
                    {
                        splitLine: {
                            show: true
                        },
                        type: 'category',
                        data: []
                    }
                ],
                yAxis: [
                    {
                        name: '', // 需根据实际数据修改
                        type: 'value'
                    }
                ],
                series: [
                    {
                        name: 'Average',
                        color: ['#f59d24'],
                        type: 'line',
                        symbol: 'circle',
                        symbolSize: 4,
                        smooth: false,
                        hoverAnimation: false,
                        data: []
                    },
                    {
                        name: 'High',
                        color: ['#607896'],
                        type: 'line',
                        symbol: 'circle',
                        symbolSize: 4,
                        smooth: false,
                        hoverAnimation: false,
                        data: []
                    },
                    {
                        name: 'Last Hour',
                        color: ['#22b7db'],
                        type: 'line',
                        symbol: 'circle',
                        symbolSize: 4,
                        smooth: false,
                        hoverAnimation: false,
                        data: []
                    }
                ]
            }
        };

        $scope.lastHourTrafficCharts = {
            options: {
                title: {
                    top: 0,
                    left: 24,
                    display: true,
                    text: TS.ts('dashboard.lastHourTraffic')
                },
                legend: {
                    icon: 'rect',
                    selectedMode: true,
                    formatter: "{name}",
                    bottom: 0,
                    right: 8,
                    data: ['Average(MB)', 'High(MB)', 'Last Hour(MB)']
                },
                grid: {
                    show: true,
                    left: 24,
                    top: 44,
                    right: 24,
                    bottom: 48,
                    containLabel: true
                },
                xAxis: [
                    {
                        splitLine: {
                            show: true
                        },
                        nameTextStyle: {
                            fontSize: 12,
                            rich: {}
                        },
                        type: 'category',
                        data: []
                    }
                ],
                yAxis: [
                    {
                        name: '', // 需根据实际数据修改
                        type: 'value'
                    }
                ],
                series: [
                    {
                        name: 'Average(MB)',
                        color: ['#f59d24'],
                        type: 'line',
                        symbol: 'circle',
                        symbolSize: 4,
                        smooth: false,
                        hoverAnimation: false,
                        data: []
                    },
                    {
                        name: 'High(MB)',
                        color: ['#607896'],
                        type: 'line',
                        symbol: 'circle',
                        symbolSize: 4,
                        smooth: false,
                        hoverAnimation: false,
                        data: []
                    },
                    {
                        name: 'Last Hour(MB)',
                        color: ['#22b7db'],
                        type: 'line',
                        symbol: 'circle',
                        symbolSize: 4,
                        smooth: false,
                        hoverAnimation: false,
                        data: []
                    }
                ]
            }
        };

        $scope.lastHourTrafficDownUpCharts = {
            options: {
                title: {
                    top: 0,
                    left: 24,
                    display: true,
                    text: TS.ts('dashboard.lastHourTrafficDownUp')
                },
                legend: {
                    icon: 'rect',
                    selectedMode: true,
                    formatter: "{name}",
                    bottom: 0,
                    right: 8,
                    data: ['Downlink(MB)', 'Uplink(MB)']
                },
                grid: {
                    show: true,
                    left: 24,
                    top: 44,
                    right: 24,
                    bottom: 58,
                    containLabel: true
                },
                xAxis: [
                    {
                        splitLine: {
                            show: true
                        },
                        nameTextStyle: {
                            fontSize: 12,
                            rich: {}
                        },
                        type: 'category',
                        data: []
                    }
                ],
                yAxis: [
                    {
                        name: '', // 需根据实际数据修改
                        type: 'value'
                    }
                ],
                // dataZoom: {
                //     show: true,
                //     start: 0
                // },
                series: [
                    {
                        name: 'Downlink(MB)',
                        color: ['#22b7db'],
                        type: 'line',
                        stack: '总量',
                        areaStyle: {
                            normal: {
                                color: 'rgba(34,183,219,0.2)',
                            }
                        },
                        symbol: 'circle',
                        symbolSize: 4,
                        smooth: false,
                        hoverAnimation: false,
                        data: []
                    }, {
                        name: 'Uplink(MB)',
                        color: ['#afcb20'],
                        type: 'line',
                        stack: '总量',
                        areaStyle: {
                            normal: {
                                color: 'rgba(175,203,32,0.2)',
                            }
                        },
                        symbol: 'circle',
                        symbolSize: 4,
                        smooth: false,
                        hoverAnimation: false,
                        data: []
                    }
                ]
            }
        };

        $scope.lastHourTrafficSsidCharts = {
            options: {
                title: {
                    top: 0,
                    left: 24,
                    display: true,
                    text: TS.ts('dashboard.lastHourTrafficSsid')
                },
                legend: {
                    type: 'scroll',
                    icon: 'rect',
                    selectedMode: true,
                    formatter: function (name) {
                        if (name.length > 10) {
                            return name.substring(0, 10) + "...";
                        }
                        return name;
                    },
                    tooltip: {
                        show: true
                    },
                    bottom: 0,
                    right: 8,
                    data: []
                },
                grid: {
                    show: true,
                    left: 24,
                    top: 44,
                    right: 24,
                    bottom: 58,
                    containLabel: true
                },
                xAxis: [
                    {
                        splitLine: {
                            show: true
                        },
                        nameTextStyle: {
                            fontSize: 12,
                            rich: {}
                        },
                        type: 'category',
                        data: []
                    }
                ],
                yAxis: [
                    {
                        name: '', // 需根据实际数据修改
                        type: 'value'
                    }
                ],
                // dataZoom: {
                //     show: true,
                //     start: 0
                // },
                series: []
            }
        };


        /*
         * 饼图色值
         */
        var pieColor = [
            "#22b7db", "#02a1d1", "#028fba", "#037ca8", "#03668a",
            "#025a7a", "#b3eefc", "#82e2fa", "#4fd6f7", "#2accf5"
        ];
        var areaColor = ["rgba(34,183,219,0.2)", "rgba(02,161,209,0.2)", "rgba(02,143,186,0.2)", "rgba(03,124,168,0.2)",
            "rgba(03,102,138,0.2)", "rgba(02,90,122,0.2)", "rgba(179,238,252,0.2)", "rgba(130,226,250,0.2)", "rgba(79,214,247,0.2)", "rgba(42,204,245,0.2)"];
        $scope.channel24Bar = {
            options: {
                maxValue: 30,
                maxBar: 25,
                title: TS.ts('dashboard.AP24Channel'),
                series: [[[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0]]]
            }
        };
        /*  $scope.test5={
         options:{
         series:[{data:[[32,0],[36,0],[40,10],[44,10],[48,20],[52,0],[56,12],[60,15],[64,10],[100,4],[104,10],[108,1],[112,9]]},
         {data:[[116,0],[102,0],[124,10],[128,10],[132,20],[136,0],[140,12],[144,15],[149,10],[153,4],[157,10],[161,1],[165,9]]}]
         }
         };*/
        $scope.channel5Bar = {
            options: {
                maxValue: 30,
                maxBar: 25,
                title: TS.ts('dashboard.AP5Channel'),
                series: [[[36, 0], [40, 0], [44, 0], [48, 0], [52, 0], [56, 0], [60, 0], [64, 0], [100, 0], [104, 0], [108, 0], [112, 0], [116, 0], [120, 0], [124, 0], [128, 0], [132, 0], [136, 0], [140, 0], [144, 0], [149, 0], [153, 0], [157, 0], [161, 0], [165, 0]]]
            }
        };

        /*
         * 获取饼图信息
         */
        function getChannelUsed() {
            DashboardService.getChannelUsedSummary({}, function (result) {
                if (result.success) {
                    var data = result.data;
                    $scope.channel24Bar.options.maxValue = data.maxValue;
                    $scope.channel5Bar.options.maxValue = data.maxValue;
                    $scope.channel24Bar.options.series = data.ch24;
                    $scope.channel5Bar.options.series = data.ch5;
                }
            });
        };

        /*
         * 获取表格数据
         */
        function getLatestEvents(site, network) {
            $scope.lastEventsOptions.isLoading = true;

            DashboardService.getLatestEvents({siteId: site._id, networkId: network._id}, function (result) {
                $scope.lastEventsOptions.isLoading = false;
                if (result.success) {
                    $scope.lastEventsOptions.data = result.data;
                }
            });
        };
        $scope.$on('freshDashboard', function () {
            getStateSummary();
            getChannelUsed();
            //console.log(NCTime);
            var minute = new Date(NCTime).getMinutes();
            var flag = minute % 15;
            //console.log(minute);
            //console.log(flag);
            if (flag <= 3 && flag > 1) {
                //$scope.searchLasthourDiagram();
                initData(false, true);
            }
            if ($scope.LESelect) {
                if ($scope.LESelect.site && $scope.LESelect.network) {
                    getLatestEvents($scope.LESelect.site, $scope.LESelect.network);
                }
            }
        });
        /*
         * 根据site、network搜索数据
         */

        /*
         * 根据site、network搜索数据
         */
        $scope.searchLatestEvents = function (isSave) {
            if (isSave) {
                // 存储用户习惯
                if (!$rootScope.customAction) {
                    $rootScope.customAction = {};
                }
                $rootScope.customAction.site = $scope.LESelect.site._id;
                $rootScope.customAction.network = $scope.LESelect.network.agentUUID;
            }
            getLatestEvents($scope.LESelect.site, $scope.LESelect.network);
        };
    });
});