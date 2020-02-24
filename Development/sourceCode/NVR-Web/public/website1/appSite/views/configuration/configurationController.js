define(["controllerModule"], function (controllers) {

    controllers.controller('configurationController', function ($rootScope,$scope, $timeout, $uibModal, DashboardService,BatchConfigService, $state,TS) {

        $scope.initPage          = initPage;         //初始化页面
        $scope.initGridTable     = initGridTable;    //初始化表格
        $scope.initSelectOptions = initSelectOptions;//初始化下拉选择框
        $scope.getProfileTree    = getProfileTree;   //获取profile树
        $scope.changeSite        = changeSite;       //选中Site
        $scope.changeNet         = changeNet;        //选中net
        //防止移动端打开系统自带的输入框
        $scope.preventSystemKeyboard = preventSystemKeyboard;
 

         //表格刷新事件
        setTimeout(function(){
            //获取刷新按钮
            var refreshBtn = $('.grid-refresh')[0];
            //触发事件
            $(refreshBtn).click(function(){
                //根据筛选条件刷新数据
                if(typeof($scope.SSIDSelect.net) !== 'undefined') {
                    var netId = $scope.SSIDSelect.net._id;
                    BatchConfigService.getProfileByNetworkId(netId, function(result){           
                        //对数据读取进行判断
                         if (result.success) {
                            //获取profile数据
                            $scope.profileData = result.data;
                            //获取ssid数据
                            $scope.ssidData = $scope.profileData.contents.ssid;
                            //将ssid数据填充到表格当中去
                            $scope.SSIDOptions.data = $scope.ssidData.list;
                            //设置总数
                            $scope.SSIDOptions.totalItems = $scope.profileData.contents.ssid.list.length;
                           }else{
                            $scope.SSIDOptions.totalItems = 0;
                           }
                    });
                }
            });
        },0);




        //初始化数据
        $scope.SSIDOptions = {};
        $scope.SSIDOptions.totalItems=[];
        $scope.SSIDOptions.data = [];

        

        $scope.initPage();

        function initPage(){
            $scope.initGridTable();
            $scope.initSelectOptions();
            $scope.getProfileTree();
            $scope.preventSystemKeyboard();
        };

        function preventSystemKeyboard(){
            // //设置input 为readonly ，防止移动端打开系统自带的输入框
            // var uiSelect = Array.prototype.slice.call(document.getElementsByClassName('uiSelect'));
            // var uiInput = Array.prototype.slice.call(document.getElementsByTagName('input'));
            // console.log(uiInput);
            // uiSelect.forEach(function (select, index) {
                
            //     var input = select.children[2];
            //     console.log(select.children);
            //     // input.setAttribute('readonly', 'true');
            // });
        };

        //选择每页显示条数时，防止移动端打开系统自带的输入框
        function paginationSystemKeyboard(){
            //设置input 为readonly ，防止移动端打开系统自带的输入框
            var uiSelect = Array.prototype.slice.call(document.getElementsByClassName('form-control ui-select-search'));
            uiSelect.forEach(function (input, index) {
                input.setAttribute('readonly', 'true');
            });
        };

        function changeSite(item){     
            $scope.optionNetworks = item.networks;
        };

        function changeNet(item){
            var netId = item._id;

            $scope.SSIDSelect.net = item;
             // 获取network的profile信息
             BatchConfigService.getProfileByNetworkId(netId, function(result){
                 //对数据读取进行判断
                  if (result.success) {
                    //获取profile数据
                    $scope.profileData = result.data;
                    //获取ssid数据
                    $scope.ssidData = $scope.profileData.contents.ssid;
                    //将ssid数据填充到表格当中去
                    $scope.SSIDOptions.data = $scope.ssidData.list;
                    //设置总数
                    $scope.SSIDOptions.totalItems = $scope.profileData.contents.ssid.list.length;
                    }else{
                    $scope.SSIDOptions.totalItems = 0;
                    }
            });
        };

        function initSelectOptions(){
            $scope.SSIDSelect     = {};
            $scope.optionNetworks = [];
        };
        
        function initGridTable(){
            $scope.SSIDOptions={
                paginationPageSizes: [20,50,100],
                paginationPageSize: 20,
                useExternalPagination: true,
                enableGridMenu: false,
                paginationTemplate: './views/templates/gridBurster.html',
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
            
                onRegisterApi: function(gridApi) {
                    $scope.gridApi = gridApi;
                    //分页按钮事件
                    $scope.gridApi.pagination.on.paginationChanged($scope,function(newPage, pageSize) {
                        // 获取network的profile信息
                        if(typeof($scope.SSIDSelect.net) !== 'undefined') {
                            var netId = $scope.SSIDSelect.net._id;
                            BatchConfigService.getProfileByNetworkId(netId, function(result){
                                //对数据读取进行判断
                                if (result.success) {
                                    //获取profile数据
                                    if(result.data){
                                        $scope.profileData = result.data;
                                    }else{
                                        $scope.profileData = null;
                                    };
                                    //获取ssid数据
                                    if($scope.profileData){
                                        $scope.ssidData = $scope.profileData.contents.ssid;
                                    }else{
                                        $scope.ssidData = null;
                                    };
                                    //将ssid数据填充到表格当中去
                                    if($scope.ssidData){
                                        $scope.SSIDOptions.data = $scope.ssidData.list;
                                    }else{
                                        $scope.SSIDOptions.data = [];
                                    };
                                    //设置总数
                                    if($scope.profileData){
                                        $scope.SSIDOptions.totalItems = $scope.profileData.contents.ssid.list.length;
                                    }else{
                                        $scope.SSIDOptions.totalItems = 0; 
                                    };                  
                                }else{
                                    $scope.SSIDOptions.totalItems = 0;
                                }
                            });
                        }
                    });
                }
            };
            $scope.SSIDOptions.columnDefs =[
                {
                    name: 'ssidIndex', 
                    displayName: TS.ts('column.index'),
                    width:"30%",
                    enableHiding:false,
                    sort: {
                        direction: 'asc',
                        priority: 1
                    },
                    cellTemplate: "<div class='ui-grid-cell-contents'><span>{{'configuration.band.ssid' + row.entity.ssidIndex | translate}}</span></div>"
                },
                {
                    name: 'band', 
                    displayName: TS.ts('column.band'), 
                    width:"32%",
                    enableHiding:false,
                    sort: {
                        direction: 'asc',
                        priority: 2
                    },
                    cellTemplate: "<div class='ui-grid-cell-contents'><span>{{'configuration.band' + row.entity.band | translate}}</span></div>"
                },
                {   
                    name: 'ssid', 
                    displayName: TS.ts('column.ssid'), 
                    width:"35%",
                    enableHiding:false,
                    cellClass: 'ofv',cellTemplate: '<div class="ui-grid-cell-contents ui-grid-more-info"><div><span>{{row.entity.ssid}}</span><div></div>'
                },
                {
                    name: 'authentication', 
                    displayName: TS.ts('column.security'), 
                    width:"55%",
                    enableHiding:false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><span>{{'configuration.ssid.security' + row.entity.authentication | translate}}</span></div>"
                },
                {
                    name: 'macAccessControl', 
                    displayName: TS.ts('column.accessControl'), 
                    width:"40%",
                    enableHiding:false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><span>{{'configuration.ssid.action' + row.entity.macAccessControl | translate}}</span></div>"
                },
                {
                    name: 'authType', 
                    displayName: TS.ts('column.userAuth'), 
                    width:"56%",
                    enableHiding:false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><span>{{'configuration.ssid.authType' + row.entity.authType | translate}}</span></div>"
                },
            ];
        };

        function getProfileTree(){
            BatchConfigService.getProfileTree(function (result) {
                if (result.success) {
                    $scope.optionSites  = result.data;
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
                };
                setTimeout(function(){
                    //选择每页显示条数时，防止移动端打开系统自带的输入框
                    paginationSystemKeyboard();
                },300);
            });
        };
    });
});
