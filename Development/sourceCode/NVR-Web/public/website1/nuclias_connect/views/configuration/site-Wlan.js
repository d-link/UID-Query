/**
 * Created by lizhimin on 2017/6/9.
 */
define(["app"], function (app) {
    app.register.controller('siteWlanController', function ($scope, Current, BatchConfigService) {
        $scope.hasPrivilege = Current.user().role == "root admin" || Current.user().role == "local admin";
        /*
         * 页面固定参数
         */
        $scope.state = {
            wlan: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgTrue: 'configuration.wlan.msgTrue',
                msgFalse: 'Error'
            },
        };
        function initWlanState() {
            $scope.state.wlan.processing = false;
            $scope.state.wlan.isSuccess = false;
            $scope.state.wlan.isError = false;
        };
        initWlanState();
        $scope.wlanChanged = function () {
            initWlanState();

        };
        $scope.connections = [1, 0, 2];
        $scope.statuses = ['0', 1];
        $scope.wlanSetting24 = [
            {name: 'primarySSID', cont: 1},
            {name: 'multiSSID1', cont: 1},
            {name: 'multiSSID2', cont: 1},
            {name: 'multiSSID3', cont: 1},
            {name: 'multiSSID4', cont: 1},
            {name: 'multiSSID5', cont: 1},
            {name: 'multiSSID6', cont: 1},
            {name: 'multiSSID7', cont: 1}
        ];
        $scope.wlanSetting5 = angular.copy($scope.wlanSetting24);
        $scope.wlanSetting52 = angular.copy($scope.wlanSetting24)

        /*
         * 数据绑定
         */
        // mock data
        // $scope.wlanShowData = {
        //     band24: {
        //         linkIntegrity: 0,
        //         ethToWlan: 0,
        //         primarySSID: 1,
        //         multiSSID1: 2
        //     },
        //     band5: {
        //         linkIntegrity: 1,
        //         ethToWlan: 0
        //     }
        // };
        $scope.wlanShowData = angular.copy($scope.wlanData);
        for (var i = 0; i < $scope.wlanSetting24.length; i++) {
            $scope.wlanSetting24[i].cont = $scope.wlanShowData.band24[$scope.wlanSetting24[i].name]
        }
        for (var i = 0; i < $scope.wlanSetting5.length; i++) {
            $scope.wlanSetting5[i].cont = $scope.wlanShowData.band5[$scope.wlanSetting5[i].name]
        }
        for (var i = 0; i < $scope.wlanSetting52.length; i++) {
            $scope.wlanSetting52[i].cont = $scope.wlanShowData.secBand5[$scope.wlanSetting52[i].name]
        }

        /*
         * 页面操作
         */
        $scope.save = function () {
            $scope.state.wlan.processing = true;
            $scope.state.wlan.isSuccess = false;
            $scope.state.wlan.isError = false;
            var wlanSaveDate = angular.copy($scope.wlanShowData);
            wlanSaveDate.band24.linkIntegrity -= 0;
            wlanSaveDate.band24.ethToWlan -= 0;
            wlanSaveDate.band5.linkIntegrity -= 0;
            wlanSaveDate.band5.ethToWlan =wlanSaveDate.band24.ethToWlan;
            wlanSaveDate.secBand5.linkIntegrity -= 0;
            wlanSaveDate.secBand5.ethToWlan =wlanSaveDate.band24.ethToWlan;
            for (var i = 0; i < $scope.wlanSetting24.length; i++) {
                wlanSaveDate.band24[$scope.wlanSetting24[i].name] = $scope.wlanSetting24[i].cont - 0;
            }
            for (var i = 0; i < $scope.wlanSetting5.length; i++) {
                wlanSaveDate.band5[$scope.wlanSetting5[i].name] = $scope.wlanSetting5[i].cont - 0;
            }
            for (var i = 0; i < $scope.wlanSetting52.length; i++) {
                wlanSaveDate.secBand5[$scope.wlanSetting52[i].name] = $scope.wlanSetting52[i].cont - 0;
            }
            //console.log(wlanSaveDate)
            BatchConfigService.updateWlanPartition($scope.profileId, wlanSaveDate, function (result) {
                // $emit 事件  更新左侧列表数据
                $scope.state.wlan.processing = false;
                if (result.success) {
                    $scope.state.wlan.isSuccess = true;
                    $scope.$emit('refreshBCTree');
                    $scope.$emit('refreshActiveProfile');
                } else {
                    $scope.state.wlan.isError = true;
                }
                ;
            });
        };
    })
    app.register.directive('siteWlan', function () {
        return {
            restrict: 'AE',
            templateUrl: "./views/configuration/site-Wlan.html",
            scope: {
                wlanData: '=',
                profileId: '='
            },
            controller: 'siteWlanController'
        };
    });
});