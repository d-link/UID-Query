/**
 * Created by lizhimin on 2016/1/7.
 */
define(["controllerModule"], function (controllers) {

    controllers.controller('networkController', function ($rootScope, $scope, $uibModal, $state, $http, NetworkService, $timeout, OrganizationService, Current, TS) {
 
        $scope.openNetMenu      = openNetMenu;

        //表格刷新事件
        setTimeout(function(){ 
            //获取刷新按钮
            var refreshBtn = $('#netRefreshData')[0];
            //触发事件
            $(refreshBtn).click(function(){
            //根据筛选条件刷新数据
              showNetworkList();
            });
        },0);

        $(document).on('mousedown',function(e){
            var dropdownMenu = $(e.target).parents('.dropdown-menu-right')[0];
            if(!dropdownMenu||dropdownMenu.getAttribute('class')!=='dropdown-menu-right ng-scope dropdown-menu'){
                $scope.isOpenNetMenu = false;
            }
        });

        function openNetMenu(){
            preventSystemKeyboard();
            dropMenuPlenClick();
         };
        function dropMenuPlenClick(){
            $('.dropdown-containner').on('click',function(){
                //输入提示移除
                if($('.inputPrompt')!==null){
                    $('.inputPrompt').remove();
                }
            });
        };
        function preventSystemKeyboard(){
            //设置input 为readonly ，防止移动端打开系统自带的输入框
            var uiSelect = Array.prototype.slice.call(document.getElementsByClassName('uiSelect'));
            uiSelect.forEach(function (select, index) {
                var input = select.children[2];
                input.setAttribute('readonly', 'true');
            });
         };

         //选择每页显示条数时，防止移动端打开系统自带的输入框
        function paginationSystemKeyboard(){
            //设置input 为readonly ，防止移动端打开系统自带的输入框
            var uiSelect = Array.prototype.slice.call(document.getElementsByClassName('form-control ui-select-search'));
            uiSelect.forEach(function (input, index) {
                input.setAttribute('readonly', 'true');
            });
        };
        /**
         * 当前用户权限
         */
        var userInfo = Current.user();
        $scope.power = {
            hasCreate: userInfo.role == 'root admin',
            hasEdit: function (network) {
                if (userInfo.role == 'root admin')return true;
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
            $('#networkLoading').show();
            NetworkService.listNetworks(function (result) {
                if(result.data){
                    allNetwork = angular.copy(result.data);
                }else{
                    allNetwork = [];
                };                
                $scope.gridOptionsNetwork.data = allNetwork;
                // console.log("network uuid list:");
                // for (var i = 0; i < allNetwork.length; i++) {
                //     console.log(allNetwork[i].agentUUID);
                // }
                if(result.sites){
                    $scope.filterSites = result.sites;
                }else{
                    $scope.filterSites = [];
                };                
                $scope.filterSites.unshift('common.allSite');
                if (!$scope.filterSite.select) {
                    $scope.filterSite.select = $scope.filterSites[0];
                }



                $scope.selectSite($scope.filterSite.select);
                $scope.submitSearch($scope.filterSite.select);

                console.log($scope.filterSite);
                
                $('#networkLoading').hide();
                setTimeout(function(){
                    //选择每页显示条数时，防止移动端打开系统自带的输入框
                    paginationSystemKeyboard();
                },300);
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
            console.log(networks);
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

        $scope.searchParams;

        $scope.selectSite = function (item) {
            $scope.searchParam = item;
            // if (item == 'common.allSite') {
            //     // 所有
            //     $scope.gridOptionsNetwork.data = allNetwork;
            //     getTotalInfo(allNetwork);
            // } else {
            //     // 过滤
            //     var filterData = [];
            //     allNetwork.forEach(function (net) {
            //         if (net.site == item) {
            //             filterData.push(net);
            //         }
            //     });
            //     $scope.gridOptionsNetwork.data = filterData;
            //     getTotalInfo(filterData);
            // }
        };
        $scope.submitSearch = function (){
            if(!$scope.filterSite.select){
               return;
            };
            if ($scope.searchParam == 'common.allSite') {
                // 所有
                $scope.gridOptionsNetwork.data = allNetwork;
                getTotalInfo(allNetwork);
                $scope.isOpenNetMenu = false;
            } else {
                // 过滤
                var filterData = [];
                allNetwork.forEach(function (net) {
                    if (net.site == $scope.searchParam) {
                        filterData.push(net);
                    }
                });
                $scope.gridOptionsNetwork.data = filterData;
                getTotalInfo(filterData);
                $scope.isOpenNetMenu = false;
            }
        };
        $scope.clean = function (){
            $scope.filterSite.select = ''
        };
        
        /**
         * 搜索network
         */
        $scope.search = {
            value: '',
            fun: function () {

            }
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
            //----------- 选中 ----------------------
            enableFooterTotalSelected: true, // 是否显示选中的总数，默认为true, 如果显示，showGridFooter 必须为true
            enableFullRowSelection : true, //是否点击行任意位置后选中,默认为false,当为true时，checkbox可以显示但是不可选中
            enableRowHeaderSelection : false, //是否显示选中checkbox框 ,默认为true
            enableRowSelection : true, // 行选择是否可用，默认为true;
            enableSelectAll : true, // 选择所有checkbox是否可用，默认为true; 
            enableSelectionBatchEvent : true, //默认true
            isRowSelectable: function(row){ //GridRow
                if(row.entity.age > 45){
                    row.grid.api.selection.selectRow(row.entity); // 选中行
                }
            },
            modifierKeysToMultiSelect: false ,//默认false,为true时只能 按ctrl或shift键进行多选, multiSelect 必须为true;
            multiSelect: false ,// 是否可以选择多个,默认为true;
            columnDefs: [
                {
                    field: 'site', width:'42%', displayName: TS.ts('column.siteName'), 
                    cellClass: 'ofv',cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.site}}</span><div></div>',
                    enableHiding: false, enableSorting: true,sort: {
                        direction: 'asc',
                        priority: 1,
                    },
                },
                {
                    field: 'name', width:'42%',displayName: TS.ts('column.networkName'),
                    cellClass: 'ofv',cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.name}}</span><div></div>',
                    enableHiding: false, enableSorting: true,sort: {
                        direction: 'asc',
                        priority: 1,
                    }
                },
                {
                    field: 'schoolId',
                    width:'42%',
                    displayName: TS.ts('column.schoolId'),
                    visible: false
                },
                {field: 'allDevs', width:'42%', displayName: TS.ts('column.totalDevices'),enableHiding: false, enableSorting: true,},
                {field: 'onlineDevs', width:'42%', displayName: TS.ts('column.onlineDevices'),enableHiding: false, enableSorting: true,},
                {field: 'clients', width:'42%', displayName: TS.ts('column.clients'),enableHiding: false, enableSorting: true,},
            ]
        };

    });
});