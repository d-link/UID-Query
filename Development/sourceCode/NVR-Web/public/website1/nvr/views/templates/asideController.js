/*
 * @Description:侧边栏控制器
 * @Version: 0.4.0
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-24 14:38:12
 * @LastEditRelease:
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-02-26 17:44:18
 */
define([
    'controllerModule'
], function (controllers) {
    'use strict';
    controllers.controller('asideCtrl', function ($scope, $state, moudlesService) {
        // 初始化显示的菜单：cameras
        $state.go('user.menu', { moudleId: 'liveView' });
        moudlesService.showMenu('liveView');//激活cameras菜单状态
        // changeDivHeight();
        // 切换高亮状态
        $scope.showSub = function (id) {
            moudlesService.showMenu(id);
            changeDivHeight();
        };
        // 打开某一个一级menu
        $scope.openSub = function (id) {
            moudlesService.openMenu(id);
            changeDivHeight();
        };
        // 设置箭头图标路径
        $scope.getArrow = function (isOpen) {
            if (isOpen) {
                return "bottom:left_arrow_down";
            } else {
                return "bottom:left_arrow_right";
            }
        };
        // 鼠标移入的时候，检测左侧菜单栏是否能显示完整，显示不完的就设置可滚动
        $scope.showScroll = function () {
            var sidebar = document.getElementsByClassName('sidebar')[0];
            if (sidebar.clientHeight < sidebar.scrollHeight) {
                sidebar.style.overflowY = "auto";
            } else {
                sidebar.style.overflowY = "hidden";
            }
        };
        // 禁止滚动
        $scope.hideScroll = function () {
            var sidebar = document.getElementsByClassName('sidebar')[0];
            sidebar.style.overflowY = "hidden";
        };
        // 左侧菜单最大化显示
        $scope.showMenu = function () {
            $scope.$emit('hide', false);
        };
        // 左侧菜单最小化显示
        $scope.hideMenu = function () {
            $scope.$emit('hide', true);
        };

    })
});