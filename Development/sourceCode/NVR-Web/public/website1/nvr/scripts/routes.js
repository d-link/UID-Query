/*
 * @Description: 路由
 * @Version: 0.0.1
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-20 11:34:43
 * @LastEditRelease: 
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-02-25 10:11:48
 */
define([
    'app',
], function (app) {
    'use strict';
    // 配置图标路径
    app.config(function ($mdIconProvider, $sceDelegateProvider) {
        $sceDelegateProvider.resourceUrlWhitelist(['**', 'self']);
        /**
       *  <md-icon md-svg-icon="menu:{{id}}"></md-icon>
       * :后面是.svg文件内部对应的图标的id。
       * 一个svg文件可以放多个图标
       */
        $mdIconProvider
            // 左侧菜单图标
            .iconSet('menu', 'images/common/leftmenu.svg', 24)
            // 左侧菜单箭头
            .iconSet('bottom', "images/common/head_bottom.svg", 16)

    });
    // 配置路由
    app.config(function ($mdIconProvider, $stateProvider, $urlRouterProvider) {
        console.log($mdIconProvider)
        // user是父，都以user开头
        $stateProvider.state('user', {
            // abstract: true,
            // url: '/',
            templateUrl: 'views/index.html',
        }).state('user.menu', {//匹配左侧栏
            url: '/:moudleId',
            views: {
                '': {
                    templateUrl: function (stateParams) {
                        console.log(stateParams)
                        var url = 'views/' + stateParams.moudleId + "/" + stateParams.moudleId + '.html';
                        return url;
                    },
                }
            },
        }).state("user.cameraDetail", {
            url: "/cameras/detail",
            templateUrl: "views/cameras/cameraDetail.html"
        })
        //无效的路由时，跳转到首页
        $urlRouterProvider.otherwise('/cameras');
    })

    app.run(function ($rootScope, $location) {
        // 监听路由变化
        $rootScope.$on('$stateChangeStart', function (evt, toState, toParams, fromState, fromParams) {
            // console.log("$stateChangeStart ");
        });
        $rootScope.$on('$stateChangeSuccess', function () {
            // console.log("$stateChangeSuccess ");
        });
        $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
            // $log.error('The request state was not found: ' + unfoundState);
        });
        $rootScope.$on('$stateChangeError', function () {
            // console.log("$stateChangeError ");
        });
    });
});