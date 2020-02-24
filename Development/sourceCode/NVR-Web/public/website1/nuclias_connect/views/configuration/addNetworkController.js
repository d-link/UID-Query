/**
 * Created by guojiangchao on 2017/2/10.
 */
define(["app"], function (app) {
    app.register.controller('addNetworkController', function ($rootScope, $scope, $uibModalInstance, $uibModal, OrganizationService, NetworkService, InventoryService, tag, secondaryTime, network, Current, utils, $timeout, TS) {

        /************************************************
         * 弹窗基本信息
         ************************************************/
        /**
         * 基本信息
         */
        $scope.steps = [{index: 1, title: ''}, {index: 2, title: ''},
            {index: 3, title: ''},
            {index: 4, title: ''}];

        $scope.step = $scope.tag = tag;
        $scope.titleArr = ['sys', 'an', 'nc', 'dsfn', 'd'];
        if (network) $scope.titleArr[1] = 'en';
        $scope.iconArr = ['network_icon', 'network_icon', 'network_icon', 'network_icon', 'network_icon'];
        $scope.selectCountries = utils.getCountries();
        $scope.timeZones = utils.getTimeZones();
        $scope.webAccessPortRe = /^([1-9]\d{0,2})$|([1-4]\d{3})$|(6[0-5]\d{2})$|(65[0-5]\d)$|(655[0-3])$|(6553[0-5])$/;
        $scope.invalidIP = {
            webAccessPort: false,
            deviceAccessPort: false,
            Error1: false,
            Error2: false
        };
        $scope.originalField = {};
        $scope.portKeyup = function (key1, key2) {
            //檢查範圍區間有無在1-65535間
            var webAccessPortRe = /^([1-9]\d{0,2})$|([1-4]\d{3})$|(6[0-5]\d{3})$|(65[0-5]\d{2})$|(655[0-3]\d)$|(6553[0-5])$/;
            var webAccessPort = webAccessPortRe.test($scope.org[key1]);
            if (parseInt($scope.org[key1]) < 1 || parseInt($scope.org[key1]) > 65535 || $scope.org[key1] == $scope.org[key2]) {
                $scope.invalidIP[key1] = true;
                $scope.invalidIP.Error1 = true;
            } else {
                $scope.invalidIP[key1] = false;
                $scope.invalidIP.Error1 = false;
            }
        };
        $scope.devPortKeyup = function (key1, key2) {
            //var webAccessPort = webAccessPortRe.test($scope.org[key1]);
            if (parseInt($scope.org[key1]) < 1 || parseInt($scope.org[key1]) > 65535 || $scope.org[key1] == $scope.org[key2]) {
                $scope.invalidIP[key1] = true;
                $scope.invalidIP.Error1 = true;
            } else {
                $scope.invalidIP[key1] = false;
                $scope.invalidIP.Error1 = false;
            }
        };
        $scope.addresses = [];
        $scope.dataForShow = {
            otherAddress: ''
        };
        $scope.show = {
            tab1: true,
            tab2: false
        };
        $scope.checkNetworkName = function () {
            var $sz = /[/\\<>:?*\"|.]/gi;//常见的特殊字符不够[]里面继续加
            if ($sz.test($scope.network.name)) {
                $scope.error.netNameCheck = true;
            } else {
                $scope.error.netNameCheck = false;

            }
        };
        //验证前先清空当前行验证结果
        emptyRule = function (index) {
            $scope['fromIPRule' + index] = undefined;
            $scope['toIPRule' + index] = undefined;
            $scope['fromIPMulticast' + index] = undefined;
            $scope['toIPMulticast' + index] = undefined;
            $scope['fromIPStartRule' + index] = undefined;
            $scope['toIPStartRule' + index] = undefined;
            $scope['CompareIP' + index] = undefined;
            $scope['CalcIPCount' + index] = undefined;
            $scope['subnetIPRule' + index] = undefined;
            $scope['subnetIPMulticast' + index] = undefined;
            $scope['prefixCount' + index] = undefined;
            $scope['subnetIPStartRule' + index] = undefined;
        }
        //每行检查结果
        $scope.checkResult = [];
        //检查模型
        $scope.checkModel = function (model, $index) {
            // console.log(model);
            //檢查IP, A.B.C.D範圍是否為0~255
            var IPAddressPattern = /^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-4]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-4]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;
            // 檢查IP是否為muticast IP
            var multicastAddressPattern = /^(2(?:2[4-9]|3[0-9]))\.([0-2]?[0-9]?[0-9])\.([0-2]?[0-9]?[0-9])\.([0-2]?[0-9]?[0-9])$/;
            emptyRule($index);
            if (model.type == "IP") {
                var fromIP = model.IP.from ? model.IP.from : "";
                var toIP = model.IP.to ? model.IP.to : "";
                // console.log(fromIP, toIP)
                //檢查IP, A.B.C.D範圍是否為0~255

                var fromIPAddress = IPAddressPattern.test(fromIP);
                var toIPAddress = IPAddressPattern.test(toIP);

                if (fromIP!="" && fromIPAddress == true) {
                    $scope['fromIPRule' + $index] = false;

                    // 檢查IP是否為multicast IP
                    var fromIPMulticastAddress = multicastAddressPattern.test(fromIP);

                    if (fromIPMulticastAddress == true) {
                        $scope['fromIPMulticast' + $index] = true;
                    } else {
                        $scope['fromIPMulticast' + $index] = false;

                        // IP 開頭不能為0, 127, 224, 240, 255
                        // IP不能以0,255结尾
                        var fromIPStart = fromIP.split(".")[0];
                        var fromIPEnd = fromIP.split(".")[3];
                        // console.log('fromIPEnd', fromIPEnd, $scope['fromIPRule' + $index], $scope['fromIPMulticast' + $index]);
                        if (fromIPStart == "0" || fromIPStart == "127" || fromIPStart == "224" || fromIPStart == "240" || fromIPStart == "255") {
                            $scope['fromIPStartRule' + $index] = true;
                        } else {
                            $scope['fromIPStartRule' + $index] = false;
                            if (fromIPEnd == "0") {
                                $scope['fromIPRule' + $index] = true;
                            } else {
                                $scope['fromIPRule' + $index] = false;
                                if (fromIPEnd == "255") {
                                    $scope['fromIPMulticast' + $index] = true;
                                } else {
                                    $scope['fromIPMulticast' + $index] = false;
                                }
                            }
                        }
                    }
                } else {
                    $scope['fromIPRule' + $index] = true;
                }

                if (toIP!="" && toIPAddress == true) {
                    $scope['toIPRule' + $index] = false;

                    // 檢查IP是否為multicast IP
                    var toIPMulticastAddress = multicastAddressPattern.test(toIP);

                    if (toIPMulticastAddress == true) {
                        $scope['toIPMulticast' + $index] = true;
                    } else {
                        $scope['toIPMulticast' + $index] = false;

                        // IP 開頭不能為0, 127, 224, 240, 255
                        // IP不能以0,255结尾
                        var toIPStart = toIP.split(".")[0];
                        var toIPEnd = toIP.split(".")[3];
                        // console.log('toIPEnd',toIPEnd, $scope['toIPRule' + $index], $scope['toIPMulticast' + $index]);
                        if (toIPStart == "0" || toIPStart == "127" || toIPStart == "224" || toIPStart == "240" || toIPStart == "255") {
                            $scope['toIPStartRule' + $index] = true;
                        } else {
                            $scope['toIPStartRule' + $index] = false;
                            if (toIPEnd == "0") {
                                $scope['toIPRule' + $index] = true;
                            } else {
                                $scope['toIPRule' + $index] = false;
                                if (toIPEnd == "255") {
                                    $scope['toIPMulticast' + $index] = true;
                                } else {
                                    $scope['toIPMulticast' + $index] = false;
                                }
                            }
                        }
                    }
                } else {
                    $scope['toIPRule' + $index] = true;
                }

                if ($scope['fromIPRule' + $index] == false && $scope['toIPRule' + $index] == false
                    && $scope['fromIPMulticast' + $index] == false && $scope['toIPMulticast' + $index] == false
                    && $scope['fromIPStartRule' + $index] == false && $scope['toIPStartRule' + $index] == false) {
                    // IP 起始須 <= 結束IP
                    let fromArray = fromIP.split(".").map(x => parseInt(x));
                    let toArray = toIP.split(".").map(x => parseInt(x));
                    // console.log(fromArray)
                    // console.log(toArray)
                    if (fromArray && toArray && fromArray.length == 4 && toArray.length == 4 && fromArray[0] <= toArray[0] && fromArray[1] <= toArray[1]) {
                        let f = fromArray[0] * 254 * 254 * 254 + fromArray[1] * 254 * 254 + fromArray[2] * 254 + fromArray[3];
                        let t = toArray[0] * 254 * 254 * 254 + toArray[1] * 254 * 254 + toArray[2] * 254 + toArray[3];
                        // console.log(f, t, t - f);
                        if (f <= t) {
                            $scope['CompareIP' + $index] = false;
                            if (t - f >= 256) {
                                $scope['CalcIPCount' + $index] = true;
                            } else {
                                $scope['CalcIPCount' + $index] = false;
                            }
                        } else {
                            $scope['CompareIP' + $index] = true;
                        }
                    } else {
                        $scope['CompareIP' + $index] = true;
                    }
                }
            } else {
                var subnet_ip = model.Prefix.net;
                var subnet_prefix = model.Prefix.mask;
                // console.log(subnet_ip, subnet_prefix);
                var check_ip = IPAddressPattern.test(subnet_ip);
                if (subnet_ip && subnet_ip!="" && check_ip == true) {
                    $scope['subnetIPRule' + $index] = false;

                    // 檢查IP是否為muticast IP
                    var check_Multicast = multicastAddressPattern.test(subnet_ip);
                    if (check_Multicast == true) {
                        $scope['subnetIPMulticast' + $index] = true;
                    } else {
                        $scope['subnetIPMulticast' + $index] = false;

                        // IP 開頭不能為0, 127, 224, 240, 255
                        // IP不能以0,255结尾
                        var subnetIPStart = subnet_ip.split(".")[0];
                        var subnetIPEnd = subnet_ip.split(".")[3];
                        if (subnetIPStart == "0" || subnetIPStart == "127" || subnetIPStart == "224" || subnetIPStart == "240" || subnetIPStart == "255") {
                            $scope['subnetIPStartRule' + $index] = true;
                        } else {
                            $scope['subnetIPStartRule' + $index] = false;
                            if (subnetIPEnd == "255") {
                                $scope['subnetIPMulticast' + $index] = true;
                            } else {
                                $scope['subnetIPMulticast' + $index] = false;
                                //检查prefix范围
                                let prefix = parseInt(subnet_prefix)
                                if(subnet_prefix){
                                    if (prefix > 32 || prefix < 0) {
                                        $scope['toIPRule' + $index] = true;
                                    } else {
                                        if (prefix < 24) {
                                            $scope['prefixCount' + $index] = true;
                                        } else {
                                            $scope['prefixCount' + $index] = false;
                                        }
                                        $scope['toIPRule' + $index] = false;
                                    }
                                }else{
                                    $scope['toIPRule' + $index] = true;
                                }
                            }
                        }
                    }
                } else {
                    $scope['subnetIPRule' + $index] = true;
                }
            }

            if ($scope['fromIPRule' + $index] == true ||
                $scope['toIPRule' + $index] == true ||
                $scope['fromIPMulticast' + $index] == true ||
                $scope['toIPMulticast' + $index] == true ||
                $scope['fromIPStartRule' + $index] == true ||
                $scope['toIPStartRule' + $index] == true ||
                $scope['CompareIP' + $index] == true ||
                $scope['CalcIPCount' + $index] == true ||
                $scope['subnetIPRule' + $index] == true ||
                $scope['subnetIPMulticast' + $index] == true ||
                $scope['prefixCount' + $index] == true ||
                $scope['subnetIPStartRule' + $index] == true ) {
                $scope.checkResult[$index] = true;
            } else {
                $scope.checkResult[$index] = false;
            }
            $scope.nextDisabled();
        };

    // 有錯誤訊息時, next 按鈕為disabled狀態
    $scope.nextDisabled = function () {
        // console.log($scope.checkResult);
        if($scope.network.discover.layer3 && $scope.checkResult && $scope.checkResult.length>0){
            return $scope.checkResult.reduce((acc, cur) => acc || cur);
        }else{
            return false;
        }
    };

        $scope.resetGridSize = function (gridId) {
            $scope.show.tab1 = false;
            $scope.show.tab2 = false;
            if (gridId == 'user-grid-standalone') {
                $scope.show.tab1 = true;

            } else {
                $scope.show.tab2 = true;
            }

            setHeight(); //test

        };
        $scope.nodeEnv = Current.getNodeEnv();

        $scope.discoverTime = new Date();
        if (tag == 0) {
            $scope.exist0 = true;
            if (secondaryTime) {
                $scope.secondaryTime = true;
            }
            OrganizationService.listAllOrgs(function (orgs) {

                if (orgs && orgs.length > 0) {
                    $scope.org = orgs[0];
                    // 第一次加载时默认值设置
                    if (!$scope.org.devAccessPort) {
                        $scope.org.devAccessPort = 8443;
                        $scope.exist0 = false;
                    }
                    if (!$scope.org.country || Object.keys($scope.org.country).length == 0) {
                        $scope.org.country = $scope.selectCountries[0];
                        $scope.exist0 = false;
                    }
                    if (!$scope.org.timeZone || Object.keys($scope.org.timeZone).length == 0) {
                        $scope.org.timeZone = $scope.timeZones[0];
                        $scope.exist0 = false;
                    }
                    $scope.originalField.devAccessPort = $scope.org.devAccessPort;
                    $scope.originalField.webAccessPort = $scope.org.webAccessPort;
                    OrganizationService.getServerIPs(function (result) {
                        if (result.data) {
                            $scope.addresses = result.data;
                            $scope.addresses.push('other');

                            var k = $scope.org.devAccessAddress;
                            //console.log(k);
                            for (var i = 0; i < $scope.addresses.length; i++) {
                                if ($scope.addresses[i] == k) {
                                    break;
                                } else if (i == $scope.addresses.length - 1) {
                                    $scope.org.devAccessAddress = 'other';
                                    $scope.dataForShow.otherAddress = k;
                                }
                            }
                        }
                    })
                }
            });
        }
        /**
         * Add Network
         */
        NetworkService.getSiteInfo(function (result) {
            if (result.success) {
                $scope.sites = result.data;
                $scope.sites.unshift('newSite');
                $scope.site.exists = $scope.sites[0];
                if (network) {
                    var siteCopy = angular.copy(network.site);
                    $scope.site.exists = siteCopy;
                } else {
                    $scope.site.exists = $scope.sites[0];
                }
            }
        });
        $scope.checkPhrase = function () {
            $scope.phraseError = false;
            if ($scope.ssid.passPhrase && $scope.ssid.passPhrase.length == 64) {
                var re = /^[0-9A-Fa-f]{0,64}$/
                if (!re.test($scope.ssid.passPhrase)) {
                    $scope.phraseError = true;
                }
            }
        };

        /**
         * Network Configuration
         */
        $scope.authentications = [1, 8];
        $scope.statuses = [0, 1];
        $scope.selectCountries = utils.getCountries();
        $scope.timeZones = utils.getTimeZones();
        /**
         * Network Configuration
         */

        $scope.ssid = {
            ssid: 'dlink',
            authentication: 8,
            passPhrase: '',
            guestSSIDEnabled: false
            // i80211kvr: 1
        };
        $scope.devSet = { // 需要获取system setting数据并设置默认值
            countrycode: '',
            sntpTimeZoneIndex: '',
            userName: 'admin',
            password: '',
        };
        /**
         * Discovery Setting for Network
         */
        $scope.layerTypes = ['IP', 'Prefix'];
        // $scope.netmasks = [];
        // for (var i = 22; i <= 32; i++) {
        //     $scope.netmasks.push(i);
        // };

        $scope.layer2Click = function () {
            if (!$scope.network.discover.layer2) {
                $scope.network.discover.layer3 = true;
            }
            if ($scope.network.discover.layer3 && $scope.network.discover.layer3List.length <= 0) {
                $scope.checkResult[0] = true;
                $scope.addRange();
            }
            $scope.$broadcast('disabledChange', $scope.network.discover.layer3);
        }
        $scope.layer3Click = function () {
            if (!$scope.network.discover.layer3) {
                $scope.network.discover.layer2 = true;
            }
            if ($scope.network.discover.layer3) {
                if($scope.network.discover.layer3List.length <= 0){
                    $scope.checkResult[0] = true;
                    $scope.addRange();
                }
            }
            $scope.nextDisabled();
        }
        $scope.addRange = function () {
            var temp = {type: "IP", IP: {from: "", to: ""}, Prefix: {net: "", mask: 24}};
            $scope.network.discover.layer3List.push(temp);
            var length = $scope.network.discover.layer3List.length;
            $scope.checkResult.length = length;
            // console.log(length,$scope.checkResult);
            for (var i = 0; i < length; i++) {
                if ($scope.network.discover.layer3List[i].IP.from == "") {
                    $scope['fromIPRule' + i] = false;
                    $scope['fromIPMulticast' + i] = false;
                    $scope['fromIPStartRule' + i] = false;
                }
                if ($scope.network.discover.layer3List[i].IP.to == "") {
                    $scope['toIPRule' + i] = false;
                    $scope['toIPMulticast' + i] = false;
                    $scope['toIPStartRule' + i] = false;
                    $scope['CompareIP' + i] = false;
                    $scope['CalcIPCount' + i] = undefined;
                }
                if ($scope.network.discover.layer3List[i].Prefix.net == "") {
                    $scope['subnetIPRule' + i] = undefined;
                    $scope['subnetIPMulticast' + i] = undefined;
                    $scope['subnetIPStartRule' + i] = undefined;
                }
            }
        };

        function initStatus(index) {
            $scope['toIPRule' + index] = false;
            $scope['toIPMulticast' + index] = false;
            $scope['toIPStartRule' + index] = false;
            $scope['CompareIP' + index] = false;
            $scope['fromIPRule' + index] = false;
            $scope['fromIPMulticast' + index] = false;
            $scope['fromIPStartRule' + index] = false;
        }
        $scope.removeRange = function (index) {
            $scope.checkResult.splice(index,1);
            initStatus();
            $scope.network.discover.layer3List.splice(index, 1);
            //这个地方有个问题，就是在从上往下删除的时候，比如存在两个ip，1正常，2报错，删除1，那么2的报错会不见，
            // 因为此时配置的第二个ip的index的值变成了0，而显示错误代码拼接的值不变
            //console.log($scope['toIPRule1']);
            if ($scope.network.discover.layer3List.length <= 0) {
                $scope.validIP = "";
            }
            var length = $scope.network.discover.layer3List.length;
            //console.log(length);
            $timeout(function () {
                for (var i = 0; i < length; i++) {
                    $scope.checkModel($scope.network.discover.layer3List[i],i);
                }
            }, 2);

        };
        /**
         * Discovery
         */
        // discover step
        $scope.discoveryStep = 0;

        $scope.state = {
            msgTrue: TS.ts('configuration.discovery.msgTrue'),
            isSuccess: false,
            processing: false
        }
        $scope.startDiscovery = function () {
            $scope.state.isSuccess = false;
            $scope.state.processing = false;
            $scope.gridOptionsDiscovered.data = [];
            $scope.discoverTime = new Date();
            freshcount = 9 + $scope.network.discover.layer3List.length * 5;
            NetworkService.discoverByDDPv5($scope.network, function () {
                $timeout(function () {
                    refreshDev();
                }, 1000);
                $scope.discoveryStep = 1;
                $timeout(function () {
                    $scope.discoveryStep = 2;
                }, freshcount*1000)
            });
        };
        $scope.gridOptionsManaged = {
            enableRowSelection: true,
            selectionRowHeaderWidth: 40,
            columnDefs: [
                {
                    field: 'managedByNMS', minWidth: "100", maxWidth: "120", displayName: TS.ts('column.apState'),
                    cellTemplate: "<div class='ui-grid-cell-contents'>{{'addNetwork.state' + (row.entity.managedByNMS) | translate}}</div>"
                },
                {field: 'deviceIPAddr', minWidth: "120", maxWidth: "120", displayName: TS.ts('column.ipv4')},
                {field: 'MACAddr', minWidth: "120", maxWidth: "120", displayName: TS.ts('column.mac')},
                {field: 'modelName', minWidth: "100", maxWidth: "120", displayName: TS.ts('column.moduleType')},
                {field: 'nmsURL', minWidth: "140", maxWidth: "180", displayName: TS.ts('column.nmsURL')},
                {field: 'networkName', minWidth: "100", maxWidth: "120", displayName: TS.ts('column.network')},
                {
                    field: 'result.success', minWidth: "140", maxWidth: "160", displayName: TS.ts('column.applyResult'),
                    cellTemplate: "<div class='ui-grid-cell-contents'><span ng-if='row.entity.result'>{{row.entity.result.success?'common.success':(row.entity.result.success != undefined?'common.fail':'') | translate}}</span></div>"
                }
            ],
            onRegisterApi: function (gridApi) {
                $scope.gridApi_managed = gridApi;
            }
        }
        // Standalone 表格参数
        $scope.gridOptionsDiscovered = {
            enableRowSelection: true,
            selectionRowHeaderWidth: 40,
            columnDefs: [
                {
                    field: 'managedByNMS', minWidth: "100", maxWidth: "120", displayName: TS.ts('column.apState'),
                    cellTemplate: "<div class='ui-grid-cell-contents'>{{'addNetwork.state' + (row.entity.managedByNMS) | translate}}</div>"
                },
                {field: 'deviceIPAddr', minWidth: "120", maxWidth: "120", displayName: TS.ts('column.ipv4')},
                {field: 'MACAddr', minWidth: "120", maxWidth: "120", displayName: TS.ts('column.mac')},
                {field: 'modelName', minWidth: "100", maxWidth: "120", displayName: TS.ts('column.moduleType')},
                {field: 'nmsURL', minWidth: "140", maxWidth: "180", displayName: TS.ts('column.nmsURL')},
                {field: 'networkName', minWidth: "100", maxWidth: "120", displayName: TS.ts('column.network')},
                {
                    field: 'result.success', minWidth: "140", maxWidth: "160", displayName: TS.ts('column.applyResult'),
                    cellTemplate: "<div class='ui-grid-cell-contents'><span ng-if='row.entity.result'>{{row.entity.result.success?'common.success':(row.entity.result.success!=undefined?'common.fail':'') | translate}}</span></div>"
                }
            ],
            onRegisterApi: function (gridApi) {
                $scope.gridApi = gridApi;
            }
        };

        $scope.authentic = {
            authenticUserName: "admin",
            authenticPassword: "admin"
        };

        // Standalone apply
        $scope.apply = function () {
            $scope.state.processing = true;
            $scope.state.isSuccess = false;


            var target = [];

            // InventoryService.getDevicesTotal(function (result) {
            //     if(result.success){
            //        var currentTotal = result.data.total;
            //todo 把表格数据清除
            var standaloneSelected = $scope.gridApi ? $scope.gridApi.selection.getSelectedRows() : [];
            var managedSelected = $scope.gridApi_managed ? $scope.gridApi_managed.selection.getSelectedRows() : [];
            if ($scope.show.tab1 && standaloneSelected.length > 0) {
                for (var i = 0; i < standaloneSelected.length; i++) {
                    //if((currentTotal+target.length) < 100){ //最多100个AP
                    standaloneSelected[i].result = {};
                    target.push(standaloneSelected[i]);
                    //}else{
                    //alert("最多100个AP");
                    //    $scope.state.msgTrue= TS.ts('configuration.discovery.msgLimit');
                    //    break;
                    //}
                }
            } else if ($scope.show.tab2 && managedSelected.length > 0) {
                for (var i = 0; i < managedSelected.length; i++) {
                    //if((currentTotal+target.length) < 100){ //最多100个AP
                    managedSelected[i].result = {};//清除result的数据
                    target.push(managedSelected[i]);
                    //}else{
                    //alert("最多100个AP");
                    //    $scope.state.msgTrue= TS.ts('configuration.discovery.msgLimit');
                    //    break;
                    //}
                }
            }
            NetworkService.setAGProfile($scope.network, target,
                $scope.authentic, function (result) {
                    if (result.success) {
                        $scope.state.processing = false;
                        $scope.state.isSuccess = true;
                        freshcount = 10;
                        $timeout(function () {
                            refreshDev();
                        }, 1000);
                    }
                });
            //     }else{
            //         var currentTotal = 0;
            //     }
            // })
        };

        /************************************************
         * 数据绑定
         ************************************************/
        /**
         * Add Network
         */

        if (network) {
            $scope.network = angular.copy(network);
        } else {
            $scope.network = {
                orgId: Current.org().orgId,
                name: 'Network1',
                discover: {
                    layer2: true,
                    layer3: false,
                    layer3List: []
                }
            };
        }
        $scope.sites = [];
        $scope.site = {
            exists: '',
            custom: ''
        };
        $scope.securityChange = function (item, model) {

        }
        /**
         * Discovery Setting for Network
         */


        OrganizationService.listAllOrgs(function (orgs) {
            if (orgs && orgs.length > 0) {
                $scope.org = orgs[0];
                if (!$scope.org.country || Object.keys($scope.org.country).length == 0) {
                    $scope.org.country = $scope.selectCountries[0];
                }
                if (!$scope.org.timeZone || Object.keys($scope.org.timeZone).length == 0) {
                    $scope.org.timeZone = $scope.timeZones[0];
                }
                $scope.devSet.countrycode = $scope.org.country;
                OrganizationService.getDateAndTime(function (result) {
                    if (result.success) {
                        $scope.devSet.sntpTimeZoneIndex = utils.getTimeZones()[result.data.timeZone.id - 1];
                    } else {
                        $scope.devSet.sntpTimeZoneIndex = $scope.org.timeZone;
                    }
                });
            }
        });
        /**
         * Discovery
         */

        /************************************************
         * step 操作
         ************************************************/
        // 验证提示
        $scope.error = {
            nameRepeat: false,
            newSiteEmpty: false,
            schoolIdRepeat: false,
            netNameCheck: false
        };
        var freshcount = 5;
        var refreshDiscover = false;

        function refreshDev() {
            freshcount--;
            var standaloneSelected = $scope.gridApi ? $scope.gridApi.selection.getSelectedRows() : [];
            var managedSelected = $scope.gridApi_managed ? $scope.gridApi_managed.selection.getSelectedRows() : [];
            if ($scope.gridApi)
                $scope.gridApi.selection.clearSelectedRows();
            if ($scope.gridApi_managed)
                $scope.gridApi_managed.selection.clearSelectedRows();
            NetworkService.getDiscoveredDevices($scope.discoverTime, $scope.network.agentUUID, function (result) {
                $scope.gridOptionsDiscovered.data = [];
                $scope.gridOptionsManaged.data = [];
                if (result.success == true && result.data) {
                    for (var i = 0; i < result.data.length; i++) {
                        if (result.data[i].managedByNMS == 0 || result.data[i].managedByNMS == 1) {
                            $scope.gridOptionsDiscovered.data.push(result.data[i]);
                        } else {
                            $scope.gridOptionsManaged.data.push(result.data[i]);
                        }
                    }
                    $timeout(function () {
                        standaloneSelected.forEach(function (entity) {
                            if (!$scope.gridApi) return;
                            $scope.gridOptionsDiscovered.data.forEach(function (row) {
                                if (row._id == entity._id) {
                                    $scope.gridApi.selection.selectRow(row);
                                }
                            })
                        });
                        managedSelected.forEach(function (entity) {
                            $scope.gridOptionsManaged.data.forEach(function (row) {
                                if (!$scope.gridApi_managed) return;
                                if (row._id == entity._id) {
                                    $scope.gridApi_managed.selection.selectRow(row);
                                }
                            })
                        });
                    }, 100);
                }
                if (refreshDiscover) {
                    if (freshcount >= 0) {
                        $timeout(function () {
                            refreshDev();
                        }, 1000);
                    }

                }
            });
        }

        function logout() {
            if ($scope.org.ipAddress) {
                $scope.org.webAccessPort = $scope.org.webAccessPort || 443;
                window.location = "https://" + $scope.org.ipAddress + ":" + $scope.org.webAccessPort;
            }
            else {
                window.location = '/';
            }
        };

        function updateSystemSetting(isPortChanged) {
            var param = angular.copy($scope.org);
            if (param.devAccessAddress == 'other') {
                param.devAccessAddress = $scope.dataForShow.otherAddress
            }
            OrganizationService.updateSystemSetting(param, function (result) {
                if (result.success) {
                    if (isPortChanged) {
                        OrganizationService.restartMonitoring(function (result) {
                        });
                        setTimeout(function () {
                            logout();
                        }, 2000);
                    } else {
                        $scope.step += 1;
                    }
                }
            });
        }

        // 下一步
        $scope.next = function () {
            refreshDiscover = false;
            if ($scope.step == 0) {
                if ($scope.originalField.devAccessPort != $scope.org.devAccessPort ||
                    $scope.originalField.webAccessPort != $scope.org.webAccessPort) {
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
                                updateSystemSetting(true);
                            };
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                        }
                    });
                } else {
                    updateSystemSetting(false);
                }


                // var param = angular.copy($scope.org);
                // if (param.devAccessAddress == 'other') {
                //     param.devAccessAddress = $scope.dataForShow.otherAddress
                // }
                //
                // OrganizationService.updateSystemSetting(param, function (result) {
                //     if (result.success) {
                //         $scope.step += 1;
                //     }
                // });
            }
            else if ($scope.step == 1) {

                if (tag == 0) {
                    OrganizationService.listAllOrgs(function (orgs) {
                        if (orgs && orgs.length > 0) {
                            $scope.org = orgs[0];
                            if (!$scope.org.country || Object.keys($scope.org.country).length == 0) {
                                $scope.org.country = $scope.selectCountries[0];
                            }
                            if (!$scope.org.timeZone || Object.keys($scope.org.timeZone).length == 0) {
                                $scope.org.timeZone = $scope.timeZones[0];
                            }
                            if (!$scope.devSet.countrycode) {
                                $scope.devSet.countrycode = $scope.org.country;
                            }
                            OrganizationService.getDateAndTime(function (result) {
                                if (result.success) {
                                    if (!$scope.devSet.sntpTimeZoneIndex) {
                                        $scope.devSet.sntpTimeZoneIndex = utils.getTimeZones()[result.data.timeZone.id - 1];
                                    }
                                } else {
                                    if (!$scope.devSet.sntpTimeZoneIndex) {
                                        $scope.devSet.sntpTimeZoneIndex = $scope.org.timeZone;
                                    }
                                }
                            });
                        }
                    });
                }

                if ($scope.site.exists == 'newSite') {
                    if (!$scope.site.custom) {
                        $scope.error.newSiteEmpty = true;
                        return;
                    }
                    $scope.network.site = $scope.site.custom;
                } else {
                    $scope.network.site = $scope.site.exists;
                }
                if (network) {
                    NetworkService.addOrUpdateNetwork({
                        network: $scope.network
                    }, function (result) {
                        if (result.success) {
                            $scope.network = result.data;
                            $scope.step += 2;
                        } else {
                            if (result.error == 1) {
                                $scope.error.nameRepeat = true;
                                $scope.netNameBlur = true;
                            } else if (result.error == 2) {
                                $scope.error.schoolIdRepeat = true;
                                $scope.schoolIdBlur = true;
                            } else if (result.error == 4) {
                                alert(TS.ts('addNetwork.ssidExhaust'));
                            } else if (result.error == 3) {
                                $scope.error.repeatGuestSSIDAddName = true;
                                $scope.guestSSIDAddNameBlur = true;
                            }
                        }
                    });
                } else {
                    // if (!$scope.ssid.authentication) {
                    //     switch ($scope.ssid.authentication) {
                    //         case 1:
                    //             $scope.ssid.authentication = 101;
                    //             break;
                    //         case 8:
                    //             $scope.ssid.authentication = 108;
                    //             break;
                    //         default:
                    //             $scope.ssid.authentication = 108;
                    //             break;
                    //     }
                    // }
                    if (!$scope.ssid.authentication) {
                        $scope.ssid.authentication = 8;
                    }
                    NetworkService.checkNetworkName({
                        network: $scope.network
                    }, function (result) {
                        if (result.success) {
                            if ($scope.nodeEnv == "Production_hualian") {
                                NetworkService.checkSchoolID({
                                    network: $scope.network
                                }, function (result) {
                                    if (result.success) {
                                        $scope.step += 1;
                                    } else {
                                        if (result.error == 1) {
                                            $scope.error.schoolIdRepeat = true;
                                            $scope.schoolIdBlur = true;
                                        }
                                    }
                                });
                            } else {
                                $scope.step += 1;
                                /*   $timeout(function () {
                                 document.getElementById("ssidName").focus(); document.getElementById("ssidName").click();
                                 }, 500);*/

                            }
                        } else {
                            if (result.error == 1) {
                                $scope.error.nameRepeat = true;
                                $scope.netNameBlur = true;
                            }
                        }
                    });
                }

            } else if ($scope.step == 2) {
                // if (!$scope.ssid.authentication) {
                //     switch ($scope.ssid.authentication) {
                //         case 1:
                //             $scope.ssid.authentication = 101;
                //             break;
                //         case 8:
                //             $scope.ssid.authentication = 108;
                //             break;
                //         default:
                //             $scope.ssid.authentication = 108;
                //             break;
                //     }
                // }

                if (!$scope.ssid.authentication) {
                    $scope.ssid.authentication = 8;
                }
                if ($scope.ssid.guestSSIDName == $scope.ssid.ssid) return;
                NetworkService.addOrUpdateNetwork({
                    network: $scope.network,
                    devSet: $scope.devSet,
                    ssid: $scope.ssid
                }, function (result) {
                    if (result.success) {
                        $scope.network = result.data;
                        $scope.step += 1;
                        //step变成3了,默认放在第二层设备勾选上
                        $timeout(function () {
                            document.getElementById("checkbox_layer2").focus();
                        }, 100);
                        //发事件给networkController刷新当前页面
                        $rootScope.$broadcast('freshNetwork');
                    } else {
                        if (result.error == 1) {
                            $scope.error.nameRepeat = true;
                        } else if (result.error == 2) {
                            $scope.error.schoolIdRepeat = true;
                        } else if (result.error == 5) {
                            $scope.error.devicePassword = true;
                        }
                    }
                });

            } else if ($scope.step == 3) {
                /* NetworkService.addOrUpdateNetwork({network: $scope.network}, function (result) {
                 if (result.success) {
                 $scope.network = result.data;
                 }
                 });*/
                $scope.step += 1;
                refreshDiscover = true;
                freshcount = 9 + $scope.network.discover.layer3List.length * 5;
                $timeout(function () {
                    document.getElementById("discover_button").focus();
                }, 500);
                /*  $timeout(function () {
                      refreshDev();
                  }, 1000);*/

            } else {

            }
            // do something

        };
        // 上一步
        $scope.pre = function () {
            refreshDiscover = false;
            if (network && $scope.step == 3) $scope.step -= 1;
            $scope.step -= 1;
        };
        // 取消
        $scope.exit = function () {
            refreshDiscover = false;
            if ($scope.step == 1) {
                $uibModalInstance.dismiss('cancel');
            } else if ($scope.step == 2) {
                //新建时保存network和生成default profile
                /* NetworkService.addOrUpdateNetwork({network: $scope.network}, function (result) {
                 if (result.success) {
                 $uibModalInstance.dismiss('exit');
                 }
                 });*/
                $uibModalInstance.dismiss('exit');
            } else {
                $uibModalInstance.dismiss('exit');
            }

        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
        /**
         * 文件名禁用字符
         */
        // $scope.aliasKeydown = function($event){
        //     var re = /^[\/:*?"<>|]+$/;
        //     // if (event.ctrlKey || !re.test($event.key)) { // 禁止粘贴(禁止ctrl+ 组合键)
        //     //     $event.preventDefault();
        //     // };
        //     if (re.test($event.key)) {
        //         $event.preventDefault();
        //     };
        // }

        $scope.addressRe = /^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$|^([http://]|[https://])?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/;

    });
});
