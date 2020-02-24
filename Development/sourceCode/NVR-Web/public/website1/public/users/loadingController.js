/* **************************************************************
* Copyright (C)2010-2020 Dlink Corp.
* 
* Author      : WangHui
* Mail        : Hui.Wang@cn.dlink.com
* Create Date : 2018-05-21
* Modify Date : 
* Summary     : app check and loading
* 
*************************************************************/

define(["controllerModule"], function (controllers) {

    controllers.controller('loadingController', function ($rootScope, $scope,$stateParams, $state, Auth, Current,$location) {
            //获取token 
            $scope.userInfo = {token:$location.search().token};
            //存储token
            sessionStorage.setItem("appToken", $location.search().token);
            //目前支持语言类型:英文、中文、中文繁体、西班牙语、科伦语、意大利语、日本语、法语、德语、俄语
            var languageList = ['en','cn','cht','es','kr','it','jp','fr','de','ru','tw'];
            //存储语言选择信息
             
            if($location.search().language&&languageList.indexOf($location.search().language)!==-1){
                
                sessionStorage.setItem("language",$location.search().language);
            }else{
                //设置默认语言信息
                sessionStorage.setItem("language","en");
            }
            //用户输入设备名称
            var cwmName = $location.search().cwmName;
            if(cwmName&&cwmName!==''){
                //对非英文进行解码
                cwmName = unescape(cwmName);
                //解码后发现为空格
                if(cwmName.trim()==''){
                    sessionStorage.setItem("cwmName","DNH");
                }else{
                    sessionStorage.setItem("cwmName",cwmName.trim());
                }
            }else{
                //设置默认语言信息
                sessionStorage.setItem("cwmName","DNH");
            }
            
            
            //获取设备信息
            var browser={  
                    versions:function(){   
                        var u = navigator.userAgent, app = navigator.appVersion;   
                        return {//移动终端浏览器版本信息   
                                trident: u.indexOf('Trident') > -1, //IE内核  
                                presto: u.indexOf('Presto') > -1, //opera内核  
                                webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核  
                                gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核  
                                mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端  
                                ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端  
                                android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或者uc浏览器  
                                iPhone: u.indexOf('iPhone') > -1 , //是否为iPhone或者QQHD浏览器  
                                iPad: u.indexOf('iPad') > -1, //是否iPad    
                                webApp: u.indexOf('Safari') == -1, //是否web应该程序，没有头部与底部  
                                weixin: u.indexOf('MicroMessenger') > -1, //是否微信   
                                qq: u.match(/\sQQ/i) == " qq" //是否QQ  
                            };  
                        }(),  
                        language:(navigator.browserLanguage || navigator.language).toLowerCase()  
                };           
            var res = Auth.browserOs(window.navigator.userAgent);
            $scope.userInfo.loginStatus=res;
            //检测是否为移动端
            if( browser.versions.mobile  || 
                browser.versions.ios || 
                browser.versions.android ||   
                browser.versions.iPhone || 
                browser.versions.iPad){
                //标记当前页面由移动设备打开
                sessionStorage.setItem("model", "APP");
                Auth.appLogin($scope.userInfo,  function (result) {
                    if(result.success){
                      Auth.loadMode('APP');
                    }           
                }); 
            }else{
                    //不是移动端页面返回404
                     $state.go('anon.PageNotFount');
            }



    })
});