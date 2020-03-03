/*
 * @Description:
 * @Version: 0.4.0
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-26 17:35:55
 * @LastEditRelease:
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-03-03 18:40:37
 */
define([
    'controllerModule',
], function (controllers, conponents) {
    'use strict';
    controllers.controller('liveViewCtrl', function ($scope, videoService) {
        $scope.grid = 9; //几宫格
        $scope._cameraList = []; //camera列表原始数据：缩略列表/video轮播
        $scope.currentTime = '20:52:21'; //当前时间
        $scope.currentDate = '2019/11/21'; //当前日期
        $scope.currentPageIndex = 1; //当前轮播图索引值
        $scope.isShowCamereList = false; //是否显示camera列表
        $scope.totalPageNum = 3; //轮播图总共页数
        $scope.intervalTime = [ //轮播图轮播间隔时间选项
            { id: 1, name: '5s', value: 5 },
            { id: 2, name: '10s', value: 10 },
            { id: 3, name: '15s', value: 15 },
        ];
        console.log($scope)
        $scope.selected = { value: $scope.intervalTime[0] };

        // 请求列表数据
        videoService.videoListGrid(function (data) {
            // swiperDataInit(data.list);
            $scope._cameraList = data.list;
        })
        // 切换camera列表显示
        $scope.toggleCameraList = function () {
            $scope.isShowCamereList = !$scope.isShowCamereList;
            console.log($scope.mySwiper)
            // 向子作用域发广播
            $scope.$broadcast('cameraListShowOrHide');
        }


    })
});