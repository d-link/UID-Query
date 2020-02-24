/**
 * Created by lizhimin on 2017/6/9.
 */
define(["app"], function (app) {
    app.register.controller('siteWirelessController', function ($scope, Current, BatchConfigService) {
        $scope.hasPrivilege = Current.user().role == "root admin" || Current.user().role == "local admin";
        /*
         *页面固定参数
         */
        $scope.state = {
            wireless: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgTrue: 'configuration.wireless.msgTrue',
                msgFalse: 'Error'
            },
        };
        function initWirelessState() {
            $scope.state.wireless.processing = false;
            $scope.state.wireless.isSuccess = false;
            $scope.state.wireless.isError = false;
        };
        initWirelessState();
        $scope.wirelessChanged = function () {
            initWirelessState();
        };
        $scope.statuses = ['0', 1];
        $scope.agingOuts = [1, 2];
        $scope.percent1 = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        $scope.percent2 = ['0', 20, 40, 60, 80, 100]; // ui-select Number 0 存在问题
        $scope.dataRates = [6, 9, 12, 18, 24, 36, 48, 54];
        $scope.agingOutStatus = {
            band24: false,
            band5: false,
            secBand5:false
        };
        $scope.bandlist=['band24','band5','secBand5'];
        $scope.wirelessShowData = angular.copy($scope.wirelessData);
        $scope.ssidUseList = angular.copy($scope.ssidList.list);

        // aclRssi、aging out、limit 选框赋值 | 解决初次点击无反应问题
        $scope.bandlist.forEach(function(band){
            $scope.wirelessShowData[band].aclRssi = $scope.wirelessShowData[band].aclRssi == 1;
            $scope.wirelessShowData[band].connectLimit = $scope.wirelessShowData[band].connectLimit == 1;
            $scope.agingOutStatus[band] = $scope.wirelessShowData[band].agingOut != 0;
            // aging out选框未选中 aging out下拉选单选中第一个
            if (!$scope.agingOutStatus[band]) $scope.wirelessShowData[band].agingOut = 1;
        })
        $scope.wirelessShowData.airtimeFairness.status = $scope.wirelessShowData.airtimeFairness.status == 1;
        if (!$scope.wirelessShowData.bandSteer)  $scope.wirelessShowData.bandSteer = {status: 0};
        $scope.wirelessShowData.bandSteer.status = $scope.wirelessShowData.bandSteer.status == 1;

        /*
         * 保存数据
         */
        $scope.save = function () {
            // Todo 判断数据是否合法


            // 存储状态初始化
            $scope.state.wireless.processing = true;
            $scope.state.wireless.isSuccess = false;
            $scope.state.wireless.isError = false;

            // 存储数据格式转化
            var saveDate = angular.copy($scope.wirelessShowData);
            $scope.bandlist.forEach(function(band){
                if (!$scope.agingOutStatus[band]) saveDate[band].agingOut = 0;
                saveDate[band].aclRssi = saveDate[band].aclRssi ? 1 : 0;
                saveDate[band].connectLimit = saveDate[band].connectLimit ? 1 : 0;
                saveDate[band].userLimit -= 0;
                saveDate[band].preferred11n -= 0;
                saveDate[band].networkUtilization -= 0;
            });
            saveDate.airtimeFairness.status = saveDate.airtimeFairness.status ? 1 : 0;
            saveDate.bandSteer.status = saveDate.bandSteer.status ? 1 : 0;
            //console.log(saveDate)

            // 存储数据
            BatchConfigService.updateWirelessResource($scope.profileId, saveDate, function (result) {
                $scope.state.wireless.processing = false;
                if (result.success) {
                    $scope.state.wireless.isSuccess = true;
                    $scope.$emit('refreshBCTree');
                    $scope.$emit('refreshActiveProfile');
                } else {
                    $scope.state.wireless.isError = true;
                    if(result.error==1){
                        $scope.state.wireless.msgFalse=1;
                    }else{
                        $scope.state.wireless.msgFalse="";
                    }
                }

            });
        };

        $scope.error = {
            band24: {},
            band5: {},
            secBand5:{}
        }
        $scope.numberInputBlur = function (modal, name, type) {
            switch (type) {
                case 0: // userLimit 0-64
                    var re = /^([1-5]\d|6[0-4]|\d)$/;
                    break;
                case 1: // bandSteerAge 0-600
                    var re = /^([1-5]\d{2}|600|[1-9]\d|\d)$/;
                    break;
                case 2: // bandSteerDiff 0-32
                    var re = /^([1-2]\d|3[0-2]|\d)$/;
                    break;
                case 3: // bandSteerRefuse 1-10
                    var re = /^(\d|10)$/;
                    break;
                default:
                    break;
            }
            ;
            if (re) $scope.error[modal][name] = !re.test($scope.wirelessShowData[modal][name]);
        };
        $scope.valueChange = function (modal, name) {
            initWirelessState();
            $scope.error[modal][name] = false;
        };
        $scope.numberKeydown = function ($event) {
            if ($event.keyCode == 9) {
                return;
            }
            var re = /(\d|Backspace)/;
            if (!re.test($event.key)) {
                $event.preventDefault();
            }
            ;
        };

    });
    app.register.directive('siteWireless', function () {
        return {
            restrict: 'AE',
            scope: {
                wirelessData: '=',
                profileId: '=',
                ssidList: '='
            },
            templateUrl: "./views/configuration/site-Wireless.html",
            controller: 'siteWirelessController'
        };
    });
});