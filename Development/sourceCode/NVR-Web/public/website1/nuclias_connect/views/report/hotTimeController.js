/**
 * Created by guojiangchao on 2018/2/12.
 */
define(["app", "echarts"], function (app, echarts) {
    app.register.controller('hotTimeController', function ($rootScope, $scope, $timeout, Current, DashboardService, NetworkService, statsService, OrganizationService, ReportExportService, CustomService, TS, utils) {

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
        $scope.set = {};
        $scope.hotTime = {};
        $scope.showSetClients = false;
        $scope.showSetTraffic = false;
        $scope.showClientSet = function () {
            $scope.showSetClients = true;
            $scope.set.uniqueClientsThreshold = $scope.hotTime.uniqueClients.threshold;
        };
        $scope.saveClientSet = function () {
            $scope.hotTime.uniqueClients.threshold = $scope.set.uniqueClientsThreshold;
            OrganizationService.updateThreshold({
                uniqueClientsThreshold: $scope.set.uniqueClientsThreshold,
                trafficUsageThreshold: $scope.set.trafficUsageThreshold,
                trafficUsageThresholdUnit: $scope.set.trafficUsageThresholdUnit,
            }, function () {
                getDefaultTrafficUsageThreshold(function () {
                    $scope.searchHottimeDiagram();
                })
            });
            $scope.showSetClients = false;
        };
        $scope.cancelClientSet = function () {
            $scope.showSetClients = false;
        };

        $scope.showTrafficSet = function () {
            $scope.showSetTraffic = true;
            $scope.set.trafficUsageThreshold = $scope.hotTime.trafficUsage.threshold;
            $scope.set.trafficUsageThresholdUnit = $scope.hotTime.trafficUsage.thresholdUnit;
        };
        $scope.saveTrafficSet = function () {
            $scope.hotTime.trafficUsage.threshold = $scope.set.trafficUsageThreshold;
            $scope.hotTime.trafficUsage.thresholdUnit = $scope.set.trafficUsageThresholdUnit;
            OrganizationService.updateThreshold({
                uniqueClientsThreshold: $scope.set.uniqueClientsThreshold,
                trafficUsageThreshold: $scope.set.trafficUsageThreshold,
                trafficUsageThresholdUnit: $scope.set.trafficUsageThresholdUnit,
            }, function () {
                getDefaultUniqueClientsThreshold(function () {
                    $scope.searchHottimeDiagram();
                });
            });
            $scope.showSetTraffic = false;
        };
        $scope.cancelTrafficSet = function () {
            $scope.showSetTraffic = false;
        };
        $scope.unitTypes = ['KB', 'MB', 'GB', 'TB', 'PB'];
        /******无线网络高峰期的起始时间改成板子时间-----------llh******/
        var startDay = "";
        var endDay = "";
        //utils.getNodeTime(function () {
        startDay = new Date(NCTime);
        startDay.setDate(startDay.getDate() - 6);
        endDay = new Date(NCTime);
        endDay.setDate(endDay.getDate());
        $scope.hotTime = {
            period: "quarter",
            export: "pdf",
            uniqueClients: {probability: 25},
            trafficUsage: {probability: 25},
            startDay: startDay,
            endDay: endDay
        };
        $scope.dayRange = $scope.hotTime.startDay.Format("yyyy/MM/dd") + "~" + $scope.hotTime.endDay.Format("yyyy/MM/dd");
        $scope.optionSites = [];

        $scope.changeSite = function () {
            $scope.hotTime.network = $scope.hotTime.site.networks[0];
        };
        //});


        $scope.exporting = false;
        /**
         * Export data and image to pdf file
         */
        $scope.export2PDF = function () {
            $scope.exporting = true;
            //获取Canvas
            var mostClientsDiv = document.getElementById("mostClientsDiv");
            var mostClientsCanvas = mostClientsDiv.firstElementChild.firstElementChild;
            mostClientsCanvas.style.background = '#FFF';
            var mostClientsCanvasDataURL = mostClientsCanvas.toDataURL('image/png');

            var mostTrafficDiv = document.getElementById("mostTrafficDiv");
            var mostTrafficCanvas = mostTrafficDiv.firstElementChild.firstElementChild;
            mostTrafficCanvas.style.background = '#FFF';
            var mostTrafficCanvasDataURL = mostTrafficCanvas.toDataURL('image/png');

            var reqParams = {
                userName: Current.user().username,
                "MostClientImg": mostClientsCanvasDataURL,
                "MostTrafficImg": mostTrafficCanvasDataURL,
                dayRange: $scope.dayRange,
                uniqueClients: $scope.hotTime.uniqueClients,
                trafficUsage: $scope.hotTime.trafficUsage,
                params: $scope.hotTime.params
            };

            ReportExportService.exportHotTime2PDF(reqParams, function (result) {
                utils.downloadPDF("Nuclias_Peak_", result);
                $scope.exporting = false;
            });
        };

        function getBinDate(date) {
            date = new Date(date);
            let flag = new Date('1970/1/1');
            let dateSeconds = ((date.getTime() - flag.getTime()) / 1000);
            //var dateSeconds = (date.getTime() / 1000);
            return parseInt((dateSeconds + NCTimeOffset * 60) / 86400) * 86400;
        }

        function timezoneOffset(data, offset) {
            var offsetData = [];
            var binStartTimestamp = data[0] - offset * 60;
            if (binStartTimestamp < 0) {
                offsetData[0] = binStartTimestamp + 86400;
                offsetData[2] = data[2] - 86400;
            }
            else if (binStartTimestamp >= 86400) {
                offsetData[0] = binStartTimestamp - 86400;
                offsetData[2] = data[2] + 86400;
            }
            else {
                offsetData[0] = binStartTimestamp;
                offsetData[2] = data[2];
            }
            offsetData[1] = data[1];
            return offsetData;
        };

        //峰值网络活动高峰期统计
        $scope.searchHottimeDiagram = function (isSave) {
            showChartsLoading();

            /********这里改成板子的时间----llh********/
                //utils.getNodeTime(function () {
            if (isSave) {
                $rootScope.customAction.site = $scope.hotTime.site._id;
                $rootScope.customAction.network = $scope.hotTime.network.agentUUID;
            }
            $scope.hotTime.params = {
                site: $scope.hotTime.site._id,
                uuid: $scope.hotTime.network.agentUUID ? $scope.hotTime.network.agentUUID : $scope.hotTime.network._id,
                startDay: getBinDate($scope.hotTime.startDay),
                endDay: getBinDate($scope.hotTime.endDay),
                thresholdClients: $scope.hotTime.uniqueClients.threshold,
                thresholdTraffic: transThreshold($scope.hotTime.trafficUsage.threshold, $scope.hotTime.trafficUsage.thresholdUnit)
            }

            if ($scope.hotTime.params.uuid == "ALL") {
                if ($scope.hotTime.params.site != "ALL") {
                    $scope.hotTime.params.siteStr = $scope.hotTime.site.siteName;
                    $scope.hotTime.params.networkStr = "All Networks";
                } else {
                    $scope.hotTime.params.siteStr = "All Sites";
                    $scope.hotTime.params.networkStr = "All Networks";
                }
            } else {
                if ($scope.hotTime.params.site != "ALL") {
                    $scope.hotTime.params.siteStr = $scope.hotTime.site.siteName;
                } else {
                    $scope.hotTime.params.siteStr = "All Sites";
                }
                if ($scope.hotTime.network._id == "ALL") {
                    $scope.hotTime.params.networkStr = "All Networks";
                } else {
                    $scope.hotTime.params.networkStr = $scope.hotTime.network.name;
                }
            }

            function transThreshold(threshold, unit) {
                if (unit == 'KB') {
                    return threshold * Math.pow(1024, 1);
                } else if (unit == 'MB') {
                    return threshold * Math.pow(1024, 2);
                }
                else if (unit == 'GB') {
                    return threshold * Math.pow(1024, 3);
                }
                else if (unit == 'TB') {
                    return threshold * Math.pow(1024, 4);
                } else {
                    return threshold * Math.pow(1024, 5);
                }
            }

            //$scope.MostClientsHotTimeCharts.options.series = [];
            var tempSeries1 = [];
            var color = [
                "#172664", "#22b7db", "#e6185a", "#afcb20", "#f59d24", "#f25130", "#607896"
            ];
            statsService.getHotTimeUniqueClients($scope.hotTime.params, function (result) {
                if (result.success) {
                    var count = result.data.length;
                    var dd = [];
                    var index = 0;
                    if (result.data.length > 0) {
                        var date = (timezoneOffset(result.data[0], NCTimeOffset))[2];
                        for (var i = 0; i < result.data.length; i++) {
                            result.data[i] = timezoneOffset(result.data[i], NCTimeOffset);
                            if (result.data[i][2] == date) {
                                dd.push(result.data[i]);
                            } else {
                                tempSeries1.push({
                                    color: [color[index++]],
                                    symbolSize: 16,
                                    type: "scatter",
                                    data: angular.copy(dd)
                                });
                                date = result.data[i][2];
                                dd = [];
                                dd.push(result.data[i]);
                            }
                        }
                        tempSeries1.push({
                            color: [color[index++]],
                            symbolSize: 16,
                            type: "scatter",
                            data: angular.copy(dd)
                        });

                    }
                    $scope.MostClientsHotTimeCharts.options.series = tempSeries1;
                    $scope.hotTime.uniqueClients.probability = (count * 100 / (7 * 96)).toFixed(2);
                    $scope.MostClientsHotTimeCharts.options.needInit = true;

                }
                $scope.hotTimeClientsCharts.hideLoading();

            });

            //$scope.MostTrafficUsageCharts.options.series = [];
            var tempSeries2 = [];
            statsService.getHotTimeTrafficUsage($scope.hotTime.params, function (result) {
                if (result.success) {
                    var data = result.data;

                    $scope.MostTrafficUsageCharts.options.yAxis[0].name = TS.ts('report.trafficUsage') + " (" + data.unit + ")";
                    var count = data.data.length;

                    var dd = [];
                    var index = 0;
                    if (data.data.length > 0) {
                        var date = (timezoneOffset(data.data[0], NCTimeOffset))[2];
                        for (var i = 0; i < data.data.length; i++) {
                            data.data[i] = timezoneOffset(data.data[i], NCTimeOffset);
                            if (data.data[i][2] == date) {
                                dd.push(data.data[i]);
                            } else {
                                tempSeries2.push({
                                    color: [color[index++]],
                                    symbolSize: 16,
                                    type: "scatter",
                                    data: angular.copy(dd)
                                });
                                date = data.data[i][2];
                                dd = [];
                                dd.push(data.data[i]);
                            }
                        }
                        tempSeries2.push({
                            color: [color[index++]],
                            symbolSize: 16,
                            type: "scatter",
                            data: angular.copy(dd)
                        });
                    }
                    $scope.MostTrafficUsageCharts.options.series = tempSeries2;
                    $scope.hotTime.trafficUsage.probability = (count * 100 / (7 * 96)).toFixed(2);
                    $scope.MostTrafficUsageCharts.options.needInit = true;
                    $scope.hotTimeTrafficCharts.hideLoading();
                } else {
                    $scope.hotTimeTrafficCharts.hideLoading();
                }

            });
            //})
        };

        function getDateStr(bindate) {
            let flag = new Date('1970/1/1');
            var date = new Date(bindate * 1000 + flag.getTime());

            var month = date.getMonth() + 1;
            if (month < 10) month = "0" + month;
            var day = date.getDate();
            if (day < 10) day = "0" + day;
            return date.getFullYear() + "-" + month + "-" + day;
        }

        function getTimeStr(timestamp) {
            let hour = parseInt(timestamp / (60 * 60));
            let min = parseInt((timestamp % (60 * 60)) / 60);
            return (hour < 10 ? "0" + hour : hour) + ":" + (min < 10 ? "0" + min : min);
        }

        /*
         * echart 图标大小
         */
        $scope.size = {
            width: document.body.clientWidth - 304,
            height: 231
        }

        var xAxisData = [];
        for (var i = 0; i < 24; i++) {
            for (var j = 0; j < 60; j += 15) {
                // var str = (i < 10 ? "0" + i : i) + ":" + (j < 10 ? "0" + j : j);
                xAxisData.push(i * 3600 + j * 60);
            }
        }

        function showChartsLoading() {
            /*显示正在加载*/
            //setTimeout(() => {
            $scope.hotTimeClientsCharts = echarts.init(document.getElementById('mostClientsDiv'));
            $scope.hotTimeTrafficCharts = echarts.init(document.getElementById('mostTrafficDiv'));
                // 调用showLoading方法
            $scope.hotTimeClientsCharts.showLoading({
                text: TS.ts('column.loading'),
                color: '#D5D5D5',
                textColor: '#000',
                maskColor: 'rgba(255, 255, 255, 0.8)',
                zlevel: 0,
            });
            $scope.hotTimeTrafficCharts.showLoading({
                text: TS.ts('column.loading'),
                color: '#D5D5D5',
                textColor: '#000',
                maskColor: 'rgba(255, 255, 255, 0.8)',
                zlevel: 0,
            });
            // }, 0);
        }

        /*
         * 折线图配置参数
         */
        $scope.MostClientsHotTimeCharts = {
            //type: 'line',
            options: {
                legend: {
                    icon: 'rect',
                    selectedMode: true,
                    formatter: "{name}",
                    top: 0,
                    right: 16,
                    data: []
                },
                tooltip: {
                    trigger: 'item',
                    showDelay: 0,
                    formatter: function (params) {
                        if (params.value.length > 1) {
                            return getDateStr(params.value[2]) + ' '
                                + getTimeStr(params.value[0]) + ' <br/>' + TS.ts('report.uniqueClients') + ': '
                                + params.value[1] + ' ';
                        }
                        else {
                            return "";
                        }
                    }
                },

                grid: {
                    show: true,
                    left: 30,
                    top: 40,
                    right: 16,
                    bottom: 16,
                    containLabel: true
                },
                xAxis: {
                    splitLine: {
                        show: true
                    },
                    min: 0,
                    max: 86400,
                    type: 'value',
                    scale: false,
                    interval: 3600,
                    axisLabel: {
                        formatter: getTimeStr
                    },
                    axisTick: { //刻度线样式
                        show: true
                    },
                    data: xAxisData
                },
                yAxis: [
                    {
                        name: TS.ts('report.uniqueClients'), // 需根据实际数据修改
                        type: 'value',
                        axisTick: { //刻度线样式
                            show: true
                        }
                    }
                ],
                // dataZoom: {
                //     show: true,
                //     start: 0
                // },
                series: []
            }
        };
        $scope.MostTrafficUsageCharts = {
            //type: 'line',
            options: {
                legend: {
                    icon: 'rect',
                    selectedMode: true,
                    formatter: "{name}",
                    top: 0,
                    right: 16,
                    data: []
                },
                tooltip: {
                    trigger: 'item',
                    showDelay: 0,
                    formatter: function (params) {
                        if (params.value.length > 1) {
                            return getDateStr(params.value[2]) + ' '
                                + getTimeStr(params.value[0]) + ' <br/>' + TS.ts('report.trafficUsage') + ': '
                                + params.value[1] + ' ';
                        }
                        else {
                            return "";
                        }
                    }
                },
                grid: {
                    show: true,
                    left: 32,
                    top: 40,
                    right: 16,
                    bottom: 16,
                    containLabel: true
                },
                xAxis: {
                    splitLine: {
                        show: true
                    },
                    min: 0,
                    max: 86400,
                    interval: 3600,
                    type: 'value',
                    scale: false,
                    axisLabel: {
                        formatter: getTimeStr
                    },
                    axisTick: { //刻度线样式
                        show: true
                    },
                    data: xAxisData
                },
                yAxis: [
                    {
                        name: TS.ts('report.trafficUsage'), // 需根据实际数据修改
                        type: 'value',
                        axisTick: { //刻度线样式
                            show: true
                        }
                    }
                ],
                // dataZoom: {
                //     show: true,
                //     start: 0
                // },
                series: []
            }
        };

        // 获取site、network下拉框数据
        DashboardService.getSiteAndNetwork(function (result) {
            //statsService.getQuarterlySiteNetworks(function (result) {
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

                // ToDo
                // select 赋值
                $scope.hotTime.site = $scope.optionSites[0];
                $scope.hotTime.network = $scope.hotTime.site.networks[0];
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
                                                $scope.hotTime.site = $scope.optionSites[i];
                                                $scope.hotTime.network = $scope.optionSites[i].networks[j];
                                            }
                                        }
                                    }
                                }

                            }
                        }

                        $scope.hotTime.uniqueClients.threshold = Current.user().uniqueClientsThreshold;
                        $scope.hotTime.trafficUsage.threshold = Current.user().trafficUsageThreshold;
                        $scope.hotTime.trafficUsage.thresholdUnit = Current.user().trafficUsageThresholdUnit;

                        getDefaultUniqueClientsThreshold(function () {
                            getDefaultTrafficUsageThreshold(function () {
                                $scope.searchHottimeDiagram();
                            })
                        });
                    }
                });


            }
        });


        function getDefaultUniqueClientsThreshold(callback) {
            if (!$scope.hotTime.uniqueClients.threshold) {
                statsService.getHotTimeUniqueClientsThreshold({
                    startDay: getBinDate($scope.hotTime.startDay),
                    endDay: getBinDate($scope.hotTime.endDay),
                    site: $scope.hotTime.site._id,
                    uuid: $scope.hotTime.network.agentUUID ? $scope.hotTime.network.agentUUID : $scope.hotTime.network._id,
                    probability: 0.25
                }, function (result) {
                    if (result.success) {
                        $scope.hotTime.uniqueClients.threshold = result.data;
                    }
                    callback();
                });
            } else {
                callback();
            }
        }

        function getDefaultTrafficUsageThreshold(callback) {
            if (!$scope.hotTime.trafficUsage.threshold) {
                statsService.getHotTimeTrafficUsageThreshold({
                    startDay: getBinDate($scope.hotTime.startDay),
                    endDay: getBinDate($scope.hotTime.endDay),
                    site: $scope.hotTime.site._id,
                    uuid: $scope.hotTime.network.agentUUID ? $scope.hotTime.network.agentUUID : $scope.hotTime.network._id,
                    probability: 0.25
                }, function (result) {
                    if (result.success) {
                        $scope.hotTime.trafficUsage.threshold = parseFloat(result.data);
                        $scope.hotTime.trafficUsage.thresholdUnit = result.unit;
                    }
                    callback();
                });
            } else {
                callback();
            }
        }
    });
});
