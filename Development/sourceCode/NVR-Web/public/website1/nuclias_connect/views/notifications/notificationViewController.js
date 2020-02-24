/**
 * Created by lizhimin on 2016/4/25.
 */
define(["controllerModule"], function (controllers) {
    controllers.controller('notificationViewController', function ($scope, $uibModal, $state, $timeout, $http, Current, NotificationService, $stateParams) {
        setHeight();
        $timeout(function () {
            setGridHeight('notification-all', true)
        }, 100);
        $scope.timer = null;
        window.onresize = function(){
            setHeight();
            $timeout.cancel($scope.timer);
            $scope.timer = $timeout(function(){
                var gridId = $scope.showTab;
                setGridHeight(gridId, true);
            },300);
        }
        $scope.timer = null;
        window.onresize = function(){
            setHeight();
            $timeout.cancel($scope.timer); 
            $scope.timer = $timeout(function(){
                var gridId = $scope.showTab;
                setGridHeight(gridId, true);
            },300);
        }
        $scope.showTab = 'notification-all';
        $scope.show = {
            tab1: false,
            tab2: false,
            tab3: false
        };

        $scope.changeTabShow = function () {
            $scope.show.tab1 = false;
            $scope.show.tab2 = false;
            $scope.show.tab3 = false;
        };
        var _critical = false, _warning = false, _info = false;
        var _all=true;
        $scope.showTabFun = function (index) {
            if(index==0){
                if (!_all) {
                    _all = true;
                    $scope.showTab = 'notification-all';
                    $timeout(function () {
                        setGridHeight('notification-all', true);
                    }, 100);

                }
            }
            if (index == 1) {
                $scope.show.tab1 = true;
                if (!_critical) {
                    _critical = true;
                    $scope.showTab = 'notification-critical';
                    $timeout(function () {
                        setGridHeight('notification-critical', true);
                    }, 100);

                }
            }
            if (index == 2) {
                $scope.show.tab2 = true;
                if (!_warning) {
                    _warning = true;
                    $scope.showTab = 'notification-warning';
                    $timeout(function () {
                        setGridHeight('notification-warning', true);
                    }, 100);

                }
            }
            if (index == 3) {
                $scope.show.tab3 = true;
                if (!_info) {
                    _info = true;
                    $scope.showTab = 'notification-info';
                    $timeout(function () {
                        setGridHeight('notification-info', true);
                    }, 100);
                }
            }
        };
        function showType(type) {
            if(type=='All'){
                $scope.active = 0;
            }
            if (type == 'Info') {
                $scope.active = 3;
            }
            if (type == 'Warning') {
                $scope.active = 2;
            }
            if (type == 'Critical') {
                $scope.active = 1;
            }
        }

$scope.GridOptions={All:{option:{},gridApi:null,selectedAlerts:[],isShow:false},
    Critical:{option:{},gridApi:null,selectedAlerts:[],isShow:false},
    Warning:{option:{},gridApi:null,selectedAlerts:[],isShow:false},
    Info:{option:{},gridApi:null,selectedAlerts:[],isShow:false}};
for(var op in $scope.GridOptions){

}
        $scope.allOptions = {
            enablePagination: true, //是否分页，默认为true
            paginationPageSizes: [25, 50, 100],
            paginationPageSize: 50,
            paginationTemplate: './views/templates/gridBurster.html',
            // enableRowSelection: true,
            // enableSelectAll: true,
            enableColumnResizing: true,
            // selectionRowHeaderWidth: '36',
            // multiSelect: true
        };
        $scope.allOptions.columnDefs = [
            {
                field: 'severity',
                displayName: 'Severity',
                width: "8%",
                enableHiding: false,
                cellTemplate: '<a class="{{row.entity.severity|lowercase}}"><md-icon md-svg-icon="bottom:{{row.entity.severity|lowercase}}" title="{{\'common.\'+row.entity.severity|lowercase|translate}}"></md-icon></a>'
            },
            {
                field: 'monitorType', width: "12%", enableHiding: false, displayName: 'Monitor Type'
            },
           {
                field: 'events',
                type: 'object',
                displayName: 'Alert Message',
                width: "30%",
                enableHiding: false,
                cellTemplate: '<div class="ui-grid-cell-contents"><span title="{{row.entity|alertDetail}}">{{row.entity|alertDetail}}</span></div>'
            },
          /*  {field: 'triggerName', displayName: 'Trigger Name', width: "10%"},*/
            {field: 'source.sysName', displayName: 'Source', width: "12%", enableHiding: false, cellTemplate: '<div class="ui-grid-cell-contents"><a style="cursor:pointer;" target="_blank" rel="noopener noreferrer" ui-sref="user.org.menuDetails(grid.appScope.gotoDetail(row.entity.source))" ' +
            '>{{row.entity.source.sysName?row.entity.source.sysName:"N/A"}}</a></div>'},
            {
                field: 'lastTime', width: "12%", enableHiding: false, displayName: 'Last Time', type: 'date',
                cellFilter: 'date:"yyyy-MM-dd HH:mm:ss"'
            },
            {
                field: 'firstTime', width: "12%", enableHiding: false, displayName: 'First Time', type: 'date',
                cellFilter: 'date:"yyyy-MM-dd HH:mm:ss"'
            },
            {field: 'repeatCount', displayName: 'Alert Times', width: "8%", enableHiding: false},
            {
                field: 'action', displayName: 'Action', width: "8%", enableHiding: false,
                cellTemplate: ' <div class="ui-grid-cell-contents"><a class="btn-grid" ng-click="grid.appScope.showDetail(row.entity)" title="{{&apos;title.view&apos;|translate}}"><md-icon md-svg-icon="user:view"></a></div>'
            }
        ];
        $scope.goto = {parentId: 'monitor', moudleId: 'accessPoint', pageId: 'deviceDetail', id: 'test switch'};
        $scope.gotoDetail = function (device) {
            $scope.goto.id = device.devId;
            return $scope.goto;
            //  $state.go("user.org.menuDetails",$scope.goto,{location :false});
        };
        // $scope.acknowledgeAlerts=function(){
        //     if ($scope.allGridApi.selection) {
        //         var selectNodes = $scope.allGridApi.selection.getSelectedRows();
        //         var selectNodeIds = [];
        //         for (var i = 0; i < selectNodes.length; i++) {
        //             selectNodeIds.push(selectNodes[i]._id);
        //         }
        //         NotificationService.acknowledgeAlert(selectNodeIds,function(result){
        //             if(result.success){

        //             }
        //         })
        //     }

        // }
        $scope.criticalOptions = angular.copy($scope.allOptions);
        $scope.criticalOptions.columnDefs = $scope.allOptions.columnDefs;
        $scope.warningOptions = angular.copy($scope.allOptions);
        $scope.warningOptions.columnDefs = $scope.allOptions.columnDefs;
        $scope.infoOptions = angular.copy($scope.allOptions);
        $scope.infoOptions.columnDefs = $scope.allOptions.columnDefs;

        $scope.keepOld=function(item){

        }
        $scope.applyNew=function(item){

        }
       //取Event信息
        $scope.showDetail = function (items) {
            var modalInstance = $uibModal.open({
                backdrop:'static',
                animation: true,
                keyboard:false,
                templateUrl: 'notificationDetail.html',
                size: 'w800',
                resolve: {
                    items: function () {
                        return items;
                    }
                },
                controller: function ($scope, $uibModalInstance,NotificationService, items) {
                    $scope.detailOptions = {
                        columnDefs: [{
                            field: 'eventTime', displayName: 'Time', width: "20%",
                            type: 'date',
                            cellFilter: 'date:"yyyy-MM-dd HH:mm:ss"'
                        }]
                    };
                    var detail1 =
                    {
                        field: 'events',
                            type: 'object',
                        displayName: 'Event Message',
                        width: "76%",
                        enableHiding: false,
                        cellTemplate: '<div class="ui-grid-cell-contents"><span title="{{row.entity|notification_commonFilter}}">{{row.entity|notification_commonFilter}}</span></div>'
                    };
                    var detail2 =
                    {
                        field: 'events',
                        type: 'object',
                        displayName: 'Event Message',
                        width: "76%",
                        enableHiding: false,
                        cellTemplate: '<div class="ui-grid-cell-contents"><span title="{{row.entity|notification_trapFilter}}">{{row.entity|notification_trapFilter}}</span></div>'
                    };
                    var detail3 =
                    {
                        field: 'events',
                        type: 'object',
                        displayName: 'Event Message',
                        width: "76%",
                        enableHiding: false,
                        cellTemplate: '<div class="ui-grid-cell-contents"><span title="{{row.entity|notification_syslogFilter}}">{{row.entity|notification_syslogFilter}}</span></div>'
                    };

                    if (items.monitorType == 'Trap') {
                        $scope.detailOptions.columnDefs.push(detail2);
                    }
                    else if (items.monitorType == 'Syslog') {
                        $scope.detailOptions.columnDefs.push(detail3);
                    }else {
                            $scope.detailOptions.columnDefs.push(detail1);
                    }
                    if(!items.eventType){
                        NotificationService.getAlertDetails(items.monitorType,items.eventIds,function(result){
                            $scope.detailOptions.data = result.data;
                        });
                    }
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    }
                }
            });
            modalInstance.result.then(function (data) {
            });
        };
        $scope.allDisabled = true;
        $scope.criticalDisabled = true;
        $scope.warningDisabled = true;
        $scope.infoDisabled = true;
        // $scope.allOptions.onRegisterApi = function (gridApi) {
        //     $scope.allGridApi = gridApi;
        //     gridApi.selection.on.rowSelectionChangedBatch($scope, function (rows) {
        //         checkAllSelected();
        //     });
        //     gridApi.selection.on.rowSelectionChanged($scope, function (row) {
        //         checkAllSelected();
        //     });
        // };
        // function checkAllSelected() {
        //     if ($scope.allGridApi.selection) {
        //         $scope.allSelected= $scope.allGridApi.selection.getSelectedRows();
        //         if ($scope.allSelected.length > 0) {
        //             $scope.allDisabled = false;

        //         } else {
        //             $scope.allDisabled = true;
        //         }
        //     }
        // }
        // $scope.criticalOptions.onRegisterApi = function (gridApi) {
        //     $scope.criticalGridApi = gridApi;
        //     gridApi.selection.on.rowSelectionChangedBatch($scope, function (rows) {
        //         checkCriticalSelected();
        //     });
        //     gridApi.selection.on.rowSelectionChanged($scope, function (row) {
        //         checkCriticalSelected();
        //     });
        // };
        // function checkCriticalSelected() {
        //     if ($scope.criticalGridApi.selection) {
        //         $scope.criticalSelected= $scope.criticalGridApi.selection.getSelectedRows();
        //         if ($scope.criticalSelected.length > 0) {
        //             $scope.criticalDisabled = false;

        //         } else {
        //             $scope.criticalDisabled = true;
        //         }
        //     }
        // }
        function getAllNotification(type) {
            NotificationService.allNotification(function (result) {
                if (result.success) {

                    $scope.allOptions.data = result.data;
                    $scope.criticalOptions.data = result.data.filter(function (value) {
                        if (value.severity == 'Critical') {
                            return true;
                        }
                        return false;
                    });
                    $scope.warningOptions.data = result.data.filter(function (value) {
                        if (value.severity == 'Warning') {
                            return true;
                        }
                        return false;
                    });
                    $scope.infoOptions.data = result.data.filter(function (value) {
                        if (value.severity == 'Info') {
                            return true;
                        }
                        return false;
                    });
                    showType(type);
                    // $scope.criticalOptions.data = [critical, critical1];
                    //$scope.warningOptions.data = [warning];
                    // $scope.infoOptions.data = [info];
                }
            });
        }

        if ($stateParams.type) {
            Current.setNotification($stateParams.type);
        }
        $scope.$on('notificationType', function(d,type) {  
            getAllNotification(type);
            Current.setNotification('all');
        }); 
        getAllNotification(Current.getNotification());
        Current.setNotification('all');
        // $timeout(function () {
        //     resetGridSize('notification-all');
        // }, 100);
        // function resetGridSize(gridId) {

        //     var left = document.getElementsByClassName('main-sidebar')[0];
        //     if (left) {
        //         var newHeight = left.clientHeight - 160;
        //         var grid = document.getElementById(gridId);
        //         if (grid) {
        //             angular.element(grid).css('height', newHeight + 'px');
        //         }
        //     }
        // };
    });

});