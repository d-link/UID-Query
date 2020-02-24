/* **************************************************************
* Copyright (C)2010-2020 Dlink Corp.
* 
* Author      : WangHui
* Mail        : Hui.Wang@cn.dlink.com
* Create Date : 2018-05-21
* Modify Date : 
* Summary     : app wireless function controller
* 
*************************************************************/
define(["controllerModule"], function (controllers) {
    controllers.controller('wirelessClientController', function ($rootScope, $uibModal,$scope, $timeout,DashboardService,DeviceDetailService, CustomService,Auth,utils,TS) {
        
        //打开菜单栏
        $scope.openWirelessClientMenu = openWirelessClientMenu;
        //点击查询
        $scope.searchByParams         = searchByParams;
        //监听输入框值的变化
        $scope.addressTextChange      = addressTextChange;
        //清空选择框的内容
        $scope.cleanSearchBox         = cleanSearchBox;
        //禁止弹出系统输入框
        $scope.preventSystemKeyboard  = preventSystemKeyboard;
        //根据选中的类型，判断提醒信息的内容
        $scope.checkPromptData        = checkPromptData;
        //监听类型选中框值的变化
        $scope.addressTypeChange      = addressTypeChange;

        //ip输入提醒值
        $scope.promptIpData  = [];
        //mac输入提醒值
        $scope.promptMacData = [];



        //表格刷新事件
        setTimeout(function(){
            //获取刷新按钮
             var refreshBtn = $('#wiRefreshData')[0];
            //触发事件
            $(refreshBtn).click(function(){
            //根据筛选条件刷新数据
               $scope.searchByParams();
            });
        },0);

        //阻止弹出框事件冒泡
        $scope.stop=function(){
            event.stopPropagation();
        };

        $(document).on('mousedown',function(e){
            var dropdownMenu = $(e.target).parents('.dropdown-menu-right')[0];
            if(!dropdownMenu||dropdownMenu.getAttribute('class')!=='dropdown-menu-right ng-scope dropdown-menu'){
                $scope.isOpenWirelessMenu = false;
            }
        });

        $scope.changeSite = function () {
            $scope.select.network = $scope.select.site.networks[0];
            $scope.needGetInfo = true;
        };


        //------init param

        //判断菜单栏是否未第一次打开
        $scope.isInitMenu = true;

        //初始化下拉框集合值
        //address types
        $scope.searchTypes = ['clientMACAddr', 'ipv4Addr'];
        //clients 
        $scope.clients = [{index: 0, name: 'All'}, {index: 1, name: 'CaptivePortal'}];
        //sites
        $scope.optionSites = [];
        $scope.select = {};
         

        $scope.select.networks=[];

        //params
        function cleanSearchBox(){
            $scope.select.site       = '';
            $scope.select.network    = '';
            $scope.select.client     = '';
            $('#searchAddressText').val('');
            $scope.addressText = '';
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

        function addressTextChange(){
            $scope.addressText = $('#searchAddressText').val().trim();
            //显示提醒内容
            if($scope.addressText !== ''){
                $scope.checkPromptData();
            }else{//输入为空，移除输入提示
                $('.inputPrompt').remove();
            }
        };
        function addressTypeChange(){
            //当值发生改变时，需要清空输入框的值
            $('#searchAddressText').val('');
            $scope.addressText = '';
            //预选值移除
            $('.inputPrompt').remove();
         };

        function checkPromptData(){
            // $('.inputPrompt').remove();
            // var li = '';
            // if($scope.searchData.type == 'ipv4Addr'){
            //     $scope.promptIpData.forEach(function(row,index){
            //     //对输入的内容进行判断
            //     if(row.indexOf($scope.addressText)>=0){
            //         li+='<li>'+row+'</li>';
            //     }
            // });
            // }else if($scope.searchData.type == 'clientMACAddr'){
            //     $scope.promptMacData.forEach(function(row,index){
            //         if(row.indexOf($scope.addressText)>=0){
            //             li+='<li>'+row+'</li>';
            //         }
            // });
            // }
            // //如果没有获取到任何内容，则不显示
            // if(li !== ''){
            //     li+='</li>';
            //     $('#wirelessPointInput').append(
            //         '<div class="inputPrompt" style="width:7.2rem;">'
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

        function dailyError(){
            $.DialogByZ.Close();
        };

        function searchByParams(){
            //判断是否有比输入项未填入
            if(!$scope.select.site||!$scope.select.network._id||!$scope.select.client){
                return;
            };
            
            var curPage = 1;
            var pageSize = $scope.connectedClientOptions.paginationPageSize;
           $scope.searchData.value = $scope.addressText?$scope.addressText.trim():'';
           //获取表格数据
           $scope.getClientInfos(curPage,pageSize);
           //关闭下拉菜单
           $scope.isOpenWirelessMenu = false;
        };




        function openWirelessClientMenu(){
            $scope.preventSystemKeyboard();
         };


  


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
				// var allNetwork = [{name: 'ALL Network', _id: 'ALL'}];
				// for (var i = 0; i < $scope.optionSites.length; i++) {
				// 	allNetwork = allNetwork.concat($scope.optionSites[i].networks);
				// 	$scope.optionSites[i].networks.unshift({name: 'ALL Network', _id: 'ALL'});
				// };
                // $scope.optionSites.unshift({_id: 'ALL', siteName: 'All Site', networks: allNetwork});
                var allNetwork = [{name: 'common.allNetwork', _id: 'ALL', agentUUID: 'ALL'}];
                for (var i = 0; i < $scope.optionSites.length; i++) {
                    allNetwork = allNetwork.concat($scope.optionSites[i].networks);
                    $scope.optionSites[i].networks.unshift({name: 'common.allNetwork', _id: 'ALL', agentUUID: 'ALL'});
                }
                $scope.optionSites.unshift({_id: 'ALL', siteName: 'common.allSite', networks: allNetwork});

                //排序
                $scope.optionSites.sort(function (a, b) {
                    if (a._id == "ALL")return -1;
                    if (b._id == "ALL")return 1;
                    if (a.siteName == b.siteName)return 0;
                    if (a.siteName > b.siteName) return 1;
                    if (a.siteName < b.siteName) return -1;
                    return 0;
                });
                for (var i = 0; i < $scope.optionSites.length; i++) {
                    $scope.optionSites[i].networks.sort(function (a, b) {
                        if (a._id == "ALL")return -1;
                        if (b._id == "ALL")return 1;
                        if (a.name == b.name)return 0;
                        if (a.name > b.name) return 1;
                        if (a.name < b.name) return -1;
                        return 0;
                    })
                }

				// ToDo
				// select 赋值
                $scope.select.site = $scope.optionSites[0];
                $scope.select.network = $scope.select.site.networks[0];
                $scope.select.client = $scope.clients[0];
                
                $scope.select.networks = $scope.select.site.networks;
                 
                /*
                 * 获取并设置用户使用记录
                 *
                 */
                var param = {
                    page: "dashboard",
                    subPage: "wirelessClient"
                };
                CustomService.getUseCustom(param, function(result){
                    if (result.success) {
                        var data = result.data;
                        param.customData = data;
                        $rootScope.customParam = param;
                        // 根据用户习惯隐藏列表列，初始化select选择
                    if(data){
                        for (var i = 0; i < $scope.optionSites.length; i++) { 
                            if(data.cSelect){
                                if ($scope.optionSites[i]._id == data.cSelect.site){
                                    for (var j = 0; j < $scope.optionSites[i].networks.length; j++) {
                                        if ($scope.optionSites[i].networks[j]._id == data.cSelect.network) {
                                            $scope.select.site = $scope.optionSites[i];
                                            $scope.select.network = $scope.optionSites[i].networks[j];
                                        };
                                    };
                                };
                            };       
                        };
                        if(data.gridVisible){
                            data.gridVisible.cClients.forEach(function(v){
                                for (var i = 0; i < $scope.connectedClientOptions.columnDefs.length; i++) {
                                    if( $scope.connectedClientOptions.columnDefs[i].field == v ){
                                        $scope.connectedClientOptions.columnDefs[i].visible = false;
                                    }
                                }
                            });
                        };
                      };
                   };
                });
                // test code
                var curPage=$scope.connectedClientOptions.paginationCurrentPage;
                var pageSize=$scope.connectedClientOptions.paginationPageSize;
                //初始化表格数据
                $scope.getClientInfos(curPage,pageSize);
			};
		});
 

        /*
         * ui-grid表格配置信息
         */
        $scope.connectedClientOptions = {
            enableGridMenu: true,
            enableGridMenuTemplate:'',
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
            paginationPageSizes: [20, 25, 50],
            paginationTemplate: './views/templates/gridBurster.html',
            paginationPageSize: 20,
            enableSorting: true,
            columnDefs: [
                {name: 'refresh', width:'23%', displayName: TS.ts('column.refresh'),
                enableSorting: false,enableColumnMenu: false,
                cellTemplate:   '<div class="ui-grid-cell-contents">'+
                                '<i class="glyphicon glyphicon-refresh" '+ 
                                ' ng-click="grid.appScope.searchByParams()"></i>'+
                                '</div>'
                },
                {field: 'index', width:'22%', displayName: TS.ts('column.no'),
                 cellTemplate: '<div class="ui-grid-cell-contents item_number">{{rowRenderIndex + 1}}</div >',enableSorting: false,enableColumnMenu: false,},
                {field: 'network',width: "35%", displayName: TS.ts('column.network'),cellClass: 'ofv',cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.network}}</span><div></div>'},
                {field: 'ipv4Addr', width:'42%', displayName: TS.ts('column.ipv4'),
                    sort:{
                        direction:'asc'
                    },
                    sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                        var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                        return utils.sortByIP(nulls, a, b);

                    }
                },
                {field: 'ipv6Addr', visible: false, width:'50%', displayName: TS.ts('column.ipv6'),cellClass: 'ofv',cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.ipv6Addr}}</span><div></div>'},
                {field: 'clientMACAddr', width:'50%', displayName: TS.ts('column.mac'),
                    cellClass: 'ofv',
                    cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.clientMACAddr}}</span><div></div>',
                    sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                        var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                        return utils.sortAuthType(nulls, a, b);
                    }
                },
                {field: 'authType', width:'42%', 
                    displayName: TS.ts('column.authType'),
                    cellTemplate: '<div class="ui-grid-cell-contents">{{\'configuration.ssid.authType\' + row.entity.authType | translate}}</div>',
                    sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                        var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                        return utils.sortAuthType(nulls, a, b);
                    }
                },
                {field: 'clientOS', visible: false, width:'35%', displayName: TS.ts('column.os')},
                {field: 'staToApRxDataBytes', visible: false, width:'26%',
                 type: "number",
                 displayName: TS.ts('column.upload'),
                 cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.staToApRxDataBytes|bytesFilter}}</div>'},
                {field: 'apToStaTxDataBytes', visible: false, width:'32%', 
                 type: "number",
                 displayName: TS.ts('column.download'),
                 cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.apToStaTxDataBytes|bytesFilter}}</div>'},
                {field: 'channel', width:'32%',
                 type: "number",
                 displayName: TS.ts('column.channel')},
                {field: 'clientRssi', width:'32%', 
                 type: "number",
                 displayName: TS.ts('column.rssi')},
                {field: 'clientSnr', visible: false, 
                 type: "number",
                 width:'32%', displayName: TS.ts('column.snr')},
                {field: 'band', width: "32%", displayName: TS.ts('column.band'), cellFilter: 'bandFilter'},
            	{field: 'ssid', width:'42%', displayName: TS.ts('column.ssid')},
                {field: 'apMACAddr', width:'50%', displayName: TS.ts('column.apMAC')},
                {field: 'totalUsage',visible: false, 
                 type: "number",width:'42%',
                 displayName: TS.ts('column.totalUsage'),
                 cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.totalUsage|bytesFilter}}</div>'},
                {field: 'usagePercent',visible: false,
                 type: "number",
                 width:'42%',displayName: TS.ts('column.percentUsage'),
                 cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.usagePercent|number:2}}%</div>'},
                {field: 'lastConnectedTime',type: "date",
                 width:'53%',displayName: TS.ts('column.lastUpdateTime'),
                    cellFilter: 'ISOTimeFilter'
                },
                {field: 'upTime', width:'42%', 
                 type: "number",
                 visible: false, 
                 displayName: TS.ts('column.sysUpTime'),
                 cellFilter: 'uptimeFilter'},
             ],
            data: [],
            useExternalPagination: true,
            onRegisterApi: function (gridApi) {
                $scope.gridApi = gridApi;
                //分页按钮事件
                $scope.gridApi.pagination.on.paginationChanged($scope,function(newPage, pageSize) {
                    if($scope.getClientInfos) {
                        $scope.getClientInfos(newPage,pageSize);
                    }
                });
                gridApi.core.on.columnVisibilityChanged($scope, function (column) {
                });
            }
        };

     


        /*
         * 获取表格数据
         */
		$scope.getClientInfos = function(curPage,pageSize){
            $('#wirelessLoading').show();
            var rule = {
                siteId: $scope.select.site?$scope.select.site._id:'ALL',
                networkId: $scope.select.site?$scope.select.network._id:'ALL',
                authType: $scope.select.client?$scope.select.client.index:0
            };

            if ($scope.searchData.value && $scope.searchData.value != "") {
                rule[$scope.searchData.type] = $scope.searchData.value;
            };

			DashboardService.getClientInfos(rule,{start:curPage - 1,count:pageSize},function(result){
                if (result.success) {
                    $scope.needGetInfo = false;
                    $scope.connectedClientOptions.totalItems = result.total;
                    $scope.connectedClientOptions.data = result.data;
                    $scope.gridCopyData = angular.copy($scope.connectedClientOptions.data);
                    $scope.total = result.total;

                    //获取输入提示数据
                    $scope.connectedClientOptions.data.forEach(function(rows,index){
                        //去掉重复值 
                        if($scope.promptIpData.indexOf(rows.ipv4Addr)==-1
                            &&typeof(rows.ipv4Addr)!=='undefined'){
                            $scope.promptIpData.push(rows.ipv4Addr);
                        }
                        if($scope.promptMacData.indexOf(rows.clientMACAddr)==-1
                            &&typeof(rows.clientMACAddr)!=='undefined'){
                            $scope.promptMacData.push(rows.clientMACAddr);
                        }
                    });
                }
                $('#wirelessLoading').hide();
                setTimeout(function(){
                    //选择每页显示条数时，防止移动端打开系统自带的输入框
                    paginationSystemKeyboard();
                },300);
			});
		};
    });
});