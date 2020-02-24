/**
 * Created by lizhimin on 2015/9/8.
 */
define(['app'], function (app) {
    'use strict';
    /* var globalEnum=require('globalEnum');
     app.constant('AccessLevels', {
     anon: 0,
     user: 1
     });*/
//load(function(app) {
    
    app.config(function ($mdIconProvider, $sceDelegateProvider) {
        
        $sceDelegateProvider.resourceUrlWhitelist(['**', 'self']);
        // Register icon IDs with sources. Future $mdIcon( <id> ) lookups
        // will load by url and retrieve the data via the $http and $templateCache
        $mdIconProvider
            .iconSet('menu', 'images/common/leftmenu.svg', 24)
            .iconSet('menu11', 'images/common/leftmenu_11.svg', 11)
            .iconSet('bottom', "images/common/head_bottom.svg", 16)
            .iconSet('org', "images/org/org.svg", 24)
            .iconSet('gridpager', "images/grid/grid_pager.svg", 16)
            .iconSet('check', "images/grid/grid_check.svg", 16)
            .iconSet('uncheck', "images/grid/grid_uncheck.svg", 16)
            .iconSet('modal', "images/common/modal.svg", 16)
            .iconSet('status', "images/common/status.svg", 16)
            .iconSet('user', "images/common/user.svg", 16)
            .iconSet('common', "images/common/common.svg", 24)
            .iconSet('icon12', "images/common/icon_12.svg", 12)
            .iconSet('icon24', "images/common/icon_24.svg", 24)
            .iconSet('icon32', "images/common/icon_32.svg", 32)
            .iconSet('icon48', "images/common/icon_48.svg", 48)
            .iconSet('icon64', "images/common/icon_64.svg", 64)
            .iconSet('eyes', "images/common/eyes-16.svg", 16);
        //  blockUIConfig.template = '<div class="block-ui-overlay" style="opacity:0.6;background-color:#f5f5f5;"></div><div class="block-ui-message-container" style="left:"><image src="../public/images/loading_gif.gif"></image></div>';
        //  blockUIConfig.blockBrowserNavigation=false;
    });
    //解决报错 Possibly unhandled rejection” error,因为取消http请求
    //https://github.com/angular-ui/ui-router/issues/2889,https://stackoverflow.com/questions/41063947/angular-1-6-0-possibly-unhandled-rejection-error
    app.config(['$qProvider', function ($qProvider) {
         $qProvider.errorOnUnhandledRejections(false);
     }]);
    //大小写验证有问题，版本升级导致所以全局赋值
    app.config(function () {
        angular.lowercase = angular.$$lowercase;
        angular.uppercase = angular.$$uppercase;
    });

    /*
     单页面程序需要做定时刷新的统一管理，根据不同的state加载不同的定时期
     */
    app.run(function ($rootScope, $state, $log, $timeout, Auth, moudlesService, CustomService, $http) {
        $rootScope.currentModule = "";
        $rootScope.currentURL = "";
        moudlesService.globalBroadcast();
        moudlesService.getDateAndTime();//开启定时
        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, $log, fromParams, $templateCache) {
            //全局的定时器，统一管理
            //依据不同的state和params变化，对页面进行刷新
            //console.log("$http.pendingRequests", $http.pendingRequests)
            $http.pendingRequests.forEach(function (request) {
                if (request.cancel && request.url != '/api/web/dnh/systemSetting/getDateAndTime') {
                    request.cancel.resolve();
                }
                //console.log("request", request)
            });
            // angular.forEach($http.pendingRequests, function (request) {
            //     if (request.cancel) {
            //         request.cancel.resolve();
            //     }
            //     console.log("request", request)
            // });
            if (!Auth.authorize(toState.data.access)) {
                event.preventDefault();
                //   $state.go('anon.user.login');
                window.location = "/";
            }
            else {
                $rootScope.currentURL = {toState: toState, toParams: toParams};
                if (toState.name == "user.org.subdetail" || toState.name == "user.org.detail") {
                    $rootScope.currentModule = toParams.moudleId;

                }
                //按URL显示对应的菜单状态
                $rootScope.forgotStates = {
                    'userEmail': {'active': true, 'passed': false, 'btnDisabled': true},
                    'userInfo': {'active': false, 'passed': false, 'btnDisabled': true},
                    'userPass': {'active': false, 'passed': false, 'btnDisabled': false}
                };

                if (toParams.id) {
                    moudlesService.showDeviceIP(toParams.id, toParams.moudleId);
                } else {
                    if (toParams.moudleId) {
                        moudlesService.showMenu(toParams.moudleId);
                    } else {
                        moudlesService.showtitle(toState.url.substring(1, toState.url.length));
                    }
                }
            }

            /**
             *  记录用户习惯
             */
            /*   CustomService.setUseCustom($rootScope.customParam, function (result) {
                   if (result.success) {
                   }
               });*/
            if ($rootScope.customAction) {
                CustomService.setPageAction($rootScope.customAction, function (result) {
                    if (result.success) {
                    }
                });
            }

        });
        $rootScope.$on('stateChangeSuccess', function ($templateCache, toParams) {
            $templateCache.removeAll();
            moudlesService.showMenu(toParams.moudleId);
            //  blockUI.stop();
        });
        $rootScope.$on('changeLang1', function () {
            $state.go($rootScope.currentURL.toState.name,
                {moudleId: $rootScope.currentURL.toParams.moudleId, parentId: $rootScope.currentURL.toParams.parentId},
                {
                    reload: true
                });
            //  blockUI.stop();
        });
        $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
            $log.error('The request state was not found: ' + unfoundState);
        });

        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
            if (error.status == 404) {
                $state.go('anon.PageNotFount');
            }
            /* $log.error('An error occurred while changing states: ' + error);

             $log.debug('event', event);
             $log.debug('toState', toState);
             $log.debug('toParams', toParams);
             $log.debug('fromState', fromState);
             $log.debug('fromParams', fromParams);*/
        });

    });
    app.factory('AuthInterceptor', function ($q, $timeout, $injector) {
        var StorageService = $injector.get('StorageService');
        //var jwtHelper= $injector.get('jwtHelper');
        var $http, $auth;
        $timeout(function () {
            $http = $injector.get('$http');
            $auth = $injector.get('Auth');
        });
        return {
            request: function (config) {
                config.headers = config.headers || {};
                var token;
                if (StorageService.get('auth_token')) {
                    token = StorageService.get('auth_token');
                }
                if (token) {
                    config.headers.Authorization = 'Bearer ' + token;
                }

                return config;
            },
            /* response:function(response){
             var token = response.headers.Authorization;
             StorageService.set('auth_token',token);
             console.log(token);
             },*/
            requestError: function (rejection) {
                return $q.reject(rejection);
            },
            responseError: function (response) {
                if (response.status === 401 || response.status === 403) {
                    StorageService.unset('auth_token');
                    window.location = "/";
                    // $injector.get('$state').go('anon.user.login');
                    /* return $auth.refresh()
                     .then(function () {
                     $injector.get('$state').go('anon.login');
                     })
                     .catch(function () {
                     return $q.reject(response);
                     });*/
                } else if (response.status == 500) {
                    $injector.get('$state').go('anon.ServerError');
                } else if (response.status === 405) {
                    StorageService.unset('auth_token');
                    window.location = "/#!/DNH/login";
                } else if (response.status == 510) {
                    StorageService.set('noticMsg', "csStop");
                    $auth.showAlert('csStop');
                } else if (response.status == 511) {
                    StorageService.set('ssoMsg', "csStop");
                    $auth.showAlert('csStop');
                    window.location = "/#!/DNH/login";
                } else if (response.status == 555) {//在固件更新
                    StorageService.set('logout', "UpgradeHint");
                    $auth.showUpgrade('isUpgrading');
                } else if (response.status == 404) {
                    $injector.get('$state').go('anon.PageNotFount');
                } else {
                    StorageService.unset('noticMsg');
                }
                return $q.reject(response);
            }
        }
    });
    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push('AuthInterceptor');
    });
    app.config(function ($controllerProvider, $compileProvider, $filterProvider, $provide) {
        app.register = {
            //得到$controllerProvider的引用
            controller: $controllerProvider.register,
            //同样的，这里也可以保存directive／filter／service的引用
            directive: $compileProvider.directive,
            factory: $provide.factory,
            filter: $filterProvider.register,
            service: $provide.service
        };
    })
    app.config(["$stateProvider", "$urlRouterProvider", "$locationProvider", "AccessLevels", function ($stateProvider, $urlRouterProvider, $locationProvider, AccessLevels) {
        //var StorageService = $injector.get('StorageService');
        //var _user = StorageService.get('currentUser');
        var userInfo = window.localStorage.getItem("currentUser");
        if (userInfo) {
            userInfo = angular.fromJson(userInfo);
        } else {
            userInfo = {};
        }
        //console.log("==========>",userInfo.role == 'front desk user')
        /**
         * 页面菜单权限说明：
         * 1、root admin                    所有菜单访问权限
         * 2、front desk user               只有专属菜单访问权限
         * 3、除了1和2,其它都是这个权限       比1少了一个user manager菜单
         */
        // 延迟加载方法
        app.loadJs = function (files) {
            //var files = 'views/' + $params.name + 'Controller.js';
            return {
                ctrl: function ($q) {
                    var wait = $q.defer();
                    require(files, function () {
                        wait.resolve();
                    });
                    return wait.promise;
                }
            };
        };
        $stateProvider
            .state('anon', {
                abstract: true,
                template: '<ui-view/>',
                data: {
                    access: AccessLevels.anon
                }
            })
            .state('anon.PageNotFount', {
                url: '/404',
                templateUrl: '../404.html'
            })
            .state('anon.ServerError', {
                url: '/500',
                templateUrl: '../500.html'
            });
        $stateProvider
            .state('user', {
                abstract: true,
                template: '<div data-nav-header ></div><ui-view/>',
                data: {
                    access: AccessLevels.user
                }
            })
            .state('user.org', {
                url: '/DNH',
                controller: "LoadController",
                templateUrl: 'views/index.html',
                resolve: app.loadJs(['./views/loadController.js', 'views/configuration/addChipSystemDataController.js', 'scripts/directives/echart-directive', 'scripts/directives/theme', 'scripts/directives/echart-connect-directive', 'views/configuration/addNetworkController.js'])
            })
        if(userInfo.role != "front desk user" && userInfo.role){
            $stateProvider
                .state('user.org.detail', {
                    url: '/:moudleId',
                    views: {
                        'contentView': {
                            templateUrl: function (stateParams) {
                                var url = 'views/' + stateParams.moudleId + "/" + stateParams.moudleId + '.html';
                                return url;
                            },
                        }
                    },
                    resolve: app.loadJs([
                        'views/dashboard/dashboardController.js'])
                })
            $stateProvider
                .state('user.org.subdetail', {
                    url: '/:parentId/:moudleId',
                    views: {
                        'contentView': {
                            templateUrl: function (stateParams) {
                                var parentId = stateParams.parentId;
                                var url = 'views/' + stateParams.moudleId + '.html';
                                if (parentId != "") {
                                    url = 'views/' + parentId + "/" + stateParams.moudleId + '.html';
                                }
                                return url;
                            },

                        },
                    },
                    resolve: app.loadJs(['scripts/services/maintenance/batchConfigService', 'scripts/services/maintenance/batchConfigService', 'scripts/services/report/reportExportService', 'scripts/services/organization/teamService', 'scripts/services/inventory/deviceDetailService', 'scripts/services/log/logService', 'views/monitor/accessPointController.js', 'views/monitor/wirelessClientController.js',
                        'views/configuration/networkController.js', 'views/configuration/profileController.js', 'views/configuration/firmwareController.js',
                        'views/configuration/sslController.js', 'views/configuration/paymentGatewayController.js', 'views/report/hotTimeController.js',
                        'views/report/hotAPController.js', 'views/report/hotAPMapCreateController.js', 'views/report/hourlyController.js',
                        'views/report/dailyController.js', 'views/log/traplogController.js', 'views/log/syslogController.js', 'views/log/systemlogController.js',
                        'views/log/devicelogController.js', 'views/system/deviceManageController.js', 'views/system/teamController', 'views/system/sysSettingsController.js',
                        'views/system/aboutController.js', 'views/configuration/ticTok.js', 'views/configuration/site-SSID.js', 'views/configuration/site-VLAN.js',
                        'views/configuration/profileView', 'views/configuration/timeSchedule', 'views/configuration/site-Bandwith', 'views/configuration/site-Device',
                        'views/configuration/site-Firmware', 'views/configuration/site-Performance', 'views/configuration/site-RF', 'views/configuration/site-Schedule',
                        'views/configuration/site-SSL', 'views/configuration/site-Wireless', 'views/configuration/site-Wlan', 'views/configuration/selectDate', 'views/system/downloadController'])
                })
            $stateProvider.state('user.org.CurrentDetail', {
                url: '/:parentId/:moudleId/:id',
                views: {
                    'contentView': {
                        templateUrl: function (stateParams) {
                            var parentId = stateParams.parentId;
                            var url = 'views/' + stateParams.moudleId + '.html';
                            if (parentId != "") {
                                url = 'views/' + parentId + "/" + stateParams.moudleId + '.html';
                            }
                            return url;
                        }
                    }

                },
            });
            //菜单中没有的子页面 deviceDetail页面，detail下面的tab页签
            $stateProvider.state('user.org.menuDetails', {
                url: '/:parentId/:moudleId/:pageId/:id',
                views: {
                    'contentView': {
                        templateUrl: function (stateParams) {
                            var url = 'views/' + stateParams.moudleId + "/" + stateParams.pageId + '.html';
                            return url;
                        }
                    }

                },
                resolve: app.loadJs(['scripts/services/inventory/deviceDetailService', 'views/accessPoint/deviceDetailController',])
            })
            /*这个暂时好像没有路由跳转*/
            .state('user.org.menuDetails.sub', {
                url: '/:subId',
                views: {
                    '': {
                        templateUrl: function (stateParams) {
                            var url = 'views/' + stateParams.moudleId + "/" + stateParams.subId + '.html';
                            return url;
                        }
                    }
                }
            });
            /*这个注释掉了*/
            // $stateProvider.state('user.org.subdetail.sub', {
            //     url: '/:pageId',
            //     views: {
            //         '': {
            //             templateUrl: function (stateParams) {
            //                 var url = 'views/' + stateParams.moudleId + "/" + stateParams.pageId + '.html';
            //                 return url;
            //             }
            //         }
            //     }
            // });
            /*
            * front desk
            * test
            */
        }
        if(userInfo.role == "front desk user"){
            $stateProvider.state('frontdesk', {
                url: '/frontdesk',
                controller: "frontdeskController",
                templateUrl: 'views/frontDesk/frontDesk.html',
                data: {
                    access: AccessLevels.user
                },
                resolve: app.loadJs(["../public/vendor/wangEditor/release/wangEditor.min", 'scripts/services/frontdesk/frontdeskService', 'views/frontDesk/frontDeskController'])
            });
            $stateProvider.state('printPreview', {
                url: '/printPreview',
                controller: "printPreviewController",
                templateUrl: 'views/frontDesk/printPreview.html',
                data: {
                    access: AccessLevels.user
                },
                resolve: app.loadJs(['scripts/services/frontdesk/frontdeskService', 'views/frontDesk/frontDeskController', 'views/frontDesk/printPreviewController',])
            });
            $stateProvider.state('multiPrintPreview', {
                url: '/multiPrintPreview',
                controller: "printPreviewController",
                templateUrl: 'views/frontDesk/multiPrintPreview.html',
                data: {
                    access: AccessLevels.user
                },
                resolve: app.loadJs(['scripts/services/frontdesk/frontdeskService', 'views/frontDesk/frontDeskController', 'views/frontDesk/printPreviewController',])
            });
        }
        $urlRouterProvider.when("/orgManage", "/orgManage").otherwise('/DNH');
        /* $locationProvider.html5Mode({enabled: true, requireBase: false});*/   // 设置一下这句即可
    }]);
//})
});
