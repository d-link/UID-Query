/**
 * Created by lizhimin on 2015/9/8.
 */
define(['app'], function (app) {
    'use strict';


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
            .iconSet('modal', "images/common/modal.svg", 16)
            .iconSet('status', "images/common/status.svg", 16)
            .iconSet('user', "images/common/user.svg", 16)
            .iconSet('common', "images/common/common.svg", 24)
            .iconSet('icon12', "images/common/icon_12.svg", 12)
            .iconSet('icon24', "images/common/icon_24.svg", 24)
            .iconSet('icon32', "images/common/icon_32.svg", 32)
            .iconSet('icon48', "images/common/icon_48.svg", 48)
            .iconSet('icon64', "images/common/icon_64.svg", 64);
        // blockUIConfig.template = '<div class="block-ui-overlay" style="opacity:0.6;background-color:#f5f5f5;"></div><div class="block-ui-message-container" style="left:"><image src="../public/images/loading_gif.gif"></image></div>';
        //  blockUIConfig.blockBrowserNavigation=false;
    });

    /*
     单页面程序需要做定时刷新的统一管理，根据不同的state加载不同的定时期
     */
    app.run(function ($rootScope, $state, $log, $timeout, Auth, moudlesService, CustomService) {
        $rootScope.currentModule="";
   moudlesService.globalBroadcast();
        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, $log, fromParams, $templateCache) {
            //全局的定时器，统一管理
            //依据不同的state和params变化，对页面进行刷新

                //按URL显示对应的菜单状态
                $rootScope.forgotStates = {
                    'userEmail': {'active': true, 'passed': false, 'btnDisabled': true},
                    'userInfo': {'active': false, 'passed': false, 'btnDisabled': true},
                    'userPass': {'active': false, 'passed': false, 'btnDisabled': false}
                };
                if (toParams.moudleId) {
                    moudlesService.showMenu(toParams.moudleId);
                } else {
                    moudlesService.showtitle(toState.url.substring(1, toState.url.length));
                }
        });
        $rootScope.$on('stateChangeSuccess', function ($templateCache, toParams) {
            $templateCache.removeAll();
            moudlesService.showMenu(toParams.moudleId);
            //  blockUI.stop();
        });
        $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
            $log.error('The request state was not found: ' + unfoundState);
        });

        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
            if (error.status == 404) {
                $state.go('anon.PageNotFount');
            }

        });
    });
    app.factory('AuthInterceptor', function ($q, $timeout, $injector,$rootScope,TS) {
        var StorageService = $injector.get('StorageService');
       //var jwtHelper= $injector.get('jwtHelper');
        var $http, $auth;
        $timeout(function () {
            $http = $injector.get('$http');
            $auth = $injector.get('Auth');
        });
        //用户信息失效
        function loseUser(){
            //返回APP登录页面
            window.location.href="dlinkbusiness://login"; 
        };
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

            requestError: function (rejection) {
                return $q.reject(rejection);
            },
            responseError: function (response) {
                console.log($rootScope.UserError);
                if (response.status === 401 || response.status === 403) {
                    StorageService.unset('auth_token');
                    //window.location = "/";
                    $.DialogByZ.Alert({Title: "", 
                                    //    Content :$rootScope.UserError,
                                    //    BtnL    :$rootScope.Confirm,
                                    Content: TS.ts('activation.timeOut'),
                                    BtnL   : TS.ts('common.confirm'),
                                       FunL    :loseUser});
                    return;
                } else if (response.status == 404) {
                    $injector.get('$state').go('anon.PageNotFount');
                } else if (response.status == 500) {
                    $injector.get('$state').go('anon.ServerError');
                }
                return $q.reject(response);
            }
        }
    });
    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push('AuthInterceptor');
    });
    app.config(["$stateProvider", "$urlRouterProvider", "$locationProvider", "AccessLevels", function ($stateProvider, $urlRouterProvider, $locationProvider, AccessLevels) {
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
                templateUrl: 'views/templates/404.html'
            })
            .state('anon.ServerError', {
                url: '/500',
                templateUrl: 'views/templates/500.html'
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
                templateUrl: 'views/index.html'
            })
            .state('user.org.detail', {
                url: '/:moudleId',
                views: {
                    'contentView': {
                        templateUrl: function (stateParams) {
                            var url = 'views/' + stateParams.moudleId + "/" + stateParams.moudleId + '.html';
                            return url;
                        }
                    }
                }
            })
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
                        }
                    }
                }
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

            }
        }).state('user.org.menuDetails.sub', {
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

        $stateProvider.state('user.org.subdetail.sub', {
            url: '/:pageId',
            views: {
                '': {
                    templateUrl: function (stateParams) {
                        var url = 'views/' + stateParams.moudleId + "/" + stateParams.pageId + '.html';
                        return url;
                    }
                }
            }
        });
 

        $urlRouterProvider.otherwise('/DNH');
       
    }]);
});