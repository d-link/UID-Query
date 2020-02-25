/*
 * @Description: 
 * @Version: 0.4.0
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-21 09:50:45
 * @LastEditRelease: 
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-02-24 14:41:04
 */
define([
    'controllerModule'
], function (controllers) {
    'use strict';
    controllers.controller('camerasCtrl', function ($scope) {
        console.log('camerasCtrl')
        var arr = [];
        for (var i = 0; i < 20; i++) {
            arr.push({
                name: i + '----'
            })
        }
        $scope.list = arr
    })
});