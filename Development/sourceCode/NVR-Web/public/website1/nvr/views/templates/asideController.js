/*
 * @Description:侧边栏控制器
 * @Version: 0.4.0
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-24 14:38:12
 * @LastEditRelease:
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-02-25 10:08:27
 */
define([
    'controllerModule'
], function (controllers) {
    'use strict';
    controllers.controller('asideCtrl', function ($scope, moudlesService) {
        moudlesService.moudles().then(function (data) {
            $scope.moudle = data;
        });
        $scope.showSub = function (id) {
            moudlesService.showMenu(id);
            changeDivHeight();
        };
        $scope.openSub = function (id) {
            moudlesService.openMenu(id);
            changeDivHeight();
        };
        $scope.getArrow = function (isOpen) {
            if (isOpen) {
                return "bottom:left_arrow_down";
            } else {
                return "bottom:left_arrow_right";
            }
        };
    })
});