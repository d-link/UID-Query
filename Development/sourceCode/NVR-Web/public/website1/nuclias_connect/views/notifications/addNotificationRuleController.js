/**
 * Created by lizhimin on 2016/5/30.
 */
define(["controllerModule"], function (controllers) {
    controllers.controller('addNotificationRuleController', function ($scope, $uibModalInstance, rule, NotificationService) {
        $scope.title = rule?'edit':'create';

        $scope.steps = [{index: 1, title: 'Notification Rule Properties', status: 'active'},
            {index: 2, title: 'Select Conditions', status: 'valid'},
            {index: 3, title: 'Set Notification Detail', status: 'valid'}];
        $scope.step = 1;
        $scope.typeList = [];
       /* $scope.devices = [];
        $scope.method = {value: 'SendEmail'};
        $scope.severity = {critical:true, warning:true, info:true};*/
        $scope.applyTo = {value: 'itself'};
        $scope.notification = {
            name: '',
            desc: '',
            EmailList: [],
            devIds: [],
            status:"Active",
            commandLine:'',
            monitor: {param:"CPUUtilization", type:"CPUUtilization"}
        };
        $scope.severity = {critical:true, warning:true, info:true};
        $scope.method = {value: 'SendEmail'};
        if (rule) {
            let notify = angular.copy(rule);
            console.log(notify);
            $scope.notification = notify;
            $scope.notification.monitor= {param:notify.monitorParam, type:notify.monitorType};
            delete notify.monitorType;
            delete notify.monitorParam;
            $scope.method= {value:notify.doAction};

            let d = {};
            if(notify.severity.indexOf('critical')!=-1){
                d.critical = true;
            }else{
                d.critical = false;
            }
            if(notify.severity.indexOf("warning")!=-1){
                d.warning = true;
            }else{
                d.warning = false;
            }
            if(notify.severity.indexOf("info")!=-1){
                d.info = true;
            }else{
                d.info = false;
            }
            $scope.severity = d;
        }
        $scope.emailValue = {value: ''};
        // step2 表格
        //$scope.monitors = [{name: 'CPU Load'}, {name: 'Memory used'}];
        NotificationService.getMoniterItems(function (result) {
            if(result.success){
                let param = [];
                let data = result.data;
                for(let item of data){
                    let monitorType = item.monitorType;
                    let paramName = item.monitorParam;
                    for(let p of paramName) {
                        param.push({type: monitorType, param: p});
                    }
                }
                $scope.monitors = param;
                //$scope.notification.monitor = param[0];
            }
        });

        // step 3
        $scope.addEmail = function(){
            if ($scope.emailValue.value!='') {
                $scope.notification.EmailList.push($scope.emailValue.value);
            };
            $scope.emailValue.value = '';
        }
        $scope.removeEmail = function(index){
            $scope.notification.EmailList.splice(index, 1);
        }

        $scope.next=function(){
            $scope.step+=1;
        };
        $scope.pre=function(){
            $scope.step-=1;
        };
        $scope.ok=function(){
            var data = $scope.notification;
            data.doAction=$scope.method.value;
            data.monitorParam= data.monitor.param;
            data.monitorType= data.monitor.type;
            delete data.monitor;
            let severits = [];
            if($scope.severity.critical == true){
                severits.push("critical");
            }
            if($scope.severity.warning == true){
                severits.push("warning");
            }
            if($scope.severity.info == true){
                severits.push("info");
            }
            data.severity = severits;
            $uibModalInstance.close(data);
        };
        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    })
});