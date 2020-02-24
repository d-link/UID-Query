/**
 * Created by lizhimin on 2015/12/11.
 */

define(["controllerModule"], function (controllers) {

    controllers.controller('LoginController', ["$rootScope", "$scope", "$state", "Auth", "Current", "moudlesService", "StorageService", "TS", "$timeout", "CommonService",
        function ($rootScope, $scope, $state, Auth, Current, moudlesService, StorageService, TS, $timeout, CommonService) {
            /**
             * 基本信息
             */
            var type = StorageService.get('noticMsg');
            if (type) {
                $scope.showAlert = true;
                $scope.msg = "notice." + type;
                StorageService.unset('noticMsg');
            }
            //SSO access_token expired
            var accessToken = StorageService.get('ssoMsg');
            if (accessToken) {
                $scope.errorMessage = 3;
                StorageService.unset('ssoMsg');
            }

            $scope.product = {model: "DNH"};
            //$scope.remember = false;
            $scope.$broadcast('refresh captcha');
            // 页面步骤
            $scope.step = '';
            $scope.loginUser = null;
            // 登陆信息
            $scope.userInfo = {};
            // 修改密码
            $scope.password = {
                oldpass: '',
                newpass: '',
                confirmPassword: ''
            };
            $scope.step = 1;
            
            /**
             * focus轉跳欄位
             */

            // 一進頁面focus email 欄位
            if ($scope.step = 1) {
                document.getElementById("inputEmail").focus();
            }

            // 點選Tab鍵, focus轉跳欄位

            // Login Page
            document.getElementById("loginPage").addEventListener("keydown", function(e){
                if(e.keyCode == "9"){
                    e.preventDefault();

                    var currentFocus = document.querySelectorAll(".focusLoginElement");
                    var currentElement = e.target;
                    var currentIndex = currentElement.tabIndex;
                    var loginButton = document.getElementsByClassName("btn_login")[0];
                    var loginButtonDisanled = loginButton.disabled;

                    
                    setTimeout(function () {
                        var hasCaptcha = document.getElementById('inputCaptcha');
                        if(hasCaptcha == undefined){
                            var selectLan = currentFocus[4];
                        }else{
                            var selectLan = currentFocus[5];
                        }
    
                        var uiSelect = angular.element(selectLan).controller('uiSelect');

                        for(var i = 0; i < currentFocus.length; i++){
                            
                            if(currentFocus[i].tabIndex == (currentIndex)){

                                if(currentIndex == "3" && loginButtonDisanled == true){
                                    uiSelect.focusser[0].focus();
                                    break;
                                }else if (currentIndex == "4" && loginButtonDisanled == false){
                                    uiSelect.focusser[0].focus();
                                    break;
                                }
                                currentFocus[i+1].focus();
                                break;
                            }
                        }
                    }, 0);
                }
            });

            // Modify Page
            document.getElementById("modifyPage").addEventListener("keydown", function(e){
                if(e.keyCode == "9"){
                    e.preventDefault();

                    var currentFocus = document.querySelectorAll(".focusModifyElement");
                    var currentElement = e.target;
                    var currentIndex = currentElement.tabIndex;

                    setTimeout(function () {
                        var selectLan = currentFocus[4];
    
                        var uiSelect = angular.element(selectLan).controller('uiSelect');

                        for(var i = 0; i < currentFocus.length; i++){
                            if(currentFocus[i].tabIndex == (currentIndex)){
                                uiSelect.focusser[0].focus();
                                currentFocus[i+1].focus();
                                break;
                            }
                        }
                    }, 0);
                }
            });

            /**
             * SSO 強制跳回登入頁面
             */
                //修改帳密時, 若仍使用舊的帳號密碼則強制登出到登入頁面, 並顯示錯誤訊息
            var sameSSOAccount = localStorage.getItem("sameSSOAccount");
            if (sameSSOAccount == "true") {
                $scope.errorMessage = 3;
                localStorage.removeItem("sameSSOAccount");
            }
            //Statistics Fail
            var StatisticsFail = localStorage.getItem("StatisticsFail");
            if (StatisticsFail == "true") {
                $scope.errorMessage = 3;
                localStorage.removeItem("StatisticsFail");
            }

            $scope.needCAPTCHA = true;
            $scope.accountLocked = false;
            $scope.accountLockedTime = 60;
            Auth.getNeedCAPTCHA(function (result) {
                $scope.needCAPTCHA = result;
            });
            Auth.getIsBlocked(function (result) {
                if (result.success) {
                    $scope.accountLocked = false;
                } else {
                    $scope.accountLocked = true;
                    $scope.accountLockedTime = result.data;
                    countDown();
                }
            });
            var countDown = function () {
                $timeout(function () {
                    $scope.accountLockedTime -= 1;
                    if ($scope.accountLockedTime >= 1) {
                        countDown();
                    } else {
                        $scope.accountLockedTime = '';
                        $scope.accountLocked = false;
                    }
                }, 1000);
            };
            $scope.userNameError = false;
            $scope.checkUsername = function () {
                $scope.userNameError = false;
                //  let reg1 = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
                let reg2 = /^[a-zA-Z0-9_]{3,32}$/

                if (!reg2.test($scope.userInfo.email)) {
                    $scope.userNameError = true;
                    return;
                }

            };
            window.document.onmousemove = function () {
                if (needFresh) {
                    needFresh = false;
                    $scope.$broadcast('refresh captcha');
                }
                lastTime = new Date().getTime();
            };
            var lastTime = new Date().getTime();
            var currentTime = new Date().getTime();
            var timeOut = 2 * 60 * 1000;
            var needFresh = false;

            function checkTimeout() {
                currentTime = new Date().getTime();
                if (currentTime - lastTime > timeOut) {
                    needFresh = true;
                }
            }

            function alertLogout(msg) {
                $scope.msg = msg;
            }

            window.setInterval(checkTimeout, 60 * 1000);



            $scope.isLogining = false;
            $scope.isUpgrade = false;
            $scope.isShowUpgrade = false;
            $scope.NSlogin = function () {
                $scope.isLogining = true;
                $scope.isShowUpgrade = false;
                initErrorState();
                var res = Auth.browserOs(window.navigator.userAgent);
                if (res.browser.toLowerCase().indexOf('firefox') != -1) {
                    $scope.userInfo.password = document.querySelector('#inputPass').value;
                }
                console.log("browser info :" + JSON.stringify(res));
                var data = {
                    "email": "admin",
                    "password": "admin"
                };


                Auth.NSlogin($scope.userInfo, res, $scope.product.model, function (result) {
                    //console.log(result);
                    $scope.isLogining = false;
                    $scope.showAlert = false;
                    // initErrorState();
                    if (!result.success) {
                        if (result.error == 510) {
                            $scope.showAlert = true;
                            alertLogout('notice.csStop');
                            // return;
                        } else {
                            $scope.beError = true;
                            $scope.$broadcast('refresh captcha');
                            if (result.error == -2) {
                                $scope.errors.captcha.isError = true;
                            } else if (result.error == -3) {
                                alert("Its privilege status is disabled!");
                            } else {
                                if (result.error == 5) {
                                    $scope.accountLocked = true;
                                    $scope.accountLockedTime = 60;
                                    countDown();
                                }else{
                                    $scope.errors.user.isError = true;
                                }
                            }
                        }

                    } else {
                        if (result.data == 40051) {
                            $scope.isUpgrade = true;
                            $scope.isShowUpgrade = true;
                            $timeout(function () {
                                checkGradeStatus()
                            }, 10000);
                            return;
                        } else {
                            Auth.appCheck(data, function (res) {
                                console.log(res);
                                StorageService.unset('noticMsg');
                                $scope.loginUser = result.data;
                                if (result.data.originalPass && result.data.originalPass == true) {
                                    $scope.step = 2;

                                    $timeout(function () {
                                        document.getElementById("focusPass").focus()
                                    }, 100);
                                } else {
                                    Current.setUser(result.data);
                                    //rememberPassword();
                                    Auth.loadMode($scope.product.model);
                                }

                            })
                        }
                    }
                });
            };
            //取ntp和sd卡的状态
            // CommonService.getStatus(function (result) {
            //     if (result.success) {
            //         $scope.NTPStatus = NTPStatus;
            //         $scope.SDStatus = SDStatus;
            //     } else {
            //
            //     }
            //
            // });

            //是否在固件更新
            checkGradeStatus();
            function checkGradeStatus(){
                Auth.upGrade(function (result) {
                    if (result.success) {
                        if (result.data == 40051) {
                            $scope.isUpgrade = true;
                            $timeout(function () {
                                checkGradeStatus()
                            }, 10000);
                            return ;
                        } else {
                            $scope.isUpgrade = false;
                            return ;
                        }
                    } else {
                        $scope.isUpgrade = false;
                        return ;
                    }
                },function(err){
                    $timeout(function () {
                        checkGradeStatus()
                    }, 10000);
                });
            }

            function Trim(str) {
                return str.replace(/(^\s*)|(\s*$)/g, "");
            }

            $scope.modify = function () {

                $scope.password.userId = $scope.loginUser._id;
                Auth.changePassInitial($scope.password, function (result) {
                    if (!result.success) {
                        if (result.error == 2) {
                            //旧密码错误
                            $scope.passError = true;
                        }
                    } else {
                        Current.setUser($scope.loginUser);
                        //rememberPassword();
                        Auth.loadMode($scope.product.model);
                    }

                });

            };

            /**
             * 表单提示信息
             */
            function initErrorState() {
                $scope.errors = {
                    captcha: {msg: 'invalid.captchaMatch'},
                    user: {msg: "invalid.passwordError"},
                    ascii: {msg: "invalid.userName", msg1: "invalid.password"}
                };
                $scope.beChange = {
                    email: false,
                    pass: false,
                    captcha: false
                };
                $scope.beError = false;
                $scope.emailBlur = true;
                $scope.passBlur = true;
                $scope.captchaBlur = true;
            }

            initErrorState();
            /**
             * 读取cookie,暂时不用了
             */
            // var passCheckGet = JSON.parse(StorageService.get("passCheck"));
            // if (passCheckGet && passCheckGet.key && passCheckGet.value) {
            //     $scope.remember = true;
            //     $scope.userInfo = {};
            //     $scope.userInfo.email = passCheckGet.key;
            //     $scope.userInfo.password = utils.decryptMethod(passCheckGet.key, passCheckGet.value);
            //     $scope.userInfo.captcha = '';
            // }

            // $scope.login = function () {
            //     Avt.getAvt(function (result) {
            //         if (result.success) {
            //             var type = result.data.type;
            //             // var startDateTime = new Date(result.data.startDateTime);
            //             // var systemDate = new Date();
            //             // startDateTime.setDate(startDateTime.getDate() + 30);   

            //             // var starTimeMs = startDateTime.setDate(startDateTime.getDate());
            //             // var newDateTimeMs = systemDate.getTime();

            //             // // 若使用者修改系統時間, 讓NC到期, 則顯示為expired
            //             // if(newDateTimeMs > starTimeMs){
            //             //     type = "expired";
            //             // }

            //             if (type == "expired") {
            //                 // 尚未激活已到期, 且username為admin, 導入激活頁面
            //                 if ($scope.userInfo.email == "admin") {
            //                     initErrorState();
            //                     var res = Auth.browserOs(window.navigator.userAgent);
            //                     if (res.browser.toLowerCase().indexOf('firefox') != -1) {
            //                         $scope.userInfo.password = document.querySelector('#inputPass').value;
            //                     }
            //                     console.log("browser info :" + res);

            //                     Auth.login($scope.userInfo, res, $scope.product.model, function (result) {
            //                         $scope.showAlert = false;
            //                         // initErrorState();
            //                         if (!result.success) {
            //                             if (result.error == 510) {
            //                                 $scope.showAlert = true;
            //                                 alertLogout('notice.csStop');
            //                                 // return;
            //                             } else {
            //                                 $scope.beError = true;
            //                                 $scope.$broadcast('refresh captcha');
            //                                 if (result.error == -2) {
            //                                     $scope.errors.captcha.isError = true;
            //                                 } else if (result.error == -3) {
            //                                     alert("Its privilege status is disabled!");
            //                                 } else {
            //                                     $scope.errors.user.isError = true;
            //                                 }
            //                             }

            //                         } else {
            //                             StorageService.unset('noticMsg');
            //                             $scope.loginUser = result.data;
            //                             if (result.data.originalPass && result.data.originalPass == true) {
            //                                 $scope.step = 2;

            //                                 $timeout(function () {
            //                                     document.getElementById("focusPass").focus()
            //                                 }, 100);
            //                             } else {
            //                                 Current.setUser(result.data);
            //                                 rememberPassword();
            //                                 window.location = "/#/CWM/activation";
            //                             }
            //                         }

            //                     });
            //                 } else {
            //                     $scope.errorMessage = 2;
            //                 }

            //             } else {
            //                 initErrorState();
            //                 var res = Auth.browserOs(window.navigator.userAgent);
            //                 if (res.browser.toLowerCase().indexOf('firefox') != -1) {
            //                     $scope.userInfo.password = document.querySelector('#inputPass').value;
            //                 }
            //                 console.log("browser info :" + res);

            //                 Auth.login($scope.userInfo, res, $scope.product.model, function (result) {
            //                     $scope.showAlert = false;
            //                     // initErrorState();
            //                     if (!result.success) {
            //                         if (result.error == 510) {
            //                             $scope.showAlert = true;
            //                             alertLogout('notice.csStop');
            //                             // return;
            //                         } else {
            //                             $scope.beError = true;
            //                             $scope.$broadcast('refresh captcha');
            //                             if (result.error == -2) {
            //                                 $scope.errors.captcha.isError = true;
            //                             } else if (result.error == -3) {
            //                                 alert("Its privilege status is disabled!");
            //                             } else {
            //                                 $scope.errors.user.isError = true;
            //                             }
            //                         }

            //                     } else {
            //                         StorageService.unset('noticMsg');
            //                         $scope.loginUser = result.data;
            //                         if (result.data.originalPass && result.data.originalPass == true) {
            //                             $scope.step = 2;

            //                             $timeout(function () {
            //                                 document.getElementById("focusPass").focus()
            //                             }, 100);
            //                         } else {
            //                             Current.setUser(result.data);
            //                             rememberPassword();
            //                             Auth.loadMode($scope.product.model);
            //                         }
            //                     }

            //                 });
            //             }
            //         }
            //     });

            // };
            /**
             * 按tab轉跳下一個欄位設計
             */
            // window.addEventListener("focus", function (e) {
            //     var idName = e.target;
            //     if (idName.id === "checkboxRem") {
            //         document.getElementsByClassName("rememberMe")[0].style.cssText = "text-decoration: underline;";
            //
            //     } else if (idName.id === "forGotPass") {
            //         document.getElementsByClassName("rememberMe")[0].style.cssText = "";
            //     }
            // }, true);
            // window.addEventListener("blur", function (e) {
            //     var idName = e.target;
            //     if (idName.id === "checkboxRem") {
            //         document.getElementsByClassName("rememberMe")[0].style.cssText = "";
            //
            //     }
            // }, true);

            /**
             * 记住密码，现在暂时不用了
             */
            // function rememberPassword() {
            //     // 记住密码 存储cookie
            //     if ($scope.remember) {
            //         var passCheckSet = {key: $scope.userInfo.email};
            //         passCheckSet.value = utils.encryptMethod($scope.userInfo.email, $scope.userInfo.password);
            //         StorageService.set("passCheck", JSON.stringify(passCheckSet));
            //     } else {
            //         StorageService.unset("passCheck");
            //     }
            //     ;
            // };
        }]);
});