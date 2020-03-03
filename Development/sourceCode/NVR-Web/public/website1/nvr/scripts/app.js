/*
 * @Description: app module的创建
 * @Version: 0.0.1
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-20 11:34:54
 * @LastEditRelease: 
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-03-03 15:23:59
 */
define([
    // 依赖模块
    'angular',
    'angular-translate',
    'angular-ui-router', //路由
    'angular-ui-router-stateEvents', //监听路由改变用的，和angular-ui-router配套用
    'swiper', //轮播图
    'service', //集中加载控制器
    'control', //集中加载控制器
    'directive', //集中加载指令
    'component',
    'globalEnum',
    'lang', //国际化
    'dview8-components', //icon图标
    'ui-bootstrap', //ui组件
    'angular-ui-select', //下拉框组件
    'angular-sanitize' //angular-ui-select需要的依赖，指令绑定纠错
], function (ng) {
    'use strict';
    return ng.module('app', [
        'ui.router', //路由
        'ui.router.state.events', //监听路由改变用的，和angular-ui-router配套用
        //把服务module绑定到该app module上，让服务module上挂在的所有服务service在app内生效
        'app.services',
        //把控制器module绑定到该app module上，让控制器module上挂在的所有页面控制器在app内生效
        'app.controllers',
        //把指令module绑定到该app module上，让控制器module上挂在的所有页面控制器在app内生效
        'app.directives', //组件module
        'app.components',
        'app.globalEnum',
        "app.lang", //国际化
        'ui.bootstrap', //基于bootstrap的 angular的ui组件
        'ui.select', //下拉框组件需要的依赖
        'ngSanitize', //下拉框组件需要的依赖
        'dview8.components', //icon图标
    ])
});