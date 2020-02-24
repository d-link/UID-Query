/**
 * Created by g on 18-1-10.
 */
define(["app"], function (app) {

    app.register.controller('profileController', function ($scope, $timeout, BatchConfigService, $state, $stateParams, Current, utils) {
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
         * 基本信息
         */
        $scope.profileItems = ['ssid', 'vlan', 'bandwidthOpt', 'RFOptimization', 'schedule', 'devSet',
            'performance', 'wlanPartition', 'wirelessResource'];
        /**
         * 获取左侧列表、左侧列表事件
         */
        function getConfigurationTree() {
            BatchConfigService.getProfileTree(function (result) {
                if (result.success) {
                    $scope.sites = result.data;
                    if ($stateParams.id) {
                        for(var i=0;i<$scope.sites.length;i++){
                            for(var j=0;j<$scope.sites[i].networks.length;j++){
                                if($scope.sites[i].networks[j]._id==$stateParams.id){
                                    $scope.showNetwork = true;
                                    $scope.siteActive = $scope.sites[i];
                                    var net=$scope.sites[i].networks[j];
                                    BatchConfigService.getProfileByNetworkId(net._id, function(result){
                                        if (result.success) {
                                            $scope.profileActive = null;
                                            $scope.profileData = result.data;
                                            decrypthProfile();
                                            $scope.showProfile = true;
                                            $scope.networkActive = net;
                                            if ($scope.profileData) {
                                                $timeout(function(){
                                                    $scope.profileActive = 'ssid';
                                                    $stateParams.id=null;
                                                },100)
                                            };
                                        };
                                    });
                                }
                            }
                        }
                        Current.setProfile($stateParams.type);
                    }
                }
            });
        };
        getConfigurationTree();
        $scope.$on("refreshBCTree", function(){
            getConfigurationTree();
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
            $scope.networkActive = null;
            $scope.showProfile = false;
            $scope.profileActive = null;
        };
        // network
        $scope.showProfile = false;
        function decrypthProfile(){
            var ssid= $scope.profileData.contents.ssid;
            $scope.profileData.contents.performance.band24.notShow=false;
            $scope.profileData.contents.performance.band5.notShow=false;
            $scope.profileData.contents.performance.secBand5.notShow=false;
            if(ssid&&ssid.list){
                for(var i=0;i<ssid.list.length;i++){
                    if(ssid.list[i].passPhrase){
                        ssid.list[i].passPhrase= utils.decryptMethod($scope.profileData.uuid,ssid.list[i].passPhrase);
                    }
                    if(ssid.list[i].userPwd){
                        for(let k=0;k<ssid.list[i].userPwd.length;k++){
                            if(ssid.list[i].userPwd[k].password){
                                ssid.list[i].userPwd[k].password=utils.decryptMethod($scope.profileData.uuid,ssid.list[i].userPwd[k].password);
                            }

                        }
                    }
                    if(ssid.list[i].authentication==10){
                        if(ssid.list[i].band==1){
                            $scope.profileData.contents.performance.band24.notShow=true;
                        }
                        if(ssid.list[i].band==2){
                            $scope.profileData.contents.performance.band5.notShow=true;
                        }
                        if(ssid.list[i].band==3){
                            $scope.profileData.contents.performance.secBand5.notShow=true;
                        }
                    }
                }
            }
            if($scope.profileData.contents.devSet&&$scope.profileData.contents.devSet.password){
                $scope.profileData.contents.devSet.password = utils.decryptMethod($scope.profileData.uuid, $scope.profileData.contents.devSet.password);
            }

        }
        $scope.toggleNetwork = function(net){
            // 获取network的profile信息
            BatchConfigService.getProfileByNetworkId(net._id, function(result){
                if (result.success) {
                    $scope.profileActive = null;
                    $scope.profileData = result.data;
                    decrypthProfile();
                    $scope.showProfile = true;
                    $scope.networkActive = net;
                    if ($scope.profileData) {
                        $timeout(function(){
                            $scope.profileActive = 'profileView';
                        },100)
                    };
                };
            });
        };
        //刷新Profile信息
        $scope.$on('refreshActiveProfile',function(){
            BatchConfigService.getProfileByNetworkId($scope.networkActive._id, function(result){
                if (result.success) {
                    $scope.profileData = result.data;
                    decrypthProfile();
                };
            });
        })
        // profileItem
        //打开设定信息页面
        $scope.openSettingView = function(pro){
            $scope.profileActive = pro;
        };
        //切换到network页面
        $scope.goToNetwork = function () {
            $state.go('user.org.subdetail', {moudleId: 'network', parentId: 'configuration'});
        };

        $scope.$on('editProfile', function(d,type) {
            $scope.toggleSite(type.site);
            $scope.toggleNetwork(type);
            Current.setProfile('');
        });
        // 获取site下是否有用户修改且没有应用的network
        $scope.getApplyStatus = function(site){
            for (var i = 0; i < site.networks.length; i++) {
                if(site.networks[i].modifyTime>site.networks[i].applyTime){
                    return true;
                };
            };
            return false;
        }
    })
});
