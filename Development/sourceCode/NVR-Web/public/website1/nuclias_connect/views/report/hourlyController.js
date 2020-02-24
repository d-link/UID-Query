/**
 * Created by guojiangchao on 2018/2/12.
 */
define(["app", "echarts"], function (app, echarts) {
    app.register.controller('hourlyController', function ($rootScope, $scope, Current, DashboardService, statsService, ReportExportService, CustomService, TS, utils, OrganizationService) {

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
                    height: 231
                }
            } else {
                $scope.size = {
                    width: document.body.clientWidth - 324,
                    height: 231
                }
            }
        }
        $scope.hourly = {
            period: "quarter",
            export: "pdf",
            threshold: {
                clients: 900,
                traffic: 900
            },
            date: {}
        };

        $scope.optionSites = [];

        $scope.hourly.days = [];
        $scope.NTPStatus1 = 0;
        //改成板子时间
        //utils.getNodeTime(function () {
        var moment = new Date(NCTime);
        let flag = new Date('1970/1/1');
        for (var i = 0; i < 7; i++) {
            var date = new Date(moment);
            date.setDate(date.getDate() - i);
            let dateSeconds = ((date.getTime() - flag.getTime()) / 1000);
            //dateSeconds = (date.getTime() / 1000);
            $scope.hourly.days.push({str: date.Format("yyyy/MM/dd"), value: parseInt(dateSeconds / 86400) * 86400});
        }
        $scope.hourly.date = $scope.hourly.days[0];
        //});

        $scope.subtractionTimeDay = function () {
            for (var i = 0; i < $scope.hourly.days.length; i++) {
                if ($scope.hourly.date == $scope.hourly.days[i]) {
                    if (i == $scope.hourly.days.length - 1) {
                        $scope.hourly.date = $scope.hourly.days[0];
                    } else {
                        $scope.hourly.date = $scope.hourly.days[i + 1];
                    }
                    break;
                }
            }
        };
        $scope.addTimeDay = function () {
            for (var i = 0; i < $scope.hourly.days.length; i++) {
                if ($scope.hourly.date == $scope.hourly.days[i]) {
                    if (i == 0) {
                        $scope.hourly.date = $scope.hourly.days[$scope.hourly.days.length - 1];
                    } else {
                        $scope.hourly.date = $scope.hourly.days[i - 1];
                    }
                    break;
                }
            }
        };

        // 获取site、network下拉框数据
        DashboardService.getSiteAndNetwork(function (result) {
            //statsService.getHourlySiteNetworks(function (result) {
            if (result.success) {
                $scope.optionSites = result.data;
                // 添加 all network
                var allNetwork = [{name: 'common.allNetwork', _id: 'ALL', agentUUID: 'ALL'}];
                for (var i = 0; i < $scope.optionSites.length; i++) {
                    allNetwork = allNetwork.concat($scope.optionSites[i].networks);
                    $scope.optionSites[i].networks.unshift({name: 'common.allNetwork', _id: 'ALL', agentUUID: 'ALL'});
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
                $scope.hourly.site = $scope.optionSites[0];
                $scope.hourly.network = $scope.hourly.site.networks[0];
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
                                                $scope.hourly.site = $scope.optionSites[i];
                                                $scope.hourly.network = $scope.optionSites[i].networks[j];
                                            }
                                        }
                                    }
                                }

                            }
                        }
                        $scope.searchHourlyDiagram();
                    }
                });

            }
        });

        $scope.changeSite = function () {
            $scope.hourly.network = $scope.hourly.site.networks[0];
        };

        $scope.exporting = false;
        /**
         * Export data and image to pdf file
         */
        $scope.export2PDF = function () {
            $scope.exporting = true;
            //get canvases data
            var uniqueClientsDiv = document.getElementById("uniqueClientsDiv");
            var uniqueClientsCanvas = uniqueClientsDiv.firstElementChild.firstElementChild;
            uniqueClientsCanvas.style.background = '#FFF';
            var uniqueClientsDataURL = uniqueClientsCanvas.toDataURL('image/png');

            var trafficClientsDiv = document.getElementById("trafficClientsDiv");
            var trafficClientsCanvas = trafficClientsDiv.firstElementChild.firstElementChild;
            trafficClientsCanvas.style.background = '#FFF';
            var trafficClientsDataURL = trafficClientsCanvas.toDataURL('image/png');

            var reqParams = {
                userName: Current.user().username,
                "UniqueClientsImg": uniqueClientsDataURL,
                "TrafficClientsImg": trafficClientsDataURL,
                curDate: $scope.hourly.date.str,
                params: $scope.hourly.params
            };

            //request the server and download the pdf
            ReportExportService.exportHourly2PDF(reqParams, function (result) {
                utils.downloadPDF("Nuclias_Hourly_", result);
                $scope.exporting = false;
            });
        };

        /*
         * 折线图横轴数据
         */
        var xAxisData = [];
        for (var i = 0; i < 24; i++) {
            xAxisData.push((i < 10 ? "0" + i : i) + ":00");
        }

        /*
         * echart 图标大小
         */
        $scope.size = {
            width: document.body.clientWidth - 304,
            height: 231
        }
        /*
         * 折线图配置参数
         */
        $scope.HourlyUniqueCharts = {
            type: 'line',
            options: {
                title: {
                    top: 0,
                    left: 0,
                    display: true,
                    text: ''
                },
                legend: {
                    icon: 'rect',
                    selectedMode: true,
                    formatter: "{name}",
                    top: 0,
                    right: 16,
                    data: [$scope.hourly.date.str, 'Average', 'High']
                },
                grid: {
                    show: true,
                    left: 24,
                    top: 40,
                    right: 16,
                    bottom: 16,
                    containLabel: true
                },
                xAxis: [
                    {
                        splitLine: {
                            show: true
                        },
                        type: 'category',
                        data: xAxisData
                    }
                ],
                yAxis: [
                    {
                        name: TS.ts('report.uniqueClients'), // 需根据实际数据修改
                        type: 'value'
                    }
                ],
                // dataZoom: {
                //     show: true,
                //     start: 0
                // },
                series: [
                    {
                        name: $scope.hourly.date.str,
                        color: ['#22b7db'],
                        type: 'line',
                        symbol: 'circle',
                        symbolSize: 4,
                        smooth: false,
                        hoverAnimation: false,
                        data: []
                    }, {
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
                    }
                ]
            }
        };
        $scope.HourlyTrafficCharts = {
            type: 'line',
            options: {
                title: {
                    top: 0,
                    left: 0,
                    display: true,
                    text: ''
                },
                legend: {
                    icon: 'rect',
                    selectedMode: true,
                    formatter: "{name}",
                    top: 0,
                    right: 16,
                    data: [$scope.hourly.date.str, 'Average', 'High']
                },
                grid: {
                    show: true,
                    left: 32,
                    top: 40,
                    right: 16,
                    bottom: 16,
                    containLabel: true
                },
                xAxis: [
                    {
                        splitLine: {
                            show: true
                        },
                        type: 'category',
                        data: xAxisData
                    }
                ],
                yAxis: [
                    {
                        name: TS.ts('report.trafficUsage'), // 需根据实际数据修改
                        type: 'value'
                    }
                ],
                // dataZoom: {
                //     show: true,
                //     start: 0
                // },
                series: [
                    {
                        name: $scope.hourly.date.str,
                        type: 'line',
                        color: ['#22b7db'],
                        symbol: 'circle',
                        symbolSize: 4,
                        smooth: false,
                        hoverAnimation: false,
                        data: []
                    }, {
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
                    }
                ]
            }
        };

        function showChartsLoading() {
            /*显示正在加载*/
            setTimeout(() => {
                $scope.clientsCharts = echarts.init(document.getElementById('uniqueClientsDiv'));
                $scope.trafficCharts = echarts.init(document.getElementById('trafficClientsDiv'));
            // // 调用showLoading方法
                $scope.clientsCharts.showLoading({
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
            }, 0);
        }
        /**
         * 查询过去7天内每小时网络活动，都以板子的时间为准---------llh
         * */
        $scope.searchHourlyDiagram = function (isSave) {
            //utils.getNodeTime(function () {
            showChartsLoading();
            var startDay = new Date(NCTime);
            startDay.setDate(startDay.getDate() - 6);
            var endDay = new Date(NCTime);
            endDay.setDate(endDay.getDate());
            if (isSave) {
                $rootScope.customAction.site = $scope.hourly.site._id;
                $rootScope.customAction.network = $scope.hourly.network.agentUUID;
            }
            $scope.hourly.params = {
                time: {offset: NCTimeOffset, dateTime: NCTime},
                site: $scope.hourly.site._id,
                uuid: $scope.hourly.network.agentUUID ? $scope.hourly.network.agentUUID : $scope.hourly.network._id,
                binDate: $scope.hourly.date.value,
                startDay: getBinDate(startDay),
                endDay: getBinDate(endDay)
            };

            if ($scope.hourly.params.uuid == "ALL") {
                if ($scope.hourly.params.site != "ALL") {
                    $scope.hourly.params.siteStr = $scope.hourly.site.siteName;
                    $scope.hourly.params.networkStr = "All Networks";
                } else {
                    $scope.hourly.params.siteStr = "All Sites";
                    $scope.hourly.params.networkStr = "All Networks";
                }
            } else {
                if ($scope.hourly.network._id == "ALL") {
                    $scope.hourly.params.networkStr = "All Networks";
                } else {
                    $scope.hourly.params.networkStr = $scope.hourly.network.name;
                }
                if ($scope.hourly.params.site != "ALL") {
                    $scope.hourly.params.siteStr = $scope.hourly.site.siteName;
                } else {
                    $scope.hourly.params.siteStr = "All Sites";
                }
            }

            function getBinDate(date) {
                date = new Date(date);
                let flag = new Date('1970/1/1');
                let dateSeconds = ((date.getTime() - flag.getTime()) / 1000);
                //let dateSeconds = (date.getTime() / 1000);
                return parseInt((dateSeconds + NCTimeOffset * 60) / 86400) * 86400;
            }

            statsService.getUniqueClientsHourlyThreshold($scope.hourly.params, function (result) {
                if (result.data) {
                    $scope.HourlyUniqueCharts.options.legend.data[1] = TS.ts('report.average');
                    $scope.HourlyUniqueCharts.options.legend.data[2] = TS.ts('report.high');
                    $scope.HourlyUniqueCharts.options.series[1].name = TS.ts('report.average');
                    $scope.HourlyUniqueCharts.options.series[2].name = TS.ts('report.high');
                    $scope.HourlyUniqueCharts.options.series[1].data = result.data.average;
                    $scope.HourlyUniqueCharts.options.series[2].data = result.data.high;
                    $scope.HourlyUniqueCharts.options.needInit = true;
                }
                $scope.clientsCharts.hideLoading();
            });
            statsService.getTrafficHourlyThreshold($scope.hourly.params, function (result) {
                if (result.data) {
                    $scope.HourlyTrafficCharts.options.legend.data[1] = TS.ts('report.average');
                    $scope.HourlyTrafficCharts.options.legend.data[2] = TS.ts('report.high');
                    $scope.HourlyTrafficCharts.options.series[1].name = TS.ts('report.average');
                    $scope.HourlyTrafficCharts.options.series[2].name = TS.ts('report.high');
                    $scope.HourlyTrafficCharts.options.series[1].data = result.data.data.average;
                    $scope.HourlyTrafficCharts.options.series[2].data = result.data.data.high;
                    $scope.HourlyTrafficCharts.options.needInit = true;
                }
                $scope.trafficCharts.hideLoading();
            });
            $scope.HourlyUniqueCharts.options.series[0].name = $scope.hourly.date.str;
            $scope.HourlyUniqueCharts.options.legend.data[0] = $scope.hourly.date.str;
            statsService.getUniqueClientsHourlyByDay($scope.hourly.params, function (result) {
                if (result.data) {
                    $scope.HourlyUniqueCharts.options.series[0].data = result.data;
                    $scope.HourlyUniqueCharts.options.needInit = true;
                }

            });
            $scope.HourlyTrafficCharts.options.series[0].name = $scope.hourly.date.str;
            $scope.HourlyTrafficCharts.options.legend.data[0] = $scope.hourly.date.str;
            statsService.getTrafficHourlyByDay($scope.hourly.params, function (result) {
                if (result.data) {
                    $scope.HourlyTrafficCharts.options.yAxis[0].name = TS.ts('report.trafficUsage') + " (" + result.data.unit + ")";
                    $scope.HourlyTrafficCharts.options.series[0].data = result.data.data;
                    $scope.HourlyTrafficCharts.options.needInit = true;
                }

            });
            //})
        }

    });
});
