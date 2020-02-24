/**
 * Created by BSDC on 2017/12/14.
 */
define(["app"], function (app) {

    app.register.controller('aboutController', function ($rootScope, $scope, $uibModal, $state, $http, Current, OrganizationService, $timeout, TS, Avt) {
        /**
         * 获控制内容区域高度
         */
        window.onresize = function () {
            setHeight();
            $timeout.cancel($scope.timer);
            $scope.timer = $timeout(function () {
                setHeight('tab-content', [], -40);
                setGridHeight('about-grid', true);
            }, 300);
        };
        $scope.timer = $timeout(function () {
            setHeight('tab-content', [], -40);
            setGridHeight('about-grid', true);
        }, 300);

        $scope.state = {
            isSuccess: false, isError: false, processing: false, msgTrue: 'about.msgTrue',
            msgFalse: {content: 'about.error2', contentvals: ''},
        };
        $scope.updateList = function () {
            $scope.state.processing = true;
            $scope.state.isSuccess = false;
            $scope.state.isError = false;
            OrganizationService.UpdateModules(function (result) {
                $scope.state.processing = false;
                if (result.success) {
                    $scope.state.isSuccess = true;
                    $scope.state.msgTrue = 'about.msgTrue';
                    $scope.gridOptionsAbout.data = result.data;
                } else {
                    if (result.error == 1) {
                        $scope.state.isSuccess = true;
                        $scope.state.msgTrue = 'about.error1';
                    } else {
                        $scope.state.isError = true;
                        $scope.state.msgFalse.content = 'about.error2';
                        $scope.state.msgFalse.contentvals = {msg: result.error};
                    }
                }
                $timeout(function () {
                    $scope.state.isSuccess = false;
                    $scope.state.isError = false;
                }, 5000);
            });
        }
        /**
         * 表格参数
         */
        $scope.gridOptionsAbout = {
            //enableGridMenu: true,
            paginationPageSizes: [20, 25, 50],
            paginationPageSize: 20,
            paginationTemplate: './views/templates/gridBurster.html',
            columnDefs: [
                {
                    field: 'moduleType', width: "18%", sort: {
                        direction: 'asc'
                    }, displayName: TS.ts('column.moduleType'), enableHiding: false,
                },
                /*   {field: 'soid', minWidth: "180", displayName: 'Model OID'},
                 {field: 'seriesName', minWidth: "110", displayName: 'Series Name'},*/
                {
                    field: 'bandType',
                    width: "18%",
                    displayName: TS.ts('column.bandType'),
                    cellFilter: 'bandTypeFilter',
                    enableHiding: false,
                },
                {field: 'hardware', width: "18%", displayName: TS.ts('column.hardware'), enableHiding: false,},
                {
                    field: 'desc',
                    minWidth: "360",
                    displayName: TS.ts('column.desc'),
                    enableSorting: false,
                    enableColumnMenu: false,
                    enableHiding: false,
                }
            ]
        };
        /**
         * 获取表格数据
         */
        // Model List 
        OrganizationService.listModules(function (result) {
            $scope.gridOptionsAbout.data = result;
            //console.log(result)
        });
        // System Information
        OrganizationService.listAllOrgs(function (orgs) {
            if (orgs && orgs.length > 0) {
                $scope.deveiceName = orgs[0].name;
                OrganizationService.getSystemInfo(function (result) {
                    if (result.success) {
                        $scope.firmwareVersion = result.data.fwVersion;
                        $scope.macAddress = result.data.macAddress;
                        $scope.ipMode = result.data.ip.ipMode;
                        $scope.ipAddress = result.data.ip.ipAddress;
                        $scope.netmask = result.data.ip.netmask;
                        $scope.gateway = result.data.ip.gateway;
                        $scope.dns1 = result.data.ip.dns1;
                        $scope.dns2 = result.data.ip.dns2;
                        $scope.ntp = result.data.NTPServer;
                        $scope.time = result.data.time;
                        $scope.timezone = result.data.timezone;
                        $scope.systemUsage = result.data.sysUsage;
                        $scope.microSDUsage = result.data.sdUsage;
                        $scope.usbUsage = result.data.usbUsage;
                        $scope.upTime = result.data.upTime;
                        $scope.nucliasConnectVersion = result.data.ncVersion;
                        $scope.hardwareVersion = result.data.hwVersion;
                        $scope.ddpClientVersion = result.data.ddpClientVersion;
                        $scope.NTPStatus1 = result.data.NTPStatus;
                        $scope.SDStatus1 = result.data.sdStatus;
                    }
                });
            }

        });
    })
});