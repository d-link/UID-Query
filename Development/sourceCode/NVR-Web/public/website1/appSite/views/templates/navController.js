/* **************************************************************
* Copyright (C)2010-2020 Dlink Corp.
*
* Author      : WangHui
* Mail        : Hui.Wang@cn.dlink.com
* Create Date : 2018-05-23
* Modify Date :
* Summary     : app nav
*
*************************************************************/
define(["controllerModule"], function (controllers) {
    controllers.controller('NavController', function ($rootScope,LanguageService,$stateParams,$http, $scope, $state, Auth, Current, $uibModal, NetworkService, OrganizationService, moudlesService, $timeout) {

        //user
        $scope.user = Current.user();
        //org
        $scope.org = Current.org();

        //获取当前设备URL中的IP地址
        var windowHost = window.location.host;
        var theFlag    = windowHost.indexOf(':');
        var windowIp   = windowHost.substring(0,theFlag);
        //设置全局的，以提供其他页面调用
        $rootScope.windowIp = windowIp;
        //获取用户输入的名称
        var cwmName = sessionStorage.getItem("cwmName");
        $rootScope.cwmName  = cwmName;

        //更新用户信息
        $scope.updateUserInfo   = updateUserInfo;
        //强行隐藏Echart 的tooltip
        $scope.hideTooltip      = hideTooltip;





        $scope.updateUserInfo();

        function updateUserInfo(){
            Auth.getUserInfo({_id: $scope.user._id}, function (result) {
                if (result.success) {
                    Current.setUser(result.data);
                    $scope.user = Current.user();
                    $scope.org = Current.org();
                    //设置页面头部信息
                    var lastPage = result.data.lastPage;
                    //上次浏览页面
                    $scope.lastPage = lastPage;

                    $rootScope.navTitle = $scope.lastPage;


                }
            }, function (err) {
            });
        };



        function hideTooltip(){
            var eContainner = document.getElementsByClassName('col-sm-6');
            //将类数组集合转化为数组
            eContainner = Array.prototype.slice.apply(eContainner);
            eContainner.forEach(function(eChart,index){
                if(typeof(eChart.children[1])!=='undefined'){
                   if(eChart.children[1].children[1]) eChart.children[1].children[1].style.display='none';
                }
            });
        };

        //解决IOS滑动触发Body的滑动(移动端浮层内滚动父层窗体不滚动的JS处理)
        function smartScroll(container, selectorScrollable) {
            // 如果没有滚动容器选择器，或者已经绑定了滚动时间，忽略
            if (!selectorScrollable || container.data('isBindScroll')) {
              return;
            };

            // 是否是搓浏览器
            // 自己在这里添加判断和筛选
            var isSBBrowser;

            var data = {
              posY: 0,
              maxscroll: 0
            };

            // 事件处理
            container.on({
              touchstart: function (event) {
                var events = event.touches[0] || event;

                // 先求得是不是滚动元素或者滚动元素的子元素
                var elTarget = $(event.target);

                if (!elTarget.length) {
                  return;
                }

                var elScroll;

                // 获取标记的滚动元素，自身或子元素皆可
                if (elTarget.is(selectorScrollable)) {
                  elScroll = elTarget;
                } else if ((elScroll = elTarget.parents(selectorScrollable)).length == 0) {
                  elScroll = null;
                }

                if (!elScroll) {
                  return;
                }

                // 当前滚动元素标记
                data.elScroll = elScroll;

                // 垂直位置标记
                data.posY = events.pageY;
                data.scrollY = elScroll.scrollTop();
                // 是否可以滚动
                data.maxscroll = elScroll[0].scrollHeight - elScroll[0].clientHeight;
              },
              touchmove: function (event) {
                // 如果不足于滚动，则禁止触发整个窗体元素的滚动
                if (data.maxscroll <= 0 || isSBBrowser) {
                  // 禁止滚动
                  event.preventDefault();
                }
                // 滚动元素
                var elScroll = data.elScroll;
                // 当前的滚动高度
                var scrollTop = elScroll.scrollTop();

                // 现在移动的垂直位置，用来判断是往上移动还是往下
                var events = event.touches[0] || event;
                // 移动距离
                var distanceY = events.pageY - data.posY;

                if (isSBBrowser) {
                  elScroll.scrollTop(data.scrollY - distanceY);
                  elScroll.trigger('scroll');
                  return;
                }

                // 上下边缘检测
                if (distanceY > 0 && scrollTop == 0) {
                  // 往上滑，并且到头
                  // 禁止滚动的默认行为
                  event.preventDefault();
                  return;
                }

                // 下边缘检测
                if (distanceY < 0 && (scrollTop + 1 >= data.maxscroll)) {
                  // 往下滑，并且到头
                  // 禁止滚动的默认行为
                  event.preventDefault();
                  return;
                }
              },
              touchend: function () {
                data.maxscroll = 0;
              }
            });
            // 防止多次重复绑定
            container.data('isBindScroll', true);
        };


        //菜单栏默认收起
        var sidebar  = document.getElementById('main-sidebar');
        var moveOut = document.body.offsetWidth+'px';
        sidebar.style.transform  = "translateX(-"+moveOut+")";
        $scope.changeMenu = function () {
            //强行关闭辅助框
            closeTooltip();
            $scope.hideTooltip();
            //如果为空或者0，证明菜单是展开的
            if(sidebar.style.transform==''||sidebar.style.transform=='translateX(0px)'){
                var moveOut = document.body.offsetWidth+'px';
                sidebar.style.transform  = "translateX(-"+moveOut+")";
                sidebar.style.transition = "transform 0.6s";

            }else{//证明菜单已经收起，再次点击打开菜单
                var moveOut = 0+'px';
                sidebar.style.transform="translateX("+moveOut+")";
                sidebar.style.transition = "transform 0.6s";

            };
        };
        $scope.showMenu = function () {
            $scope.$emit('hide', false);
            //配合解决IOS滑动触发Body的滑动用
            if($('html')){
              $('html').addClass('noscroll');
            };
            var mainSidebarMenu = $('#mainSidebarMenu');
            smartScroll(mainSidebarMenu, '.scrollable');
        };
        $scope.hideMenu = function () {
            if ($scope.isHided) {
                $scope.$emit('hide', true);
            }
            //配合解决IOS滑动触发Body的滑动用
            if($('html')){
              $('html').removeClass('noscroll');
            };
        };
        });

        function closeTooltip(){
            $('#lastHourNumberCharts').each(function(){ $($(this).children('div')[1]).css('display','none'); });
            $('#lastHourTrafficCharts').each(function(){ $($(this).children('div')[1]).css('display','none'); });
            $('#lastHourTrafficDownUpCharts').each(function(){ $($(this).children('div')[1]).css('display','none'); });
            $('#lastHourTrafficSsidCharts').each(function(){ $($(this).children('div')[1]).css('display','none'); });
            $('#MostClientsHotTimeCharts').each(function(){ $($(this).children('div')[1]).css('display','none'); });
            $('#MostTrafficUsageCharts').each(function(){ $($(this).children('div')[1]).css('display','none'); });
            $('#HourlyUniqueCharts').each(function(){ $($(this).children('div')[1]).css('display','none'); });
            $('#HourlyTrafficCharts').each(function(){ $($(this).children('div')[1]).css('display','none'); });
            $('#DailyTrafficUsageCharts').each(function(){ $($(this).children('div')[1]).css('display','none'); });
        };


        controllers.directive('navHeader', function () {
            return {
                scope: false,
                restrict: 'A',
                controller: 'NavController',
                templateUrl: './views/templates/nav.html'
            };
        });
});
