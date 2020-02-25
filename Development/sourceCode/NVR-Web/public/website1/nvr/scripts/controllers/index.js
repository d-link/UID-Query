/*
 * @Description: 注册首页控制器，nvr全局控制器，在index.html标签中要绑定该控制器
 * @Version: 0.4.0
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-21 09:48:46
 * @LastEditRelease: 
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-02-24 16:56:09
 */
define([
    // 'controllerModule',
    // 所有控制器在这里引入，意味着一开始就会全部加载，会影响速度，后续改用按需加载
    '../public/scripts/common/globalController',

    'views/cameras/cameraDetailController',
    'views/cameras/camerasController',
    'views/templates/navController',
    'views/templates/asideController',
], function (controllers) {
    'use strict';
    // 给index也添加一个控制器
    // controllers.controller('indexController', function ($scope) {
    //     console.log('indexController')
    //     $scope.title = 'indexController'
    // })
});