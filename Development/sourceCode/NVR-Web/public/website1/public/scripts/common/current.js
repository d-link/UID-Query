/**
 * Created by lizhimin on 2015/12/11.
 */

define(["serviceModule"], function (services) {
    services.factory('Current', function (ajaxService, $q, $rootScope, StorageService) {
        var global = {};
        var curOrg = null;
        var curUser = null;
        var notification = 'All';
        var deviceList = 'All';
        var profile = '';
        var curDevices = [];
        var nodeEnv = 'development';
        return {
            getDevice: function (id) {
                var _temp = StorageService.get('devicedetail');
                if (_temp) {
                    curDevices = angular.fromJson(_temp);
                    var result = _.find(curDevices, {_id: id});
                    return result;
                }
            },
            setDevice: function (device) {
                var _temp = StorageService.get('devicedetail');
                if (_temp) {
                    curDevices = angular.fromJson(_temp);
                }
                var temp = _.find(curDevices, {_id: device._id});
                if (temp) {
                    curDevices = _.reject(curDevices, {_id: device._id})
                }
                curDevices.push(device);

                StorageService.set('devicedetail', JSON.stringify(curDevices));
            },
            user: function () {
                if (!curUser && curUser != {}) {
                    var _user = StorageService.get('currentUser');
                    if (_user) {
                        _user = angular.fromJson(_user);
                        if (!_user.photo || _user.photo == '') {
                            _user.photo = "/public/images/default-user.png";
                        } else {
                            _user.photo = root_url + _user.photo;
                        }
                        curUser = _user;
                    } else {
                        curUser = {};
                    }
                }
                return curUser;
            },
            setUser: function (user) {
                curUser = user;
                if (user) {
                    //console.log("save current user:" + JSON.stringify(user));
                    StorageService.set('currentUser', JSON.stringify(user));
                } else {
                    StorageService.unset('currentUser');
                    StorageService.unset('auth_token');
                }
                if (!curUser.photo || curUser.photo == '') {
                    curUser.photo = "/public/images/default-user.png";
                } else {
                    curUser.photo = root_url + curUser.photo;
                }
                $rootScope.$broadcast("setUser");
            },
            orgs: function () {
                var deferred = $q.defer();
                ajaxService.post(base_url + '/org/list', {userId: this.user()._id},
                    function (result) {
                        deferred.resolve(result.data);
                    }
                );
                return deferred.promise;
            },
            setOrg: function (_org) {
                curOrg = _org;
                if (_org) {
                    // global.org=_org;
                    StorageService.set('currentOrg', JSON.stringify(_org));
                } else {
                    //  global.org=undefined;
                    StorageService.unset('currentOrg');
                }
                if (curOrg && curOrg.logo != '/public/images/default-user.png') {

                    if (('string' == typeof curOrg.logo) && curOrg.logo.indexOf('http') == -1) {
                        curOrg.logo = root_url + curOrg.logo;
                    }
                }
                // this.broadcast('org changed');
            },
            org: function () {
                if (curOrg) return curOrg;
                else {
                    var _org = StorageService.get('currentOrg');
                    if (_org) {
                        _org = angular.fromJson(_org);
                        if (_org.logo != '/public/images/default-user.png') {
                            // if('string' == typeof _org.logo && _org.logo.indexOf('?') > -1){
                            //     _org.logo = _org.logo.split('?')[0]+"?"+(new Date().getTime());
                            // }
                            if (('string' == typeof _org.logo) && _org.logo.indexOf('http') == -1) {
                                _org.logo = root_url + _org.logo;
                            }
                        }
                        curOrg = _org;
                    } else {
                        curOrg = null;
                    }
                    return curOrg;
                }
            },
            //清空缓存
            clearAll: function () {
                StorageService.unset('currentOrg');
                StorageService.unset('currentUser');
                StorageService.unset('devicedetail');
            },
            broadcast: function (event) {
                $rootScope.$broadcast(event);
            },
            getLang: function () {
                if (global && global.lang)
                    return global.lang;
                else return "en";
            },
            setLang: function (lang) {
                if (global) {
                    global.lang = lang;
                }
            },
            setNotification: function (type) {
                notification = type;
            },
            getNotification: function () {
                return notification;
            },
            setProfile: function (id) {
                profile = id;
            },
            getProfile: function () {
                return profile;
            },
            setDeviceList: function (type) {
                deviceList = type;
            },
            getDeviceList: function () {
                return deviceList;
            },
            setNodeEnv: function (_nodeEnv) {
                nodeEnv = _nodeEnv;
            },
            getNodeEnv: function () {
                return nodeEnv;
            }

        }
    })

})