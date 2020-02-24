/**
 * Created by lizhimin on 2017/6/9.
 */
define(["app"], function (app) {
    app.register.controller('siteRFController', function ($scope, Current, BatchConfigService, utils) {
        $scope.hasPrivilege = Current.user().role == "root admin" || Current.user().role == "local admin";
        /*
         * 页面固定参数
         */
        $scope.state = {
            rf: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgTrue: 'configuration.rf.msgTrue',
                msgFalse: 'Error'
            },
        };
        function initRfState() {
            $scope.state.rf.processing = false;
            $scope.state.rf.isSuccess = false;
            $scope.state.rf.isError = false;
        };
        initRfState();
        $scope.frequencies = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        /*
         * 数据绑定
         */
        $scope.rfOptData = angular.copy($scope.rfOpt);
        if (!$scope.rfOptData) {
            $scope.rfOptData = {
                rfReportFrequency: 6,
                enableACA: 0,
                enableAPA: 0,
                subCfgID: 1
            };
        }
        // 用于页面显示
        $scope.rfOptData.enableACA = $scope.rfOptData.enableACA == 1 ? true : false;
        $scope.rfOptData.enableAPA = $scope.rfOptData.enableAPA == 1 ? true : false;

        $scope.ACPChange = function () {
            if (!$scope.rfOptData.enableACA) {
                $scope.rfOptData.enableAPA = false;
            }
        }

        $scope.save = function () {
            // 处理数据
            var param = {
                profileId: $scope.profileId,
                rfOpt: {
                    enableACA: $scope.rfOptData.enableACA ? 1 : 0,
                    enableAPA: $scope.rfOptData.enableAPA ? 1 : 0,
                    rfReportFrequency: $scope.rfOptData.rfReportFrequency,
                    subCfgID: $scope.rfOptData.subCfgID

                }
            };
            // 状态
            $scope.state.rf.processing = true;
            $scope.state.rf.isSuccess = false;
            $scope.state.rf.isError = false;
            BatchConfigService.updateRFOpt(param, function (result) {
                $scope.state.rf.processing = false;
                if (result.success) {
                    $scope.state.rf.isSuccess = true;
                    $scope.$emit('refreshBCTree');
                    $scope.$emit('refreshActiveProfile');
                } else {
                    $scope.state.rf.isError = true;
                }
                ;
            });
        };
    });
    app.register.directive('siteRf', function () {
        return {
            restrict: 'AE',
            templateUrl: "./views/configuration/site-RF.html",
            scope: {
                rfOpt: '=',
                profileId: '='
            },
            controller: 'siteRFController'
        };
    });
})