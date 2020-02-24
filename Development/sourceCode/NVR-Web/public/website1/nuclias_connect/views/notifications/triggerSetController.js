/**
 * Created by lizhimin on 2016/1/26.
 */
define(["controllerModule"], function (controllers) {
    controllers.controller('triggerSetController', function ($scope, $http, $timeout, Current,TriggerService, $uibModal,uiGridConstants) {
        setHeight(); // set-height 表格高度依据
        setHeight('data-show-menu-main',[], -40); // 用于菜单显示滚动条
        setHeight('site-set-height',['elementFlag']); // 显示滚动条容器

        $scope.timer = null;
        window.onresize = function(){
            setHeight();
            setHeight('data-show-menu-main',[], -40);
            setHeight('site-set-height',['elementFlag']);
            $timeout.cancel($scope.timer);
            $scope.timer = $timeout(function(){
                setGridHeight('Trigger_ViewGrid', true, 16);
            },300);
        }
        // mock data
        $scope.sites = [];
        // 获取左侧列表数据
        var first = true;
        function getTriggerTree() {
            TriggerService.getTriggerTree(function(result){
                if (result.success && result.data.length>0) {
                    $scope.sites = result.data;
                    // 页面初始状态
                    if (first) {
                        $scope.toggleSite($scope.sites[0]);
                        $scope.toggleNetwork($scope.activeStatus.siteActive.networks[0]);
                        first = false;
                    };
                };
            });
        };
        getTriggerTree(); // 获取左侧列表数据
        
        // 获取group下的trigger
        $scope.nameList = [];
        function getTriggerList() {
            var data = {
                networkId: $scope.activeStatus.networkActive.networkId,
                groupId: $scope.activeStatus.groupActive.groupId
            };
            TriggerService.getTriggerList(data,function(result){
                if (result.success) {
                    $scope.gridTriggerOptions.data = result.data;
                    for (var i = 0; i < $scope.gridTriggerOptions.data.length; i++) {
                        $scope.nameList.push($scope.gridTriggerOptions.data[i].name)
                    }
                }
            });
            $timeout(function(){
                setGridHeight('Trigger_ViewGrid', true, 16)
            },100);
        };

        // 当前选中状态 及 左侧列表点击fun
        $scope.activeStatus = {
            siteActive: '',
            networkActive: '',
            // groupActive: '',
            triggerActive: '',
            triggerTypeActive: ''
        };
        // $scope.viewChoice = '';
        $scope.subViewChoice = '';
        $scope.toggleSite = function(site){
            $scope.activeStatus = {
                siteActive: '',
                networkActive: '',
                // groupActive: '',
                triggerActive: '',
                triggerTypeActive: ''
            };
            // $scope.viewChoice = '';
            $scope.activeStatus.siteActive = site;
            $scope.specialActive = site;
        };
        $scope.toggleNetwork = function(network){
            if ($scope.activeStatus.networkActive!=network) {
                $scope.activeStatus.networkActive = network;
                // if (network.groups.length) $scope.toggleGroup(network.groups[0]);
            };
        };
        // $scope.toggleGroup = function(group){
        //     $scope.activeStatus.groupActive = group;
        //     $scope.specialActive = group;
        //     $scope.viewChoice = 'trigger';
        //     getTriggerList();
        //     $scope.activeStatus.triggerTypeActive = '';
        //     $scope.activeStatus.triggerActive = '';
        // };
        $scope.toggleTrigger = function(trigger){
            $scope.activeStatus.triggerActive = trigger;
            $scope.openSettingView($scope.activeStatus.networkActive.monitorTypes[0]);
        };
        $scope.openSettingView = function(item){
            $scope.activeStatus.triggerTypeActive = item;
            // $scope.viewChoice = 'triggerSetting';
            var s = item.items&&item.items.length?item.items[0]:'';
            $scope.openView(s);
        };
        
        $scope.openView = function(view){
            $scope.initErrorState();
            $scope.subViewChoice = view;
            $scope.specialActive = view;
        };
        // tab切换
        $scope.show = {
            tab1: false
        };
        $scope.changeTabShow = function () {
            $scope.show.tab1 = false;
        };
        $scope.resetGridSize = function () {
            $scope.show.tab1 = true;
            getDeviceView();
            $timeout(function(){
                setGridHeight('Apply_ViewGrid',true)
            },100);
        };

        // grid config
        $scope.gridTriggerOptions = {
            enableFiltering: true,
            enablePagination: true, //是否分页，默认为true
            paginationTemplate: './views/templates/gridBurster.html',
            onRegisterApi: function (gridApi) {
                $scope.triggerGridApi = gridApi;
            }
        };
        $scope.gridTriggerOptions.columnDefs = [
            {
                name: 'name',
                displayName: 'Trigger Name',
                width: "30%",
                enableHiding: false,
                enableFiltering: false
            },
            // {
            //     name: 'pollingInterval',
            //     displayName: 'Polling Interval(sec)',
            //     width: "20%",
            //     enableHiding: false,
            //     enableFiltering: false
            // },
            {
                name: 'devices',
                displayName: 'Target Devices',
                width: "30%",
                enableHiding: false,
                enableFiltering: false
                // cellTemplate:'<div class="ui-grid-cell-contents"><span ng-if="row.entity.period">{{row.entity.period/60}}</span><span ng-if="!row.entity.period">-</span></div>'

            },
            // {
            //     name: 'events',
            //     displayName: 'Events',
            //     width: "25%",
            //     enableFiltering: false
            // },
            {
                name: 'alerts',
                displayName: 'Alerts',
                width: "25%",
                enableHiding: false,
                enableFiltering: false
            },
            {
                name: 'action', displayName: 'Action', width: "15%", enableHiding: false, enableFiltering: false,
                cellTemplate: '<div class="ui-grid-cell-contents"><a type="button" class="btn-grid" ng-click="grid.appScope.copyTrigger(row.entity)" title="{{&apos;title.copy&apos;|translate}}"><md-icon md-svg-icon="user:copy"></md-icon></a>' +
                '<a type="button" class="btn-grid" ng-click="grid.appScope.editTrigger(row.entity)" title="{{&apos;title.edit&apos;|translate}}"><md-icon md-svg-icon="user:edit"></md-icon></a>' +
                '<a type="button" class="btn-grid" ng-click="grid.appScope.delTrigger(row.entity)" title="{{&apos;title.del&apos;|translate}}" ng-if="!row.entity.isDefault"><md-icon md-svg-icon="user:remove"></md-icon></a></div>'

            }
        ];
        // event
        
        // 添加trigger
        $scope.openAddRule = function (trigger) {
            var readOnly = false;
            var modalInstance = $uibModal.open({
                backdrop:'static',
                animation: true,
                keyboard:false,
                templateUrl: 'addTrigger.html',
                size: 'w600',
                windowClass: 'modal-addTrigger',
                scope: $scope,
                resolve: {
                    trigger: function () {
                        return trigger;
                    },
                    readOnly: function() {
                        return readOnly;
                    },
                    nameList: function() {
                        return $scope.nameList;
                    }
                },
                controller: function($scope, $uibModalInstance, trigger, $rootScope, nameList){
                    $scope.isEdit = false;
                    $scope.nameRepeat = false;
                    // $scope.step = 1;
                    // $scope.applyNow = {value: 'now'};
                    $scope.allDeviceOptions = {
                        enableRowSelection: true,
                        enableSelectAll: true,
                        selectionRowHeaderWidth: '40',
                        multiSelect: true,
                        columnDefs: [
                            {name: 'sysName', displayName: 'System Name', width: "190"},
                            {name: 'ip', displayName: 'IP', width: "190"},
                            {name: 'moduleType', displayName: 'Model Name', width: "180"}]
                    };
                    $scope.selectDeviceOptions = angular.copy($scope.allDeviceOptions);

                    // data
                    $scope.triggerRule = {
                        name: '',
                        desc: '',
                        pollingInterval: 60
                    };
                    if (trigger) { // 编辑trigger时数据的添加
                        $scope.title = 'edit';
                        $scope.isEdit = true;
                        $scope.isDefault = trigger.isDefault; // 限制编辑
                        $scope.triggerRule = angular.copy(trigger);
                        delete $scope.triggerRule.alerts;
                        delete $scope.triggerRule.devices;
                        delete $scope.triggerRule.isDefault;
                    }else{
                        $scope.title = 'create';
                        $scope.triggerRule.networkId = $scope.activeStatus.networkActive.networkId;
                        $scope.triggerRule.groupId = $scope.activeStatus.groupActive.groupId;
                    };
                    $scope.ok = function () {
                        var triggerData = angular.copy($scope.triggerRule);
                        for (var i = 0; i < nameList.length; i++) {
                            if(triggerData.name == nameList[i] && !(trigger&&trigger.name==triggerData.name)){
                                $scope.nameRepeat = true;
                                return;
                            }
                        }
                        $uibModalInstance.close(triggerData);
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function (triggerData) {
                if (trigger) {
                    delete triggerData.groupId;
                    delete triggerData.networkId;
                    delete triggerData.orgId;
                    TriggerService.updateTrigger(triggerData,function(result){
                        if (result.success) {
                            getTriggerTree();
                            getTriggerList();
                        };
                    });
                }else{
                    TriggerService.addTrigger(triggerData,function(result){
                        if (result.success) {
                            getTriggerTree();
                            getTriggerList();
                        };
                    });
                }
            });
        };
        // 编辑trigger
        $scope.editTrigger = function (row) {
            $scope.openAddRule(row)
        };
        // 删除trigger
        $scope.delTrigger = function (row) {
            TriggerService.delTrigger({triggerId: row._id},function (result) {
                if (result.success) {
                    getTriggerTree();
                    getTriggerList();
                };
            });
        };

        //获取condition 数据
        $scope.triggerViewData = {};
        $scope.getCondition = function(){
            if(!($scope.activeStatus.triggerActive&&$scope.activeStatus.triggerTypeActive)) return;
            var viewDataPar = {
                triggerId: $scope.activeStatus.triggerActive.triggerId,
                monitorType: $scope.activeStatus.triggerTypeActive.monitorType
            };
            if ($scope.subViewChoice) viewDataPar.monitorParam = $scope.subViewChoice.paramName;
            TriggerService.getTriggerCondition(viewDataPar, function(result){
                if (result.success) {
                    $scope.triggerViewData = result.data?result.data:{};
                }else{
                    $scope.triggerViewData = {};
                }
            });
        };
        // ToDo
        // 监听选中的 monitorParam  $scope.subViewChoice
        // 获取数据
        $scope.$watch('subViewChoice', function(){
            if ($scope.subViewChoice == '') return;
            $scope.getCondition();
        });
        $scope.$watch('activeStatus.triggerTypeActive', function(){
            if ($scope.subViewChoice != '') return;
            $scope.getCondition();
        });

        // 提交结果
        $scope.initErrorState = function(){
            $scope.state = {
                isSuccess: false,
                isError: false,
                processing: false,
                msgTrue: 'Information saved successfully',
                msgFalse: 'Failed to save information'
            };
        };
        $scope.initErrorState();

        // other
        function getDeviceView() {
            TriggerService.getDeviceView(function (result) {
                if (result.success) {
                    $scope.gridApplyOptions.data = result.data;
                };
                $timeout(function(){
                    setGridHeight('Apply_ViewGrid',true)
                },100);
            });
        };
        $scope.delTriggerByDev = function (row) {
            TriggerService.delTriggerByDev(row._id,function (result) {
                getTriggerTree();
            });
        };
        $scope.editTriggerByDev=function(row){
              //$http.post(base_url+'api/trigger/')
        };
    });
    controllers.controller('myCustomModalCtrl', function ($scope, $compile, $timeout) {
        var $elm;

        $scope.showAgeModal = function () {
            $scope.listOfSensors = [];

            $scope.col.grid.appScope.gridTriggerOptions.data.forEach(function (row) {
                if ($scope.listOfSensors.indexOf(row.type) === -1) {
                    $scope.listOfSensors.push(row.type);
                }
            });
            $scope.listOfSensors.sort();

            $scope.gridOptions = {
                data: [],
                enableColumnMenus: false,
                onRegisterApi: function (gridApi) {
                    $scope.gridApi = gridApi;

                    if ($scope.colFilter && $scope.colFilter.listTerm) {
                        $timeout(function () {
                            $scope.colFilter.listTerm.forEach(function (sensorType) {
                                var entities = $scope.gridOptions.data.filter(function (row) {
                                    return row.type === sensorType;
                                });

                                if (entities.length > 0) {
                                    $scope.gridApi.selection.selectRow(entities[0]);
                                }
                            });
                        });
                    }
                }
            };

            $scope.listOfSensors.forEach(function (sensorType) {
                $scope.gridOptions.data.push({type: sensorType});
            });

            var html = '<div class="modal" ng-style="{display: \'block\'}"><div class="modal-dialog"><div class="modal-content"><div class="modal-header">Filter Sensors</div><div class="modal-body"><div id="grid1" ui-grid="gridOptions" ui-grid-selection class="modalGrid"></div></div><div class="modal-footer"><button id="buttonClose" class="btn btn-primary" ng-click="close()">Filter</button></div></div></div></div>';
            $elm = angular.element(html);
            angular.element(document.body).prepend($elm);

            $compile($elm)($scope);

        };

        $scope.close = function () {
            var sensors = $scope.gridApi.selection.getSelectedRows();
            $scope.colFilter.listTerm = [];

            sensors.forEach(function (sensor) {
                $scope.colFilter.listTerm.push(sensor.type);
            });

            $scope.colFilter.term = $scope.colFilter.listTerm.join(', ');
            $scope.colFilter.condition = new RegExp($scope.colFilter.listTerm.join('|'));

            if ($elm) {
                $elm.remove();
            }
        };
    });
    controllers.directive('myCustomModal', function () {
        return {
            template: '<label>{{colFilter.term}} </label>&nbsp;&nbsp;<a  type="button" class="btn btn-small" ng-click="showAgeModal()">...</a>',
            controller: 'myCustomModalCtrl'
        };
    });
    controllers.filter('trigger_deviceName', function () {
        return function (input) {
            var result = "";
            if (input) {
                result = input.sysName;
            }
            return result;
        };
    });
    controllers.filter('trigger_deviceIP', function () {
        return function (input) {
            var result = "";
            if (input) {
                result = input.ip;
            }
            return result;
        };
    });
    controllers.filter('trigger_event', function () {
        return function (input) {
            var result = "";
            if (input) {
                if (input == 'critical') {
                    result = 'head_notification_critical';
                }
                else if (input == 'warning') {
                    result = 'head_notification_warning';
                } else {
                    result = 'head_notification_info';
                }
            }
            return result;
        };
    });

    controllers.filter('valueMatch_value', function () {
        return function (input) {
            var result = [];
            if (input) {
                for (var i = 0; i < input.length; i++) {
                    result.push(input[i].keyword);
                }
            }
            return result;
        };
    });
    controllers.filter('valueMatch_type', function () {
        return function (input) {
            var result = [];
            if (input) {
                for (var i = 0; i < input.length; i++) {
                    result.push(input[i].matchType);
                }
            }
            return result;
        };
    });
    controllers.filter('syslogSeverityF', function () {
        return function (input) {
            var result = [];
            if (input) {
                for (var i = 0; i < input.length; i++) {
                    result.push(input[i].name);
                }
            }
            return result;
        };
    });
    //CPUUtilization
    controllers.directive('triggerCpuLoad', function () {
        return {
            restrict: 'AE',
            templateUrl: "triggerCpuLoad.html",
            scope: true,
            controller: function ($scope, TriggerService) {
                // 页面基本信息
                $scope.monitorData = {
                    repeatTime: 1,valueType: 'Absolute Value',
                    conditions: {
                        Critical: {enable: false,HCondition: {threshold: 0,expression: "<"},
                            LCondition: {threshold: 0,expression: "<"},alert: false},
                        Warning: {enable: false,HCondition: {threshold: 0,expression: "<"},
                            LCondition: {threshold: 0,expression: "<"},alert: false},
                        Info: {enable: false,HCondition: {threshold: 0,expression: "<"},
                            LCondition: {threshold: 0,expression: "<"},alert: false}
                    }
                };

                // 获取数据
                $scope.$watch('triggerViewData', function(){
                    var data = $scope.triggerViewData;
                    if (!data) return;
                    // 转换成页面所需格式
                    $scope.monitorData.repeatTime = data.repeatTime;
                    $scope.monitorData.valueType = data.valueType;
                    $scope.monitorData.conditions.Critical = data.Critical;
                    $scope.monitorData.conditions.Warning = data.Warning;
                    $scope.monitorData.conditions.Info = data.Info;
                });

                // 页面操作
                $scope.saveMonitor = function(){
                    $scope.initErrorState();
                    $scope.state.processing = true;
                    var data = {
                        triggerId: $scope.activeStatus.triggerActive.triggerId,
                        monitorType: $scope.activeStatus.triggerTypeActive.monitorType,
                        monitorParam: $scope.subViewChoice.paramName,
                        repeatTime: $scope.monitorData.repeatTime,
                        valueType: $scope.monitorData.valueType
                    };
                    // 转换成接口所需格式
                    for(condition in $scope.monitorData.conditions){
                        data[condition] = $scope.monitorData.conditions[condition];
                    };
                    TriggerService.updateTriggerCondition({triCondition: data}, function(result){
                        $scope.state.processing = false;
                        if (result.success) {
                            $scope.state.isSuccess = true;
                            $scope.getCondition();
                        }else{
                            $scope.state.isError = true;
                        }
                    });
                };
            }
        };
    });
    //trap
    controllers.directive('triggerTrap', function () {
        return {
            restrict: 'AE',
            templateUrl: "triggerTrap.html",
            scope: true,
            controller: function ($scope, TriggerService) {
                // 页面基本信息
                $scope.gridTrapOptions = {
                    columnDefs: [
                        {name: 'severity', displayName: 'Severity level', width: "8%", enableHiding: false,
                        cellTemplate: '<a class="{{row.entity.severity|lowercase}}"><md-icon md-svg-icon="bottom:{{row.entity.severity|lowercase}}" ></md-icon></a>'},
                        {name: 'genericTypeH', displayName: 'Trigger Trap', width: "17%", enableHiding: false},
                        {name: 'genericTypeL', displayName: 'Release Trap', width: "17%", enableHiding: false},
                        {name: 'bindingVariableL', displayName: 'Bingding Variable & Value', width: "38%", enableHiding: false,
                        cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.bindingVariableL.length>0?row.entity.bindingVariableL:"-"}}</div>'},
                        {name: 'expressionL', displayName: 'Logical Relation', width: "10%", enableHiding: false},
                        {name: 'Action', displayName: 'Action', width: "10%", enableHiding: false,
                        cellTemplate: '<div class="ui-grid-cell-contents"><a type="button" class="btn-grid" ng-click="grid.appScope.editTrapRule(row.entity)" title="{{&apos;title.edit&apos;|translate}}"><md-icon md-svg-icon="user:edit"></md-icon></a>' +
                        '<a type="button" class="btn-grid" ng-click="grid.appScope.delTrapRule(row.entity)" title="{{&apos;title.del&apos;|translate}}"><md-icon md-svg-icon="user:remove"></md-icon></a></div>'}
                    ]
                };
                $scope.tragTypes = [
                    {name: 'coldStart', oid:''},
                    {name: 'linkDown', oid:'1.3.6.1.6.3.1.1.5.3'},
                    {name: 'linkUp', oid:'1.3.6.1.6.3.1.1.5.4'},
                    {name: 'swHighTemperature', oid:'1.3.6.1.4.1.171.12.11.2.2.4.0.1'}];
                $scope.logicals = ['AND', 'OR'];
                $scope.matchTypes = ['contains', 'equal'];
                $scope.gridTrapOptions.data = [];

                TriggerService.getTrapTypes(function(result){
                    if (result.success) {
                        $scope.tragTypes = result.data;
                        initData();
                    };
                })
                // 获取数据
                $scope.$watch('triggerViewData', function(){
                    var data = $scope.triggerViewData;
                    if (!data) return;
                    $scope.gridTrapOptions.data = data.conditions;
                });


                // 初始化编辑模块数据
                $scope.editData = {};
                function initData(){
                    $scope.editData = {
                        severity: 'Critical',
                        genericTypeH: '',
                        trapOIDH: '',
                        expressionH: 'AND',
                        bindingVariableH: [],
                        genericTypeL: '',
                        trapOIDL: '',
                        expressionL: 'AND',
                        bindingVariableL: []
                    };
                    $scope.releaseValue = false; // 是否存在release
                    $scope.matchValue = {value: false};
                    $scope.trapType = {
                        triggerType: $scope.tragTypes[0],
                        releaseType: $scope.tragTypes[0]
                    };
                };
                
                // 页面操作
                // H match 添加和删除
                $scope.addHMatch = function(){
                    if (!$scope.matchValue.value) return;
                    var rule = {
                        matchType: 'contains',
                        variable: '',
                        value: ''
                    };
                    $scope.editData.bindingVariableH.push(rule);
                };
                $scope.removeHMatch = function (index) {
                    $scope.editData.bindingVariableH.splice(index, 1);
                };

                // L match 添加和删除
                $scope.addLMatch = function(){
                    if (!$scope.matchValue.value) return;
                    var rule = {
                        matchType: 'contains',
                        variable: '',
                        value: ''
                    };
                    $scope.editData.bindingVariableL.push(rule);
                };
                $scope.removeLMatch = function (index) {
                    if (!$scope.matchValue.value) return;
                    $scope.editData.bindingVariableL.splice(index, 1);
                };

                // trap rule 添加
                $scope.addTrapRule = function(){
                    var dic = ['coldStart', 'warmStart', 'linkDown', 'linkUp', 'authenticationFai1ure', 'epgNeighborLoss'];
                    // genericType 赋值
                    for (var i = 0; i < dic.length; i++) {
                        if ($scope.trapType.triggerType.name == dic[i]){
                            $scope.editData.genericTypeH = $scope.trapType.triggerType.name;
                        };
                        if ($scope.releaseValue && $scope.trapType.releaseType.name == dic[i]){
                            $scope.editData.genericTypeL = $scope.trapType.releaseType.name;
                        };
                    };
                    // trapOIDH 赋值
                    $scope.editData.trapOIDH = $scope.trapType.triggerType.oid;
                    $scope.editData.trapOIDL = $scope.trapType.releaseType.oid;

                    // H L 不同时
                    if ($scope.releaseValue && $scope.editData.trapOIDH != $scope.editData.trapOIDL) {
                        $scope.editData.expressionL = $scope.editData.expressionH;
                        $scope.editData.bindingVariableL = $scope.editData.bindingVariableH;
                    };

                    // match 
                    if (!$scope.matchValue.value) {
                        $scope.editData.expressionH = $scope.editData.expressionL = ''
                    }
                    $scope.gridTrapOptions.data.push($scope.editData);
                    initData();
                };

                // trap rule 编辑
                $scope.editRuleStatus = null;
                $scope.editTrapRule = function(data){ // 获取编辑的trapRule信息
                    $scope.editRuleStatus = data.$$hashKey; //记录编辑的trap rule
                    $scope.editData = angular.copy(data);
                    if ($scope.editData.expressionH) $scope.matchValue.value = true;
                    // trap type选框赋值
                    for (var i = 0; i < $scope.tragTypes.length; i++) {
                        if ($scope.tragTypes[i].oid == $scope.editData.trapOIDH){
                            $scope.trapType.triggerType = $scope.tragTypes[i];
                        }
                    };
                    // release type选框赋值
                    if ($scope.editData.trapOIDL){
                        $scope.releaseValue = true;
                        for (var i = 0; i < $scope.tragTypes.length; i++) {
                            if ($scope.tragTypes[i].oid == $scope.editData.trapOIDL){
                                $scope.trapType.releaseType = $scope.tragTypes[i];
                            }
                        }
                    };
                };
                $scope.seveTrapRule = function(){ // 保存编辑状态的trapRule
                    for (var i = 0; i < $scope.gridTrapOptions.data.length; i++) {
                        if ($scope.gridTrapOptions.data[i].$$hashKey == $scope.editRuleStatus){
                            $scope.gridTrapOptions.data[i] = $scope.editData;
                        }
                    };
                    initData();
                    $scope.editRuleStatus = null;
                };

                // 删除的trapRule信息
                $scope.delTrapRule = function(data){
                    if ($scope.editRuleStatus){
                        // TODO
                        // 可不考虑正在编辑的状态，直接保存表格数据
                        alert("Please save the edit rule!");
                        return;
                    }
                    var delIndex = data.$$hashKey;
                    for (var i = 0; i < $scope.gridTrapOptions.data.length; i++) {
                        if ($scope.gridTrapOptions.data[i].$$hashKey == delIndex){
                            $scope.gridTrapOptions.data.splice(i, 1);
                        }
                    };
                };

                // 保存trap信息
                $scope.saveCondition = function(){
                    $scope.initErrorState();
                    $scope.state.processing = true;
                    var data = {
                        triggerId: $scope.activeStatus.triggerActive.triggerId,
                        monitorType: $scope.activeStatus.triggerTypeActive.monitorType,
                        conditions: angular.copy($scope.gridTrapOptions.data)
                    };
                    TriggerService.updateTriggerCondition({triCondition: data}, function(result){
                        $scope.state.processing = false;
                        if (result.success){
                            $scope.state.isSuccess = true;
                            initData();
                            $scope.getCondition();
                        }else{
                            $scope.state.isError = true;
                        }
                    });
                };
            }
        };
    });
    //syslog
    controllers.directive('triggerSyslog', function () {
        return {
            restrict: 'AE',
            templateUrl: "triggerSyslog.html",
            scope: true,
            controller: function ($scope,TriggerService) {
                $scope.gridSyslogOptions = {
                    columnDefs: [
                        {field: 'severity', displayName: 'Severity level', width: "10%", enableHiding: false,
                        cellTemplate: '<a class="{{row.entity.severity|lowercase}}"><md-icon md-svg-icon="bottom:{{row.entity.severity|lowercase}}" ></md-icon></a>'},
                        {field: 'syslogSeverity', displayName: 'Syslog Severity', width: "22%", enableHiding: false, cellFilter:'syslogSeverityF'},
                        {field: 'valueMatch', displayName: 'Value', width: "30%", enableHiding: false, cellFilter:'valueMatch_value'},
                        {field: 'valueMatch', displayName: 'Match Type', width: "22%", enableHiding: false, cellFilter:'valueMatch_type'},
                        {name: 'Action', displayName: 'Action', width: "10%", enableHiding: false,
                        cellTemplate: '<div class="ui-grid-cell-contents"><a type="button" class="btn-grid" ng-click="grid.appScope.editSyslogRule(row.entity)" title="{{&apos;title.edit&apos;|translate}}"><md-icon md-svg-icon="user:edit"></md-icon></a>' +
                        '<a type="button" class="btn-grid" ng-click="grid.appScope.delSyslogRule(row.entity)" title="{{&apos;title.del&apos;|translate}}"><md-icon md-svg-icon="user:remove"></md-icon></a></div>'}
                    ]
                };
                $scope.gridSyslogOptions.data = [];
                // ui-select 多选时 repeat的数组为一对象数组
                $scope.syslogTypes = [{name: 'Emergency'}, {name: 'Alert'}, {name: 'Critical'}, {name: 'Error'}, {name: 'Warning'}, {name: 'Notice'}, {name: 'Informational'}, {name: 'Debug'}];
                $scope.expressions = ['AND', 'OR'];

                // 获取数据
                $scope.$watch('triggerViewData', function(){
                    var data = $scope.triggerViewData;
                    if (data.monitorType!='Syslog') return;
                    $scope.gridSyslogOptions.data = data.conditions;
                    for (var i = 0; i < $scope.gridSyslogOptions.data.length; i++) {
                        var syslogSeverity = [];
                        for (var j = 0; j < $scope.gridSyslogOptions.data[i].syslogSeverity.length; j++) {
                            syslogSeverity[j] = {};
                            syslogSeverity[j]['name'] = $scope.gridSyslogOptions.data[i].syslogSeverity[j];
                        };
                        $scope.gridSyslogOptions.data[i].syslogSeverity = syslogSeverity;
                    };
                });


                // 初始化编辑模块数据
                $scope.editData = {};
                function initData(){
                    $scope.editData = {
                        severity: 'Critical',
                        syslogSeverity: [],
                        expression: 'AND',
                        valueMatch: []
                    };
                    $scope.matchValue = {value: false};
                };
                initData();

                // 页面操作
                $scope.addMatch = function(){
                    if (!$scope.matchValue.value) return;
                    var rule = {};
                    $scope.editData.valueMatch.push(rule);
                };
                $scope.removeMatch = function (index) {
                    if (!$scope.matchValue.value) return;
                    $scope.editData.valueMatch.splice(index, 1);
                };
                // syslog rule 添加
                $scope.addSyslogRule = function(){
                    $scope.gridSyslogOptions.data.push($scope.editData);
                    initData();
                };
                // syslog rule 编辑
                $scope.editSyslogRule = function(data){ // 获取编辑的syslogRule信息
                    $scope.editRuleStatus = data.$$hashKey; //记录编辑的syslog rule
                    $scope.editData = angular.copy(data);
                    if ($scope.editData.expression) $scope.matchValue.value = true;
                };
                $scope.saveSyslogRule = function(){ // 保存编辑状态的SyslogRule
                    for (var i = 0; i < $scope.gridSyslogOptions.data.length; i++) {
                        if ($scope.gridSyslogOptions.data[i].$$hashKey == $scope.editRuleStatus){
                            $scope.gridSyslogOptions.data[i] = $scope.editData;
                        }
                    };
                    initData();
                    $scope.editRuleStatus = null;
                };

                // 删除的SyslogRule信息
                $scope.delSyslogRule = function(data){
                    if ($scope.editRuleStatus){
                        // TODO
                        // 可不考虑正在编辑的状态，直接保存表格数据
                        alert("Please save the edit rule!");
                        return;
                    }
                    var delIndex = data.$$hashKey;
                    for (var i = 0; i < $scope.gridSyslogOptions.data.length; i++) {
                        if ($scope.gridSyslogOptions.data[i].$$hashKey == delIndex){
                            $scope.gridSyslogOptions.data.splice(i, 1);
                        }
                    };
                };
                // 保存编辑状态的trapRule
                $scope.seveTrapRule = function(){
                    for (var i = 0; i < $scope.gridTrapOptions.data.length; i++) {
                        if ($scope.gridTrapOptions.data[i].$$hashKey == $scope.editRuleStatus){
                            $scope.gridTrapOptions.data[i] = $scope.editData;
                        }
                    };
                    initData();
                    $scope.editRuleStatus = null;
                };
                // 保存syslog信息
                $scope.saveCondition = function(){
                    $scope.initErrorState();
                    $scope.state.processing = true;
                    var data = {
                        triggerId: $scope.activeStatus.triggerActive.triggerId,
                        monitorType: $scope.activeStatus.triggerTypeActive.monitorType,
                        conditions: []
                    };
                    // 去掉syslogSeverity中的name
                    for (var i = 0; i < $scope.gridSyslogOptions.data.length; i++) {
                        var syslogSeverity = [];
                        for (var j = 0; j < $scope.gridSyslogOptions.data[i].syslogSeverity.length; j++) {
                            syslogSeverity.push($scope.gridSyslogOptions.data[i].syslogSeverity[j].name);
                        };
                        $scope.gridSyslogOptions.data[i].syslogSeverity = syslogSeverity;
                    };
                    data.conditions = angular.copy($scope.gridSyslogOptions.data);

                    TriggerService.updateTriggerCondition({triCondition: data}, function(result){
                        $scope.state.processing = false;
                        if (result.success){
                            $scope.state.isSuccess = true;
                            initData();
                            $scope.getCondition();
                        }else{
                            $scope.state.isError = true;
                        }
                    });
                };
            }
        };
    });
    //wired traffic
    controllers.directive('triggerTraffic', function () {
        return {
            restrict: 'AE',
            templateUrl: "triggerTraffic.html",
            scope: true,
            controller: function ($scope) {
                $scope.monitorData = {
                    repeatTime: 1,
                    valueType: 'Absolute Value',
                    conditions: {
                        Critical: {enable: false,HCondition: {threshold: 0,unitType: $scope.subViewChoice.unitType,expression: "<"},
                            LCondition: {threshold: 0,unitType: $scope.subViewChoice.unitType,expression: "<"},alert: false},
                        Warning: {enable: false,HCondition: {threshold: 0,unitType: $scope.subViewChoice.unitType,expression: "<"},
                            LCondition: {threshold: 0,unitType: $scope.subViewChoice.unitType,expression: "<"},alert: false},
                        Info: {enable: false,HCondition: {threshold: 0,unitType: $scope.subViewChoice.unitType,expression: "<"},
                            LCondition: {threshold: 0,unitType: $scope.subViewChoice.unitType,expression: "<"},alert: false}
                    }
                };
                $scope.units = {
                    kb: ['KB', 'MB', 'GB', 'TB', 'PB'],
                    bps: ['Kbps', 'Mbps', 'Gbps', 'Tbps', 'Pbps'],
                    pps: ['Kpps', 'Mpps', 'Gpps', 'Tpps', 'Ppps'],
                    bits: ['Kbits', 'Mbits', 'Gbits', 'Tbits', 'Pbits'],
                    byte: ['KB', 'MB', 'GB', 'TB'],
                };
                // 获取数据
                $scope.$watch('triggerViewData', function(){
                    var data = $scope.triggerViewData;
                    if (!data.repeatTime) return;
                    $scope.monitorData.repeatTime = data.repeatTime;
                    $scope.monitorData.valueType = data.valueType;
                    $scope.monitorData.conditions.Critical = data.Critical;
                    $scope.monitorData.conditions.Warning = data.Warning;
                    $scope.monitorData.conditions.Info = data.Info;
                    // 为每项添加默认单位 
                    // for(condition in $scope.monitorData.conditions){
                    //     if ($scope.monitorData.conditions[condition].HCondition)
                    //         $scope.monitorData.conditions[condition].HCondition.unitType = data.unitType;
                    //     if($scope.monitorData.conditions[condition].LCondition)
                    //         $scope.monitorData.conditions[condition].LCondition.unitType = data.unitType
                    // }
                });
                $scope.saveMonitor = function(){
                    $scope.initErrorState();
                    $scope.state.processing = true;
                    var data = {
                        triggerId: $scope.activeStatus.triggerActive.triggerId,
                        monitorType: $scope.activeStatus.triggerTypeActive.monitorType,
                        monitorParam: $scope.subViewChoice.paramName,
                        repeatTime: $scope.monitorData.repeatTime,
                        valueType: $scope.monitorData.valueType
                    };
                    // 转换成接口所需格式
                    for(condition in $scope.monitorData.conditions){
                        // ToDo
                        // 根据单位转换数据，删除多余单位字段
                        // if($scope.monitorData.conditions[condition].HCondition.unitType != data.unitType){
                        //     // $scope.monitorData.conditions[condition].HCondition.threshold
                        // };
                        // if($scope.monitorData.conditions[condition].LCondition.unitType != data.unitType){
                        //     // $scope.monitorData.conditions[condition].HCondition.threshold
                        // };
                        data[condition] = $scope.monitorData.conditions[condition];
                    };
                    TriggerService.updateTriggerCondition({triCondition: data}, function(result){
                        $scope.state.processing = false;
                        if (result.success){
                            $scope.state.isSuccess = true;
                            $scope.getCondition();
                        }else{
                            $scope.state.isError = true;
                        }
                    });
                };
            }
        };
    });
    //ping
    controllers.directive('triggerPing', function () {
        return {
            restrict: 'AE',
            templateUrl: "triggerPing.html",
            scope: true,
            controller: function ($scope) {
                $scope.monitorData = {
                    repeatTime: 1,
                    valueType: 'Absolute Value',
                    conditions: {
                        Critical: {enable: true,HCondition: {type: 'Online'},
                            LCondition: {type: 'Offline'},alert: true},
                        Warning: {enable: false,HCondition: {type: 'Response Time',threshold: 200,expression: "<"},
                            LCondition: {type: 'Response Time',threshold: 100,expression: "<"},alert: false},
                        Info: {enable: false,HCondition: {type: 'Response Time',threshold: 50,expression: "<"},
                            LCondition: {type: 'Response Time',threshold: 10,expression: "<"},alert: false}
                    }
                };
                // 获取数据
                $scope.$watch('triggerViewData', function(){
                    var data = $scope.triggerViewData;
                    if (!data) return;
                    // 转换成页面所需格式
                    // $scope.monitorData.repeatTime = data.repeatTime;
                    // $scope.monitorData.valueType = data.valueType;
                    // $scope.monitorData.conditions.Critical = data.Critical;
                    // $scope.monitorData.conditions.Warning = data.Warning;
                    // $scope.monitorData.conditions.Info = data.Info;
                });
                $scope.saveMonitor = function(){};
            }
        };
    });
});