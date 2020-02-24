/**
 * Created by lizhimin on 2016/1/26.
 */
define(["controllerModule"], function (controllers) {
    controllers.controller('notificationSetController', function ($scope,$timeout,$uibModal, NotificationService){
        setHeight('set-height',['elementFlag'],12);
        $timeout(function(){
            setGridHeight('grid')
        },100);
        $scope.timer = null;
        window.onresize = function(){
            setHeight('set-height',['elementFlag'],12);
            $timeout.cancel($scope.timer);
            $scope.timer = $timeout(function(){
                setGridHeight('grid')
            },300);
        }
        $scope.gridOptions={
            enableHiding: false,
            paginationTemplate: './views/templates/gridBurster.html',
            columnDefs:[
                {field: 'name', displayName: 'Name',  width: "9%", enableHiding: false},
                {field: 'status', displayName: 'Status',  width: "8%", enableHiding: false},
                {field: 'deviceNum', displayName: 'Source Device',  width: "8%", enableHiding: false},
                {field: 'monitorParam', displayName: 'Sensor',  width: "16%", enableHiding: false},
                {field: 'severity', displayName: 'Trigger Event',  width: "18%", enableHiding: false},
                {field: 'doAction', displayName: 'Method',  width: "13%", enableHiding: false},
                {field: 'lastSend', displayName: 'Last Notify Time',  width: "20%", enableHiding: false},
                {name: 'Action', displayName: 'Action', width: "150", enableHiding: false,
                    cellTemplate: '<div class="ui-grid-cell-contents"><a type="button"class="btn-grid" ng-click="grid.appScope.editStatus(row.entity)" title="{{&apos;title.pause&apos;|translate}}"><md-icon ng-if="grid.appScope.showStatus(row.entity)" md-svg-icon="user:pause"></md-icon>'+
                    '<md-icon ng-if="!grid.appScope.showStatus(row.entity)" title="{{&apos;title.active&apos;|translate}}" md-svg-icon="user:start"></md-icon></a>' +
                    '<a type="button" class="btn-grid" ng-click="grid.appScope.editNotifyRule(row.entity)" title="{{&apos;title.edit&apos;|translate}}"><md-icon md-svg-icon="user:edit"></md-icon></a>' +
                    '<a type="button" class="btn-grid" ng-click="grid.appScope.delNotifyRule(row.entity)" title="{{&apos;title.del&apos;|translate}}"><md-icon md-svg-icon="user:remove"></md-icon></a></div>'}
               // {field: 'name', displayName: 'Action',  width: "200", enableHiding: false}
            ]
        };
       // $scope.status = true;
        $scope.showStatus = function (rule) {
            if(rule.status == "Active"){
                return true;
            }else{
                return false;
            }
        };
        $scope.editStatus = function (rule) {
            if(rule.status == "Pause"){
                rule.status = "Active";
            }else{
                rule.status = "Pause";
            }
            //调改变status的接口
            $scope.showStatus(rule);
            NotificationService.editStatus(rule._id, rule.status, function (result) {
                if(result.success){
                    //修改成功
                }
            })
        }
        $scope.gridOptions.data=[];
        $scope.editNotifyRule = function (rule) {
            $scope.openAddModel(rule);
        };
        $scope.delNotifyRule = function (rule) {
            NotificationService.deleteNotifyRule(rule._id, function (data) {
                getNotifyRule();
            });
        };
        $scope.openAddModel=function(rule){
            var modalInstance = $uibModal.open({
                backdrop:'static',
                animation: true,
                keyboard:false,
                templateUrl: './views/notifications/addNotificationRule.html',
                size: 'w600',
                scope: $scope,
                windowClass: 'modal-addNotificationRule',
                resolve: {
                    rule: function () {
                        return rule;
                    }
                },
                controller: 'addNotificationRuleController'
            });
            modalInstance.result.then(function (data) {
                if(rule){
                    delete data.deviceNum;
                    NotificationService.updateNotifyRule(data, function (result) {
                        if(result.success) {
                            getNotifyRule();
                        }
                    });
                }else{
                    //data.lastSend = new Date();
                    NotificationService.createNotifyRule(data, function (result) {
                        if(result.success) {
                            getNotifyRule();
                        }
                    });
                }
            });
        }
        function getNotifyRule() {
            NotificationService.getNotifyRule(function (result) {
                if(result.success){
                    $scope.gridOptions.data = result.data;
                }
            })
        }
        getNotifyRule();
    });
});