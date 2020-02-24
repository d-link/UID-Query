/**
 * Created by lizhimin on 2017/6/9.
 */
define(["app"], function (app) {

    app.register.controller('siteVLANController', function ($scope, Current, BatchConfigService, utils, $timeout, TS) {
        $scope.hasPrivilege = Current.user().role == "root admin" || Current.user().role == "local admin";
        $scope.vlanShowData = angular.copy($scope.vlanData);
        //  console.log($scope.vlanShowData);
        $scope.selected = {portSelectAll: 1, port24GhzSelectAll: 1, port5GhzSelectAll: 1,port5Ghz2ndSelectAll: 1};
        /*
         * 页面固定参数
         */

        $scope.state = {
            vlan: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgTrue: 'configuration.vlan.msgTrue',
                msgFalse: 'Error'
            },
            pvid: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgTrue: 'configuration.vlan.pvidMsgTrue',
                msgFalse: 'Error'
            },
        };
        function initVLANState() {
            $scope.state.vlan.processing = false;
            $scope.state.vlan.isSuccess = false;
            $scope.state.vlan.isError = false;
        };
        function initPVIDState() {
            $scope.state.pvid.processing = false;
            $scope.state.pvid.isSuccess = false;
            $scope.state.pvid.isError = false;
        };
        initVLANState();
        initPVIDState();
        // add/edit vlan
        $scope.statuses = ['0', 1]; // [0: disable | 1: enable]
        $scope.ports = [2, 1, 0]; // [0: none | 1: tag | 2: untag]
        $scope.ports1 = [2, 0];
        $scope.ssid24 = ['primary24g', 'ssid24g1', 'ssid24g2', 'ssid24g3', 'ssid24g4',
            'ssid24g5', 'ssid24g6', 'ssid24g7'];
        $scope.ssid5 = ['primary5g', 'ssid5g1', 'ssid5g2', 'ssid5g3', 'ssid5g4',
            'ssid5g5', 'ssid5g6', 'ssid5g7'];
        $scope.ssidSec5 = ['primarySec5g', 'ssidSec5g1', 'ssidSec5g2', 'ssidSec5g3', 'ssidSec5g4',
            'ssidSec5g5', 'ssidSec5g6', 'ssidSec5g7'];
        function initVlan() {
            $scope.newVlan = {
                vid: 1,
                name: "",
                mgmt: 1,
                lan1: 1,
                lan2: 1,
                primary24g: 2,
                ssid24g1: 2,
                ssid24g2: 2,
                ssid24g3: 2,
                ssid24g4: 2,
                ssid24g5: 2,
                ssid24g6: 2,
                ssid24g7: 2,
                primary5g: 2,
                ssid5g1: 2,
                ssid5g2: 2,
                ssid5g3: 2,
                ssid5g4: 2,
                ssid5g5: 2,
                ssid5g6: 2,
                ssid5g7: 2,
                primarySec5g:2,
                ssidSec5g1: 2,
                ssidSec5g2: 2,
                ssidSec5g3: 2,
                ssidSec5g4: 2,
                ssidSec5g5: 2,
                ssidSec5g6: 2,
                ssidSec5g7: 2
            };
            $scope.selected.port24GhzSelectAll = 2;
            $scope.selected.port5GhzSelectAll = 2;
            $scope.selected.port5Ghz2ndSelectAll=2;
            $scope.selected.portSelectAll = 1;
            $scope.isEdit = false;
        };
        initVlan();
        var vlanText = utils.getVlanText();
        $scope.isEdit = false;

        function init() {
            $scope.show = {
                tab1: false,
                tab2: false,
                tab3: false,
                tab4: false
            };
        }


        $scope.showTab = function (tab) {
            init();
            if (tab == 0) {
                $scope.show.tab1 = true;
                $timeout(function () {
                    setGridHeight('vlanGrid', true, 58);
                })
            }
            ;
            if (tab == 1) {
                $scope.show.tab2 = true;
                $timeout(function () {
                    setGridHeight('portGrid', true, 58);
                })
            }
            ;
            if (tab == 2) {
                $scope.show.tab3 = true;

                setHeight('ele-addVlan', [], -211);
            }
            ;
            if (tab == 3) {
                $scope.show.tab4 = true;
                setHeight('ele-addVlan', [], -211);
            }
            ;

        }
        //VLAN List
        $scope.VLANOptions = {
            rowHeight: 120,
            paginationPageSizes: [10, 15, 20],
            paginationPageSize: 15,
            paginationTemplate: './views/templates/gridBurster.html',
            columnDefs: [
                {field: 'vid', width: "12%", enableHiding: false,sort:{
                    direction:'asc'
                }, displayName: TS.ts('column.vlanVID')},
                {field: 'name', width: "12%", enableHiding: false, displayName: TS.ts('column.vlanName')},
                {
                    field: 'mgmt',
                    displayName: TS.ts('column.tagPorts'),
                    width: "33%",
                    enableHiding: false,
                    cellTemplate: '<div class="ui-grid-cell-contents"><span title="{{row.entity|vlanTagDetail}}">{{row.entity|vlanTagDetail}}</span></div>'
                },
                {
                    field: 'mgmt',
                    displayName: TS.ts('column.untagPorts'),
                    width: "33%",
                    enableHiding: false,
                    cellTemplate: '<div class="ui-grid-cell-contents"><span title="{{row.entity|vlanUnTagDetail}}">{{row.entity|vlanUnTagDetail}}</span></div>'
                },
                {
                    name: 'action',
                    displayName: TS.ts('column.action'),
                    midWidth: "100",
                    enableHiding: false,
                    enableSorting: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><a class='btn-grid' ng-if='grid.appScope.hasPrivilege'  ng-click='grid.appScope.editVID(row.entity)' title=\'" + TS.ts('column.edit') + "\'><md-icon md-svg-icon='user:edit'></md-icon></a>" +
                    "<a class='btn-grid'ng-if='grid.appScope.hasPrivilege' title=\'" + TS.ts('column.delete') + "\' ng-click='grid.appScope.delVID(row.entity)'><md-icon md-svg-icon='user:remove'></md-icon></a></div>"
                }
            ]
        };

        $scope.VLANOptions.data = angular.copy($scope.vlanShowData.list);
        $scope.cancelEdit = function () {
            $scope.isEdit = false;
            initVlan();
        }
        $scope.changeVIDExist = function () {
            $scope.VIDExist = false;
        }
        $scope.editVID = function (entity) {
            $scope.isEdit = true;
            $scope.VIDExist = false;
            $scope.newVlan = angular.copy(entity);
            if ($scope.newVlan.mgmt == $scope.newVlan.lan1 && $scope.newVlan.mgmt == $scope.newVlan.lan2) {
                $scope.selected.portSelectAll = $scope.newVlan.mgmt;
            } else {
                $scope.selected.portSelectAll = 4;
            }
            function setItem(tag) {
                var tt = true;
                var temp = $scope.newVlan[tag[0]];
                for (var i = 1; i < tag.length; i++) {
                    if (temp != $scope.newVlan[tag[i]]) {
                        tt = false;
                    }
                }
                if (tt) {
                    if (tag.indexOf('primary24g') != -1) {
                        $scope.selected.port24GhzSelectAll = temp;
                    } else if(tag.indexOf('primary5g') != -1){
                        $scope.selected.port5GhzSelectAll = temp;
                    }else {
                        $scope.selected.port5Ghz2ndSelectAll = temp;
                    }


                } else {
                    if (tag.indexOf('primary24g') != -1) {
                        $scope.selected.port24GhzSelectAll = 100;
                    } else if(tag.indexOf('primary5g') != -1){
                        $scope.selected.port5GhzSelectAll = 100;
                    }else {
                        $scope.selected.port5Ghz2ndSelectAll = 100;
                    }
                }
            }

            setItem($scope.ssid24);
            setItem($scope.ssid5);
            setItem($scope.ssidSec5);
            $scope.activeForm = 2;
        }
        $scope.delVID = function (entity) {
            var data = {
                vid: entity.vid
            };
            var delIndex = entity.$$hashKey;
            BatchConfigService.delVLAN($scope.profileId, data, function (result) {
                if (result.success) {
                    for (var i = 0; i < $scope.VLANOptions.data.length; i++) {
                        if ($scope.VLANOptions.data[i].$$hashKey == delIndex) {
                            $scope.VLANOptions.data.splice(i, 1);
                            $scope.vlanData.list.splice(i, 1);
                            break;
                        }
                    }
                    generatePVID();
                    $scope.vlanData.pvid = angular.copy($scope.vlanShowData.pvid);
                    $scope.$emit('refreshBCTree');
                    $scope.$emit('refreshActiveProfile');
                    $scope.portOptions.data = $scope.generatePortData();
                }
            }, function () {
            })
        }
        //Port List
        $scope.portOptions = {
            /*  paginationPageSizes: [10, 15, 20],
             paginationPageSize: 15,
             paginationTemplate: './views/templates/gridBurster.html',*/
            enableSorting:false,
            columnDefs: [
                {field: 'name', enableHiding: false, displayName: TS.ts('column.portName'), width: "25%" },
                {field: 'tag', enableHiding: false, displayName: TS.ts('column.tagVID'), width: "25%"},
                {field: 'untag', enableHiding: false, displayName: TS.ts('column.untagVID'), width: "25%"},
                {field: 'pvid', enableHiding: false, displayName: TS.ts('column.pvid'), minWidth: "100"}
            ]
        };
        $scope.generatePortData = function () {
            var portData = [];
            var portlist=["mgmt","lan1","lan2","primary24g","ssid24g1", "ssid24g2", "ssid24g3","ssid24g4",
                "ssid24g5","ssid24g6","ssid24g7","primary5g","ssid5g1","ssid5g2","ssid5g3",
                "ssid5g4", "ssid5g5","ssid5g6","ssid5g7","primarySec5g","ssidSec5g1","ssidSec5g2",
                "ssidSec5g3", "ssidSec5g4","ssidSec5g5","ssidSec5g6","ssidSec5g7"];
            for(var i=0;i<portlist.length;i++){
                var port = {tag: '', untag: ''};
                port.index = portlist[i];
                port.name = vlanText[port.index];
                port.pvid = $scope.vlanData.pvid[port.index];
                var temp = $scope.getVLANInfo(portlist[i]);
                port.tag = temp.tag;
                port.untag = temp.untag;
                portData.push(port);
            }
            return portData;
        }
        function generatePVID(newVlan) {

            function getLastVID(index){
                var len = $scope.vlanData.list.length;
                var pvid='1';
                for (var i = 0; i < len; i++) {
                    var temp=$scope.vlanData.list[i][index]-0;
                    if (temp == 2) {
                        pvid=$scope.vlanData.list[i].vid;
                    }
                }
                return pvid;
            }
            if(newVlan){
                if ($scope.vlanShowData.pvid.autoAssignStatus == 1) {
                    for (var key in newVlan) {
                        if(key!='name'&&key!="vid"){
                            var temp=newVlan[key]-0;
                            if (temp == 2) {
                                $scope.vlanShowData.pvid[key] = newVlan.vid;
                            }else{
                                let temp1= $scope.vlanShowData.pvid[key];
                                if(temp1==newVlan['vid']){
                                    $scope.vlanShowData.pvid[key] =getLastVID(key);
                                }
                            }
                        }

                    }
                }
            }else{
                if ($scope.vlanShowData.pvid.autoAssignStatus == 1) {
                    for (var key in $scope.vlanShowData.pvid) {
                        if(key!='autoAssignStatus'){
                            $scope.vlanShowData.pvid[key]=getLastVID(key);
                        }

                    }
                }
            }


        }

        $scope.getVLANInfo = function (index, tag) {
            var result = {tag: '', untag: ''};
            var len = $scope.vlanData.list.length;
            for (var i = 0; i < len; i++) {
                if ($scope.vlanData.list[i][index] == 1) {
                    result.tag += $scope.vlanData.list[i].vid + ", ";
                }
                if ($scope.vlanData.list[i][index] == 2) {
                    result.untag += $scope.vlanData.list[i].vid + ", ";
                }
            }

            if (result.tag.length > 0) {//去除最后一个逗号
                result.tag = result.tag.slice(0, -2);
            }
            if (result.untag.length > 0) {
                result.untag = result.untag.slice(0, -2);
            }

            return result;
        }

        $scope.portOptions.data = $scope.generatePortData();

        $scope.selectAll = function (val, tag) {
            if (tag) {
                for (var i = 0; i < tag.length; i++) {
                    $scope.newVlan[tag[i]] = val;
                }
            } else {
                $scope.newVlan.mgmt = val;
                $scope.newVlan.lan1 = val;
                $scope.newVlan.lan2 = val;
            }
        };
        $scope.selectItem = function (val, tag) {
            if (tag) {
                var tt = true;
                var temp = $scope.newVlan[tag[0]];
                for (var i = 1; i < tag.length; i++) {
                    if (temp != $scope.newVlan[tag[i]]) {
                        tt = false;
                    }
                }
                if (tt) {
                    if (tag.indexOf('primary24g') != -1) {
                        $scope.selected.port24GhzSelectAll = val;
                    } else if(tag.indexOf('primary5g') != -1){
                        $scope.selected.port5GhzSelectAll = val;
                    } else {
                        $scope.selected.port5Ghz2ndSelectAll = val;
                    }


                } else {
                    if (tag.indexOf('primary24g') != -1) {
                        $scope.selected.port24GhzSelectAll = 100;
                    }else if(tag.indexOf('primary5g') != -1){
                        $scope.selected.port5GhzSelectAll = 100;
                    } else {
                        $scope.selected.port5Ghz2ndSelectAll = 100;
                    }
                }

            } else {
                if ($scope.newVlan.mgmt == $scope.newVlan.lan1 && $scope.newVlan.mgmt == $scope.newVlan.lan2) {
                    $scope.selected.portSelectAll = $scope.newVlan.mgmt;
                } else {
                    $scope.selected.portSelectAll = 4;
                }
            }
        }

        $scope.savePVID = function () {
            $scope.state.pvid.processing = true;
            $scope.state.pvid.isSuccess = false;
            $scope.state.pvid.isError = false;
            if ($scope.vlanShowData.pvid.autoAssignStatus == 1){
                generatePVID();
            }
            var savePVID = angular.copy($scope.vlanShowData.pvid);

            // 每一项都要 转为数字
            for (var x in savePVID) {
                savePVID[x] -= 0;
            }
            BatchConfigService.resetPvid($scope.profileId, savePVID, function (result) {
                $scope.state.pvid.processing = false;
                if (result.success) {
                    $scope.state.pvid.isSuccess = true;
                } else {
                    $scope.state.pvid.isError = true;
                }
                $scope.vlanData.pvid = angular.copy($scope.vlanShowData.pvid);
                $scope.$emit('refreshBCTree');
                $scope.$emit('refreshActiveProfile');
                $scope.portOptions.data = $scope.generatePortData();
            })
        }

        $scope.vlanStatusChanged = function () {
            initVLANState();
        };
        $scope.saveVLANStatus = function () {
            $scope.state.vlan.processing = true;
            $scope.state.vlan.isSuccess = false;
            $scope.state.vlan.isError = false;
            var saveStatus = $scope.vlanShowData.status;
            saveStatus -= 0; // 格式转化
            BatchConfigService.resetVLANStatus($scope.profileId, saveStatus, function (result) {
                $scope.state.vlan.processing = false;
                if (result.success) {
                    $scope.state.vlan.isSuccess = true;
                } else {
                    $scope.state.vlan.isError = true;
                }
                $scope.$emit('refreshBCTree');
                $scope.$emit('refreshActiveProfile');
            });
        }
        $scope.VIDExist = false;
        $scope.addVLAN = function () {
            $scope.VIDExist = false;
            $scope.newVlan.vid -= 0;
            if (!$scope.isEdit) {
                for (var i = 0; i < $scope.VLANOptions.data.length; i++) {
                    if ($scope.VLANOptions.data[i].vid == $scope.newVlan.vid) {
                        $scope.VIDExist = true;
                        return;
                    }
                }
                BatchConfigService.addVLAN($scope.profileId, $scope.newVlan, function (result) {
                    // $emit 事件  更新左侧列表数据
                    if (result.success) {
                        $scope.vlanData.list.push($scope.newVlan);
                        $scope.VLANOptions.data =angular.copy($scope.vlanData.list) ;
                        generatePVID($scope.newVlan);
                        $scope.vlanData.pvid = angular.copy($scope.vlanShowData.pvid);
                        $scope.$emit('refreshBCTree');
                        initVlan();
                        $scope.activeForm = 0;
                        $scope.portOptions.data = $scope.generatePortData();
                    } else {
                        if (result.error == 1) $scope.VIDExist = true;
                    }
                    ;
                });
            } else {
                BatchConfigService.updateVLAN($scope.profileId, $scope.newVlan, function (result) {
                    // $emit 事件  更新左侧列表数据
                    if (result.success) {

                        for (var i = 0; i < $scope.vlanData.list.length; i++) {
                            if ($scope.vlanData.list[i].vid == $scope.newVlan.vid) {
                                $scope.vlanData.list[i] = $scope.newVlan;
                                break;
                            }
                        }

                        $scope.VLANOptions.data = $scope.vlanData.list;
                        generatePVID($scope.newVlan);
                        $scope.vlanData.pvid = angular.copy($scope.vlanShowData.pvid);
                        $scope.$emit('refreshBCTree');
                        initVlan();
                        $scope.activeForm = 0;
                        $scope.portOptions.data = $scope.generatePortData();
                    }
                    ;
                });
            }
        };

        $scope.error = {};
        $scope.vlanGroupBlur = function (name) {
            var re = /^([1-3]\d{3}|40[1-8]\d|409[1-4]|[1-9]\d{2}|[1-9]\d|[1-9])$/;
            $scope.error[name] = !re.test($scope.newVlan.vid);
        };
        $scope.valueChange = function (name) {
            $scope.error[name] = false;
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

        $scope.PVIDBlur = function (name) {
            var re = /^([1-3]\d{3}|40[1-8]\d|409[1-4]|[1-9]\d{2}|[1-9]\d|[1-9])$/;
            $scope.error[name] = !re.test($scope.vlanShowData.pvid[name]);
        };
        $scope.PVIDChanged = function (name) {
            initPVIDState();
        };
    });
    app.register.directive('siteVlan', function () {
        return {
            restrict: 'AE',
            scope: {
                vlanData: '=',
                profileId: '='
            },
            templateUrl: "./views/configuration/site-VLAN.html",
            controller: 'siteVLANController'
        };
    });
});