/**
 * Created by lizhimin on 2015/12/11.
 */

define(["controllerModule"], function (controllers) {
    controllers.controller('NavController', function ($http, $rootScope, $scope, $state, $timeout, Auth, Current, $uibModal, NetworkService, OrganizationService, moudlesService, TS) {
        $scope.trialAndActivate = false;
        $scope.auth = Auth;
        $scope.user = Current.user();
        $scope.org = Current.org();
        /* $scope.org.logo= base_url+"/customer/"+$scope.org.logo;*/
        $scope.totalCount = 0;
        $scope.notifications = {Critical: 0, Warning: 0, Info: 0};
        $scope.hasPrivilege = Current.user().role == "root admin";
        $scope.trialAdmin = true;
        $scope.trialNoneAdmin = false;
        $scope.trialLastDayAdmin = false;
        $scope.trialLastDayNoneAdmin = false;
        // $timeout(function () {
        //     let isMac = /macintosh|mac os x/i.test(navigator.userAgent); //苹果
        //     if (isMac) {
        //         var el = document.getElementsByClassName('navbar-static-top')[0];
        //         el.style.display = "flow-root";
        //         //alert("111");
        //     }
        // })
        //查询ntp的状态判断是否显示弹窗
        OrganizationService.getSystemStatus(function (result) {
            if (result.success) {
                NTPStatus = result.data.ntpStatus;
                SDStatus = result.data.sdStatus;
                $scope.NTPStatus = NTPStatus;
                $scope.SDStatus = SDStatus;
                showWindow(NTPStatus, SDStatus);
                //showWindow(1, 1);
            } else {

            }

        });

        function showWindow(NTPStatus, SDStatus) {
            //弹窗
            if (NTPStatus != undefined && SDStatus != undefined) {
                if (NTPStatus == 0 || SDStatus != 1) {
                    var modalInstance = $uibModal.open({
                        backdrop: 'static',
                        animation: true,
                        keyboard: false,
                        templateUrl: './views/templates/dialogAlert.html',
                        windowClass: 'modal-del',
                        resolve: {
                            NTPStatus: NTPStatus,
                            SDStatus: SDStatus
                        },
                        size: "w600",
                        controller: function ($scope, $uibModalInstance, NTPStatus, SDStatus) {
                            $scope.con = {
                                title: TS.ts("common.warning") + "   " + TS.ts("column.message"),
                                type: 'modal:block',
                                style: false
                            };
                            if (NTPStatus == 0 && SDStatus == 1) {
                                $scope.con.content = TS.ts("nav.ntpStatusError");
                                //$scope.con.content1 = "a";
                            } else if (NTPStatus == 1 && SDStatus == 0) {
                                $scope.con.content = TS.ts("nav.sdStatusError");
                                $scope.con.style = true;
                                //$scope.con.content1 = "a";
                            } else if (NTPStatus == 1 && SDStatus == 2) {
                                $scope.con.content = TS.ts("nav.sdStatusError2");
                                //$scope.con.content1 = "a";
                            } else if (NTPStatus == 0 && SDStatus == 0) {
                                $scope.con.content1 = TS.ts("nav.ntpStatusError");
                                $scope.con.content2 = TS.ts("nav.sdStatusError");
                            } else if (NTPStatus == 0 && SDStatus == 2) {
                                $scope.con.content1 = TS.ts("nav.ntpStatusError");
                                $scope.con.content2 = TS.ts("nav.sdStatusError2");
                            } else if (NTPStatus == 2 && SDStatus == 0) {
                                $scope.con.content1 = TS.ts("nav.sdStatusError");
                                $scope.con.style = true;
                                //$scope.con.content1 = "a";
                            } else if (NTPStatus == 2 && SDStatus == 2) {
                                $scope.con.content = TS.ts("nav.sdStatusError2");
                                //$scope.con.content1 = "a";
                            }


                            $scope.ok = function () {
                                $uibModalInstance.close();
                            };
                            setTimeout(function () {
                                if ($scope.con.style) {
                                    document.getElementById("dialog_icon").style.padding = "10px";
                                }
                            }, 0);
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                        }
                    });
                }
            }
        }


        $scope.showGuide = function () {
            NetworkService.listAllNetworks(function (result) {
                if (result && result.data) {
                    var networks = result.data;
                    var modalInstance = $uibModal.open({
                        backdrop: 'static',
                        animation: true,
                        keyboard: false,
                        templateUrl: './views/configuration/addNetwork.html',
                        size: 'w800',
                        windowClass: 'cwmAddNetwork',
                        resolve: {
                            tag: 0,
                            secondaryTime: false,
                            network: null
                        },
                        controller: 'addNetworkController'
                    });
                    modalInstance.result.then(function (data) {
                        $state.go('user.org.subdetail', {moudleId: 'network', parentId: 'configuration'});
                        moudlesService.showMenu('network');
                    }, function (data) {
                        $state.go('user.org.subdetail', {moudleId: 'network', parentId: 'configuration'});
                        moudlesService.showMenu('network');
                    });
                }
            });

        };

        /*     function refreshNotification() {
         OrganizationService.getNotificationCount(function (result) {
         if (result.success) {
         $scope.totalCount = 0;
         result.data.forEach(function (_rs) {
         $scope.totalCount += _rs.count;
         $scope.notifications[_rs._id] = _rs.count;
         });
         }
         $timeout(refreshNotification, 60000);
         });
         }


         refreshNotification();*/
        $scope.changeLang = function (flag) {

            $scope.changeLanguage(flag);
        };

        var getUserInfo = function () {
            Auth.getUserInfo({_id: $scope.user._id}, function (result) {
                if (result.success) {
                    Current.setUser(result.data);
                    $scope.user = Current.user();
                    //这个地方是为了解决cli改变图标，及时刷新的问题，重新取一遍，但是因为这个地方
                    //重新登录进来的时候会改变数值
                    OrganizationService.listAllOrgs(function (orgs) {
                        if (orgs && orgs.length > 0) {
                            var org = orgs[0];
                            org.orgId = org._id;
                            if ($scope.org && $scope.org.logo) {
                                org.logo = $scope.org.logo;
                            }
                            Current.setOrg(org);
                            $scope.org = Current.org();
                        } else {
                            $scope.org = Current.org();
                        }
                    });
                }
            }, function (err) {
            });
        };
        getUserInfo();
        $scope.$on('current org changed', function () {
            $scope.org = Current.org();
        });
        $scope.userProfile = function () {
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                keyboard: false,
                templateUrl: './views/templates/userProfile.html',
                controller: "userProfileController",
                size: "w800",
                windowClass: 'modal-userprofile'
                /*  resolve: {
                 user: function () {
                 return $scope.user();
                 }
                 }*/
            });
            modalInstance.result.then(function (user) {

            }, function () {

            });
        };
        $scope.logout = function () {
            Auth.logout(function () {
                //  $state.go('anon.user.login');
                window.location = "/";
            }, function () {
                window.location = "/";
                //   $state.go('anon.user.login');
            });
        };
        $scope.changeMenu = function () {
            $scope.$emit('hide', null);
        };
        $scope.showMenu = function () {
            $scope.$emit('hide', false);
        };
        $scope.hideMenu = function () {
            if ($scope.isHided) {
                $scope.$emit('hide', true);
            }

        };
    });

    controllers.controller("userProfileController", function ($scope, $http, $uibModalInstance, ajaxService, Current, Auth, $timeout, Upload) {

        //  $scope.All={isType:false,isTag:false};

        $scope.user = Current.user();

        $scope.userCopy = angular.copy($scope.user);
        if (!$scope.user.photo) {
            $scope.user.photo = '/public/images/default-user.png';
        }

        $scope.photoFile = null;
        $scope.security = {};

        function initErrorState() {
            $scope.state = {
                pass: {
                    isSuccess: false,
                    isError: false,
                    processing: false,
                    msgTrue: 'nav.passModifyOK',
                    msgFalse: 'nav.passError'
                },
                baseInfo: {
                    isSuccess: false,
                    isError: false,
                    processing: false,
                    msgTrue: 'nav.baseInfoOK',
                    msgFalse: 'nav.baseInfoError'
                },
                email: {
                    isSuccess: false,
                    isError: false,
                    processing: false,
                    msgTrue: 'nav.emailOK',
                    msgFalse: 'nav.emailError'
                }
            };
        };
        initErrorState();

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
        $scope.updateInfo = function () {
            initErrorState();
            $scope.state.baseInfo.processing = true;
            var temp = {
                _id: $scope.user._id,
                username: $scope.userCopy.username,
                desc: $scope.userCopy.desc,
                phone: $scope.userCopy.phone,
                address: $scope.userCopy.address
            };
            Auth.update(temp, function (result) {
                $scope.state.baseInfo.processing = false;
                if (result.success) {
                    $scope.state.baseInfo.isSuccess = true;
                    $scope.user.username = $scope.userCopy.username;
                    $scope.user.desc = $scope.userCopy.desc;
                    $scope.user.phone = $scope.userCopy.phone;
                    $scope.user.address = $scope.userCopy.address;
                    Current.setUser($scope.user);
                    //   $scope.user = Current.user();
                    $scope.userCopy = angular.copy($scope.user);
                } else {
                    // 上传失败
                }
                $timeout(function () {
                    $scope.state.baseInfo.isSuccess = false;
                    $scope.state.baseInfo.isError = false;
                }, 5000);
            }, function () {
            })
        };
        $scope.new = {newPassBlur: false};
        $scope.newPassBlurFunction = function () {
            $scope.new.newPassBlur = true;
        }
        $scope.changePassword = function () {
            initErrorState();
            $scope.state.pass.processing = true;
            var temp = {
                userId: $scope.user._id,
                oldpass: $scope.security.oldpass,
                newpass: $scope.security.newpass
            };

            Auth.changePass(temp, function (result) {
                $scope.state.pass.processing = false;
                if (result.success) {
                    $scope.resetPass();
                    $scope.state.pass.isSuccess = true;
                    $scope.new.newPassBlur = false;
                    Current.setUser($scope.user);
                } else {
                    if (result.error == 2) { // 密码错误
                        $scope.state.pass.isError = true;

                    }
                }
                $timeout(function () {
                    $scope.state.pass.isSuccess = false;
                    $scope.state.pass.isError = false;
                }, 5000);
            }, function () {
            })
        };
        $scope.resetPass = function () {
            $scope.security = {};
            initErrorState();
        };
        $scope.changeEmail = function () {
            initErrorState();
            $scope.state.email.processing = true;
            var temp = {
                userId: $scope.user._id,
                email: $scope.userCopy.email
            };
            Auth.changeEmail(temp, function (result) {
                $scope.state.email.processing = false;
                if (result.success) {
                    $scope.user.email = temp.email;
                    Current.setUser($scope.user);
                    $scope.state.email.isSuccess = true;
                    $scope.userCopy = angular.copy($scope.user);
                } else {
                    $scope.state.email.isError = true;
                    $scope.state.email.msgFalse = "Email is exists!";
                }
                $timeout(function () {
                    $scope.state.email.isSuccess = false;
                    $scope.state.email.isError = false;
                }, 5000);
            }, function () {

            });
            $scope.userCopy = angular.copy($scope.user);

        };
        $scope.changePhoto = function () {
            if ($scope.photoFile && $scope.photoFile.length > 0) {
                Upload.upload({
                    url: base_url + '/user/changePhoto',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    data: {type: 'user', userId: $scope.user._id},
                    file: $scope.photoFile[0]
                }).then(function (response) {
                    var result = response.data;
                    ajaxService.updateToken(response.headers);
                    $timeout(function () {
                        if (result.success) {
                            $scope.user.photo = root_url + result.data + "?t=" + Math.ceil(Math.random() * 10);
                        }
                    });
                }, function (response) {
                    /* if (response.status > 0)
                     $scope.errorMsg = response.status + ': ' + response.data;*/
                }, function (evt) {
                    // Math.min is to fix IE which reports 200% sometimes
                    // file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                });
            }
            $scope.photoFile = null;
        };
        $scope.changeCancel = function () {
            $scope.photoFile = null;
        };

        $scope.$watch('photoFile', function (files) {
            if (files != null) {
                if (!angular.isArray(files)) {
                    $timeout(function () {
                        $scope.photoFile = [files];
                    });
                }
            }
        });

    });


    controllers.directive('navHeader', function () {
        return {
            scope: false,
            restrict: 'A',
            controller: 'NavController',
            templateUrl: './views/templates/nav.html'
        };
    });
});