/**
 * Created by lizhimin on 2016/4/6.
 */
define(["app", "globalGridOptions"], function (app) {

    app.register.controller('deviceManageController', function ($scope, $state, $uibModal, $timeout, $http, Current, OrganizationService, NetworkService, InventoryService, DashboardService, TS, utils, $interval) {
        /*
         * 获控制内容区域高度
         */
        setHeight(); //test
        setHeight('data-show-menu-main', [], -40);
        $timeout(function () {
            setGridHeight('newGrid', true);
        }, 100);
        $scope.timer = null;
        window.onresize = function () {
            setHeight();
            setHeight('data-show-menu-main', [], -40);
            $timeout.cancel($scope.timer);
            $scope.timer = $timeout(function () {
                if ($scope.show.tab1) {
                    setGridHeight('manageGrid', true);
                } else if ($scope.show.tab2) {
                    setGridHeight('ignoredGrid', true);
                }
            }, 300);
        };
        $scope.hasPrivilege = Current.user().role == "root admin" || Current.user().role == "local admin";
        // burster testlocal
        // var newBurster = new bursterInit(100, [5, 10, 15]);
        // var managedBurster = new bursterInit(200, [5, 10, 15]);
        // var ignoredBurster = new bursterInit(300, [5, 10, 15]);
        // $scope.burster = newBurster;

        // $state.go('user.org.subdetail.sub', {pageId: 'newarrival'});
        var global = require("globalGridOptions");
        $scope.networks = [];
        $scope.listData = [];
        //记录已经的设备，刷新时要保留选项
        $scope.managedSelected = []; //选中的纳管设备
        $scope.IgnoredSelected = []; //选中的忽略设备
        $scope.managedData=[];
        $scope.ingnoreData=[];

        /*
         * unmanage tab页 下拉按钮菜单选项(所有项)
         */
        var dropdownItems = [
            {_id: 'current', name: TS.ts('deviceManage.currentNet')}
        ];
      $scope.nodeEnv=false;
        /*
         * 获取network列表
         */
        function getNetworks() {
            OrganizationService.getNodeEnv(function (result) {
                if (result.success) {
                    Current.setNodeEnv(result.data);
                    if (Current.getNodeEnv() == "Production_hualian") {
                        $scope.manageOptions.columnDefs.splice(0, 0, {
                            field: 'index',
                            enableHiding: false,
                            minWidth: "60",
                            maxWidth: "60",
                            enableColumnMenu: false,
                            enableSorting: false,
                            displayName: TS.ts('column.no')
                        });
                        $scope.ignoredOptions.columnDefs.splice(0, 0, {
                            field: 'index',
                            enableHiding: false,
                            minWidth: "60",
                            maxWidth: "60",
                            enableColumnMenu: false,
                            enableSorting: false,
                            displayName: TS.ts('column.no')
                        });
                    }
                    $scope.nodeEnv = result.data == "Production_hualian";
                }

                NetworkService.listShortNetworks(function (result) {
                    if (result.success) {
                        $scope.listData = result.data;
                        $scope.curNetwork = null;
                        for (var i = 0; i < $scope.listData.length; i++) {
                            for (var j = 0; j < $scope.listData[i].networks.length; j++) {
                                dropdownItems.push($scope.listData[i].networks[j])
                                if ($scope.listData[i].networks[j].devCount != 0 && !$scope.curNetwork) {
                                    $scope.toggleSite($scope.listData[i]);
                                    $scope.changeNetwork($scope.listData[i].networks[j])
                                }
                            }
                            ;
                        }
                        ;
                        // showManagedDevice(1, $scope.manageOptions.paginationPageSize);
                        // showIgnoreDevice(1, $scope.ignoredOptions.paginationPageSize);
                        $scope.dropdownValue = {_id: 'reManaged', name: TS.ts('deviceManage.moveToManage')};
                        $scope.dropdownItems = _.without(dropdownItems, $scope.curNetwork); // 去掉当前network
                    }
                })
            });

        };
        getNetworks();

        /*
         * unmanage tab页 按钮事件(reManaged、加到其他network、delete)
         */
        $scope.applyItem = function (item) {

            if (item._id == 'reManaged' || item._id == 'current') {
                item = $scope.curNetwork;
            }
            ;
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/templates/dialogConfirm.html',
                windowClass: 'modal-del',
                resolve: {
                    item: function () {
                        return item;
                    },
                    selecteds: function () {
                        return $scope.IgnoredSelected;
                    }
                },
                size: "w500",
                controller: function ($scope, $uibModalInstance, item, selecteds) {
                    if (item == 'del') {
                        $scope.con = {
                            title: TS.ts('deviceManage.del'),
                            type: 'common:remove'
                        };
                        if (selecteds.length > 1) {
                            $scope.con.content = TS.ts('deviceManage.delMsg1');
                        } else {
                            $scope.con.content = TS.ts('deviceManage.delMsg');
                        }


                    } else {
                        $scope.con = {
                            title: TS.ts('deviceManage.moveToManage'),
                            type: 'common:network'
                        };
                        if (selecteds.length > 1) {
                            $scope.con.content = TS.ts('deviceManage.reManageMsg1') + " \'" + item.name + '\' ?';
                        } else {
                            $scope.con.content = TS.ts('deviceManage.reManageMsg') + " \'" + item.name + '\' ?';
                        }
                    }


                    $scope.ok = function () {
                        $uibModalInstance.close();
                    };

                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function () {
                // console.log(item)
                if (item == 'del') {
                    $scope.removeIgnoreDevice();
                } else {
                    $scope.moveToManage(item);
                }
            }, function () {

            });
        };

        /*
         * 左侧导航菜单事件
         */
        $scope.toggleSite = function (site) {
            $scope.siteActive = site;
        };
        // 改变选中network
        $scope.changeNetwork = function (network) {
            $scope.curNetwork = network;
            $scope.dropdownValue = {_id: 'reManaged', name: TS.ts('deviceManage.moveToManage')};
            $scope.dropdownItems = _.without(dropdownItems, $scope.curNetwork);
            if ($scope.gridApi && $scope.gridApi.selection) {
                $scope.gridApi.selection.clearSelectedRows();
            }
            if ($scope.ignoredGridApi && $scope.ignoredGridApi.selection) {
                $scope.ignoredGridApi.selection.clearSelectedRows();
            }
            showManagedDevice(1, $scope.manageOptions.paginationPageSize);
            showIgnoreDevice(1, $scope.ignoredOptions.paginationPageSize);
        };
        $scope.goToNetwork = function () {
            $state.go('user.org.subdetail', {moudleId: 'network', parentId: 'configuration'});
        };

        /*
         * Tab 切换,切换执行事件
         */
        $scope.show = {
            tab1: true,
            tab2: false
        };
        $scope.resetGridSize = function (gridId) {
            $scope.show.tab1 = false;
            $scope.show.tab2 = false;
            if (gridId == 'manageGrid') {
                $scope.show.tab1 = true;
                // $scope.burster = managedBurster;
                showManagedDevice(1, $scope.manageOptions.paginationPageSize);
                $timeout(function () {
                    setGridHeight('manageGrid', true);
                }, 100);
            } else {
                $scope.show.tab2 = true;
                // $scope.burster = ignoredBurster;
                showIgnoreDevice(1, $scope.ignoredOptions.paginationPageSize);
                $timeout(function () {
                    setGridHeight('ignoredGrid', true);
                }, 100);
            }

            setHeight(); //test

        };

        /*
         * 执行事件freshInventory
         */
        $scope.$on('freshInventory', function () {
            if ($scope.show.tab1) {
                showManagedDevice(1, $scope.manageOptions.paginationPageSize);
            } else {
                showIgnoreDevice(1, $scope.ignoredOptions.paginationPageSize);
            }
            ;
        });

        $scope.times = 4;
        /**
         * 刷新页面
         */
        $scope.refreshDevice = function () {
            showManagedDevice(1, $scope.manageOptions.paginationPageSize);
            showIgnoreDevice(1, $scope.ignoredOptions.paginationPageSize);
            $scope.times--;
            if ($scope.times > 0) {
                $timeout(function () {
                    $scope.refreshDevice();
                }, 1000 * 30);
            }
        };

        /*
         * 返回被选中的纳管设备
         */
        function getSelectedDevice() {
            var selectedDev = [];
            // var selects = $scope.gridApi.selection.getSelectedRows();
            var selects = $scope.selectNodes;
            for (var j = 0; j < selects.length; j++) {
                selectedDev.push(selects[j]._id);
            }
            return selectedDev;
        }

        /*
         * ui-grid表格配置信息 managed
         */
        $scope.isDisabled = true;
        $scope.manageOptions = {
            isLoading: false,
            enableGridMenu: true,
            paginationPageSizes: [20, 25, 50],
            paginationTemplate: './views/templates/gridBurster.html',
            paginationPageSize: 50,
            enableSorting: true,
            useExternalPagination: true,
        };

        // angular.extend($scope.manageOptions, global.InventoryGrid);
        $scope.manageOptions.columnDefs = [
            {
                id: 'status', field: 'status', displayName: TS.ts('column.status'), minWidth: "80",
                cellTemplate: '<a  ng-class="row.entity.status" title="{{\'common.\'+row.entity.status|translate}}"><md-icon md-svg-icon="status:online_status" ></md-icon></a>'
            },
            {
                field: 'ip', displayName: TS.ts('column.ip'), minWidth: "128", sort:{
                direction:'asc'
            },
                cellTemplate: '<div class="ui-grid-cell-contents"><a target="_blank" href="http://{{row.entity.ip}}" rel="noopener noreferrer">{{row.entity.ip}}</a></div>',
                sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                    var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                    return utils.sortByIP(nulls, a, b);

                }
            },
            {
                field: 'lanIP',
                displayName: TS.ts('column.lanIP'),
                minWidth: "128",
                cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.lanIP}}</div>'
            },
            {field: 'mac', displayName: TS.ts('column.mac'), minWidth: "120"},
            {field: 'moduleType', displayName: TS.ts('column.moduleType'), minWidth: "110"},
            {field: 'hardware', displayName: TS.ts('column.hardware'), minWidth: "110"},
            {field: 'firmware', displayName: TS.ts('column.firmware'), minWidth: "110"},
            {field: 'backupFW', displayName: TS.ts('column.backupfw'), minWidth: "150",visible: false},


            /*   {field: 'network', displayName: 'Network', width: "8%"},*/
            {
                field: 'manageTime',
                displayName: TS.ts('column.manageTime'),
                type: 'date',
                cellFilter: 'ISOTimeFilter',
                minWidth: "150"
            }
        ];
        /*
         * Todo
         * 获取用户使用信息，为表格设置visible属性
         */

        /*
         * ui-grid表格事件 managed
         */
        var paginationOptions = {
            sort: null
        };
        $scope.manageOptions.exporterAllDataFn = function () {
            return showManagedDevice(1, $scope.manageOptions.totalItems, paginationOptions.sort)
                .then(function () {
                    $scope.manageOptions.useExternalPagination = false;
                    $scope.manageOptions.useExternalSorting = false;
                    showManagedDevice = null;
                });
        };
        $scope.manageOptions.onRegisterApi = function (gridApi) {
            $scope.gridApi = gridApi;
            gridApi.selection.on.rowSelectionChangedBatch($scope, function (rows) {
                checkSelected();
            });
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                checkSelected();
            });
            $scope.gridApi.core.on.sortChanged($scope, function (grid, sortColumns) {
                if (showManagedDevice) {
                    if (sortColumns.length > 0) {
                        paginationOptions.sort = sortColumns[0].sort.direction;
                    } else {
                        paginationOptions.sort = null;
                    }
                    showManagedDevice(grid.options.paginationCurrentPage, grid.options.paginationPageSize, paginationOptions.sort)
                }
            });
            $scope.gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                if (showManagedDevice) {
                    if ($scope.gridApi && $scope.gridApi.selection) {
                        $scope.gridApi.selection.clearSelectedRows();
                    }

                    showManagedDevice(newPage, pageSize, paginationOptions.sort);
                }
            });
         /*   $timeout(function () {
                gridApi.core.removeFromGridMenu(gridApi.grid, 3);
            }, 5000);*/
        };
        /*
         * 获取表格选中信息
         */
        function checkSelected() {
            if ($scope.gridApi.selection) {
                $scope.managedSelected = $scope.gridApi.selection.getSelectedRows();
                if ($scope.managedSelected.length > 0) {
                    $scope.isDisabled = false;
                } else {
                    $scope.isDisabled = true;
                }
            }
        };
        /*
         * 获取managed表格数据
         */
        function showManagedDevice(curPage, pageSize, sort) {
            if (!$scope.curNetwork) return;
            $scope.manageOptions.isLoading = true;
            InventoryService.listManagedDevicesByNetwork($scope.curNetwork, function (result) {
                $scope.manageOptions.isLoading = false;
              //  $scope.manageOptions.data = result.data;
                $scope.manageOptions.totalItems = result.data.length;
                // $scope.gridApi.selection.
                var firstRow = (curPage - 1) * pageSize;
                var temp = result.data;
                $scope.manageOptions.data = temp.slice(firstRow, firstRow + pageSize);
                $scope.managedData= fwVersionTransInAPList(result.data);

               $timeout(function () {
                    $scope.managedSelected.forEach(function (entity) {
                        $scope.manageOptions.data.forEach(function (row) {
                            if (row._id == entity._id) {
                                $scope.gridApi.selection.selectRow(row);
                            }

                        })

                    });
                    randomGridSize('manageGrid');
                }, 100);
                /* var temp = result.data;
                 $scope.gridOptions.data = temp;*/
            })
        };

        function fwVersionTransInAPList(data) {
            for (var i = 0 ; i < data.length ; i++) {
                var location_r = data[i].firmware.indexOf('r');
                if( location_r!=-1){
                    var firmware=data[i].firmware.substring(0, location_r);
                    data[i].firmware = firmware;
                }
            }
            return data;
        }

        /*
         * 从纳管列表删除设备
         */
        $scope.RemoveDevice = function () {

            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/templates/dialogConfirm.html',
                windowClass: 'modal-del',
                resolve: {
                    selecteds: function () {
                        return $scope.managedSelected;
                    }
                },
                size: "w500",
                controller: function ($scope, $uibModalInstance, selecteds) {
                    $scope.con = {
                        title: TS.ts('deviceManage.removeToUnmanaged'),
                        type: 'common:remove'
                    };
                    if (selecteds.length > 1) {
                        $scope.con.content = TS.ts('deviceManage.unmanageTip1');
                    } else {
                        $scope.con.content = TS.ts('deviceManage.unmanageTip');
                    }


                    $scope.ok = function () {
                        $uibModalInstance.close();
                    };

                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function () {
                $scope.isDisabled = true;
                if ($scope.gridApi.selection) {
                    var selectNodes = $scope.gridApi.selection.getSelectedRows();
                    var selectNodeIds = [];
                    for (var i = 0; i < selectNodes.length; i++) {
                        selectNodeIds.push({devMac: selectNodes[i].mac, uuid: selectNodes[i].uuid});
                    }
                    InventoryService.deleteDevice(selectNodeIds, function (result) {
                        showManagedDevice(1, $scope.manageOptions.paginationPageSize);
                    });
                    $scope.times = 4;
                    $scope.refreshDevice();
                    $scope.gridApi.selection.clearSelectedRows();
                }
            }, function () {

            });

        };

        /*
         * ui-grid表格配置信息 unmanaged
         */
        $scope.ignored_isDisabled = true;
        $scope.ignoredOptions = {
            isLoading: false,
            enableGridMenu: true,
            paginationPageSizes: [20, 25, 50],
            paginationTemplate: './views/templates/gridBurster.html',
            paginationPageSize: 50,
            enableSorting: true,
            useExternalPagination: true
        };
        $scope.ignoredOptions.columnDefs = [
            {
                field: 'status', displayName: TS.ts('column.status'), minWidth: "60", maxWidth: "110",
                cellTemplate: '<a  ng-class="row.entity.status" title="{{\'common.\'+row.entity.status|translate}}"><md-icon md-svg-icon="status:online_status" ></md-icon></a>'
            },
            {
                field: 'ip', displayName: TS.ts('column.ip'), minWidth: "128", maxWidth: "128",sort:{
                direction:'asc'
            },
                cellTemplate: '<div class="ui-grid-cell-contents"><a target="_blank" href="http://{{row.entity.ip}}" rel="noopener noreferrer">{{row.entity.ip}}</a></div>',
                sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                    var nulls = $scope.ignoredGridApi.core.sortHandleNulls(a, b);
                    return utils.sortByIP(nulls, a, b);

                }
            },
            {
                field: 'lanIP',
                displayName: TS.ts('column.lanIP'),
                minWidth: "128",
                maxWidth: "128",
                cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.lanIP}}</div>'
            },
            {field: 'mac', displayName: TS.ts('column.mac'), minWidth: "120", maxWidth: "120"},
            {field: 'moduleType', displayName: TS.ts('column.moduleType'), minWidth: "110"},
            {field: 'hardware', displayName: TS.ts('column.hardware'), minWidth: "110"},
            {field: 'firmware', displayName: TS.ts('column.firmware'), minWidth: "110"},
            {field: 'backupFW', displayName: TS.ts('column.backupfw'),visible: false, minWidth: "150"},
            {
                field: 'manageTime',
                displayName: TS.ts('column.unmanageTime'),
                type: 'date',
                cellFilter: 'ISOTimeFilter',
                width: "160"
            }
        ];
        /*
         * ui-grid表格事件 unmanaged
         */
        $scope.ignoredOptions.onRegisterApi = function (gridApi) {
            $scope.ignoredGridApi = gridApi;
            gridApi.selection.on.rowSelectionChangedBatch($scope, function (rows) {
                checkIgnored();
            });
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                checkIgnored();
            });
            $scope.ignoredGridApi.core.on.sortChanged($scope, function (grid, sortColumns) {
                if (showNews) {//TODO 这个地方变量未定义，报错
                    if (sortColumns.length > 0) {
                        new_paginationOptions.sort = sortColumns[0].sort.direction;
                    } else {
                        new_paginationOptions.sort = null;
                    }
                    showIgnoreDevice(grid.options.paginationCurrentPage, grid.options.paginationPageSize, new_paginationOptions.sort)
                }
            });
            $scope.ignoredGridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                if (showManagedDevice) {
                    if ($scope.ignoredGridApi && $scope.ignoredGridApi.selection) {
                        $scope.ignoredGridApi.selection.clearSelectedRows();
                    }
                    showIgnoreDevice(newPage, pageSize, paginationOptions.sort);
                }
            });
        };
        /*
         * 获取表格选中信息
         */
        function checkIgnored() {
            if ($scope.ignoredGridApi.selection) {
                $scope.IgnoredSelected = $scope.ignoredGridApi.selection.getSelectedRows();
                if ($scope.IgnoredSelected.length > 0) {
                    $scope.ignored_isDisabled = false;
                } else {
                    $scope.ignored_isDisabled = true;
                }
            }
        };
        /*
         * 获取unmanaged表格数据
         */
        function showIgnoreDevice(curPage, pageSize, sort) {
            if (!$scope.curNetwork) return;
            $scope.ignoredOptions.isLoading = true;
            InventoryService.listIgnoreDevices($scope.curNetwork, function (result) {
                $scope.ignoredOptions.isLoading = false;
              //  $scope.ignoredOptions.data = result.data;
                $scope.ignoredOptions.totalItems = result.data.length;
                var firstRow = (curPage - 1) * pageSize;
                var temp = result.data;
                $scope.ingnoreData=fwVersionTransInAPList(result.data);
               // $scope.ignoredOptions.totalItems = temp.length;
                $scope.ignoredOptions.data = temp.slice(firstRow, firstRow + pageSize);
                $timeout(function () {
                    $scope.IgnoredSelected.forEach(function (entity) {
                        $scope.ignoredOptions.data.forEach(function (row) {
                            if (row._id == entity._id) {
                                $scope.ignoredGridApi.selection.selectRow(row);
                            }
                        })
                    });
                    randomGridSize('ignoredGrid');
                }, 100);
            })
        };
        /*
         * 从unmanaged列表删除设备
         */
        $scope.removeIgnoreDevice = function () {
            if ($scope.ignoredGridApi.selection) {
                var selectNodes = $scope.ignoredGridApi.selection.getSelectedRows();
                var selectNodeIds = [];
                for (var i = 0; i < selectNodes.length; i++) {
                    selectNodeIds.push(selectNodes[i].mac);
                }
                InventoryService.deleteIgnoreDevice($scope.curNetwork.agentUUID, selectNodeIds, function (result) {
                    if (result.success) {
                        showIgnoreDevice(1, $scope.ignoredOptions.paginationPageSize);
                    }

                });
                $scope.times = 2;
                $scope.refreshDevice();
                $scope.ignoredGridApi.selection.clearSelectedRows();
            }
        };
        /*
         * 重新纳管
         */
        $scope.moveToManage = function (network) {
            if ($scope.ignoredGridApi.selection) {
                var networkInfo = {
                    uuid: network.agentUUID,
                    networkId: network._id
                };
                var selectNodes = $scope.ignoredGridApi.selection.getSelectedRows();
                var selectNodeIds = [];
                for (var i = 0; i < selectNodes.length; i++) {
                    selectNodeIds.push({mac: selectNodes[i].mac});
                }
                selectNodeIds[0].uuid = selectNodes[0].uuid;
                InventoryService.checkInDevice(selectNodeIds, networkInfo, function (result) {
                    if (result.success) showIgnoreDevice(1, $scope.ignoredOptions.paginationPageSize);

                });
                $scope.times = 2;
                $scope.refreshDevice();
                $scope.ignoredGridApi.selection.clearSelectedRows();
            }
        };
        $scope.exportCSV=function(flag){
            $scope.exporting = true;
            var data= $scope.managedData;
            if(flag=='ignored'){
                data=$scope.ingnoreData;
            }
            InventoryService.exportCSV($scope.nodeEnv,flag,data,function(result,fileName){
                if('msSaveOrOpenBlob' in navigator) {
                    blob = new Blob([result], {type: "application/octet-stream"});
                    // Microsoft Edge and Microsoft Internet Explorer 10-11
                    window.navigator.msSaveOrOpenBlob(blob, fileName);
                }else{
                    var blob = new Blob(["\ufeff" + result], {type: 'text/csv'}); //解决大文件下载失败
                    var a = document.getElementById("exportCSVlink");
                    a.download = fileName;
                    a.href=URL.createObjectURL(blob);
                    a.click();
                }
                $scope.exporting = false;
            });
        }
    })
});