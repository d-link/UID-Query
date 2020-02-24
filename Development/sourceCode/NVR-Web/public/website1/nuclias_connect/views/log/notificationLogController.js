/**
 * Created by lizhimin on 2016/4/25.
 */
define(["controllerModule"], function (controllers) {
    controllers.controller('notificationLogController', function ($scope, $uibModal, $state, $timeout, $http, Current, LogService) {
        setHeight();
        $timeout(function(){
            setGridHeight('log-all', true);
        },100);
        $scope.timer = null;
        window.onresize = function(){
            setHeight();
            $timeout.cancel($scope.timer);
            $scope.timer = $timeout(function(){
                var gridId = $scope.showTab;
                setGridHeight(gridId, true);
            },300);
        }
        $scope.showTab='log-all';
        $scope.changeTab = function(gridId) {
            $scope.showTab = gridId;
            $timeout(function(){
                setGridHeight(gridId, true);
            },100);
        }
        // $scope.show={
        //     tab1:false,
        //     tab2:false,
        //     tab3:false
        // };
        // $scope.changeTabShow=function(){
        //     $scope.show.tab1=false;
        //     $scope.show.tab2=false;
        //     $scope.show.tab3=false;
        // };
        $scope.allOptions = {
            enableGridMenu: true,
            paginationPageSizes: [20, 25, 50],
            paginationTemplate: './views/templates/gridBurster.html',
            paginationPageSize: 20,
            // useExternalPagination: true
        };
        // $scope.allOptions.columnDefs = [
        //     {field: 'eventTime',  width: "10%", displayName: 'Time' },
        //     {field: 'eventLevel', displayName: 'Level',  width: "8%"},
        //     {field: 'alertMessage', displayName: 'Alert Message',  width: "32%"},
        //     {field: 'eventType', displayName: 'Event Type',  width: "10%"},
        //     {field: 'source', displayName: 'Source',  width: "10%"},
        //     {field: 'alertTimes', displayName: 'Alert Time',  width: "10%"},
        //     {field: 'readUser', displayName: 'Deal User', width: "10%"},
        //     {field: 'action', displayName: 'Action', width: "10%"}
        // ];
        $scope.allOptions.columnDefs = [
            {
                field: 'severity', displayName: 'Severity', width: "8%", enableHiding: false,
                cellTemplate: '<a class="{{row.entity.severity|lowercase}}"><md-icon md-svg-icon="bottom:{{row.entity.severity|lowercase}}" title="{{\'common.\'+row.entity.severity|lowercase|translate}}"></md-icon></a>'
            },
            {
                field: 'monitorType', width: "12%", enableHiding: false, displayName: 'Monitor Type'
            },
            {
                field: 'events', type: 'object', displayName: 'Alert Message', width: "30%", enableHiding: false,
                cellTemplate: '<div class="ui-grid-cell-contents"><span title="{{row.entity|alertDetail}}">{{row.entity|alertDetail}}</span></div>'
            },
            {
                field: 'source.sysName', displayName: 'Source', width: "12%", enableHiding: false,
                cellTemplate: '<div class="ui-grid-cell-contents"><a style="cursor:pointer;" target="_blank" rel="noopener noreferrer" ui-sref="user.org.menuDetails(grid.appScope.gotoDetail(row.entity.source))" ' +
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
        $scope.criticalOptions={paginationPageSizes: [20,50,100],
            paginationPageSize: 50,
            paginationTemplate: './views/templates/gridBurster.html',
            // useExternalPagination: true
        };
        $scope.criticalOptions.columnDefs= $scope.allOptions.columnDefs;
        $scope.warningOptions={paginationPageSizes: [20,50,100],
            paginationPageSize: 50,
            paginationTemplate: './views/templates/gridBurster.html',
            // useExternalPagination: true
        };
        $scope.warningOptions.columnDefs= $scope.allOptions.columnDefs;
        $scope.infoOptions={paginationPageSizes: [20,50,100],
            paginationPageSize: 50,
            paginationTemplate: './views/templates/gridBurster.html',
            // useExternalPagination: true
        };
        $scope.infoOptions.columnDefs= $scope.allOptions.columnDefs;

        LogService.getAllNotification(function(result){
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
            }
        })
    });
});