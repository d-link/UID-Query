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
            .iconSet('bottom', "public/images/common/head_bottom.svg", 16)
            .iconSet('gridpager', "public/images/grid/grid_pager.svg", 16)
            .iconSet('status', "public/images/common/status.svg", 16)
            .iconSet('user', "public/images/common/user.svg", 16)
            .iconSet('icon24', "public/images/common/icon_24.svg", 24)
            .iconSet('icon48', "public/images/common/icon_48.svg", 48);
        //  blockUIConfig.blockBrowserNavigation=false;
    });

    app.factory('AuthInterceptor', function ($q, $timeout, $injector) {
        var StorageService = $injector.get('StorageService');

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
                    var model = sessionStorage.getItem("model");
                    //检测是否为移动端
                    if(model=='APP'){
                        StorageService.unset('auth_token');
                        //返回APP登录页面
                        window.location.href="dlinkbusiness://login"; 
                    }else{
                        //PC端
                        StorageService.unset('auth_token');
                        $injector.get('$state').go('anon.user.login');
                    }
                    // StorageService.unset('auth_token');
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
                templateUrl: '404.html'
            })
            .state('anon.ServerError', {
                url: '/500',
                templateUrl: '500.html'
            })
            .state('anon.user', {
                url: '/DNH',
                templateUrl: 'public/users/userForm.html'
            })
            .state('anon.user.login', {
                url: '/login',
                templateUrl: 'public/users/login.html',
                controller: 'LoginController'
            })
            .state('anon.user.activation', {
                url: '/activation',
                templateUrl: 'public/users/activation.html',
                controller: 'activationController'
            })
            .state('anon.user.appLogin', {
                url: '/appLogin',
                templateUrl: 'public/users/loading.html',
                controller: 'loadingController',
                params:{"token":null}
            })
            .state('anon.user.nucliasLogin', {
                url: '/nucliasLogin',
                templateUrl: 'public/users/nucliasLogin.html',
                controller: 'nucliasLoginController',
                params:{"nctoken":null}
            })
            .state('anon.user.appForgotPass.profile', {
                url: '/profile',
                templateUrl: 'public/users/appFindPass-profile.html'
            })
            .state('anon.user.forgotPass', {
                url: '/findPwd',
                templateUrl: 'public/users/forgotPassword.html',
                controller: 'ForgotPasswordController'
            }).state('anon.user.forgotPass.profile', {
                url: '/profile',
                templateUrl: 'public/users/findPass-profile.html'
            }).state('anon.user.forgotPass.valid', {
                url: '/valid',
                templateUrl: 'public/users/findPass-valid.html'
            }).state('anon.user.forgotPass.resetPass', {
                url: '/resetPass',
                templateUrl: 'public/users/findPass-resetPass.html'
            }).state('paypal', {
                url: '/paypal',
                templateUrl: 'public/users/paypal.html'
            }).state('paypalSet', {
                url: '/paypalSet',
                templateUrl: 'public/users/paypalSet.html'
            }).state('paypalExecute', {
                url: '/success',
                templateUrl: 'public/users/paypalExecute.html'
            }).state('ecp', {
                url: '/ecp',
                templateUrl: 'public/users/ecp.html'
            }).state('anon.nvr', {
                url: '/NVR',
                templateUrl: 'public/nvr-user/nvrUserForm.html'
            }).state('anon.nvr.nvrLogin', {
                url: '/nvrLogin',
                templateUrl: 'public/nvr-user/nvr-login.html',
                controller: "nvrLoginController"
            });;

        $urlRouterProvider.when("/DNH", "/DNH")
            //.when('/appLogin','/loading')
            .when('/appLogin?token&language&cwmName','/DNH/appLogin?token&language&cwmName')
            .when('/nucliasLogin?nctoken','/DNH/nucliasLogin?nctoken')
            .otherwise('/DNH/login');
        /* $locationProvider.html5Mode({enabled: true, requireBase: false}); */  // 设置一下这句即可
    }]);
});