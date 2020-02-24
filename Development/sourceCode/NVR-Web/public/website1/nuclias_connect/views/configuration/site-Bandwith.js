/**
 * Created by lizhimin on 2017/6/9.
 */
define(["app"], function (app) {
    app.register.controller('siteBandwithController', function ($scope, Current, BatchConfigService, TS, $timeout) {
        $scope.hasPrivilege = Current.user().role == "root admin" || Current.user().role == "local admin";
        /*
         * 页面固定参数
         */
        // 页面保存状态
        $scope.state = {
            band: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgTrue: 'configuration.band.msgTrue',
                msgFalse: 'Error'
            },
        };
        function initBandState() {
            $scope.state.band.processing = false;
            $scope.state.band.isSuccess = false;
            $scope.state.band.isError = false;
        };
        initBandState();
        $scope.addRuleResult = {
            isError: false,
            msg: ''
        }
        // 下拉选框数据
        $scope.ruleTypes = [1, 2, 3, 4]; // [1: averageForEachStation | 2: specificForSSID |3: maximumForEachStation |4.differentFor11abgnstations]
        $scope.statuses = ['0', 1];
        $scope.bands = [1, 2, 3]; // [1: 2.4GHz | 2: 5GHz|3： 5GHz 2nd]
        $scope.ssidIndexs = [1, 2, 3, 4, 5, 6, 7, 8];
        // [1: primary | 2: SSID 1 | 3: SSID 2 | 4: SSID 3 | 5: SSID 4 | 6: SSID 5 | 7: SSID 6 | 8: SSID 7] //


        $scope.speedTypes = [1, 2]; // [1: kbps| 2: mbps]

        $scope.bandChange = function () {
            initBandState();
        };
        /*
         * Todo
         * 改变type列表（根据已有rule的ssid+band唯一性）
         * on-select
         */
        $scope.changeBand = function () {
            $scope.temporary.ssidIndex = $scope.ssidIndexs.filter($scope.ssidFilter)[0];
        };

        $scope.bandFilter = function (item) {
            return true;
        };
        // grid
        $scope.optimizationOption = {
            columnDefs: [
                {
                    name: 'band', displayName: TS.ts('column.band'), enableHiding: false, width: "8%", sort: {
                    direction: 'asc',
                    priority: 1
                },
                    cellTemplate: "<div class='ui-grid-cell-contents'>{{'configuration.band' + row.entity.band | translate}}</div>"
                },
                {
                    name: 'ssidIndex', enableHiding: false, displayName: TS.ts('column.ssid'), width: "10%", sort: {
                    direction: 'asc',
                    priority: 2
                },
                    cellTemplate: "<div class='ui-grid-cell-contents'>{{'configuration.band.ssid' + row.entity.ssidIndex| translate}}</div>"
                },
                {
                    name: 'type', enableHiding: false, displayName: TS.ts('column.type'), width: "32%",
                    cellTemplate: "<div class='ui-grid-cell-contents'>{{'configuration.band.type' + row.entity.type | translate}}</div>"
                },

                {
                    name: 'downSpeed',enableHiding: false, displayName: TS.ts('column.downSpeed'), width: "17%",
                    cellTemplate: "<div class='ui-grid-cell-contents'>{{row.entity.downSpeed}} {{'configuration.bps' + row.entity.downSpeedType | translate}}</div>"
                },
                {
                    name: 'upSpeed', enableHiding: false,displayName: TS.ts('column.upSpeed'), width: "17%",
                    cellTemplate: "<div class='ui-grid-cell-contents'>{{row.entity.upSpeed}} {{'configuration.bps' + row.entity.upSpeedType | translate}}</div>"
                },
                {
                    name: 'Modify', displayName: TS.ts('column.action'),
                    minWidth: "100",enableHiding: false,enableSorting: false, enableColumnMenu: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><a class='btn-grid' ng-if='grid.appScope.power.hasEdit()' ng-click='grid.appScope.editRule(row.entity)' title=\'" + TS.ts('column.edit') + "\'><md-icon md-svg-icon='user:edit'></md-icon></a>" +
                    "<a class='btn-grid' ng-if='grid.appScope.power.hasDelete()' ng-click='grid.appScope.removeRule(row.entity)' title=\'" + TS.ts('column.delete') + "\'><md-icon md-svg-icon='user:remove'></md-icon></a></div>"
                }
            ]
        };
        var userInfo = Current.user();
        $scope.power = {
            hasDelete: function () {
                if (userInfo.role == 'root admin') {
                    return true;
                }
                return false;
            },
            hasEdit: function () {
                if (userInfo.role == 'root admin') {
                    if ($scope.bandShowData.status == 1) {
                        return true;
                    }
                }
                return false;
            }
        }
        /*
         * 数据绑定
         */
        // mock data
        // $scope.bandShowData = {
        //     status: 1
        // };
        $scope.bandShowData = angular.copy($scope.bandData);
       /* if ($scope.bandShowData.rule) {
            for (var i = 0; i < $scope.bandShowData.rule.length; i++) {
                $scope.bandShowData.rule[i].ssidIndex -= 1;
            }
        }*/
        $scope.optimizationOption.data = $scope.bandShowData.rule;
        $timeout(function () {
            setGridHeight('optimizationGrid', true, 368);
        })
        /*
         * 页面操作
         */
        $scope.resetting = function () {
            $scope.temporary = {
                type: 1,
                band: 1,
                ssidIndex: 1,
                downSpeed: $scope.bandShowData.downlinkBW,
                downSpeedType: 2,
                upSpeed: $scope.bandShowData.uplinkBW,
                upSpeedType: 2
            };
            $scope.editRuleStatus = null;
        };
        $scope.resetting();

        /*
         * 添加rule
         */
        $scope.addRule = function () {
            var rule = angular.copy($scope.temporary);
            rule.ssidIndex -= 0;
            rule.downSpeed -= 0;
            rule.upSpeed -= 0;
            var find = -1;
            for (var i = 0; i < $scope.optimizationOption.data.length; i++) {
                var temp = $scope.optimizationOption.data[i];
                if (temp.ssidIndex + "_" + temp.band == rule.ssidIndex + "_" + rule.band) {
                    find = 1;
                    $scope.optimizationOption.data[i] = rule;
                }
            }
            if (find == -1) {
                $scope.optimizationOption.data.push(rule);
                $scope.resetting();
                initBandState();
            }

        };
        /*
         * 编辑rule
         */
        $scope.editRule = function (rule) {
            $scope.editRuleStatus = rule.$$hashKey;
            $scope.temporary = angular.copy(rule);
            initBandState();
        };
        /*
         * 编辑时，保存rule
         */
        $scope.saveRule = function () {
            var rule = angular.copy($scope.temporary);
            rule.ssidIndex -= 0;
            rule.downSpeed -= 0;
            rule.upSpeed -= 0;
            for (var i = 0; i < $scope.optimizationOption.data.length; i++) {
                if ($scope.optimizationOption.data[i].$$hashKey == $scope.editRuleStatus) {
                    $scope.optimizationOption.data[i] = rule;
                }
            }
            ;
            $scope.resetting();
            initBandState();
        };
        function cancleAlert() {
            $timeout(function () {
                $scope.state.band.isError = false;
                $scope.state.band.isSuccess = false;
                $scope.addRuleResult.isError = false;
            }, 10000);
        }

        /*
         * 删除rule
         */
        $scope.removeRule = function (rule) {
            var delIndex = rule.$$hashKey;
            if ($scope.editRuleStatus == delIndex) {
                // TODO
                // 清空表单数据
                $scope.addRuleResult.isError = true;
                $scope.addRuleResult.msg = 'configuration.band.alert1';
                cancleAlert();
                return;
            }
            for (var i = 0; i < $scope.optimizationOption.data.length; i++) {
                if ($scope.optimizationOption.data[i].$$hashKey == delIndex) {
                    $scope.optimizationOption.data.splice(i, 1);
                    break;
                }
            }
            ;
            $scope.resetting();
        };

        /*
         * 保存 bandwidth optimization数据
         */
        $scope.save = function () {
            if ($scope.editRuleStatus) {
                // TODO
                // 可不考虑正在编辑的状态，直接保存表格数据
                $scope.state.band.isError = true;
                $scope.state.band.msgFalse = 'configuration.band.alert1';
                cancleAlert();
                return;
            }
            ;
            // Todo 判断数据是否合法
            if ($scope.bandShowData.status == 0) {
                var re = /^([1-2]\d|300|[1-9]\d|[1-9])$/;
                if (!re.test($scope.bandShowData.downlinkBW)) {
                    $scope.bandShowData.downlinkBW = 1;
                }
                if (!re.test($scope.bandShowData.uplinkBW)) {
                    $scope.bandShowData.uplinkBW = 1;
                }
            }
            ;
            $scope.state.band.processing = true;
            $scope.state.band.isSuccess = false;
            $scope.state.band.isError = false;
            $scope.bandSaveData = angular.copy($scope.bandShowData);
            $scope.bandSaveData.rule = $scope.optimizationOption.data;
            $scope.bandSaveData.status -= 0;
            $scope.bandSaveData.downlinkBW -= 0;
            $scope.bandSaveData.uplinkBW -= 0;
            for (var i = 0; i < $scope.bandSaveData.rule.length; i++) {
                var rule = $scope.bandSaveData.rule[i];

                if (rule.upSpeed > $scope.bandSaveData.uplinkBW * (rule.upSpeedType == 1 ? 1000 : 1)) {
                    // alert(TS.ts('configuration.band.alert2'));
                    $scope.state.band.processing = false;
                    $scope.state.band.isError = true;
                    $scope.state.band.msgFalse = 'configuration.band.alert2';
                    cancleAlert();
                    return;
                }
                if (rule.downSpeed > $scope.bandSaveData.downlinkBW * (rule.downSpeedType == 1 ? 1000 : 1)) {
                    // alert(TS.ts('configuration.band.alert3'));
                    $scope.state.band.processing = false;
                    $scope.state.band.isError = true;
                    $scope.state.band.msgFalse = 'configuration.band.alert3';
                    cancleAlert();
                    return;
                }
            }
            BatchConfigService.addBandWidthOpt($scope.profileId, $scope.bandSaveData, function (result) {
                // $emit 事件  更新左侧列表数据
                $scope.state.band.processing = false;
                if (result.success) {
                    $scope.state.band.isSuccess = true;
                    $scope.$emit('refreshBCTree');
                    $scope.$emit('refreshActiveProfile');
                } else {
                    $scope.state.band.isError = true;
                }
                ;
            });
        };

        /*
         * 验证
         */
        $scope.error = {};
        $scope.ruleKeyup = function (name) {
            if (name == "upSpeed") {
                if ($scope.temporary['upSpeed'] > $scope.bandShowData.uplinkBW * ($scope.temporary.upSpeedType == 1 ? 1000 : 1)) {
                    $scope.error[name] = true;
                }
                else {
                    $scope.error[name] = false;
                }
            }
            if (name == "downSpeed") {
                if ($scope.temporary['downSpeed'] > $scope.bandShowData.downlinkBW * ($scope.temporary.downSpeedType == 1 ? 1000 : 1)) {
                    $scope.error[name] = true;
                }
                else {
                    $scope.error[name] = false;
                }
            }

        };
        $scope.numberKeydown = function ($event) {
            if ($event.keyCode == 9) {
                return;
            }
            var re = /(\d|Backspace)/;
            if (!re.test($event.key)) {
                $event.preventDefault();
            }
            ;
        };
    });
    app.register.directive('siteBandwith', function () {
        return {
            restrict: 'AE',
            templateUrl: "./views/configuration/site-Bandwith.html",
            scope: {
                bandData: '=',
                profileId: '='
            },
            controller: 'siteBandwithController'
        };
    });
});