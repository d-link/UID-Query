/*
 * @Description: 
 * @Version: 0.4.0
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-03-03 14:46:40
 * @LastEditNote: 
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-03-03 18:39:34
 */
define([
    'controllerModule',
    'componentModule',
    'swiper',
], function (controllers, components, Swiper) {
    'use strict';
    // 创建组件
    components.component('videoSwiper', {
        templateUrl: 'views/liveView/components/videoSwiper.html',
        controller: 'videoSwiperCtrl',
        controllerAs: '_my',
        bindings: {
            cameraList: '<',
        },
        controller: function ($scope, $http) {
            let _my = this;
            $scope.slides = [];
            // _my.aaa = 11111;
            // $scope.aaa = 11111;
            // this.aaa = 11111;
            this.$onInit = function () {
                // console.log(this._cameraList); // 听风是风
                // console.log($scope); // undefined

                console.log(_my.cameraList)

                $http.get('assets/grid.json').then(function (resp) {
                    const rate = resp.data.sizeRate;
                    const grid = resp.data.grids['t9'];
                    console.log(grid)
                    $scope.slides = swiperDataInit(_my.cameraList, grid, rate);
                    console.log($scope.slides)

                    $scope.mySwiper = new Swiper('.swiper-container', {
                        loop: true, // 循环模式选项
                        on: {
                            init: function () {
                                console.log('Swiper初始化了')
                                // resetVideoWrapHeight();
                            }
                        }
                    })
                });
            };
            $scope.getTotalHeight = function () {
                return $scope.height
            }

            // 轮播图数据处理
            function swiperDataInit(_list, grid, rate) {
                const contanier = document.getElementById('videoSwiper');
                const width = contanier.clientWidth; //大盒子总宽度
                const startX = 0;
                const startY = 0;
                const unitW = 1 / grid.cols * width; //单元宽度
                const unitH = unitW * rate; //单元高度
                $scope.height = unitH * grid.rows; //大盒子总高度
                console.log(startX, startY)

                // 轮播图屏数,整数
                const pageNum = Math.ceil(_list.length / grid.total);
                // console.log(pageNum)
                let slides = [];
                for (let i = 0; i < pageNum; i++) {
                    let slide = {
                        idx: i,
                        list: []
                    }
                    const startIdx = i * grid.total;
                    for (let j = 0; j < grid.total; j++) {
                        const index = j + startIdx;
                        const x = grid.list[j][0] * unitW;
                        const y = grid.list[j][1] * unitH;
                        const w = grid.list[j][2] * unitW;
                        const h = w * rate;
                        if (index < _list.length) { //有video的格子
                            slide.list.push({
                                idx: index, //唯一的,索引值
                                id: _list[index].id,
                                // image: _list[i].image,
                                video: _list[index].video,
                                text: _list[index].text,
                                style: {
                                    width: w + 'px',
                                    height: h + 'px',
                                    left: x + 'px',
                                    top: y + 'px',
                                }
                            })
                        } else { //空格子
                            slide.list.push({
                                idx: index,
                                isEmpty: true,
                                style: {
                                    width: w + 'px',
                                    height: h + 'px',
                                    left: x + 'px',
                                    top: y + 'px',
                                }
                            })
                        }
                    }
                    // 行
                    // for (let rowIdx = 0; rowIdx < grid.list.length; rowIdx++) {
                    //     let rowObj = [];
                    //     slide.list.push(rowObj);
                    //     // 列
                    //     for (let colIdx = 0; colIdx < grid.list[rowIdx].length; colIdx++) {
                    //         // 一屏中的宫格索引值
                    //         const gridIdx = colIdx + rowIdx * grid.list[0].length;
                    //         // index：在_list中的索引值
                    //         const index = gridIdx + startIdx;
                    //         const w = grid.list[rowIdx][colIdx] / grid.rows * width;
                    //         const h = w * rate;
                    //         if (index < _list.length) { //有video的格子
                    //             rowObj.push({
                    //                 idx: index, //唯一的,索引值
                    //                 id: _list[index].id,
                    //                 // image: _list[i].image,
                    //                 video: _list[index].video,
                    //                 text: _list[index].text,
                    //                 w: w,
                    //                 h: h,
                    //                 style: { width: w + 'px', height: h + 'px' } //每个格子的宽高
                    //             })
                    //         } else { //空格子
                    //             rowObj.push({
                    //                 idx: index,
                    //                 isEmpty: true,
                    //                 w: w,
                    //                 h: h,
                    //             })
                    //         }
                    //     }
                    // }

                    slides.push(slide)
                }
                return slides
                // for (let i = 0; i < gridLength; i++) {
                //     if (i % $scope.grid === 0) {
                //         // 第几屏
                //         slideIdx++;
                //         slides.push({
                //             id: slideIdx,
                //             list: []
                //         })
                //     }
                //     if (i < _list.length) { //非空格子
                //         slides[slideIdx - 1].list.push({
                //             id: _list[i].id,
                //             idx: i,
                //             image: _list[i].image,
                //             video: _list[i].video,
                //             text: _list[i].text
                //         })
                //     } else { //空格子
                //         slides[slideIdx - 1].list.push({
                //             isEmpty: true,
                //             idx: i
                //         })
                //     }
                // }
            }


            // console.log(this._cameraList)

            // // 接收窗口大小变化的广播
            // $scope.$on('resize', function (event, data) {
            //     console.log(data); //子级得不到值
            //     $scope.mySwiper.updateSize();
            //     // resetVideoWrapHeight();
            // })
            // $scope.$on('cameraListShowOrHide', function (event, data) {
            //     console.log('cameraListShowOrHide'); //子级得不到值
            //     $timeout(function () {
            //         console.log('updateSize'); //子级得不到值
            //         $scope.mySwiper.updateContainerSize();
            //         $scope.mySwiper.updateSlidesSize();
            //         // scope.mySwiper.updateSize();
            //     }, 1000)
            //     // resetVideoWrapHeight();
            // });
            // // 根据video宽度，计算出高度
            // function resetVideoWrapHeight() {
            //     const videoWrapDom = document.getElementsByClassName('grid');
            //     const videoDom = document.getElementsByClassName('video');
            //     //高宽比
            //     if (!videoDom[0]) return
            //     const rate = 0.6; //指定高宽比，video尺寸比例应该是一样的
            //     // const rate = videoDom[0].clientHeight / videoDom[0].clientWidth;
            //     const height = videoWrapDom[0].clientWidth * rate;
            //     angular.element(videoWrapDom).css('height', height + 'px');
            // }
        }
    })
})