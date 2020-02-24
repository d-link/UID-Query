/**
 * Created by lizhimin on 2017/6/9.
 */
define(["app"], function (app) {
    app.register.controller('sitePerformanceController', function ($scope, Current, BatchConfigService) {
        $scope.hasPrivilege = Current.user().role == "root admin" || Current.user().role == "local admin";
        $scope.state = {
            performance: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgTrue: 'configuration.perf.msgTrue',
                msgFalse: 'Error'
            },
        };
        function initPerformanceState() {
            $scope.state.performance.processing = false;
            $scope.state.performance.isSuccess = false;
            $scope.state.performance.isError = false;

        };
        initPerformanceState();
        $scope.error24 = {};
        $scope.error5 = {};
        $scope.error52 = {};
        $scope.statuses = ['0', 1];
        $scope.perfShowData = angular.copy($scope.perfData);
        $scope.$watch('perfShowData', function () {
            initPerformanceState();
        }, true);
        /*
         * 页面操作
         */

        $scope.save = function () {
            // Todo 判断数据是否合法
            // 根据 $scope.perfShowData[x].wirelessMode值进行判断

            // 存储状态初始化
            $scope.state.performance.processing = true;
            $scope.state.performance.isSuccess = false;
            $scope.state.performance.isError = false;

            // 存储数据格式转化
            $scope.perfSaveData = angular.copy($scope.perfShowData);
            for (var x in $scope.perfSaveData) {
                if(x=='lan'){
                    $scope.perfSaveData[x].stp-=0;
                }else{
                    $scope.perfSaveData[x].wirelessStatus -= 0;
                    $scope.perfSaveData[x].wmm -= 0;
                    $scope.perfSaveData[x].shortGI -= 0;
                    $scope.perfSaveData[x].igmpSnooping -= 0;
                    $scope.perfSaveData[x].multicastBWControl -= 0;
                    $scope.perfSaveData[x].ht2040Coexistence -= 0;
                    $scope.perfSaveData[x].dhcptoUnicast-=0;
                }

            }
            ;

            // 存储数据
            BatchConfigService.updatePerformance($scope.profileId, $scope.perfSaveData, function (result) {
                // $emit 事件  更新左侧列表数据
                $scope.state.performance.processing = false;
                if (result.success) {
                    $scope.state.performance.isSuccess = true;
                    $scope.$emit('refreshBCTree');
                    $scope.$emit('refreshActiveProfile');
                } else {
                    $scope.state.performance.isError = true;
                }
                ;
            });
        };

    });
    app.register.directive('sitePerformance', function () {
        return {
            restrict: 'AE',
            templateUrl: "./views/configuration/site-Performance.html",
            scope: {
                perfData: '=',
                profileId: '='
            },
            controller: 'sitePerformanceController'
        };
    });
    app.register.directive('sitePerformanceTemp', function () {
        return {
            restrict: 'AE',
            templateUrl: "performanceTemplates.html",
            scope: {
                showData: '=',
                bandType: '=',
                error: '='
            },
            controller: function ($scope) {
                if($scope.bandType){
                    $scope.perfShowData=$scope.showData[$scope.bandType];
                }
                /*
                 * 页面固定参数
                 */
                var dataRates = $scope.bandType=='band24' ?  ['1', '2', '5.5', '6', '9', '11', '12', '18', '24', '36', '48', '54']:['6', '9', '12', '18', '24', '36', '48', '54'] ;
                var modes = $scope.bandType=='band24' ? [1, 2, 3]:[4, 5, 6, 7]  ;
                if($scope.perfShowData.notShow){
                    modes = $scope.bandType=='band24' ? [1, 2]:[4, 5, 7];
                }
                var bests = ['Best'];
                $scope.options = {
                    statuses: [0, 1],
                    wirelessStatus: [0, 1],
                    modes: modes,
                    dataRates: dataRates,
                    channelWidths: ($scope.bandType!='band24' && $scope.perfShowData.wirelessMode == 7) ? [1, 2, 3] : [1, 2],
                    multicastRates: $scope.bandType=='band24' ?  ['Disable', '1', '2', '5.5', '6', '9', '11', '12', '18', '24', '36', '48', '54']:['Disable', '6', '9', '12', '18', '24', '36', '48', '54']
                };
                /*
                 * 页面操作
                 */
                $scope.changeWifiMode = function (index, item) {
                    if ($scope.perfShowData.wirelessMode == 7) {
                        $scope.options.channelWidths = [1, 2, 3];
                    } else {
                        $scope.options.channelWidths = [1, 2];
                        if ($scope.perfShowData.channelWidth == 3) {
                            $scope.perfShowData.channelWidth = 2;
                        }
                    }
                    if ($scope.perfShowData.wirelessMode == 2 || $scope.perfShowData.wirelessMode == 5) {

                        $scope.options.dataRates = dataRates;
                        $scope.perfShowData.dataRate = $scope.options.dataRates[0];
                        $scope.perfShowData.shortGI = 0;
                        $scope.perfShowData.channelWidth = 1;
                    } else {
                        $scope.options.dataRates = bests;
                        $scope.perfShowData.dataRate = $scope.options.dataRates[0];
                        $scope.perfShowData.wmm = 1;
                    }
                    if ($scope.perfShowData.wirelessMode == 5 || $scope.perfShowData.wirelessMode == 7) {
                        $scope.perfShowData.multicastRate = 'Disable';
                    }

                    // $scope.options.dataRates = item==1||item==3?dataRates_best:dataRates_mbps;
                    // $scope.perfShowData.dot11DataRate = $scope.options.dataRates[0];
                    // if (item==2) {
                    //     $scope.perfShowData.dot11ShortGI = 'disabled';
                    // }

                };


                // $scope.error = {};
                $scope.ack24Re = /^(4[8-9]|[5-9]\d|1\d{2}|200)$/;
                $scope.ack5Re = /^(2[5-9]|[3-9]\d|1\d{2}|200)$/;
                $scope.numberInputBlur = function (name, type) {
                    switch (type) {
                        case 0: // beaconInterval 40-500
                            var re = /^([1-4]\d{2}|500|[4-9]\d)$/;
                            break;
                        case 1: // dtimInterval 1-15
                            var re = /^([1-9]|1[0-5])$/;
                            break;
                        case 2: // ackTimeout 2.4GHz 48-200, 5GHz 25-200
                            var re = $scope.bandType=='band24' ?  /^(4[8-9]|[5-9]\d|1\d{2}|200)$/:/^(2[5-9]|[3-9]\d|1\d{2}|200)$/;
                            break;
                        case 3: // maxMulticastBW 1-1024
                            var re = /^(10[0-1]\d|102[0-4]|[1-9]\d{2}|[1-9]\d|[1-9])$/;
                            break;
                        case 4: // rtsLength fragmentLength 256-2346
                            var re = /^(2[0-2]\d{2}|23[0-3]\d|234[0-6]|1\d{3}|[3-9]\d{2}|2[6-9]\d|25[6-9])$/;
                            break;
                        default:
                            break;
                    }
                    ;
                    if (re) $scope.error[name] = !re.test($scope.perfShowData[name]);
                };
                $scope.valueChange = function (name) {
                    $scope.error[name] = false;
                    if(name=='maxMulticastBW'){
                        if($scope.bandType=='band5'){
                            $scope.showData.band24.maxMulticastBW=$scope.showData.band5.maxMulticastBW;
                            $scope.showData.secBand5.maxMulticastBW=$scope.showData.band5.maxMulticastBW;
                        }else  if($scope.bandType=='band24'){
                            $scope.showData.band5.maxMulticastBW=$scope.showData.band24.maxMulticastBW;
                            $scope.showData.secBand5.maxMulticastBW=$scope.showData.band24.maxMulticastBW;
                        }else{
                            $scope.showData.band5.maxMulticastBW=$scope.showData.secBand5.maxMulticastBW;
                            $scope.showData.band24.maxMulticastBW=$scope.showData.secBand5.maxMulticastBW;
                        }
                    }
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
                $scope.checkMulticast = function () {
                    if ($scope.perfShowData.igmpSnooping == 1) {
                        $scope.perfShowData.multicastRate = 'Disable';
                    }
                }
                $scope.checkMulticastBC = function () {
                    if($scope.bandType=='band5'){
                        $scope.showData.band24.multicastBWControl=$scope.showData.band5.multicastBWControl;
                        $scope.showData.secBand5.multicastBWControl=$scope.showData.band5.multicastBWControl;
                    }else  if($scope.bandType=='band24'){
                        $scope.showData.band5.multicastBWControl=$scope.showData.band24.multicastBWControl;
                        $scope.showData.secBand5.multicastBWControl=$scope.showData.band24.multicastBWControl;
                    }else{
                        $scope.showData.band5.multicastBWControl=$scope.showData.secBand5.multicastBWControl;
                        $scope.showData.band24.multicastBWControl=$scope.showData.secBand5.multicastBWControl;
                    }
                }
                $scope.checkUnicast = function () {
                    if($scope.bandType=='band5'){
                        $scope.showData.band24.dhcptoUnicast=$scope.showData.band5.dhcptoUnicast;
                        $scope.showData.secBand5.dhcptoUnicast=$scope.showData.band5.dhcptoUnicast;
                    }else  if($scope.bandType=='band24'){
                        $scope.showData.band5.dhcptoUnicast=$scope.showData.band24.dhcptoUnicast;
                        $scope.showData.secBand5.dhcptoUnicast=$scope.showData.band24.dhcptoUnicast;
                    }else{
                        $scope.showData.band5.dhcptoUnicast=$scope.showData.secBand5.dhcptoUnicast;
                        $scope.showData.band24.dhcptoUnicast=$scope.showData.secBand5.dhcptoUnicast;
                    }
                }
                $scope.checkSnooping = function () {
                    if ($scope.perfShowData.multicastRate != 'Disable') {
                        $scope.perfShowData.igmpSnooping = 0;
                    }
                }
            }
        };
    });
})