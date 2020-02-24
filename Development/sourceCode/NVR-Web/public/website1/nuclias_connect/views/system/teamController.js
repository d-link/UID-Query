/**
 * Created by zhiyuan on 2017/12/21.
 */
define(["app"], function (app) {

    app.register.controller('teamController', function ($scope, $http, $uibModal, $state, Current, TeamService, InventoryService, globalEnum, $document, $timeout, NetworkService, TS) {

            /**
             * 修改页面和表格高度
             */
            setHeight('set-height', ['elementFlag'], 12);
            $timeout(function () {
                setGridHeight('user-grid', true);
            }, 100);

            $scope.timer = null;
            window.onresize = function () {
                setHeight('set-height', ['elementFlag'], 12);
                $timeout.cancel($scope.timer);
                $scope.timer = $timeout(function () {
                    setGridHeight('user-grid', true);
                }, 300);
            }


            $scope.showUserPrivilege = function () {
                setHeight('privilege-height', ['elementFlag'], -28);
                if($scope.curNetwork) {
                    getUsers($scope.curNetwork._id);
                }
                else {
                    getUsers();
                }
            };
            /**
             * 当前用户权限
             */
            var userInfo = Current.user();
            $scope.power = {
                isAdmin: userInfo.username == 'admin',
                isRoot: userInfo.role == 'root admin',
                isLocalAdmin: userInfo.role == 'local admin',
                isLocalUser: userInfo.role == 'local user',
                username: userInfo.username
            }

            /**
             * ui-grid表格配置信息 user
             */
            $scope.gridOptionsUser = {
                enableGridMenu: false,
                paginationPageSizes: [5, 10, 15],
                paginationPageSize: 10,
                paginationTemplate: './views/templates/gridBurster.html',
                columnDefs: [
                    {
                        field: 'username', enableHiding: false, width: "20%", sort: {
                            direction: 'asc'
                        }, displayName: TS.ts('column.userName')
                    },
                    {field: 'email', enableHiding: false, width: "20%", displayName: TS.ts('column.email')},
                    {
                        field: 'loginStatus.status', enableHiding: false,
                        width: "9%",
                        displayName: TS.ts('column.loginStatus'),
                        cellTemplate: '<a style="padding:2px;" ng-class="row.entity.loginStatus.status==\'online\'?\'online\':\'offline\'" title="{{\'common.\'+row.entity.loginStatus.status|translate}}">' +
                            '<md-icon ng-if="row.entity.manageStatus==\'managing\'&&row.entity.loginStatus.status==\'online\'" style="position:absolute;top:0;left:0;width:20px;height:20px;" md-svg-src="images/tail-spin.svg" ></md-icon><md-icon md-svg-icon="status:online_status" ></md-icon></a>'
                    },
                    {
                        field: 'role',
                        enableHiding: false,
                        width: "8%",
                        cellTemplate: '<div class="ui-grid-cell-contents">{{"team."+row.entity.role|translate}}</div>',
                        displayName: TS.ts('column.role')
                    },
                    {
                        field: 'privilegeStatus',
                        enableHiding: false,
                        width: "11%",
                        cellTemplate: '<div class="ui-grid-cell-contents" ng-if="row.entity.isNSUser&&row.entity.privilegeStatus==\'enabled\'">{{"enum.enableSSO"|translate}}</div>' +
                            '<div class="ui-grid-cell-contents" ng-if="row.entity.isNSUser&&row.entity.privilegeStatus==\'disabled\'">{{"enum.disableSSO"|translate}}</div>' +
                            '<div class="ui-grid-cell-contents" ng-if="!row.entity.isNSUser&&row.entity.privilegeStatus==\'enabled\'">{{"enum.enable"|translate}}</div>' +
                            '<div class="ui-grid-cell-contents" ng-if="!row.entity.isNSUser&&row.entity.privilegeStatus==\'disabled\'">{{"enum.disable"|translate}}</div>',
                        displayName: TS.ts('column.privilege')
                    },
                    {
                        field: 'createDate', enableHiding: false,
                        width: "13%",
                        displayName: TS.ts('column.createTime'),
                        cellFilter: 'ISOTimeFilter'
                    },
                    {
                        field: 'loginStatus.lastLogin', enableHiding: false,
                        width: "13%",
                        displayName: TS.ts('column.lastLogin'),
                        cellFilter: 'ISOTimeFilter'
                    },
                    /* {field: 'loginStatus.browser', minWidth: "160", maxWidth: "160", displayName: 'Browser'},
                     {field: 'loginStatus.os', minWidth: "120", maxWidth: "120", displayName: 'OS'},*/

                    {
                        name: TS.ts('column.action'),
                        enableColumnMenu: false,
                        cellTemplate: '<div class="ui-grid-cell-contents"> ' +
                            '<a type="button" class="btn-grid" title="{{\'column.edit\'|translate}}" ng-if="!row.entity.isNSUser&&(grid.appScope.power.isAdmin||(grid.appScope.power.isRoot&&row.entity.username!=\'admin\')||(grid.appScope.power.isLocalAdmin&&grid.appScope.power.username==row.entity.username)||(grid.appScope.power.isLocalUser&&grid.appScope.power.username==row.entity.username))"' +
                            '  ng-click="grid.appScope.openUserAddModel(row.entity)">' +
                            '<md-icon md-svg-icon="user:edit"></md-icon></a>' +
                            '<a type="button" class="btn-grid" title="{{\'column.delete\'|translate}}"  ng-if="!row.entity.isNSUser&&(grid.appScope.power.isRoot&&row.entity.username!=\'admin\'&&row.entity.username!= grid.appScope.power.username)"' +
                            '  ng-click="grid.appScope.delTeamUser(row.entity)">' +
                            '<md-icon md-svg-icon="user:remove"></md-icon></a>' +
                            '</div>',
                        minWidth: "75", enableHiding: false, enableSorting: false
                    }
                ]
            };
            if (Current.user().role != "root admin") {
                $state.go('anon.PageNotFount');
                return;
            }
            /**
             * 获取列表数据
             */
            var users = [];

            function getUsers(id) {
                TeamService.getUsers(function (result) {
                    users = result.data;
                    if (id) {
                        getPrivilegeData(id);
                    }
                    for (var i = 0; i < users.length; i++) {
                        users[i].loginStatus = {
                            status: (users[i].login && users[i].login.length > 0) ? "online" : "offline",
                            lastLogin: users[i].lastLogin
                        }
                    }


                    $scope.gridOptionsUser.data = users;

                    let online = 0;
                    let offline = 0;
                    let disabled = 0;
                    users.forEach(function (d) {
                        if (d.privilegeStatus == "disabled") {
                            disabled++;
                        }
                        //当状态为disable时，不再判断在线状态
                        else {
                            if (d.loginStatus && d.loginStatus.status == "online") {
                                online++;
                            } else {
                                offline++;
                            }
                        }
                    })
                    $scope.userStatus = {
                        online: online,
                        offline: offline,
                        disabled: disabled,
                        all: online + offline + disabled
                    };
                });
            };
            getUsers();

            $scope.$on('setUser', function () {
                getUsers();
            });
            $scope.$on('refreshTeam', function () {
                getUsers();
            })
            /**
             * 添加用户/编辑用户
             */
            $scope.openUserAddModel = function (teamUser) {
                var modalInstance = $uibModal.open({
                    backdrop: 'static',
                    animation: true,
                    keyboard: false,
                    templateUrl: 'teamUserInvite.html',
                    windowClass: 'modal-usermanage',
                    size: 'w600',
                    resolve: {
                        teamUser: function () {
                            return teamUser;
                        }
                    },
                    controller: function ($scope, $uibModalInstance, teamUser) {
                        if (teamUser) {
                            $timeout(function () {
                                var passwordHTML = document.getElementsByClassName("password")[0];
                                var usernameHTML = document.getElementsByClassName("username")[0];
                                if (teamUser.username == "admin") {
                                    passwordHTML.focus();
                                } else {
                                    usernameHTML.focus();
                                }
                            }, 0);
                            $scope.adminUser = teamUser.username == 'admin';
                            $scope.rootAdmin = userInfo.role == 'root admin';
                            $scope.isEdit = true;
                            $scope.firstEdit = true;
                            $scope.iconName = "edit";
                            $scope.title = 'userModify';
                            $scope.buttonName = "save";
                            $scope.teamUser = {
                                _id: teamUser._id,
                                username: teamUser.username,
                                password: '333333333333a', // 用于临时显示
                                email: teamUser.email,
                                role: teamUser.role,
                                privilegeStatus: teamUser.privilegeStatus,
                                address: teamUser.address,
                                phone: teamUser.phone,
                                desc: teamUser.desc
                            };
                        } else {
                            $scope.adminUser = false;
                            $scope.rootAdmin = true;
                            $scope.isEdit = false;
                            $scope.iconName = "inviteUser";
                            $scope.title = 'createUser';
                            $scope.buttonName = "create";
                            $scope.teamUser = {
                                username: '',
                                password: '',
                                email: '',
                                role: 'root admin',
                                privilegeStatus: 'enabled',
                                desc: ''
                            };
                        }

                        // 权限列表
                        $scope.roles = ['root admin', 'root user', 'local admin', 'local user', 'front desk user'];

                        // 编辑用户时 第一次输入时先清空密码
                        $scope.editPassword = function () {
                            $scope.firstEdit = false;
                            $scope.teamUser.password = '';
                        };
                        $scope.passwordKeydown = function ($event) {
                            if ($event.keyCode == 8) {
                                $event.keyCode = 0;
                                return false;
                            }
                            return true;
                        };
                        $scope.invalidName = false;
                        $scope.invalidNameMsg = "";
                        $scope.invalidEmail = false;
                        $scope.invalidEmailMsg = "";

                        $scope.usernameBlurFun = function () {
                            $scope.usernameBlur = true;
                            $scope.invalidName = false;
                        };
                        $scope.emailBlurFun = function () {
                            $scope.inviteEmailBlur = true;
                            $scope.invalidEmail = false;
                        };
                        $scope.passwordBlurFun = function () {
                            $scope.invitePasswordBlur = true;
                            $scope.invalidPassword = false;
                            $scope.passwordBlur = true
                        };
                        // 提交
                        $scope.Invite = function () {
                            $scope.inviteEmailBlur = false;
                            $scope.usernameBlur = false;
                            if ($scope.isEdit && $scope.firstEdit) {
                                // 密码是无效的数据
                                delete $scope.teamUser.password;
                            }

                            if (teamUser) {
                                // 编辑
                                if ($scope.adminUser) {
                                    // 编辑 admin用户， 验证数据，防止恶意修改页面内容
                                    $scope.teamUser.username = 'admin';
                                    $scope.teamUser.role = 'root admin';
                                    $scope.teamUser.privilegeStatus = 'enabled';
                                } else if ($scope.teamUser.username == 'admin') {
                                    $scope.teamUser.password = '333333333333'; // 用于临时显示
                                    $scope.invalidName = true;
                                    $scope.usernameBlur = true;
                                    $scope.invalidNameMsg = "team.adminValid";
                                    return;
                                }
                                TeamService.editTeam($scope.teamUser, function (data) {
                                    if (data.success == false) {
                                        if (data.error == 1) {
                                            $scope.teamUser.password = '333333333333'; // 用于临时显示
                                            $scope.invalidName = true;
                                            $scope.usernameBlur = true;
                                            $scope.invalidNameMsg = "team.nameExist";
                                            return;
                                        } else if (data.error == 2) {
                                            $scope.teamUser.password = '333333333333'; // 用于临时显示
                                            $scope.invalidEmail = true;
                                            $scope.inviteEmailBlur = true;
                                            $scope.invalidEmailMsg = "team.emailExist";
                                            return;
                                        } else if (data.error == 3) {
                                            $scope.invalidPassword = true;
                                            $scope.invitePasswordBlur = true;
                                            return;
                                        }
                                    } else {
                                        if (Current.user()._id == $scope.teamUser._id)
                                            Current.setUser($scope.teamUser);
                                    }
                                    $uibModalInstance.close();
                                });
                            } else {
                                // 添加
                                TeamService.addTeam($scope.teamUser, function (data) {
                                    if (data.success == false) {
                                        if (data.error == 1) {
                                            $scope.invalidName = true;
                                            $scope.usernameBlur = true;
                                            $scope.invalidNameMsg = "team.nameExist";
                                            return;
                                        } else if (data.error == 2) {
                                            $scope.invalidEmail = true;
                                            $scope.inviteEmailBlur = true;
                                            $scope.invalidEmailMsg = "team.emailExist";
                                            return;
                                        } else if (data.error == 3) {
                                            $scope.invalidPassword = true;
                                            $scope.invitePasswordBlur = true;
                                            return;
                                        }
                                    }
                                    $uibModalInstance.close();
                                });
                            }


                        };
                        // 取消
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                });
                modalInstance.result.then(function (data) {
                    getUsers();
                }, function () {

                });
            };
            /**
             * 删除用户
             */
            $scope.delTeamUser = function (teamUser) {
                var modalInstance = $uibModal.open({
                    backdrop: 'static',
                    animation: true,
                    keyboard: false,
                    templateUrl: './views/templates/dialogConfirm.html',
                    windowClass: 'modal-del',
                    resolve: {
                        teamUser: function () {
                            return teamUser;
                        }
                    },
                    size: "w500",
                    controller: function ($scope, $uibModalInstance, teamUser) {
                        $scope.con = {
                            title: TS.ts("team.delTitle"),
                            content: TS.ts("team.delTip"),
                            type: 'common:remove'
                        };
                        $scope.ok = function () {
                            $uibModalInstance.close(teamUser);
                        };
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                });
                modalInstance.result.then(function (teamUser) {
                    //删除
                    TeamService.delTeam(teamUser._id, function (data) {
                        getUsers();
                    });
                }, function () {

                });

            };

            /**
             * user privilege 获取左侧列表
             */
            function getList() {
                NetworkService.listShortNetworks(function (result) {
                    if (result.success) {
                        $scope.listData = result.data;
                    }
                })
            };
            getList();
            /**
             * user privilege 左侧列表操作
             */
            $scope.toggleSite = function (site) {
                $scope.siteActive = site;
            };
            $scope.changeNetwork = function (network) {
                $scope.curNetwork = network;
                //获取信息
                getUsers(network._id);
            };

            /**
             * user privilege 获取右侧数据
             */
            function getPrivilegeData(netId) {
                $scope.authorisedUsers = [];
                $scope.unauthorizedUsers = [];
                for (var i = 0; i < users.length; i++) {
                    if (users[i].role == 'root admin' || users[i].role == 'root user') {
                        // 初始在右侧切不能移动的用户
                        $scope.authorisedUsers.push(users[i]);
                        continue;
                    }
                    if (users[i].role == 'local admin' || users[i].role == 'local user' || users[i].role == 'front desk user') {
                        // 判断privilege
                        var isAdded = false;
                        for (var j = 0; j < users[i].privilege.length; j++) {
                            if (users[i].privilege[j] == netId) {
                                $scope.authorisedUsers.push(users[i]);
                                isAdded = true;
                                break;
                            }
                        }
                        if (isAdded) continue;
                        $scope.unauthorizedUsers.push(users[i]);
                    }
                }
            };
            /**
             * user privilege 右侧操作
             */
            $scope.state = {
                processing: false,
                isSuccess: false,
                isError: false
            };
            $scope.originAuthorisedUsers = $scope.authorisedUsers;
            $scope.originUnauthorizedUsers = $scope.unauthorizedUsers;
            // 添加到 Authorised Users
            $scope.addToAuthorised = function () {
                // 接口参数
                $scope.param = {
                    networkId: $scope.curNetwork._id,
                    userIdArr: [],
                    tag: 1
                };
                // 要移动的用户下标
                var addUsers = [];
                $scope.originUnauthorizedUsers = $scope.unauthorizedUsers;
                // 获取userIdArr，记录要移动的用户下标
                for (var i = 0; i < $scope.unauthorizedUsers.length; i++) {
                    if ($scope.unauthorizedUsers[i].select) {
                        addUsers.push(i);
                        $scope.param.userIdArr.push($scope.unauthorizedUsers[i]._id);
                    }
                }
                for (var j = addUsers.length - 1; j >= 0; j--) {
                    var index = addUsers[j];
                    $scope.unauthorizedUsers[index].select = false;
                    $scope.authorisedUsers.push($scope.unauthorizedUsers[index]);
                    $scope.unauthorizedUsers.splice(index, 1);
                    // 或直接更新users
                    // getUsers();
                    // getPrivilegeData($scope.curNetwork._id)
                }
            };
            // 删除从 Unauthorised Users
            $scope.addToUnauthorised = function () {
                // 接口参数
                $scope.param = {
                    networkId: $scope.curNetwork._id,
                    userIdArr: [],
                    tag: 0
                };
                // 要移动的用户下标
                var addUsers = [];
                $scope.originAuthorisedUsers = $scope.authorisedUsers;
                // 获取userIdArr，记录要移动的用户下标
                for (var i = 0; i < $scope.authorisedUsers.length; i++) {
                    if ($scope.authorisedUsers[i].unselect) {
                        addUsers.push(i);
                        $scope.param.userIdArr.push($scope.authorisedUsers[i]._id);
                    }
                }
                // 更新页面内容
                for (var j = addUsers.length - 1; j >= 0; j--) {
                    var index = addUsers[j];
                    $scope.authorisedUsers[index].unselect = false;
                    $scope.unauthorizedUsers.push($scope.authorisedUsers[index]);
                    $scope.authorisedUsers.splice(index, 1);
                    // 或直接更新users
                    // getUsers();
                    // getPrivilegeData($scope.curNetwork._id)
                }
            }
            $scope.savePrivilege = function () {
                $scope.state.processing = true;
                $scope.state.isSuccess = false;
                $scope.state.isSuccess = false;
                TeamService.editPrivilege($scope.param, function (result) {
                    $scope.state.processing = false;
                    if (result.success) {
                        // 更新页面内容
                        $scope.state.isSuccess = true;

                    } else {
                        $scope.state.isError = true;
                        $scope.authorisedUsers = $scope.originAuthorisedUsers;
                        $scope.unauthorizedUsers = $scope.originUnauthorizedUsers;
                    }
                })
            }
        }
    );
})