/*
 * @Description: 路由
 * @Version: 0.0.1
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-20 11:34:43
 * @LastEditRelease: 
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-02-25 17:51:27
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
            .iconSet('menu', 'images/common/leftmenu.svg', 24) // 左侧菜单图标
            .iconSet('bottom', "images/common/head_bottom.svg", 16) // 左侧菜单箭头
            .iconSet('common', "images/common/common.svg", 24) //user
            .iconSet('modal', "images/common/modal.svg", 16) // 

    });
    // 配置路由
    app.config(function ($stateProvider, $urlRouterProvider) {
        // user是父，都以user开头
        $stateProvider.state('user', {
            // abstract: true,
            // url: '/',
            templateUrl: 'views/index.html',
        }).state('user.menu', {//匹配左侧一级菜单
            url: '/:moudleId',
            views: {
                '': {
                    templateUrl: function (stateParams) {
                        return 'views/' + stateParams.moudleId + "/" + stateParams.moudleId + '.html';
                    },
                }
            },
        }).state('user.submenu', {//匹配左侧二级菜单
            url: '/:parentId/:moudleId',
            views: {
                '': {
                    templateUrl: function (stateParams) {
                        return 'views/' + stateParams.parentId + "/" + stateParams.moudleId + '.html';
                    },
                }
            },
        }).state("user.cameraDetail", {//cameras列表》camera详情
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