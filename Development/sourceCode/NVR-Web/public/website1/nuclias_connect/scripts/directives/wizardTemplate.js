/**
 * Created by lizhimin on 2016/8/31.
 */
define(['directiveModule'], function (directives) {
    directives.controller('wizardController', function ($rootScope, $http, $scope) {
        if (!$scope.steps) {
            $scope.steps = [{index: 1, title: 'Choose Sensor', status: 'complete'},
                {index: 2, title: 'Choose Devices', status: 'active'},
                {index: 3, title: 'Create Trigger Conditions', status: 'invalid'},
                {index: 4, title: 'Confirm', status: 'invalid'}];
        }
        $scope.lastIndex = $scope.steps.length;
        $scope.currentStep = {index: 2, title: 'Choose Devices', status: 'active'};
        $scope.preIndex=1;
        $scope.$watch('currentIndex', function (value) {
            if(value>$scope.preIndex){
                $scope.steps[$scope.preIndex-1].status='complete';
            }
            if(value<$scope.preIndex){
                $scope.steps[$scope.preIndex-1].status='valid';
            }
            $scope.currentStep=$scope.steps[$scope.currentIndex-1];
            $scope.steps[$scope.currentIndex-1].status='active';
            $scope.preIndex=value;
        });
    });
    directives.directive('wizardTemplate', function () {
        return {
            scope: {
                steps: '=',
                currentIndex:'='
            },
            restrict: 'AE',
            controller: 'wizardController',
            templateUrl: './scripts/directives/wizardTemplate.html'

        };
    });
})
;