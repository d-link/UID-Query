/**
 * Created by lizhimin on 2017/6/9.
 */
define(["app"], function (app) {
    app.register.controller('profileViewController', function ($scope, BatchConfigService, utils, TS, $timeout, $filter) {


        // status (new) profile view
        $scope.runStatus = {
            on: true,
            nextRunTime: new Date(),
            status: '0/0'
        };
        $scope.profileInfoOptions = {
            enableSorting: true,
            onRegisterApi: function (gridApi) {
                $scope.gridApi = gridApi;
            }
        };
        $scope.profileInfoOptions.columnDefs = [
            {
                name: 'logTime',
                displayName: TS.ts('column.runTime'),
                width: "18%",
                enableHiding: false,
                sort: {
                    direction: 'desc'
                },
                cellFilter: 'ISOTimeFilter'
            },
            {
                name: 'target.name',
                displayName: TS.ts('column.name'),
                width: "15%",
                enableHiding: false
            },
            {
                name: 'target.ip',
                displayName: TS.ts('column.ipv4'),
                width: "18%",
                enableHiding: false,
                suppressRemoveSort: true, sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                    var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                    return utils.sortByIP(nulls, a, b);

                }
            },
            {
                name: 'target.mac',
                displayName: TS.ts('column.mac'),
                width: "18%",
                enableHiding: false
            },
            {
                name: 'target.moduleType',
                displayName: TS.ts('column.moduleType'),
                width: "12%",
                enableHiding: false
            },
            {
                name: 'execResult',
                displayName: TS.ts('column.result'),
                width: "19%",
                enableHiding: false,
                cellTemplate: '<div  class="ui-grid-cell-contents"><span ng-mouseover=\'grid.appScope.showDetail(row.entity,$event)\' ng-mouseleave=\'grid.appScope.hideDetail(row.entity,$event)\'>{{row.entity|configResultFilter}}</span></div>'
            }
        ];
        $scope.showDetail = function (row, e) {

            var mes = $filter('configResultFilter')(row);
            showLogDetail(mes, e);
        }
        $scope.hideDetail = function (log, e) {
            hideLogDetail(log, e);
        }
        $scope.profileInfoOptions.data = [];
        var refreshProfileResult = function () {
            BatchConfigService.getProfileResult($scope.profileInfo._id, function (result) {
                if (result.success && result.data) {
                    var temp = result.data;
                    $scope.runStatus.status = temp.status;
                    $scope.profileInfoOptions.data = temp.result;
                }
                $timeout(function () {
                    setGridHeight('profileInfo', true, 200);
                }, 100);
            })
        }
        $scope.$watch('profileInfo._id', function () {
            refreshProfileResult();
        })
        $scope.$on('refreshProfileResult', function () {
            refreshProfileResult();
        });


        $scope.state = {
            isSuccess: false,
            isError: false,
            processing: false,
            msgTrue: 'configuration.saveOK',
            msgFalse: 'Error'
        };
        $scope.$on("scheduleSave", function (e, d) {
            $scope.state.processing = true;
            $scope.state.isSuccess = false;
            $scope.state.isError = false;
            BatchConfigService.saveSchedule($scope.profileInfo._id, d, function (result) {
                // $emit 事件  更新左侧列表数据
                $scope.state.processing = false;
                if (result.success) {
                    $scope.state.isSuccess = true;
                    $scope.state.msgTrue = 'configuration.saveOK';
                    $scope.$emit('refreshBCTree');
                    refreshProfileResult();
                } else {
                    $scope.state.isError = true;
                    $scope.state.msgFalse = result.error;
                }
                ;
            });
        });
        $scope.$on('scheduleClear', function (e, d) {
            $scope.state.processing = true;
            $scope.state.isSuccess = false;
            $scope.state.isError = false;
            BatchConfigService.clearSchedule($scope.profileInfo._id, function (result) {
                // $emit 事件  更新左侧列表数据
                $scope.state.processing = false;
                if (result.success) {
                    $scope.state.isSuccess = true;
                    $scope.state.msgTrue = 'configuration.clearOK';
                    $scope.$emit('refreshBCTree');
                    refreshProfileResult();
                } else {
                    $scope.state.isError = true;
                    $scope.state.msgFalse = result.error;
                }
                ;
            });
        })

    });
    app.register.directive('profileView', function () {
        return {
            restrict: 'AE',
            scope: {
                profileInfo: '='
            },
            templateUrl: "./views/configuration/profileView.html",
            controller: 'profileViewController'
        };
    });
})