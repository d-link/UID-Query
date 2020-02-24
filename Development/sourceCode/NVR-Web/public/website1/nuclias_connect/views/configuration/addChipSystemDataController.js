/**
 * Created by 李莉红 on 2019/4/23.
 */
define(["app"], function (app) {
    app.register.controller('addChipSystemDataController', function ($scope, $location, $uibModalInstance, OrganizationService, NetworkService, tag, network, Current, utils, $timeout, TS, Auth, $uibModal) {

        /************************************************
         * 弹窗基本信息
         ************************************************/
        /**
         * 基本信息
         */
        $scope.getIPAddressFrom = ["static", "dhcp"];
        $scope.ifDHCP = true;//判断是否可以填写
        if (network) $scope.titleArr[1] = 'en';
        $scope.timeZones = utils.getTimeZones();
        $scope.disabledDateAndTime = true;//可以编辑
        $scope.currentTime = new Date("2019-01-01T12:00:00").toISOString();
        $scope.dateAndTime = {
            date: new Date("2019-01-01T12:00:00").toISOString(),
            time: new Date("2019-01-01T12:00:00").toISOString()
        };
        //输入的对象
        $scope.inputField = {};
        //如果初始的时候就在console里面设置了值，就不要清空
        $scope.isIpType = false;
        //校验用到的变量
        $scope.serverRe = utils.serverRe;
        $scope.subMaskRe = utils.subMaskRe;
        $scope.gateway = utils.gateway;
        $scope.invalidIP = utils.setinvalidIP();
        $scope.invalidTimeZone = false;
        $scope.originalIpAddress = "";
        $scope.originalSubnetMask = "";
        $scope.originalGateWay = "";
        $scope.state = {
            processing: false,
            isError: false,
            msgFalse: "settings.usbStorageFailed1"
        };
        if (tag == 0) {
            OrganizationService.listAllOrgs(function (orgs) {
                if (orgs && orgs.length > 0) {
                    $scope.org = orgs[0];
                    OrganizationService.getDateAndTime(function (result) {
                        if (result.success) {
                            $scope.org.enableNTP = result.data.enableNTP;
                            $scope.org.NTPServer = result.data.NTPServer;
                            $scope.org.defaultNTPServer = result.data.defaultNTPServer || "ntp1.dlink.com";
                            $scope.org.timeZone = utils.getTimeZones()[result.data.timeZone.id - 1];
                            if (result.data.datetime) {
                                $scope.currentTime = new Date(result.data.datetime).toISOString();
                                $scope.dateAndTime = {date: $scope.currentTime, time: $scope.currentTime};
                                $scope.$broadcast('dateAndTime', $scope.dateAndTime);
                            }
                        }
                        $scope.inputField.NTPServer = $scope.org.NTPServer;
                        if ($scope.org.enableNTP == 1) {
                            $scope.org.enableNTP = true;
                        } else {
                            $scope.org.enableNTP = false;
                        }
                        OrganizationService.getLANSetting(function (res) {
                            if (res.success) {
                                if (res.data.ipType) {
                                    $scope.isIpType = true;
                                }
                                $scope.org.ipType = res.data.ipType;
                                $scope.org.ipAddress = res.data.ipAddress;
                                $scope.org.subnetMask = res.data.subnetMask;
                                $scope.org.defaultGateWay = res.data.defaultGateWay;
                                $scope.org.primaryDNS = res.data.primaryDNS;
                                $scope.org.secondDNS = res.data.secondDNS;
                            }
                            // res.data = {
                            //     "ipType": "dhcp",
                            //     "ipAddress": "172.18.192.140",
                            //     "subnetMask": "255.255.255.0",
                            //     "defaultGateWay": "172.18.192.1",
                            //     "primaryDNS": "211.142.210.100",
                            //     "secondDNS": "8.8.8.8",
                            //     "NTPServer":"1111"
                            // };
                            initChipData();
                            $scope.org.ipType = res.data.ipType;
                            $scope.org.ipAddress = res.data.ipAddress;
                            $scope.org.subnetMask = res.data.subnetMask;
                            $scope.org.defaultGateWay = res.data.defaultGateWay;
                            $scope.org.primaryDNS = res.data.primaryDNS;
                            $scope.org.secondDNS = res.data.secondDNS;
                            if ($scope.org.ipType == "static") {
                                if ($scope.org.changeDAA == 0) {
                                    $scope.org.changeDAA = false;
                                } else if ($scope.org.changeDAA == 1) {
                                    $scope.org.changeDAA = true;
                                }
                            }
                            //多选框置灰
                            if ($scope.org.ipType == "dhcp") {
                                $scope.org.changeDAA = undefined;
                                setTimeout(function () {
                                    if (document.getElementById("changeDAA_checkbox") && !document.getElementById("changeDAA_checkbox").disabled) {
                                        document.getElementById("changeDAA").disabled = true;
                                        document.getElementById("changeDAA_checkbox").style.backgroundColor = "#f5f5f5";
                                        document.getElementById("changeDAA_checkbox").style.border = "1px dashed #ddd";
                                        document.getElementById("changeDAA_checkbox").style.color = "#aaa";
                                    }
                                }, 0)
                            }
                            $scope.originalIpAddress = $scope.org.ipAddress;
                            $scope.originalSubnetMask = $scope.org.subnetMask;
                            $scope.originalGateWay = $scope.org.defaultGateWay;
                            //输入框copy一份数据
                            $scope.inputField.ipAddress = $scope.org.ipAddress;
                            $scope.inputField.subnetMask = $scope.org.subnetMask;
                            $scope.inputField.defaultGateWay = $scope.org.defaultGateWay;
                            $scope.inputField.primaryDNS = $scope.org.primaryDNS;
                            $scope.inputField.secondDNS = $scope.org.secondDNS;
                        });
                    });

                }
            });
        }

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
            if ($scope.org.enableNTP && !$scope.org.NTPServer) {
                $scope.org.NTPServer = "";
            }
            if (!$scope.org.defaultNTPServer) {
                $scope.org.defaultNTPServer = "ntp1.dlink.com";
            }

            if (!$scope.org.timeZone) {
                $scope.org.timeZone = $scope.timeZones[0];
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
        /*拷贝电脑时间显示，这个时候要往子组件下传时间，子组件因为是两个对象分开所以要对象*/
        $scope.copyTimeFormComputer = function () {
            $scope.invalidDate = false;//按钮变为可用
            $scope.dateAndTime = {date: new Date().toISOString(), time: new Date().toISOString(), timeError: false};
            $scope.$broadcast('dateAndTime', $scope.dateAndTime);
        };
        //date部分按钮不能使用部分
        $scope.invalidDate = false;//定义
        $scope.$on('disableButton', function (event, data) {
            $scope.invalidDate = data;
            $scope.childInvalidDate = data;
        });
        //NTPchange
        $scope.$watch('org.enableNTP', function () {
            if ($scope.org) {
                if (!$scope.org.enableNTP || $scope.org.enableNTP == false) {
                    //$scope.org.NTPServer = "";
                    $scope.disabledDateAndTime = false;//可以编辑
                    $scope.invalidDate = $scope.childInvalidDate;//把原来的值赋值给父组件
                } else if ($scope.org.enableNTP == true) {
                    $scope.org.NTPServer = $scope.inputField.NTPServer;
                    $scope.disabledDateAndTime = true;//不可以编辑
                    if ($scope.invalidDate) {
                        $scope.invalidDate = false;
                    }
                }
            }
            $scope.$broadcast('enableDateAndTime', $scope.disabledDateAndTime);
        });
        $scope.$on('dateAndTimeChange', function (event, data) {
            $scope.currentTime = new Date(data);
            $scope.dateAndTime = {date: new Date(data).toISOString(), time: new Date(data).toISOString()}
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

        // 保存板子上系统配置的数据
        $scope.saveChipSystemData = function () {
            if ($scope.org.enableNTP == false) {
                $scope.org.enableNTP = 0;
            } else if ($scope.org.enableNTP == true) {
                $scope.org.enableNTP = 1;
            }
            if ($scope.org.changeDAA == false) {
                $scope.org.changeDAA = 0;
            } else if ($scope.org.changeDAA == true) {
                $scope.org.changeDAA = 1;
            }
            if ($scope.org.changeDAA == 1) {//因为没改changeDAA这个checkbox的时候，ip会不同步
                $scope.org.devAccessAddress = $scope.org.ipAddress;
            }
            var cliSetting = handleOrgFiled();
            var dbSetting = {
                _id: $scope.org._id,
                //timeZone: $scope.org.timeZone,
                //devAccessAddress: $scope.org.devAccessAddress,
                webAccessAddress: $scope.org.ipAddress,
                basicConfigured: 1
            };
            var changeIPAddress = false;
            if ($scope.org.ipAddress != $location.host() ||
                $scope.org.ipAddress != $scope.originalIpAddress ||
                $scope.org.subnetMask != $scope.originalSubnetMask ||
                $scope.org.defaultGateWay != $scope.originalGateWay ||
                $scope.org.ipType == "dhcp") {
                changeIPAddress = true;
            }
            if (changeIPAddress) {
                //如果ip被改了，那就要弹出提示框，提示会断网
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
                            //弹框之后确认保存设置同步到lansetting
                            updateChipSystem(cliSetting, dbSetting, changeIPAddress);
                        };
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                });
            } else {
                updateChipSystem(cliSetting, dbSetting, changeIPAddress);
            }

        };

        function updateChipSystem(cliSetting, dbSetting, changeIPAddress) {
            $scope.state.processing = true;
            $scope.state.isError = false;
            OrganizationService.updateChipSystemSetting(cliSetting, dbSetting, function (result) {
                if (result.success || (!result.success && changeIPAddress && result.error == 408)) {
                    $scope.state.processing = false;
                    setTimeout(function () {
                        logout();
                    }, 2000);
                } else {
                    $scope.state.processing = false;
                    $scope.state.isError = true;
                    if (result.error == 0) {
                        $scope.state.msgFalse = "syslog.serverity.Error";
                    }
                    else if (result.error == 40001) {
                        $scope.state.msgFalse = "settings.usbStorageFailed1";
                    }
                    else {
                        $scope.state.msgFalse = "syslog.serverity.Error";
                    }

                }
            });
        }

        function handleOrgFiled() {
            let NTP = $scope.org.NTPServer;
            let time = "";
            let defaultNTPServer = "ntp1.dlink.com";
            let data =
                {
                    "LAN": {
                        "type": $scope.org.ipType,
                        "ip": $scope.org.ipAddress,
                        "mask": $scope.org.subnetMask,
                        "gateway": $scope.org.defaultGateWay,
                        "dns": $scope.org.primaryDNS,
                        "changeDAA": $scope.org.changeDAA,
                        "secDNS": $scope.org.secondDNS
                    },
                    "Date": {
                        "Datetime": time,
                        "Timezone": $scope.org.timeZone.id
                    },
                    "NTP": NTP,
                    "defaultNTPServer": defaultNTPServer,
                    "enableNTP": $scope.org.enableNTP
                }
            return data;
        }

        // public 输入框限制输入
        $scope.IPKeydown = function ($event) {
            utils.IPKeydown($event);
        };
        $scope.IPKeyup = function (key) {
            utils.IPKeyup(key, $scope.org);
            $scope.inputField[key] = $scope.org[key];
        };

        function logout() {
            if ($scope.org.ipAddress) {
                $scope.org.webAccessPort = $scope.org.webAccessPort || 443;
                window.location = "https://" + $scope.org.ipAddress + ":" + $scope.org.webAccessPort;
            }
            else {
                window.location = '/';
            }
        };
        //选择选项变动的时候清除数据
        $scope.$watch('org.ipType', function (value) {
            if ($scope.isIpType == true) {//如果在console设置过了就不用再清空了
                $scope.ifDHCP = (value && value == "dhcp" ? true : false);
                $scope.isIpType = false;
                return
            }
            if (value && value == "dhcp") {
                //清除所有数据
                $scope.ifDHCP = true;//不可以填写
                //deleteChipData();
                document.getElementById("changeDAA").disabled = true;
                document.getElementById("changeDAA_checkbox").style.backgroundColor = "#f5f5f5";
                document.getElementById("changeDAA_checkbox").style.border = "1px dashed #ddd";
                document.getElementById("changeDAA_checkbox").style.color = "#aaa";

            } else if (value && value == "static") {
                // 填上默认数据
                $scope.ifDHCP = false;//可以填写
                initChipData();
                document.getElementById("changeDAA").disabled = "";
                document.getElementById("changeDAA_checkbox").style.backgroundColor = "";
                document.getElementById("changeDAA_checkbox").style.border = "";
                document.getElementById("changeDAA_checkbox").style.color = "";
            }

        });
        $scope.$watch('org.changeDAA', function (value) {
            if (value && value == true) {
                //把ipadress賦值给daa
                $scope.org.devAccessAddress = $scope.org.ipAddress;
            } else if (value != undefined && value == false) {
                // 清除daa数据
                $scope.org.devAccessAddress = "";
            }
        });
        $scope.$watch('org.timeZone', function (value) {
            if (!value || Object.keys(value).length === 0) {
                $scope.invalidTimeZone = true;
            } else {
                $scope.invalidTimeZone = false;
            }
        });
        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        $scope.addressRe = /^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$|^([http://]|[https://])?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/;

    });
});
