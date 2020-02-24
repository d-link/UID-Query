/**
 * Created by lizhimin on 2017/6/9.
 */
define(["app"], function (app) {
    app.register.controller('siteDeviceController', function ($scope, Current, BatchConfigService, utils) {
        $scope.hasPrivilege = Current.user().role == "root admin" || Current.user().role == "local admin";
        /*
         * 页面固定参数
         */
        // 页面保存状态
        $scope.state = {
            device: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgTrue: 'configuration.dev.msgTrue',
                msgFalse: 'Error'
            },
        };
        function initDeviceState() {
            $scope.state.device.processing = false;
            $scope.state.device.isSuccess = false;
            $scope.state.device.isError = false;
        };
        initDeviceState();
        // 下拉选框数据
        $scope.consoleTimeOuts = ['0', 1, 2, 3, 4, 5]; // [0: never | 1: 1 min | 2: 3 mins | 3: 5 mins | 4: 10 mins | 5: 15 mins]

        $scope.timeZones = utils.getTimeZones();
        $scope.selectCountries = utils.getCountries();
        $scope.weeks = utils.getWeeks();
        $scope.months = utils.getMonths();
        $scope.weekStartNumbers = [1, 2, 3, 4, 5];
        $scope.dstOffsets = [15, 30, 45, 60, 75, 90, 105, 120];
        $scope.hours = [];
        for (var i = 0; i < 24; i++) {
            $scope.hours.push(i);
        }
        $scope.minutes = [];
        for (var i = 0; i < 60; i++) {
            $scope.minutes.push(i);
        }
        // 下拉选框选择事件
        $scope.deviceSettingChanged = function () {
            initDeviceState();
        };


        // 数据处理
        $scope.deviceShowData = angular.copy($scope.devData);
        var timeZoneIndex = $scope.deviceShowData.sntpTimeZoneIndex - 1;
        $scope.deviceShowData.sntpTimeZoneIndex = $scope.timeZones[timeZoneIndex];
        var ctCode = $scope.deviceShowData.countrycode - 1;
        $scope.deviceShowData.countrycode = $scope.selectCountries[ctCode];
        $scope.deviceShowData.sntpStatus = $scope.deviceShowData.sntpStatus == 1;
        $scope.deviceShowData.sntpDaylightSaving = $scope.deviceShowData.sntpDaylightSaving == 1;
        if (!$scope.deviceShowData.sntpDstStartWeek) {
            $scope.deviceShowData.sntpDstStartWeek = $scope.weekStartNumbers[0];
        }
        if (!$scope.deviceShowData.sntpDstStartDayOfWeek) {
            $scope.deviceShowData.sntpDstStartDayOfWeek = $scope.weeks[0];
        } else {
            $scope.deviceShowData.sntpDstStartDayOfWeek = $scope.weeks[$scope.deviceShowData.sntpDstStartDayOfWeek];
        }

        if (!$scope.deviceShowData.sntpDstStartMonth) {
            $scope.deviceShowData.sntpDstStartMonth = $scope.months[0];
        } else {
            $scope.deviceShowData.sntpDstStartMonth = $scope.months[$scope.deviceShowData.sntpDstStartMonth - 1];
        }
        if (!$scope.deviceShowData.sntpDstStartCurrentHour) {
            $scope.deviceShowData.sntpDstStartCurrentHour = 0;
        }
        if (!$scope.deviceShowData.sntpDstStartCurrentMin) {
            $scope.deviceShowData.sntpDstStartCurrentMin = 0;
        }
        if (!$scope.deviceShowData.sntpDstEndWeek) {
            $scope.deviceShowData.sntpDstEndWeek = $scope.weekStartNumbers[0];
        }

        if (!$scope.deviceShowData.sntpDstEndDayOfWeek) {
            $scope.deviceShowData.sntpDstEndDayOfWeek = $scope.weeks[0];
        } else {
            $scope.deviceShowData.sntpDstEndDayOfWeek = $scope.weeks[$scope.deviceShowData.sntpDstEndDayOfWeek];
        }
        if (!$scope.deviceShowData.sntpDstEndMonth) {
            $scope.deviceShowData.sntpDstEndMonth = $scope.months[0];
        } else {
            $scope.deviceShowData.sntpDstEndMonth = $scope.months[$scope.deviceShowData.sntpDstEndMonth - 1];
        }
        if (!$scope.deviceShowData.sntpDstEndCurrentHour) {
            $scope.deviceShowData.sntpDstEndCurrentHour = 0;
        }
        if (!$scope.deviceShowData.sntpDstEndCurrentMin) {
            $scope.deviceShowData.sntpDstEndCurrentMin = 0;
        }
        if (!$scope.deviceShowData.sntpDayLightSavingOffset) {
            $scope.deviceShowData.sntpDayLightSavingOffset = $scope.dstOffsets[3];
        }
        $scope.console = {
            enable: false,
            protocol: 'telnet'
        };
        if ($scope.deviceShowData.telnet == 1) {
            $scope.console.enable = true;
        } else if ($scope.deviceShowData.ssh == 1) {
            $scope.console.enable = true;
            $scope.console.protocol = 'ssh';
        }
        /*
         * 保存数据
         */
        $scope.save = function () {
            // Todo 判断数据是否合法

            // 存储状态初始化
            $scope.state.device.processing = true;
            $scope.state.device.isSuccess = false;
            $scope.state.device.isError = false;

            // 存储数据格式转化
            var devSaveData = angular.copy($scope.deviceShowData);
            if ($scope.console.enable) {
                devSaveData.telnet = $scope.console.protocol == 'telnet' ? 1 : 0;
                devSaveData.ssh = $scope.console.protocol == 'ssh' ? 1 : 0;
            } else {
                devSaveData.telnet = 0;
                devSaveData.ssh = 0;
            }
            ;
            devSaveData.sntpDstStartMonth = devSaveData.sntpDstStartMonth.id;
            devSaveData.sntpDstStartDayOfWeek = devSaveData.sntpDstStartDayOfWeek.id;
            devSaveData.sntpDstEndMonth = devSaveData.sntpDstEndMonth.id;
            devSaveData.sntpDstEndDayOfWeek = devSaveData.sntpDstEndDayOfWeek.id;
            devSaveData.timeout -= 0;
            devSaveData.sntpStatus = devSaveData.sntpStatus ? 1 : 0;
            devSaveData.sntpDaylightSaving = devSaveData.sntpDaylightSaving ? 1 : 0;
            devSaveData.countrycode = devSaveData.countrycode.id;
            devSaveData.sntpTimeZoneIndex = devSaveData.sntpTimeZoneIndex.id;
            devSaveData.userName.trim();
            //console.log(devSaveData)

            // 存储数据
            BatchConfigService.updateDevSetting($scope.profileId, $scope.agUuid, devSaveData, function (result) {
                // $emit 事件  更新左侧列表数据
                $scope.state.device.processing = false;
                if (result.success) {
                    $scope.state.device.isSuccess = true;
                    $scope.$emit('refreshBCTree');
                    $scope.$emit('refreshActiveProfile');
                } else {
                    $scope.state.device.isError = true;
                }
                ;
            });
        };

        /*
         * 验证
         */
        $scope.error = {};
        $scope.serverBlur = function (name) {
            var re = /^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|[1-9])\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;
            $scope.error[name] = !re.test($scope.deviceShowData[name]);
        };
        $scope.valueChange = function (name) {
            $scope.error[name] = false;
            initDeviceState();
        };
        // public 输入框限制输入
        $scope.IPKeydown = function ($event) {
            var re = /(\.|\d|Backspace)/;
            if (!re.test($event.key)) {
                $event.preventDefault();
            }
            ;
        };
        $scope.inputKeyDown=function ($event) {
            var re = /\s/;
            if (re.test($event.key)) {
                $event.preventDefault();
            }
        };
    });
    app.register.directive('siteDevice', function () {
        return {
            restrict: 'AE',
            scope: {
                devData: '=',
                profileId: '=',
                agUuid: '='
            },
            templateUrl: "./views/configuration/site-Device.html",
            controller: 'siteDeviceController'
        };
    });
    app.register.filter('hourFilter', function () {
        return function (input) {
            var result = "00";
            if (input) {
                if (parseInt(input) < 10) {
                    input = "0" + input;
                }
                result = input;
            }
            return result;
        };
    })
})