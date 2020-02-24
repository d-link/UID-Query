/**
 * Created by guojiangchao on 2018/1/10.
 */
define(["app"], function (app) {
    app.register.controller('sslController', function ($scope, BatchConfigService, DashboardService, $timeout, Current) {
        /**
         * 修改页面和表格高度
         */
        setHeight(); // set-height 表格高度依据
        setHeight('site-set-height', ['elementFlag']); // 显示滚动条容器
        setHeight('data-show-menu-main', [], -40); // 用于菜单显示滚动条

        $scope.timer = null;
        window.onresize = function(){
            setHeight();
            setHeight('data-show-menu-main', [], -40);
            setHeight('site-set-height', ['elementFlag']);
        }

        /************************************************
         * configuration 基本信息
         ************************************************/
        /**
         * 获取左侧列表、左侧列表事件
         */
        DashboardService.getSiteAndNetwork(function (result) {
            if (result.success) {
                $scope.sites = result.data;
            };
        });
        // 左侧列表选中状态
        $scope.siteActive = null;
        $scope.networkActive = null;
        $scope.profileActive = null;
        // site
        $scope.showNetwork = false;
        $scope.toggleSite = function(site){
            if ($scope.siteActive && $scope.siteActive._id == site._id) {
                $scope.showNetwork = !$scope.showNetwork;
                return;
            }
            $scope.showNetwork = true;
            $scope.siteActive = site;
            $scope.showProfile = false;
            $scope.networkActive = null;
            $scope.profileActive = null;
        };
        // network
        $scope.showProfile = false;
        $scope.toggleNetwork = function(net){
            if ($scope.networkActive && $scope.networkActive._id == net._id) {
                $scope.showProfile = !$scope.showProfile;
                return;
            }
            $scope.profileActive = null;
            $scope.showProfile = true;
            $scope.networkActive = net;

            $timeout(function(){
                $scope.profileActive = 'sslCertificate';
            },100);
        };
        $scope.goToNetwork = function () {
            $state.go('user.org.subdetail', {moudleId: 'network', parentId: 'configuration'});
        }
    })
})
