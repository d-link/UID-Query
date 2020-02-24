/**
 * Created by lizhimin on 2017/6/9.
 * Edited by guojiangchao on 2017/8/28.
 */
define(["app"], function (app) {
    app.register.controller('siteFirmwareController', function ($scope, BatchConfigService, Upload, $timeout, Current, ajaxService, utils, TS) {
        $scope.hasPrivilege = Current.user().role == "root admin" || Current.user().role == "local admin";
        /*
         * 页面固定参数
         */
        $scope.uploadingCount = 0;
        // firmware配置参数
        $scope.firmwareOptions = {
            columnDefs: [
                {
                    name: 'Model name', displayName: TS.ts('column.modelFW'), enableHiding: false, width: "25%", sort: {
                        direction: 'desc'
                    },
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.moduleType+"/"+row.entity.hwVersion}}</div>'
                },
                {name: 'active.fwVersion', enableHiding: false, displayName: TS.ts('column.firmware'), width: "20%"},
                {
                    name: 'Fimware file', enableHiding: false, enableSorting: false,
                    enableColumnMenu: false, displayName: TS.ts('column.firmwareFile'), minWidth: "200",
                    cellTemplate: '<div class="ui-grid-cell-contents"><div>{{row.entity.name?row.entity.name:row.entity.active.fileName}}</div>'
                },//多加一列action
                {
                    name: 'Action', enableHiding: false, enableSorting: false,
                    enableColumnMenu: false, displayName: TS.ts('column.action'), width: "20%",
                    cellTemplate: '<div ng-if="grid.appScope.hasPrivilege" class="fileSelector bgc-transition btn btn-common fwUploadBtn" ngf-select ngf-drop ng-model="row.entity.file" ngf-drag-over-class="dragOverClassObj"  accept=".bin" ng-change="grid.appScope.uploadFWFile(row.entity,this,row);">' +
                        '<span class="hint-span state processing-msg change-span" style="padding-right: 63px;line-height: 22px;display:none;" id="{{row.entity.$$hashKey}}"><img src="./../public/images/processing.gif" alt="processing" class="mgr8 ">{{common.processing|translate}}</span><span>{{"firmware.change"|translate}}</span></div>'
                }
            ],
            onRegisterApi: function (gridApi) {
                $scope.gridApi = gridApi;
            }
        };
        $scope.firmwareOptions.data = [];
        // firmware更新结果配置
        $scope.firmwareResultOption = {};
        $scope.firmwareResultOption.columnDefs = [
            {
                name: 'logTime',
                displayName: TS.ts('column.runTime'),
                width: "20%",
                minWidth: "135",
                enableHiding: false, sort: {
                    direction: 'desc'
                },
                cellFilter: 'date:"yyyy-MM-dd HH:mm:ss"'
            },
            {
                name: 'target.name',
                displayName: TS.ts('column.name'),
                width: "15%",
                minWidth: "130",
                enableHiding: false
            },
            {
                name: 'target.ip',
                displayName: TS.ts('column.ipv4'),
                width: "18%",
                minWidth: "110",
                enableHiding: false,
                suppressRemoveSort: true,
                sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                    var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                    return utils.sortByIP(nulls, a, b);

                }
            },
            {name: 'target.mac', displayName: TS.ts('column.mac'), width: "18%", minWidth: "110", enableHiding: false},
            {
                name: 'target.moduleType',
                displayName: TS.ts('column.moduleType'),
                width: "12%",
                minWidth: "95",
                enableHiding: false
            },
            {
                name: 'execResult',
                displayName: TS.ts('column.result'),
                width: "17%",
                minWidth: "78",
                enableHiding: false,
                cellTemplate: '<div ng-if="row.entity.resultType==\'Success\'" class="ui-grid-cell-contents">' + TS.ts('common.success') + '</div>' +
                    '<div ng-if="(row.entity.resultType==\'Cancel\' && row.entity.execResult!=\'\')" class="ui-grid-cell-contents" title="{{\'common.cancel\'|translate}}: {{row.entity.execResult}}">' + TS.ts('common.cancel') + ': {{row.entity.execResult}}</div>' +
                    '<div ng-if="(row.entity.resultType==\'Cancel\' && row.entity.execResult==\'\')" class="ui-grid-cell-contents">' + TS.ts('common.cancel') + '</div>' +
                    '<div ng-if="(row.entity.resultType==\'Error\' && row.entity.execResult!=\'\')" class="ui-grid-cell-contents" title=" {{\'common.fail\'|translate}}: {{row.entity.execResult}}</div>">' + TS.ts('common.fail') + ': {{row.entity.execResult}}</div>' +
                    '<div ng-if="(row.entity.resultType==\'Error\' && row.entity.execResult==\'\')" class="ui-grid-cell-contents">' + TS.ts('common.fail') + '</div>'
            }
        ];
        $scope.showDetail = function (log, e) {
            showLogDetail(log.execResult, e);
        }
        $scope.hideDetail = function (log, e) {
            hideLogDetail(log, e);
        }

        /*
         * 数据绑定
         */
        $scope.runStatus = {
            status: '0/0'
        };
        // 获取firmware upgrade信息
        $scope.$watch('fwInfo.networkId', function () {
            refreshFWResult();
        })
        // 获取firmware upgrade结果
        var refreshFWResult = function () {
            BatchConfigService.getFWUpgradeResult($scope.fwInfo.networkId, function (result) {
                if (result.success) {
                    $scope.runStatus = result.data;
                    $scope.firmwareResultOption.data = $scope.runStatus.result;
                }
                $timeout(function () {
                    setGridHeight('fwResultInfo', true, 300);
                }, 100);
            });
        };
        $scope.$on('refreshFWResult', refreshFWResult);
        if ($scope.fwInfo) {
            $scope.firmwareOptions.data = $scope.fwInfo.fwList;
            $timeout(function () {
                setGridHeight('firmwareGrid', true, 300);
            }, 100);
        }
        // refreshFWResult();

        $scope.$watch('uploadingCount', function () {
            if ($scope.uploadingCount == 0) {
                $scope.$broadcast("fwUploadSchedule", null, false);
            } else {
                $scope.$broadcast("fwUploadSchedule", null, true);
            }
        });
        /*
         * 页面操作
         */
        // 上传版本文件
        $scope.uploadFWFile = function (fileInfo, event, e) {
            // Todo 验证数据
            // if (fileInfo.file) console.log(fileInfo.file.type);
            $scope.fwfile.isError = false;
            var params = {
                url: base_url + '/batchConfig/upLoadFwFile',
                data: {}
            };
            if (!fileInfo.file) return;
            $scope.uploadingCount += 1;
            params.data.file = fileInfo.file;
            params.data.moduleType = fileInfo.moduleType;
            params.data.modelOID = fileInfo.modelOID;
            params.data.hwVersion = fileInfo.hwVersion;
            params.data.seriesName = fileInfo.seriesName;
            params.data.orgId = Current.org().orgId;
            params.data.networkId = $scope.fwInfo.networkId;
            var fileName = fileInfo.active.fileName;
            var fwVersion = fileInfo.active.fwVersion;
            //显示正在上传按钮---llh
            document.getElementById(fileInfo.$$hashKey).style.display = "block";
            //上传的时候要把之前上传的固件文件和型号清空
            //变量为$scope.fwInfo.fwList里面active的要删掉
            fileInfo.active.fileName = "";
            fileInfo.active.fwVersion = "";
            Upload.upload(params).then(function (result) {
                document.getElementById(fileInfo.$$hashKey).style.display = "none";
                $scope.uploadingCount -= 1;
                ajaxService.updateToken(result.headers);
                if (result.status == 200) {
                    if (result.data.success) {
                        // 修改表格数据
                        $scope.fwfile.isError = false;
                        var data = result.data.data;
                        fileInfo.model = fileInfo.file;
                        fileInfo.hwVersion = data.hwVersion;
                        fileInfo.seriesName = data.seriesName;
                        fileInfo.active = data.active;
                        fileInfo.backup = data.backup;
                        $scope.$emit('refreshFWTree');
                        $scope.$broadcast("fwUploadSchedule", true, null);

                    } else {
                        $scope.fwfile.isError = true;
                        //清空的放回来
                        fileInfo.active.fileName = fileName;
                        fileInfo.active.fwVersion = fwVersion;
                        if (result.data.error == 2) {
                            $scope.fwfile.msgFalse = "firmware.msgFalse1";
                        }
                        else if (result.data.error == -2) {
                            $scope.fwfile.msgFalse = "firmware.msgFalse2";
                        }
                        else {
                            $scope.fwfile.msgFalse = "syslog.serverity.Error";
                        }
                    }
                }
            }, function () {
            }, function () {
            });

        };
        $scope.fwfile = {
            isError: false,
            msgFalse: ''
        }
        // 保存数据
        $scope.state = {
            isSuccess: false,
            isError: false,
            processing: false,
            msgTrue: 'firmware.msgTrue',
            msgFalse: 'Error'
        };
        $scope.$on("scheduleSave", function (e, d) {
            BatchConfigService.getFwUploadStatus(function (result) {
                if (result.data == 1) {
                    $scope.state.processing = false;
                    $scope.state.isSuccess = false;
                    $scope.state.isError = true;
                    $scope.state.msgFalse = 'firmware.msgFalse2';
                    return;
                }
                $scope.state.processing = true;
                $scope.state.isSuccess = false;
                $scope.state.isError = false;
                var parameter = {};
                if ($scope.fwInfo._id) parameter._id = $scope.fwInfo._id;
                parameter.networkId = $scope.fwInfo.networkId;
                // parameter.targetIds = $scope.fwInfo.targetIds;
                parameter.fwList = [];
                parameter.schedule = angular.copy(d);
                if (parameter.schedule.cyclicalType == 'Immediate') {
                    delete parameter.schedule.executeTime;
                    delete parameter.schedule.scheduleStart;
                }
                $scope.firmwareOptions.data.forEach(function (fw) {
                    if (fw.active.urlFw) {
                        // 删除用于页面的字段
                        delete fw.model;
                        delete fw.file;
                        // 删除不需要的字段,后台需要这两个字段 modify b lizhimin 2017/12/20
                        // delete fw.hwVersion;
                        //delete fw.moduleType;
                        parameter.fwList.push(fw);
                    }

                });

                BatchConfigService.saveFWUpgradeInfo(parameter, function (result) {
                    $scope.state.processing = false;
                    if (result.success) {
                        $scope.state.isSuccess = true;
                        $scope.state.msgTrue = 'firmware.msgTrue';
                        $scope.$emit('refreshFWTree');
                        refreshFWResult();
                    } else {
                        $scope.state.isError = true;
                    }
                });
            });
        });
        $scope.$on('scheduleClear', function (e, d) {
            $scope.state.processing = true;
            $scope.state.isSuccess = false;
            $scope.state.isError = false;
            BatchConfigService.clearFWSchedule($scope.fwInfo.networkId, function (result) {
                // $emit 事件  更新左侧列表数据
                $scope.state.processing = false;
                if (result.success) {
                    $scope.state.isSuccess = true;
                    $scope.state.msgTrue = 'firmware.clearOK';
                    $scope.$emit('refreshFWTree');
                    refreshFWResult();
                } else {
                    $scope.state.isError = true;
                    $scope.state.msgFalse = result.error;
                }
                ;
            });
        })
    });
    app.register.directive('siteFirmware', function () {
        return {
            restrict: 'AE',
            scope: {
                fwInfo: '='
            },
            templateUrl: "./views/configuration/site-Firmware.html",
            controller: 'siteFirmwareController'
        };
    });

})