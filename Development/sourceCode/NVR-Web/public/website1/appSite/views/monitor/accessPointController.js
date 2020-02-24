/* **************************************************************
* Copyright (C)2010-2020 Dlink Corp.
* 
* Author      : WangHui
* Mail        : Hui.Wang@cn.dlink.com
* Create Date : 2018-05-21
* Modify Date : 
* Summary     : app accessPoint function controller
* 
*************************************************************/
define(["controllerModule"], function (controllers) {

    controllers.controller('accessPointController', function ($rootScope, $uibModal, $scope, DashboardService, Current, utils, DeviceDetailService, InventoryService, CustomService, OrganizationService, NetworkService, uiGridConstants, TS) {
        //初次查询出来的表格数据
        $scope.gridData;
        //搜索框要与表格栏位保持一致
        $scope.optionTypes = ['ip', 'localipv6', 'lanIP', 'mac', 'moduleType', 'firmware', 'name', 'location', 'channel24Ghz', 'channel5Ghz', 'channel5Ghz2', 'power24Ghz', 'power5Ghz', 'power5Ghz2'];
        $scope.percentTypes = ['power24Ghz', 'power5Ghz', 'power5Ghz2', 'totalUsage', 'cpuUsage', 'memoryUsage'];
        $scope.unsupportTypes = ['channel24Ghz', 'channel5Ghz', 'channel5Ghz2', 'power24Ghz', 'power5Ghz', 'power5Ghz2'];
        /*
        * 下拉选框数据
        */
        $scope.usageSelect = {
            site: "",
            network: ""
        };
        /*
         * 根据 搜索条件 过滤表格数据
         */
        $scope.searchData = {
            type: $scope.optionTypes[0],
            value: ''
        };
        /*
         * 统计数据
         */
        $scope.total = {
            aps: 0,
            clients: 0,
            download: 0,
            upload: 0
        };
        //ip输入提醒值
        $scope.promptIpData = [];
        //mac输入提醒值
        $scope.promptMacData = [];

        //清空输入框
        $scope.clean = clean;
        //搜索adress
        $scope.searchAddress = searchAddress;
        //打开菜单栏
        $scope.openAccessPointMenu = openAccessPointMenu;
        //禁止弹出系统输入框
        $scope.preventSystemKeyboard = preventSystemKeyboard;
        //获取site、network
        $scope.getSiteAndNetwork = getSiteAndNetwork;
        //监听输入框值的变化
        $scope.addressTextChange = addressTextChange;
        //监听类型选中框值的变化
        $scope.addressTypeChange = addressTypeChange;
        //根据选中的类型，判断提醒信息的内容
        $scope.checkPromptData = checkPromptData;
        //设置弹出框面板点击事件
        $scope.dropMenuPlenClick = dropMenuPlenClick;

        //阻止弹出框事件冒泡
        $scope.stop = function () {
            event.stopPropagation();
        };

        $(document).on('mousedown', function (e) {
            var dropdownMenu = $(e.target).parents('.dropdown-menu-right')[0];
            if (!dropdownMenu || dropdownMenu.getAttribute('class') !== 'dropdown-menu-right ng-scope dropdown-menu') {
                $scope.isOpenAccessPointMenu = false;
            }
        });

        //表格刷新事件
        setTimeout(function () {
            //获取刷新按钮
            var refreshBtn = $('#accRefreshData')[0];
            //触发事件
            $(refreshBtn).click(function () {
                //根据筛选条件刷新数据
                $scope.searchAddress();
            });
        }, 0);

        //初始化加载函数
        $scope.getSiteAndNetwork();


        function openAccessPointMenu() {
            $scope.preventSystemKeyboard();
            $scope.dropMenuPlenClick();
        };

        function dropMenuPlenClick() {
            $('.dropdown-containner').on('click', function () {
                //输入提示移除
                if ($('.inputPrompt') !== null) {
                    $('.inputPrompt').remove();
                }
            });
        };


        function addressTextChange() {
            $scope.addressText = $('#searchAddressText').val().trim();
            //显示提醒内容
            if ($scope.addressText !== '') {
                $scope.checkPromptData();
            } else {//输入为空，移除输入提示
                $('.inputPrompt').remove();
            }
        };

        function addressTypeChange() {
            //当值发生改变时，需要清空输入框的值
            $('#searchAddressText').val('');
            $scope.addressText = '';
            //预选值移除
            $('.inputPrompt').remove();
        };

        function checkPromptData() {
            // $('.inputPrompt').remove();
            // var li = '';
            // if($scope.searchData.type == 'ip'){
            //     $scope.promptIpData.forEach(function(row,index){
            //     //对输入的内容进行判断
            //     if(row.indexOf($scope.addressText)>=0){
            //         li+='<li>'+row+'</li>';
            //     }
            // });
            // }else if($scope.searchData.type == 'mac'){
            //     $scope.promptMacData.forEach(function(row,index){
            //         if(row.indexOf($scope.addressText)>=0){
            //             li+='<li>'+row+'</li>';
            //         }
            // });
            // }
            // //如果没有获取到任何内容，则不显示
            // if(li !== ''){
            //     li+='</li>';
            //     $('#accessPointInput').append(
            //         '<div class="inputPrompt" style="width:9.2rem;">'
            //         +'<ul>'
            //         +li
            //         +'</ul>'
            //         +'</div>'
            //     );
            //     //为每一个li 添加点击事件
            //     $('.inputPrompt>ul>li').on('click',function(){
            //         $scope.addressText = $(this).text();
            //         $('#searchAddressText').val($scope.addressText);
            //         $('.inputPrompt').remove();
            //     });
            // }
        };


        function preventSystemKeyboard() {
            //设置input 为readonly ，防止移动端打开系统自带的输入框
            var uiSelect = Array.prototype.slice.call(document.getElementsByClassName('uiSelect'));
            uiSelect.forEach(function (select, index) {
                var input = select.children[2];
                input.setAttribute('readonly', 'true');
            });
        };

        //选择每页显示条数时，防止移动端打开系统自带的输入框
        function paginationSystemKeyboard() {
            //设置input 为readonly ，防止移动端打开系统自带的输入框
            var uiSelect = Array.prototype.slice.call(document.getElementsByClassName('form-control ui-select-search'));
            uiSelect.forEach(function (input, index) {
                input.setAttribute('readonly', 'true');
            });
        };

        function clean() {
            //清空输入框和选择框
            $('#searchAddressText').val('');
            //清空绑定的数据
            $scope.addressText = '';
        };

        //输入错误，点击关闭弹出框
        function dailyError() {
            $.DialogByZ.Close();
        };

        //搜索
        function searchAddress() {
            //判断输入框是否存在
            if (document.getElementById('searchAddressText') == null) {

            } else {
                //获取选中值
                var addressText = document.getElementById('searchAddressText').value;
                //输入框中的值
                $scope.addressText = addressText;
            }
            // //对输入值做正则表达式判断
            // var ip_V  = /((25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))/;
            // //var mac_V = /[A-F\d]{2}:[A-F\d]{2}:[A-F\d]{2}:[A-F\d]{2}:[A-F\d]{2}:[A-F\d]{2}/;
            // var mac_V = /[A-Fa-f\d]{2}:[A-Fa-f\d]{2}:[A-Fa-f\d]{2}:[A-Fa-f\d]{2}:[A-Fa-f\d]{2}:[A-Fa-f\d]{2}/;
            // //测试ip地址输入合法性
            // if(!ip_V.test($scope.addressText)
            //    &&$scope.addressText!==''
            //    &&typeof($scope.addressText)!=='undefined'
            //    &&$scope.searchData.type=='ip'){
            //     //显示错误弹出框
            //     $.DialogByZ.Alert({Title: "", 
            //                        Content: $rootScope.IPError,
            //                        BtnL   : $rootScope.Confirm,
            //                        FunL   : dailyError})
            //     $('#accessPointLoading').hide();
            //     $scope.isOpenAccessPointMenu = false;
            //    return false;
            // };
            // //测试mac地址输入合法性
            // if(!mac_V.test($scope.addressText)
            //   &&$scope.addressText!==''
            //   &&typeof($scope.addressText)!=='undefined'
            //   &&$scope.searchData.type=='mac'){
            //     //显示错误弹出框
            //     $.DialogByZ.Alert({Title: "", 
            //                        Content: $rootScope.MACError,
            //                        BtnL:$rootScope.Confirm,
            //                        FunL:dailyError})
            //     $('#accessPointLoading').hide();
            //     $scope.isOpenAccessPointMenu = false;
            //    return false;
            // };
            $scope.searchData.value = $scope.addressText;
            //获取表格数据
            $scope.searchAP();
            //关闭弹出框
            $scope.isOpenAccessPointMenu = false;
        };

        function getSiteAndNetwork() {
            DashboardService.getSiteAndNetwork(function (result) {
                if (result.success) {
                    $scope.optionSites = result.data;
                    // 添加 all network
                    var allNetwork = [{name: 'common.allNetwork', _id: 'ALL'}];
                    for (var i = 0; i < $scope.optionSites.length; i++) {
                        allNetwork = allNetwork.concat($scope.optionSites[i].networks);
                        $scope.optionSites[i].networks.unshift({name: 'common.allNetwork', _id: 'ALL'});
                    }
                    ;
                    $scope.optionSites.unshift({siteName: 'common.allSite', networks: allNetwork, _id: 'ALL'});
                    // ToDo
                    // select 赋值
                    $scope.usageSelect.site = $scope.optionSites[0];
                    $scope.usageSelect.network = $scope.usageSelect.site.networks[0];
                    //2019.8.23 尹雪雪
                    OrganizationService.getNodeEnv(function (result1) {
                        if (result1.success) {
                            // Current.setNodeEnv(result.data);
                            // $scope.nodeEnv = result.data == "Production_hualian";
                            if (result1.data == "Production_hualian") {
                                $scope.accessPointsOptions.columnDefs.splice(12, 0, {
                                    field: 'schoolId',
                                    minWidth: '42%',
                                    displayName: TS.ts('column.schoolId')
                                });
                                $scope.accessPointsOptions.columnDefs.splice(13, 0, {
                                    field: 'supplier',
                                    minWidth: '42%',
                                    displayName: TS.ts('supplier.supplier'),
                                    cellClass: 'ofv',
                                    cellTemplate: '<div class="ui-grid-cell-contents"><span>{{row.entity.supplier|supplierFilter}}</span></div>'
                                });
                            }
                        }
                        ;
                        // test code
                        var param = {
                            page: "dashboard",
                            subPage: "accessPoint"
                        };
                        CustomService.getUseCustom(param, function (result) {
                            if (result.success) {
                                var data = result.data;
                                param.customData = data;
                                $rootScope.customParam = param;
                                if (data) {
                                    if (data.usageSelect) {
                                        // 根据用户习惯隐藏列表列，初始化select选择
                                        for (var i = 0; i < $scope.optionSites.length; i++) {
                                            if ($scope.optionSites[i]._id == data.usageSelect.site) {
                                                for (var j = 0; j < $scope.optionSites[i].networks.length; j++) {
                                                    if ($scope.optionSites[i].networks[j]._id == data.usageSelect.network) {
                                                        $scope.usageSelect.site = $scope.optionSites[i];
                                                        $scope.usageSelect.network = $scope.optionSites[i].networks[j];
                                                    }
                                                    ;
                                                }
                                                ;
                                            }
                                            ;
                                        }
                                        ;
                                    }
                                    if (data.gridVisible && data.gridVisible.ap) {
                                        data.gridVisible.ap.forEach(function (v) {
                                            for (var i = 0; i < $scope.accessPointsOptions.columnDefs.length; i++) {
                                                if ($scope.accessPointsOptions.columnDefs[i].field == v) {
                                                    $scope.accessPointsOptions.columnDefs[i].visible = false;
                                                }
                                            }
                                        });
                                    }

                                }
                                ;
                                // getAPInfo($scope.usageSelect.site._id, $scope.usageSelect.network._id);
                                //2019.8.23 尹雪雪
                                OrganizationService.listSuppliers(function (result3) {
                                    if (result3.success) {
                                        $scope.suppliers = result3.data;
                                        getAPInfo($scope.usageSelect.site._id, $scope.usageSelect.network._id);
                                        ;
                                    }
                                });

                            }
                        });
                        // test code

                        // 获取统计数据
                        NetworkService.listNetworks(function (result) {
                            if (result.data) {
                                for (var i = 0; i < result.data.length; i++) {
                                    $scope.total.aps += result.data[i].onlineDevs;
                                    $scope.total.clients += result.data[i].clients;
                                    $scope.total.upload += result.data[i].upload ? result.data[i].upload : 0;
                                    $scope.total.download += result.data[i].download ? result.data[i].download : 0;
                                }
                            }
                            ;
                        });
                    });
                }
                ;
            });
        };

        /*
         * 表格配置参数
         */

        $scope.accessPointsOptions = {
            // isLoading: true,
            //enableColumnMenu: true,
            enableGridMenu: true,
            enableGridMenuTemplate: '',
            paginationPageSizes: [20, 25, 50],
            paginationTemplate: './views/templates/gridBurster.html',
            paginationPageSize: 20,
            useExternalPagination: true,
            //----------- 选中 ----------------------
            enableFooterTotalSelected: true, // 是否显示选中的总数，默认为true, 如果显示，showGridFooter 必须为true
            enableFullRowSelection: true, //是否点击行任意位置后选中,默认为false,当为true时，checkbox可以显示但是不可选中
            enableRowHeaderSelection: false, //是否显示选中checkbox框 ,默认为true
            enableRowSelection: true, // 行选择是否可用，默认为true;
            enableSelectAll: true, // 选择所有checkbox是否可用，默认为true;
            enableSelectionBatchEvent: true, //默认true
            isRowSelectable: function (row) { //GridRow
                if (row.entity.age > 45) {
                    row.grid.api.selection.selectRow(row.entity); // 选中行
                }
            },
            modifierKeysToMultiSelect: false,//默认false,为true时只能 按ctrl或shift键进行多选, multiSelect 必须为true;
            multiSelect: false,// 是否可以选择多个,默认为true;
            enableSorting: true,
            columnDefs: [
                {
                    name: 'refresh', width: '23%', displayName: TS.ts('column.refresh'),
                    enableSorting: false, enableColumnMenu: false,
                    cellTemplate: '<div class="ui-grid-cell-contents">' +
                        '<i class="glyphicon glyphicon-refresh" ' +
                        ' ng-click="grid.appScope.searchAddress()"></i>' +
                        '</div>'
                },
                {
                    field: 'index', width: '22%', displayName: TS.ts('column.no'), enableSorting: false,
                    enableColumnMenu: false,
                    cellTemplate: '<div class="ui-grid-cell-contents item_number">{{rowRenderIndex + 1}}</div >'
                },
                {
                    field: 'status', width: '28%', displayName: TS.ts('column.status'),
                    cellTemplate: '<a style="padding:2px;width:1rem;" ng-class="row.entity.status">' +
                        '<md-icon md-svg-icon="status:online_status"  title="{{\'common.\'+row.entity.status|translate}}"></md-icon></a>'
                },
                {
                    field: 'ip', width: '42%', displayName: TS.ts('column.ip'),
                    sort: {
                        direction: 'asc'
                    },
                    sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                        var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                        return utils.sortByIP(nulls, a, b);
                    }
                },
                {
                    field: 'localipv6', width: '42%', displayName: TS.ts('column.localipv6'), visible: false,
                    cellClass: 'ofv',
                    cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.localipv6}}</span><div></div>'
                },
                {
                    field: 'lanIP', width: '42%', displayName: TS.ts('column.lanIP'),
                    visible: false, cellClass: 'ofv',
                    sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                        var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                        return utils.sortByIP(nulls, a, b);
                    },
                    cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.lanIP}}</span><div></div>'
                },
                {
                    field: 'mac',
                    width: '50%',
                    displayName: TS.ts('column.mac'),
                    cellClass: 'ofv',
                    cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.mac}}</span><div></div>'
                },
                {
                    field: 'moduleType',
                    width: '38%',
                    displayName: TS.ts('column.moduleType'),
                    cellClass: 'ofv',
                    cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.moduleType}}</span><div></div>'
                },
                {
                    field: 'firmware', width: "35%", displayName: TS.ts('column.firmware'),
                    visible: false,
                    cellClass: 'ofv',
                    cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.firmware}}</span><div></div>'
                },
                {
                    field: 'server.name', width: '35%', displayName: TS.ts('column.name'),
                    visible: false, cellClass: 'ofv',
                    cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.server.name||"&nbsp;"}}</span><div></div>'
                },
                {
                    field: 'server.location', width: '28%', displayName: TS.ts('column.location'),
                    visible: false,
                    cellTemplate: '<div  class="hoverTest" ><span >{{row.entity.server.location||"&nbsp;"}}</span></div>'
                },
                {
                    field: 'network', width: '35%', displayName: TS.ts('column.network'), cellClass: 'ofv',
                    cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.network}}</span><div></div>'
                },
                {field: 'client', displayName: TS.ts('column.client'), width: '28%', type: 'number'},
                {
                    field: 'server.channel24Ghz', width: '42%', type: 'number',
                    displayName: TS.ts('column.channel24Ghz'),
                    cellClass: 'ofv',
                    cellTemplate: '<div ng-if="row.entity.server.channel24Ghz==-1" class="ui-grid-cell-contents">{{"common.notSupport"|translate}}</div>' +
                        '<div class="ui-grid-cell-contents" ng-if="row.entity.server.channel24Ghz!=-1"><span>{{row.entity.server.channel24Ghz||autoFilterForChannel}}</span></div>',

                },
                {
                    field: 'server.channel5Ghz', width: '33%', type: 'number',
                    displayName: TS.ts('column.channel5Ghz'),
                    cellClass: 'ofv',
                    cellTemplate: '<div ng-if="row.entity.server.channel5Ghz == -1" class="ui-grid-cell-contents">{{"common.notSupport"|translate}}</div>' +
                        '<div class="ui-grid-cell-contents" ng-if="row.entity.server.channel5Ghz != -1"><span>{{row.entity.server.channel5Ghz||autoFilterForChannel}}</span></div>',
                },
                {
                    field: 'server.channel5Ghz2', width: '42%', displayName: TS.ts('column.channel5Ghz2'),
                    type: 'number',
                    cellClass: 'ofv',
                    cellTemplate: '<div ng-if="row.entity.server.channel5Ghz2 == -1" class="ui-grid-cell-contents">{{"common.notSupport"|translate}}</div>' +
                        '<div class="ui-grid-cell-contents" ng-if="row.entity.server.channel5Ghz2 != -1"><span>{{row.entity.server.channel5Ghz2||autoFilterForChannel}}</span></div>',
                    visible: false,
                },
                {
                    field: 'server.power24Ghz', width: '33%', displayName: TS.ts('column.power24Ghz'),
                    type: 'number',
                    cellClass: 'ofv',
                    cellTemplate: '<div ng-if="row.entity.server.power24Ghz == -1" class="ui-grid-cell-contents">{{"common.notSupport"|translate}}</div>' +
                        '<div class="ui-grid-cell-contents" ng-if="row.entity.server.power24Ghz != -1"><span>{{row.entity.server.power24Ghz+"%"||autoFilterForPower}}</span></div>',
                    visible: false,
                },
                {
                    field: 'server.power5Ghz', width: '33%', displayName: TS.ts('column.power5Ghz'),
                    type: 'number',
                    cellClass: 'ofv',
                    cellTemplate: '<div ng-if="row.entity.server.power5Ghz == -1" class="ui-grid-cell-contents">{{"common.notSupport"|translate}}</div>' +
                        '<div class="ui-grid-cell-contents" ng-if="row.entity.server.power5Ghz != -1"><span>{{row.entity.server.power5Ghz+"%"||autoFilterForPower}}</span></div>',
                    visible: false,
                },
                {
                    field: 'server.power5Ghz2', width: '42%', displayName: TS.ts('column.power5Ghz2'),
                    type: 'number',
                    cellClass: 'ofv',
                    cellTemplate: '<div ng-if="row.entity.server.power5Ghz2 == -1" class="ui-grid-cell-contents">{{"common.notSupport"|translate}}</div>' +
                        '<div class="ui-grid-cell-contents" ng-if="row.entity.server.power5Ghz2 != -1"><span>{{row.entity.server.power5Ghz2+"%"||autoFilterForPower}}</span></div>',
                    visible: false,
                },
                {
                    field: 'apToStaTxDataBytes',
                    width: "33%",
                    type: 'number',
                    displayName: TS.ts('column.download'),
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.apToStaTxDataBytes||bytesFilter}}</div>',
                    visible: false,
                },
                {
                    field: 'staToApRxDataBytes', width: "33%", displayName: TS.ts('column.upload'),
                    type: 'number',
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.staToApRxDataBytes|bytesFilter}}</div>',
                    visible: false,
                },
                {
                    field: 'totalUsage', width: "33%", displayName: TS.ts('column.totalUsage'),
                    type: 'number',
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.totalUsage|bytesFilter}}</div>',
                    visible: false,
                },
                {
                    field: 'percentUsage', width: "40%", displayName: TS.ts('column.percentUsage'),
                    type: 'number',
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.percentUsage|number:2}}%</div>',
                    visible: false,
                },
                {
                    field: 'cpuUsage', width: "36%", displayName: TS.ts('column.cpuUsage'),
                    type: 'number',
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.cpuUsage}}%</div>',
                    visible: false,
                },
                {
                    field: 'memoryUsage', width: "42%", displayName: TS.ts('column.memoryUsage'),
                    type: 'number',
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.memoryUsage}}%</div>',
                    visible: false,
                },
                {
                    field: 'lastUpdateTime',
                    width: "53%",
                    displayName: TS.ts('column.lastUpdateTime'),
                    cellFilter: 'ISOTimeFilter'
                    //,cellClass: 'ofv',cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.lastUpdateTime}}</span><div></div>'
                },
                {
                    field: 'upTime',
                    width: '45%',
                    displayName: TS.ts('column.sysUpTime'),
                    cellFilter: 'uptimeFilter',
                    visible: false,
                },
            ],
            data: [],

            onRegisterApi: function (gridApi) {
                $scope.gridApi = gridApi;
                //分页按钮事件
                $scope.gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                    if ($scope.searchAP) {
                        $scope.searchAP();
                    }
                });
                gridApi.core.on.columnVisibilityChanged($scope, function (column) {

                });

            }
        };

        function fwVersionTransInAPList(data) {
            //2019.4.29 尹雪雪
            for (var i = 0; i < data.length; i++) {
                var location_r = data[i].firmware.indexOf('r');
                if (location_r != -1) {
                    var firmware = data[i].firmware.substring(0, location_r);
                    data[i].firmware = firmware;
                }
            }
            ;
            return data;
        }

        /*
         * 获取表格数据
         */
        var getAPInfo = function (siteId, networkId) {
            var curPage = $scope.accessPointsOptions.paginationCurrentPage;
            var pageSize = $scope.accessPointsOptions.paginationPageSize;
            if (!$rootScope.customParam) $rootScope.customParam = {};
            if (!$rootScope.customParam.customData) $rootScope.customParam.customData = {};
            $rootScope.customParam.customData.usageSelect = {"site": siteId, "network": networkId};
            var rule = {siteId: siteId, networkId: networkId};
            if ($scope.searchData.value && $scope.searchData.value != "") {
                // rule[$scope.searchData.type]=$scope.searchData.value;
                var temp = $scope.searchData.value;
                if ($scope.searchData.value == 'n/a' && $scope.unsupportTypes.indexOf($scope.searchData.type) != -1) {
                    temp = -1;
                    rule[$scope.searchData.type] = temp;
                } else {
                    if ($scope.percentTypes.indexOf($scope.searchData.type) != -1) {
                        var temp = $scope.searchData.value;
                        if ($scope.searchData.value.lastIndexOf('%') != -1) {
                            temp = temp.replace(/%/g, "");
                        }
                        ;
                        rule[$scope.searchData.type] = temp;
                    }
                    else {
                        rule[$scope.searchData.type] = temp;
                    }
                }
                ;
            }
            ;
            $('#accessPointLoading').show();
            DashboardService.getAPInfo(rule, {start: curPage - 1, count: pageSize}, function (result) {
                // $scope.accessPointsOptions.isLoading = false;
                if (result.success) {
                    // //测试数据
                    // let returnData = [];
                    // if(result.data.length > 0){
                    //     for (let i = 0; i < 20; i++) {
                    //         let element = angular.copy(result.data);
                    //         element = element[0];
                    //         let xh1= Math.round(Math.random()*100)+i;
                    //         let xh2= Math.round(Math.random()*100)+i;
                    //         let xh3= Math.round(Math.random()*100)+i;
                    //         let xh4= Math.round(Math.random()*100)+i;
                    //         let xh5= Math.round(Math.random()*1000)+i;
                    //         element.orgId = i+1;
                    //         element.channel5Ghz = i;
                    //         element.channel24Ghz = i;
                    //         element.id= xh2+"."+xh1+"."+xh3+"."+xh4;
                    //         element.client = xh1;
                    //         returnData.push(element);
                    //     }
                    // };
                    // $scope.gridData = returnData;
                    // $scope.accessPointsOptions.data = fwVersionTransInAPList(returnData);
                    // $scope.accessPointsOptions.totalItems=returnData.length;
                    // $scope.gridCopyData = angular.copy(fwVersionTransInAPList(returnData));
                    // $scope.totalOnline = result.online;
                    for (var i = 0; i < result.data.length; i++) {
                        var item = result.data[i];
                        item.supplier = getSupplier(item.supplierId);
                    }
                    ;
                    $scope.gridData = result.data;
                    $scope.accessPointsOptions.data = fwVersionTransInAPList(result.data);
                    $scope.accessPointsOptions.totalItems = result.total;
                    $scope.gridCopyData = angular.copy(fwVersionTransInAPList(result.data));
                    $scope.totalOnline = result.online;

                    //填充提醒值
                    $scope.accessPointsOptions.data.forEach(function (rows, index) {
                        //去掉重复值
                        if ($scope.promptIpData.indexOf(rows.ip) == -1) {
                            $scope.promptIpData.push(rows.ip);
                        }
                        if ($scope.promptMacData.indexOf(rows.mac) == -1) {
                            $scope.promptMacData.push(rows.mac);
                        }
                    });
                }
                ;

                $('#accessPointLoading').hide();
                setTimeout(function () {
                    //选择每页显示条数时，防止移动端打开系统自带的输入框
                    paginationSystemKeyboard();
                }, 300);
            });
        };
        controllers.filter('autoFilterForChannel', function () {
            return function (input) {
                if (input == 0) {
                    return 'auto';
                }
                ;
                return input;
            };
        });
        controllers.filter('autoFilterForPower', function () {
            return function (input) {
                if (input == 'default') {
                    return 'default';
                }
                return input + '%';
            };
        });
        controllers.filter('supplierFilter', function () {
            return function (supplier) {
                if (supplier) {
                    return supplier.year + "," + supplier.name;
                }
                return " ";
            };
        });

        function getSupplier(supplierId) {
            if ($scope.suppliers) {
                for (var i = 0; i < $scope.suppliers.length; i++) {
                    if ($scope.suppliers[i]._id == supplierId) {
                        return $scope.suppliers[i];
                    }
                }
            }
            return null;
        }

        /*
         * 根据 site network 搜索表格数据
         */
        $scope.searchAP = function () {
            getAPInfo($scope.usageSelect.site._id, $scope.usageSelect.network._id);

        };

    })

});