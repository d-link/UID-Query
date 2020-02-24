/**
 * Created by lizhimin on 2017/4/26.
 */
define(['directiveModule'], function (directives) {
    directives.controller('deviceSelectController', function ($rootScope, $http, $scope, Current, InventoryService) {
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
        $scope.$watch('selTag.selected', function (value) {
            if ($scope.selTag.selected._id == 0) {
                $scope.showAll();
            } else {
                $scope.showByTag();
            }

        });

        $scope.gridOptions = {
            enableRowSelection: true,
            enableSelectAll: true,
            selectionRowHeaderWidth: '10%',
            multiSelect: true,
            columnDefs: [
                {name: 'sysName', displayName: 'System Name', width: "30%"},
                {name: 'ip', displayName: 'IP', width: "30%"},
                {name: 'moduleType', displayName: 'Model Name', width: "30%"}]
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
                $scope.selectedObj.selectedIds = [];
                $scope.selectedObj.selectedNodes = $scope.selectedGridApi.selection.getSelectedRows();
                $scope.selectedObj.selectedNodes.forEach(function (node) {
                    $scope.selectedObj.selectedIds.push(node._id);
                });
                $scope.selectedOptions.data = $scope.selectedObj.selectedNodes;
                $rootScope.$emit('scopeChanged', $scope.selectedObj);
            });
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                if (!row.isSelected) {
                    $scope.gridApi.selection.unSelectRow(row.entity);
                }
                $scope.selectedObj.selectedIds = [];
                $scope.selectedObj.selectedNodes = $scope.selectedGridApi.selection.getSelectedRows();
                $scope.selectedObj.selectedNodes.forEach(function (node) {
                    $scope.selectedObj.selectedIds.push(node._id);
                });
                $rootScope.$emit('scopeChanged', $scope.selectedObj);
            });
        };
        //显示全部
        $scope.showAll = function () {
            $scope._showAll = true;
            // $scope.selTag = {selected: {name: All, _id: 0}};
            $scope.gridOptions.data = $scope.deviceAll;
        };
        //按选中的TAG过滤
        $scope.showByTag = function () {
            // $scope.selTag.selected = tag;
            $scope._showAll = false;
            $scope.gridOptions.data = $scope.deviceAll.filter(function (value) {
                if (value.tags) {
                    for (var i = 0; i < value.tags.length; i++) {
                        if (value.tags[i] == $scope.selTag.selected._id ) {
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
                $scope.selectedObj.selectedIds = [];
                $scope.selectedObj.selectedNodes = $scope.gridApi.selection.getSelectedRows();
                $scope.selectedObj.selectedNodes.forEach(function (node) {
                    $scope.selectedObj.selectedIds.push(node._id);
                });
                $scope.selectedOptions.data = $scope.selectedObj.selectedNodes;
                $rootScope.$emit('scopeChanged', $scope.selectedObj);
            });
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                $scope.selectedObj.selectedIds = [];
                $scope.selectedObj.selectedNodes = $scope.gridApi.selection.getSelectedRows();
                $scope.selectedObj.selectedNodes.forEach(function (node) {
                    $scope.selectedObj.selectedIds.push(node._id);
                });
                $scope.selectedObj.selectedNodes = $scope.gridApi.selection.getSelectedRows();
                $scope.selectedOptions.data = $scope.selectedObj.selectedNodes;
                $rootScope.$emit('scopeChanged', $scope.selectedObj);
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
    directives.directive('portDetail', function () {
        return {
            scope: {
                selectedObj: '='
            },
            restrict: 'AE',
            controller: 'portDetailController',
            templateUrl: './scripts/directives/portDetail.html'

        };
    });
})