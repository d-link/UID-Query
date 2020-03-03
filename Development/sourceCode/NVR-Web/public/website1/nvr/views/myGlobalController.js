/*
 * @Description: nvr自己的全局控制器，
 
 * @Version: 0.4.0
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-03-03 11:50:28
 * @LastEditNote: 
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-03-03 13:46:37
 */
define([
    'controllerModule',
], function (controllers) {
    'use strict';
    controllers.controller('myGlobalCtrl', function ($scope, ) {
        // 全局监听窗口尺寸变化
        window.onresize = function () {
            // 向子作用域发广播
            $scope.$broadcast('resize');
        };
    })
});