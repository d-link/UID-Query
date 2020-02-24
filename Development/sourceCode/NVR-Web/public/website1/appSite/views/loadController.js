/* **************************************************************
* Copyright (C)2010-2020 Dlink Corp.
*
* Author      : WangHui
* Mail        : Hui.Wang@cn.dlink.com
* Create Date : 2018-05-23
* Modify Date :
* Summary     : app come in first
*
*************************************************************/
define(["controllerModule"], function (controllers) {

    controllers.controller('LoadController', function ($rootScope, $scope, LanguageService, $state, Auth, moudlesService, OrganizationService, Current, TS, utils) {

        //获取当前用户
        $scope.appUser           = Current.user();
        //上次浏览页面
        //$scope.lastPage          = $scope.appUser.loginStatus.lastPage;
        //初次进入UI时间
        var currentTime = new Date().getTime();
        //上次鼠标移动或屏幕响应时间
        var lastTime = new Date().getTime();
        //超时时间设定
        var timeOut = 15 * 60 * 1000;
        //根据屏幕响应改变上次响应时间
        window.addEventListener('touchmove', function(){
            lastTime = new Date().getTime();
        });

        window.document.onmousemove = function () {
            lastTime = new Date().getTime();
        };
        //webApp Version
        $scope.appVersion = 'Nuclias Connect v1.0.0.3';
        OrganizationService.loadVersion(function (result) {
            if(result.data){
                $scope.version = 'Nuclias Connect '+result.data;
            }else{
                $scope.version = $scope.appVersion;
            };
        });

        //设置全局语言包
        $rootScope.language = LanguageService.getPageLanguage();
        //获取从APP传入的语言key
        var languageKey = sessionStorage.getItem("language");
        //设置全局语系
        $rootScope.languageKey = languageKey;
        //设置默认标题
        $rootScope.navTitle = 'dashboard';


        //自动导航上次浏览页面
        $scope.comeInLastPage    = comeInLastPage;
        //对home与logout进行判断
        $scope.goHomeOrgoOut     = goHomeOrgoOut;
        //关闭左侧菜单栏
        $scope.closeLeftMenu     = closeLeftMenu;
        //页面超时
        $scope.checkTimeout      = checkTimeout;
        //页面超时弹出框，点击确定，跳转到原生APP登录页面
        $scope.timeOutLink       = timeOutLink;
        //点击左边菜单栏，页面导航对应的页面
        $scope.showSub           = showSub;
        //点击左边菜单栏，更换菜单箭头样式
        $scope.getArrow          = getArrow;
        //openSub
        $scope.openSub           = openSub;
        //showScroll
        $scope.showScroll        = showScroll;
        //hideScroll
        $scope.hideScroll        = hideScroll;
        //showMenu
        $scope.showMenu          = showMenu;
        //hideMenu
        $scope.hideMenu          = hideMenu;
        //页面初始化函数
        $scope.initPage          = initPage;
        //初始化app语言系
        $scope.initAppLanguage   = initAppLanguage;




        $scope.initPage();
        //每3秒检测屏幕链接是否超时
        var appTimeOut = window.setInterval($scope.checkTimeout, 3000);




        function initPage(){

            $scope.initAppLanguage();

            if (window.location.href.indexOf('DNH/') == -1) {
                 OrganizationService.listAllOrgs(function (orgs) {
                    if (orgs && orgs.length > 0) {
                        var org = orgs[0];
                        org.orgId = org._id;
                        Current.setOrg(org);
                        $scope.org = Current.org();
                        //判断上次浏览页面
                        $scope.comeInLastPage();
                    }
                });
            };

        };


        function closeLeftMenu(){
            var sidebar  = document.getElementById('main-sidebar');
                //如果为空或者0，证明菜单是展开的,点击收起
            if(sidebar.style.transform==''||sidebar.style.transform=='translateX(0px)'){
                var moveOut = document.body.offsetWidth+'px';
                sidebar.style.transform  = "translateX(-"+moveOut+")";
                sidebar.style.transition = "transform 0.6s";
            }
            //配合解决IOS滑动触发Body的滑动用
            if($('html')){
              $('html').removeClass('noscroll');
            };
        };


        //----------home、out
        function goHomeOrgoOut(id){
             if(id=='home'){
                window.location.href="dlinkbusiness://landing";
             }else if(id=='logout'){
                Auth.appLogout();//2019.6.25 尹雪雪 加 注销用户
                window.location.href="dlinkbusiness://login";
             }
        };
        //----------home、out



        //--------------go in to some page
        function comeInLastPage(){
            //本次页面加载
            var comeInPage = '';

            //获取上次浏览页面 ,根据token来获取，用于支持多个设备获取历史浏览页面
            Auth.getUserInfo({_id: $scope.appUser._id}, function (result) {
                if (result.success) {
                    utils.getNodeTime(function () {
                        var lastPage = result.data.lastPage;
                        //头部设置标题
                        $rootScope.navTitle = lastPage;
                        if (typeof(lastPage) !== 'undefined' && lastPage !== '') {
                            //上次浏览页面
                            $scope.lastPage = lastPage;
                            //判断APP 页面,不能使用路由，因为nav是在一个route-view里面的
                            switch ($scope.lastPage) {
                                case 'accessPoint' :
                                    comeInPage = "/appSite/#!/DNH/monitor/accessPoint";
                                    break;
                                case 'wirelessClient' :
                                    comeInPage = "/appSite/#!/DNH/monitor/wirelessClient";
                                    break;
                                case 'syslog':
                                    comeInPage = "/appSite/#!/DNH/log/syslog";
                                    break;
                                case 'captive':
                                    comeInPage = "/appSite/#!/DNH/log/captive";
                                    break;
                                case 'systemlog' :
                                    comeInPage = "/appSite/#!/DNH/log/systemlog";
                                    break;
                                case 'dashboard':
                                    comeInPage = "/appSite/#!/DNH/dashboard";
                                    break;
                                case 'configuration':
                                    comeInPage = "/appSite/#!/DNH/configuration";
                                    break;
                                case 'network':
                                    comeInPage = "/appSite/#!/DNH/configuration/network";
                                    break;
                                default:
                                    comeInPage = "/appSite/#!/DNH/dashboard";
                                    $rootScope.navTitle = "dashboard";
                                    $scope.lastPage = "dashboard";
                                    break;
                            }
                            window.location = comeInPage;
                        } else {
                            //设置默认加载项
                            window.location = "/appSite/#!/DNH/dashboard";
                        }
                    })
                }
            });
        };
        //--------------go in to some page



        //--------------对页面超时进行判断

        function checkTimeout() {
            currentTime = new Date().getTime();
            if (currentTime - lastTime > timeOut) {
                //停止监听函数
                window.clearInterval(appTimeOut);
                //显示超时弹出框
                $.DialogByZ.Alert({Title: "",
                                   Content:TS.ts('activation.timeOut'),
                                   BtnL:TS.ts('common.confirm'),
                                   FunL:timeOutLink})
            };
        };
        //超时弹出框操作
        function timeOutLink(){
            Auth.appLogout();//2019.6.25 尹雪雪 加 注销用户
            window.location.href="dlinkbusiness://login";
        };
        //--------------对页面超时进行判断



        function showSub(id){
            //当前选中的Tab
            var menuId = id;
            $rootScope.navTitle = id;
            //打开页面
            moudlesService.showMenu(id);

            //进入页面后，菜单栏需要收起
            var sidebar = document.getElementById('main-sidebar');
            var moveOut = document.body.offsetWidth+'px';
            sidebar.style.transform="translateX(-"+moveOut+")";
            sidebar.style.transition = "transform 0.3s";
            //设置当前访问页面
            if($scope.appUser.loginStatus){
                $scope.appUser.loginStatus.lastPage = id;
            }else if($scope.appUser.lastPage){
                $scope.appUser.lastPage = id;
            };
            //将本次访问页面存入字典，用于下次获取该页面
            //用户ID
            var userId = $scope.appUser._id;
            //访问页面
            var page   = id;
            //定制传入参数
            var params = {
                page  :page,
                userId:userId
            };
            //存储访问页面信息
            Auth.updateLastPage(params,function(res){
                if(res.success){
                    //查看更新后的用户信息
                    Auth.getUserInfo({_id: userId}, function (result) {
                        if (result.success) {
                            Current.setUser(result.data);
                            $scope.user = Current.user();
                            $scope.org = Current.org();
                        }
                    });
                };
            });
        };


        function getArrow(isOpen){
            if (isOpen) {
                return "bottom:left_arrow_down";
            } else {
                return "bottom:left_arrow_right";
            }
        };

        function openSub(id){
            moudlesService.openMenu(id);
        };


        function showScroll(){
            // var sidebar = document.getElementsByClassName('sidebar')[0];
            // if (sidebar.clientHeight < sidebar.scrollHeight) {
            //     sidebar.style.overflowY = "auto";
            // } else {
            //     sidebar.style.overflowY = "hidden";
            // }
        };

        function hideScroll(){
            // var sidebar = document.getElementsByClassName('sidebar')[0];
            // sidebar.style.overflowY = "hidden";
            // if (sidebar.clientHeight < sidebar.scrollHeight) {
            //     sidebar.style.overflowY = "auto";
            // } else {
            //     sidebar.style.overflowY = "hidden";
            // }
        };

        function showMenu(){
            $scope.$emit('hide', false);
            changeDivHeight();
        };

        function hideMenu(){
            $scope.$emit('hide', true);
        };

        /*var url = location.origin;*/
        function changeDivHeight() {
            var left = document.getElementsByClassName('main-sidebar')[0];
            if (left) {
                var height = left.clientHeight;
                if (left) {
                    var height = left.clientHeight;
                    var sidebar = document.getElementsByClassName('sidebar')[0];
                    if(sidebar){
                      var sidebarHeight = height - 42;
                      sidebar.style.height = sidebarHeight + "px";
                    };
                };
            }
        }

        function initAppLanguage(){
            //对弹出框进行语言转化
            $rootScope.language.alert.forEach(function(items,index){
                $rootScope[items.key]=items[$rootScope.languageKey];
            });
            //对模块标题进行语言转义
            $rootScope.language.dashboard.Diagrams.forEach(function(items,index){
                $rootScope[items.key]=items[$rootScope.languageKey];
            });
        };


    });
});
