/*
 * @Description: app module的创建
 * @Version: 0.0.1
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-20 11:34:54
 * @LastEditRelease: 
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-02-24 17:40:43
 */
define([
    // 依赖模块
    'angular',
    'angular-translate',
    'angular-ui-router',
    'angular-ui-router-stateEvents',
    'service',//加载所有控制器
    'control',//加载所有控制器
    'globalEnum',
    'lang',//国际化
    'dview8-components'//icon图标
], function (ng) {
    'use strict';
    return ng.module('app', [
        'ui.router',
        'ui.router.state.events',
        //把控制器module绑定到该app module上，让控制器module上挂在的所有页面控制器在app内生效
        'app.services',
        'app.controllers',
        'app.globalEnum',
        "app.lang",
        'dview8.components'
    ])
});