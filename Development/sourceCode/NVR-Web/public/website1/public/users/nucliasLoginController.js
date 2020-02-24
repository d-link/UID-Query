/**
 * Copyright (C)2010-2020 Dlink Corp.
 * Created by lizhimin on 2019/3/26.
 *   Create Date : 2019-03-26
 */

define(["controllerModule"], function (controllers) {

    controllers.controller('nucliasLoginController', function ($rootScope, $scope,$stateParams, $state, Auth, Current,$location) {
        //获取token
        $scope.userInfo = {token:$location.search().nctoken};
        //存储token
        sessionStorage.setItem("nucliasToken", $location.search().nctoken);
        //目前支持语言类型:英文、中文、中文繁体、西班牙语、科伦语、意大利语、日本语、法语、德语、俄语
        var languageList = ['en','cn','cht','es','kr','it','jp','fr','de','ru','tw'];
        //存储语言选择信息

        if($location.search().language&&languageList.indexOf($location.search().language)!==-1){
            sessionStorage.setItem("language",$location.search().language);
        }else{
            //设置默认语言信息
            sessionStorage.setItem("language","en");
        }
       sessionStorage.setItem("model", "PC");
        var res = Auth.browserOs(window.navigator.userAgent);
        $scope.userInfo.loginStatus=res;
        Auth.nuclusLogin($scope.userInfo,  function (result) {
            if(result.success){
                Auth.loadMode('DNH');
            }
        });



    })
});