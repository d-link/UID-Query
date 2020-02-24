/**
 * Created by lizhimin on 10/25/16.
 */
define(['directiveModule', 'angular-ui-grid'], function (directives) {
    directives.controller('interfaceSelectController', function ($rootScope, $http, $scope, Current, InventoryService) {
        $scope.tags = [];
        $scope.selTag = {selected: {name: 'All', _id: '0'}};
        $scope.deviceAll = [];
        $scope._showAll = true;
        InventoryService.getTagList(function (result) {
            $scope.tags = result.data;
            $scope.tags.push({name: 'All', _id: '0'});
        });
        $scope.show = {
            tab1: false
        };
        $scope.changeTabShow = function () {
            $scope.show.tab1 = false;
        };
        $scope.showGrid = function () {
            $scope.show.tab1 = true;
            $scope.selectedOptions.data = $scope.gridApi.selection.getSelectedRows();
            if($scope.selectedOptions.data.length>0){
                if ($scope.selectedGridApi.selection.selectRow) {
                    $scope.selectedGridApi.selection.selectAllRows();
                }
            }
        };
        $scope.allModels = [];
        $scope.curModel = {selected: $scope.selectedWithport.curModule};
        $scope.$watch('curModel.selected', function (value) {
            $scope.selectedWithport.curModule = $scope.curModel.selected;
            $scope.gridOptions.data = $scope.deviceAll.filter(function (value) {
                if (value.moduleType == $scope.selectedWithport.curModule.moduleType) {
                    return true;
                }
                return false;
            });
            $rootScope.$emit('interfaceChanged', $scope.selectedWithport);
        });
        $scope.$watch('selTag.selected', function (value) {
            if ($scope.selTag.selected._id == 0) {
                $scope.showAll();
            } else {
                $scope.showByTag();
            }

        });
        $scope.$watch('funName', function (value) {
            $scope.funName = value;
            $scope.getModuleType($scope.funName);
        });
        $scope.getModuleType = function (funName) {
            InventoryService.getDeviceModules(funName,function (result) {
                $scope.allModels = result.data;
                if ($scope.curModel.selected == '' && $scope.allModels.length > 0) {
                    $scope.curModel = {selected: $scope.allModels[0]};
                }
            });

        };
        $scope.selectedWithport.selectPort = [];
        $scope.selectPortFun = function(dev,index,unRepeat){
            if(unRepeat){
                $scope.selectedWithport.selectPort.push({devId: dev,ifIndex: index})
            }else{
                for (var i = 0; i < $scope.selectedWithport.selectPort.length; i++) {
                    if($scope.selectedWithport.selectPort[i].devId==dev && $scope.selectedWithport.selectPort[i].ifIndex==index){
                        $scope.selectedWithport.selectPort.splice(i,1);
                    }
                }
            }
        }
        $scope.gridOptions = {
            enableRowSelection: true,
            enableSelectAll: true,
            selectionRowHeaderWidth: '10%',
            multiSelect: true,
            columnDefs: [
                {name: 'sysName', displayName: 'System Name', width: "30%"},
                {name: 'ip', displayName: 'IP', width: "20%"},
                {name: 'moduleType', displayName: 'Model Name', width: "20%"},
                // {name: 'portInfo',displayName:'Port NUmber',width:"10%"},
                {name: 'portInfo',displayName: 'Action', width: "20%",cellClass: 'overflowIn',
                cellTemplate:'<div class="trigger-test" style="position:relative;width:100%;height:100%;" ng-click="fun()"><a style="width:16px;height:16px;padding:4px;"><md-icon md-svg-icon="user:edit"></md-icon></a><div style="display:none;position:absolute;width:300px;height:100px;bottom:40px;right:0px;background-color:#fff;overflow:auto;z-index:9999;"><ul><li ng-repeat="port in grid.getCellValue(row, col).ifTable"><label class="checkLabel"><p><md-icon md-svg-icon="modal:checkbox" ng-show="portCheck"></md-icon></p><input type="checkbox" ng-model="portCheck" ng-change="grid.appScope.selectPortFun(row.entity._id,port.ifIndex,this.portCheck)">{{port.ifName}}</label></li></ul></div></div>'
                }
            ]
        };
        $scope.selectedOptions = {};
        angular.extend($scope.selectedOptions, $scope.gridOptions);
        //selected列表选中切换事件
        $scope.selectedOptions.onRegisterApi = function (gridApi) {
            $scope.selectedGridApi = gridApi;
            gridApi.selection.on.rowSelectionChangedBatch($scope, function (rows) {
                rows.forEach(function (row) {
                    if (row.isSelected) {
                        $scope.gridApi.selection.selectRow(row.entity);
                    }
                    else {
                        $scope.gridApi.selection.unSelectRow(row.entity);
                    }
                });
                $scope.selectedWithport.selectedIds = [];
                $scope.selectedWithport.selectedNodes = $scope.selectedGridApi.selection.getSelectedRows();
                $scope.selectedWithport.selectedNodes.forEach(function (node) {
                    $scope.selectedWithport.selectedIds.push(node._id);
                });
                $scope.selectedOptions.data = $scope.selectedWithport.selectedNodes;
                $rootScope.$emit('interfaceChanged', $scope.selectedWithport);
            });
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                if (!row.isSelected) {
                    $scope.gridApi.selection.unSelectRow(row.entity);
                }
                $scope.selectedWithport.selectedIds = [];
                $scope.selectedWithport.selectedNodes = $scope.selectedGridApi.selection.getSelectedRows();
                $scope.selectedWithport.selectedNodes.forEach(function (node) {
                    $scope.selectedWithport.selectedIds.push(node._id);
                });
                $rootScope.$emit('interfaceChanged', $scope.selectedWithport);
            });
        };
        //显示全部
        $scope.showAll = function () {
            $scope._showAll = true;
            // $scope.selTag = {selected: {name: All, _id: 0}};
            $scope.gridOptions.data = $scope.deviceAll.filter(function (value) {
                if (value.moduleType == $scope.selectedWithport.curModule.moduleType) {
                    return true;
                }
                return false;
            });
        };
        //按选中的TAG过滤
        $scope.showByTag = function () {
            // $scope.selTag.selected = tag;
            $scope._showAll = false;
            $scope.gridOptions.data = $scope.deviceAll.filter(function (value) {
                if (value.tags) {
                    for (var i = 0; i < value.tags.length; i++) {
                        if (value.tags[i] == $scope.selTag.selected._id && value.moduleType == $scope.selectedWithport.curModule.moduleType) {
                            return true;
                        }
                    }
                }
                return false;
            });
        };
        //All 列表选中切换事件
        $scope.gridOptions.onRegisterApi = function (gridApi) {
            $scope.gridApi = gridApi;
            gridApi.selection.on.rowSelectionChangedBatch($scope, function (rows) {
                $scope.selectedWithport.selectedIds = [];
                $scope.selectedWithport.selectedNodes = $scope.gridApi.selection.getSelectedRows();
                $scope.selectedWithport.selectedNodes.forEach(function (node) {
                    $scope.selectedWithport.selectedIds.push(node._id);
                });
                $scope.selectedOptions.data = $scope.selectedWithport.selectedNodes;
                $rootScope.$emit('interfaceChanged', $scope.selectedWithport);
            });
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                $scope.selectedWithport.selectedIds = [];
                $scope.selectedWithport.selectedNodes = $scope.gridApi.selection.getSelectedRows();
                $scope.selectedWithport.selectedNodes.forEach(function (node) {
                    $scope.selectedWithport.selectedIds.push(node._id);
                });
                $scope.selectedWithport.selectedNodes = $scope.gridApi.selection.getSelectedRows();
                $scope.selectedOptions.data = $scope.selectedWithport.selectedNodes;
                $rootScope.$emit('interfaceChanged', $scope.selectedWithport);
                if (!row.isSelected) {
                    var copy = [];
                    console.log(row.entity._id);
                    for (var i = 0; i < $scope.selectedWithport.selectPort.length; i++) {
                        if($scope.selectedWithport.selectPort[i].devId==row.entity._id){
                            console.log(row.entity._id)
                            $scope.selectedWithport.selectPort.splice(i,1);
                            i--;
                        }
                    }
                }
            });
        };
        InventoryService.listManagedDevices(function (result) {
            $scope.deviceAll = result.data;
            if (!$scope._showAll) {
                $scope.showByTag();
            } else {
                $scope.showAll();
            }
        });
    });
    directives.directive('interfaceSelect', function () {
        return {
            scope: {
                selectedWithport: '=',
                funName: '='
            },
            restrict: 'AE',
            controller: 'interfaceSelectController',
            templateUrl: './scripts/directives/interfaceMultiSelect.html'

        };
    });
});