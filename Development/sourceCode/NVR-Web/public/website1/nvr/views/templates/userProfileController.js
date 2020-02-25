/*
 * @Descriptio：顶部nav控制器
 * @Version: 0.4.0
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-24 14:38:12
 * @LastEditRelease:
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-02-25 17:53:32
 */
define([
    'controllerModule'
], function (controllers) {
    'use strict';
    controllers.controller('userProfileController', function ($scope, $uibModalInstance) {
        $scope.title = '123';
        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    })
});