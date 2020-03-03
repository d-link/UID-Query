/*
 * @Description: angular引导程序，触发app
 * @Version: 0.0.1
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-20 14:00:32
 * @LastEditRelease: 
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-02-26 18:17:27
 */
define(['angular', 'app', 'routes'], function (ng) {
    'use strict';
    // dom加载好
    require(['domReady!'], function () {
        console.log('domReady')
        ng.bootstrap(document, ['app']);//引导程序,对index.html主动触发angular，代替了ng-app
    });
});