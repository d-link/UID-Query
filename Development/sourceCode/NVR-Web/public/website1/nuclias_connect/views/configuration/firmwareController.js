/**
 * Created by guojiangchao on 2018/1/10.
 */
define(["app"], function (app) {
    app.register.controller('firmwareController', function ($scope, BatchConfigService, $timeout, Current, utils, TS, $translate) {
        /**
         * 修改页面和表格高度
         */
        setHeight(); // set-height 表格高度依据
        setHeight('site-set-height', ['elementFlag']); // 显示滚动条容器
        setHeight('data-show-menu-main', [], -40); // 用于菜单显示滚动条
        //列表显示标题
        $scope.showNormal = true;
        var currentLang = $translate.proposedLanguage() || $translate.use();
        if (currentLang == 'fr' || currentLang == 'jp' || currentLang == 'es') {
            $scope.showNormal = false;
        } else {
            $scope.showNormal = true;
        }
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

        BatchConfigService.geFWTree(function (result) {
            if (result.success) {
                $scope.sites = result.data;
            }
        });
        $scope.$on('refreshFWTree',function(){
            BatchConfigService.geFWTree(function (result) {
                if (result.success) {
                    $scope.sites = result.data;
                }
            });
        });
        // 左侧列表选中状态
        $scope.siteActive = null;
        $scope.networkActive = null;
        $scope.profileActive = null;
        $scope.fwInfo={};
        // site
        $scope.showNetwork = false;
        $scope.toggleSite = function(site){
            if ($scope.siteActive && $scope.siteActive._id == site._id) {
                $scope.showNetwork = !$scope.showNetwork;
                return;
            }
            $scope.showNetwork = true;
            $scope.siteActive = site;
            $scope.networkActive=null;
            $scope.showProfile = false;
            $scope.profileActive = null;
        };
        // network
        $scope.showProfile = false;
        $scope.toggleNetwork = function(net){

            if ($scope.networkActive && $scope.networkActive._id == net._id) {
                $scope.showProfile = !$scope.showProfile;
                return;
            }
            var parameter = {
                networkId: net._id
            };
            $scope.fwInfo.networkId=net._id;
            BatchConfigService.getFWUpgradeInfo(parameter, function (result) {
                if (result.success) {
                    $scope.fwInfo = result.data;
                    $scope.profileActive = null;
                    $scope.showProfile = true;
                    $scope.networkActive = net;
                    $timeout(function(){
                        $scope.profileActive = 'fwUpgrade';
                    },100);
                    $timeout(function(){
                        if($scope.fwInfo.fwList.length == 0){
                            $scope.$broadcast("fwUploadSchedule", false, null);
                        }else{
                            var isfwChanged = false;
                            for(var i=0; i< $scope.fwInfo.fwList.length; i++){
                                var fw = $scope.fwInfo.fwList[i];
                                if(fw.active.fwVersion&&fw.active.urlFw&&fw.active.fileName){
                                    isfwChanged = true;
                                }
                            }
                            $scope.$broadcast("fwUploadSchedule", isfwChanged, null);
                        }
                    },500);

                }
            });
        };
        $scope.goToNetwork = function () {
            $state.go('user.org.subdetail', {moudleId: 'network', parentId: 'configuration'});
        }
        // 获取site下是否有用户修改且没有应用的network
        $scope.getApplyStatus = function(site){
            for (var i = 0; i < site.networks.length; i++) {
                if(site.networks[i].modifyTime>site.networks[i].applyTime){
                    return true;
                };
            };
            return false;
        }
        $scope.hasPrivilege = Current.user().role == "root admin" || Current.user().role == "local admin";



    });
})