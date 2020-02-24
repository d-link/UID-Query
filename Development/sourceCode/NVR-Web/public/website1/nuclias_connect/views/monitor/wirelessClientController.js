/**
 * Created by guojiangchao on 2017/9/15.
 */
define(["app"], function (app) {
    app.register.controller('wirelessClientController', function ($rootScope, $scope, $timeout, $uibModal, Current, DashboardService, DeviceDetailService, CustomService, utils, TS, $filter) {
        /*
         * 获控制内容区域高度
         */
        setHeight();
        $timeout(function () {
            setGridHeight('connected_client', true);
        }, 100);
        $scope.timer = null;
        window.onresize = function () {
            setHeight('set-height');
            $timeout.cancel($scope.timer);
            $scope.timer = $timeout(function () {
                if ($scope.show.tab1) {
                    setGridHeight('connected_client', true);
                } else {
                    setGridHeight('blocked_client', true);
                }
            }, 300);
        };

        /*
         * Tab 切换,切换执行事件
         */
        $scope.show = {
            tab1: true,
            tab2: false
        };
        var userInfo = Current.user();
        $scope.power = {
            hasCreate: userInfo.role == 'root admin',
            hasEdit: function (client) {
                if (userInfo.role == 'root admin')return true;
                if (userInfo.role == 'local admin') {
                    if (userInfo.privilege.indexOf(client.apNetworkId) != -1)
                        return true;
                }
                return false;
            }
        }
        $scope.resetGridSize = function (gridId) {
            $scope.show.tab1 = false;
            $scope.show.tab2 = false;
            if (gridId == 'connected_client') {
                $scope.show.tab1 = true;
                $timeout(function () {
                    setGridHeight('connected_client', true);
                }, 100);
            } else {
                $scope.show.tab2 = true;
                $timeout(function () {
                    setGridHeight('blocked_client', true);
                }, 100);
            }

        };

        /*
         * 搜索条件下拉选框数据
         */
        $scope.searchTypes = ['clientMACAddr', 'ipv4Addr'];
        $scope.clients = [{index: 0, name: 'All'}, {index: 1, name: 'CaptivePortal'}];
        $scope.optionSites = [];
        $scope.select = {};
        $scope.select1 = {};
        $scope.select.client = $scope.clients[0];
        $scope.searchData = {
            type: 'clientMACAddr',
            value: ''
        };
        // 是否获取表格数据
        $scope.needGetInfo = true;
        // 获取site、network下拉框数据
        DashboardService.getSiteAndNetwork(function (result) {
            if (result.success) {
                $scope.optionSites = result.data;
                // 添加 all network
                var allNetwork = [{name: 'common.allNetwork', _id: 'ALL', agentUUID: 'ALL'}];
                for (var i = 0; i < $scope.optionSites.length; i++) {
                    allNetwork = allNetwork.concat($scope.optionSites[i].networks);
                    $scope.optionSites[i].networks.unshift({name: 'common.allNetwork', _id: 'ALL', agentUUID: 'ALL'});
                }
                ;
                $scope.optionSites.unshift({_id: 'ALL', siteName: 'common.allSite', networks: allNetwork});
                // select 赋值
                $scope.select.site = $scope.optionSites[0];
                $scope.select.network = $scope.select.site.networks[0];

                $scope.select1.site = $scope.optionSites[0];
                $scope.select1.network = $scope.select1.site.networks[0];
                // test code
                /*
                 * 获取并设置用户使用记录
                 *
                 */
                CustomService.getPageAction(function (result) {
                    if (result.success) {
                        var data = result.data;
                        $rootScope.customAction = data;
                        if (data) {
                            // 根据用户习惯隐藏列表列，初始化select选择
                            for (var i = 0; i < $scope.optionSites.length; i++) {
                                if ($scope.optionSites[i]._id == data.site) {
                                    for (var j = 0; j < $scope.optionSites[i].networks.length; j++) {
                                        if ($scope.optionSites[i].networks[j].agentUUID == data.network) {
                                            $scope.select.site = $scope.optionSites[i];
                                            $scope.select.network = $scope.optionSites[i].networks[j];
                                            $scope.select1.site = $scope.optionSites[i];
                                            $scope.select1.network = $scope.optionSites[i].networks[j];
                                        }
                                    }
                                }
                            }
                        }
                        var curPage = $scope.connectedClientOptions.paginationCurrentPage?$scope.connectedClientOptions.paginationCurrentPage:1;
                        var pageSize = $scope.connectedClientOptions.paginationPageSize;
                        getClientInfos(curPage, pageSize);
                        var curPage1=$scope.blockedClientOptions.paginationCurrentPage?$scope.blockedClientOptions.paginationCurrentPage:1;
                        getBlockedClient(curPage1,$scope.blockedClientOptions.paginationPageSize);
                        if (data && data.gridVisible) {
                            if (data.gridVisible.connectedClientOptions) {
                                for (var i = 0; i < $scope.connectedClientOptions.columnDefs.length; i++) {
                                    if (data.gridVisible.connectedClientOptions.indexOf($scope.connectedClientOptions.columnDefs[i].field) == -1) {
                                        $scope.connectedClientOptions.columnDefs[i].visible = false;
                                    } else {
                                        $scope.connectedClientOptions.columnDefs[i].visible = true;
                                    }
                                }
                            }

                        }

                    }

                });
            }
        });
        $scope.$on('refreshWirelessClient', function () {
            $scope.needGetInfo = true;
            var curPage = $scope.connectedClientOptions.paginationCurrentPage;
            var pageSize = $scope.connectedClientOptions.paginationPageSize;
            getClientInfos(curPage, pageSize);
            getBlockedClient($scope.blockedClientOptions.paginationCurrentPage,$scope.blockedClientOptions.paginationPageSize);
        });
        /*
         * 选择site时，设置network选择第一项
         */
        $scope.changeSite = function () {
            $scope.select.network = $scope.select.site.networks[0];
            $scope.needGetInfo = true;
        };
        $scope.changeNetwork = function () {
            $scope.needGetInfo = true;
        };
        $scope.changeAuth = function () {
            $scope.needGetInfo = true;
        }
        $scope.search = function (isSave) {
            var curPage = 1;
            var pageSize = $scope.connectedClientOptions.paginationPageSize;
            if(isSave){
                //存储用户习惯
                if (!$rootScope.customAction) {
                    $rootScope.customAction = {};
                }
                $rootScope.customAction.site = $scope.select.site ? $scope.select.site._id : 'ALL';
                $rootScope.customAction.network = $scope.select.network.agentUUID ? $scope.select.network.agentUUID : 'ALL';
            }
            getClientInfos(curPage, pageSize);
        };
        $scope.search1 = function (isSave) {
            if(isSave){
                //存储用户习惯
                if (!$rootScope.customAction) {
                    $rootScope.customAction = {};
                }
                $rootScope.customAction.site = $scope.select1.site ? $scope.select1.site._id : 'ALL';
                $rootScope.customAction.network = $scope.select1.network.agentUUID;
            }
            getBlockedClient(1,$scope.blockedClientOptions.paginationPageSize);
        }

        /*
         * 获取表格数据
         */
        var getClientInfos = function (curPage, pageSize) {
            $scope.connectedClientOptions.isLoading = true;

            var rule = {
                siteId: $scope.select.site ? $scope.select.site._id : 'ALL',
                networkId: $scope.select.network ? $scope.select.network._id : 'ALL',
                authType: $scope.select.client ? $scope.select.client.index : 0
            };

            if ($scope.searchData.value && $scope.searchData.value != "") {
                rule[$scope.searchData.type] = $scope.searchData.value;
            }
            DashboardService.getClientInfos(rule, {start: curPage - 1, count: pageSize}, function (result) {
                $scope.connectedClientOptions.isLoading = false;
                if (result.success) {
                    $scope.needGetInfo = false;
                    $scope.connectedClientOptions.totalItems = result.total;
                    $scope.connectedClientOptions.data = result.data;
                    $scope.gridCopyData = angular.copy($scope.connectedClientOptions.data);
                    $scope.total = result.total;
                    filterData();
                }
            });
        };
        /*
         * 获取表格数据
         */
        var getBlockedClient = function (curPage, pageSize) {
            $scope.blockedClientOptions.isLoading = true;

            var rule = {
                siteId: $scope.select1.site ? $scope.select1.site._id : 'ALL',
                networkId: $scope.select1.network ? $scope.select1.network._id : 'ALL'
            };
            DashboardService.getBlockedClient(rule, function (result) {
                $scope.blockedClientOptions.isLoading = false;
                //  $scope.ignoredOptions.data = result.data;
                $scope.blockedClientOptions.totalItems = result.data.length;
                var firstRow = ((curPage || 1) - 1) * pageSize;
                var temp = result.data;
                //$scope.blockedClient=result.data;
                // $scope.ignoredOptions.totalItems = temp.length;
                $scope.blockedClientOptions.data = temp.slice(firstRow, firstRow + pageSize);
                $scope.totalblocked = result.data.length;
            });
        }
        /*
         * ui-grid表格配置信息
         */
        $scope.connectedClientOptions = {
            isLoading: true,
            enableGridMenu: true,
            paginationPageSizes: [20, 25, 50],
            excessRows: 100,
            paginationTemplate: './views/templates/gridBurster.html',
            paginationPageSize: 20,
            enableSorting: true,
            useExternalPagination: true,
            columnDefs: [
                {
                    field: 'index',
                    enableHiding: false,
                    enableSorting: false, 
                    enableColumnMenu:false,
                    type: "number",
                    width: "50",
                    displayName: TS.ts('column.no'),
                    cellTemplate: '<div class="ui-grid-cell-contents item_number">{{rowRenderIndex + 1}}</div >'
                },
                {
                    field: 'action',
                    enableSorting: false,
                    enableHiding: false,
                    width: "60",
                    enableColumnMenu:false,
                    displayName: TS.ts('column.action'),
                    cellTemplate: '<div class="ui-grid-cell-contents">' +
                    '<button class="btn-grid wa" type="button" ng-if="grid.appScope.power.hasEdit(row.entity)" ng-click="grid.appScope.blockClient(row.entity)" title="{{\'wireless.blockTitle\'|translate}}"><md-icon md-svg-icon="modal:block"></md-icon></button></div>'
                },
                {field: 'network', minWidth: "150", displayName: TS.ts('column.network')},
                {
                    field: 'ipv4Addr', minWidth: "115", displayName: TS.ts('column.ipv4'),
                    sort:{
                        direction:'asc'
                    },
                    sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                        var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                        return utils.sortByIP(nulls, a, b);

                    }
                },
                {field: 'ipv6Addr', visible: false, minWidth: "120", displayName: TS.ts('column.ipv6')},
                {field: 'clientMACAddr', minWidth: "120", displayName: TS.ts('column.mac')},
                {
                    field: 'authType', minWidth: "105", displayName: TS.ts('column.authType'),
                    cellTemplate: '<div class="ui-grid-cell-contents">{{\'configuration.ssid.authType\' + row.entity.authType | translate}}</div>',
                    sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                        var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                        return utils.sortAuthType(nulls, a, b);

                    }
                },
                {field: 'clientOS', visible: false, minWidth: "75", displayName: TS.ts('column.os')},
                {
                    field: 'staToApRxDataBytes',
                    type: "number",
                    visible: false,
                    minWidth: "80",
                    displayName: TS.ts('column.upload'),
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.staToApRxDataBytes|bytesFilter}}</div>'
                },
                {
                    field: 'apToStaTxDataBytes',
                    type: "number",
                    visible: false,
                    minWidth: "95",
                    displayName: TS.ts('column.download'),
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.apToStaTxDataBytes|bytesFilter}}</div>'
                },
                {field: 'channel', type: "number", minWidth: "85", displayName: TS.ts('column.channel')},
                {
                    field: 'clientRssi',  type: "number", minWidth: "100", displayName: TS.ts('column.rssi')
                },
                {field: 'clientSnr', type: "number", visible: false, minWidth: "100", displayName: TS.ts('column.snr')},
                {field: 'band', minWidth: "70", displayName: TS.ts('column.band'), cellFilter: 'bandFilter'},
                {field: 'ssid', minWidth: "70", displayName: TS.ts('column.ssid')},
                {field: 'apMACAddr', minWidth: "135", displayName: TS.ts('column.apMAC')},
                {
                    field: 'totalUsage',
                    type: "number",
                    visible: false,
                    minWidth: "125",
                    displayName: TS.ts('column.totalUsage'),
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.totalUsage|bytesFilter}}</div>'
                },
                {
                    field: 'usagePercent',
                    type: "number",
                    visible: false,
                    minWidth: "125",
                    displayName: TS.ts('column.percentUsage'),
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.usagePercent|number:2}}%</div>'
                },
                {
                    field: 'lastConnectedTime',
                    type: "date",
                    minWidth: "140",
                    displayName: TS.ts('column.lastUpdateTime'),
                    cellFilter: 'ISOTimeFilter'//根据时区换算过滤
                },
                {
                    field: 'upTime',
                    type: "number",
                    visible: false,
                    minWidth: "105",
                    displayName: TS.ts('column.sysUpTime'),
                    cellFilter: 'uptimeFilter'
                }
            ],
            data: [],
            onRegisterApi: function (gridApi) {
                $scope.gridApi = gridApi;
                //分页按钮事件
                $scope.gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                    if (getClientInfos) {
                        getClientInfos(newPage, pageSize);
                    }

                    //換頁不影響No. 排序
                    var number = pageSize * (newPage-1);
                    var originalSorting = document.getElementsByClassName('ui-grid-cell-contents item_number');
                    
                    for(var i = 0; i < originalSorting.length; i ++){
                        originalSorting[i].innerHTML = i + number + 1;
                    } 
                });
                gridApi.core.on.columnVisibilityChanged($scope, function (column) {
                    // 记录列表隐藏列
                    // 存储用户习惯
                    if (column.visible) {
                        if ($rootScope.customAction.gridVisible)
                            $rootScope.customAction.gridVisible.connectedClientOptions.push(column.field)
                    } else {
                        $rootScope.customAction.gridVisible.connectedClientOptions = _.without($rootScope.customAction.gridVisible.connectedClientOptions, column.field);
                    }

                });
            }
        };
        /*
         * ui-grid表格配置信息
         */
        $scope.blockedClientOptions = {
            isLoading: true,
            paginationPageSizes: [20, 25, 50],
            excessRows: 100,
            paginationTemplate: './views/templates/gridBurster.html',
            paginationPageSize: 20,
            useExternalPagination: true,
            columnDefs: [
                {field: 'index', enableSorting: false, enableColumnMenu:false, enableHiding: false, width: "6%",            
                    displayName: TS.ts('column.no'), cellTemplate: '<div class="ui-grid-cell-contents item_number">{{rowRenderIndex + 1}}</div >'},
                {
                    name: 'action', width: "6%", displayName: TS.ts('column.action'), enableSorting: false,  enableColumnMenu:false,
                    cellTemplate: '<div class="ui-grid-cell-contents"><button class="btn-grid wa" type="button" ng-if="grid.appScope.power.hasEdit(row.entity)" ng-click="grid.appScope.unblockClient(row.entity)" title="{{\'wireless.unblockTitle\'|translate}}"><md-icon md-svg-icon="modal:unblock"></md-icon></button></button></div>'
                },
                {field: 'network',  enableHiding: false, width: "18%", displayName: TS.ts('column.network')},
                {field: 'clientMACAddr', enableHiding: false, width: "18%", displayName: TS.ts('column.mac'),  sort:{
                    direction:'asc'
                }},
                {field: 'band',  enableHiding: false, width: "18%", displayName: TS.ts('column.band'), cellFilter: 'bandFilter'},
                {field: 'ssid', enableHiding: false, width: "18%", displayName: TS.ts('column.ssid')},
                {
                    field: 'authType',  enableHiding: false, minWidth: "185", displayName: TS.ts('column.authType'),
                    cellTemplate: '<div class="ui-grid-cell-contents">{{\'configuration.ssid.authType\' + row.entity.authType | translate}}</div>',
                    sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                        var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                        return utils.sortAuthType(nulls, a, b);

                    }
                },
            ],
            data: []

        };
        $scope.blockedClientOptions.onRegisterApi = function (gridApi) {
            $scope.blockedClientGridApi = gridApi;

            $scope.blockedClientGridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                if ($scope.blockedClientGridApi && $scope.blockedClientGridApi.selection) {
                    $scope.blockedClientGridApi.selection.clearSelectedRows();
                }

                //換頁不影響No. 排序
                var number = pageSize * (newPage-1);
                var originalSorting = document.getElementsByClassName('ui-grid-cell-contents item_number');
                    
                for(var i = 0; i < originalSorting.length; i ++){
                    originalSorting[i].innerHTML = i + number + 1;
                } 
                getBlockedClient(newPage, pageSize);
            });
        };
        /*
         * 表格中，保存name
         */
        $scope.saveName = function (row) {
            DeviceDetailService.renameClient({
                devId: row._id,
                clientMAC: row.clientInfo.macAddr,
                newName: row.clientInfo.name
            }, function (result) {

            })
            console.log('The index of client is ' + row.index + ', save name is ' + row.clientInfo.name)
        };
        /*
         * 表格中，输入框 enter 失去焦点(失去焦点后会执行保存方法)
         */
        $scope.enterKeydown = function ($event) {
            var keycode = window.event ? $event.keyCode : $event.which;//获取按键编码  
            if (keycode == 13) {
                if ($event.target) {
                    $event.target.blur();
                }
            }
        };
        $scope.Error = {
            blockClient: false
        }
        var mytimeout = null;
        /*
         * 表格中，block功能
         */
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
                    row: row
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
                    band: row.band,
                    clientMACAddr: row.clientMACAddr
                }, function (result) {
                    if (result.success) {
                        $scope.needGetInfo = true;
                        var curPage = $scope.connectedClientOptions.paginationCurrentPage;
                        var pageSize = $scope.connectedClientOptions.paginationPageSize;
                        getClientInfos(curPage, pageSize);
                        getBlockedClient($scope.blockedClientOptions.paginationCurrentPage,$scope.blockedClientOptions.paginationPageSize);
                    } else {
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

        };
        /*
         * 表格中，unblock功能
         */
        $scope.unblockClient = function (row) {

            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/templates/dialogConfirm.html',
                windowClass: 'modal-del',
                resolve: {
                    row: row
                },
                size: "w500",
                controller: function ($scope, $uibModalInstance, row) {
                    $scope.con = {
                        title: TS.ts("wireless.unblockTitle"),
                        content: TS.ts("wireless.unblockTip"),
                        type: 'modal:unblock'
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
                DeviceDetailService.unblockClient({
                    uuid: row.uuid,
                    wlanId: row.wlanId,
                    clientMACAddr: row.clientMACAddr
                }, function (result) {
                    if (result.success) {
                        getBlockedClient($scope.blockedClientOptions.paginationCurrentPage,$scope.blockedClientOptions.paginationPageSize);
                        var curPage = $scope.connectedClientOptions.paginationCurrentPage;
                        var pageSize = $scope.connectedClientOptions.paginationPageSize;
                        getClientInfos(curPage, pageSize);
                    }
                })
            }, function () {

            });

        };


        /*
         * 筛选数据(页面搜索)
         */
        var filterData = function () {
            var data = [];
            if ($scope.searchData.value != '') {
                for (var i = 0; i < $scope.gridCopyData.length; i++) {
                    if ($scope.gridCopyData[i][$scope.searchData.type] && $scope.gridCopyData[i][$scope.searchData.type].indexOf($scope.searchData.value) >= 0) {
                        data.push($scope.gridCopyData[i]);
                    }
                }
                $scope.connectedClientOptions.data = data;
            } else {
                $scope.connectedClientOptions.data = $scope.gridCopyData;
            }

        };

    });
    app.register.filter('authTypeFilter', function (utils) {
        return function (input) {
            var result = "";
            var authTypeEnum = {
                0: 'disable',
                1: 'webRedirectOnly',
                2: 'userPassword',
                4: 'remoteRadius',
                5: 'ldap',
                6: 'pop3',
                7: 'passcode',
                8: 'externalCaptivePortal',
                9: 'macAuthentication'

            };
            if (input !== undefined) {
                if (authTypeEnum[input]) {
                    result = authTypeEnum[input];
                } else {
                    result = authTypeEnum[0];
                }
            }
            return result;
        };
    });
});