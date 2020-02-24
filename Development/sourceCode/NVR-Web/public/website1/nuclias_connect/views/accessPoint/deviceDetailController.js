/**
 * Created by guojiangchao on 2017/9/22.
 */
define(["app", "echarts"], function (app, echarts) {

    app.register.controller('deviceDetailController', function ($scope, $state, Current, $uibModal, $timeout, $stateParams, utils, DeviceDetailService, OrganizationService, DashboardService, TS) {
        setHeight('set-height', ['grid-top-menu']);
        window.onresize = function () {
            $timeout.cancel($scope.timer);
            $scope.timer = $timeout(function () {
                setHeight('set-height', ['grid-top-menu']);
            }, 300);
            resetCartSize();
        };
        $scope.templocation = '';
        $scope.$watch('isHide', function (val) {
            resetCartSize();

        })
        $scope.state = {
            processing: false,
            isSuccess: false,
            isError: false
        }
        function resetCartSize() {
            if ($scope.isHide) {
                $scope.size = {
                    width: document.body.clientWidth - 166,
                    height: 252
                }
            } else {
                $scope.size = {
                    width: document.body.clientWidth - 282,
                    height: 252
                }
            }
        }

        $scope.size = {
            width: document.body.clientWidth - 282,
            height: 252
        };
        var userInfo = Current.user();
        $scope.power = {
            hasCreate: userInfo.role == 'root admin',
            hasEdit: function (client) {
                if (userInfo.role == 'root admin')return true;
                if (userInfo.role == 'local admin') {
                    return true;
                }
                return false;
            }
        }
        OrganizationService.listSuppliers(function (result) {
            if (result.success) {
                $scope.suppliers = result.data;
            }
        });

        /*
         * 固定参数
         */
        $scope.powerSettings = ['default', '12.5', '25', '50', '100'];

        /*显示正在加载*/
        function showChartsLoading() {
            //setTimeout(() => {
            $scope.deviceDetailCharts = echarts.init(document.getElementById('deviceDetailChart'));
            // // 调用showLoading方法
            $scope.deviceDetailCharts.showLoading({
                text: TS.ts('column.loading'),
                color: '#D5D5D5',
                textColor: '#000',
                maskColor: 'rgba(255, 255, 255, 0.8)',
                zlevel: 0,
            });
            //}, 0);
        }

        $scope.accessPointsCharts = {
            options: {
                legend: {
                    right: 12,
                    data: ['Download (MB)', 'Upload (MB)']
                },
                grid: {
                    show: true,
                    left: 24,
                    top: 44,
                    right: 24,
                    bottom: 28,
                    containLabel: true
                },
                xAxis: [
                    {
                        type: 'category',
                        data: []
                    }
                ],
                yAxis: [
                    {
                        type: 'value'
                    }
                ],
                series: [
                    {
                        name: 'Download (MB)',
                        color: ['#22b7db'],
                        type: 'line',
                        stack: '总量',
                        areaStyle: {
                            normal: {
                                color: 'rgba(34,183,219,0.1)',
                            }
                        },
                        symbol: 'circle',
                        symbolSize: 4,
                        smooth: false,
                        hoverAnimation: false
                        //data: txData
                    }, {
                        name: 'Upload (MB)',
                        color: ['#afcb20'],
                        type: 'line',
                        stack: '总量',
                        areaStyle: {
                            normal: {
                                color: 'rgba(175,203,32,0.1)',
                            }
                        },
                        symbol: 'circle',
                        symbolSize: 4,
                        smooth: false,
                        hoverAnimation: false
                        //data: rxData
                    }
                ]
            }
        };

        $scope.clientsInfoOptions = {
            enableSorting: true,
            excessRows: 100,
            columnDefs: [
                {field: 'index', enableSorting: false,  enableColumnMenu:false, enableHiding: false, width: "5%", displayName: TS.ts('column.no'), cellTemplate: '<div class="ui-grid-cell-contents item_number">{{rowRenderIndex + 1}}</div >'},
                {
                    field: 'action', enableSorting: false,  enableColumnMenu:false, width: "6%", displayName: TS.ts('column.action'), enableHiding: false,
                    cellTemplate: '<div class="ui-grid-cell-contents">' +
                    '<button class="btn-grid wa" type="button"ng-if="grid.appScope.power.hasEdit(row.entity)"  ng-click="grid.appScope.blockClient(row.entity)" title="{{\'wireless.blockTitle\'|translate}}"><md-icon md-svg-icon="modal:block"></md-icon></button></div>'
                },
                {field: 'ipv4Addr', width: "12%", displayName: TS.ts('column.ipv4'), enableHiding: false,  sort:{
                    direction:'asc'
                },
                    sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                        var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                        return utils.sortByIP(nulls, a, b);

                    }
                },
                {field: 'ipv6Addr', width: "12%", displayName: TS.ts('column.ipv6')},
                {field: 'clientMACAddr', width: "12%", displayName: TS.ts('column.mac'), enableHiding: false},
                {
                    field: 'authType',
                    width: "10%",
                    displayName: TS.ts('column.authType'),
                    enableHiding: false,
                    cellTemplate: '<div class="ui-grid-cell-contents">{{\'configuration.ssid.authType\' + row.entity.authType | translate}}</div>',
                    sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                        var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                        return utils.sortAuthType(nulls, a, b);

                    }
                },
                {field: 'clientOS', width: "8%", displayName: TS.ts('column.os')},

                {
                    field: 'staToApRxDataBytes', type:'number',width: "8%", displayName: TS.ts('column.upload'),
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.staToApRxDataBytes|bytesFilter}}</div>'
                },
                {
                    field: 'apToStaTxDataBytes', type:'number',width: "10%", displayName: TS.ts('column.download'),
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.apToStaTxDataBytes|bytesFilter}}</div>'
                },
                {field: 'upTime',type:'number', width: "8%", displayName: TS.ts('column.sysUpTime'), cellFilter: 'uptimeFilter'},
                {field: 'channel',type:'number', width: "10%", displayName: TS.ts('column.channel')},
                {field: 'clientRssi', type:'number',width: "10%", displayName: TS.ts('column.rssi')},
                {field: 'clientSnr', type:'number',width: "9%", displayName: TS.ts('column.snr')},
                {field: 'band', width: "7%", displayName: TS.ts('column.band'), cellFilter: 'bandFilter'},
                {field: 'ssid', minWidth: "90", displayName: TS.ts('column.ssid')}

            ],
            data: [],
            onRegisterApi: function (gridApi) {
                $scope.gridApi = gridApi;

            }
        };
        $scope.saveDevInfo = function () {
            // alert('保存功能暂未实现，刷新页面数据会变为初始状态');
            $scope.state.processing = true;
            $scope.state.isError = false;
            $scope.state.isSuccess = false;
            var param = {
                devMac: $scope.device.mac,
                channel24Ghz: $scope.device.server.channel24Ghz,
                channel5Ghz: $scope.device.server.channel5Ghz,
                channel5Ghz2: $scope.device.server.channel5Ghz2,
                power24Ghz: $scope.device.server.power24Ghz,
                power5Ghz: $scope.device.server.power5Ghz,
                power5Ghz2: $scope.device.server.power5Ghz2,
                location: $scope.templocation,
                name: $scope.device.server.name,
                networkId: $scope.device.networkId
            };
            if ($scope.nodeEnv == 'Production_hualian') {
                param.supplierId = $scope.device.supplier._id;               
            }
            DeviceDetailService.saveDeviceInfo(param, function (result) {
                $scope.state.processing = false;
                if (result.success) {
                    $scope.state.isSuccess = true;
                    // $scope.infoEdit = false;
                    // 更新 浏览器缓存数据 重新获取device数据
                    Current.setDevice($scope.device);

                } else {
                    $scope.state.isError = true;
                }
                $timeout(function () {
                    $scope.state.isError = false;
                    $scope.state.isSuccess = false;
                }, 10000);
            });
        };
        $scope.enterKeydown = function ($event) {
            var keycode = window.event ? $event.keyCode : $event.which;//获取按键编码
            if (keycode == 13) {
                if ($event.target) {
                    $event.target.blur();
                }
            }
        };
        // save name on grid of AP
        $scope.saveClientName = function (row) {
            DeviceDetailService.renameClient({
                devMac: row.apMACAddr,
                clientMACAddr: row.clientMACAddr,
                name: row.name,
                networkId: $scope.device.networkId
            }, function (result) {

            })
        };
        $scope.Error = {
            blockClient: false
        }
        var mytimeout = null;
        $scope.blockClient = function (row) {
            if (mytimeout) {
                $timeout.cancel(mytimeout);
            }
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/templates/dialogConfirm.html',
                windowClass: 'modal-del',
                resolve: {
                    row:row
                },
                size: "w500",
                controller: function ($scope, $uibModalInstance, row) {
                    $scope.con = {
                        title: TS.ts("wireless.blockTitle"),
                        content: TS.ts("wireless.blockTip"),
                        type: 'modal:block'
                    };
                    $scope.ok = function () {
                        $uibModalInstance.close(row);
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function (row) {
                DeviceDetailService.blockClient({
                    uuid: row.uuid,
                    sessionId: row.sessionId,
                    wlanId: row.wlanId,
                    clientMACAddr: row.clientMACAddr,
                    networkId: $scope.device.networkId
                }, function (result) {
                    if (result.success) {
                        for (var i = 0; i < $scope.clientsInfoOptions.data.length; i++) {
                            if ($scope.clientsInfoOptions.data[i].clientMACAddr == row.clientMACAddr) {
                                $scope.clientsInfoOptions.data.splice(i, 1);
                            }
                        }
                    }else{
                        if (result.error == -2) {
                            $scope.Error.blockClient = true;
                            mytimeout = $timeout(function () {
                                $scope.Error.blockClient = false;
                            }, 10 * 1000);
                        }
                    }
                })
            }, function () {

            });
        }
        /*
         * 数据绑定
         */
        $scope.device = {};
        // mock data
        // var timeData = ['0:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00',
        //     '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
        //     '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
        // var rxData = [80, 90, 20, 120, 300, 150, 250, 60, 80, 90, 20, 120, 300,
        //     150, 250, 60, 40, 80, 60, 30, 200, 150, 20, 150];
        // var txData = [40, 30, 110, 150, 20, 10, 20, 80, 30, 40, 80, 60, 30, 200,
        //     50, 40, 80, 90, 20, 120, 110, 250, 60, 80];
        // $scope.accessPointsCharts.options.xAxis[0].data = timeData;
        // $scope.accessPointsCharts.options.series[0].data = rxData;
        // $scope.accessPointsCharts.options.series[1].data = txData;
        var noNTPTimeData = ['-23' + TS.ts("label.hours"), '-22' + TS.ts("label.hours"), '-21' + TS.ts("label.hours"), '-20' + TS.ts("label.hours"),
            '-19' + TS.ts("label.hours"), '-18' + TS.ts("label.hours"), '-17' + TS.ts("label.hours"), '-16' + TS.ts("label.hours"),
            '-15' + TS.ts("label.hours"), '-14' + TS.ts("label.hours"), '-13' + TS.ts("label.hours"), '-12' + TS.ts("label.hours"),
            '-11' + TS.ts("label.hours"), '-10' + TS.ts("label.hours"), '-9' + TS.ts("label.hours"), '-8' + TS.ts("label.hours"),
            '-7' + TS.ts("label.hours"), '-6' + TS.ts("label.hours"), '-5' + TS.ts("label.hours"), '-4' + TS.ts("label.hours"),
            '-3' + TS.ts("label.hours"), '-2' + TS.ts("label.hours"), '-1' + TS.ts("label.hours"), TS.ts("dashboard.now")];

        $scope.deviceId = $stateParams.id;
        $scope.hasPrivilege = userInfo.role == "root admin" || (userInfo.role == "local admin" && userInfo.privilege.indexOf($scope.device.networkId) != -1);

        if ($scope.device && $scope.device.server) {
            $scope.templocation = $scope.device.server.location;
        }
        var getDeviceInfo = function () {
            DeviceDetailService.getDeviceInfo($scope.deviceId, function (result) {
                if (result.success) {
                    result.data.firmware = fwVersionFilter(result.data.firmware);
                    $scope.device = result.data;
                    if ($scope.device && $scope.device.server) {
                        $scope.templocation = $scope.device.server.location;
                    }
                    Current.setDevice($scope.device);
                    $scope.hasPrivilege = userInfo.role == "root admin" || (userInfo.role == "local admin" && userInfo.privilege.indexOf($scope.device.networkId) != -1);

                    DeviceDetailService.getSupplierInfo($scope.device.supplierId, function(result2) {
                        $scope.device.supplier = result2.data;
                    });

                    getUDInfo();
                    getClientsInfo();
                }
            });
        };
        var getUDInfo = function () {
            showChartsLoading();
            //以NC版本的时间为准
            var hour = new Date(NCTime).getHours();
            var offset = NCTimeOffset;
            var time = {startHour: hour, offset: offset, ntpStatus: $scope.NTPStatus1};
            DashboardService.getUsageDataByAP($scope.device.mac, time, function (result) {
                if (result.success && result.data) {
                    var data = result.data;
                    $scope.accessPointsCharts.options.legend.data[0] = TS.ts('column.download') + ' (' + data.unit + ')';
                    $scope.accessPointsCharts.options.legend.data[1] = TS.ts('column.upload') + ' (' + data.unit + ')';
                    $scope.accessPointsCharts.options.yAxis[0].name = data.unit + '/hour';
                    if ($scope.NTPStatus1 == 1) {
                        $scope.accessPointsCharts.options.xAxis[0].data = data.timeData;
                    } else {
                        $scope.accessPointsCharts.options.xAxis[0].data = noNTPTimeData;
                    }
                    $scope.accessPointsCharts.options.series[0].data = data.rxData;
                    $scope.accessPointsCharts.options.series[0].name = TS.ts('column.download') + ' (' + data.unit + ')';
                    $scope.accessPointsCharts.options.series[1].data = data.txData;
                    $scope.accessPointsCharts.options.series[1].name = TS.ts('column.upload') + ' (' + data.unit + ')';
                    $scope.accessPointsCharts.options.needInit = true;
                }

            });
        };

    
        function fwVersionFilter(str) {
            var location_r = str.indexOf('r');
            var finalStr=str;
            if(location_r!=-1&&str.length>=location_r+4){
                finalStr = str.substring(0, location_r+4);
            }
            return finalStr;
        }


        var getClientsInfo = function () {
            DeviceDetailService.getClientInfos($scope.device.mac, function (result) {
                if (result.success) {
                    $scope.clientsInfoOptions.data = result.data;
                }
            });
        }
        OrganizationService.getNodeEnv(function (result) {
            if (result.success) {
                Current.setNodeEnv(result.data);
                $scope.nodeEnv = result.data;
            }
        });
        /**
         * @method 以NCTime也就是后台时间为准
         * @author 李莉红
         * @version
         * */
        //utils.getNodeTime(function () {
        $scope.NTPStatus1 = 0;
        OrganizationService.getSystemStatus(function (result) {
            if (result.success) {
                $scope.NTPStatus1 = result.data.ntpStatus;
            }
            getDeviceInfo();
        });
        //});
    });
});