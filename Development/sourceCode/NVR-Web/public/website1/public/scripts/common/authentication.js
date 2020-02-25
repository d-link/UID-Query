
/**
 * Created by lizhimin on 2015/12/7.
 */
//define(["app","localStorage"], function (app) {
define(["serviceModule", "crypto-js"], function (services) {
    services.service('Auth', function ($http, $location, $rootScope, StorageService, AccessLevels, ajaxService, Current, utils) {
        this.globalAction = {};
        this.browserOs = function (userAgent) {
            var na = window.navigator;
            var ua = (userAgent ? userAgent : na.userAgent);

            //----------------Browser-----------------

            var browser = getUA(ua);

            //---------------OS------------------

            var OS2 = getOS(ua);

            return { browser: browser, os: OS2.system + (OS2.version ? ' ' + OS2.version : '') };
        };
        function getUA(ua) {
            var bs = {
                '遨游': ['Maxthon'],
                '360浏览器': ['360SE'],
                '搜狗浏览器': ['SE', 'MetaSr'],
                '腾讯浏览器': ['TencentTraveler', 'QQBrowser'],
                'The world': ['The world'],
                'UC浏览器': ['UCWEB'],
                '猎豹安全浏览器': ['LBBROWSER']
            };
            //增加 AppleWebKit核心
            var ua = ua, tem, M = ua.match(/(AppleWebKit|edge|opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+(\.\d+)+)/i) || [];
            //console.log(M);
            //-------------Other-----------------
            var str;
            _.map(bs, function (val, key) {
                tem = ua.match(new RegExp('\\b(' + val.join('|') + ')\/(\\d+(\\.\\d+)+)', 'i'));
                if (tem == null)
                    tem = ua.match(new RegExp('\\b(' + val.join('|') + ')'))
                if (tem != null) {
                    str = tem[2] ? [key, tem[2]].join(' ') : key;
                    return false;
                }
            });
            if (str) return str;
            //--------------Opera/Edge----------------
            if (/(chrome|firefox|msie)/i.test(M[1])) {
                tem = ua.match(/\b(OPR|Edge|Opera)\/(\d+(\.\d+)+)/i);
                if (tem != null) return [tem[1], tem[2]].join(' ').replace('OPR', 'Opera');
            }
            //-------------IE-----------------
            if (/msie/i.test(M[0])) {
                return 'IE ' + (M[2] || '');
            }
            if (/trident/i.test(M[1])) {
                tem = /\brv[ :]+(\d+(\.\d+)+)/g.exec(ua) || [];
                return 'IE ' + (tem[1] || '');
            }
            //-------------Default-----------------
            M = M[2] ? [M[1], M[2]] : [na.appName, na.appVersion, '-?'];
            if ((tem = ua.match(/version\/(\d+(\.\d+)+)/i)) != null) M.splice(1, 1, tem[1]);
            return M.join(' ');
        }

        function getOS(ua) {
            var os = {};
            var sys = {
                'Windows': {
                    '3.1': 'NT 3.1',
                    '3.5': 'NT 3.5',
                    '3.51': 'NT 3.51',
                    '4.0': 'NT 4.0',
                    '5.0': '2000',
                    '5.1': 'XP',
                    '5.2': 'Server 2003',
                    '6.0': 'Vista',
                    '6.1': '7',
                    '7.0': '7',
                    '6.2': '8',
                    '6.3': '8.1',
                    '6.4': '10',
                    '10.0': '10'
                }
            };
            var temp;
            if (/Win(?:dows )?([^do]{2})\s?(\d+\.\d+)?/i.test(ua)) {
                os.system = 'Windows';
                if (RegExp.$1.toUpperCase() == 'NT') {
                    var v = sys.Windows[RegExp.$2];
                    console.log(RegExp.$2 + ' : ' + v);
                    os.version = v ? v : (os.system + ' ' + RegExp.$2);
                } else if (RegExp.$1 == '9x') {
                    os.version = 'ME';
                } else {
                    os.version = RegExp.$1;
                }
            }
            //ua.indexOf('X11') != -1
            else if (ua.indexOf('FreeBSD') != -1) {
                os.system = 'FreeBSD';
            }
            else if (ua.indexOf('OpenBSD') != -1) {
                os.system = 'OpenBSD';
            }
            else if (ua.indexOf('Linux') != -1) {
                os.system = 'Linux';
            }
            else if (ua.indexOf('Mac') != -1) {
                //Intel Mac OS X 10_9_2
                temp = ua.match(/\b(Mac)\s(\d+(\_\d+)+)/i);
                os.system = 'Mac OS';
            }
            else if (ua.indexOf('SunOS') != -1) {
                os.system = 'Solaris';
            }
            return os;
        }

        this.authorize = function (access) {
            if (access === AccessLevels.user) {
                var result = this.isAuthenticated();
                return result;
            } else {
                //  Current.setUser();
                //  StorageService.unset('auth_token');
                return true;
            }
        };
        this.isAuthenticated = function () {
            var result = Current.user();
            if (result && result.hasOwnProperty('email')) {

                return true;
            }
            return false;
        };
        this.login = function (credentials, status, mode, success) {

            credentials = angular.copy(credentials);
            credentials.password = utils.encryptMethod(credentials.email, credentials.password);

            ajaxService.post(base_url + '/auth/login', {
                userInfo: credentials,
                loginStatus: status,
                productMode: mode
            }, function (result) {
                if (result.success) {
                    //  Current.setUser(result.data);
                    //  StorageService.set('auth_token', JSON.stringify(result.data));
                }
                success(result);
            });
        };
        this.NSlogin = function (credentials, status, mode, success) {
            credentials = angular.copy(credentials);
            credentials.password = utils.encryptMethod(credentials.email, credentials.password);

            ajaxService.post(base_url + '/auth/loginNC', {
                userInfo: credentials,
                loginStatus: status,
                productMode: mode
            }, function (result) {
                if (result.success) {
                    //  Current.setUser(result.data);
                    //  StorageService.set('auth_token', JSON.stringify(result.data));
                }
                success(result);
            });
        };
        this.appLogin = function (credentials, success) {
            ajaxService.post(base_url + '/auth/appLogin', credentials, function (result) {
                if (result.success) {
                    Current.setUser(result.data);
                    success(result);
                    //  StorageService.set('auth_token', JSON.stringify(result.data));
                }
            });
        };
        this.nuclusLogin = function (credentials, success) {
            ajaxService.post(base_url + '/auth/nucliasLogin', credentials, function (result) {
                if (result.success) {
                    Current.setUser(result.data);
                    success(result);
                    //  StorageService.set('auth_token', JSON.stringify(result.data));
                }
            });
        };
        this.appCheck = function (credentials, success) {
            ajaxService.post(base_url + '/auth/getAppToken', {
                userInfo: credentials
            }, function (result) {
                success(result);
            });
        };
        this.logout = function (success, error) {
            // The backend doesn't care about logouts, delete the token and you're good to go.
            var user = Current.user();
            var logout = ajaxService.post(base_url + '/user/logout', {
                userId: user._id
            }, function () {
                Current.clearAll();
                if (success) {
                    success()
                }
            }, function () {
                Current.clearAll();
                if (error) error();
            });
        };
        this.getNeedCAPTCHA = function (success, error) {
            ajaxService.post(base_url + '/auth/needCAPTCHA', success, error);
        };
        this.getIsBlocked = function (success, error) {
            ajaxService.post(base_url + '/auth/checkBlockIP', success, error);
        }
        this.getUserInfo = function (formData, success, error) {
            ajaxService.post(base_url + '/user/getUser', formData, success, error);
        };
        this.update = function (formData, success, error) {
            ajaxService.post(base_url + '/user/update', formData, function (result) {
                if (result.success) {
                    Current.setUser(result.data);
                }
                success(result);
            });
        };
        this.upGrade = function (success, error) {
            ajaxService.post(base_url + '/auth/getFirmwareUpgradeStatus', function (result) {
                success(result);
            }, function (err) {
                if (error) error(err)
            });
        };
        this.changePassInitial = function (formData, success, error) {

            formData = angular.copy(formData);
            formData.oldpass = utils.encryptMethod(formData.userId, formData.oldpass);
            formData.newpass = utils.encryptMethod(formData.userId, formData.newpass);
            formData.confirmPassword = formData.newpass;

            ajaxService.post(base_url + '/auth/changePass', formData, success, error);
        };
        this.changePass = function (formData, success, error) {

            formData = angular.copy(formData);
            formData.oldpass = utils.encryptMethod(formData.userId, formData.oldpass);
            formData.newpass = utils.encryptMethod(formData.userId, formData.newpass);

            ajaxService.post(base_url + '/user/changePass', formData, success, error);
        };
        this.changeEmail = function (formData, success, error) {
            ajaxService.post(base_url + '/user/changeEmail', formData, success, error);
        };
        this.checkEmailExist = function (email, success, error) {
            $http.post(base_url + "/auth/emailExist", { email: email }).then(success);
        };
        this.checkValidCode = function (email, validCode, success, error) {
            $http.post(base_url + "/auth/checkCaptcha", { email: email, code: validCode }).then(success);
        };
        this.getCaptcha = function (success) {
            $http.get(base_url + '/auth/getCaptcha?width=100&height=26').then(success);
        };
        this.forgotPass = function (email, success, error) {
            $http.post(base_url + "/auth/forgotPass", { email: email }).then(success);
        };
        this.resetPass = function (email, pass, validCode, success, error) {
            $http.post(base_url + "/auth/resetPass", { email: email, newPassword: pass, code: validCode }).then(success);
        };
        this.loadMode = function (mode) {
            //获取用户信息
            var user = Current.user();
            //对入口进行判断
            if (mode == "DNH") {
                window.location = "/entrance/";
                // window.location = "/nuclias_connect/#!/dnh";
            } else if (mode == "APP") {
                window.location = "/appSite";
            }
        };
        this.cheackLicenseOrigin = function (formData, success, error) {
            ajaxService.post(base_url + "/auth/checkLicenseOrigin", formData, success, error);
        };
        this.cheackLicense = function (success, error) {
            ajaxService.post(base_url + "/auth/checkLicense", {}, success, error);
        };
        this.updateLastPage = function (formData, success, error) {
            ajaxService.post(base_url + "/user/updateLastPage", formData, success, error);
        };
        this.getAppBreathing = function (formData, success, error) {
            ajaxService.post(base_url + "/app/getAppBreathing", formData, success, error);
        };
        this.showAlert = function (msg) {
            $rootScope.$broadcast("logoutAlert", msg);
        };
        this.showUpgrade = function (msg) {
            $rootScope.$broadcast("isUpgrading", msg);
        };
        /*
        * 尹雪雪 2019.6.25
        * App Mobile页，执行logout时调用些接口，用于注销用户并更新用户在线状态
        */
        this.appLogout = function () {
            // 由于base_url的值来源 public\website1\nuclias_connect\main.js 中的定义的：var base_url = "/api/web/nuclias_connect";
            // /api/web/auth 路径来源于app.js 中定义的：app.use("/api/web/auth", routes);
            ajaxService.post('/api/web/auth/appLogout');
        };
    });
});