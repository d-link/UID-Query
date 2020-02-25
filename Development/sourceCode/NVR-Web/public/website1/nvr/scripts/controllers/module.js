/*
 * @Description: 创建一个module，该module用于添加控制器，后续叫他控制器module/控制器模型
                 创建app module时要依赖该module，才能把两者联系上
                 'app.controllers'中 app是要创建的应用module的名字，名字要保持一致
 * @Version: 0.4.0
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-21 09:48:53
 * @LastEditRelease: 
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-02-24 14:06:32
 */
define(['angular'], function (ng) {
    'use strict';
    return ng.module('app.controllers', []);
});