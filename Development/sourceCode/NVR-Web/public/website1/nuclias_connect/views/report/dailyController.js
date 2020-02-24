/**
 * Created by guojiangchao on 2018/2/12.
 */
define(["app", "echarts"], function (app, echarts) {
    app.register.controller('dailyController', function ($rootScope, $scope, Current, DashboardService, statsService, ReportExportService, CustomService, TS, utils) {

        setHeight();
        window.onresize = function () {
            setHeight();
            resetCartSize();
        };
        $scope.$watch('isHide', function (val) {
            resetCartSize();

        })

        function resetCartSize() {
            if ($scope.isHide) {
                $scope.size = {
                    width: document.body.clientWidth - 280,
                    height: 280
                }
            } else {
                $scope.size = {
                    width: document.body.clientWidth - 324,
                    height: 280
                }
            }
        }


        $scope.daily = {
            trafficUsage: true,
            uniqueClients: true,
            period: "quarter",
            export: "pdf",
            threshold: {
                clients: 900,
                traffic: 900
            }
        };
        $scope.NTPStatus1 = 0;
        $scope.optionSites = [];
        var k1 = {};
        var k2 = {};
        // utils.getNodeTime(function () {
        k1 = new Kalendae.Input('kalendae_timeFrom', {
            months: 1,
            direction: 'any',
            mode: 'single',
            selected: [Kalendae.moment(NCTime).subtract({d: 7})],
            format: 'YYYY.MM.DD',
            closeButton: false,
            offsetTop: 1,
            offsetLeft: 1,
            blackout: function (date) {
                return Kalendae.moment(NCTime).subtract({d: 7}) > date || Kalendae.moment(NCTime) < date;
            }
        });

        k2 = new Kalendae.Input('kalendae_timeTo', {
            months: 1,
            direction: 'any',
            mode: 'single',
            selected: [Kalendae.moment(NCTime).subtract({d: 1})],
            format: 'YYYY.MM.DD',
            closeButton: false,
            offsetTop: 1,
            offsetLeft: 1,
            blackout: function (date) {
                return Kalendae.moment(NCTime).subtract({d: 7}) > date || Kalendae.moment(NCTime) < date;
            }
        });

        // 获取site、network下拉框数据
        DashboardService.getSiteAndNetwork(function (result) {
            //statsService.getDailySiteNetworks(function (result) {
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

                $scope.daily.site = $scope.optionSites[0];
                $scope.daily.network = $scope.daily.site.networks[0];
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
                                                $scope.daily.site = $scope.optionSites[i];
                                                $scope.daily.network = $scope.optionSites[i].networks[j];
                                            }
                                        }
                                    }
                                }

                            }
                        }
                        $scope.searchDailyDiagram();
                    }
                });

            }
        });
        //});


        $scope.changeSite = function () {
            $scope.daily.network = $scope.daily.site.networks[0];
        };

        $scope.exporting = false;
        /**
         * Export data and image to pdf file
         */
        $scope.export2PDF = function () {
            $scope.exporting = true;
            //get canvases data
            var dailyTrafficDiv = document.getElementById("dailyTrafficUsageDiv");
            var dailyTrafficCanvas = dailyTrafficDiv.firstElementChild.firstElementChild;
            dailyTrafficCanvas.style.background = '#FFF';
            var dailyTrafficDataURL = dailyTrafficCanvas.toDataURL('image/png');

            var reqParams = {
                userName: Current.user().username,
                DailyTrafficImg: dailyTrafficDataURL,
                scopes: xAxisData,
                params: $scope.daily.params
            };

            //request the server and download the pdf
            ReportExportService.exportDailyTraffic2PDF(reqParams, function (result) {
                utils.downloadPDF("Nuclias_Daily_", result);
                $scope.exporting = false;
            });
        };

        $scope.showCalendae = function (tag) {
            if (tag == 'from') {
                document.getElementById('kalendae_timeFrom').focus();
            } else {
                document.getElementById('kalendae_timeTo').focus();
            }
        }


        var xAxisData = [];

        var labelTraffic = TS.ts('report.trafficUsage');
        var labelClients = TS.ts('report.uniqueClients');
        var yAxisTraffic = {
            name: labelTraffic,
            position: 'left',
            type: 'value'
        };
        var yAxisClients = {
            name: labelClients,
            position: 'right',
            type: 'value'
        };
        var seriesTraffic = {
            name: labelTraffic,
            color: ['#64b5f6'],
            type: 'line',
            areaStyle: {
                normal: {
                    color: '#64b5f6',
                    default: 'default'
                }
            },
            symbol: 'circle',
            symbolSize: 4,
            smooth: false,
            hoverAnimation: false,
            data: []
        };
        var seriesClients = {
            name: labelClients,
            color: ['#ffad34'],
            type: 'line',
            areaStyle: {
                normal: {
                    color: 'transparent',
                    default: 'default'
                }
            },
            symbol: 'circle',
            symbolSize: 4,
            smooth: false,
            hoverAnimation: false,
            data: []
        };

        /*
         * echart 图标大小
         */
        $scope.size = {
            width: document.body.clientWidth - 304,
            height: 280
        }

        function showChartsLoading() {
            /*显示正在加载*/
            setTimeout(() => {
                $scope.dailyCharts = echarts.init(document.getElementById('dailyTrafficUsageDiv'));
                // // 调用showLoading方法
                $scope.dailyCharts.showLoading({
                    text: TS.ts('column.loading'),
                    color: '#D5D5D5',
                    textColor: '#000',
                    maskColor: 'rgba(255, 255, 255, 0.8)',
                    zlevel: 0,
                });
            }, 0);
        }

        /*
         * 折线图配置参数
         */
        $scope.DailyTrafficUsageCharts = {
            type: 'line',
            options: {
                //title: {
                //    top: -8,
                //    left: document.body.clientWidth / 2 - 304,
                //    display: true,
                //    text: 'Daily Traffic USage VS Unique Clients'
                //},
                legend: {
                    icon: 'rect',
                    selectedMode: true,
                    formatter: "{name}",
                    top: 0,
                    right: 132,
                    data: [labelTraffic, labelClients]
                },
                grid: {
                    show: true,
                    left: 36,
                    top: 40,
                    right: 24,
                    bottom: 40,
                    containLabel: true
                },
                xAxis: {
                    splitLine: {
                        show: true
                    },
                    axisLabel: {},
                    type: 'category',
                    data: xAxisData
                },

                yAxis: [yAxisTraffic, yAxisClients],
                series: [{name: labelTraffic}, {name: labelClients}]
            }
        };

        function getBinDate(date) {
            date = new Date(date);
            let flag = new Date('1970/1/1');
            let dateSeconds = ((date.getTime() - flag.getTime()) / 1000);
            //let dateSeconds = (date.getTime() / 1000);
            return parseInt((dateSeconds + NCTimeOffset * 60) / 86400) * 86400;
        }
        $scope.searchDailyDiagram = function (isSave) {
            showChartsLoading();
            var binDateArr = [];

            var startk = new Date(new Date(k1._sel[0]).setHours(23, 59, 59, 0));
            var endk = new Date(new Date(k2._sel[0]).setHours(23, 59, 59, 0));

            if (startk > endk) {
                var temp = startk;
                startk = endk;
                endk = temp;
            }
            var start = getBinDate(startk);
            var end = getBinDate(endk);

            xAxisData = [];
            var count = 0;
            for (var i = start; i <= end; i += 86400) {
                binDateArr.push(i);
                var date = new Date(startk);
                date.setDate(date.getDate() + count++);
                xAxisData.push(date.Format("yyyy/MM/dd"));
            }
            if (isSave) {
                $rootScope.customAction.site = $scope.daily.site._id;
                $rootScope.customAction.network = $scope.daily.network.agentUUID;
            }
            $scope.daily.params = {
                binDateArr: binDateArr,
                site: $scope.daily.site._id,
                uuid: $scope.daily.network.agentUUID ? $scope.daily.network.agentUUID : $scope.daily.network._id,
            };

            if ($scope.daily.params.uuid == "ALL") {
                if ($scope.daily.params.site != "ALL") {
                    $scope.daily.params.siteStr = $scope.daily.site.siteName;
                    $scope.daily.params.networkStr = "All Networks";
                } else {
                    $scope.daily.params.siteStr = "All Sites";
                    $scope.daily.params.networkStr = "All Networks";
                }
            } else {
                if ($scope.daily.network._id == "ALL") {
                    $scope.daily.params.networkStr = "All Networks";
                } else {
                    $scope.daily.params.networkStr = $scope.daily.network.name;
                }
                if ($scope.daily.params.site != "ALL") {
                    $scope.daily.params.siteStr = $scope.daily.site.siteName;
                } else {
                    $scope.daily.params.siteStr = "All Sites";
                }
            }

            seriesTraffic.data = [];
            seriesClients.data = [];
            $scope.DailyTrafficUsageCharts.options.xAxis.axisLabel.interval = parseInt(binDateArr.length / 30);
            statsService.getTrafficUsageDaily($scope.daily.params, function (result) {
                if (result.data) {
                    labelTraffic = TS.ts('report.trafficUsage') + ' (' + result.data.unit + ")";
                    yAxisTraffic.name = labelTraffic;
                    seriesTraffic.name = labelTraffic;
                    seriesTraffic.data = result.data.data;
                }
                // if($scope.dailyCharts){
                //     $scope.dailyCharts.hideLoading();
                // }
                statsService.getUniqueClientsDaily($scope.daily.params, function (result) {
                    if (result.data) {
                        seriesClients.data = result.data;
                    }
                    $scope.showData();
                    //$scope.dailyCharts.hideLoading();
                });
            });
        }

        $scope.trafficUsageCheckChange = function () {
            if (!$scope.daily.trafficUsage) {
                $scope.daily.uniqueClients = true;
            }
            $scope.showData();
        }

        $scope.uniqueClientsCheckChange = function () {
            if (!$scope.daily.uniqueClients) {
                $scope.daily.trafficUsage = true;
            }
            $scope.showData();
        }

        $scope.showData = function () {
            $scope.DailyTrafficUsageCharts.options.xAxis.data = xAxisData;
            $scope.DailyTrafficUsageCharts.options.legend.data = [];
            $scope.DailyTrafficUsageCharts.options.series = [];
            $scope.DailyTrafficUsageCharts.options.yAxis = [];
            if ($scope.daily.trafficUsage) {
                $scope.DailyTrafficUsageCharts.options.legend.data.push(labelTraffic);
                $scope.DailyTrafficUsageCharts.options.series.push(seriesTraffic);
                $scope.DailyTrafficUsageCharts.options.yAxis.push(yAxisTraffic);
            }
            if ($scope.daily.uniqueClients) {
                $scope.DailyTrafficUsageCharts.options.legend.data.push(labelClients);
                if ($scope.daily.trafficUsage) {
                    seriesClients.yAxisIndex = 1;
                } else {
                    seriesClients.yAxisIndex = 0;
                }
                $scope.DailyTrafficUsageCharts.options.series.push(seriesClients);
                $scope.DailyTrafficUsageCharts.options.yAxis.push(yAxisClients);
            }
            $scope.DailyTrafficUsageCharts.options.needInit = true;
        }

    });
});
