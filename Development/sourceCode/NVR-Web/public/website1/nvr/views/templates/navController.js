/*
 * @Descriptio：顶部nav控制器
 * @Version: 0.4.0
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-24 14:38:12
 * @LastEditRelease:
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-02-25 18:29:10
 */
define([
    'controllerModule'
], function (controllers) {
    'use strict';
    controllers.controller('navCtrl', function ($scope, $uibModal, Auth, Current) {
        $scope.user = Current.user();
        console.log($scope.user)
        // 鼠标移入logo ，左侧菜单最大化显示
        $scope.showMenu = function () {
            $scope.$emit('hide', false);
        };
        // 鼠标离开logo ，左侧菜单最小化显示
        $scope.hideMenu = function () {
            if ($scope.isHided) {
                $scope.$emit('hide', true);
            }
        };
        // 自动最小化最大化左侧菜单栏
        $scope.changeMenu = function () {
            $scope.$emit('hide', null);
        };
        // 点击用户信息
        $scope.userProfile = function () {
            // 打开一个modal（ui-bootstrap）
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                keyboard: false,
                templateUrl: './views/templates/userProfile.html',
                controller: "userProfileController",
                size: "w800",
                windowClass: 'modal-userprofile'
            });
            modalInstance.result.then(function (user) {

            }, function () {

            });
        };
        // 点击登出
        $scope.logout = function () {
            Auth.logout(function () {
                window.location = "/";
            }, function () {
                window.location = "/";
            });
        }
        // 切换语言
        $scope.changeLang = function (flag) {

            $scope.changeLanguage(flag);
        };
        // 跳哦转到dnr
        $scope.gotoDNR = function () {
            window.location = '/entrance/';
        }
        // 跳转到dnh
        $scope.gotoDNH = function () {
            window.location = '/nuclias_connect/#!/DNH';
        }
    })
});