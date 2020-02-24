/**
 * Created by chencheng on 17-11-14.
 */
define(["app"], function (app) {

    app.register.controller('frontdeskController', function ($scope, $state, $timeout, $uibModal, FrontdeskService, NetworkService, StorageService, $localStorage, $sessionStorage, Current, Auth, TS) {
        $scope.user = Current.user();
        $scope.changeLang = function (flag) {

            $scope.changeLanguage(flag);
        }

        function detectIE() {
            var ua = window.navigator.userAgent;
            var msie = ua.indexOf('MSIE ');
            if (msie > 0) {
                // IE 10 or older => return version number
                return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
            }

            var trident = ua.indexOf('Trident/');
            if (trident > 0) {
                // IE 11 => return version number
                var rv = ua.indexOf('rv:');
                return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
            }

            var edge = ua.indexOf('Edge/');
            if (edge > 0) {
                // Edge (IE 12+) => return version number
                return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
            }

            return false;
        }

        $scope.isEDGE = detectIE();
        setHeight(); //test
        // 打印模版页面url
        var url = $state.href('printPreview');
        $scope.frameName = "";
        // netwrok 列表
        $scope.networkList = [];
        $scope.groups = [{_id: '', name: 'frontdesk.allGroup'}]
        NetworkService.listNetworks(function (result) {
            if (result.success) {
                var data = result.data;
                $scope.networkList = angular.copy(data);
                // serach passcode 中 group列表
                data.forEach(function (d) {
                    $scope.groups.push({_id: d._id, name: d.name, uuid: d.agentUUID})
                });
            }
        })
        // network下的功能列表
        $scope.netFun = ['generatePasscode', 'viewEditDelete'];
        $localStorage.printData = '';
        $localStorage.isPrint = false;
        // 左侧导航功能
        $scope.toggleNetwork = function (n) {
            $scope.networkActive = n;
            $scope.viewChoice('generatePasscode');
        };

        $scope.passcodeEditStatus = false;
        $scope.viewChoice = function (sub, data) {
            $scope.subChoice = sub;
            $scope.passcodeEditStatus = !!data;
            $scope.passcodeIsDisabled = true;
            $scope.passcodeSelected = [];
            if (sub == 'search') {
                $scope.networkActive = '';
                // 初始化数据
                $scope.searchParam = {
                    paypalAccount: '',
                    purchaseStation: '',
                    purchaseTime: '',
                    activeTime: '',
                    ssid: '',
                    group: $scope.groups[0]
                };
                // 初始化时间控件
                resetPurchaseDate();
                resetActiveDate();
                $timeout(function () {
                    setGridHeight('searchList', true, 220);
                    $scope.search();
                }, 100);


            }

            if (sub == 'viewEditDelete') {
                $scope.findPasscode();
                $timeout(function () {
                    setGridHeight('passcodeList', true, 88);
                }, 100);
            }

            if (sub == 'generatePasscode') {
                $scope.state.processing = false;
                $scope.state.isSuccess = false;
                $scope.state.isError = false;

                // 在iframe中打开需要打印的页面
                //window.open(url, 'myFrameName'); //
                // 初始化数据
                var startDay = new Date();
                startDay.setDate(startDay.getDate() + 3);

                $scope.passcodeInfo = {
                    passcodeQuantity: 1,
                    durationView: 24,
                    lastActiveTime: getDayStr(startDay),
                    connectionLimit: 3,
                    durationType: 'unitHour'
                };
                if (data) {
                    if (data._id) $scope.passcodeInfo._id = data._id;
                    $scope.passcodeInfo.ssid = {ssid: data.ssid};
                    $scope.passcodeInfo.durationView = data.durationView;
                    $scope.passcodeInfo.durationType = data.durationType;
                    $scope.passcodeInfo.passcode = data.passcode;
                    $scope.passcodeInfo.lastActiveTime = data.lastActiveTime;
                    $scope.passcodeInfo.connectionLimit = data.connectionLimit;
                    delete $scope.passcodeInfo.passcodeQuantity;
                }
                // 初始化时间控件
                resetLastDate();
                getSSIDByUUID();

            }
        };

        $scope.reset = function (user) {
            $scope.user = user;
        };

        $scope.durationTypes = ['unitMin', 'unitHour', 'unitDay'];
        // generate passcode 固定参数方法
        // $scope.ssids = ['primary', 'ssid1', 'ssid2', 'ssid3', 'ssid4', 'ssid5', 'ssid6', 'ssid7'];

        function getSSIDByUUID() {
            // 获取ssid列表
            FrontdeskService.getSSIDByUUID({uuid: $scope.networkActive.agentUUID}, function (result) {
                if (result.success && result.data) {
                    $scope.ssids = [];
                    for (var i = 0; i < result.data.length; i++) {
                        if (!_.find($scope.ssids, function (item) {
                            return item.ssid == result.data[i].ssid;
                        })) {
                            $scope.ssids.push(result.data[i]);
                        }
                    }
                    //$scope.ssids = result.data;
                    if (!$scope.passcodeInfo.ssid)
                        $scope.passcodeInfo.ssid = $scope.ssids[0] || '';
                }
            })
        }

        $scope.generate = function (passcodeInfo) {
            if (!passcodeInfo.ssid) {
                return;
            }
            var param = angular.copy(passcodeInfo);
            param.uuid = $scope.networkActive.agentUUID;
            param.ssid = passcodeInfo.ssid.ssid;
            param.lastActiveTime = kalendaeDate.lastActiveTime[0].getTime() + 86400 * 1000 - 1;

            var oneDay = 60 * 24;
            var oneHour = 60;
            if (passcodeInfo.durationType == 'unitDay') {
                param.duration = oneDay * passcodeInfo.durationView;
            } else if (passcodeInfo.durationType == 'unitHour') {
                param.duration = oneHour * passcodeInfo.durationView;
            } else {
                param.duration = passcodeInfo.durationView;
            }
            param.durationType = passcodeInfo.durationType;

            FrontdeskService.createPassCode(param, function (result) {
                if (result.success) {
                    $scope.viewChoice('viewEditDelete');
                }
            });
        };
        $scope.state = {
            msgTrue: 'settings.saveOK',
            msgFalse: TS.ts('frontdesk.passcodeExist'),
            isSuccess: false,
            isError: false,
            processing: false
        }
        $scope.updatePassCode = function (passcodeInfo) {

            $scope.state.processing = true;
            $scope.state.isSuccess = false;
            $scope.state.isError = false;

            var param = angular.copy(passcodeInfo);
            param.uuid = $scope.networkActive.agentUUID;
            param.ssid = passcodeInfo.ssid.ssid;
            param.lastActiveTime = kalendaeDate.lastActiveTime[0].getTime() + 86400 * 1000 - 1;

            var oneDay = 60 * 24;
            var oneHour = 60;
            if (passcodeInfo.durationType == 'unitDay') {
                param.duration = oneDay * passcodeInfo.durationView;
            } else if (passcodeInfo.durationType == 'unitHour') {
                param.duration = oneHour * passcodeInfo.durationView;
            } else {
                param.duration = passcodeInfo.durationView;
            }
            param.durationType = passcodeInfo.durationType;

            var testPasscode = {passcode: param.passcode};
            if ($scope.editing != param.passcode) {
                FrontdeskService.passcodeIsExist(testPasscode, function (result) {
                    if (result.success && result.exist) {
                        $scope.state.processing = false;
                        $scope.state.isError = true;
                    } else {
                        updatePassCode(param)
                    }
                })
            } else {
                updatePassCode(param)
            }
        };

        function updatePassCode(param) {
            FrontdeskService.updatePassCode(param, function (result) {
                if (result.success) {
                    $scope.viewChoice('viewEditDelete')
                }
            });
        }

        //打印
        $scope.generatePrint = function (passcodeInfo) {
            var param = angular.copy(passcodeInfo);
            param.uuid = $scope.networkActive.agentUUID;
            param.ssid = passcodeInfo.ssid.ssid;
            param.lastActiveTime = kalendaeDate.lastActiveTime[0].getTime() + 86400 * 1000 - 1;

            var oneDay = 60 * 24;
            var oneHour = 60;
            if (passcodeInfo.durationType == 'unitDay') {
                param.duration = oneDay * passcodeInfo.durationView;
            } else if (passcodeInfo.durationType == 'unitHour') {
                param.duration = oneHour * passcodeInfo.durationView;
            } else {
                param.duration = passcodeInfo.durationView;
            }
            param.durationType = passcodeInfo.durationType;

            FrontdeskService.createPassCode(param, function (result) {
                if (result.success) {
                    param.lastActiveTime = getDayStr(new Date(param.lastActiveTime));
                    var printData = [];
                    for (var i = 0; i < result.passCode.length; i++) {
                        var item = angular.copy(param);
                        item.passcode = result.passCode[i];
                        item.duration = item.durationView + " " + TS.ts('passcode.' + item.durationType);
                        printData.push(item);
                    }
                    $localStorage.printData = printData;
                    $localStorage.isPrint = true;
                    // 获取打印页面并挂起打印机
                    var stamp = parseInt(Math.random() * 1000);
                    $scope.frameName = 'myFrameName' + stamp;
                    $timeout(function () {
                        var newWin = window.open(url, "'" + $scope.frameName + "'");

                        function print() {
                            if (newWin.status == "ready to print") {
                                newWin.document.close();
                                newWin.print();
                                newWin.close();
                            } else {
                                $timeout(function () {
                                    print();
                                }, 100);
                            }
                        }

                        if (!$scope.isEDGE) {
                            if (newWin) {
                                if (newWin.addEventListener) {
                                    newWin.addEventListener("load", function () {
                                        print();
                                    }, true);
                                } else if (newWin.attachEvent) {
                                    newWin.attachEvent("onload", function () {
                                        print();
                                    });
                                }
                            }
                        }

                    }, 200);

                }
            });
            //	FrontdeskService.Generate({},function (result) {});
        };

        // 需要从后台获取模版
        var htmlText = '';
        $scope.editTemplate = function () {
            var editor;
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: 'editFD.html',
                size: "w700",
                controller: function ($scope, $uibModalInstance, $timeout) {
                    $scope.ok = function () {
                        htmlText = editor.txt.html();
                        $uibModalInstance.close(htmlText);
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                },
            });
            modalInstance.opened.then(function () {
                var param = {
                    filePath: './customer/fdcfig.js'
                };
                FrontdeskService.readFdConfig(param, function (result) {
                    if (result.success) {
                        htmlText = result.data;
                    } else {
                        htmlText = '<table align="center" border="0" cellpadding="0" cellspacing="0" class="printTable">' +
                            '<tbody><tr><td>SSID</td><td>%ssid%</td></tr><tr><td>Passcode</td><td>%passcode%</td></tr><tr><td>Duration</td><td>%duration%</td></tr><tr><td>Last Active Day</td><td>%lastActiveTime%</td>' +
                            '</tr><tr><td>User Limit</td><td>%connectionLimit%</td></tr></tbody></table>';
                    }
                    require(['../public/vendor/wangEditor/release/wangEditor.min'], function (E) {
                        editor = new E('#editor');
                        editor.create();
                        editor.txt.html(htmlText)
                    });
                });

                // require.config({
                // 	paths: {
                // 		wangEditor: 'https://unpkg.com/wangeditor/release/wangEditor.min'
                // 	}
                // });
                // 依赖jq
                // var E = window.wangEditor
                // var editor = new E('#editor')
                // // 或者 var editor = new E( document.getElementById('#editor') )
                // editor.create()
            });
            modalInstance.result.then(function (data) {
                // 上传模版
                var param = {
                    filePath: './customer/fdcfig.js',
                    data: data
                };
                FrontdeskService.writeFdConfig(param, function (result) {
                    $localStorage.htmlText = data;
                });
            }, function () {

            });
        };
        //打印预览
        $scope.printPreview = function (passcodeInfo) {
            var param = angular.copy(passcodeInfo);
            param.uuid = $scope.networkActive.agentUUID;
            param.ssid = passcodeInfo.ssid.ssid;
            param.lastActiveTime = kalendaeDate.lastActiveTime[0].getTime() + 86400 * 1000 - 1;

            var oneDay = 60 * 24;
            var oneHour = 60;
            if (passcodeInfo.durationType == 'unitDay') {
                param.duration = oneDay * passcodeInfo.durationView;
            } else if (passcodeInfo.durationType == 'unitHour') {
                param.duration = oneHour * passcodeInfo.durationView;
            } else {
                param.duration = passcodeInfo.durationView;
            }
            param.durationType = passcodeInfo.durationType;
            param.lastActiveTime = getDayStr(new Date(param.lastActiveTime));
            var printData = [];
            var item = angular.copy(param);
            item.passcode = "";
            item.duration = item.durationView + " " + TS.ts('passcode.' + item.durationType);
            printData.push(item);
            $localStorage.printData = printData;
            $localStorage.isPrint = false;
            var stamp = parseInt(Math.random() * 1000);
            $scope.frameName = 'myFrameName' + stamp;
            $timeout(function () {
                window.open(url, "'" + $scope.frameName + "'");
            }, 200);
            //  window.open(url, '_blank');
        };

        $scope.findPasscode = function () {
            var param = {
                uuid: $scope.networkActive.agentUUID
            };
            var oneDay = 60 * 24;
            var oneHour = 60;
            FrontdeskService.findPasscode(param, function (result) {
                    if (result.success) {
                        for (var i = 0; i < result.data.length; i++) {
                            var item = result.data[i];

                            if (item.durationType == 'unitDay') {
                                item.durationView = item.duration / oneDay;
                            } else if (item.durationType == 'unitHour') {
                                item.durationView = item.duration / oneHour;
                            } else {
                                item.durationView = item.duration;
                            }

                            if (item.status == "active") {
                                item.title = "Active";

                                item.remainning = "";
                                var day = parseInt(item.remain / (24 * 3600 * 1000));
                                var hour = parseInt((item.remain - day * 24 * 3600 * 1000) / (3600 * 1000));
                                var minute = parseInt((item.remain - day * 24 * 3600 * 1000 - hour * 3600 * 1000) / (60 * 1000));
                                if (day > 0) {
                                    item.remainning += day + " " + TS.ts('passcode.unitDay');
                                }
                                if (hour > 0) {
                                    item.remainning += " " + hour + " " + TS.ts('passcode.unitHour');
                                }
                                if (minute > 0) {
                                    item.remainning += " " + minute + " " + TS.ts('passcode.unitMin');
                                }

                            } else if (item.status == "usedOut") {
                                item.title = "Used Out";
                                item.remainning = "0 " + TS.ts('passcode.unitHour');
                            } else if (item.status == "overdue") {
                                item.title = "Overdue";
                                item.remainning = "0 " + TS.ts('passcode.unitHour');
                            } else if (item.status == "inactive") {
                                item.title = "Ready to active";
                                item.remainning = item.durationView + " " + TS.ts('passcode.' + item.durationType);
                            }

                        }
                        $scope.passcodeListOptions.data = result.data;
                    }
                }
            );
        };

        // search passcode
        $scope.search = function () {
            var searchParam = angular.copy($scope.searchParam);
            if ($scope.searchParam.group.uuid)
                searchParam.uuid = $scope.searchParam.group.uuid;

            if (kalendaeDate.activeTime) {
                searchParam.activeTime = kalendaeDate.activeTime[0];
            }
            if (kalendaeDate.purchaseTime) {
                searchParam.purchaseTime = kalendaeDate.purchaseTime[0];
            }
            delete searchParam.group;

            FrontdeskService.findPasscode(searchParam, function (result) {
                if (result.success) {
                    var current = new Date().getTime();
                    var list = [];
                    var oneDay = 60 * 24;
                    var oneHour = 60;
                    for (var i = 0; i < result.data.length; i++) {
                        var item = result.data[i];
                        list.push(item.passcode);

                        if (item.durationType == 'unitDay') {
                            item.durationView = item.duration / oneDay;
                        } else if (item.durationType == 'unitHour') {
                            item.durationView = item.duration / oneHour;
                        } else {
                            item.durationView = item.duration;
                        }

                        if (item.status == "active") {
                            item.title = "Active";

                            item.remainning = "";
                            var day = parseInt(item.remain / (24 * 3600 * 1000));
                            var hour = parseInt((item.remain - day * 24 * 3600 * 1000) / (3600 * 1000));
                            var minute = parseInt((item.remain - day * 24 * 3600 * 1000 - hour * 3600 * 1000) / (60 * 1000));
                            if (day > 0) {
                                item.remainning += day + " " + TS.ts('passcode.unitDay');
                            }
                            if (hour > 0) {
                                item.remainning += " " + hour + " " + TS.ts('passcode.unitHour');
                            }
                            if (minute > 0) {
                                item.remainning += " " + minute + " " + TS.ts('passcode.unitMin');
                            }

                        } else if (item.status == "usedOut") {
                            item.title = "Used Out";
                            item.remainning = "0 " + TS.ts('passcode.unitHour');
                        } else if (item.status == "overdue") {
                            item.title = "Overdue";
                            item.remainning = "0 " + TS.ts('passcode.unitHour');
                        } else if (item.status == "inactive") {
                            item.title = "Ready to active";
                            item.remainning = item.durationView + " " + TS.ts('passcode.' + item.durationType);
                        }

                    }
                    $scope.searchPasscodeOptions.data = result.data;
                    /* FrontdeskService.findOrdersByPasscode(list, function (result1) {
                     if (result1.success) {
                     for (var i = 0; i < result.data.length; i++) {
                     var item = result.data[i];
                     var find = _.find(result1.data, function (item1) {
                     return item.passcode == item1.passcode;
                     });
                     if (find) {
                     item.purchaseStation = find.purchaseStation;
                     item.purchaseTime = find.purchaseTime;
                     item.PayerID = find.PayerID;
                     }
                     }
                     }
                     $scope.searchPasscodeOptions.data = result.data;
                     });
                     */
                }
            });
        };

        $scope.dateKeydown = function ($event, type) {
            var re = /(Backspace)/;
            if (!re.test($event.key)) {
                $event.preventDefault();
            } else {
                $event.srcElement.value = "";
                kalendaeDate[type] = '';
                $event.preventDefault();
            }
            ;
        };
        $scope.showCalendae = function (tag) {
            if (tag == 'last') {
                document.getElementById('kalendae_last').focus();
            } else if (tag == 'purchase') {
                document.getElementById('kalendae_purchase').focus();
            } else {
                document.getElementById('kalendae_active').focus();
            }
        }
        // 日历控件
        var kalendae = {},
            kalendaeDate = {};

        function resetLastDate() {
            $timeout(function () {
                kalendae.k1 = new Kalendae.Input('kalendae_last', {
                    months: 1,
                    direction: 'future',
                    mode: 'single',
                    format: 'YYYY-MM-DD',
                    closeButton: false,
                    customBtnId: 'btnId',
                    offsetTop: 1,
                    offsetLeft: 1,
                    // viewStartDate: string
                    subscribe: {
                        'change': function (date) {
                            kalendaeDate.lastActiveTime = this.getSelectedAsDates();
                            this.hide();
                        }
                    }
                });
            }, 10);
        };

        function resetPurchaseDate() {
            kalendae.k2 = null;
            $timeout(function () {
                kalendae.k2 = new Kalendae.Input('kalendae_purchase', {
                    months: 1,
                    // direction: 'today-future',
                    mode: 'single',
                    format: 'YYYY.MM.DD',
                    closeButton: false,
                    customBtnId: 'btnId1',
                    offsetTop: 1,
                    offsetLeft: 1,
                    // viewStartDate: string
                    subscribe: {
                        'change': function (date) {
                            kalendaeDate.purchaseTime = this.getSelectedAsDates();
                            this.hide();
                        }
                    }
                });
                kalendaeDate.purchaseTime = kalendae.k2.getSelectedAsDates();
            }, 10);
        };

        function resetActiveDate() {
            kalendae.k3 = null;
            $timeout(function () {
                kalendae.k3 = new Kalendae.Input('kalendae_active', {
                    months: 1,
                    // direction: 'today-future',
                    mode: 'single',
                    format: 'YYYY.MM.DD',
                    closeButton: false,
                    customBtnId: 'btnId2',
                    offsetTop: 1,
                    offsetLeft: 1,
                    // viewStartDate: string
                    subscribe: {
                        'change': function (date) {
                            kalendaeDate.activeTime = this.getSelectedAsDates();
                            this.hide();
                        }
                    }
                });
                kalendaeDate.activeTime = kalendae.k3.getSelectedAsDates();
            }, 10);
        };

        // passcode list 列表参数
        $scope.passcodeIsDisabled = true;
        $scope.passcodeSelected = [];
        $scope.passcodeListOptions = {
            paginationPageSizes: [10, 15, 20],
            paginationPageSize: 15,
            enableRowSelection: true,
            selectionRowHeaderWidth: 40,
            rowHeight: 40,
            paginationTemplate: './views/templates/gridBurster.html',
            columnDefs: [
                {field: 'passcode', enableHiding: false, width: "100", displayName: TS.ts('column.passcode')},
                {field: 'ssid', enableHiding: false, width: "100", displayName: TS.ts('column.ssid')},
                {
                    field: 'durationView', enableHiding: false, width: "100", displayName: TS.ts('column.duration'),
                    cellTemplate: "<div class='ui-grid-cell-contents'>{{row.entity.durationView}}&nbsp{{'passcode.'+row.entity.durationType|translate}}</div>"
                },
                {
                    field: 'connectionLimit', enableHiding: false, width: "100", displayName: TS.ts('column.userLimit'),
                    cellTemplate: "<div class='ui-grid-cell-contents'>{{row.entity.clientMacAddressList.length}}/{{row.entity.connectionLimit}}</div>"
                },
                {
                    field: 'lastActiveTime', enableHiding: false,
                    width: "140",
                    displayName: TS.ts('column.lastActive'),
                    cellFilter: 'date:"yyyy-MM-dd HH:mm:ss"'//是一个时间戳
                },
                {
                    field: 'remainning', enableHiding: false, width: "150", displayName: TS.ts('column.durationRemain')
                },
                {field: 'creator', enableHiding: false, width: "100", displayName: TS.ts('column.creator')},
                {
                    name: 'status', width: "100", displayName: TS.ts('column.status'), enableHiding: false,
                    cellTemplate: '<a  ng-class="grid.appScope.classPasscode(row.entity)" title="{{row.entity.title}}"><md-icon md-svg-icon="status:online_status" ></md-icon></a>'
                },
                {
                    name: 'edit', displayName: TS.ts('column.edit'),
                    width: "70",
                    enableSorting: false, enableColumnMenu: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><a ng-if='grid.appScope.hasEdit(row.entity)' class='btn-grid'  ng-click='grid.appScope.editPasscode(row.entity)'><md-icon md-svg-icon='user:edit'></md-icon></a></div>"
                },
                {
                    name: 'delete', displayName: TS.ts('column.delete'),
                    width: "70",
                    enableSorting: false, enableColumnMenu: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><a class='btn-grid' ng-click='grid.appScope.removePasscode(row.entity)'><md-icon md-svg-icon='user:remove'></md-icon></a></div>"
                },
                {
                    field: 'print', displayName: TS.ts('column.print'),
                    width: "60", enableColumnMenu: false, enableSorting: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><a class='btn-grid' ng-click='grid.appScope.printPasscode(row.entity)'><md-icon md-svg-src='images/common/printer.svg'></md-icon></a></div>"
                }
            ],
            data: []
        };
        $scope.passcodeListOptions.onRegisterApi = function (gridApi) {
            $scope.passcodeApi = gridApi;
            gridApi.selection.on.rowSelectionChangedBatch($scope, function (rows) {
                passcodeSelect();
            });
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                passcodeSelect();
            });
        };

        function passcodeSelect() {
            if ($scope.passcodeApi.selection) {
                $scope.passcodeSelected = $scope.passcodeApi.selection.getSelectedRows();
                if ($scope.passcodeSelected.length > 0) {
                    $scope.passcodeIsDisabled = false;
                } else {
                    $scope.passcodeIsDisabled = true;
                }
            }
        };

        // passcode list 列表参数
        $scope.searchPasscodeOptions = {
            paginationPageSizes: [10, 15, 20],
            paginationPageSize: 15,
            enableRowSelection: true,
            selectionRowHeaderWidth: 40,
            rowHeight: 40,
            paginationTemplate: './views/templates/gridBurster.html',
            columnDefs: [
                {field: 'passcode', width: "100", displayName: TS.ts('column.passcode'), enableHiding: false},
                {field: 'ssid', width: "100", displayName: TS.ts('column.ssid'), enableHiding: false,},
                {
                    field: 'durationView', width: "120", displayName: TS.ts('column.duration'), enableHiding: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'>{{row.entity.durationView}}&nbsp{{'passcode.'+row.entity.durationType|translate}}</div>"
                },
                {
                    field: 'purchaseStation',
                    enableHiding: false,
                    width: "130",
                    displayName: TS.ts('frontdesk.purchaseStat')
                },
                {field: 'PayerID', enableHiding: false, width: "130", displayName: TS.ts('frontdesk.paypalAccount')},
                {
                    field: 'remainning', width: "200", displayName: TS.ts('column.durationRemain'), enableHiding: false
                },
                {
                    field: 'activeTime',
                    width: "140", enableHiding: false,
                    displayName: TS.ts('frontdesk.activeTime'),
                    cellFilter: 'date:"yyyy-MM-dd HH:mm:ss"'//查询出来是时间戳
                },
                {
                    field: 'purchaseTime',
                    width: "140", enableHiding: false,
                    displayName: TS.ts('frontdesk.purchaseTime'),
                    cellFilter: 'date:"yyyy-MM-dd HH:mm:ss"'
                },
                {
                    name: 'delete', displayName: TS.ts('column.delete'),
                    width: "120",
                    enableSorting: false,
                    enableColumnMenu: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><a class='btn-grid' ng-click='grid.appScope.removePasscode(row.entity)'><md-icon md-svg-icon='user:remove'></md-icon></a></div>"
                },
            ],
            data: []
        };
        $scope.searchPasscodeOptions.onRegisterApi = function (gridApi) {
            $scope.searchApi = gridApi;
            gridApi.selection.on.rowSelectionChangedBatch($scope, function (rows) {
                searchApiSelect();
            });
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                searchApiSelect();
            });
        };

        function searchApiSelect() {
            if ($scope.searchApi.selection) {
                $scope.passcodeSelected = $scope.searchApi.selection.getSelectedRows();
                if ($scope.passcodeSelected.length > 0) {
                    $scope.passcodeIsDisabled = false;
                } else {
                    $scope.passcodeIsDisabled = true;
                }
            }
        };

        $scope.classPasscode = function (row) {
            return "passcode_" + row.status;
        }

        $scope.hasEdit = function (row) {
            return row.status == 'inactive' && row.creator != "PayPal";
        }

        $scope.editPasscode = function (row) {
            var data = angular.copy(row);
            var t = getDayStr(new Date(data.lastActiveTime));
            data.lastActiveTime = t;
            $scope.editing = data.passcode;
            $scope.viewChoice('generatePasscode', data)
        };
        $scope.removePasscode = function (row) {

            var param = [];
            if (!row) {
                for (var i = 0; i < $scope.passcodeSelected.length; i++) {
                    param.push($scope.passcodeSelected[i].passcode);
                }

            } else {
                param.push(row.passcode);
            }
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/templates/dialogConfirm.html',
                windowClass: 'modal-del',
                resolve: {
                    param: function () {
                        return param;
                    }
                },
                size: "w500",
                controller: function ($scope, $uibModalInstance, param) {
                    $scope.param = param;
                    $scope.con = {
                        title: TS.ts('frontdesk.deleteTitle'),
                        content: TS.ts('frontdesk.deleteTip'),
                        type: 'common:remove'
                    };
                    if (param.length > 1) {
                        $scope.con = {
                            title: TS.ts('frontdesk.deleteTitle'),
                            content: TS.ts('frontdesk.deleteTips'),
                            type: 'common:remove'
                        }
                    }
                    $scope.ok = function () {
                        $uibModalInstance.close($scope.param);
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function (param) {

                //删除
                FrontdeskService.deletePasscode(param, function (result) {
                    if (result.success) {
                        if ($scope.subChoice == 'viewEditDelete') {
                            $scope.viewChoice('viewEditDelete');
                            $scope.passcodeIsDisabled = true;
                        } else if ($scope.subChoice == 'search') {
                            $scope.search();
                        }
                    }
                    if ($scope.passcodeApi)
                        $scope.passcodeApi.selection.clearSelectedRows();
                    if ($scope.searchApi)
                        $scope.searchApi.selection.clearSelectedRows();
                });
            }, function () {

            });

        };
        $scope.printMultiPasscode = function () {
            var mutiUrl = $state.href('multiPrintPreview');
            var printData = angular.copy($scope.passcodeSelected);
            for (var i = 0; i < printData.length; i++) {
                printData[i].lastActiveTime = getDayStr(new Date(printData[i].lastActiveTime));
                printData[i].duration = printData[i].durationView + " " + TS.ts('passcode.' + printData[i].durationType);
            }
            $localStorage.printData = null;
            $localStorage.printData = printData;
            $localStorage.isPrint = true;
            // 获取打印页面并挂起打印机
            var stamp = parseInt(Math.random() * 1000);
            $scope.frameName = 'myFrameName' + stamp;
            $timeout(function () {
                var newWin = window.open(mutiUrl, "'" + $scope.frameName + "'");

                function print() {
                    if (newWin.status == "ready to print") {
                        newWin.document.close();
                        newWin.print();
                        newWin.close();
                    } else {
                        $timeout(function () {
                            print();
                        }, 100);
                    }
                }

                if (!$scope.isEDGE) {
                    if (newWin) {
                        if (newWin.addEventListener) {
                            newWin.addEventListener("load", function () {
                                print();
                            }, true);
                        } else if (newWin.attachEvent) {
                            newWin.attachEvent("onload", function () {
                                print();
                            });
                        }
                    }
                }
            }, 200);
        }
        $scope.printPasscode = function (row) {
            var printData = [];
            if (!row) {
                printData = angular.copy($scope.passcodeSelected);
            } else {
                printData.push(angular.copy(row));
            }
            for (var i = 0; i < printData.length; i++) {
                printData[i].lastActiveTime = getDayStr(new Date(printData[i].lastActiveTime));
                printData[i].duration = printData[i].durationView + " " + TS.ts('passcode.' + printData[i].durationType);
            }
            $localStorage.printData = null;
            $localStorage.printData = printData;
            $localStorage.isPrint = true;
            // 获取打印页面并挂起打印机
            // window.open(url, 'myFrameName');
            var stamp = parseInt(Math.random() * 1000);
            $scope.frameName = 'myFrameName' + stamp;
            $timeout(function () {
                var newWin = window.open(url, "'" + $scope.frameName + "'");

                function print() {
                    if (newWin.status == "ready to print") {
                        newWin.document.close();
                        newWin.print();
                        newWin.close();
                    } else {
                        $timeout(function () {
                            print();
                        }, 100);
                    }
                }

                if (!$scope.isEDGE) {
                    if (newWin) {
                        if (newWin.addEventListener) {
                            newWin.addEventListener("load", function () {
                                print();
                            }, true);
                        } else if (newWin.attachEvent) {
                            newWin.attachEvent("onload", function () {
                                print();
                            });
                        }
                    }
                }
            }, 200);

        };

        function getDayStr(day) {
            return day.getFullYear() + '-' + ((day.getMonth() + 1) > 9 ? (day.getMonth() + 1) : ('0' + (day.getMonth() + 1))) + '-' + (day.getDate() > 9 ? day.getDate() : ('0' + day.getDate()));
        };

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
                window.location = "/"
            }, function () {
                window.location = "/"
            });
        };

        $scope.numberKeydown = function ($event) {
            var re = /(\d|Backspace)/;
            if (!re.test($event.key)) {
                $event.preventDefault();
            }
        }

        $scope.durationTypeChanged = function () {
            if ($scope.passcodeInfo.durationType === 'unitDay') {
                $scope.passcodeInfo.durationView = 1;
            } else if ($scope.passcodeInfo.durationType === 'unitHour') {
                $scope.passcodeInfo.durationView = 24;
            } else if ($scope.passcodeInfo.durationType === 'unitMin') {
                $scope.passcodeInfo.durationView = 60;
            }
        }

        $scope.durationPattern = (function () {
            var regexp = /^[1-9]$|^[1-9]\d$|^1[0-7]\d$|^180$/;
            return {
                test: function (value) {
                    if ($scope.passcodeInfo.durationType === 'unitDay') {
                        regexp = /^[1-9]$|^[1-9]\d$|^1[0-7]\d$|^180$/;
                    } else if ($scope.passcodeInfo.durationType === 'unitHour') {
                        regexp = /^[1-9]\d{0,2}$|^[1-3]\d{0,3}$|^4[1-2]\d{0,2}$|^431\d$|^4320$/;
                    } else if ($scope.passcodeInfo.durationType === 'unitMin') {
                        regexp = /^[1-9]\d{0,4}$|^1\d{0,5}$|^2[1-4]\d{0,4}$|^25[1-8]\d{0,3}$|^2591\d{0,2}$|^259200$/;
                    }
                    return regexp.test(value);
                }
            };
        })();
    });

});
