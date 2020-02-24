/**
 * Created by lizhimin on 2016/1/7.
 */
define(["app"], function (app) {

    app.register.controller('networkController', function ($rootScope, $scope, $uibModal, $state, $http, NetworkService, $timeout, OrganizationService, Current, TS) {
        /**
         * 修改页面和表格高度
         */
        setHeight('set-height', ['elementFlag'], 49);
        $timeout(function () {
            setGridHeight('network-grid', true);
        }, 100);
        window.onresize = function () {
            setHeight('set-height', ['elementFlag'], 49);
            $timeout(function () {
                setGridHeight('network-grid', true);
            }, 100);
        };
        /**
         * 当前用户权限
         */
        var userInfo = Current.user();
        $scope.power = {
            hasCreate: userInfo.role == 'root admin',
            hasEdit: function (network) {
                if (userInfo.role == 'root admin') return true;
                if (userInfo.role == 'local admin') {
                    if (userInfo.privilege.indexOf(network._id) != -1)
                        return true;
                }
                return false;
            }
        }
        $scope.$on('freshNetwork', function () {
            showNetworkList();
        });

        OrganizationService.getNodeEnv(function (result) {
            if (result.success) {
                Current.setNodeEnv(result.data);
                $scope.gridOptionsNetwork.columnDefs[2].visible = Current.getNodeEnv() == "Production_hualian";
            }
        });

        /**
         * 获取network列表
         */
        var allNetwork = null;

        function showNetworkList() {
            NetworkService.listNetworks(function (result) {
                allNetwork = angular.copy(result.data);
                $scope.gridOptionsNetwork.data = allNetwork;
                if (allNetwork != undefined) {
                    console.log("network uuid list:");
                    console.table(allNetwork, ["site", "name", "agentUUID"]);
                }
                $scope.filterSites = result.sites;
                if ($scope.filterSites != undefined) {
                    $scope.filterSites.unshift('common.allSite');
                }
                if (!$scope.filterSite.select && $scope.filterSites && $scope.filterSites.length > 0) {
                    $scope.filterSite.select = $scope.filterSites[0];
                }
                $scope.selectSite($scope.filterSite.select);
            });
        }

        showNetworkList();
        /**
         * 获取统计数据
         */
        $scope.total = {
            aps: 0,
            clients: 0
        };

        function getTotalInfo(networks) {
            var total = {
                aps: 0,
                totalAps: 0,
                clients: 0
            };
            for (var i = 0; i < networks.length; i++) {
                // $scope.aliasList.push(networks[i].alias);
                total.aps += networks[i].onlineDevs;
                total.totalAps += networks[i].allDevs;
                total.clients += networks[i].clients;
            }
            $scope.total = total;
        }

        /**
         * 获取site列表
         */
        $scope.filterSite = {};

        $scope.selectSite = function (item) {
            if (item == 'common.allSite') {
                // 所有
                $scope.gridOptionsNetwork.data = allNetwork;
                getTotalInfo(allNetwork);
            } else {
                // 过滤
                var filterData = [];
                allNetwork.forEach(function (net) {
                    if (net.site == item) {
                        filterData.push(net);
                    }
                });
                $scope.gridOptionsNetwork.data = filterData;
                getTotalInfo(filterData);
            }
        };
        /**
         * 搜索network
         */
        $scope.search = {
            value: '',
            fun: function () {

            }
        }
        // $scope.search = function () {
        //     //  表格 site name 列模糊搜索

        // };
        /**
         * 添加network
         */
        $scope.addNetwork = function (network) {
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/configuration/addNetwork.html',
                size: 'w800',
                windowClass: 'cwmAddNetwork',
                resolve: {
                    tag: 1,
                    secondaryTime: false,
                    network: function () {
                        return network;
                    }
                },
                controller: 'addNetworkController'
            });
            modalInstance.result.then(function (data) {
                showNetworkList();
            }, function (data) {
                showNetworkList();
            });

        };
        /**
         * 添加network
         */
        $scope.copyFrom = function (network) {

            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: 'copyNetwork.html',
                size: 'w700',
                resolve: {
                    network: function () {
                        return network;
                    }
                },
                controller: function ($scope, $uibModalInstance, network, DashboardService, NetworkService) {
                    $scope.title = 'copy';
                    $scope.select = {
                        site: '',
                        network: ''
                    }
                    $scope.$watch("select.site", function () {
                        if ($scope.select.site && $scope.select.site.networks)
                            $scope.select.network = $scope.select.site.networks[0];
                    });
                    DashboardService.getSiteAndNetwork(function (result) {
                        if (result.success) {
                            for (var i = result.data.length - 1; i >= 0; i--) {
                                for (var j = result.data[i].networks.length - 1; j >= 0; j--) {
                                    if (result.data[i].networks[j].name == network.name) {
                                        result.data[i].networks.splice(j, 1);
                                        if (result.data[i].networks.length == 0) {
                                            result.data.splice(i, 1);
                                        }
                                    }
                                }
                            }
                            $scope.optionSites = result.data;
                            $scope.select.site = $scope.optionSites[0];

                        }
                    });

                    $scope.ok = function () {
                        // $scope.paramInfo = {
                        //     fromNetworkId: $scope.select.network._id,
                        //     toNetworkUUID: network.agentUUID,
                        //     toNetworkId: network._id
                        // };

                        NetworkService.copyFrom($scope.select.network._id, network.agentUUID, network._id, function (result) {
                            if (result.success) $uibModalInstance.close();
                        });
                    }
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss();
                    };
                }
            });
            modalInstance.result.then(function (data) {
                if (!data) return;
            }, function (data) {
            });

        };
        /**
         * 表格参数
         */
        $scope.gridOptionsNetwork = {
            enableGridMenu: false,
            paginationPageSizes: [15, 20, 50],
            paginationPageSize: 15,
            paginationTemplate: './views/templates/gridBurster.html',
            enableSorting: true,
            columnDefs: [
                //{field: 'agentUUID', minWidth: "250", displayName: 'UUID'},
                {
                    field: 'site', width: "20%", enableHiding: false, displayName: TS.ts('column.siteName'), sort: {
                        direction: 'asc',
                        priority: 1
                    }
                },
                {
                    field: 'name', width: "20%", enableHiding: false, displayName: TS.ts('column.networkName'), sort: {
                        direction: 'asc',
                        priority: 2
                    }
                },
                {
                    field: 'schoolId',
                    width: "10%", enableHiding: false,
                    displayName: TS.ts('column.schoolId'),
                    visible: false
                },
                {field: 'allDevs', width: "10%", displayName: TS.ts('column.totalDevices'), enableHiding: false},
                {field: 'onlineDevs', width: "10%", enableHiding: false, displayName: TS.ts('column.onlineDevices')},
                {field: 'clients', width: "10%", enableHiding: false, displayName: TS.ts('column.clients')},
                {
                    name: 'action', displayName: TS.ts('column.profile'),
                    cellTemplate: '<div class="ui-grid-cell-contents"> ' +
                        '<a ng-if="grid.appScope.power.hasEdit(row.entity)"  type="button" class="btn-grid"' +
                        ' title="' + TS.ts("network.editProfile") + '" style="cursor:pointer;" ref="friend"  ng-click="grid.appScope.saveCurrentNetwork(row.entity)">' +
                        '<md-icon md-svg-icon="user:edit"></md-icon></a>' +
                        '<a ng-if="grid.appScope.power.hasEdit(row.entity)" type="button" class="btn-grid"  title="' + TS.ts("network.copyTitle") + '"' +
                        ' ng-click="grid.appScope.copyFrom(row.entity)">' +
                        '<md-icon md-svg-icon="user:copy"></md-icon></a>' +
                        '<a ng-if="grid.appScope.power.hasEdit(row.entity)" type="button" class="btn-grid"' +
                        ' title="' + TS.ts("network.exportTitle") + '"' + ' ng-click="grid.appScope.exportNetwork(row.entity)">' +
                        '<md-icon md-svg-icon="user:_export"></md-icon></a>' +
                        '</div>',
                    width: "10%", enableHiding: false, enableSorting: false, enableColumnMenu: false
                },
                {
                    field: 'discovery', width: "10%", displayName: TS.ts('column.discovery'),
                    enableSorting: false, enableHiding: false, enableColumnMenu: false,
                    cellTemplate: '<div class="ui-grid-cell-contents"> ' +
                        '<a ng-if="grid.appScope.power.hasEdit(row.entity)" type="button" class="btn-grid" title="' + TS.ts("column.discovery") + '"' +
                        '  ng-click="grid.appScope.discovery(row.entity)">' +
                        '<md-icon md-svg-icon="user:search"></md-icon></a></div>'
                },
                {
                    name: 'Action', displayName: TS.ts('column.action'),
                    cellTemplate: '<div class="ui-grid-cell-contents"> ' +
                        '<a ng-if="grid.appScope.power.hasEdit(row.entity)" type="button" class="btn-grid"' +
                        ' title="' + TS.ts("addNetwork.en") + '" ng-click="grid.appScope.editNetwork(row.entity)">' +
                        '<md-icon md-svg-icon="user:edit"></md-icon></a>' +
                        '<a ng-if="grid.appScope.power.hasCreate" type="button" class="btn-grid"' +
                        ' title="' + TS.ts("network.delTitle") + '" ng-click="grid.appScope.delNetwork(row.entity)">' +
                        '<md-icon md-svg-icon="user:remove"></md-icon></a>' +
                        '</div>',
                    minWidth: "90", enableHiding: false, enableSorting: false, enableColumnMenu: false
                }
            ]
        };
        $scope.editProfile = function (r) {

        };
        $scope.saveCurrentNetwork = function (row) {
            Current.setProfile(row);
            $state.go('user.org.CurrentDetail', {moudleId: 'profile', parentId: 'configuration', id: row._id});
            $scope.$broadcast('editProfile', row);
        }
        /**
         * export功能
         */
        $scope.exportNetwork = function (r) {
            NetworkService.exportNetworkProfile(r, function (result) {
                var sz = /[/\\<>:?*\"|]/gi;//常见的特殊字符不够[]里面继续加
                var alias = r.name;
                if (alias.indexOf('.') == 0) {
                    alias = "_" + alias;
                }
                var removeStr = ['/', '\\', '<', '>', ':', '?', '*', '|', '"'];
                while (sz.test(alias)) {
                    for (let i = 0; i < removeStr.length; i++) {
                        alias = alias.replace(removeStr[i], "_");
                    }
                }
                var fileName = alias + '.dat';
                var blob = new Blob([result], {type: "application/octet-stream"});
                if ('msSaveOrOpenBlob' in navigator) {

                    // Microsoft Edge and Microsoft Internet Explorer 10-11
                    window.navigator.msSaveOrOpenBlob(blob, fileName);
                } else {
                    var a = document.getElementById("exportCSVlink");
                    a.download = fileName;
                    a.href = URL.createObjectURL(blob);
                    a.click();
                }
            });
        };
        /**
         * discovery功能
         */
        $scope.discovery = function (r) {
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/configuration/addNetwork.html',
                size: 'w800',
                windowClass: 'cwmAddNetwork',
                resolve: {
                    tag: 3,
                    secondaryTime: false,
                    network: r
                },
                controller: 'addNetworkController'
            });
            modalInstance.result.then(function (data) {
                showNetworkList();
            }, function (data) {
                showNetworkList();
            });
        };
        /**
         * 编辑network
         */
        $scope.editNetwork = function (r) {
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/configuration/addNetwork.html',
                size: 'w800',
                windowClass: 'cwmAddNetwork',
                resolve: {
                    tag: 1,
                    secondaryTime: false,
                    network: r
                },
                controller: 'addNetworkController'
            });
            modalInstance.result.then(function (data) {
                showNetworkList();
            }, function (data) {
                showNetworkList();
            });

        };
        /**
         * 删除network
         */
        $scope.delNetwork = function (item) {
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/templates/dialogConfirm.html',
                windowClass: 'modal-del',
                resolve: {
                    selNetwork: function () {
                        return item;
                    }
                },
                size: "w500",
                controller: function ($scope, $uibModalInstance, selNetwork) {
                    $scope.con = {
                        title: TS.ts("network.delTitle"),
                        content: TS.ts("network.delTip"),
                        type: 'common:remove'
                    };
                    $scope.ok = function () {
                        $uibModalInstance.close(selNetwork);
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function (network) {
                //删除
                NetworkService.delNetwork({networkId: network._id, agentUUID: network.agentUUID}, function (result) {
                    if (result.success) {
                        showNetworkList();
                    }
                });
            }, function () {

            });
        }
    });
});