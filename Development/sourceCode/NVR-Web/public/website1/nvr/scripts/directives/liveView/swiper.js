/*
 * @Description: liveview轮播图
 * @Version: 0.4.0
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-28 09:23:03
 * @LastEditNote: 
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-03-03 15:02:36
 */
define([
    'directiveModule',
    'swiper',
], function (directives, Swiper) {
    'use strict';
    directives.directive('videoSwiper', function ($timeout, $http) {
        return {
            templateUrl: 'scripts/directives/liveView/swiper.html',
            restrict: 'A',
            // scope: {
            //     slides: '=',
            // },
            link: function (scope, element, iAttrs) {
                scope.videoSizeRate = 0.6;
                scope.grids = {
                    't4': {
                        total: 4, //格子总数
                        isUniform: true, //是否是均匀的
                        rows: 2, //横向格子数
                        cols: 2, //纵向格子数
                    }
                }
                $http.get('assets/grid.json').then(function (resp) {
                    const rate = resp.data.sizeRate;
                    const grids = resp.data.grids;
                    console.log(grids)
                });
                $timeout(function () {
                    console.log(scope.slides)
                    scope.mySwiper = new Swiper('.swiper-container', {
                        loop: true, // 循环模式选项
                        on: {
                            init: function () {
                                console.log('Swiper初始化了')
                                // resetVideoWrapHeight();
                            }
                        }
                    })
                });
                // 接收窗口大小变化的广播
                scope.$on('resize', function (event, data) {
                    console.log(data); //子级得不到值
                    scope.mySwiper.updateSize();
                    // resetVideoWrapHeight();
                })
                scope.$on('cameraListShowOrHide', function (event, data) {
                    console.log('cameraListShowOrHide'); //子级得不到值
                    $timeout(function () {
                        console.log('updateSize'); //子级得不到值
                        scope.mySwiper.updateContainerSize();
                        scope.mySwiper.updateSlidesSize();
                        // scope.mySwiper.updateSize();
                    }, 1000)
                    // resetVideoWrapHeight();
                });
                // 根据video宽度，计算出高度
                function resetVideoWrapHeight() {
                    const videoWrapDom = document.getElementsByClassName('grid');
                    const videoDom = document.getElementsByClassName('video');
                    //高宽比
                    if (!videoDom[0]) return
                    const rate = 0.6; //指定高宽比，video尺寸比例应该是一样的
                    // const rate = videoDom[0].clientHeight / videoDom[0].clientWidth;
                    const height = videoWrapDom[0].clientWidth * rate;
                    angular.element(videoWrapDom).css('height', height + 'px');
                }

            }
        }
    })
});