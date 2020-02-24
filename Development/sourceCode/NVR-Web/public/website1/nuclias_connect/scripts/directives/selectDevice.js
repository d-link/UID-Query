/**
 * Created by guojiangchao on 2017/6/2.
 */
define(['directiveModule', 'angular-ui-grid'], function (directives) {
    directives.controller('selectDeviceController', function ($rootScope, $http, $scope, $timeout, InventoryService) {
        $scope.radioSelect = {value: ''};
        /*$scope.optionNet = [
            { networkId: '111', networkName: 'network1',groups: [{groupId: 'Router1', devices: [{ip:"172.18.190.1",networkName:"network1",sysName:"hehe",_id:""}]}]},
            { networkId: '222', networkName: 'network1',groups: [{groupId: 'Router2', devices: [{ip:"172.18.190.2",networkName:"network1",sysName:"hehe",_id:""}]}]},
            { networkId: '333', networkName: 'network1',groups: [{groupId: 'Router3', devices: [{ip:"172.18.190.3",networkName:"network1",sysName:"hehe",_id:""}]}]}
        ];*/
        InventoryService.getDevicesByOrg(function(result){
            if (result.success) {
                //console.log(result);
                $scope.optionNet = result.data;
                $scope.selectFilter = {
                    selectNetwork: $scope.optionNet[0],
                };
                $scope.selectFilter.selectGroup = $scope.selectFilter.selectNetwork.groups[0];
               /* $scope.deviceList = [
                    {_id: '111', name: 'device1',ip: '172.18.190.1',network: 'network1'},
                    {_id: '222', name: 'device2',ip: '172.18.190.2',network: 'network2'},
                    {_id: '333', name: 'device3',ip: '172.18.190.3',network: 'network2'}
                ];*/

                $scope.deviceList =  $scope.selectFilter.selectGroup.devices;

                $scope.$on('clearSeletedDev', function(d,type) {
                    $scope.saveSelect = [];
                    $scope.selectedDevids = [];
                });

                $scope.selectAll = {value: false};

                $scope.changeNetwork = function(index, item){
                    $scope.selectFilter.selectGroup = $scope.selectFilter.selectNetwork.groups[0];
                };
                $scope.changeGroup = function(index, item){
                    $scope.deviceList = $scope.selectFilter.selectGroup.devices;
                };
                $scope.selectAllDev = function(){
                    let devIds = [];
                    for (var i = 0; i < $scope.deviceList.length; i++) {
                        $scope.deviceList[i].select = $scope.selectAll.value;
                        devIds.push($scope.deviceList[i]._id);
                    };
                    $scope.selectedDevids = devIds;
                };
                $scope.devChoice = function(device){
                    //$scope.selectedDevids.push(device._id);
                    if (device.select) {
                        if($scope.selectedDevids.indexOf(device._id) ==-1){
                            $scope.selectedDevids.push(device._id);
                        }
                        for (var i = 0; i < $scope.deviceList.length; i++) {
                            if(!$scope.deviceList[i].select){
                                return;
                            }
                        };
                        $scope.selectAll.value = true;
                    }else{
                        if($scope.selectedDevids.indexOf(device._id)!=-1){
                            let index = $scope.selectedDevids.indexOf(device._id);
                            $scope.selectedDevids.splice(index,1);
                        }
                        $scope.selectAll.value = false;
                    };
                };
            }
        });
    });
    directives.directive('selectDevice', function () {
        return {
            scope: {
                selectedDevids: '=',
                type: '='
            },
            restrict: 'AE',
            controller: 'selectDeviceController',
            templateUrl: './scripts/directives/selectDevice.html'

        };
    });
});