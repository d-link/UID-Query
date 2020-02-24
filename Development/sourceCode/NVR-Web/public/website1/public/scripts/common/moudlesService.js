/**
 * Created by lizhimin on 2015/12/24.
 */
define(["serviceModule"], function (services) {
    services.service("moudlesService", function ($http, $q, $rootScope, utils, Current, $timeout, ajaxService) {
        var moudle;
        var _org = Current.org();
        var userInfo = Current.user();
        this.moudles = function (gotoOrg) {
            var deferred = $q.defer();
            if (moudle && !gotoOrg) {
                deferred.resolve(moudle);
            } else {
                _org = Current.org();
                var menuFile = 'assets/moudles.json';
                if(userInfo.role == 'front desk user'){
                    menuFile = null;
                }else if (userInfo.role != 'root admin') {
                    menuFile = 'assets/moudles1.json';
                }
                if(menuFile){
                    $http.get(menuFile).then(function (resp) {
                        moudle = resp.data.moudles;
                        deferred.resolve(moudle);
                    });
                }else{
                    moudle = [];
                    deferred.resolve(moudle);
                }
            }
            return deferred.promise;
        };
        this.get = function (id) {
            if (moudle) {
                return utils.findById(moudle, id);
            }
        };
        this.resetModule = function () {
            var _org = Current.org();
            $http.get('assets/moudles.json').then(function (resp) {
                moudle = resp.data.moudles;
            });
        };
        this.showMenu = function (id) {
            this.moudles().then(function (data) {
                resetMenuState(moudle, id);
                $rootScope.$broadcast('menu State change');
                $rootScope.$broadcast("title", id);
            });
        };
        this.openMenu = function (id) {
            openMenuState(moudle, id);
            $rootScope.$broadcast("title", id);
        };
        this.showtitle = function (title) {
            $rootScope.$broadcast("title", title);
        };
        this.showDeviceIP = function (devId, id) {
            this.moudles().then(function (data) {
                resetMenuState(moudle, id);
                $rootScope.$broadcast('menu State change');
                $rootScope.$broadcast("devIP", devId);
            });
        }
        this.globalBroadcast = function () {
            function autoRefresh() {
                var timeInterval = 60 * 1000;
                if ($rootScope.currentModule == 'deviceManage') {
                    $rootScope.$broadcast('freshInventory');
                }
                if ($rootScope.currentModule == 'network') {
                    $rootScope.$broadcast('freshNetwork');
                }
                if ($rootScope.currentModule == 'dashboard') {
                    $rootScope.$broadcast('freshDashboard');
                }
                if ($rootScope.currentModule == 'firmware') {
                    $rootScope.$broadcast('refreshFWResult');
                }
                if ($rootScope.currentModule == 'ssl') {
                    $rootScope.$broadcast('refreshSSLResult');
                }
                if ($rootScope.currentModule == 'profile') {
                    $rootScope.$broadcast('refreshProfileResult');
                }
                if ($rootScope.currentModule == 'accessPoint') {
                    $rootScope.$broadcast('refreshAPList');
                    timeInterval = 30 * 1000;
                }
                if ($rootScope.currentModule == 'wirelessClient') {
                    $rootScope.$broadcast('refreshWirelessClient');
                    timeInterval = 30 * 1000;
                }
                if ($rootScope.currentModule == 'team') {
                    $rootScope.$broadcast('refreshTeam');
                    timeInterval = 30 * 1000;
                }
                if ($rootScope.currentModule == 'settings') {
                    $rootScope.$broadcast('refreshErrorMsg');
                    timeInterval = 30 * 1000;
                }
                $timeout(autoRefresh, timeInterval);
            }

            $timeout(autoRefresh, 10000);
        };
        this.getDateAndTime = function () {
            var timeInterval = 60 * 1000;

            function autoRefresh() {
                utils.getNodeTime(function () {
                    console.log("取到时间");
                });
                $timeout(autoRefresh, timeInterval);
            }

            $timeout(autoRefresh, timeInterval);
        };
        if (base_url.indexOf("dnh") > -1 || base_url.indexOf("DNH") > -1) {
            utils.getNodeTime(function (result) {
                if (result.success) {
                    //第一次在这里取个时间
                    NCTime = utils.format(new Date(NCTime), 'yyyy/MM/dd HH:mm:ss');
                    console.log("第一次取到时间:", NCTime);
                }
                $rootScope.$broadcast('menu State change');
            });
        } else {
            //登录页走这边
            ajaxService.post(base_url + '/auth/getDateAndTime', function (result) {
                if (result.success) {
                    //第一次在这里取个时间
                    NCTime = result.data.datetime;
                    NCTime = NCTime.replace(/-/g,'/');//解决IOS端页面new Date显示invalid Date的问题,兼容safari
                    NCTimeOffset = utils.changeTimeZone(result.data.timeZone.name);
                    NCTime = utils.format(new Date(NCTime), 'yyyy/MM/dd HH:mm:ss');
                    NCISOTime = new Date(new Date(result.data.datetime.replace(" ", "T").replace(/\//g, "-") + "Z").getTime() + NCTimeOffset * 60 * 1000).toISOString();
                    console.log("登录的时候第一次取到时间:", NCTime);
                    //$rootScope.$broadcast('menu State change');
                } else {
                    //NCTime = NCTime || utils.format(new Date(), 'yyyy/MM/dd HH:mm:ss');
                    //NCTimeOffset = NCTimeOffset || new Date().getTimezoneOffset();
                }
            });
        }


        function openMenuState(moudles, id) {
            if (!moudles) return;
            for (var i = 0; i < moudles.length; i++) {
                if (moudles[i].id == id) {
                    moudles[i].Active = true;
                    moudles[i].isOpen = !moudles[i].isOpen;
                } else {
                    moudles[i].isOpen = false;
                    moudles[i].Active = false;
                }
                /*   if (moudles[i].moudles && moudles[i].moudles.length > 0) {
                 for (var j = 0; j < moudles[i].moudles.length; j++) {
                 if (moudles[i].moudles[j].id == id) {
                 moudles[i].Active = true;
                 moudles[i].isOpen = true;
                 moudles[i].moudles[j].Active = true;
                 moudles[i].moudles[j].isOpen = !moudles[i].moudles[j].isOpen;
                 } else {
                 moudles[i].moudles[j].Active = false;
                 moudles[i].moudles[j].isOpen = false;
                 }
                 }

                 }*/
            }
        }

        function resetMenuState(moudles, id) {
            if (!moudles) return;
            for (var i = 0; i < moudles.length; i++) {
                if (moudles[i].id == id) {
                    moudles[i].Active = true;
                    moudles[i].isOpen = !moudles[i].isOpen;
                } else {
                    moudles[i].Active = false;
                    moudles[i].isOpen = false;
                }
                if (moudles[i].moudles && moudles[i].moudles.length > 0) {
                    for (var j = 0; j < moudles[i].moudles.length; j++) {
                        if (moudles[i].moudles[j].id == id) {
                            moudles[i].Active = true;
                            moudles[i].isOpen = true;
                            moudles[i].moudles[j].Active = true;
                            moudles[i].moudles[j].isOpen = !moudles[i].moudles[j].isOpen;
                        } else {
                            moudles[i].moudles[j].Active = false;
                            moudles[i].moudles[j].isOpen = false;
                        }
                        //目前只有两层菜单
                        /*  if (moudles[i].moudles[j].moudles && moudles[i].moudles[j].moudles.length > 0) {
                         for (var k = 0; k < moudles[i].moudles[j].moudles.length; k++) {
                         if (moudles[i].moudles[j].moudles[k].id == id) {
                         moudles[i].Active = true;
                         moudles[i].isOpen = true;
                         moudles[i].moudles[j].Active = true;
                         moudles[i].moudles[j].isOpen = true;
                         moudles[i].moudles[j].moudles[k].Active = true;
                         moudles[i].moudles[j].moudles[k].isOpen = !moudles[i].moudles[j].moudles[k].isOpen;
                         } else {
                         moudles[i].moudles[j].moudles[k].Active = false;
                         moudles[i].moudles[j].moudles[k].isOpen = false;
                         }
                         }
                         }*/
                    }

                }
            }
        }

    })

})
