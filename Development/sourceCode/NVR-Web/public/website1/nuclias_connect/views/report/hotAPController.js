/**
 * Created by guojiangchao on 2018/2/12.
 */
define(["app", "canvasContainer"], function (app) {
    app.register.controller('hotAPController', function ($scope, $uibModal, $timeout, Current, NetworkService, OrganizationService, statsService, $state, ReportExportService, TS, utils) {
        setHeight(); //test
        setHeight('data-show-menu-main', [], -40);
        setHeight('site-set-height', ['elementFlag']);
        var currentLang = $translate.proposedLanguage() || $translate.use();
        if (currentLang == 'ru') {
            document.getElementById("hot-ap-title").style.display = "contents";
        }
        $scope.timer = null;


        $scope.hasPrivilege = Current.user().role == "root admin";
        $scope.isLoading = true;
        $scope.hotApMaps = [];
        $scope.uniqueClients = {average: 0, high: 0};
        $scope.trafficUsage = {average: 0, high: 0, unit: "KB"};

        var tipdiv = document.getElementById("tipdiv");

        var CanvasContainer = require("canvasContainer");
        var canvasContainer;

        var canvas = document.getElementById("showCanvas");
        var context = canvas.getContext("2d");
        var canvasRow = document.getElementById("canvasRow");
        var cont = document.getElementsByClassName("set-height")[0];
        var height = document.documentElement.clientHeight - 240;
        if (canvasRow) {
            canvasRow.style.height = height + "px";
            canvas.width = canvasRow.clientWidth;
            canvas.height = canvasRow.clientHeight;
        }
        /********最活跃ap这里改成NC的时间----llh********/
        var startDay = "";
        var endDay = "";
        var param = {};
        $scope.LHSelect = {};
        $scope.LHSelect.networkdays = [];
        $scope.LHSelect.networkHours = [];
        $scope.NTPStatus1 = 0;
        //utils.getNodeTime(function () {
        startDay = new Date(NCTime);
        startDay.setDate(startDay.getDate() - 6);
        endDay = new Date(NCTime);
        endDay.setDate(endDay.getDate());
        param = {
            startDay: getBinDate(startDay),
            endDay: getBinDate(endDay)
        };
        var moment = new Date(NCTime);//改成板子时间---llh
        let flag = new Date('1970/1/1');
        for (var i = 0; i < 7; i++) {
            var date = new Date(moment);
            date.setDate(date.getDate() - i);
            let dateSeconds = ((date.getTime() - flag.getTime()) / 1000);
            $scope.LHSelect.networkdays.push({
                value: parseInt(dateSeconds / 86400) * 86400,
                str: date.Format("yyyy/MM/dd")
            });
        }
        $scope.LHSelect.networkday = $scope.LHSelect.networkdays[0];
        var temp = moment.getHours() * 60 * 60 + (parseInt(moment.getMinutes() / 15) - 1) * 15 * 60;
        if (temp < 0) {
            temp = temp + 86400;
            $scope.LHSelect.networkday = $scope.LHSelect.networkdays[1];
        }
        else if (temp >= 86400) {
            temp = temp - 86400;
        }
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

        //因为要显示地图，地图里面的变量可能还没有定义要放到这里
        window.onresize = function () {
            setHeight();
            setHeight('data-show-menu-main', [], -40);
            setHeight('site-set-height', ['elementFlag']);
            $timeout.cancel($scope.timer);
            $scope.timer = $timeout(function () {
                var canvasRow = document.getElementById("canvasRow");
                var height = document.documentElement.clientHeight - 240;
                canvasRow.style.height = height + "px";
                canvas.width = canvasRow.clientWidth;
                canvas.height = canvasRow.clientHeight;
                showMap();
            }, 300);

        };
        /**
         * 获取左侧列表、左侧列表事件
         */
        OrganizationService.getAllHotApMaps(function (result) {
            $scope.isLoading = false;
            if (result.success) {
                //$scope.sites = result.data;
                $scope.hotApMaps = result.data;
                if ($scope.hotApMaps && $scope.hotApMaps.length > 0) {
                    $scope.hotApMapActive = $scope.hotApMaps[0];
                }
            }
        });
        setTimeout(function () {

            canvasContainer = new CanvasContainer(canvas, context);
            //canvasContainer.addMouseHandlers();
            canvasContainer.addTipHandler(tipdiv, TS);

            var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll"
                : "mousewheel"; // FF doesn't recognize mousewheel as of FF3.x
            if (canvas.attachEvent) // if IE (and Opera depending on user setting)
                canvas.attachEvent("on" + mousewheelevt, function (e) {
                    e.preventDefault();
                    displaywheel(e);
                });
            else if (canvas.addEventListener) // WC3 browsers
                canvas.addEventListener(mousewheelevt, function (e) {
                    e.preventDefault();
                    displaywheel(e);
                }, false);

            function displaywheel(e) {
                var evt = window.event || e;
                var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta;
                if (delta > 0) {
                    $scope.bigger();
                } else {
                    $scope.smaller();
                }
            }

            statsService.getHotApUniqueClientThreshold(param, function (result) {
                if (result.success) {
                    $scope.uniqueClients = result.data;
                    canvasContainer.uniqueClients = $scope.uniqueClients;
                }
            });
            statsService.getHotApTrafficThreshold(param, function (result) {
                if (result.success) {
                    $scope.trafficUsage = result.data;
                    canvasContainer.trafficUsage = $scope.trafficUsage;
                }
                showMap();
            });

        }, 500);

        //});

        function getBinDate(date) {
            date = new Date(date);
            let flag = new Date('1970/1/1');
            let dateSeconds = ((date.getTime() - flag.getTime()) / 1000);
            return parseInt((dateSeconds + NCTimeOffset * 60) / 86400) * 86400;
        }

        $scope.toggleMap = function (hotApMap) {
            $scope.hotApMapActive = hotApMap;
        };

        $scope.$watch("hotApMapActive", function () {
            showMap();
        });

        // 左侧列表选中状态
        $scope.hotApMapActive = null;

        $scope.exporting = false;
        /**
         * Export data and image to pdf file
         */
        $scope.export2PDF = function () {
            $scope.exporting = true;
            var reqParams = {
                userName: Current.user().username,
                area: {width: canvas.width, height: canvas.height},
                HotAPImg: canvasContainer.getImageDataURL(),
                _id: $scope.hotApMapActive._id,
                networkday: $scope.LHSelect.networkday,
                networkHour: $scope.LHSelect.networkHour,
                uniqueClients: $scope.uniqueClients,
                trafficUsage: $scope.trafficUsage
            };
            //处理时间
            let d = $scope.LHSelect.networkday.value;
            let t = $scope.LHSelect.networkHour.value;
            //这个地方改时间
            //utils.getNodeTime(function () {
            let offset = NCTimeOffset;
            let utc = new Date((d + t + (offset) * 60) * 1000);

            let uYear = utc.getUTCFullYear();
            let uMonth = utc.getUTCMonth();
            let uDate = utc.getUTCDate();
            let uHour = utc.getUTCHours();
            let uMinute = utc.getUTCMinutes();
            let uSecond = utc.getUTCSeconds();
            reqParams = JSON.parse(JSON.stringify(reqParams));
            reqParams.networkday.value = Date.UTC(uYear, uMonth, uDate, 0, 0, 0) / 1000;
            reqParams.networkHour.value = Date.UTC(1970, 0, 1, uHour, uMinute, uSecond) / 1000;
            //request the server and download the pdf
            ReportExportService.exportHotAP2PDF(reqParams, function (result) {
                utils.downloadPDF("Nuclias_MostAP_", result);
                $scope.exporting = false;
            });
        };
        /**
         * 添加hotApMaps/编辑hotApMaps
         */
        $scope.openAddHotMapModel = function () {
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/report/hotAPMapCreate.html',
                windowClass: 'modal-usermanage',
                size: 'w900',
                resolve: {
                    hotAPMap: {}
                },
                controller: 'hotAPMapCreateController'
            });
            modalInstance.result.then(function (newId) {
                OrganizationService.getAllHotApMaps(function (result) {
                    if (result.success) {
                        $scope.hotApMaps = result.data;
                        setTimeout(function () {
                            if (canvasContainer.canvas.width == 0) {
                                var canvasRow = document.getElementById("canvasRow")
                                canvasContainer.canvas.width = canvasRow.clientWidth;
                                canvasContainer.canvas.height = canvasRow.clientHeight;
                            }

                            var find = _.find($scope.hotApMaps, function (item) {
                                return item._id == newId;
                            })
                            if (find) {
                                $scope.hotApMapActive = find;
                            } else if (!$scope.hotApMapActive && $scope.hotApMaps.length > 0) {
                                $scope.hotApMapActive = $scope.hotApMaps[0];
                            }
                            $scope.$apply();
                        }, 500)

                    }
                });
            });
        };

        $scope.editHotApMap = function (hotAPMap) {

            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/report/hotAPMapCreate.html',
                windowClass: 'modal-usermanage',
                size: 'w900',
                resolve: {
                    hotAPMap: hotAPMap
                },
                controller: 'hotAPMapCreateController'
            });
            modalInstance.result.then(function () {
                OrganizationService.getAllHotApMaps(function (result) {
                    if (result.success) {
                        $scope.hotApMaps = result.data;
                        var find = _.find($scope.hotApMaps, function (item) {
                            return item._id == hotAPMap._id;
                        })
                        if (find) {
                            $scope.hotApMapActive = find;
                        }
                    }
                });
            });
        };

        $scope.delHotApMap = function (id) {

            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/templates/dialogConfirm.html',
                windowClass: 'modal-del',
                resolve: {
                    id: function () {
                        return id;
                    }
                },
                size: "w500",
                controller: function ($scope, $uibModalInstance, id) {
                    $scope.con = {
                        title: TS.ts('report.delTitle'),
                        content: TS.ts('report.delTip'),
                        type: 'common:remove'
                    };
                    $scope.ok = function () {
                        $uibModalInstance.close(id);
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function (id) {
                //删除
                OrganizationService.delHotAPMap(id, function (result) {
                    if (result.success) {
                        OrganizationService.getAllHotApMaps(function (result) {
                            if (result.success) {
                                $scope.hotApMaps = result.data;
                                var find;
                                if ($scope.hotApMapActive) {
                                    find = _.find($scope.hotApMaps, function (item) {
                                        return item._id == $scope.hotApMapActive._id;
                                    })
                                }
                                if (!find) {
                                    if ($scope.hotApMaps && $scope.hotApMaps.length > 0) {
                                        $scope.hotApMapActive = $scope.hotApMaps[0];
                                    }
                                }
                            }
                        });
                    }
                });
            }, function () {

            });

        }

        function showMap() {
            if (!canvasContainer) return;
            if (!$scope.hotApMapActive) return;
            var img = new Image();
            img.onload = function () {
                canvasContainer.initialImageArea(this);
                canvasContainer.setDevices($scope.hotApMapActive.devices, $scope.hotApMapActive.rate);
                $scope.getHotApStatsData();
                canvasContainer.refresh();
                $scope.$apply();
            };
            //img.src = $scope.hotApMapActive.mapPath+"?tag="+Math.random();
            img.src = $scope.hotApMapActive.mapPath;

        }

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

        /***
         * 最活跃ap的查询
         * ***/
        $scope.getHotApStatsData = function () {
            if ($scope.hotApMapActive == null) return;
            if (!canvasContainer) return;
            var apList = [];
            if ($scope.hotApMapActive.devices) {
                for (var i = 0; i < $scope.hotApMapActive.devices.length; i++) {
                    apList.push($scope.hotApMapActive.devices[i].apMACAddr);
                }
            }
            let d = $scope.LHSelect.networkday.value;
            let t = $scope.LHSelect.networkHour.value;
            //这个地方改时间
            //utils.getNodeTime(function () {
            let offset = NCTimeOffset;
            let utc = new Date((d + t + (offset) * 60) * 1000);

            let uYear = utc.getUTCFullYear();
            let uMonth = utc.getUTCMonth();
            let uDate = utc.getUTCDate();
            let uHour = utc.getUTCHours();
            let uMinute = utc.getUTCMinutes();
            let uSecond = utc.getUTCSeconds();

            let dateFilter = Date.UTC(uYear, uMonth, uDate, 0, 0, 0) / 1000;
            let timeFilter = Date.UTC(1970, 0, 1, uHour, uMinute, uSecond) / 1000;

            var params = {
                apList: apList,
                binDate: dateFilter,
                timestamp: timeFilter,
                unit: $scope.trafficUsage.unit
            };

            statsService.getUniqueClientsForAps(params, function (result) {
                if (result.success) {
                    // console.log(result.data);

                    for (var i = 0; i < canvasContainer.devices.length; i++) {
                        var find = _.find(result.data, function (item) {
                            return item._id == canvasContainer.devices[i].apMACAddr;
                        })
                        canvasContainer.devices[i].uniqueClients = find ? find.count : -1;
                    }
                    canvasContainer.refresh();
                }
            });
            statsService.getTrafficUsageForAps(params, function (result) {
                if (result.success) {
                    //  console.log(result.data);

                    for (var i = 0; i < canvasContainer.devices.length; i++) {
                        var find = _.find(result.data, function (item) {
                            return item._id == canvasContainer.devices[i].apMACAddr;
                        })
                        canvasContainer.devices[i].trafficUsage = find ? find.usage : -1;
                    }
                    canvasContainer.refresh();
                }
            });
            //})

        };

        $scope.bigger = function () {
            canvasContainer.zoomIn();
        };
        $scope.reset = function () {
            canvasContainer.zoomReset();
        };
        $scope.smaller = function () {
            canvasContainer.zoomOut();
        };
    });
});


