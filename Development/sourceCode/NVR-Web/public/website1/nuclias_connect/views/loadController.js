/**
 * Created by lizhimin on 2015/12/16.
 */

define(["app"], function (app) {
    //var app = angular.module('app', []);
    //var app = require('../app');
    app.register.controller('LoadController', function ($scope, $state, $http, $uibModal, Auth, utils, moudlesService, OrganizationService, NetworkService, $stateParams, StorageService, Current) {

        var lastTime = new Date().getTime();
        var currentTime = new Date().getTime();
        var timeOut = 15 * 60 * 1000;//15分钟跳出系统

        OrganizationService.getNodeEnv(function (result) {
            if (result.success) {
                Current.setNodeEnv(result.data);
            }
        });

        window.document.onmousemove = function () {
            lastTime = new Date().getTime();
        }

        function checkTimeout() {
            currentTime = new Date().getTime();
            if (!isFWUpgrade) {//如果不在固件更新就要循环检测
                if (currentTime - lastTime > timeOut) {
                    console.log("operation timeout");
                    Auth.logout(function () {
                        StorageService.set('noticMsg', "timeOut");
                        window.location = "/";
                    }, function () {
                        window.location = "/";
                    });
                }
            }

        }
        $scope.$on('logoutAlert', function (event) {
            window.location = "/";
           // showAlert(msg);
        });
        //固件更新
        $scope.$on('isUpgrading', function (event) {
            if (!isFWUpgrade) {//如果当前的这个不在固件更新就跳出去
                window.location = "/#!/DNH/login";
                // showAlert(msg);
            }
        });

        window.setInterval(checkTimeout, 30000);

        if (window.location.href.indexOf('DNH/') == -1) {
            OrganizationService.listAllOrgs(function (orgs) {
                if (orgs && orgs.length > 0) {
                    var org = orgs[0];
                    org.orgId = org._id;
                    // if (Current.org() && Current.org().logo) {
                    //     org.logo = Current.org().logo;
                    // }
                    Current.setOrg(org);
                    $scope.org = Current.org();
                    Current.broadcast('current org changed');
                    $scope.$emit('moudle changed');


                    if (Current.user().role == "front desk user") {
                        //if (org.name == 'frontdesk' && org.networkCount > 0) {
                        $state.go('frontdesk');
                        return;
                    }

                    /**
                    * 多加一个板子的配置，第一次的时候登录的时候要弹出必须配置板子设置
                    * */
                    if (!org.basicConfigured) {
                        var modalInstance = $uibModal.open({
                            backdrop: 'static',
                            animation: true,
                            keyboard: false,
                            templateUrl: './views/configuration/addChipSystemData.html',
                            size: 'w800',
                            windowClass: 'cwmAddNetwork',
                            resolve: {
                                tag: 0,
                                network: null
                            },
                            controller: 'addChipSystemDataController'
                        });
                        modalInstance.result.then(function (data) {
                            $state.go('user.org.detail', {moudleId: 'dashboard'});
                            moudlesService.showMenu('dashboard');
                        }, function (data) {
                            $state.go('user.org.detail', {moudleId: 'dashboard'});
                            moudlesService.showMenu('dashboard');
                        });
                        return;
                    }else{
                        NetworkService.listAllNetworks(function (result) {
                            if (result && result.data) {
                                var networks = result.data;
                                if ((!org.country && !org.timeZone) || (!networks || networks.length <= 0)) {
                                    var tag = 0;
                                    if((org.country && org.timeZone && Object.keys(org.country).length > 0 && Object.keys(org.timeZone).length > 0) && (!networks || networks.length <= 0)){
                                        tag = 1;
                                    }
                                    var modalInstance = $uibModal.open({
                                        backdrop: 'static',
                                        animation: true,
                                        keyboard: false,
                                        templateUrl: './views/configuration/addNetwork.html',
                                        size: 'w800',
                                        windowClass: 'cwmAddNetwork',
                                        resolve: {
                                            tag: tag,
                                            secondaryTime: true,
                                            network: null
                                        },
                                        controller: 'addNetworkController'
                                    });
                                    modalInstance.result.then(function (data) {
                                        $state.go('user.org.detail', {moudleId: 'dashboard'});
                                        moudlesService.showMenu('dashboard');
                                    }, function (data) {
                                        $state.go('user.org.detail', {moudleId: 'dashboard'});
                                        moudlesService.showMenu('dashboard');
                                    });
                                    return;
                                }

                                if (networks && networks.length > 0) {
                                    $state.go('user.org.detail', {moudleId: 'dashboard'});
                                    moudlesService.showMenu('dashboard');
                                } else {
                                    $state.go('user.org.subdetail', {moudleId: 'network', parentId: 'configuration'});
                                    moudlesService.showMenu('network');
                                }

                            }
                        })
                    }

                }
            });
        }

        $scope.errors = [];
        $scope.users = {};
        /*  moudlesService.all().then(function (mou) {
         $scope.moudle = mou;
         });*/
        $scope.goToRandom = function () {

            $state.go('user.org.detail', {moudleId: 'dashboard'});
            // moudlesService.showMenu('summary');
            var randId = "network";
            $state.go('user.org.detail', {moudleId: randId, parentId: 'organization'});
        };
        $scope.showSub = function (id) {
            moudlesService.showMenu(id);
            changeDivHeight();
        };
        $scope.openSub = function (id) {
            moudlesService.openMenu(id);
            changeDivHeight();
        };
        $scope.getArrow = function (isOpen) {
            if (isOpen) {
                return "bottom:left_arrow_down";
            } else {
                return "bottom:left_arrow_right";
            }
        };
        $scope.showScroll = function () {
            var sidebar = document.getElementsByClassName('sidebar')[0];
            if (sidebar.clientHeight < sidebar.scrollHeight) {
                sidebar.style.overflowY = "auto";
            } else {
                sidebar.style.overflowY = "hidden";
            }
        };
        $scope.hideScroll = function () {
            var sidebar = document.getElementsByClassName('sidebar')[0];
            sidebar.style.overflowY = "hidden";
        };
        $scope.showMenu = function () {
            $scope.$emit('hide', false);
        };
        $scope.hideMenu = function () {
            $scope.$emit('hide', true);
        };

        //  $scope.goToRandom();
        /* $scope.test = function () {
         $scope.errors = [];
         $http.get(base_url + '/api/web/list').
         success(function (result) {
         var data = result;
         $scope.goToRandom();
         }).error(function (err) {
         $scope.errors.push(err);
         });
         };*/
        // $scope.test();
    });
});