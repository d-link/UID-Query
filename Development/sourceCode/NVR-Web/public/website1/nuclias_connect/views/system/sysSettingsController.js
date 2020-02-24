/**
 * Created by zhiyuan on 2017/12/14.
 */
define(["app"], function (app) {

    app.register.controller('sysSettingsController', function ($rootScope, $scope, $location, $translate, $uibModal, $state, $http, Current, ajaxService, Upload, OrganizationService, utils, $timeout, TS, Nuclias) {

        //隐藏form，显示倒计时
        $scope.isShowForm = true;
        $scope.isShowUpgradeForm = true;
        $scope.isShowLanForm = true;
        $scope.isShowConnectionForm = true;
        //从so或者是数据库取出来的原数据对象，判断是否有过更改
        $scope.originalField = {};
        //输入的对象
        $scope.inputField = {};

        /**
         * SSO
         */

        var currentLang = $translate.proposedLanguage() || $translate.use();
        if (currentLang == 'fr' || currentLang == 'jp' || currentLang == 'es' || currentLang == 'de' || currentLang == 'ru' || currentLang == 'tk') {
            $scope.col3 = true;
        } else {
            $scope.col3 = false;
        }
        //console.log("当前语言", currentLang);
        $scope.ssoLink = {link: "<a href='https://connect.nuclias.com' target='_blank'>" + TS.ts('settings.nucliasLink') + "</a>"};
        // 1. init
        // 1.1 creak link for Nuclias reg page
        $scope.nucliasUrl = function () {
            //window.open('https://register.us2-rdqa.nuclias.com/#/login?s=cwm');
            window.open('https://register.euqa.nuclias.com/#/login?s=dnc ');
        };
        // 1.2 local variable
        $scope.sso = {
            ssoEnable: false,
            ssoEmail: '',
            password: '',
            public_ip: '',
            port: ''
        };
        $scope.ssoErrorMessage = '';
        $scope.currentSSO = {};
        $scope.ssoBtnDisabled = true;
        $scope.ssoCurrentStatus = false;
        $scope.ssoTimeOut = false;
        $scope.NSError = false;
        $scope.tokenError = false;
        $scope.forgot = false;
        // 1.3 default value
        $scope.currentSSO.ssoEmail = $scope.sso.ssoEmail;
        $scope.currentSSO.password = $scope.sso.password;
        $scope.currentSSO.enableSSO = $scope.sso.ssoEnable;
        $scope.currentSSO.public_ip = $scope.sso.public_ip;
        $scope.currentSSO.port = $scope.sso.port;

        // 2. get SSO info from DB
        Nuclias.getSSOInfo(function (result) {
            //console.log(result);
            if (result.success) {
                //console.log("getSSOInfo: " + JSON.stringify(result, null, 4));
                // 2.1  get sso account
                $scope.sso.ssoEmail = result.data.account;
                $scope.sso.password = utils.decryptMethod(result.data.account, result.data.password);
                $scope.sso.public_ip = result.data.public_ip;
                $scope.sso.port = parseInt(result.data.port);
                $scope.currentSSO.ssoEmail = $scope.sso.ssoEmail;
                $scope.currentSSO.password = $scope.sso.password;
                $scope.currentSSO.enableSSO = result.data.enableSSO;
                $scope.currentSSO.public_ip = $scope.sso.public_ip;
                $scope.currentSSO.port = $scope.sso.port;

                // 2.2 based on DB info to enable checkbox or not
                if (result.data.enableSSO == true) {
                    // 2.2.3 enable checkbox
                    $scope.sso.ssoEnable = true;
                    $scope.ssoCurrentStatus = true;
                    // 2.2.4 display error message if necessary
                    if (result.data.status == "timeout") {
                        console.log("timeout");
                        $scope.ssoTimeOut = true;
                    } else if (result.data.status == "serverStop") {
                        console.log("serverStop");
                        $scope.NSError = true;
                    }
                } else {
                    // 2.2.5 disable checkbox
                    $scope.sso.ssoEnable = false;
                    $scope.ssoCurrentStatus = false;
                    // 2.2.6 display error message if necessary
                    if (result.data.status == "tokenError") {
                        console.log("tokenError");
                        $scope.tokenError = true;
                    }
                    if (result.data.status == "forgot") {
                        console.log("forgot");
                        $scope.forgot = true;
                    }
                }
            }
        });


        /*
        *  Function: Timer for refresh error message
        * */
        //let nCnt = 0;
        $scope.$on('refreshErrorMsg', function () {
            //console.log("nCnt: " + nCnt);
            //nCnt += 1;
            Nuclias.getSSOInfo(function (result) {
                //console.log("status: " + JSON.stringify(result.data, null, 4));
                if (result.success) {
                    if (result.data.enableSSO == true) {
                        $scope.ssoCurrentStatus = true;
                        $scope.forgot = false;
                        if (result.data.status == "timeout") {
                            $scope.ssoTimeOut = true;
                            $scope.NSError = false;
                            $scope.tokenError = false;
                        } else if (result.data.status == "serverStop") {
                            $scope.ssoTimeOut = false;
                            $scope.NSError = true;
                            $scope.tokenError = false;
                        } else {
                            $scope.ssoTimeOut = false;
                            $scope.NSError = false;
                            $scope.tokenError = false;
                        }
                    } else {
                        $scope.ssoCurrentStatus = false;
                        if (result.data.status == "tokenError") {
                            $scope.ssoTimeOut = false;
                            $scope.NSError = false;
                            $scope.tokenError = true;
                            $scope.forgot = false;
                        } else if (result.data.status == 'forgot') {
                            $scope.ssoTimeOut = false;
                            $scope.NSError = false;
                            $scope.tokenError = false;
                            $scope.forgot = true;
                        } else {
                            $scope.ssoTimeOut = false;
                            $scope.NSError = false;
                            $scope.tokenError = false;
                            $scope.forgot = false;
                        }
                    }
                }
            });
        });

        /*
        *  Function: Checkbox of Enable SSO
        * */
        $scope.changeSsoStatus = function () {
            // 1. DB != UI Value
            if ($scope.sso.ssoEnable != $scope.currentSSO.enableSSO) {
                $scope.ssoBtnDisabled = false;
            } else {
                // 2. DB == UI Value
                if ($scope.sso.ssoEnable) {
                    // 2.1 Enable SSO
                    if ($scope.sso.ssoEmail != $scope.currentSSO.ssoEmail || $scope.sso.password != $scope.currentSSO.password ||
                        $scope.sso.public_ip != $scope.currentSSO.public_ip || $scope.sso.port != $scope.currentSSO.port) {
                        // 2.2 account or password is diff
                        $scope.ssoBtnDisabled = false;
                    } else {
                        // 2.3 account or password is same
                        $scope.ssoBtnDisabled = true;
                    }
                } else {
                    // 2.4 Disable SSO
                    $scope.ssoBtnDisabled = true;
                }
            }
            console.log("$scope.ssoBtnDisabled : " + $scope.ssoBtnDisabled);
        }

        /*
        *  Function: Apply button
        * */
        $scope.ssoApply = function () {
            if ($scope.sso.ssoEnable) {
                // enable sso
                ssoApplyEnabled();
            } else {
                // disable sso
                ssoApplyDisabled();
            }
        }

        /*
        *  Function: message for modal
        * */
        function ssoDisplayDisabledSuccessMsg() {
            $scope.ssoSuccessDisable = true;
        }

        function ssoDisplayErrorMsg() {
            $scope.ssoError = true;
        }

        function ssoDisplayProcessing() {
            $scope.state.sso.processing = true;
        }

        function ssoCloseProcessing() {
            $scope.state.sso.processing = false;
        }

        /*
        *  Function: Apply button (Enabled SSO)
        * */
        function ssoApplyEnabled() {
            // 1. init
            $scope.state.sso.processing = true;
            $scope.ssoError = false;
            $scope.ssoSuccessEnable = false;
            $scope.ssoSuccessDisable = false;
            var ssoUsername = $scope.sso.ssoEmail;
            var ssoPassword = $scope.sso.password;
            var public_ip = $scope.sso.public_ip;
            var port = $scope.sso.port;
            // 2. encrypt password
            ssoPassword = utils.encryptMethod(ssoUsername, ssoPassword);
            // 3. get public key
            Nuclias.getNucliasPublicKey(function (data) {
                if (data.success) {
                    var loginFormData = {
                        publicKey: data.data.publicKey,
                        userName: ssoUsername,
                        password: ssoPassword
                    };
                    // 4. login
                    Nuclias.nucliasLogin(loginFormData, function (loginResult) {
                        if (loginResult.success) {
                            var enableSSOFormData = {
                                access_token: loginResult.data.access_token,
                                server_site: loginResult.data.server_site,
                                refresh_token: loginResult.data.refresh_token,
                                userName: ssoUsername,
                                public_ip: public_ip,
                                port: port,
                                modifier: Current.user().username
                            };
                            // 5. enable
                            Nuclias.enableSSO(enableSSOFormData, function (enableSSOResult) {
                                if (enableSSOResult.success) {
                                    if ($scope.currentSSO.ssoEmail != $scope.sso.ssoEmail || $scope.currentSSO.password != $scope.sso.password ||
                                        $scope.sso.public_ip != $scope.currentSSO.public_ip || $scope.sso.port != $scope.currentSSO.port) {
                                        // if the account is diff
                                        if (Current.user().username != "admin") {
                                            // current account is SSO, needs to logout
                                            localStorage.setItem("sameSSOAccount", "true");
                                            window.location = "/";
                                        }
                                    }
                                    // current account is admin
                                    $scope.state.sso.processing = false;
                                    $scope.ssoCurrentStatus = true;
                                    $scope.ssoSuccessEnable = true;
                                    $scope.ssoBtnDisabled = true;
                                    $scope.currentSSO.ssoEmail = $scope.sso.ssoEmail;
                                    $scope.currentSSO.password = $scope.sso.password;
                                    $scope.currentSSO.enableSSO = $scope.sso.ssoEnable;
                                    $scope.currentSSO.public_ip = $scope.sso.public_ip;
                                    $scope.currentSSO.port = $scope.sso.port;
                                } else {
                                    // Fail: enable sso
                                    $scope.state.sso.processing = false;
                                    $scope.ssoError = true;
                                    ssoErrorMessage(enableSSOResult.error);
                                }
                            });
                        } else {
                            // Fail: login sso 3层
                            $scope.state.sso.processing = false;
                            $scope.ssoError = true;
                            ssoErrorMessage(loginResult.error);
                        }
                    });
                } else {
                    // Fail: public key 2层
                    $scope.state.sso.processing = false;
                    $scope.ssoError = true;
                    ssoErrorMessage(data.error);
                }
            })
        }

        function ssoErrorMessage(error) {
            console.log(error.message);
            var statusCode = error.statusCode? error.statusCode: 'Unknown';
            var errorCode = error.code? error.code: 'Unknown';
            var errorMessage = error.message? error.message: 'Unknown';
            $scope.ssoErrorMessage = statusCode + ', ' + errorCode +', '+ errorMessage;
        }

        /*
        *  Function: Apply button (Disable SSO)
        * */
        function ssoApplyDisabled() {
            // 1. init
            $scope.ssoError = false;
            $scope.ssoSuccessEnable = false;
            $scope.ssoSuccessDisable = false;
            // 2. popup message (Are you sure you want to disable Single Sign On?)
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/system/disabledSSO.html',
                windowClass: 'modal-del',
                size: "w500",
                controller: function ($scope, $uibModalInstance) {

                    $scope.ok = function () {
                        // continue
                        $uibModalInstance.close();
                    };
                    $scope.cancel = function () {
                        // break
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });

            modalInstance.result.then(function () {
                // 3. init
                ssoDisplayProcessing();
                var ssoUsername = $scope.sso.ssoEmail;
                var ssoPassword = $scope.sso.password;
                // 4. Encrypt password
                ssoPassword = utils.encryptMethod(ssoUsername, ssoPassword);
                // 5. Public Key
                Nuclias.getNucliasPublicKey(function (data) {
                    if (data.success) {
                        var loginFormData = {
                            publicKey: data.data.publicKey,
                            userName: ssoUsername,
                            password: ssoPassword
                        };
                        // 6. Login
                        Nuclias.nucliasLogin(loginFormData, function (loginResult) {
                            if (loginResult.success) {
                                var disableSSOFormData = {
                                    access_token: loginResult.data.access_token,
                                    modifier: Current.user().username
                                };
                                // 7. Disable
                                Nuclias.disableSSO(disableSSOFormData, function (disableSSOResult) {
                                    if (disableSSOResult.success) {
                                        if (Current.user().username != "admin") {
                                            // current account is SSO, needs to logout
                                            localStorage.setItem("sameSSOAccount", "true");
                                            window.location = "/";
                                        }
                                        // current account is admin
                                        ssoCloseProcessing();
                                        ssoDisplayDisabledSuccessMsg();
                                        $scope.ssoBtnDisabled = true;
                                        $scope.ssoCurrentStatus = false;
                                        $scope.currentSSO.ssoEmail = $scope.sso.ssoEmail;
                                        $scope.currentSSO.password = $scope.sso.password;
                                        $scope.currentSSO.enableSSO = $scope.sso.ssoEnable;
                                        $scope.currentSSO.public_ip = $scope.sso.public_ip;
                                        $scope.currentSSO.port = $scope.sso.port;
                                    } else {
                                        // Fail: disable sso
                                        ssoDisplayErrorMsg();
                                        ssoCloseProcessing();
                                        ssoErrorMessage(disableSSOResult.error);
                                    }
                                });
                            } else {
                                // Fail: login
                                ssoDisplayErrorMsg();
                                ssoCloseProcessing();
                                ssoErrorMessage(loginResult.error);
                            }
                        });
                    } else {
                        // Fail: public key
                        ssoDisplayErrorMsg();
                        ssoCloseProcessing();
                        ssoErrorMessage(data.error);
                    }
                });
            });
        }

        $timeout(function () {
            var passwordHTML = document.getElementsByClassName("OrgName")[0];
            // console.log(passwordHTML);
            passwordHTML.focus();
        }, 0);
        setHeight();
        window.onresize = function () {
            setHeight();
            $timeout.cancel($scope.timer);
            $scope.timer = $timeout(function () {
                setHeight('tab-content', [], -40);
            }, 300);
        };
        $scope.timer = $timeout(function () {
            setHeight('tab-content', [], -40);
        }, 300);
        //板子上系统设置用到的变量
        $scope.currentTime = new Date().toISOString();
        $scope.dateAndTime = {date: new Date().toISOString(), time: new Date().toISOString()};
        $scope.disabledDateAndTime = false;//可以编辑
        $scope.disabledLanSetting = true;//不可以保存
        $scope.getIPAddressFrom = ["static", "dhcp"];
        //校验用到的变量
        $scope.serverRe = utils.serverRe;
        $scope.fileRe = utils.fileRe;
        $scope.subMaskRe = utils.subMaskRe;
        $scope.gateway = utils.gateway;
        $scope.invalidIP = utils.setinvalidIP();//这个地方要初始化一次变量才行
        $scope.portRe = /^\d{0,5}$/;
        $scope.invalidPort = {
            webAccessPort: false,
            deviceAccessPort: false,
            ssoPort: false,
            ftpPort: false,
            Error1: false,
            Error2: false
        };
        // 下拉选框选择事件
        $scope.deviceSettingChanged = function () {

        };
        $scope.SSOPortKeyup = function (key1) {
            //檢查範圍區間有無在1-65535間
            if (parseInt($scope.connection[key1]) < 1 || parseInt($scope.connection[key1]) > 65535) {
                $scope.invalidPort[key1] = true;
                $scope.invalidPort.Error1 = true;
            } else {
                $scope.invalidPort[key1] = false;
                $scope.invalidPort.Error1 = false;
            }
        };
        $scope.portKeyup = function (key1, key2) {
            //檢查範圍區間有無在1-65535間
            if (parseInt($scope.connection[key1]) < 1 || parseInt($scope.connection[key1]) > 65535 || $scope.connection[key1] == $scope.connection[key2]) {
                $scope.invalidPort[key1] = true;
                $scope.invalidPort.Error1 = true;
            } else {
                $scope.invalidPort[key1] = false;
                $scope.invalidPort.Error1 = false;
            }
        };
        $scope.devPortKeyup = function (key1, key2) {
            //var webAccessPort = webAccessPortRe.test($scope.org[key1]);
            if (parseInt($scope.connection[key1]) < 1 || parseInt($scope.connection[key1]) > 65535 || $scope.connection[key1] == $scope.connection[key2]) {
                $scope.invalidPort[key1] = true;
                $scope.invalidPort.Error1 = true;
            } else {
                $scope.invalidPort[key1] = false;
                $scope.invalidPort.Error1 = false;
            }
        };
        $scope.isShowTicTok = false;
        /**
         * SMTP页面固定参数
         */
        $scope.encoding = ['UTF-8', 'ASC-II'];
        $scope.auth = ['anonymous', 'authentication'];
        $scope.security = ['None', 'SSL'];
        $scope.smtpPorts = [25, 465, 587];
        $scope.needAuth = {select: $scope.auth[0]};
        $scope.smtp = {
            secureText: {select: $scope.security[0]},
            encoding: 'UTF-8',
            auth: {},
            ssl: 'None',
            port: 25
        };
        $scope.hasPrivilege = Current.user().username == "admin" || Current.user().isNSUser;
        $scope.usbStorageStatus = false;
        $scope.usbFiles = [];
        $scope.state = {
            isSuccess: false,
            isError: false,
            processing: false,
            msgTrue: 'settings.saveOK',
            msgFalse: 'syslog.serverity.Error',
            customized: {
                isSuccess: false,
                isError: false,
                processing: false
            },
            lanSetting: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgFalse: 'settings.usbStorageFailed1'
            },
            dateAndTimeSetting: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgFalse: 'settings.usbStorageFailed1'
            },
            consoleSetting: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgFalse: 'settings.usbStorageFailed1'
            },
            basic: {
                isSuccess: false,
                isError: false,
                processing: false
            },
            connection: {
                isSuccess: false,
                isError: false,
                processing: false
            },
            ssl: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgFalse: 'syslog.serverity.Error'
            },
            smtp: {
                isSuccess: false,
                isError: false,
                processing: false
            },
            backup: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgFalse: 'settings.db.backupFailed',
            },
            restore: {
                location: 'computer',
                isSuccess: false,
                isError: false,
                processing: false,
                msgFalse: 'settings.db.restoreTip1',
                usbStorage: {
                    msgFalse: 'settings.usbStorageFailed1',
                    isError: false,
                    processing: false
                },
            },
            backupConfig: {
                isSuccess: false,
                isError: false,
                processing: false
            },
            backupLog: {
                isSuccess: false,
                isError: false,
                processing: false
            },
            deleteBackupConfig: {
                isSuccess: false,
                isError: false,
            },
            deleteBackupLog: {
                isSuccess: false,
                isError: false,
            },
            downloadBackupConfig: {
                isSuccess: false,
                isError: false,
            },
            downloadBackupLog: {
                isSuccess: false,
                isError: false,
            },
            fwUpgrade: {
                location: 'computer',
                isSuccess: false,
                isError: false,
                processing: false,
                msgFalse: 'settings.fwUpgrade.fwUpgradeFailed1',
                usbStorage: {
                    msgFalse: 'settings.usbStorageFailed1',
                    isError: false,
                    processing: false
                }
            },
            restart: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgFalse: 'settings.usbStorageFailed1'

            },
            restoreFactory: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgFalse: 'settings.usbStorageFailed1'
            },
            restoreFactoryExLan: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgFalse: 'settings.usbStorageFailed1'
            },
            formatCard: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgFalse: 'settings.usbStorageFailed1'
            },
            sso: {
                processing: false
            }
        };
        /**
         * 获取页面数据
         */
        OrganizationService.listAllOrgs(function (orgs) {

            if (orgs && orgs.length > 0) {
                $scope.org = orgs[0];
                $scope.originalField.devAccessAddress = $scope.org.devAccessAddress;
                $scope.originalField.devAccessPort = $scope.org.devAccessPort;
                $scope.originalField.webAccessPort = $scope.org.webAccessPort;
                $scope.org.defaultNTPServer = $scope.org.defaultNTPServer || "ntp1.dlink.com";
                if (!$scope.sso.port) $scope.sso.port = $scope.org.webAccessPort; //若Access Port為空則顯示Web Access Port
                //获取时区
                OrganizationService.getDateAndTime(function (result) {
                    if (result.success) {
                        $scope.org.enableNTP = result.data.enableNTP;
                        $scope.org.NTPServer = result.data.NTPServer || "";
                        $scope.org.defaultNTPServer = result.data.defaultNTPServer || "ntp1.dlink.com";
                        $scope.org.timeZone = utils.getTimeZones()[result.data.timeZone.id - 1];
                        if (result.data.datetime) {
                            $scope.currentTime = new Date(result.data.datetime).toISOString();
                            $scope.dateAndTime = {date: $scope.currentTime, time: $scope.currentTime};
                            $scope.$broadcast('dateAndTime', $scope.dateAndTime);
                        }
                    }
                    if (!$scope.org.timeZone) {
                        $scope.org.timeZone = $scope.timeZones[0];
                    }
                    //输入框copy一份数据
                    $scope.inputField.NTPServer = $scope.org.NTPServer;
                    if ($scope.org.enableNTP == 1) {
                        $scope.org.enableNTP = true;
                    } else {
                        $scope.org.enableNTP = false;
                    }
                });
                setTimeout(function () {
                    if (document.getElementById("enable_NTP") && !$scope.hasPrivilege) {
                        disableCheckBox("enable_NTP", "enable_NTP_checkbox");
                    }
                    if (document.getElementById("enable_console") && !$scope.hasPrivilege) {
                        disableCheckBox("enable_console", "enable_console_checkbox");
                    }
                }, 0);
                //获取lanSetting
                OrganizationService.getLANSetting(function (res) {
                    if (res.success) {
                        $scope.org.ipType = res.data.ipType;
                        $scope.org.ipAddress = res.data.ipAddress;
                        $scope.org.subnetMask = res.data.subnetMask;
                        $scope.org.defaultGateWay = res.data.defaultGateWay;
                        $scope.org.primaryDNS = res.data.primaryDNS;
                        $scope.org.secondDNS = res.data.secondDNS;
                        $scope.org.changeDAA = res.data.changeDAA;
                    }
                    // res.data = {
                    //     "ipType": "dncp",
                    //     // "ipAddress": "172.18.192.140",
                    //     // "subnetMask": "255.255.255.0",
                    //     // "defaultGateWay": "172.18.192.1",
                    //     // "primaryDNS": "211.142.210.100",
                    //     // "secondDNS": "8.8.8.8"
                    // };
                    // $scope.org.ipType = res.data.ipType;
                    // $scope.org.ipAddress = res.data.ipAddress;
                    // $scope.org.subnetMask = res.data.subnetMask;
                    // $scope.org.defaultGateWay = res.data.defaultGateWay;
                    // $scope.org.primaryDNS = res.data.primaryDNS;
                    // $scope.org.secondDNS = res.data.secondDNS;

                    $scope.originalField.ipType = $scope.org.ipType;
                    $scope.originalField.ipAddress = $scope.org.ipAddress || "";
                    $scope.originalField.subnetMask = $scope.org.subnetMask || "";
                    $scope.originalField.defaultGateWay = $scope.org.defaultGateWay || "";
                    $scope.originalField.primaryDNS = $scope.org.primaryDNS || "";
                    $scope.originalField.secondDNS = $scope.org.secondDNS || "";
                    if ($scope.org.ipType == "static") {
                        if ($scope.org.changeDAA == 0) {
                            $scope.org.changeDAA = false;
                        } else if ($scope.org.changeDAA == 1) {
                            $scope.org.changeDAA = true;
                        }
                    }
                    $scope.originalField.changeDAA = $scope.org.changeDAA;
                    //多选框置灰
                    if ($scope.org.ipType == "dhcp") {
                        $scope.org.changeDAA = undefined;
                        setTimeout(function () {
                            if (document.getElementById("sys_changeDAA") && (!document.getElementById("sys_changeDAA").disabled || !$scope.hasPrivilege)) {
                                disableCheckBox("sys_changeDAA", "sys_changeDAA_checkbox");
                            }
                        }, 0)
                    }
                    else {
                        setTimeout(function () {
                            if (document.getElementById("sys_changeDAA") && !$scope.hasPrivilege) {
                                disableCheckBox("sys_changeDAA", "sys_changeDAA_checkbox");
                            }
                        }, 0)
                    }
                    //输入框copy一份数据
                    $scope.inputField.ipAddress = $scope.org.ipAddress;
                    $scope.inputField.subnetMask = $scope.org.subnetMask;
                    $scope.inputField.defaultGateWay = $scope.org.defaultGateWay;
                    $scope.inputField.primaryDNS = $scope.org.primaryDNS;
                    $scope.inputField.secondDNS = $scope.org.secondDNS;
                    $scope.inputField.changeDAA = $scope.org.changeDAA;
                    initChipData();//初始化数据
                });
                //获取consoleSetting
                OrganizationService.getConsoleSetting(function (res) {
                    if (res.success) {
                        $scope.org.enableConsole = res.data.enableConsole;
                        $scope.org.consoleProtocol = res.data.consoleProtocol;
                        $scope.org.timeout = res.data.timeout;
                    }
                });
                $scope.org.orgId = $scope.org._id;

                /* // general赋值
                 for (var k in $scope.org) {
                 if (k != 'smtpServer' && k != 'payment')
                 $scope.general[k] = $scope.org[k];
                 }*/
                $scope.logoImg.logoFiles = null;
                if ($scope.org.logo) {
                    $scope.logoImg.temporary = [$scope.org.logo];
                }
                if ($scope.org.needCAPTCHA == true)
                    $scope.org.captcha_view = $scope.statuses[1];
                else
                    $scope.org.captcha_view = $scope.statuses[0];

                //$scope.basic.country = $scope.org.country;
                //$scope.basic.timeZone = $scope.org.timeZone;
                $scope.basic.keepAlive = $scope.org.keepAlive;

                //country timeZone 绑定 不用显示county和timezone了
                //显示console那一块的默认值
                if (!$scope.org.enableConsole) {
                    $scope.org.enableConsole = 0;
                }
                if (!$scope.org.consoleProtocol) {
                    $scope.org.consoleProtocol = "telnet";
                }
                if (!$scope.org.timeout) {
                    $scope.org.timeout = 300;
                }

                $scope.smtp = $scope.org.smtpServer;
                if ($scope.smtp.auth && $scope.smtp.auth.password) {
                    $scope.smtp.auth.password = utils.decryptMethod($scope.smtp.auth.username, $scope.smtp.auth.password);
                }
                if ($scope.smtp.secure) {
                    $scope.smtp.secure = true;
                }
                $scope.smtp.secure = $scope.smtp.secure == 1;
                $scope.smtp.encoding = $scope.smtp.encoding || 'UTF-8';
                $scope.smtp.secureText = $scope.smtp.secure ? 'SSL' : 'None';
                var need = false;
                for (var key in $scope.smtp.auth) {
                    need = true;
                }
                $scope.needAuth.select = need ? 'authentication' : 'anonymous';

                OrganizationService.getServerIPs(function (result) {
                    if (result.data) {
                        $scope.addresses = result.data;
                        $scope.addresses.push('other');

                        var d = $scope.originalField.devAccessAddress;
                        var w = $scope.org.webAccessAddress;
                        for (var i = 0; i < $scope.addresses.length; i++) {
                            if ($scope.addresses[i] == d) {
                                //这个地方做changeDAA的时候会修改
                                $scope.connection.devAccessAddress = d;//$scope.org.devAccessAddress;
                                break;
                            } else if (i == $scope.addresses.length - 1) {
                                $scope.connection.devAccessAddress = 'other';
                                $scope.dataForShow.deviceAddress = d;
                            }
                            ;
                        }
                        for (var i = 0; i < $scope.addresses.length; i++) {
                            if ($scope.addresses[i] == w) {
                                $scope.connection.webAccessAddress = $scope.org.webAccessAddress;
                                break;
                            } else if (i == $scope.addresses.length - 1) {
                                $scope.connection.webAccessAddress = 'other';
                                $scope.dataForShow.webAddress = w;
                            }

                        }
                    }
                });

                // $scope.connection.devAccessAddress = $scope.org.devAccessAddress;
                // $scope.connection.webAccessAddress = $scope.org.webAccessAddress;

                $scope.connection.devAccessPort = $scope.org.devAccessPort;
                $scope.connection.webAccessPort = $scope.org.webAccessPort;
                $scope.connection.csAccessPort = $scope.org.csAccessPort;

            }
        });

        function disableCheckBox(cid, pid) {
            document.getElementById(cid).disabled = true;
            document.getElementById(pid).style.backgroundColor = "#f5f5f5";
            document.getElementById(pid).style.border = "1px dashed #ddd";
            document.getElementById(pid).style.color = "#aaa";
        }

        $scope.testData = {
            testEmail: '',
            smtpServer: {}
        };
        $scope.securitySelect = function () {
            $scope.smtp.secure = $scope.smtp.secureText == 'SSL';
            // $scope.smtp.secureText 用于页面显示
        };
        $scope.testEmailChange = function () {
            $scope.testInfo.result = '';
        };
        // test结果显示
        $scope.testInfo = {
            isSuccess: false,
            isError: false,
            processing: false,
            msgTrue: 'settings.testSuccess',
            msgFalse: 'settings.testFailed'
        }
        $scope.test = function () {
            if ($scope.testInfo.processing) return;
            $scope.testInfo.processing = true;
            $scope.testInfo.isSuccess = false;
            $scope.testInfo.isError = false;
            if ($scope.needAuth.select == 'anonymous') {
                $scope.smtp.auth = {};
            }

            $scope.testData.smtpServer = $scope.smtp;
            OrganizationService.testSMTP($scope.testData, function (result) {
                // Do something
                $scope.testInfo.processing = false;
                if (result.success) {
                    $scope.testInfo.isSuccess = true;
                } else {
                    $scope.testInfo.isError = true;
                }
            });
        };
        /**
         * 保存SMTP tab页内容
         */
        $scope.saveSmtp = function () {
            $scope.state.smtp.processing = true;
            $scope.state.smtp.isSuccess = false;
            $scope.state.smtp.isError = false;
            OrganizationService.updateSMTP($scope.org._id, $scope.smtp, function (result) {
                if (result.success) {
                    $scope.state.smtp.processing = false;
                    $scope.state.smtp.isSuccess = true;
                } else {
                    $scope.state.smtp.processing = false;
                    $scope.state.smtp.isError = true;
                }
            });
        }


        /**
         * General
         */

        /**
         * 下拉选框数据
         */
        $scope.statuses = [0, 1];// login captcha
        $scope.backupStatus = [0, 1, 2]; // backup
        $scope.timeout = [0, 300];//timeout
        $scope.liveIntervals = [60, 120, 180, 240, 300]; // live packet interval
        $scope.selectCountries = utils.getCountries(); // country
        $scope.timeZones = utils.getTimeZones(); // time zone

        /**
         * logo
         */
        $scope.logoImg = {};
        $scope.logoChange = 0;
        $scope.showLogoSpecail = false;
        $scope.$watch('logoImg.logoFiles', function (files) {
            if (files != null) {
                if (!angular.isArray(files)) {
                    $timeout(function () {
                        //console.log(files);
                        const type = files.name.substring(files.name.lastIndexOf(".") + 1).toLowerCase();
                        const extension = (type === 'png') || (type === 'jpg');
                        //console.log(extension)
                        if (!extension) {
                            $scope.showLogoSpecail = true;
                            return false;
                        }
                        $scope.showLogoSpecail = false;
                        $scope.logoImg.logoFiles = files = [files];
                        $scope.logoImg.temporary = files;
                    });
                } else {
                    $scope.logoChange += 1;
                }
            }
        });

        /**
         * 保存general tab页内容
         */
        $scope.saveCustomized = function () {
            // file
            /* if ($scope.logoImg.logoFiles && $scope.logoImg.logoFiles.length > 0) {
             $scope.org.logo = "/customer/" + $scope.logoImg.logoFiles[0].name;
             }*/
            $scope.state.customized.processing = true;
            $scope.state.customized.isSuccess = false;
            $scope.state.customized.isError = false;

            if ($scope.logoChange) {
                $scope.file = $scope.logoImg.logoFiles ? $scope.logoImg.logoFiles[0] : $scope.logoImg.temporary[0];
            } else {
                $scope.file = null;
            }

            var params = {
                url: base_url + '/org/updateCustomized',
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                data: {
                    name: $scope.org.name,
                    needCAPTCHA: $scope.org.captcha_view == 1,
                    orgId: $scope.org._id,
                    file: $scope.file
                }

            };

            Upload.upload(params).then(function (result) {
                if (result.data && result.data.success) {
                    ajaxService.updateToken(result.headers);
                    $scope.logoChange = 0;
                    OrganizationService.listAllOrgs(function (orgs) {
                        if (orgs && orgs.length > 0) {
                            $scope.org.logo = orgs[0].logo;
                            $scope.org.orgId = $scope.org._id;
                            // if ($scope.org.needCAPTCHA == true) {
                            //     $scope.org.captcha_view = $scope.statuses[1];
                            // } else {
                            //     $scope.org.captcha_view = $scope.statuses[0];
                            // }
                            Current.setOrg(angular.copy($scope.org));
                            Current.broadcast('current org changed');

                            $scope.state.customized.processing = false;
                            $scope.state.customized.isSuccess = true;
                        }
                    });

                } else {
                    $scope.state.customized.processing = false;
                    $scope.state.customized.isError = true;
                }
            });

        };

        $scope.ssl = {
            certificate: '',
            key: ''
        };
        $scope.fwUpgradeValidate = false;
        $scope.validate = function (file) {
            if ($scope.state.fwUpgrade.location == 'computer') {
                var fSize = file.size;
                const extension = file.name.substring(file.name.lastIndexOf(".") + 1).toLowerCase() === 'bin';
                if (!extension) {
                    //alert("上传文件只能是 bin 格式!");
                    $scope.fwUpgradeValidate = true;
                    return false;
                }
                if (fSize > 314572800) {//314572800
                    //alert('上传文件大小不能超过300MB!');
                    $scope.fwUpgradeValidate = true;
                    return false;
                }
                $scope.fwUpgradeValidate = false;
                return true;
            } else {
                $scope.fwUpgradeValidate = false;
                return true;
            }

        }
        $scope.fileChange = function (type) {
            if (type != 'restore') {
                console.log($scope.ssl[type]);
            }
            // 匹配后缀名
        };

        $scope.uploadSSL = function () {
            $scope.state.ssl.processing = true;
            $scope.state.ssl.isSuccess = false;
            $scope.state.ssl.isError = false;

            if (!$scope.ssl.certificate || !$scope.ssl.key) {
                $scope.state.ssl.processing = false;
                $scope.state.ssl.isError = true;
                $scope.state.ssl.msgFalse = 'Files needed!';
                return;
            }
            var params = {
                url: base_url + '/org/certificate',
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                data: {
                    orgId: $scope.org._id,
                    file: []
                }

            };
            params.data.file.push($scope.ssl.certificate);
            params.data.file.push($scope.ssl.key);
            Upload.upload(params).then(function (result) {
                ajaxService.updateToken(result.headers);
                if (result.status == 200) {
                    if (!result.data.success) {
                        $scope.state.ssl.processing = false;
                        $scope.state.ssl.isError = true;
                        if (result.data.error == 1) {
                            $scope.state.ssl.msgFalse = "ssl.msgFalse1";
                        }
                        else if (result.data.error == 2) {
                            $scope.state.ssl.msgFalse = 'ssl.msgFalse2';
                        } else {
                            $scope.state.ssl.msgFalse = 'ssl.msgFalse3';
                        }
                    } else {
                        $scope.state.ssl.processing = false;
                        $scope.state.ssl.isSuccess = true;
                    }

                }
            });
        }


        /**
         * connection setting
         */
        $scope.protocals = ['http', 'https'];
        $scope.addresses = [];
        $scope.dataForShow = {
            deviceAddress: '',
            webAddress: ''
        };

        $scope.connection = {};
        $scope.saveConnection = function () {
            if ($scope.originalField.devAccessPort != $scope.connection.devAccessPort ||
                $scope.originalField.webAccessPort != $scope.connection.webAccessPort) {
                var modalInstance = $uibModal.open({
                    backdrop: 'static',
                    animation: true,
                    keyboard: false,
                    templateUrl: './views/templates/dialogConfirm.html',
                    windowClass: 'modal-saveLanSetting',
                    size: "w500",
                    controller: function ($scope, $uibModalInstance) {
                        $scope.con = {
                            title: TS.ts("settings.connectionSetting"),
                            content: TS.ts("settings.connectionTip"),
                            type: 'menu:system'
                        };
                        $scope.ok = function (r) {
                            $uibModalInstance.close(r);
                            updateConnection(true);
                        };
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                });
            } else {
                updateConnection(false);
            }
        };

        function updateConnection(isTictoc) {
            $scope.state.connection.processing = true;
            $scope.state.connection.isSuccess = false;
            $scope.state.connection.isError = false;
            var param = angular.copy($scope.connection);
            if (param.devAccessAddress == 'other') {
                param.devAccessAddress = $scope.dataForShow.deviceAddress;
            }
            if (param.webAccessAddress == 'other') {
                param.webAccessAddress = $scope.dataForShow.webAddress;
            }
            OrganizationService.updateConnection($scope.org._id, param, function (result) {
                if (result.success) {
                    $scope.state.connection.processing = false;
                    $scope.state.connection.isSuccess = true;
                    if (isTictoc) {
                        OrganizationService.restartMonitoring(function (result) {
                        });
                        var text = {
                            text1: TS.ts("settings.ncRestartInfo1"),
                            text2: TS.ts("settings.waitInfo"),
                            text3: TS.ts("settings.secondInfo"),
                        };
                        var second = 30;
                        tictoc(text, second, $scope.connection.webAccessPort, $scope.org.ipAddress);
                        $scope.isShowConnectionForm = false;
                    }
                } else {
                    $scope.state.connection.processing = false;
                    $scope.state.connection.isError = true;
                }
            })
        }

        $scope.basic = {};
        $scope.saveBasic = function () {
            $scope.state.basic.processing = true;
            $scope.state.basic.isSuccess = false;
            $scope.state.basic.isError = false;
            OrganizationService.updateBasic($scope.org._id, $scope.basic, function (result) {
                if (result.success) {
                    $scope.state.basic.processing = false;
                    $scope.state.basic.isSuccess = true;
                } else {
                    $scope.state.basic.processing = false;
                    $scope.state.basic.isError = true;
                }
            });
        };

        $scope.addressRe = /^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$|^([http://]|[https://])?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/;

        $scope.regenerateKEY = function () {
            if ($scope.restAPIKey && $scope.restAPIKey != "") {
                var modalInstance = $uibModal.open({
                    backdrop: 'static',
                    animation: true,
                    keyboard: false,
                    templateUrl: './views/templates/dialogConfirm.html',
                    windowClass: 'modal-del',
                    size: "w500",
                    controller: function ($scope, $uibModalInstance) {
                        $scope.con = {
                            title: TS.ts("settings.restAPITitle"),
                            content: TS.ts("settings.restAPITip"),
                            type: 'menu:system'
                        };
                        $scope.ok = function () {
                            $uibModalInstance.close();
                        };
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                });
                modalInstance.result.then(function () {
                    OrganizationService.generateRestAPIKey(function (result) {
                        $scope.restAPIKey = result.data;
                    })
                }, function () {

                });
            } else {
                OrganizationService.generateRestAPIKey(function (result) {
                    $scope.restAPIKey = result.data;
                })
            }

        }
        OrganizationService.getRestAPIKey(function (result) {
            $scope.restAPIKey = result.data;
        });
        $scope.copyKEY = function () {
            var Url2 = document.getElementById("restapikey");
            Url2.select(); // 选择对象
            document.execCommand("Copy"); // 执行浏览器复制命令
        }

        $scope.openSupplierItemModel = function (supplier) {

            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: 'supplierItem.html',
                windowClass: 'modal-usermanage',
                size: 'w600',
                resolve: {
                    supplier: function () {
                        return angular.copy(supplier);
                    }
                },
                controller: function ($scope, $uibModalInstance, supplier) {
                    $scope.invalidSupplier = false;
                    $scope.invalidSupplierMsg = "";
                    $scope.title = "supplierAdd";
                    $scope.iconName = "inviteUser";
                    $scope.buttonName = "add";
                    if (supplier) {
                        $scope.iconName = "edit";
                        $scope.title = "supplierEdit";
                        $scope.buttonName = "save";
                    }
                    $scope.supplier = supplier;
                    $scope.save = function () {
                        OrganizationService.saveSupplier($scope.supplier, function (result) {
                            if (!result.success) {
                                if (result.error == 1) {
                                    $scope.invalidSupplier = true;
                                    $scope.invalidSupplierMsg = $scope.supplier.year + "," + $scope.supplier.name + " has exists";
                                    return;
                                }
                            }
                            $uibModalInstance.close();
                        });

                    };
                    // 取消
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function () {
                loadSuppliers();

            }, function () {

            });
        }

        $scope.delSuppliers = function (supplier) {
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/templates/dialogConfirm.html',
                windowClass: 'modal-del',
                resolve: {
                    supplier: function () {
                        return supplier;
                    }
                },
                size: "w500",
                controller: function ($scope, $uibModalInstance, supplier) {
                    $scope.con = {
                        title: TS.ts("supplier.delTitle"),
                        content: TS.ts("supplier.delTip"),
                        type: 'common:remove'
                    };
                    $scope.ok = function () {
                        $uibModalInstance.close(supplier);
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function (supplier) {
                OrganizationService.delSupplier(supplier._id, function (result) {
                    if (result.success) {
                        loadSuppliers();
                    }
                });
            }, function () {

            });
        }

        function loadSuppliers() {
            OrganizationService.listSuppliers(function (result) {
                if (result.success) {
                    $scope.gridOptionsSupplier.data = result.data;
                }
            });
        }

        $scope.gridOptionsSupplier = {
            enableGridMenu: false,
            paginationPageSizes: [5, 10, 15],
            paginationPageSize: 10,
            paginationTemplate: './views/templates/gridBurster.html',
            columnDefs: [
                {field: 'name', minWidth: "120", displayName: TS.ts('supplier.name')},
                {
                    field: 'year',
                    minWidth: "110",
                    displayName: TS.ts('supplier.year')
                },
                {field: 'liaison', minWidth: "110", displayName: TS.ts('supplier.liaison')},
                {field: 'tel', minWidth: "110", displayName: TS.ts('supplier.tel')},
                {
                    field: 'site', minWidth: "360", displayName: TS.ts('supplier.site'),
                    cellTemplate: '<div class="ui-grid-cell-contents"><a target="_blank" href="http://{{row.entity.site}}" rel="noopener noreferrer">{{row.entity.site}}</a></div>'
                },
                {
                    name: TS.ts('column.action'),
                    cellTemplate: '<div class="ui-grid-cell-contents"> ' +
                        '<a type="button" class="btn-grid" title="{{\'column.edit\'|translate}}"' +
                        '  ng-click="grid.appScope.openSupplierItemModel(row.entity)">' +
                        '<md-icon md-svg-icon="user:edit"></md-icon></a>' +
                        '<a type="button" class="btn-grid" title="{{\'column.delete\'|translate}}" ' +
                        '  ng-click="grid.appScope.delSuppliers(row.entity)">' +
                        '<md-icon md-svg-icon="user:remove"></md-icon></a>' +
                        '</div>',
                    minWidth: "120", maxWidth: "120", enableHiding: false, enableSorting: false,
                    visible: $scope.hasPrivilege
                }
            ]
        };

        OrganizationService.getNodeEnv(function (result) {
            if (result.success) {
                $scope.nodeEnv = result.data == "Production_hualian";
            }
        });

        loadSuppliers();
        $scope.ismeridian = true;
        $scope.hstep = 1;
        $scope.mstep = 10;
        $scope.backupTypes = [1, 2, 3];
        $scope.database = {autoBackupLog: 0, backupType: 1, externalSyslogServer: null};
        $scope.hours = [];
        for (var i = 0; i < 24; i++) {
            $scope.hours.push(i);
        }
        /**
         * @method 保存备份设置
         * @param database
         * */
        $scope.saveLogBackup = function () {
            $scope.state.backup.processing = true;
            $scope.state.backup.isSuccess = false;
            $scope.state.backup.isError = false;
            OrganizationService.setBackupSetting($scope.database, function (result) {
                if (result.success) {
                    $scope.state.backup.processing = false;
                    $scope.state.backup.isSuccess = true;
                } else {
                    $scope.state.backup.processing = false;
                    $scope.state.backup.isError = true;
                }
            })
        };
        $scope.copy = {};
        $scope.invalidExSyslogServer = false;
        /**
         * @method 取出备份
         * */
        OrganizationService.getBackupSetting(function (result) {
            if (result.success && result.data) {
                if (result.data) {
                    $scope.database = result.data;
                }
            }
        });
        $scope.db = {
            diskRestore: "",
            usbStorageRestore: "",
            diskFwUpgrade: "",
            usbStorageFwUpgrade: "",
        };
        $scope.cleanState = function (value) {
            $scope.state[value].usbStorage.processing = false;
            $scope.state[value].usbStorage.isError = false;
            if (value == 'restore') {
                $scope.db.diskRestore = "";
                $scope.db.usbStorageRestore = "";
            }
            if (value == 'fwUpgrade') {
                $scope.db.diskFwUpgrade = "";
                $scope.db.usbStorageFwUpgrade = "";
            }
        };
        $scope.restoreConfig = function () {
            //点击restore的时候先告知一定会重启，点了确认才执行下面操作
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/templates/dialogConfirm.html',
                windowClass: 'modal-del',
                resolve: {},
                size: "w500",
                controller: function ($scope, $uibModalInstance) {
                    $scope.con = {
                        title: TS.ts('settings.db.restore'),
                        content: TS.ts('settings.db.restoreTip0'),
                        type: 'menu:system'
                    };
                    $scope.ok = function (r) {
                        $uibModalInstance.close(r);
                        doRestore();
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function (id) {
            }, function () {

            });

        }

        //还原配置要登出
        function doRestore() {
            $scope.state.restore.processing = true;
            $scope.state.restore.isSuccess = false;
            $scope.state.restore.isError = false;
            if (!$scope.db.diskRestore && !$scope.db.usbStorageRestore) {
                $scope.state.restore.processing = false;
                return;
            }
            var data = {};
            if ($scope.state.restore.location == 'computer') {
                data = {
                    orgId: $scope.org._id,
                    file: $scope.db.diskRestore,
                    location: 'computer'
                }
            }
            else if ($scope.state.restore.location == 'usb') {
                data = {
                    orgId: $scope.org._id,
                    file: null,
                    location: 'usb',
                    usbFilePath: $scope.db.usbStorageRestore
                }
            }
            data.step = 0;
            var params = {
                url: base_url + '/global/database/restoreConfig',
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                data: data
            };
            Upload.upload(params).then(function (result) {
                ajaxService.updateToken(result.headers);
                if (result.status == 200) {
                    if (!result.data.success) {
                        $scope.state.restore.processing = false;
                        $scope.state.restore.isError = true;
                        if (result.data.error == 1) {
                            $scope.state.restore.msgFalse = "settings.db.restoreTip1";
                        }
                        else if (result.data.error == 2) {
                            $scope.state.restore.msgFalse = 'settings.db.restoreTip2';
                        }
                        else {
                            $scope.state.restore.msgFalse = 'settings.db.restoreTip2';
                        }
                    } else {
                        $scope.state.restore.processing = false;
                        $scope.state.restore.isSuccess = false;
                        if (result.data.data && result.data.data.curSequence) {
                            //从后台接收webaccessddress，传入步骤，弹框告诉他ip已经变过
                            var param = {};
                            param.curSequence = result.data.data.curSequence;
                            if (result.data.data.ipType) {
                                var ipType = result.data.data.ipType;
                            }
                            if (result.data.data.ipAddress) {
                                var ipAddress = result.data.data.ipAddress;
                            }
                            if (result.data.data.webAccessPort) {
                                var webAccessPort = result.data.data.webAccessPort;
                            }
                            if (result.data.data.devAccessPort) {
                                var devAccessPort = result.data.data.devAccessPort;
                            }
                            var modalInstance = $uibModal.open({
                                backdrop: 'static',
                                animation: true,
                                keyboard: false,
                                templateUrl: './views/templates/dialogConfirm.html',
                                windowClass: 'modal-restore',
                                size: "w500",
                                resolve: {
                                    param: function () {
                                        return param
                                    },
                                    ipType: function () {
                                        return ipType
                                    },
                                    ipAddress: function () {
                                        return ipAddress
                                    },
                                    webAccessPort: function () {
                                        return webAccessPort
                                    },
                                    devAccessPort: function () {
                                        return devAccessPort
                                    },
                                },
                                controller: function ($scope, $uibModalInstance, param, ipType, ipAddress, webAccessPort, devAccessPort) {
                                    if (ipType == "static") {
                                        $scope.con = {
                                            title: TS.ts("settings.db.restore"),
                                            content: TS.ts("settings.ipStatic") + ipAddress + TS.ts("settings.ipStatic2"),
                                            type: 'menu:system'
                                        };
                                    } else if (ipType == "dhcp") {
                                        $scope.con = {
                                            title: TS.ts("settings.db.restore"),
                                            content: TS.ts("settings.ipDymic"),
                                            type: 'menu:system'
                                        };
                                    } else if (webAccessPort) {
                                        $scope.con = {
                                            title: TS.ts("settings.db.restore"),
                                            content: TS.ts("settings.portChange"),
                                            type: 'menu:system'
                                        };
                                    } else if (devAccessPort) {
                                        $scope.con = {
                                            title: TS.ts("settings.db.restore"),
                                            content: TS.ts("settings.portChange"),
                                            type: 'menu:system'
                                        };
                                    } else if ((ipType == "static" && devAccessPort) || (ipType == "static" && webAccessPort)) {
                                        $scope.con = {
                                            title: TS.ts("settings.db.restore"),
                                            content: TS.ts("settings.portAndIPChangeToStatic") + ipAddress + TS.ts("settings.portAndIPChangeToStatic2"),
                                            type: 'menu:system'
                                        };
                                    } else if ((ipType == "dhcp" && devAccessPort) || (ipType == "dhcp" && webAccessPort)) {
                                        $scope.con = {
                                            title: TS.ts("settings.db.restore"),
                                            content: TS.ts("settings.portAndIPChangeToDHCP"),
                                            type: 'menu:system'
                                        };
                                    }

                                    $scope.ok = function (r) {
                                        $uibModalInstance.close(r);
                                        //弹框之后确认保存设置并且发到后端去
                                        param.step = 1;
                                        sendRebootConfirm(param, ipType, ipAddress, webAccessPort, 'ok');
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                        param.step = -1;
                                        sendRebootConfirm(param, ipType, ipAddress, webAccessPort, 'cancel');
                                    };
                                }
                            });
                            modalInstance.result.then(function (r) {

                            }, function () {

                            })
                        } else {
                            //在button显示转圈并等待十秒跳出系统
                            //转圈显示10s之后再跳出系统
                            $scope.state.restore.processing = true;
                            //不可点击
                            var loadingIndicator = document.getElementsByClassName("loading-indicator");
                            loadingIndicator[0].style.display = "block";
                            setTimeout(function () {
                                $scope.state.restore.processing = false;
                                window.location = "/";
                            }, 10000);
                        }

                    }

                }
            });
        }
        function sendRebootConfirm(param, ipType, ipAddress, webAccessPort, type) {
            OrganizationService.restoreConfig(param, function (res) {
                if (param.step == -1) {
                    $scope.state.restore.processing = false;
                    $scope.state.restore.isSuccess = false;
                    $scope.state.restore.isError = false;
                }
                else {
                    if (res.success || res.error == 408) {
                        //分确认和取消，取消不用管
                        if (type == "ok") {
                            //转圈显示10s之后再跳出系统
                            $scope.state.restore.processing = true;
                            //不可点击
                            var loadingIndicator = document.getElementsByClassName("loading-indicator");
                            loadingIndicator[0].style.display = "block";
                            setTimeout(function () {
                                $scope.state.restore.processing = false;
                                if (ipType == "static") {
                                    var webAccessPort = webAccessPort || 443;
                                    window.location = "https://" + ipAddress + ":" + webAccessPort;
                                } else {
                                    window.location = "/";
                                }
                            }, 10000)

                        }
                    } else {
                        $scope.state.restore.processing = false;
                        $scope.state.restore.isError = true;
                        if (res.error == 1) {
                            $scope.state.restore.msgFalse = "settings.db.restoreTip1";
                        }
                        else if (res.error == 2) {
                            $scope.state.restore.msgFalse = 'settings.db.restoreTip2';
                        }
                        else {
                            $scope.state.restore.msgFalse = 'settings.db.restoreTip2';
                        }
                    }
                }
            })
        }

        $scope.showRebootAlert = function () {
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/templates/dialogAlert.html',
                windowClass: 'modal-del',
                size: "w500",
                controller: function ($scope, $uibModalInstance) {
                    $scope.con = {
                        title: TS.ts("settings.db.restore"),
                        content: TS.ts("settings.db.restoreTip3"),
                        type: 'menu:system'
                    };
                    $scope.ok = function () {
                        $uibModalInstance.close();
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function () {
                window.location = "/";
            }, function () {

            });

        }
        $scope.backupnow = function (flag) {
            //备份都不显示
            backupInitObj();
            if (flag == 1) {
                $scope.state.backupConfig.processing = true;
                $scope.state.backupConfig.isSuccess = false;
                $scope.state.backupConfig.isError = false;
            } else {
                $scope.state.backupLog.processing = true;
                $scope.state.backupLog.isSuccess = false;
                $scope.state.backupLog.isError = false;
            }


            OrganizationService.backupNow(flag, function (result) {
                if (flag == 1) {
                    if (result.success) {
                        $scope.state.backupConfig.processing = false;
                        $scope.state.backupConfig.isSuccess = true;
                    } else {
                        $scope.state.backupConfig.processing = false;
                        $scope.state.backupConfig.isError = true;
                        $scope.state.backupConfig.msgFalse = result.error;
                    }
                } else {
                    if (result.success) {
                        $scope.state.backupLog.processing = false;
                        $scope.state.backupLog.isSuccess = true;
                    } else {
                        $scope.state.backupLog.processing = false;
                        $scope.state.backupLog.isError = true;
                        $scope.state.backupLog.msgFalse = result.error;
                    }
                }

            });
        };

        function backupInitObj() {
            $scope.state.backupConfig.isSuccess = false;
            $scope.state.backupLog.isSuccess = false;
            $scope.state.deleteBackupConfig.isSuccess = false;
            $scope.state.deleteBackupConfig.isError = false;
            $scope.state.deleteBackupLog.isSuccess = false;
            $scope.state.deleteBackupLog.isError = false;
            $scope.state.downloadBackupConfig.isSuccess = false;
            $scope.state.downloadBackupConfig.isError = false;
            $scope.state.downloadBackupLog.isSuccess = false;
            $scope.state.downloadBackupLog.isError = false;
        }

        /***
         * @method 下载备份
         * @param flag：1.config 2.log type:download
         * */
        $scope.download = function (flag) {
            //如果保存成功显示了要去掉
            backupInitObj();

            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/system/dbDownloads.html',
                size: "w700",
                resolve: {
                    flag: function () {
                        return flag;
                    },
                    type: function () {
                        return "download";
                    }
                },
                controller: 'downloadController'
            });
            modalInstance.result.then(function (data) {
                if (data.flag == 1) {
                    if (data.type == "success") {
                        $scope.state.downloadBackupConfig.isSuccess = true;
                        $scope.state.downloadBackupConfig.isError = false;
                    } else {
                        $scope.state.downloadBackupConfig.isSuccess = false;
                        $scope.state.downloadBackupConfig.isError = true;
                    }
                } else {
                    if (data.type == "success") {
                        $scope.state.downloadBackupLog.isSuccess = true;
                        $scope.state.downloadBackupLog.isError = false;
                    } else {
                        $scope.state.downloadBackupLog.isSuccess = false;
                        $scope.state.downloadBackupLog.isError = true;
                    }
                }

            })
        };
        /**
         *@method 监听备份的type，如果是服务器的话，要做判断，如果为空按钮不能保存
         * @author 李莉红
         * @version
         * */
        $scope.$watch('database.autoBackupType', function (value) {
            if (value == 2) {
                if (!$scope.database.externalSyslogServer) {
                    $scope.invalidExSyslogServer = true;
                } else {
                    $scope.invalidExSyslogServer = false;
                }
            } else {
                $scope.invalidExSyslogServer = false;
            }
        });
        $scope.$watch('database.externalSyslogServer', function (value) {
            //externalSyslogServer为空的时候disable为true，不可以保存
            if ($scope.database.autoBackupType == 2) {
                if (value) {
                    $scope.invalidExSyslogServer = false;
                } else {
                    $scope.invalidExSyslogServer = true;

                }
            }

        });
        /**
         *@method 删除备份
         * @param flag:1:配置，2:log，type:download,delete
         * @author 李莉红
         * @version
         * */
        $scope.deleteBackup = function (flag) {
            //如果保存成功显示了要去掉
            backupInitObj();
            var type = "delete";
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/system/dbDownloads.html',
                size: "w700",
                resolve: {
                    flag: function () {
                        return flag;
                    },
                    type: function () {
                        return type;
                    }
                },
                controller: 'downloadController'
            });
            modalInstance.result.then(function (data) {
                if (data.flag == 1) {
                    if (data.type == "success") {
                        $scope.state.deleteBackupConfig.isSuccess = true;
                        $scope.state.deleteBackupConfig.isError = false;
                    } else {
                        $scope.state.deleteBackupConfig.isSuccess = false;
                        $scope.state.deleteBackupConfig.isError = true;
                    }
                } else {
                    if (data.type == "success") {
                        $scope.state.deleteBackupLog.isSuccess = true;
                        $scope.state.deleteBackupLog.isError = false;
                    } else {
                        $scope.state.deleteBackupLog.isSuccess = false;
                        $scope.state.deleteBackupLog.isError = true;
                    }
                }

            })
        };


        /*********************************
         * 板子上系统设置开始
         *
         * *****************************/
        //选择选项变动的时候清除数据
        $scope.$watch('org.ipType', function (value) {
            $scope.state.lanSetting.processing = false;
            $scope.state.lanSetting.isSuccess = false;
            $scope.state.lanSetting.isError = false;
            if (value && value == "dhcp") {
                //清除所有数据
                $scope.ifDHCP = true;//不可以填写
                if ($scope.org.changeDAA != undefined) {
                    $scope.org.changeDAA = undefined;
                }
                //deleteChipData();
                if (document.getElementById("sys_changeDAA") && !document.getElementById("sys_changeDAA").disabled) {
                    disableCheckBox("sys_changeDAA", "sys_changeDAA_checkbox");
                }
                if ($scope.originalField.ipType && (value != $scope.originalField.ipType)) {
                    $scope.disabledLanSetting = false;//可以保存
                } else {
                    $scope.disabledLanSetting = true;//不可以保存
                }
            } else if (value && value == "static") {
                // 填上默认数据
                $scope.ifDHCP = false;//可以填写
                initChipData();
                if (document.getElementById("sys_changeDAA") && document.getElementById("sys_changeDAA").disabled) {
                    document.getElementById("sys_changeDAA").disabled = "";
                    document.getElementById("sys_changeDAA_checkbox").style.backgroundColor = "";
                    document.getElementById("sys_changeDAA_checkbox").style.border = "";
                    document.getElementById("sys_changeDAA_checkbox").style.color = "";
                }
                if ($scope.originalField.ipType && value != $scope.originalField.ipType) {
                    $scope.disabledLanSetting = false;//可以保存
                } else {
                    if ($scope.org.ipAddress == $scope.originalField.ipAddress &&
                        $scope.org.subnetMask == $scope.originalField.subnetMask &&
                        $scope.org.defaultGateWay == $scope.originalField.defaultGateWay &&
                        $scope.org.primaryDNS == $scope.originalField.primaryDNS &&
                        $scope.org.secondDNS == $scope.originalField.secondDNS &&
                        $scope.org.changeDAA == $scope.originalField.changeDAA) {
                        $scope.disabledLanSetting = true;//不可以保存
                    } else {
                        $scope.disabledLanSetting = false;//可以保存
                    }
                }
            }
        });

        function initChipData() {
            // 第一次加载时默认值设置
            if (!$scope.org.ipType) {
                $scope.org.ipType = "static";
            }
            if (!$scope.org.ipAddress) {
                $scope.org.ipAddress = $scope.inputField.ipAddress || "192.168.0.200";
            }
            if (!$scope.org.subnetMask) {
                $scope.org.subnetMask = $scope.inputField.subnetMask || "255.255.255.0";
            }
            if (!$scope.org.defaultGateWay) {
                $scope.org.defaultGateWay = $scope.inputField.defaultGateWay;
            }
            if (!$scope.org.primaryDNS) {
                $scope.org.primaryDNS = $scope.inputField.primaryDNS;
            }
            if (!$scope.org.secondDNS) {
                $scope.org.secondDNS = $scope.inputField.secondDNS;
            }
            if ($scope.org.changeDAA == undefined) {
                $scope.org.changeDAA = true;
            }
        };

        function deleteChipData() {
            // 选择动态ip的时候
            if ($scope.org.ipAddress) {
                $scope.org.ipAddress = "";
            }
            if ($scope.org.subnetMask) {
                $scope.org.subnetMask = "";
            }
            if ($scope.org.defaultGateWay) {
                $scope.org.defaultGateWay = "";
            }
            if ($scope.org.primaryDNS) {
                $scope.org.primaryDNS = "";
            }
            if ($scope.org.secondDNS) {
                $scope.org.secondDNS = "";
            }
            if ($scope.org.changeDAA != undefined) {
                $scope.org.changeDAA = undefined;
            }

        };
        // public 输入框限制输入
        $scope.IPKeydown = function ($event) {
            utils.IPKeydown($event);
        };
        $scope.IPKeyup = function (key) {
            if ($scope.org[key] != $scope.originalField[key]) {
                if (key != 'NTPServer') {
                    $scope.disabledLanSetting = false;//可以保存
                }
            } else {
                if (key != 'NTPServer') {
                    if ($scope.org.ipType != $scope.originalField.ipType) {//从dhcp切换到static也要可以保存
                        $scope.disabledLanSetting = false;//可以保存
                    } else {
                        $scope.disabledLanSetting = true;//不可以保存
                    }
                }
            }
            utils.IPKeyup(key, $scope.org);
            $scope.inputField[key] = $scope.org[key];
        };
        //NTPchange
        $scope.$watch('org.enableNTP', function () {
            if ($scope.org) {
                if (!$scope.org.enableNTP || $scope.org.enableNTP == false) {
                    //$scope.org.NTPServer = "";
                    $scope.disabledDateAndTime = false;//可以编辑
                    $scope.invalidDate = $scope.childInvalidDate;//把原来的值赋值给父组件
                } else if ($scope.org.enableNTP == true) {
                    if (!$scope.org.NTPServer) {
                        $scope.org.NTPServer = $scope.inputField.NTPServer;
                    }
                    $scope.disabledDateAndTime = true;//不可以编辑
                    if ($scope.invalidDate) {
                        $scope.invalidDate = false;
                    }
                }
            }
            $scope.$broadcast('enableDateAndTime', $scope.disabledDateAndTime);
        });
        //事件发送事件
        $scope.$on('dateAndTimeChange', function (event, data) {
            $scope.currentTime = new Date(data);
            $scope.dateAndTime = {date: new Date(data).toISOString(), time: new Date(data).toISOString()}
        });
        $scope.$watch('org.changeDAA', function (value) {
            if (value != undefined) {
                if (value == true) {
                    //把ipadress賦值给daa
                    $scope.org.devAccessAddress = $scope.org.ipAddress;
                    $scope.inputField.changeDAA = value;
                    //button是否可保存
                    isCheckBoxChange(value);
                } else if (value == false) {
                    // 清除daa数据
                    $scope.org.devAccessAddress = "";
                    $scope.inputField.changeDAA = value;
                    isCheckBoxChange(value);
                }
            }
        });
        //是否要除去ipaddress
        $scope.ExceptIpAddress = function () {
            if ($scope.exceptIPAddress == true) {
                //把ipadress賦值给daa
                $scope.exceptIPAddress = false;
            } else if (!$scope.exceptIPAddress) {
                $scope.exceptIPAddress = true;
            }
        };

        function isCheckBoxChange(value) {
            //只要iptype变了，不管这个changDAA改没改都要可保存
            //如果當前這個值跟value相等，并且其他的项都没动，动了的话才是可以保存
            if ($scope.originalField.ipType && $scope.org.ipType != $scope.originalField.ipType) {
                $scope.disabledLanSetting = false;//可以保存
                return
            } else {
                if ($scope.org.ipType == "static") {
                    if (value != $scope.originalField.changeDAA) {
                        $scope.disabledLanSetting = false;//可以保存
                    } else if ($scope.org.ipAddress == $scope.originalField.ipAddress &&
                        $scope.org.subnetMask == $scope.originalField.subnetMask &&
                        $scope.org.defaultGateWay == $scope.originalField.defaultGateWay &&
                        $scope.org.primaryDNS == $scope.originalField.primaryDNS &&
                        $scope.org.secondDNS == $scope.originalField.secondDNS &&
                        value == $scope.originalField.changeDAA) {
                        $scope.disabledLanSetting = true;//不可以保存
                    }
                }
            }
        }

        //保存lansetting，同步到systemcli那边，还要调so的接口
        $scope.saveLanSetting = function () {
            //Dynamic IP (DHCP) 換到 Static IP (Manual) 且未編輯Static IP (Manual):
            // 按下Save按鈕, 應該會跳出視窗
            // 因無更改IP所以只須跳出視窗告知使用者不須重新斷線與登入
            if ($scope.originalField.ipType == "dhcp" && $scope.org.ipType == "static" &&
                $scope.org.ipAddress == $scope.originalField.ipAddress &&
                $scope.org.subnetMask == $scope.originalField.subnetMask &&
                $scope.org.defaultGateWay == $scope.originalField.defaultGateWay &&
                $scope.org.primaryDNS == $scope.originalField.primaryDNS &&
                $scope.org.secondDNS == $scope.originalField.secondDNS
            ) {
                var modalInstance = $uibModal.open({
                    backdrop: 'static',
                    animation: true,
                    keyboard: false,
                    templateUrl: './views/templates/dialogConfirm.html',
                    windowClass: 'modal-saveLanSetting',
                    size: "w500",
                    controller: function ($scope, $uibModalInstance) {
                        $scope.con = {
                            title: TS.ts("addChipSystemData.lanSetting"),
                            content: TS.ts("settings.lanSettingUpdate"),
                            type: 'menu:system'
                        };
                        $scope.ok = function (r) {
                            $uibModalInstance.close(r);
                            //弹框之后确认保存设置
                            handleSaveLanSetting(true, false, true);

                        };
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                });
            } else {
                var changeIPAddress = false;
                if ($scope.org.ipAddress != $location.host() ||
                    $scope.org.ipAddress != $scope.originalField.ipAddress ||
                    $scope.org.subnetMask != $scope.originalField.subnetMask ||
                    $scope.org.defaultGateWay != $scope.originalField.defaultGateWay ||
                    $scope.org.ipType == "dhcp") {
                    changeIPAddress = true;
                }
                //如果改变了ip那就要倒计时，
                if (changeIPAddress) {
                    //改变了ip就要弹确定框
                    var modalInstance = $uibModal.open({
                        backdrop: 'static',
                        animation: true,
                        keyboard: false,
                        templateUrl: './views/templates/dialogConfirm.html',
                        windowClass: 'modal-saveLanSetting',
                        size: "w500",
                        controller: function ($scope, $uibModalInstance) {
                            $scope.con = {
                                title: TS.ts("addChipSystemData.lanSetting"),
                                content: TS.ts("settings.lanSettingConfirm"),
                                type: 'menu:system'
                            };
                            $scope.ok = function (r) {
                                $uibModalInstance.close(r);
                                //弹框之后确认保存设置并且要倒计时
                                handleSaveLanSetting(changeIPAddress, true);
                            };
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                        }
                    });
                } else {
                    //不用倒计时，直接保存就行
                    handleSaveLanSetting(changeIPAddress, false);
                }
            }
        };

        function handleSaveLanSetting(changeIPAddress, isTictoc, changeOriginalIPType) {
            $scope.state.lanSetting.processing = true;
            $scope.state.lanSetting.isSuccess = false;
            $scope.state.lanSetting.isError = false;
            if (!$scope.org.changeDAA || $scope.org.changeDAA == false) {
                $scope.org.changeDAA = 0;
            } else if ($scope.org.changeDAA == true) {
                $scope.org.changeDAA = 1;
            }
            if ($scope.org.changeDAA == 1) {//因为没改changeDAA这个checkbox的时候，ip会不同步
                $scope.org.devAccessAddress = $scope.org.ipAddress;
            }
            var cliSetting =
                {
                    "LAN": {
                        type: $scope.org.ipType,
                        ip: $scope.org.ipAddress,
                        mask: $scope.org.subnetMask,
                        gateway: $scope.org.defaultGateWay,
                        dns: $scope.org.primaryDNS,
                        secDNS: $scope.org.secondDNS,
                        changeDAA: $scope.org.changeDAA
                    }
                };
            var dbSetting = {
                _id: $scope.org._id,
                webAccessAddress: $scope.org.ipAddress
            };
            OrganizationService.updateChipSystemSetting(cliSetting, dbSetting, function (result) {
                if (result.success || (!result.success && changeIPAddress && result.error == 408)) {
                    $scope.state.lanSetting.processing = false;
                    $scope.state.lanSetting.isSuccess = true;
                    //倒计时
                    if (isTictoc) {
                        $scope.isShowLanForm = false;
                        var text = {
                            text1: TS.ts("settings.lanSettingInfo1"),
                            text2: TS.ts("settings.waitInfo"),
                            text3: TS.ts("settings.secondInfo"),
                        };
                        var second = 30;
                        tictoc(text, second, $scope.org.webAccessPort, $scope.org.ipAddress);
                    }
                    if (changeOriginalIPType) {//dbcp改到static的时候要把原ipType的状态改了
                        $scope.originalField.ipType = "static";
                    }
                } else {
                    $scope.state.lanSetting.processing = false;
                    $scope.state.lanSetting.isSuccess = false;
                    $scope.state.lanSetting.isError = true;
                    if (result.error == 1) {
                        console.log("数据库存储失败");
                        $scope.state.lanSetting.msgFalse = "syslog.serverity.Error";
                    }
                    else if (result.error == 40001) {
                        console.log("不支持的操作系统");
                        $scope.state.lanSetting.msgFalse = "settings.usbStorageFailed1";
                    }
                    else {
                        console.log("参数格式错误");
                        $scope.state.lanSetting.msgFalse = "syslog.serverity.Error";
                    }
                }
            });
        }

        //保存时间
        $scope.saveDateAndTimeSetting = function () {
            $scope.state.dateAndTimeSetting.processing = true;
            $scope.state.dateAndTimeSetting.isSuccess = false;
            $scope.state.dateAndTimeSetting.isError = false;
            if ($scope.org.enableNTP == false) {
                $scope.org.enableNTP = 0;
            } else if ($scope.org.enableNTP == true) {
                $scope.org.enableNTP = 1;
            }
            //调用systemcli的接口
            let NTP = $scope.org.NTPServer;
            let time = "";
            let defaultNTPServer = "ntp1.dlink.com";
            let enableNTP = 1;
            if (!$scope.org.enableNTP || $scope.org.enableNTP == 0) {
                time = utils.format($scope.currentTime, 'yyyy-MM-dd HH:mm:ss');
                enableNTP = 2;
            } else {
                NTP = $scope.org.NTPServer;
                defaultNTPServer = "ntp1.dlink.com";
            }
            let cliSetting =
                {
                    "Date": {
                        "Datetime": time,
                        "Timezone": $scope.org.timeZone.id
                    },
                    "NTP": NTP,
                    "defaultNTPServer": defaultNTPServer,
                    "enableNTP": enableNTP//传入1和2
                };
            OrganizationService.updateChipSystemSetting(cliSetting, null, function (result) {
                if (result.success) {
                    $scope.state.dateAndTimeSetting.processing = false;
                    $scope.state.dateAndTimeSetting.isSuccess = true;
                    //保存完之后再初始化一下NTP
                    if ($scope.org.enableNTP == 0) {
                        $scope.org.enableNTP = false;
                    } else if ($scope.org.enableNTP == 1) {
                        $scope.org.enableNTP = true;
                    }
                } else {
                    $scope.state.dateAndTimeSetting.processing = false;
                    $scope.state.dateAndTimeSetting.isError = true;
                    if (result.error == 1) {
                        console.log("数据库存储失败");
                        $scope.state.dateAndTimeSetting.msgFalse = "syslog.serverity.Error";
                    }
                    else if (result.error == 40001) {
                        console.log("不支持的操作系统");
                        $scope.state.dateAndTimeSetting.msgFalse = "settings.usbStorageFailed1";
                    }
                    else {
                        console.log("参数格式错误");
                        $scope.state.dateAndTimeSetting.msgFalse = "syslog.serverity.Error";
                    }
                }
            });
        };
        $scope.saveConsoleSetting = function () {
            $scope.state.consoleSetting.processing = true;
            $scope.state.consoleSetting.isSuccess = false;
            $scope.state.consoleSetting.isError = false;
            if ($scope.org.enableConsole == false) {
                $scope.org.enableConsole = 0;
            } else if ($scope.org.enableConsole == true) {
                $scope.org.enableConsole = 1;
            }
            var cliSetting = {
                "Console": {
                    "enable": $scope.org.enableConsole,
                    "protocol": $scope.org.consoleProtocol,
                    "timeout": parseInt($scope.org.timeout)
                }
            };
            OrganizationService.updateChipSystemSetting(cliSetting, null, function (result) {
                if (result.success) {
                    $scope.state.consoleSetting.processing = false;
                    $scope.state.consoleSetting.isSuccess = true;
                } else {
                    $scope.state.consoleSetting.processing = false;
                    $scope.state.consoleSetting.isError = true;
                    if (result.error == 1) {
                        console.log("数据库存储失败");
                        $scope.state.consoleSetting.msgFalse = "syslog.serverity.Error";
                    } else if (result.error == 40030) {
                        console.log("无效的启用类型");
                        $scope.state.consoleSetting.msgFalse = "settings.consoleSettingFailed1";
                    } else if (result.error == 40031) {
                        console.log("无效的协议");
                        $scope.state.consoleSetting.msgFalse = "settings.consoleSettingFailed2";
                    } else if (result.error == 40032) {
                        console.log("无效的超时时间");
                        $scope.state.consoleSetting.msgFalse = "settings.consoleSettingFailed3";
                    } else if (result.error == 40011) {
                        $scope.state.consoleSetting.msgFalse = 'syslog.serverity.Error';
                    } else if (result.error == 40012) {
                        $scope.state.consoleSetting.msgFalse = 'syslog.serverity.Error';
                    } else if (result.error == 40001) {
                        $scope.state.consoleSetting.msgFalse = 'settings.usbStorageFailed1';
                    } else {
                        $scope.state.consoleSetting.msgFalse = "syslog.serverity.Error";
                    }
                }
            });
        };

        $scope.checkUSBstorage = function (value) {
            $scope.state[value].usbStorage.processing = true;
            $scope.state[value].usbStorage.isError = false;
            OrganizationService.getUSBStorage(function (result) {
                if (result.success) {
                    $scope.state[value].usbStorage.processing = false;
                    $scope.usbStorageStatus = true;
                } else {
                    $scope.state[value].usbStorage.processing = false;
                    $scope.state[value].usbStorage.isError = true;
                    $scope.usbStorageStatus = false;
                    if (40001 == result.error) {
                        $scope.state[value].usbStorage.msgFalse = 'settings.usbStorageFailed1';
                    }
                    else if (40010 == result.error) {
                        $scope.state[value].usbStorage.msgFalse = 'settings.usbStorageFailed2';
                    }
                    else {
                        $scope.state[value].usbStorage.msgFalse = "syslog.serverity.Error";
                    }
                }
            });
        };
        $scope.browserUSBFiles = function () {
            if (!$scope.usbStorageStatus) return;
            OrganizationService.browserUSBFiles(function (result) {
                if (result.success) {
                    $scope.usbFiles = result.data;
                } else {
                    $scope.usbFiles = [];
                }
            })
        };
        /*拷贝电脑时间显示*/
        $scope.copyTimeFormComputer = function () {
            $scope.dateAndTime = {date: new Date().toISOString(), time: new Date().toISOString(), timeError: false};
            $scope.invalidDate = false;//按钮变为可用
            $scope.$broadcast('dateAndTime', $scope.dateAndTime);
        };
        //date部分按钮不能使用部分
        $scope.invalidDate = false;//定义
        $scope.$on('disableButton', function (event, data) {
            $scope.invalidDate = data;
            $scope.childInvalidDate = data;
        });
        $scope.$watch('org.timeZone', function (value) {
            if (!value || Object.keys(value).length === 0) {
                $scope.invalidTimeZone = true;
            } else {
                $scope.invalidTimeZone = false;
            }
        });
        /*********************************
         * 板子上系统设置结束
         *
         * *****************************/
        //固件升级
        $scope.uploadFrom = ['computer', 'usb', 'ftp'];
        $scope.originalFtp = {};
        $scope.ftp = {
            ftpServer: "",
            ftpPort: 21,
            ftpUsername: "",
            ftpPassword: "",
            firmwareFile: "",
        };
        $scope.$watch('state.fwUpgrade.location', function (value) {
            if (value == "ftp") {
                $scope.invalidPort.ftpPort = true;
                $scope.usbStorageStatus = false;
            } else {
                $scope.invalidPort.ftpPort = false;
            }
            if ($scope.state.fwUpgrade.isError) {
                $scope.state.fwUpgrade.isError = false;
            }
        });
        //监听从usb上传的文件名称后缀
        $scope.$watch('db.usbStorageFwUpgrade', function (value) {
            if (value) {
                const extension = value.substring(value.lastIndexOf(".") + 1).toLowerCase() === 'bin';
                if (!extension) {
                    $scope.fwUpgradeValidate = true;
                    return false;
                } else {
                    $scope.fwUpgradeValidate = false;
                    return true;
                }
            }

        });
        $scope.checkUSBstorage1 = function (value) {
            if (value != undefined && value == "usb") {
                $scope.checkUSBstorage('fwUpgrade');
            }
        };
        OrganizationService.getFtpData(function (result) {
            if (result.success) {
                var ftpPassword = "";
                if (result.data.ftpUsername && result.data.ftpPassword) {
                    ftpPassword = utils.decryptMethod(result.data.ftpUsername, result.data.ftpPassword);
                }
                $scope.ftp.ftpServer = result.data.ftpServer;
                $scope.ftp.ftpPort = result.data.ftpPort;
                $scope.ftp.ftpUsername = result.data.ftpUsername;
                $scope.ftp.ftpPassword = ftpPassword;
                $scope.originalFtp.ftpServer = result.data.ftpServer;
                $scope.originalFtp.ftpPort = result.data.ftpPort;
                $scope.originalFtp.ftpUsername = result.data.ftpUsername;
                $scope.originalFtp.ftpPassword = ftpPassword;
            }
        });
        $scope.ftpPortKeyup = function () {
            if (parseInt($scope.ftp.ftpPort) < 1 || parseInt($scope.ftp.ftpPort) > 65535) {
                $scope.invalidPort.ftpPort = true;
            } else {
                $scope.invalidPort.ftpPort = false;
            }
        };
        $scope.isShowFWUpgrade = 0;
        $scope.applyFwUpdate = function () {
            //先查一下备份在哪里，后台要先恢复备份
            OrganizationService.getBackupSetting(function (result) {
                if (result.success && result.data) {
                    if (result.data) {
                        var autoBackupType = result.data.autoBackupType;
                        if (autoBackupType == undefined) {
                            autoBackupType = $scope.database.autoBackupType;
                        }
                        //固件升级的时候把全局变量设为true，这样检测登出的时候就可以看是否要登出
                        isFWUpgrade = true;
                        $scope.isShowFWUpgrade = 1;
                        //升級固件的時候要把頁面設置為不可點
                        var loadingIndicator = document.getElementsByClassName("loading-indicator");
                        loadingIndicator[0].style.display = "block";
                        $scope.state.fwUpgrade.processing = true;
                        $scope.state.fwUpgrade.isSuccess = false;
                        $scope.state.fwUpgrade.isError = false;
                        var data = {};
                        if ($scope.state.fwUpgrade.location == 'computer') {
                            data = {
                                orgId: $scope.org._id,
                                file: $scope.db.diskFwUpgrade,
                                location: 'computer'
                            }
                        } else if ($scope.state.fwUpgrade.location == 'usb') {
                            data = {
                                orgId: $scope.org._id,
                                file: null,
                                location: 'usb',
                                usbFilePath: $scope.db.usbStorageFwUpgrade
                            }
                        } else if ($scope.state.fwUpgrade.location == 'ftp') {
                            data = {
                                orgId: $scope.org._id,
                                file: null,
                                location: 'ftp',
                                ftpFilePath: $scope.ftp.firmwareFile,
                                ftpServer: $scope.ftp.ftpServer,
                                ftpPort: $scope.ftp.ftpPort,
                                ftpUsername: $scope.ftp.ftpUsername,
                                ftpPassword: utils.encryptMethod($scope.ftp.ftpUsername, $scope.ftp.ftpPassword)
                            }
                        }
                        var params = {
                            url: base_url + '/systemFwUpgrade/firmwareUpgrade',
                            method: 'POST',
                            headers: {
                                'Content-Type': 'multipart/form-data'
                            },
                            data: data
                        };
                        if ($scope.state.fwUpgrade.location == 'ftp' && (
                            $scope.ftp.ftpServer != $scope.originalFtp.ftpServer ||
                            $scope.ftp.ftpPort != $scope.originalFtp.ftpPort ||
                            $scope.ftp.ftpUsername != $scope.originalFtp.ftpUsername ||
                            $scope.ftp.ftpPassword != $scope.originalFtp.ftpPassword)) {
                            if ($scope.ftp.ftpUsername && $scope.ftp.ftpPassword) {
                                var encryptFtpPassword = utils.encryptMethod($scope.ftp.ftpUsername, $scope.ftp.ftpPassword);
                            }
                            var config = [$scope.ftp.ftpServer, parseInt($scope.ftp.ftpPort), $scope.ftp.ftpUsername, encryptFtpPassword];
                            OrganizationService.setFtpData(config, function (result) {
                            });
                        }
                        Upload.upload(params).then(function (result) {
                            if (result.status == 200) {
                                if (!result.data.success) {
                                    isFWUpgrade = false;
                                    $scope.isShowFWUpgrade = 0;
                                    loadingIndicator[0].style.display = "none";
                                    $scope.state.fwUpgrade.processing = false;
                                    $scope.state.fwUpgrade.isError = true;
                                    if (result.data.error == -1) {
                                        $scope.state.fwUpgrade.msgFalse = 'settings.fwUpgrade.fwUpgradeFailed1';
                                    }
                                    else if (result.data.error == -2) {
                                        $scope.state.fwUpgrade.msgFalse = 'settings.fwUpgrade.fwUpgradeFailed12';
                                    } else if (result.data.error == -3) {//usb的文件大小超过了300MB
                                        $scope.fwUpgradeValidate = true;
                                    }
                                    else if (result.data.error == 40001) {
                                        $scope.state.fwUpgrade.msgFalse = 'settings.usbStorageFailed1';
                                    }
                                    else if (result.data.error == 40051) {//Firmware upgrade busy
                                        $scope.state.fwUpgrade.msgFalse = 'settings.fwUpgrade.fwUpgradeFailed7';
                                    }
                                    else if (result.data.error == 40020) {
                                        $scope.state.fwUpgrade.msgFalse = 'settings.fwUpgrade.fwUpgradeFailed8';
                                    }
                                    else if (result.data.error == 40021) {
                                        $scope.state.fwUpgrade.msgFalse = 'settings.fwUpgrade.fwUpgradeFailed9';
                                    }
                                    else if (result.data.error == 40022) {
                                        $scope.state.fwUpgrade.msgFalse = 'settings.fwUpgrade.fwUpgradeFailed6';
                                    }
                                    else if (result.data.error == 40023) {
                                        $scope.state.fwUpgrade.msgFalse = 'settings.fwUpgrade.fwUpgradeFailed10';
                                    }
                                    else if (result.data.error == 40024) {
                                        $scope.state.fwUpgrade.msgFalse = 'settings.fwUpgrade.fwUpgradeFailed11';
                                    }
                                    else if (result.data.error == 40025) {
                                        $scope.state.fwUpgrade.msgFalse = 'settings.fwUpgrade.fwUpgradeFailed3';
                                    }
                                    else if (result.data.error == 40026) {
                                        $scope.state.fwUpgrade.msgFalse = 'settings.fwUpgrade.fwUpgradeFailed4';
                                    }
                                    else if (result.data.error == 40027) {
                                        $scope.state.fwUpgrade.msgFalse = 'settings.fwUpgrade.fwUpgradeFailed5';
                                    }
                                    else if (result.data.error == 40028) {
                                        $scope.state.fwUpgrade.msgFalse = 'settings.fwUpgrade.fwUpgradeFailed2';
                                    }
                                    else {
                                        $scope.state.fwUpgrade.msgFalse = 'syslog.serverity.Error';
                                    }
                                }
                                else {
                                    $scope.fwUpgradeValidate = false;
                                    if (autoBackupType == 1) {
                                        //倒计时加多一个备份的倒计时
                                        // 倒计时
                                        var text = {
                                            text1: TS.ts("settings.fwUpdateInfo1"),
                                            text2: TS.ts("settings.waitInfo"),
                                            text3: TS.ts("settings.secondInfo"),
                                            text4: TS.ts("settings.sdBackupLoading")
                                        }
                                        var second = 200;
                                        tictoc(text, second, $scope.org.webAccessPort, $scope.org.ipAddress);
                                        $scope.isShowUpgradeForm = false;
                                    } else {
                                        // 倒计时
                                        var text = {
                                            text1: TS.ts("settings.fwUpdateInfo1"),
                                            text2: TS.ts("settings.waitInfo"),
                                            text3: TS.ts("settings.secondInfo"),
                                        }
                                        var second = 200;
                                        tictoc(text, second, $scope.org.webAccessPort, $scope.org.ipAddress);
                                        $scope.isShowUpgradeForm = false;
                                    }

                                }
                            }
                            else {
                                isFWUpgrade = false;
                                $scope.state.fwUpgrade.isShowFWUpgrade = 0;
                                loadingIndicator[0].style.display = "none";
                                $scope.state.fwUpgrade.processing = false;
                                $scope.state.fwUpgrade.isError = true;
                                $scope.state.fwUpgrade.msgFalse = 'settings.fwUpgrade.fwUpgradeFailed10';
                            }
                        });
                    }
                }
            });

        };
        //恢復出廠設置
        //是否要除去ipaddress
        $scope.exceptIPAddress = false;
        $scope.restoreSettings = function (r) {
            //把多选框的变量带上

            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/templates/dialogConfirm.html',
                windowClass: 'modal-restore',
                resolve: {
                    r: r
                },
                size: "w500",
                controller: function ($scope, $uibModalInstance, r) {
                    $scope.con = {
                        title: TS.ts("settings.restoreTitle"),
                        content: TS.ts("settings.restoreTip"),
                        type: 'common:warning'
                    };
                    $scope.ok = function (r) {
                        $uibModalInstance.close(r);
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function (r) {
                //调用恢复出厂设置的方法
                $scope.state.restoreFactory.processing = true;
                $scope.state.restoreFactory.isError = false;
                OrganizationService.restoreDevice($scope.exceptIPAddress, function (res) {
                    if (res.success || res.error == 408) {
                        $scope.state.restoreFactory.processing = false;
                        //倒计时提示
                        var text = {
                            text1: TS.ts("settings.restoreInfo1"),
                            text2: TS.ts("settings.waitInfo"),
                            text3: TS.ts("settings.secondInfo"),
                        }
                        var second = 140;
                        tictoc(text, second, $scope.org.webAccessPort, $scope.org.ipAddress);
                        $scope.isShowForm = false;
                    } else {
                        $scope.state.restoreFactory.processing = false;
                        $scope.state.restoreFactory.isError = true;
                        if (res.error == 40001) {
                            $scope.state.restoreFactory.msgFalse = 'settings.sysOperation.restoreFailed2';
                        }
                        else {
                            $scope.state.restoreFactory.msgFalse = 'settings.sysOperation.restoreFailed1';
                        }
                    }
                })
            }, function () {

            });
        };

        function tictoc(text, second, webAccessPort, ipAddress) {
            $scope.dataInfo = {text: text, second: second};
            document.getElementById("tictoc_div").style.display = "block";
            //$scope.isShowTicTok = true;
            $scope.$broadcast("tickTok", text, second, webAccessPort, ipAddress);
        }

        //重启设备
        $scope.restartDevice = function (r) {
            OrganizationService.getBackupSetting(function (result) {
                if (result.success && result.data) {
                    if (result.data) {
                        var autoBackupType = result.data.autoBackupType;
                        if (autoBackupType == undefined) {
                            autoBackupType = $scope.database.autoBackupType;
                        }
                        var modalInstance = $uibModal.open({
                            backdrop: 'static',
                            animation: true,
                            keyboard: false,
                            templateUrl: './views/templates/dialogConfirm.html',
                            windowClass: 'modal-restart',
                            resolve: {
                                r: r,
                                autoBackupType: autoBackupType,
                            },
                            size: "w500",
                            controller: function ($scope, $uibModalInstance, r, autoBackupType) {
                                if (autoBackupType == 1) {
                                    $scope.con = {
                                        title: TS.ts("settings.restartTitle"),
                                        content: TS.ts("settings.sdBackupFirst") + TS.ts("settings.restartTip"),
                                        type: 'common:warning'
                                    };
                                } else {
                                    $scope.con = {
                                        title: TS.ts("settings.restartTitle"),
                                        content: TS.ts("settings.restartTip"),
                                        type: 'common:warning'
                                    };
                                }
                                $scope.ok = function () {
                                    $uibModalInstance.close(r);
                                };
                                $scope.cancel = function () {
                                    $uibModalInstance.dismiss('cancel');
                                };
                            }
                        });
                        modalInstance.result.then(function (r) {
                            if (autoBackupType == 1) {
                                //先格式化sd卡，再重启
                                restart(1);
                            } else {
                                //直接重启
                                restart(0);
                            }

                        })
                    }
                }
            });

        }

            function restart(backupType) {
                //调用重启设备的方法
                $scope.state.restart.processing = true;
                $scope.state.restart.isError = false;
                OrganizationService.restartDevice(function (res) {
                    if (res.success || res.error == 408) {
                        $scope.state.restart.processing = false;
                        if (backupType == 1) {
                            //先显示sd卡正在备份
                            //倒计时提示
                            var text = {
                                text1: TS.ts("settings.restartInfo1"),
                                text2: TS.ts("settings.waitInfo"),
                                text3: TS.ts("settings.secondInfo"),
                                text4: TS.ts("settings.sdBackupLoading")
                            }
                            var second = 60;
                            tictoc(text, second, $scope.org.webAccessPort, $scope.org.ipAddress);
                            $scope.isShowForm = false;
                        } else {
                            //倒计时提示
                            var text = {
                                text1: TS.ts("settings.restartInfo1"),
                                text2: TS.ts("settings.waitInfo"),
                                text3: TS.ts("settings.secondInfo"),
                            }
                            var second = 60;
                            tictoc(text, second, $scope.org.webAccessPort, $scope.org.ipAddress);
                            $scope.isShowForm = false;
                        }
                    } else {
                        $scope.state.restart.processing = false;
                        $scope.state.restart.isError = true;
                        if (res.error == 40001) {
                            $scope.state.restart.msgFalse = 'settings.sysOperation.restartFailed2';
                        }
                        else {
                            $scope.state.restart.msgFalse = 'settings.sysOperation.restartFailed1';
                        }
                    }
                })
            }

            //格式化MicroSD卡
            $scope.isFormatting = false;
            $scope.formatMicroSDCard = function (r) {

                var modalInstance = $uibModal.open({
                    backdrop: 'static',
                    animation: true,
                    keyboard: false,
                    templateUrl: './views/templates/dialogConfirm.html',
                    windowClass: 'modal-formatCard',
                    resolve: {
                        r: r
                    },
                    size: "w500",
                    controller: function ($scope, $uibModalInstance, r) {
                        $scope.con = {
                            title: TS.ts("settings.formatTitle"),
                            content: TS.ts("settings.formatTip"),
                            type: 'common:warning'
                        };
                        $scope.ok = function () {
                            $uibModalInstance.close(r);
                        };
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                });
                modalInstance.result.then(function (r) {
                    //调用格式化SD卡的方法
                    $scope.isFormatting = true;
                    $scope.state.formatCard.processing = true;
                    $scope.state.formatCard.isError = false;
                    $scope.state.formatCard.isSuccess = false;
                    OrganizationService.formatSDCard(function (res) {
                        $scope.isFormatting = false;
                        if (res.success) {
                            $scope.state.formatCard.processing = true;
                            $scope.state.formatCard.isError = false;
                            $scope.state.formatCard.isSuccess = true;
                            //显示转圈，并lock页面，之后跳出系统
                            $scope.state.formatCard.msgFalse = '';
                            var loadingIndicator = document.getElementsByClassName("loading-indicator");
                            loadingIndicator[0].style.display = "block";
                            setTimeout(function () {
                                window.location = '/';
                            }, 30 * 1000);
                        } else {
                            $scope.state.formatCard.processing = false;
                            $scope.state.formatCard.isError = true;
                            if (res.error == -2) {
                                $scope.state.formatCard.msgFalse = 'settings.sysOperation.formatFailed3';
                            }
                            else if (res.error == 40001) {
                                $scope.state.formatCard.msgFalse = 'settings.sysOperation.formatFailed2';
                            }
                            else {
                                $scope.state.formatCard.msgFalse = 'settings.sysOperation.formatFailed1';
                            }
                        }
                    })
                })
            }

        }
    );
    app.register.filter('hourStrFilter', function () {
        return function (input) {
            var result = "00:00";
            if (input) {
                if (parseInt(input) < 10) {
                    input = "0" + input;
                }
                result = input + ":00";
            }
            return result;
        };
    })
});
