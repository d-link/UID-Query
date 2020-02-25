/**
 * Created by lizhimin on 2017/6/9.
 */
define(["app"], function (app) {
    app.register.controller('siteSsidController', function ($scope, Current, BatchConfigService, $uibModal, $timeout, Upload, ajaxService, OrganizationService, TS, $translate) {
        $scope.hasPrivilege = Current.user().role == "root admin" || Current.user().role == "local admin";
        $scope.showpage = {
            'Security': true,
            'Access control': false,
            'User Authentication': false,
            'Hotspot 2.0': false
        };
        $scope.show111 = function (aa) {
            $scope.showpage[aa] = !$scope.showpage[aa];
        };
        var currentLang = $translate.proposedLanguage() || $translate.use();
        if (currentLang == 'fr' || currentLang == 'es' || currentLang == 'de' || currentLang == 'ru' || currentLang == 'tk' || currentLang == 'it') {
            $scope.showSInput = true;
        } else {
            $scope.showSInput = false;
        }
        OrganizationService.getNodeEnv(function (result) {
            if (result.success) {
                $scope.nodeEnv = result.data == "Production_hualian";
                if ($scope.nodeEnv) {
                    $scope.authType.push(10);
                    $scope.authType1.push(10);
                }
            }
        });
        $scope.state = {
            ssid: {
                isSuccess: false,
                isError: false,
                processing: false,
                msgTrue: 'configuration.ssid.msgTrue',
                msgFalse: 'configuration.ssid.msgFalse'
            },
            template: {
                isError: false,
                msgFalse: 'configuration.ssid.msgFalse'
            }
        };
        /*
         * 页面固定参数
         */
        $scope.statuses = [0, 1];
        $scope.bands = [1, 2, 3];
        $scope.status = [0, 1, 2];
        $scope.ipProtocol = [1, 6, 17];
        $scope.characterSets = [1, 2];
        $scope.types = ['0', 1];
        $scope.ssidIndexs = [1, 2, 3, 4, 5, 6, 7, 8];
        $scope.accessNetworkType = [0, 1, 2, 3, 4, 5, 14, 15];
        $scope.language = ['en', 'fr', 'de', 'es', 'pt', 'ru', 'it', 'tr'];
        $scope.networkAuthType = ['00', '01', '02', '03'];
        $scope.iconType = ['image/png', 'image/jpeg', 'image/gif', 'image/tiff', 'image/svg+xml'];
        $scope.OSUConfig = [0, 1];
        $scope.ipAddressTypeAvailability = [0, 4, 8, 12, 16, 20, 24, 28, 1, 2];
        $scope.wanLinkStatus = [1, 2, 3];
        $scope.option = [0, 1];
        //增加10:802.1x by lizhimin
        //2019/7/4
        $scope.authentications = [1, 6, 7, 8, 9, 10]; //remove 4,5
        $scope.cipherTypes = [1, 2, 3];
        $scope.keyTypes = [1, 2]
        $scope.keyIndexs = [1, 2, 3, 4];
        $scope.accessStatuses = [1, 2, 3];

        $scope.authType = [0, 1, 2, 4, 5, 6, 7, 8, 9, 11]; // 0: Disabled, 1: Web Redirection Only, 2:Username/Password, 4:Remote RADIUS,
        //5: LDAP, 6: POP3, 7: Passcode, 8: External Captive Portal, 9: MAC Address, 11: Service Level Agreement
        $scope.authType1 = ['0', 1, 2, 4, 5, 6, 8, 9, 11];
        $scope.ldaps = ['0', 1];
        $scope.radiusTypes = ['0', 1];
        $scope.POP3ConnectTypes = ['0', 1];
        $scope.IPIFIpFroms = [1, 2];
        $scope.websites = ['http://', 'https://'];
        $scope.websiteType = {select: $scope.websites[0]};
        $scope.websiteType1 = {select: $scope.websites[0]};
        $scope.websiteType2 = {select: $scope.websites[0]};
        $scope.rsSetTemps = [
            {
                id: 1,
                label: '',
                temp: ['firstRadiusServer', 'firstRadiusPort', 'firstRadiusSecret', 'firstRadiusType'],
                serverBlur: false,
                secretBlur: false
            },
            {
                id: 2,
                label: 'secondary',
                temp: ['secondRadiusServer', 'secondRadiusPort', 'secondRadiusSecret', 'secondRadiusType'],
                serverBlur: false,
                secretBlur: false
            },
            {
                id: 3,
                label: 'third',
                temp: ['thirdRadiusServer', 'thirdRadiusPort', 'thirdRadiusSecret', 'thirdRadiusType'],
                serverBlur: false,
                secretBlur: false
            },
        ];
        $scope.i8021kvrChoice = function (item, model) {
            if ($scope.temporary.i80211kvr == 1) {
                $scope.cipherTypes = [1, 2];
                if ($scope.temporary.cipherType == 3) {
                    $scope.temporary.cipherType = 1;
                }
            } else {
                $scope.cipherTypes = [1, 2, 3];
            }
        }
        $scope.bandChoice = function (item, model) {
            if (($scope.temporary.band == 1 && $scope.passcodeType.type24 > 1) || ($scope.temporary.band == 2 && $scope.passcodeType.type5 > 1) || ($scope.temporary.band == 3 && $scope.passcodeType.type52 > 1)) {
                if ($scope.temporary.authType == 7) {
                    $scope.temporary.authType = 0;
                }
            }
            if ($scope.temporary.band == 1) {
                $scope.temporary.wmm = $scope.performanceData.band24.wmm ? 1 : '0';
                if ($scope.performanceData.band24.wirelessMode == 3) {
                    $scope.authentications = [1, 6, 7, 8, 9];
                    if ($scope.temporary.authentication == 10) {
                        $scope.temporary.authentication = 1;
                    }
                } else {
                    $scope.authentications = [1, 6, 7, 8, 9, 10];
                }
            }
            if ($scope.temporary.band == 2) {
                $scope.temporary.wmm = $scope.performanceData.band5.wmm ? 1 : '0';
                if ($scope.performanceData.band5.wirelessMode == 6) {
                    $scope.authentications = [1, 6, 7, 8, 9];
                    if ($scope.temporary.authentication == 10) {
                        $scope.temporary.authentication = 1;
                    }
                } else {
                    $scope.authentications = [1, 6, 7, 8, 9, 10];
                }
            }
            if ($scope.temporary.band == 3) {
                $scope.temporary.wmm = $scope.performanceData.secBand5.wmm ? 1 : '0';
                if ($scope.performanceData.secBand5.wirelessMode == 6) {
                    $scope.authentications = [1, 6, 7, 8, 9];
                    if ($scope.temporary.authentication == 10) {
                        $scope.temporary.authentication = 1;
                    }
                } else {
                    $scope.authentications = [1, 6, 7, 8, 9, 10];
                }
            }
        };
        $scope.macAddressTemporary = {
            mac: '',
            file: null
        };
        $scope.ipFilterTemporary = {
            ipAddress: '',
            subMask: ''
        };
        $scope.userPassTemporary = {
            username: '',
            password: ''
        };
        $scope.macByPass = {
            mac: ''
        };
        $scope.gardenTemporary = {ip: ''};
        $scope.macByPassTemporary = {
            file: null
        }
        // grid
        $scope.SSIDOptions = {
            columnDefs: [
                {
                    field: 'ssidIndex', enableHiding: false, displayName: TS.ts('column.index'), width: "15%", sort: {
                        direction: 'asc',
                        priority: 1
                    },
                    cellTemplate: "<div class='ui-grid-cell-contents'><span>{{'configuration.band.ssid' + row.entity.ssidIndex | translate}}</span></div>"
                },
                {
                    field: 'band', enableHiding: false, displayName: TS.ts('column.band'), width: "15%", sort: {
                        direction: 'asc',
                        priority: 2
                    },
                    cellTemplate: "<div class='ui-grid-cell-contents'><span>{{'configuration.band' + row.entity.band | translate}}</span></div>"
                },
                {field: 'ssid', enableHiding: false, displayName: TS.ts('column.ssid'), width: "15%"},
                {
                    field: 'authentication', enableHiding: false, displayName: TS.ts('column.security'), width: "15%",
                    cellTemplate: "<div class='ui-grid-cell-contents'><span>{{'configuration.ssid.security' + row.entity.authentication | translate}}</span></div>"
                },
                {
                    field: 'macAccessControl',
                    enableHiding: false,
                    displayName: TS.ts('column.accessControl'),
                    width: "15%",
                    cellTemplate: "<div class='ui-grid-cell-contents'><span>{{'configuration.ssid.action' + row.entity.macAccessControl | translate}}</span></div>"
                },
                {
                    field: 'authType', enableHiding: false, displayName: TS.ts('column.userAuth'), width: "15%",
                    cellTemplate: "<div class='ui-grid-cell-contents'><span>{{'configuration.ssid.authType' + row.entity.authType | translate}}</span></div>"
                },
                {
                    name: TS.ts('column.action'),
                    minWidth: "80", enableHiding: false, enableSorting: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><a class='btn-grid' ng-if='grid.appScope.hasPrivilege' ng-click='grid.appScope.editSSID(row.entity)' title=\'" + TS.ts('column.edit') + "\'><md-icon md-svg-icon='user:edit'></md-icon></a>" +
                        "<a class='btn-grid' ng-if='grid.appScope.hasPrivilege&&row.entity.ssidIndex!=1' ng-click='grid.appScope.delSSID(row.entity)' title=\'" + TS.ts('column.delete') + "\'><md-icon md-svg-icon='user:remove'></md-icon></a></div>"
                }
            ],
            data: []
        };

        $scope.addressOptions = {
            excessRows: 512,
            columnDefs: [
                {
                    field: 'index',
                    enableSorting: false,
                    enableColumnMenu: false,
                    minWidth: "50",
                    displayName: TS.ts('column.no'),
                    cellTemplate: '<div class="ui-grid-cell-contents item_number">{{rowRenderIndex + 1}}</div >'
                },
                {
                    name: 'macAddr', displayName: TS.ts('column.mac'), sort: {
                        direction: 'asc'
                    }, enableHiding: false, width: "60%"
                },
                {
                    name: TS.ts('column.delete'),
                    midWidth: "150", enableHiding: false, enableSorting: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><button class='btn-grid' title=\'" + TS.ts('column.delete') + "\' ng-click='grid.appScope.delMacAddress(row.entity)' ng-disabled='grid.appScope.temporary.macAccessControl==3'><md-icon md-svg-icon='user:remove'></md-icon></button></div>"
                }
            ],
            data: []
        };

        $scope.gppCellularNetworkOptions = {
            excessRows: 512,
            columnDefs: [
                {
                    field: 'index',
                    enableSorting: false,
                    enableColumnMenu: false,
                    minWidth: "50",
                    displayName: TS.ts('column.no'),
                    cellTemplate: '<div class="ui-grid-cell-contents item_number">{{rowRenderIndex + 1}}</div >'
                },
                {
                    name: 'mcc', displayName: "MCC", enableHiding: false, width: "30%"
                },
                {
                    name: 'mnc', displayName: "MNC", enableHiding: false, width: "30%"
                },
                {
                    name: TS.ts('column.delete'),
                    midWidth: "150", enableHiding: false, enableSorting: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><button class='btn-grid' title=\'" + TS.ts('column.delete') + "\' ng-click='grid.appScope.delMccMnc(row.entity)'><md-icon md-svg-icon='user:remove'></md-icon></button></div>"
                }
            ],
            data: []
        };

        $scope.domainNameListOptions = {
            excessRows: 512,
            columnDefs: [
                {
                    field: 'index',
                    enableSorting: false,
                    enableColumnMenu: false,
                    minWidth: "50",
                    displayName: TS.ts('column.no'),
                    cellTemplate: '<div class="ui-grid-cell-contents item_number">{{rowRenderIndex + 1}}</div >'
                },
                {
                    name: 'domainName', displayName: "Domain Name", enableHiding: false, width: "60%"
                },
                {
                    name: TS.ts('column.delete'),
                    midWidth: "150", enableHiding: false, enableSorting: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><button class='btn-grid' title=\'" + TS.ts('column.delete') + "\' ng-click='grid.appScope.delDomainName(row.entity)'><md-icon md-svg-icon='user:remove'></md-icon></button></div>"
                }
            ],
            data: []
        };

        $scope.roamingConsortiumOptions = {
            excessRows: 512,
            columnDefs: [
                {
                    field: 'index',
                    enableSorting: false,
                    enableColumnMenu: false,
                    minWidth: "50",
                    displayName: TS.ts('column.no'),
                    cellTemplate: '<div class="ui-grid-cell-contents item_number">{{rowRenderIndex + 1}}</div >'
                },
                {
                    name: 'roamingConsortium', displayName: "Roaming Consortium", enableHiding: false, width: "60%"
                },
                {
                    name: TS.ts('column.delete'),
                    midWidth: "150", enableHiding: false, enableSorting: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><button class='btn-grid' title=\'" + TS.ts('column.delete') + "\' ng-click='grid.appScope.delRoamingConsortium(row.entity)'><md-icon md-svg-icon='user:remove'></md-icon></button></div>"
                }
            ],
            data: []
        };

        $scope.eapMethodOptions = {
            excessRows: 512,
            columnDefs: [
                {
                    field: 'index',
                    enableSorting: false,
                    enableColumnMenu: false,
                    minWidth: "50",
                    displayName: TS.ts('column.no'),
                    cellTemplate: '<div class="ui-grid-cell-contents item_number">{{rowRenderIndex + 1}}</div >'
                },
                {
                    name: 'eapMethod', displayName: "EAP Method", enableHiding: false, width: "20%"
                },
                {
                    name: 'authAndType',
                    displayName: "Authentication ID/Parameter Type",
                    enableHiding: false,
                    enableColumnMenu: false,
                    enableSorting: false,
                    width: "45%"
                },
                {
                    name: TS.ts('column.delete'),
                    midWidth: "150", enableHiding: false, enableSorting: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><button class='btn-grid' title=\'" + TS.ts('column.delete') + "\' ng-click='grid.appScope.delEapMethod(row.entity)'><md-icon md-svg-icon='user:remove'></md-icon></button></div>"
                }
            ],
            data: []
        };

        $scope.naiRealmListOptions = {
            excessRows: 512,
            columnDefs: [
                {
                    field: 'index',
                    enableSorting: false,
                    enableColumnMenu: false,
                    minWidth: "3",
                    displayName: TS.ts('column.no'),
                    cellTemplate: '<div class="ui-grid-cell-contents item_number">{{rowRenderIndex + 1}}</div >'
                },
                {
                    name: 'rfc4282',
                    displayName: "RFC 4282",
                    enableColumnMenu: false,
                    enableSorting: false,
                    enableHiding: false,
                    width: "14%"
                },
                {
                    name: 'naiRealms', displayName: "Nai Realms", enableHiding: false, width: "15.5%"
                },
                {
                    name: 'eapMethod',
                    displayName: "EAP Method/Authentication ID/Parameter Type",
                    enableColumnMenu: false,
                    enableSorting: false,
                    enableHiding: false,
                    width: "50%"
                },
                {
                    name: TS.ts('column.delete'),
                    midWidth: "150", enableHiding: false, enableSorting: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><button class='btn-grid' title=\'" + TS.ts('column.delete') + "\' ng-click='grid.appScope.delNaiRealmList(row.entity)'><md-icon md-svg-icon='user:remove'></md-icon></button></div>"
                }
            ],
            data: []
        };

        $scope.connectionCapabilityOptions = {
            excessRows: 512,
            columnDefs: [
                {
                    field: 'index',
                    enableSorting: false,
                    enableColumnMenu: false,
                    minWidth: "40",
                    displayName: TS.ts('column.no'),
                    cellTemplate: '<div class="ui-grid-cell-contents item_number">{{rowRenderIndex + 1}}</div >'
                },
                {
                    name: 'ipProtocol', displayName: "IP Protocol", enableHiding: false, width: "25%"
                },
                {
                    name: 'portNumber', displayName: "Port Number", enableHiding: false, width: "25%"
                },
                {
                    name: 'status', displayName: "Status", enableHiding: false, width: "25%"
                },
                {
                    name: TS.ts('column.delete'),
                    midWidth: "150", enableHiding: false, enableSorting: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><button class='btn-grid' title=\'" + TS.ts('column.delete') + "\' ng-click='grid.appScope.delConnectionCapability(row.entity)'><md-icon md-svg-icon='user:remove'></md-icon></button></div>"
                }
            ],
            data: []
        };

        $scope.OSUMethodListOptions = {
            excessRows: 512,
            columnDefs: [
                {
                    field: 'index',
                    enableSorting: false,
                    enableColumnMenu: false,
                    minWidth: "50",
                    displayName: TS.ts('column.no'),
                    cellTemplate: '<div class="ui-grid-cell-contents item_number">{{rowRenderIndex + 1}}</div >'
                },
                {
                    name: 'languageCode', displayName: "Language Code", enableHiding: false, width: "30%"
                },
                {
                    name: 'method', displayName: "Method", enableHiding: false, width: "30%"
                },
                {
                    name: TS.ts('column.delete'),
                    midWidth: "150", enableHiding: false, enableSorting: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><button class='btn-grid' title=\'" + TS.ts('column.delete') + "\' ng-click='grid.appScope.delOSUMethod(row.entity)'><md-icon md-svg-icon='user:remove'></md-icon></button></div>"
                }
            ],
            data: []
        };

        $scope.ipFilterOptions = {
            columnDefs: [
                {
                    name: 'ipAddress', displayName: TS.ts('column.ipv4'), sort: {
                        direction: 'asc'
                    }, enableHiding: false, width: "40%"
                },
                {name: 'subMask', displayName: TS.ts('column.subnetMask'), enableHiding: false, width: "40%"},
                {
                    name: TS.ts('column.delete'),
                    midWidth: "100", enableHiding: false, enableSorting: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><a class='btn-grid' ng-click='grid.appScope.delIpFilter(row.entity)' title=\'" + TS.ts('column.delete') + "\'><md-icon md-svg-icon='user:remove'></md-icon></a></div>"
                }
            ],
            data: []
        };

        $scope.whiteListOptions = {
            excessRows: 100,
            columnDefs: [
                {
                    field: 'index',
                    enableSorting: false,
                    enableColumnMenu: false,
                    minWidth: "50",
                    displayName: TS.ts('column.no'),
                    cellTemplate: '<div class="ui-grid-cell-contents item_number">{{rowRenderIndex + 1}}</div >'
                },
                {
                    name: 'mac', displayName: TS.ts('column.mac'), enableHiding: false, width: "60%", sort: {
                        direction: 'asc'
                    }
                },
                {
                    name: TS.ts('column.delete'), enableHiding: false,
                    enableSorting: false,
                    midWidth: "100",
                    cellTemplate: "<div class='ui-grid-cell-contents'><a class='btn-grid' ng-click='grid.appScope.delMacByPass(row.entity)' title=\'" + TS.ts('column.delete') + "\' ng-disabled='!grid.appScope.temporary.whitelistStatus'><md-icon md-svg-icon='user:remove'></md-icon></a></div>"
                }
            ],
            data: []
        };

        $scope.userPassOptions = {
            columnDefs: [
                {
                    name: 'username', displayName: TS.ts('column.userName'), width: "70%", enableHiding: false, sort: {
                        direction: 'asc'
                    }
                },
                {
                    name: TS.ts('column.action'), enableHiding: false,
                    enableSorting: false,
                    midWidth: "150",
                    cellTemplate: "<div class='ui-grid-cell-contents'><a class='btn-grid' ng-click='grid.appScope.editUser(row.entity)'><md-icon md-svg-icon='user:edit'></md-icon></a>" +
                        "<a class='btn-grid' ng-click='grid.appScope.delUser(row.entity)' title=\'" + TS.ts('column.delete') + "\'><md-icon md-svg-icon='user:remove'></md-icon></a></div>"
                }
            ],
            data: []
        };

        $scope.passcodeOptions = {
            columnDefs: [
                {name: 'passcode', displayName: TS.ts('column.passcode'), enableHiding: false, width: "15%"},
                {name: 'ssid', displayName: TS.ts('column.ssid'), enableHiding: false, width: "10%"},
                {
                    field: 'durationView', width: "10%", enableHiding: false, displayName: TS.ts('column.duration'),
                    cellTemplate: "<div class='ui-grid-cell-contents'>{{row.entity.durationView}}&nbsp{{'passcode.'+row.entity.durationType|translate}}</div>"
                },
                {name: 'connectionLimit', enableHiding: false, displayName: TS.ts('column.userLimit'), width: "10%"},
                {
                    name: 'lastActiveTime', enableHiding: false,
                    displayName: TS.ts('column.lastActive'),
                    width: "20%",
                    cellFilter: 'date:"yyyy-MM-dd HH:mm:ss"',
                    sort: {
                        direction: 'desc'
                    }
                },
                {name: 'remainning', displayName: TS.ts('column.durationRemain'), enableHiding: false, width: "15%"},
                {name: 'creator', displayName: TS.ts('column.creator'), enableHiding: false, width: "12%"},
                {
                    name: 'status', displayName: TS.ts('column.status'), enableHiding: false,
                    cellTemplate: '<a  ng-class="grid.appScope.classPasscode(row.entity)" title="{{row.entity.title}}"><md-icon md-svg-icon="status:online_status" ></md-icon></a>'
                },
            ],
            data: []
        };
        $scope.gardenOptions = {
            columnDefs: [
                {
                    name: 'no', displayName: TS.ts('column.no'), width: "10%", enableHiding: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'>{{grid.appScope.returnNoOfGarden(row.entity)}}</div>"
                },
                {
                    name: 'ip', displayName: TS.ts('column.ipv4'), width: "75%", sort: {
                        direction: 'asc'
                    }, enableHiding: false
                },
                {
                    name: TS.ts('column.delete'),
                    width: "15%", enableHiding: false, enableSorting: false,
                    cellTemplate: "<div class='ui-grid-cell-contents'><a class='btn-grid' ng-click='grid.appScope.delGardenIP(row.entity)' title=\'" + TS.ts('column.delete') + "\' ><md-icon md-svg-icon='user:remove'></md-icon></a></div>"
                }
            ],
            data: []
        };
        $scope.classPasscode = function (row) {
            return "passcode_" + row.status;
        }
        $scope.ssidIndexChanged = function () {
            if ($scope.temporary.ssidIndex != 1) {
                if ($scope.temporary.authentication == 2) {
                    $scope.temporary.authentication = 1;
                    if ($scope.temporary.encryption == 1) {
                        $scope.temporary.encryption = "0";
                    }
                }
            }
            if ($scope.temporary.ssidIndex == 1) {
                if ($scope.temporary.band == 1) {
                    $scope.temporary.wmm = $scope.performanceData.band24.wmm ? 1 : '0';
                }
                if ($scope.temporary.band == 2) {
                    $scope.temporary.wmm = $scope.performanceData.band5.wmm ? 1 : '0';
                }
                if ($scope.temporary.band == 3) {
                    $scope.temporary.wmm = $scope.performanceData.secBand5.wmm ? 1 : '0';
                }
            }
        }

        $scope.checkAuthTypeUrlIsEmpty = function () {
            if ($scope.temporary.networkAuthType == "02" || $scope.temporary.networkAuthType == "03") {
                if ($scope.temporary.networkAuthURL == '') {
                    $scope.state.ssid.networkAuthTypeIsEmpty = true;
                    $scope.state.ssid.msgFalse = 'configuration.ssid.networkAuthTypeEmptyError';
                } else {
                    $scope.state.ssid.networkAuthTypeIsEmpty = false;
                }
            } else {
                $scope.state.ssid.networkAuthTypeIsEmpty = false;
            }
        }

        $scope.checkNaiURL = function () {
            var OSUNaiURLText = document.getElementById('OSUNaiURL').value;
            if ($scope.temporary.OSUNai.length > 0 && OSUNaiURLText == '') {
                $scope.state.ssid.osuNaiURLIsEmpty = true;
                $scope.state.ssid.msgFalse = 'configuration.ssid.osuNaiURLIsEmpty';

            } else {
                $scope.state.ssid.osuNaiURLIsEmpty = false;
            }
        }

        $scope.checkNai = function () {
            var OSUNaiText = document.getElementById('OSUNai').value;
            var OSUNaiURLText = document.getElementById('OSUNaiURL').value;

            if (OSUNaiText.length > 0 && OSUNaiURLText == '') {
                $scope.state.ssid.osuNaiURLIsEmpty = true;
                $scope.state.ssid.msgFalse = 'configuration.ssid.osuNaiURLIsEmpty';

            } else {
                $scope.state.ssid.osuNaiURLIsEmpty = false;
            }
        }

        $scope.checkVenueGroup = function () {
            var re = /^([0-9]|[1-8][0-9]|9[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
            var checkVenueGroup = re.test($scope.temporary.venueGroup);
            if (!checkVenueGroup) {
                $scope.state.ssid.venueGroupError = true;
                $scope.state.ssid.msgFalseVenueGroup = 'configuration.ssid.venueGroup';
            } else {
                $scope.state.ssid.venueGroupError = false;
            }
        }

        $scope.checkVenueType = function () {
            var re = /^([0-9]|[1-8][0-9]|9[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
            var checkVenueType = re.test($scope.temporary.venueType);
            if (!checkVenueType) {
                $scope.state.ssid.venueTypeError = true;
                $scope.state.ssid.msgFalseVenueType = 'configuration.ssid.venueType';
            } else {
                $scope.state.ssid.venueTypeError = false;
            }
        }

        $scope.checkOSUIconWidth = function () {
            var re = /^([0-9]|[1-8][0-9]|9[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-6])$/;
            var checkOSUIconWidth = re.test($scope.temporary.OSUIconWidth);
            if (!checkOSUIconWidth) {
                $scope.state.ssid.OSUIconWidthError = true;
                $scope.state.ssid.msgFalseOSUIconWidth = 'configuration.ssid.OSUIconWidth';
            } else {
                $scope.state.ssid.OSUIconWidthError = false;
            }
        }

        $scope.checkOSUIconHeight = function () {
            var re = /^([0-9]|[1-8][0-9]|9[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-6])$/;
            var checkOSUIconHeight = re.test($scope.temporary.OSUIconHeight);
            if (!checkOSUIconHeight) {
                $scope.state.ssid.OSUIconHeightError = true;
                $scope.state.ssid.msgFalseOSUIconHeight = 'configuration.ssid.OSUIconHeight';
            } else {
                $scope.state.ssid.OSUIconHeightError = false;
            }
        }

        $scope.checkMcc = function () {
            var mccRe = /^\d{3}$/;
            var checkMcc = mccRe.test($scope.temporary.mcc);
            if (!checkMcc) {
                $scope.state.ssid.mccError = true;
                $scope.state.ssid.msgFalseMcc = 'configuration.ssid.mcc';
            } else {
                $scope.state.ssid.mccError = false;
            }
        }

        $scope.checkMnc = function () {
            var mccRe = /^\d{2,}$/;
            var checkMnc = mccRe.test($scope.temporary.mnc);
            if (!checkMnc) {
                $scope.state.ssid.mncError = true;
                $scope.state.ssid.msgFalseMnc = 'configuration.ssid.mnc';
            } else {
                $scope.state.ssid.mncError = false;
            }
        }


        // 获取登陆模版列表
        $scope.loginTemplates = [];
        $scope.loginTemplate = {select: ''};
        var getLoginTemplateList = function () {
            BatchConfigService.getLoginTemplateList($scope.profileId, function (result) {
                if (result.success) {
                    $scope.loginTemplates = result.data;
                    $scope.loginTemplate.select = $scope.loginTemplates[0];
                }
            }, function () {
            });
            $scope.loginTemplate.select = $scope.loginTemplates[0];
        };
        $scope.loginSlaTemplates = [];
        $scope.loginSlaTemplate = {select: ''};
        var getLoginFileList = function () {
            var removeByAttr = function (arr, attr, value) {
                var i = arr.length;
                while (i--) {
                    if (arr[i]
                        && arr[i].hasOwnProperty(attr)
                        && (arguments.length > 2 && arr[i][attr] === value)) {

                        arr.splice(i, 1);

                    }
                }
                return arr;
            }
            BatchConfigService.getLoginTemplateList($scope.profileId, function (result) {
                if (result.success) {
                    $scope.loginTemplates = result.data;
                    $scope.loginTemplate.select = $scope.loginTemplates[0];
                    var totalList = angular.copy(result.data);
                    removeByAttr(totalList, 'name', 'pages_default_paypal'); // SLA delete paypal page
                    $scope.loginSlaTemplates = totalList;
                    $scope.loginSlaTemplate.select = $scope.loginSlaTemplates[0];
                }
            }, function () {
            });
            $scope.loginTemplate.select = $scope.loginTemplates[0];
            $scope.loginSlaTemplate.select = $scope.loginSlaTemplates[0];
        };
        getLoginFileList();
        var getDisabledArr = function () {
            var disableArr = [
                [true, true, true, true, true, true, true, true],
                [true, true, true, true, true, true, true, true]
            ];
            for (var i = 0; i < $scope.SSIDOptions.data.length; i++) {
                var x = $scope.SSIDOptions.data[i].band - 1,
                    y = $scope.SSIDOptions.data[i].ssidIndex - 1;
                disableArr[x][y] = false;
            }
            ;
            return disableArr;
        };
        $scope.bandFilter = function (item) {
            return true;
            // var disableArr = getDisabledArr();
            // return disableArr[item-1][$scope.temporary.ssidIndex-1];
        };
        $scope.ssidFilter = function (item) {
            return true;
            // var disableArr = getDisabledArr();
            // return disableArr[$scope.temporary.band-1][item-1];
        };

        $scope.securityChange = function (item, model) {
            if (item == 1) {
                $scope.temporary.encryption = 0;
            } else if (item == 2) {
                $scope.temporary.encryption = 1;
            }
        }
        /*
         * 数据处理
         */
        var typeCoversion = ['broadcast', 'wmm', 'encryption', 'primaryAccountStatus',
            'IPIFStatus', 'firstRadiusType', 'secondRadiusType', 'thirdRadiusType',
            'LDAPAuthMode', 'POP3ConnectType', 'groupKeyUpdateInterval', 'keyUpdateInterval', 'primaryRadiusPort',
            'backupRadiusPort', 'primaryAccountPort', 'backupAccountPort', 'idleTimeout',
            'IPIFVlanGroup', 'POP3Port']
        var initialValue = {
            band: 1,
            ssidIndex: 1,
            ssid: '',
            characterSet: 1,
            broadcast: 1, // -=0
            wmm: 1, // -=0
            authentication: 1,
            i80211kvr: 0,
            // authentication = 1, 2
            encryption: 0, // -=0
            keySize: 0,
            keyType: 2,
            keyIndex: 1,
            keyValue: '',
            // authentication = 4, 5, 6, 7, 8, 9
            cipherType: 1,
            groupKeyUpdateInterval: 3600,
            // authentication = 10
            keyUpdateInterval: 300, // modify default value  300
            // authentication = 4, 6, 8
            passPhrase: '',
            // authentication = 5, 7, 9
            primaryRadiusServer: '',
            primaryRadiusPort: 1812,
            primaryRadiusSecret: '',
            backupRadiusServer: '',
            backupRadiusPort: 1812,
            backupRadiusSecret: '',
            primaryAccountStatus: 0, // -=0
            primaryAccountServer: '',
            primaryAccountPort: 1813,
            primaryAccountSecret: '',
            backupAccountServer: '',
            backupAccountPort: 1813,
            backupAccountSecret: '',

            macAccessControl: 3,
            macList: [],

            authType: 0,
            // authType = 2, 3, 4, 5, 6
            idleTimeout: 60, // 默认固定
            // authType != 0
            IPIFStatus: 0, // -=0
            IPIFVlanGroup: 1,
            IPIFIpFrom: 1,
            IPIFIpAddress: '',
            IPIFMask: '',
            IPIFGateway: '',
            IPIFDns: '',
            webRedirectState: false,
            webRedirectUrl: '',
            // authType != 0, 1
            ipFilterStatus: 0,
            ipFilter: [],
            whitelistStatus: false,
            macByPass: [],
            // authType != 0, 1, 7
            connectionCapability: '',
            connectionCapabilityName: '',
            splashPageCustom: '', // 未绑定
            // authType = 2
            userPwd: [],
            // authType = 3
            // passcodeList: [],
            // authType = 4
            firstRadiusServer: '',
            firstRadiusPort: 1812,
            firstRadiusSecret: '',
            firstRadiusType: 0, // -=0
            secondRadiusServer: '',
            secondRadiusPort: 1812,
            secondRadiusSecret: '',
            secondRadiusType: 0, // -=0
            thirdRadiusServer: '',
            thirdRadiusPort: 1812,
            thirdRadiusSecret: '',
            thirdRadiusType: 0, // -=0
            // authType = 5
            LDAPServer: '',
            LDAPPort: 389,
            LDAPAuthMode: 0, // -=0
            LDAPUsername: '',
            LDAPPasswd: '',
            LDAPBaseDN: '',
            LDAPAttribute: '',
            LDAPIdentity: '',
            LDAPAutoCopy: 0,
            // authType = 6
            POP3Server: '',
            POP3Port: 110,
            POP3ConnectType: 0, // -=0
            // authType = 7
            externalCaptPort: '',
            // if authType = 10 (external hotspot portal)
            sessionTime: 120,
            ehpScheme: 0,
            ehpPath: "",
            walledGarden: [], // max: 5 IP addresses ,
            radiusServer: "",
            radiusPort: 1812,
            radiusSecret: "",
            radiusType: 0,
            accountStatus: 0,
            accountServer: "",
            accountPort: 1813,
            accountSecret: "",
            accountRadiusType: 0,
            managep2p: 0,
            osen: 0,
            enabled: 0,
            accessCrossConnection: 0,
            interworking: 0,
            accessNetworkType: 0,
            internet: 0,
            asra: 0,
            esr: 0,
            usea: 0,
            venueGroup: 0,
            venueType: 0,
            dgaf: 1,
            proxyAPR: 0,
            l2TIF: 0,
            status: 0,
            ipProtocol: 1,
            venueName: "en",
            venueNameText: '',
            operatorFriendlyName: "en",
            networkAuthType: "00",
            ipAddressTypeAvailability: 0,
            wanLinkStatus: 1,
            wanSymmetricLink: 1,
            wanAtCapacity: 0,
            OSUConfig: 0,
            OSULanguageCode: "en",
            OSUFriendlyName: "en",
            OSUIconLanguageCode: "en",
            OSUIconType: "image/png",
            OSUIconWidth: 0,
            OSUIconHeight: 0,
            wanMetricsDLSpeed: 0,
            wanMetricsULSpeed: 0,
            mcc: "000",
            mnc: "00",
            gppCellularNetwork: '',
            portNumber: 0,
            domainNameList: '',
            roamingConsortiumList: '',
            naiRealm: '',
            naiRealmList: [],
            eapMethod: '',
            authAndTypeList: [],
            rfc4282: 1,
            methodList: '',
            methodListName: '',
            method: '',
            languageCode: "en",
            OSUNai: '',
            OSUNaiURL: '',
            hessid: '',
            OSUSSID: '',
            OSUServerURI: '',
            OSUServiceDescription: '',
            // roamingConsortium: '',
            OSUIconFilePath: '',
            OSUIconFileName: '',
            operatorFriendlyNameText: '',
            OSUFriendlyNameText: '',
            networkAuthURL: ''
        }
        var resetting = function () {
            $scope.temporary = angular.copy(initialValue);
            $scope.editSSIDStatus = null;
            $scope.showpage = {
                'Security': true,
                'Access control': false,
                'User Authentication': false,
                'Hotspot 2.0': false
            };
            // 根据disableArr改变band ssidIndex值(初始化band、ssidIndex)
            // var disableArr = getDisabledArr();
            // for (var i = 0; i < disableArr.length; i++) {
            //     for (var j = 0; j < disableArr[i].length; j++) {
            //         if(disableArr[i][j]){
            //             $scope.temporary.band = i+1;
            //             $scope.temporary.ssidIndex = j+1;
            //             return;
            //         }
            //     }
            // };
            $scope.addressOptions.data = [];
            $scope.ipFilterOptions.data = [];
            $scope.userPassOptions.data = [];
            $scope.whiteListOptions.data = [];
            $scope.passcodeOptions.data = [];
            var ssidFilter = new Array();
            ssidFilter.push([0, 0, 0, 0, 0, 0, 0, 0]);
            ssidFilter.push([0, 0, 0, 0, 0, 0, 0, 0]);
            ssidFilter.push([0, 0, 0, 0, 0, 0, 0, 0]);
            for (var i = 0; i < $scope.SSIDOptions.data.length; i++) {
                ssidFilter[$scope.SSIDOptions.data[i].band - 1][$scope.SSIDOptions.data[i].ssidIndex - 1] = 1;
            }
            var ssidIndexDefault = 1;
            var ssidbandDefault = 1;
            for (var i = 0; i < ssidFilter.length; i++) {
                var allExisted = true;
                for (var j = 0; j < ssidFilter[i].length; j++) {
                    if (!ssidFilter[i][j]) {
                        ssidIndexDefault = j + 1;
                        ssidbandDefault = i + 1;
                        allExisted = false;
                        break;
                    }
                }
                if (!allExisted) {
                    break;
                }
            }
            $scope.temporary.band = ssidbandDefault;
            $scope.temporary.ssidIndex = ssidIndexDefault;
            $scope.connectionCapabilityOptions.data = [];
            $scope.gppCellularNetworkOptions.data = [];
            $scope.domainNameListOptions.data = [];
            $scope.OSUMethodListOptions.data = [];
            $scope.roamingConsortiumOptions.data = [];
            $scope.eapMethodOptions.data = [];
            $scope.naiRealmListOptions.data = [];
        };

        $scope.SSIDOptions.data = $scope.ssidData.list;

        $scope.passcodeType = {
            type24: 0,
            type5: 0,
            type52: 0
        }

        function resetAuthType() {
            $scope.passcodeType = {type24: 0, type5: 0, type52: 0};
            for (var i = 0; i < $scope.SSIDOptions.data.length; i++) {
                if ($scope.SSIDOptions.data[i].authType == 7) {
                    if ($scope.SSIDOptions.data[i].band == 1) {
                        $scope.passcodeType.type24 += 1;
                    } else if ($scope.SSIDOptions.data[i].band == 2) {
                        $scope.passcodeType.type5 += 1;
                    } else {
                        $scope.passcodeType.type52 += 1;
                    }
                }
            }
        }

        $scope.maclistLen24 = 0;
        $scope.maclistLen5 = 0;
        $scope.maclistLen52 = 0;
        $scope.maclistError = true;

        function setMACListLen() {
            $scope.maclistLen24 = 0;
            $scope.maclistLen5 = 0;
            $scope.maclistLen52 = 0;
            for (var i = 0; i < $scope.SSIDOptions.data.length; i++) {
                var ssid = $scope.SSIDOptions.data[i];
                if (ssid.macAccessControl != 3 && ssid.band == 1) {
                    $scope.maclistLen24 += ssid.macList.length;
                }
                if (ssid.macAccessControl != 3 && ssid.band == 2) {
                    $scope.maclistLen5 += ssid.macList.length;
                }
                if (ssid.macAccessControl != 3 && ssid.band == 3) {
                    $scope.maclistLen52 += ssid.macList.length;
                }
            }
        }

        setMACListLen();
        resetting();
        resetAuthType();
        $scope.showPasscodeAuth = function () {
            if ($scope.temporary.band == 1 && $scope.passcodeType.type24 < 2) {
                return true;
            }
            if ($scope.temporary.band == 2 && $scope.passcodeType.type5 < 2) {
                return true;
            }
            if ($scope.temporary.band == 3 && $scope.passcodeType.type52 < 2) {
                return true;
            }
            if ($scope.editSSIDStatus && $scope.editSSIDAuthType == 7) {
                return true;
            }
            return false;
        }

        // 3gpp Cellular Network
        $scope.gppCellularNetworkAdded = false;
        $scope.addMccMnc = function () {
            for (var i = 0; i < $scope.gppCellularNetworkOptions.data.length; i++) {
                var temp = $scope.gppCellularNetworkOptions.data[i];

                if (temp.mcc == $scope.temporary.mcc && temp.mnc == $scope.temporary.mnc) {
                    $scope.gppCellularNetworkAdded = true;
                    $scope.temporary.mcc = "000";
                    $scope.temporary.mnc = "00";
                    return;
                }
            }

            var data = angular.copy($scope.temporary);

            $scope.gppCellularNetworkOptions.data.push(data);
            $scope.temporary.mcc = "000";
            $scope.temporary.mnc = "00";
        };

        $scope.gppCellularNetworkChange = function () {
            $scope.gppCellularNetworkAdded = false;
        };


        $scope.delMccMnc = function (r) {
            var delIndex = r.$$hashKey;
            for (var i = 0; i < $scope.gppCellularNetworkOptions.data.length; i++) {
                if ($scope.gppCellularNetworkOptions.data[i].$$hashKey == delIndex) {
                    $scope.gppCellularNetworkOptions.data.splice(i, 1);
                    return;
                }
            }
            ;
        };

        // Domain Name List
        $scope.domainNameAdded = false;
        $scope.addDomainName = function () {
            for (var i = 0; i < $scope.domainNameListOptions.data.length; i++) {
                var temp = $scope.domainNameListOptions.data[i];
                if (temp.domainName == $scope.temporary.domainName) {
                    $scope.domainNameAdded = true;
                    return;
                }
            }
            var data = angular.copy($scope.temporary);
            var domainNameListSize = $scope.domainNameListOptions.data.length;
            var domainNameList = '';

            for (var i = 0; i < domainNameListSize; i++) {
                domainNameList = domainNameList + $scope.domainNameListOptions.data[i].domainName;
                if (i == (domainNameListSize - 1)) {
                }
                else {
                    domainNameList = domainNameList + ','
                }
            }


            if ((domainNameList.length == 0 && data.domainName.length == 199) || ((domainNameList.length + data.domainName.length) == 198)) {
                $scope.domainNameListOptions.data.push(data);
                var domainNameListSize = $scope.domainNameListOptions.data.length;
                var domainNameList = '';

                for (var i = 0; i < domainNameListSize; i++) {
                    domainNameList = domainNameList + $scope.domainNameListOptions.data[i].domainName;
                    if (i == (domainNameListSize - 1)) {
                    }
                    else {
                        domainNameList = domainNameList + ','
                    }
                }
                $scope.domainNameListLength = domainNameList.length; // char == 199
                $scope.state.ssid.domainNameError = false;
            } else if ((domainNameList.length + data.domainName.length) < 199) {
                $scope.domainNameListOptions.data.push(data);
                var domainNameListSize = $scope.domainNameListOptions.data.length;
                var domainNameList = '';

                for (var i = 0; i < domainNameListSize; i++) {
                    domainNameList = domainNameList + $scope.domainNameListOptions.data[i].domainName;
                    if (i == (domainNameListSize - 1)) {
                    }
                    else {
                        domainNameList = domainNameList + ','
                    }
                }
                $scope.domainNameListLength = domainNameList.length + 1; // char < 199
                $scope.state.ssid.domainNameError = false;
            } else {
                $scope.state.ssid.domainNameError = true;
                $scope.state.ssid.msgFalse = 'configuration.ssid.gridError';
            }
            $scope.temporary.domainName = '';
        };

        $scope.domainNameChange = function () {
            $scope.domainNameAdded = false;
        };

        $scope.delDomainName = function (r) {
            var delIndex = r.$$hashKey;
            for (var i = 0; i < $scope.domainNameListOptions.data.length; i++) {
                if ($scope.domainNameListOptions.data[i].$$hashKey == delIndex) {
                    $scope.domainNameListOptions.data.splice(i, 1);
                    var domainNameListSize = $scope.domainNameListOptions.data.length;
                    var domainNameList = '';

                    for (var i = 0; i < domainNameListSize; i++) {
                        domainNameList = domainNameList + $scope.domainNameListOptions.data[i].domainName;
                        if (i == (domainNameListSize - 1)) {
                        }
                        else {
                            domainNameList = domainNameList + ','
                        }
                    }
                    if (domainNameList.length == 0) {
                        $scope.domainNameListLength = domainNameList.length;
                    } else {
                        $scope.domainNameListLength = domainNameList.length + 1;
                    }
                    $scope.state.ssid.domainNameError = false;
                    return;
                }
            }
            ;
        };

        // Roaming Consortium
        $scope.roamingConsortiumAdded = false;
        $scope.addRoamingConsortium = function () {
            for (var i = 0; i < $scope.roamingConsortiumOptions.data.length; i++) {
                var temp = $scope.roamingConsortiumOptions.data[i];
                if (temp.roamingConsortium == $scope.temporary.roamingConsortium) {
                    $scope.roamingConsortiumAdded = true;
                    return;
                }
            }
            var data = angular.copy($scope.temporary);
            var roamingConsortiumListSize = $scope.roamingConsortiumOptions.data.length;
            var roamingConsortiumList = '';

            for (var i = 0; i < roamingConsortiumListSize; i++) {
                roamingConsortiumList = roamingConsortiumList + $scope.roamingConsortiumOptions.data[i].roamingConsortium;
                if (i == (roamingConsortiumListSize - 1)) {
                }
                else {
                    roamingConsortiumList = roamingConsortiumList + '&'
                }
            }

            if ((roamingConsortiumList.length == 0 && data.roamingConsortium.length == 199) || ((roamingConsortiumList.length + data.roamingConsortium.length) == 198)) {
                $scope.roamingConsortiumOptions.data.push(data);
                var roamingConsortiumListSize = $scope.roamingConsortiumOptions.data.length;
                var roamingConsortiumList = '';

                for (var i = 0; i < roamingConsortiumListSize; i++) {
                    roamingConsortiumList = roamingConsortiumList + $scope.roamingConsortiumOptions.data[i].roamingConsortium;
                    if (i == (roamingConsortiumListSize - 1)) {
                    }
                    else {
                        roamingConsortiumList = roamingConsortiumList + '&'
                    }
                }
                $scope.roamingConsortiumListLength = roamingConsortiumList.length; // char == 199

            } else if ((roamingConsortiumList.length + data.roamingConsortium.length) < 199) {
                $scope.roamingConsortiumOptions.data.push(data);
                var roamingConsortiumListSize = $scope.roamingConsortiumOptions.data.length;
                var roamingConsortiumList = '';

                for (var i = 0; i < roamingConsortiumListSize; i++) {
                    roamingConsortiumList = roamingConsortiumList + $scope.roamingConsortiumOptions.data[i].roamingConsortium;
                    if (i == (roamingConsortiumListSize - 1)) {
                    }
                    else {
                        roamingConsortiumList = roamingConsortiumList + '&'
                    }
                }
                $scope.roamingConsortiumListLength = roamingConsortiumList.length + 1; // char < 199
                $scope.state.ssid.roamingConsortiumError = false;
            } else {
                $scope.state.ssid.roamingConsortiumError = true;
                $scope.state.ssid.msgFalse = 'configuration.ssid.gridError';
            }
            $scope.temporary.roamingConsortium = '';
        };

        $scope.roamingConsortiumChange = function () {
            $scope.roamingConsortiumAdded = false;
        };

        $scope.delRoamingConsortium = function (r) {
            var delIndex = r.$$hashKey;
            for (var i = 0; i < $scope.roamingConsortiumOptions.data.length; i++) {
                if ($scope.roamingConsortiumOptions.data[i].$$hashKey == delIndex) {
                    $scope.roamingConsortiumOptions.data.splice(i, 1);
                    var roamingConsortiumListSize = $scope.roamingConsortiumOptions.data.length;
                    var roamingConsortiumList = '';

                    for (var i = 0; i < roamingConsortiumListSize; i++) {
                        roamingConsortiumList = roamingConsortiumList + $scope.roamingConsortiumOptions.data[i].roamingConsortium;
                        if (i == (roamingConsortiumListSize - 1)) {
                        }
                        else {
                            roamingConsortiumList = roamingConsortiumList + ','
                        }
                    }
                    if (roamingConsortiumList.length == 0) {
                        $scope.roamingConsortiumListSize = roamingConsortiumList.length;
                    } else {
                        $scope.roamingConsortiumListSize = roamingConsortiumList.length + 1;
                    }
                    $scope.state.ssid.roamingConsortiumError = false;
                    return;
                }
            }
            ;
        };

        // NAI Realm List

        $scope.addNaiRealm = function () {
            $scope.temporary.naiRealmList.push({domainName: ''});
            var length = $scope.temporary.naiRealmList.length;
            for (var i = 0; i < length; i++) {
                if ($scope.temporary.naiRealmList[i].domainName == "") {
                    $scope['inValidNaiRealm' + i] = false;
                }
            }
        };

        $scope.delNaiRealm = function (index) {
            $scope['inValidNaiRealm' + index] = false;
            $scope.temporary.naiRealmList.splice(index, 1);
            var length = $scope.temporary.naiRealmList.length;
            $timeout(function () {
                for (var i = 0; i < length; i++) {
                    $scope.checkNaiRealm(i);
                }
            }, 2);
        };
        $scope.addAuthAndType = function () {
            $scope.temporary.authAndTypeList.push({authenticationID: '', parameterType: ''});
            var length = $scope.temporary.authAndTypeList.length;
            for (var i = 0; i < length; i++) {
                if ($scope.temporary.authAndTypeList[i].authenticationID == "") {
                    $scope['inValidAuthenticationID' + i] = false;
                } else if ($scope.temporary.authAndTypeList[i].parameterType == "") {
                    $scope['inValidParameterType' + i] = false;
                }
            }
        };

        $scope.eapMethodChange = function () {
            $scope.eapMethodAdded = false;
        };

        $scope.delAuthAndType = function (index) {
            $scope['inValidParameterType' + index] = false;
            $scope['inValidAuthenticationID' + index] = false;
            $scope.temporary.authAndTypeList.splice(index, 1);
            var length = $scope.temporary.authAndTypeList.length;
            $timeout(function () {
                for (var i = 0; i < length; i++) {
                    $scope.checkAuthenticationID(i);
                    $scope.checkParameterType(i);
                }
            }, 2);
        };

        $scope.addEapMethod = function () {
            var transformAuthAndTypeToObject = function (authAndTypeStr) {
                var authAndTypeList = [];
                var arr1 = authAndTypeStr.split("][");
                for (var i = 0; i < arr1.length; i++) {
                    arr2 = (arr1[i].replace(/\[|\]/g, '')).split(":");
                    if (arr2.length == 2) {
                        authAndTypeList.push({authenticationID: arr2[0], parameterType: arr2[1]});
                    }
                }
                return authAndTypeList;
            };
            var transformAuthAndTypeToString = function (authAndTypeList) {
                var authAndTypeStr = "";
                for (var i = 0; i < authAndTypeList.length; i++) {
                    var tempStr = "[" + authAndTypeList[i].authenticationID + ":" + authAndTypeList[i].parameterType + "]";
                    if (authAndTypeStr.indexOf(tempStr) == -1) {
                        authAndTypeStr += tempStr;
                    }
                }
                return authAndTypeStr;
            };
            var eapMethodAdded = false;
            for (var i = 0; i < $scope.eapMethodOptions.data.length; i++) {
                var temp = $scope.eapMethodOptions.data[i];
                if (parseInt(temp.eapMethod) == parseInt($scope.temporary.eapMethod)) {
                    var authAndTypeStr = "";
                    var authAndTypeAdded = true;
                    var authAndTypeList = transformAuthAndTypeToObject(temp.authAndType);
                    for (var j = 0; j < $scope.temporary.authAndTypeList.length; j++) {
                        var tempStr = "[" + $scope.temporary.authAndTypeList[j].authenticationID + ":" + $scope.temporary.authAndTypeList[j].parameterType + "]";
                        if (authAndTypeStr.indexOf(tempStr) == -1) {
                            authAndTypeStr += tempStr;
                        }
                        for (var k = 0; k < authAndTypeList.length; k++) {
                            if (parseInt($scope.temporary.authAndTypeList[j].authenticationID) != parseInt(authAndTypeList[k].authenticationID) ||
                                parseInt($scope.temporary.authAndTypeList[j].parameterType) != parseInt(authAndTypeList[k].parameterType)) {
                                authAndTypeAdded = false;
                            }
                        }
                    }
                    eapMethodAdded = true;
                    if (authAndTypeAdded) {
                        break;
                    }
                    else {
                        if (authAndTypeStr) {
                            temp.authAndType += authAndTypeStr;
                        }
                    }
                }
            }
            if (!eapMethodAdded) {
                $scope.eapMethodOptions.data.push({
                    eapMethod: $scope.temporary.eapMethod,
                    authAndType: transformAuthAndTypeToString($scope.temporary.authAndTypeList)
                });
            }
            $scope.temporary.eapMethod = '';
            $scope.temporary.authAndTypeList = [];
        };

        $scope.delEapMethod = function (r) {
            var delIndex = r.$$hashKey;
            for (var i = 0; i < $scope.eapMethodOptions.data.length; i++) {
                if ($scope.eapMethodOptions.data[i].$$hashKey == delIndex) {
                    $scope.eapMethodOptions.data.splice(i, 1);
                }
            }
        };

        $scope.addNaiRealmList = function () {
            var transformNaiRealmsToString = function (naiRealmList) {
                var naiRealmsStr = "";
                for (var i = 0; i < naiRealmList.length; i++) {
                    if (naiRealmsStr.indexOf(naiRealmList[i].domainName) != -1) {
                        continue;
                    }
                    if (i == (naiRealmList.length - 1)) {
                        naiRealmsStr += naiRealmList[i].domainName;
                    }
                    else {
                        naiRealmsStr += naiRealmList[i].domainName + ";";
                    }
                }
                return naiRealmsStr;
            };
            var transformEapMethodsToString = function (eapMethodList) {
                var eapMethodStr = "";
                for (var i = 0; i < eapMethodList.length; i++) {
                    if (i == (eapMethodList.length - 1)) {
                        eapMethodStr += eapMethodList[i].eapMethod + eapMethodList[i].authAndType;
                    } else {
                        eapMethodStr += eapMethodList[i].eapMethod + eapMethodList[i].authAndType + ",";
                    }
                }
                return eapMethodStr;
            };
            var transformEapMethodsToObject = function (eapMethodsStr) {
                var eapMethodList = [];
                if (eapMethodsStr) {
                    var arr1 = eapMethodsStr.split(",");
                    for (var i = 0; i < arr1.length; i++) {
                        var eapMethod = arr1[i].replace(/\[.*\]/g, '');
                        var authAndType = arr1[i].replace(eapMethod, '');
                        eapMethodList.push({eapMethod: eapMethod, authAndType: authAndType});
                    }
                }
                return eapMethodList;
            };
            var originNaiRealmList = angular.copy($scope.naiRealmListOptions.data);
            // var naiRealmAdded = false;
            // if($scope.naiRealmListOptions.data.length > 0){
            //     for(var i = 0; i< $scope.naiRealmListOptions.data.length; i++) {
            //         var temp = $scope.naiRealmListOptions.data[i];
            //         for(var j = 0; j< $scope.temporary.naiRealmList.length; j++) {
            //             if(temp.naiRealms && temp.naiRealms.indexOf($scope.temporary.naiRealmList[j].domainName) != -1) {
            //                 naiRealmAdded = true;
            //                 break;
            //             }
            //         }
            //         if(naiRealmAdded) {
            //             break;
            //         }
            //     }
            //     if(naiRealmAdded) {
            //         $scope.state.ssid.isNaiRealmListError = true;
            //         $scope.state.ssid.gridNaiRealmListError = 'configuration.ssid.naiRealmExist';
            //         return;
            //     }
            // }
            // if($scope.naiRealmListOptions.data.length == 0 || !naiRealmAdded) {
            //     var rfc4282 = $scope.temporary.rfc4282 == 1? 'Yes' : 'No';
            //     var naiRealmsStr = transformNaiRealmsToString($scope.temporary.naiRealmList);
            //     var eapMethodStr = transformEapMethodsToString($scope.eapMethodOptions.data);
            //     $scope.naiRealmListOptions.data.push({rfc4282: rfc4282, naiRealms: naiRealmsStr, eapMethod: eapMethodStr});
            // }
            var rfc4282 = $scope.temporary.rfc4282 == 1 ? 'Yes' : 'No';
            var naiRealmsStr = transformNaiRealmsToString($scope.temporary.naiRealmList);
            var eapMethodStr = transformEapMethodsToString($scope.eapMethodOptions.data);
            $scope.naiRealmListOptions.data.push({rfc4282: rfc4282, naiRealms: naiRealmsStr, eapMethod: eapMethodStr});
            if ($scope.naiRealmListOptions.data.length > 4) {
                $scope.naiRealmListOptions.data = originNaiRealmList;
                $scope.state.ssid.isNaiRealmListError = true;
                $scope.state.ssid.gridNaiRealmListError = 'configuration.ssid.gridEapMethodError';
                return;
            }
            var naiRealms = '';
            for (var i = 0; i < $scope.naiRealmListOptions.data.length; i++) {
                var encoding = $scope.naiRealmListOptions.data[i].rfc4282 == "Yes" ? 1 : 0;
                if (i == $scope.naiRealmListOptions.data.length - 1) {
                    naiRealms += encoding + "," + $scope.naiRealmListOptions.data[i].naiRealms + "," + $scope.naiRealmListOptions.data[i].eapMethod;
                }
                else {
                    naiRealms += encoding + "," + $scope.naiRealmListOptions.data[i].naiRealms + "," + $scope.naiRealmListOptions.data[i].eapMethod + ";";
                }
            }
            if (naiRealms.length > 199) {
                $scope.naiRealmListOptions.data = originNaiRealmList;
                $scope.state.ssid.isNaiRealmListError = true;
                $scope.state.ssid.gridNaiRealmListError = 'configuration.ssid.gridError';
                return;
            }
            $scope.naiRealmListLength = naiRealms.length;
            $scope.state.ssid.isNaiRealmListError = false;
            $scope.temporary.naiRealmList = [];
            $scope.eapMethodOptions.data = [];
        };

        $scope.delNaiRealmList = function (r) {
            var delIndex = r.$$hashKey;
            for (var i = 0; i < $scope.naiRealmListOptions.data.length; i++) {
                if ($scope.naiRealmListOptions.data[i].$$hashKey == delIndex) {
                    $scope.naiRealmListOptions.data.splice(i, 1);
                }
            }
            var naiRealms = '';
            for (var i = 0; i < $scope.naiRealmListOptions.data.length; i++) {
                var encoding = $scope.naiRealmListOptions.data[i].rfc4282 == "Yes" ? 1 : 0;
                if (i == $scope.naiRealmListOptions.data.length - 1) {
                    naiRealms += encoding + "," + $scope.naiRealmListOptions.data[i].naiRealms + "," + $scope.naiRealmListOptions.data[i].eapMethod;
                }
                else {
                    naiRealms += encoding + "," + $scope.naiRealmListOptions.data[i].naiRealms + "," + $scope.naiRealmListOptions.data[i].eapMethod + ";";
                }
            }
            $scope.naiRealmListLength = naiRealms.length;
        };

        // Connection Capability
        $scope.connectionCapabilityAdded = false;
        $scope.addConnectionCapability = function () {
            var data = angular.copy($scope.temporary);
            data.ipProtocolKey = data.ipProtocol;
            data.statusKey = data.status;
            data.ipProtocol = TS.ts("configuration.ipProtocol" + data.ipProtocol);
            data.status = TS.ts("configuration.status" + data.status);

            for (var i = 0; i < $scope.connectionCapabilityOptions.data.length; i++) {
                var temp = $scope.connectionCapabilityOptions.data[i];

                if (temp.ipProtocol == data.ipProtocol && temp.portNumber == $scope.temporary.portNumber && temp.status == data.status) {
                    $scope.connectionCapabilityAdded = true;
                    return;
                }
            }

            $scope.connectionCapabilityOptions.data.push(data);

            $scope.temporary.portNumber = 0;
        };

        $scope.connectionCapabilityChange = function () {
            $scope.connectionCapabilityAdded = false;
        };

        $scope.delConnectionCapability = function (r) {

            var delIndex = r.$$hashKey;
            for (var i = 0; i < $scope.connectionCapabilityOptions.data.length; i++) {
                if ($scope.connectionCapabilityOptions.data[i].$$hashKey == delIndex) {
                    $scope.connectionCapabilityOptions.data.splice(i, 1);
                    return;
                }
            }
            ;
        };

        // OSU Method List
        $scope.osuMethodAdded = false;
        $scope.addOSUMethod = function () {
            var data = angular.copy($scope.temporary);
            data.languageCodeKey = data.languageCode;
            data.languageCode = TS.ts("configuration.language" + data.languageCode);

            for (var i = 0; i < $scope.OSUMethodListOptions.data.length; i++) {
                var temp = $scope.OSUMethodListOptions.data[i];
                if (temp.languageCode == data.languageCode && temp.method == $scope.temporary.method) {
                    $scope.osuMethodAdded = true;
                    return;
                }
            }
            var osuMethod = data.languageCodeKey + ":" + $scope.temporary.method;

            var OSUMethodSize = $scope.OSUMethodListOptions.data.length;
            var methodList = '';

            for (var i = 0; i < OSUMethodSize; i++) {
                switch ($scope.OSUMethodListOptions.data[i].languageCode) {
                    case "English":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'en';
                        break;
                    case "Français":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'fr';
                        break;
                    case "Deutsch":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'de';
                        break;
                    case "Español":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'es';
                        break;
                    case "Português":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'pt';
                        break;
                    case "русский язык":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'ru';
                        break;
                    case "In italiano":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'it';
                        break;
                    case "Turkish":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'tr';
                        break;
                }
                methodList = methodList + $scope.OSUMethodListOptions.data[i].languageCodeKey + ':'
                    + $scope.OSUMethodListOptions.data[i].method;
                if (i == (OSUMethodSize - 1)) {
                }
                else {
                    methodList = methodList + ','
                }
            }

            if (((osuMethod.length == 199 && methodList.length == 0) || (osuMethod.length + methodList.length) == 198) || (osuMethod.length + methodList.length) < 199) {
                $scope.OSUMethodListOptions.data.push(data);
                var OSUMethodSize = $scope.OSUMethodListOptions.data.length;
                var methodList = '';
                for (var i = 0; i < OSUMethodSize; i++) {

                    methodList = methodList + $scope.OSUMethodListOptions.data[i].languageCodeKey + ':'
                        + $scope.OSUMethodListOptions.data[i].method;
                    if (i == (OSUMethodSize - 1)) {
                    }
                    else {
                        methodList = methodList + ','
                    }
                }
                $scope.methodListLength = methodList.length; // char == 199
                $scope.state.ssid.osuMethodError = false;
            } else {
                $scope.state.ssid.osuMethodError = true;
                $scope.state.ssid.msgFalse = 'configuration.ssid.gridError';
            }
            $scope.temporary.method = '';

        };

        $scope.osuMethodChange = function () {
            $scope.osuMethodAdded = false;
        };

        $scope.delOSUMethod = function (r) {

            var delIndex = r.$$hashKey;
            for (var i = 0; i < $scope.OSUMethodListOptions.data.length; i++) {
                if ($scope.OSUMethodListOptions.data[i].$$hashKey == delIndex) {
                    $scope.OSUMethodListOptions.data.splice(i, 1);
                    var OSUMethodSize = $scope.OSUMethodListOptions.data.length;
                    var methodList = '';

                    for (var i = 0; i < OSUMethodSize; i++) {
                        methodList = methodList + $scope.OSUMethodListOptions.data[i].languageCodeKey + ':'
                            + $scope.OSUMethodListOptions.data[i].method;
                        if (i == (OSUMethodSize - 1)) {
                        }
                        else {
                            methodList = methodList + ','
                        }
                    }
                    $scope.methodListLength = methodList.length;

                    $scope.state.ssid.osuMethodError = false;
                    return;
                }
            }
            ;
        };

        /*
         * 页面操作
         */
        // SSID
        $scope.editSSIDStatus = null;
        $scope.copyDateForReset = null;
        $scope.editSSIDAuthType = null;
        $scope.editSSID = function (r) {
            $scope.copyDateForReset = r;
            $scope.showpage = {
                'Security': true,
                'Access control': true,
                'User Authentication': true,
                'Hotspot 2.0': true
            };
            // 记录编辑数据的索引
            $scope.editSSIDStatus = r.$$hashKey;
            var editData = angular.copy(r);

            delete $scope.temporary.hotspot2;
            delete $scope.temporary.i80211kvr;
            for (var x in editData) {
                $scope.temporary[x] = editData[x];
            }

            switch ($scope.temporary.authentication) {
                case 101:
                    $scope.temporary.authentication = 1;
                    $scope.temporary.i80211kvr = 1;
                    break;
                case 102:
                    $scope.temporary.authentication = 2;
                    $scope.temporary.i80211kvr = 1;
                    break;
                case 103:
                    $scope.temporary.authentication = 3;
                    $scope.temporary.i80211kvr = 1;
                    break;
                case 104:
                    $scope.temporary.authentication = 4;
                    $scope.temporary.i80211kvr = 1;
                    break;
                case 105:
                    $scope.temporary.authentication = 5;
                    $scope.temporary.i80211kvr = 1;
                    break;
                case 106:
                    $scope.temporary.authentication = 6;
                    $scope.temporary.i80211kvr = 1;
                    break;
                case 107:
                    $scope.temporary.authentication = 7;
                    $scope.temporary.i80211kvr = 1;
                    break;
                case 108:
                    $scope.temporary.authentication = 8;
                    $scope.temporary.i80211kvr = 1;
                    break;
                case 109:
                    $scope.temporary.authentication = 9;
                    $scope.temporary.i80211kvr = 1;
                    break;
                case 110:
                    $scope.temporary.authentication = 10;
                    $scope.temporary.i80211kvr = 1;
                    break;
            }

            if (!$scope.temporary.i80211kvr) {
                $scope.temporary.i80211kvr = 0;
            }

            switch ($scope.temporary.authType) {
                case 100:
                    $scope.temporary.authType = 0;
                    break;
                case 101:
                    $scope.temporary.authType = 1;
                    break;
                case 102:
                    $scope.temporary.authType = 2;
                    break;
                case 104:
                    $scope.temporary.authType = 4;
                    break;
                case 105:
                    $scope.temporary.authType = 5;
                    break;
                case 106:
                    $scope.temporary.authType = 6;
                    break;
                case 107:
                    $scope.temporary.authType = 7;
                    break;
                case 108:
                    $scope.temporary.authType = 8;
                    break;
                case 109:
                    $scope.temporary.authType = 9;
                    break;
                case 110:
                    $scope.temporary.authType = 10;
                    break;
                case 111:
                    $scope.temporary.authType = 11;
                    break;
            }
            // 按下Add 按鈕時, Hotspot Enabled下拉選項須為Enabled, 才有$scope.temporary.hotspot2的值
            if ($scope.temporary.hotspot2) {
                $scope.temporary.enabled = $scope.temporary.hotspot2.enabled;
                $scope.temporary.osen = $scope.temporary.hotspot2.osen;
                $scope.temporary.accessCrossConnection = $scope.temporary.hotspot2.allowCrossConn;
                $scope.temporary.managep2p = $scope.temporary.hotspot2.manageP2P;
                $scope.temporary.dgaf = $scope.temporary.hotspot2.dgaf;
                $scope.temporary.proxyAPR = $scope.temporary.hotspot2.proxyArp;
                $scope.temporary.l2TIF = $scope.temporary.hotspot2.l2tif;
                $scope.temporary.interworking = $scope.temporary.hotspot2.interworking;
                $scope.temporary.accessNetworkType = $scope.temporary.hotspot2.accessNetType;
                $scope.temporary.internet = $scope.temporary.hotspot2.internet;
                $scope.temporary.asra = $scope.temporary.hotspot2.asra;
                $scope.temporary.esr = $scope.temporary.hotspot2.esr;
                $scope.temporary.usea = $scope.temporary.hotspot2.usea;
                $scope.temporary.venueGroup = $scope.temporary.hotspot2.venueGroup;
                $scope.temporary.venueType = $scope.temporary.hotspot2.venueType;
                if ($scope.temporary.hotspot2.venueName == '') {
                    $scope.temporary.hotspot2.venueName = 'en:';
                } else {
                    $scope.temporary.venueNameString = $scope.temporary.hotspot2.venueName;
                }
                $scope.temporary.venueName = $scope.temporary.hotspot2.venueName.split(":")[0];
                $scope.temporary.venueNameText = $scope.temporary.hotspot2.venueName.split(":")[1];
                // console.log()
                $scope.temporary.hessid = $scope.temporary.hotspot2.hessid;
                $scope.temporary.wanMetrics = $scope.temporary.hotspot2.wanData;
                // $scope.temporary.OSUIconWidth = $scope.temporary.hotspot2.OSUIconWidth;
                var ConvertBase = function (num) {
                    return {
                        from: function (baseFrom) {
                            return {
                                to: function (baseTo) {
                                    return parseInt(num, baseFrom).toString(baseTo);
                                }
                            };
                        }
                    };
                };

                var wanLinkStatus = ('0000' + ConvertBase($scope.temporary.hotspot2.wanData.split(":")[0]).from(16).to(2)).slice(-2);
                switch (wanLinkStatus) {
                    case '01':
                        $scope.temporary.wanLinkStatus = 1;
                        break;
                    case '10':
                        $scope.temporary.wanLinkStatus = 2;
                        break;
                    case '11':
                        $scope.temporary.wanLinkStatus = 3;
                        break;
                }
                $scope.temporary.wanSymmetricLink = parseInt(('0000' + ConvertBase($scope.temporary.hotspot2.wanData.split(":")[0]).from(16).to(2)).slice(-4).slice(1, 2));
                $scope.temporary.wanAtCapacity = parseInt(('0000' + ConvertBase($scope.temporary.hotspot2.wanData.split(":")[0]).from(16).to(2)).slice(-4).slice(0, 1));
                $scope.temporary.wanMetricsDLSpeed = $scope.temporary.hotspot2.wanData.split(":")[1];
                $scope.temporary.wanMetricsULSpeed = $scope.temporary.hotspot2.wanData.split(":")[2];
                $scope.temporary.networkAuthType = $scope.temporary.hotspot2.netAuthType.slice(0, 2);
                $scope.temporary.networkAuthURL = $scope.temporary.hotspot2.netAuthType.slice(2);
                $scope.temporary.ipAddressTypeAvailability = $scope.temporary.hotspot2.ipAddrTypeAvail;
                // $scope.temporary.roamingConsortium = $scope.temporary.hotspot2.roamingConsortium;
                $scope.temporary.gppCellularNetwork = $scope.temporary.hotspot2.threeGppCellNet;
                $scope.temporary.connectionCapability = $scope.temporary.hotspot2.connCapability;
                $scope.temporary.connectionCapabilityName = $scope.connectionCapabilityNameStr;
                $scope.temporary.operatorFriendlyNameString = $scope.temporary.hotspot2.operFriendlyName;
                $scope.temporary.operatorFriendlyName = $scope.temporary.hotspot2.operFriendlyName.split(":")[0];
                $scope.temporary.operatorFriendlyNameText = $scope.temporary.hotspot2.operFriendlyName.split(":")[1];
                $scope.temporary.OSUSSID = $scope.temporary.hotspot2.osuSSID;
                $scope.temporary.OSUServerURI = $scope.temporary.hotspot2.osuServerUri;
                $scope.temporary.OSULanguageCode = $scope.temporary.hotspot2.osuLangCode;
                $scope.temporary.OSUFriendlyNameString = $scope.temporary.hotspot2.osuFriendlyName;
                $scope.temporary.OSUFriendlyName = $scope.temporary.hotspot2.osuFriendlyName.split(":")[0];
                $scope.temporary.OSUFriendlyNameText = $scope.temporary.hotspot2.osuFriendlyName.split(":")[1];

                if ($scope.temporary.hotspot2.osuNai == '') {
                    $scope.temporary.OSUNai = '';
                    $scope.temporary.OSUNaiURL = '';
                } else {
                    $scope.temporary.OSUNai = $scope.temporary.hotspot2.osuNai.split("@")[0];
                    $scope.temporary.OSUNaiURL = $scope.temporary.hotspot2.osuNai.split("@")[1];
                }

                $scope.temporary.OSUServiceDescription = $scope.temporary.hotspot2.osuServiceDesc;
                $scope.temporary.OSU = $scope.temporary.hotspot2.osuIcon;
                $scope.temporary.OSUIconLanguageCode = $scope.temporary.hotspot2.osuIcon.split(":")[2];
                $scope.temporary.OSUIconFilePath = $scope.temporary.hotspot2.osuIcon.split(":")[5];
                $scope.temporary.OSUIconFileName = $scope.temporary.hotspot2.osuIcon.split(":")[4];
                $scope.temporary.OSUIconWidth = $scope.temporary.hotspot2.osuIcon.split(":")[0];
                $scope.temporary.OSUIconHeight = $scope.temporary.hotspot2.osuIcon.split(":")[1];
                $scope.temporary.OSUIconType = $scope.temporary.hotspot2.osuIcon.split(":")[3];
                $scope.temporary.methodList = $scope.temporary.hotspot2.osuMethod;
                $scope.temporary.methodListName = $scope.methodListNameStr;
                $scope.temporary.OSUConfig = $scope.temporary.hotspot2.osuConfig;
                $scope.temporary.domainNameList = $scope.temporary.hotspot2.domainName;
                $scope.temporary.roamingConsortiumList = $scope.temporary.hotspot2.roamingConsortium;
                $scope.temporary.naiRealm = $scope.temporary.hotspot2.naiRealm;
            } else {
                if ($scope.temporary.hotspot2) {
                    $scope.temporary.hotspot2.enabled = 0;
                }
                $scope.temporary.enabled = 0;
                $scope.temporary.osen = 0;
                $scope.temporary.accessCrossConnection = 0;
                $scope.temporary.managep2p = 0;
                $scope.temporary.dgaf = 1;
                $scope.temporary.proxyAPR = 0;
                $scope.temporary.l2TIF = 0;
                $scope.temporary.interworking = 0;
                $scope.temporary.accessNetworkType = 0;
                $scope.temporary.internet = 0;
                $scope.temporary.asra = 0;
                $scope.temporary.esr = 0;
                $scope.temporary.usea = 0;
                $scope.temporary.venueGroup = 0;
                $scope.temporary.venueType = 0;
                $scope.temporary.venueName = 'en';
                $scope.temporary.venueNameText = '';
                $scope.temporary.hessid = '';
                $scope.temporary.wanLinkStatus = 1;
                $scope.temporary.wanSymmetricLink = 1;
                $scope.temporary.wanAtCapacity = 0;
                $scope.temporary.wanMetricsDLSpeed = 0;
                $scope.temporary.wanMetricsULSpeed = 0;
                $scope.temporary.networkAuthType = '00';
                $scope.temporary.networkAuthURL = '';
                $scope.temporary.ipAddressTypeAvailability = 0;
                $scope.temporary.domainName = '';
                $scope.temporary.roamingConsortium = '';
                $scope.temporary.mcc = "000";
                $scope.temporary.mnc = "00";
                $scope.temporary.ipProtocol = 1;
                $scope.temporary.portNumber = 0;
                $scope.temporary.status = 0;
                $scope.temporary.operatorFriendlyName = 'en';
                $scope.temporary.operatorFriendlyNameText = '';
                $scope.temporary.OSUSSID = '';
                $scope.temporary.OSUServerURI = '';
                $scope.temporary.languageCode = 'en';
                $scope.temporary.method = '';
                $scope.temporary.OSUConfig = 0;
                $scope.temporary.OSULanguageCode = 'en';
                $scope.temporary.OSUFriendlyName = 'en';
                $scope.temporary.OSUFriendlyNameText = '';
                $scope.temporary.OSUNai = '';
                $scope.temporary.OSUNaiURL = '';
                $scope.temporary.OSUNaiString = '';
                $scope.temporary.OSUServiceDescription = '';
                $scope.temporary.OSUIconLanguageCode = 'en';
                $scope.temporary.OSUIconFilePath = '';
                $scope.temporary.OSUIconFileName = '';
                $scope.temporary.OSUIconWidth = 0;
                $scope.temporary.OSUIconHeight = 0;
                $scope.temporary.OSUIconType = 'image/png';
                $scope.temporary.wanMetrics = '';
                $scope.temporary.OSU = '';
                $scope.temporary.venueNameString = '';
                $scope.temporary.operatorFriendlyNameString = '';
                $scope.temporary.OSUFriendlyNameString = '';
                $scope.temporary.domainNameList = '';
                $scope.temporary.roamingConsortiumList = '';
                $scope.temporary.naiRealm = '';
                $scope.temporary.naiRealmList = [];
                $scope.temporary.eapMethod = '';
                $scope.temporary.authAndTypeList = [];
                $scope.temporary.rfc4282 = 1;
                $scope.temporary.gppCellularNetwork = '';
                $scope.temporary.methodList = '';
                $scope.temporary.methodListName = '';
                $scope.temporary.connectionCapability = '';
                $scope.temporary.connectionCapabilityName = '';
            }

            $scope.editSSIDAuthType = $scope.temporary.authType;
            if ($scope.temporary.ssidIndex == 1) {
                if ($scope.temporary.band == 1) {
                    $scope.temporary.wmm = $scope.performanceData.band24.wmm ? 1 : '0';
                }
                if ($scope.temporary.band == 2) {
                    $scope.temporary.wmm = $scope.performanceData.band5.wmm ? 1 : '0';
                }
                if ($scope.temporary.band == 3) {
                    $scope.temporary.wmm = $scope.performanceData.secBand5.wmm ? 1 : '0';
                }
            }
            if ($scope.temporary.band == 1) {
                if ($scope.performanceData.band24.wirelessMode == 3) {
                    $scope.authentications = [1, 6, 7, 8, 9];
                    if ($scope.temporary.authentication == 10) {
                        $scope.temporary.authentication = 1;
                    }
                } else {
                    $scope.authentications = [1, 6, 7, 8, 9, 10];
                }
            }
            else {
                if (($scope.temporary.band == 2 && $scope.performanceData.band5.wirelessMode == 6) || ($scope.temporary.band == 3 && $scope.performanceData.secBand5.wirelessMode == 6)) {
                    $scope.authentications = [1, 6, 7, 8, 9];
                    if ($scope.temporary.authentication == 10) {
                        $scope.temporary.authentication = 1;
                    }
                } else {
                    $scope.authentications = [1, 6, 7, 8, 9, 10];
                }
            }

            // $scope.loginTemplate.select
            for (var i = 0; i < $scope.loginTemplates.length; i++) {
                if ($scope.temporary.splashPageCustom == $scope.loginTemplates[i].name + '.tar') {
                    $scope.loginTemplate.select = $scope.loginTemplates[i];
                }
            }
            // $scope.copyDateForReset = angular.copy($scope.temporary);
            // grid 赋值
            // Todo angular.copy
            $scope.addressOptions.data = [];
            for (var i = 0; i < $scope.temporary.macList.length; i++) {
                $scope.addressOptions.data.push({macAddr: $scope.temporary.macList[i]})
            }
            $scope.whiteListOptions.data = [];
            for (var i = 0; i < $scope.temporary.macByPass.length; i++) {
                $scope.whiteListOptions.data.push({mac: $scope.temporary.macByPass[i]})
            }
            $scope.gardenOptions.data = [];
            for (var i = 0; i < $scope.temporary.walledGarden.length; i++) {
                $scope.gardenOptions.data.push({ip: $scope.temporary.walledGarden[i]})
            }
            // $scope.addressOptions.data = $scope.temporary.macList;

            // Domain Name List
            var domainNameListOptions = [];
            $scope.domainNameListLength = $scope.temporary.domainNameList.length;
            if ($scope.temporary.domainNameList) {
                var domainNameList = $scope.temporary.domainNameList.split(",");
                var domainNameSize = domainNameList.length;

                for (var i = 0; i < domainNameSize; i++) {
                    domainNameListOptions[i] = {
                        'domainName': domainNameList[i].split(",")[0]
                    }
                }
            }
            $scope.domainNameListOptions.data = domainNameListOptions;

            // Roaming Consortium
            var roamingConsortiumOptions = [];
            $scope.roamingConsortiumListSizeLength = $scope.temporary.roamingConsortiumList.length;
            if ($scope.temporary.roamingConsortiumList) {
                var roamingConsortiumList = $scope.temporary.roamingConsortiumList.split("&");
                var roamingConsortiumListSize = roamingConsortiumList.length;

                for (var i = 0; i < roamingConsortiumListSize; i++) {
                    roamingConsortiumOptions[i] = {
                        'roamingConsortium': roamingConsortiumList[i].split("＆")[0]
                    }
                }
            }
            $scope.roamingConsortiumOptions.data = roamingConsortiumOptions;

            //NAI Realm List
            var naiRealmListOptions = [];
            $scope.naiRealmListLength = ($scope.temporary.naiRealm != undefined ? $scope.temporary.naiRealm.length : 0);
            if ($scope.temporary.naiRealm.length > 0) {
                var naiRealmList = ($scope.temporary.naiRealm.replace(/\]\:/g, "]&&")).split("&&");
                for (var i = 0; i < naiRealmList.length; i++) {
                    var naiRealmArray = naiRealmList[i].split(",");
                    if (naiRealmArray.length >= 3) {
                        var rfc4282 = parseInt(naiRealmArray[0]) == 1 ? "Yes" : "No";
                        var naiRealms = naiRealmArray[1];
                        var eapMethod = '';
                        for (var j = 2; j < naiRealmArray.length; j++) {
                            if (j == (naiRealmArray.length - 1)) {
                                eapMethod += naiRealmArray[j];
                            } else {
                                eapMethod += naiRealmArray[j] + ",";
                            }
                        }
                        naiRealmListOptions.push({rfc4282: rfc4282, naiRealms: naiRealms, eapMethod: eapMethod});
                    }
                }
            }
            $scope.naiRealmListOptions.data = naiRealmListOptions;

            // 3gpp Cellular Network
            var gppCellularNetworkOptions = [];
            if ($scope.temporary.gppCellularNetwork) {
                var gppCellularNetwork = $scope.temporary.gppCellularNetwork.split(";");
                var gppCellularNetworkSize = gppCellularNetwork.length;

                for (var i = 0; i < gppCellularNetworkSize; i++) {
                    gppCellularNetworkOptions[i] = {
                        'mcc': gppCellularNetwork[i].split(",")[0],
                        'mnc': gppCellularNetwork[i].split(",")[1]
                    }
                }
            }
            $scope.gppCellularNetworkOptions.data = gppCellularNetworkOptions;

            // OSU Method List
            var OSUMethodListOptions = [];
            if ($scope.temporary.methodList) {
                var methodList = $scope.temporary.methodList.split(",");
                var OSUMethodSize = methodList.length;

                for (var i = 0; i < OSUMethodSize; i++) {
                    switch (methodList[i].split(":")[0]) {
                        case "en":
                            var languageCode = 'English';
                            break;
                        case "fr":
                            var languageCode = 'Français';
                            break;
                        case "de":
                            var languageCode = 'Deutsch';
                            break;
                        case "es":
                            var languageCode = 'Español';
                            break;
                        case "pt":
                            var languageCode = 'Português';
                            break;
                        case "ru":
                            var languageCode = 'русский язык';
                            break;
                        case "it":
                            var languageCode = 'In italiano';
                            break;
                        case "tr":
                            var languageCode = 'Turkish';
                            break;
                    }
                    OSUMethodListOptions[i] = {
                        'languageCode': languageCode,
                        'method': methodList[i].split(":")[1]
                    }
                }
            }
            $scope.OSUMethodListOptions.data = OSUMethodListOptions;

            // Connection Capability
            var connectionCapabilityOptions = [];

            if ($scope.temporary.connectionCapability) {
                var connectionCapability = $scope.temporary.connectionCapability.split(",")
                var connectionCapabilitySize = connectionCapability.length;
                for (var i = 0; i < connectionCapabilitySize; i++) {
                    switch (connectionCapability[i].split(":")[0]) {
                        case "1":
                            var ipProtocol = 'ICMP';
                            break;
                        case "6":
                            var ipProtocol = 'TCP';
                            break;
                        case "17":
                            var ipProtocol = 'UDP';
                            break;
                    }
                    switch (connectionCapability[i].split(":")[2]) {
                        case "0":
                            var status = 'Closed';
                            break;
                        case "1":
                            var status = 'Open';
                            break;
                        case "2":
                            var status = 'Unknown';
                            break;
                    }
                    connectionCapabilityOptions[i] = {
                        'ipProtocol': ipProtocol,
                        'ipProtocolKey': connectionCapability[i].split(":")[0],
                        'portNumber': connectionCapability[i].split(":")[1],
                        'status': status,
                        'statusKey': connectionCapability[i].split(":")[2]
                    }
                }
            }
            $scope.connectionCapabilityOptions.data = connectionCapabilityOptions;

            $scope.ipFilterOptions.data = $scope.temporary.ipFilter;
            // $scope.whiteListOptions.data = $scope.temporary.macByPass;
            $scope.userPassOptions.data = $scope.temporary.userPwd;
            // $scope.passcodeOptions.data = $scope.temporary.passcodeList;
            // label  checkbox赋值
            $scope.temporary.webRedirectState = $scope.temporary.webRedirectState == 1;
            $scope.temporary.LDAPAutoCopy = $scope.temporary.LDAPAutoCopy == 1;
            $scope.temporary.whitelistStatus = $scope.temporary.whitelistStatus == 1;
            // webRedirectUrl 字符串拆分
            if ($scope.temporary.webRedirectUrl) {
                var arr = $scope.temporary.webRedirectUrl.split("//");
                $scope.websiteType.select = arr[0].length == 5 ? $scope.websites[0] : $scope.websites[1];
                $scope.temporary.webRedirectUrl = arr[1];
            }
            ;
            // externalCaptPort 字符串拆分
            if ($scope.temporary.externalCaptPort) {
                var arr = $scope.temporary.externalCaptPort.split("//");
                $scope.websiteType1.select = arr[0].length == 5 ? $scope.websites[0] : $scope.websites[1];
                $scope.temporary.externalCaptPort = arr[1];
            }
            $scope.websiteType2.select = $scope.temporary.ehpScheme == 0 ? $scope.websites[0] : $scope.websites[1];
            loadPasscode($scope.temporary.ssid);
        };
        $scope.delSSID = function (r) {

            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: 'delSSIDDialog.html',
                windowClass: 'modal-del',
                resolve: {
                    r: r
                },
                size: "w500",
                controller: function ($scope, $uibModalInstance, r) {
                    $scope.con = {
                        title: TS.ts("configuration.ssid.delSSIDTitle"),
                        content: TS.ts("configuration.ssid.delSSIDTip"),
                        hint: TS.ts("configuration.ssid.delSSIDwarning"),
                        type: 'common:remove'
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
                //删除
                var ssid = {
                    band: r.band,
                    ssidIndex: r.ssidIndex
                };
                var delIndex = r.$$hashKey;
                var ssidname = r.ssid;
                // 调用接口删除ssid
                BatchConfigService.delSSID($scope.profileId, ssid, function (result) {
                    if (result.success) {
                        for (var i = $scope.SSIDOptions.data.length - 1; i >= 0; i--) {
                            if ($scope.wirelessData.bandSteer.status == 1) {
                                if ($scope.SSIDOptions.data[i].ssid == ssidname) {
                                    $scope.SSIDOptions.data.splice(i, 1);
                                }
                            } else {
                                if ($scope.SSIDOptions.data[i].$$hashKey == delIndex) {
                                    $scope.SSIDOptions.data.splice(i, 1);
                                }
                            }
                        }
                        setMACListLen();
                        resetAuthType();
                        $scope.$emit('refreshBCTree');
                        $scope.$emit('refreshActiveProfile');
                    }
                }, function () {
                });
            }, function () {

            });
        };

        var changeSSIDData = function () {
            var ousIcon = $scope.temporary.OSUIconWidth + ':' + $scope.temporary.OSUIconHeight + ':' +
                $scope.temporary.OSUIconLanguageCode + ':' + $scope.temporary.OSUIconType + ':' + $scope.temporary.OSUIconFileName + ':' +
                $scope.temporary.OSUIconFilePath;

            if (ousIcon.length > 199) {
                $scope.state.ssid.isError = true;
                $scope.state.ssid.msgFalse = 'configuration.ssid.osuIconIsError';
                cancleAlert();
                return;
            } else {
                $scope.temporary.OSU = ousIcon;
            }

            $scope.temporary.webRedirectState = $scope.temporary.webRedirectState ? 1 : 0;
            $scope.temporary.LDAPAutoCopy = $scope.temporary.LDAPAutoCopy ? 1 : 0;
            $scope.temporary.whitelistStatus = $scope.temporary.whitelistStatus ? 1 : 0;
            if ($scope.temporary.webRedirectUrl != '') {
                $scope.temporary.webRedirectUrl = $scope.websiteType.select + $scope.temporary.webRedirectUrl;
            }
            ;
            if ($scope.temporary.externalCaptPort != '') {
                $scope.temporary.externalCaptPort = $scope.websiteType1.select + $scope.temporary.externalCaptPort;
            }
            if ($scope.temporary.ehpPath != '') {
                $scope.temporary.ehpScheme = $scope.websiteType2.select == 'http://' ? 0 : 1;
            }
            $scope.temporary.macList = [];
            $scope.temporary.macByPass = [];
            $scope.temporary.walledGarden = [];
            for (var i = 0; i < $scope.addressOptions.data.length; i++) {
                $scope.temporary.macList.push($scope.addressOptions.data[i].macAddr)
            }
            for (var i = 0; i < $scope.whiteListOptions.data.length; i++) {
                $scope.temporary.macByPass.push($scope.whiteListOptions.data[i].mac)
            }
            for (var i = 0; i < $scope.gardenOptions.data.length; i++) {
                $scope.temporary.walledGarden.push($scope.gardenOptions.data[i].ip)
            }
            // $scope.temporary.macList = $scope.addressOptions.data;
            $scope.temporary.ipFilter = $scope.ipFilterOptions.data;
            // $scope.temporary.macByPass = $scope.whiteListOptions.data;
            $scope.temporary.userPwd = $scope.userPassOptions.data;
            // $scope.temporary.passcodeList = $scope.passcodeOptions.data;

            // WAN Metrics
            var ConvertBase = function (num) {
                return {
                    from: function (baseFrom) {
                        return {
                            to: function (baseTo) {
                                return parseInt(num, baseFrom).toString(baseTo);
                            }
                        };
                    }
                };
            };
            var wanInfoBinary = ('0000' + $scope.temporary.wanAtCapacity + $scope.temporary.wanSymmetricLink + ('00' + $scope.temporary.wanLinkStatus.toString(2)).slice(-2)).slice(-4)
            var wanInfo = ('00' + ConvertBase(wanInfoBinary).from(2).to(16).toUpperCase()).slice(-2);
            $scope.temporary.wanMetrics = wanInfo + ':' + $scope.temporary.wanMetricsDLSpeed + ':' + $scope.temporary.wanMetricsULSpeed + ':0:0:0';


            // Venue Name
            if ($scope.temporary.venueNameText == '') {
                $scope.temporary.venueNameString = '';
            } else {
                var venueNameString = $scope.temporary.venueName + ':' + $scope.temporary.venueNameText;
                $scope.temporary.venueNameString = venueNameString;
            }

            // OSU Nai
            if ($scope.temporary.OSUNaiURL == '') {
                $scope.temporary.OSUNaiString = '';
            } else {
                var OSUNaiString = $scope.temporary.OSUNai + '@' + $scope.temporary.OSUNaiURL;
                if (OSUNaiString.length <= 199) {
                    $scope.temporary.OSUNaiString = OSUNaiString;
                } else {
                    $scope.state.ssid.isError = true;
                    $scope.state.ssid.msgFalse = 'configuration.ssid.osuNaiIsError';
                    cancleAlert();
                    return;
                }
            }


            // Operator Friendly Name
            var operatorFriendlyNameString = $scope.temporary.operatorFriendlyName + ':' + $scope.temporary.operatorFriendlyNameText;
            $scope.temporary.operatorFriendlyNameString = operatorFriendlyNameString;

            // OSU Friendly Name
            var OSUFriendlyNameString = $scope.temporary.OSUFriendlyName + ':' + $scope.temporary.OSUFriendlyNameText;
            $scope.temporary.OSUFriendlyNameString = OSUFriendlyNameString;

            // Domain Name List
            var domainNameListSize = $scope.domainNameListOptions.data.length;
            var domainNameList = '';

            for (var i = 0; i < domainNameListSize; i++) {
                domainNameList = domainNameList + $scope.domainNameListOptions.data[i].domainName;
                if (i == (domainNameListSize - 1)) {
                }
                else {
                    domainNameList = domainNameList + ','
                }
            }

            $scope.temporary.domainNameList = domainNameList;

            // Roaming Consortium
            var roamingConsortiumListSize = $scope.roamingConsortiumOptions.data.length;
            var roamingConsortiumList = '';

            for (var i = 0; i < roamingConsortiumListSize; i++) {
                roamingConsortiumList = roamingConsortiumList + $scope.roamingConsortiumOptions.data[i].roamingConsortium;
                if (i == (roamingConsortiumListSize - 1)) {
                }
                else {
                    roamingConsortiumList = roamingConsortiumList + '&'
                }
            }

            $scope.temporary.roamingConsortiumList = roamingConsortiumList;


            // NAI Realm List
            if ($scope.naiRealmListOptions.data.length > 0) {
                var naiRealm = '';
                for (var i = 0; i < $scope.naiRealmListOptions.data.length; i++) {
                    var encoding = $scope.naiRealmListOptions.data[i].rfc4282 == 'Yes' ? 1 : 0;
                    if (i == ($scope.naiRealmListOptions.data.length - 1)) {
                        naiRealm += encoding + "," + $scope.naiRealmListOptions.data[i].naiRealms + "," + $scope.naiRealmListOptions.data[i].eapMethod;
                    }
                    else {
                        naiRealm += encoding + "," + $scope.naiRealmListOptions.data[i].naiRealms + "," + $scope.naiRealmListOptions.data[i].eapMethod + ";";
                    }
                }
                $scope.temporary.naiRealm = naiRealm;
            } else {
                $scope.temporary.naiRealm = '';
            }

            // 3gpp Cellular Network
            var gppCellularNetworkSize = $scope.gppCellularNetworkOptions.data.length;
            var gppCellularNetwork = '';

            for (var i = 0; i < gppCellularNetworkSize; i++) {
                gppCellularNetwork = gppCellularNetwork + $scope.gppCellularNetworkOptions.data[i].mcc + ','
                    + $scope.gppCellularNetworkOptions.data[i].mnc;
                if (i == (gppCellularNetworkSize - 1)) {
                }
                else {
                    gppCellularNetwork = gppCellularNetwork + ';'
                }
            }

            $scope.temporary.gppCellularNetwork = gppCellularNetwork;

            // OSU Method List
            var data = angular.copy($scope.temporary);
            data.languageCodeKey = data.languageCode;
            data.languageCode = TS.ts("configuration.language" + data.languageCode);
            var OSUMethodSize = $scope.OSUMethodListOptions.data.length;
            var methodList = '';
            var methodListName = '';

            for (var i = 0; i < OSUMethodSize; i++) {
                switch ($scope.OSUMethodListOptions.data[i].languageCode) {
                    case "English":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'en';
                        break;
                    case "Français":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'fr';
                        break;
                    case "Deutsch":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'de';
                        break;
                    case "Español":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'es';
                        break;
                    case "Português":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'pt';
                        break;
                    case "русский язык":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'ru';
                        break;
                    case "In italiano":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'it';
                        break;
                    case "Turkish":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'tr';
                        break;
                }
                methodList = methodList + $scope.OSUMethodListOptions.data[i].languageCodeKey + ':'
                    + $scope.OSUMethodListOptions.data[i].method;
                if (i == (OSUMethodSize - 1)) {
                }
                else {
                    methodList = methodList + ','
                }

            }

            for (var i = 0; i < OSUMethodSize; i++) {
                switch ($scope.OSUMethodListOptions.data[i].languageCode) {
                    case "English":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'en';
                        break;
                    case "Français":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'fr';
                        break;
                    case "Deutsch":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'de';
                        break;
                    case "Español":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'es';
                        break;
                    case "Português":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'pt';
                        break;
                    case "русский язык":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'ru';
                        break;
                    case "In italiano":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'it';
                        break;
                    case "Turkish":
                        $scope.OSUMethodListOptions.data[i].languageCodeKey = 'tr';
                        break;
                }
                methodListName = methodListName + $scope.OSUMethodListOptions.data[i].languageCode + ':'
                    + $scope.OSUMethodListOptions.data[i].method;
                if (i == (OSUMethodSize - 1)) {
                }
                else {
                    methodListName = methodListName + ','
                }
            }

            $scope.temporary.methodList = methodList;


            $scope.temporary.methodListName = methodListName;

            // Connection Capability
            var connectionCapabilitySize = $scope.connectionCapabilityOptions.data.length;
            var connectionCapability = '';
            var connectionCapabilityName = '';
            for (var i = 0; i < connectionCapabilitySize; i++) {
                connectionCapability = connectionCapability + $scope.connectionCapabilityOptions.data[i].ipProtocolKey + ':'
                    + $scope.connectionCapabilityOptions.data[i].portNumber + ':'
                    + $scope.connectionCapabilityOptions.data[i].statusKey;
                if (i == (connectionCapabilitySize - 1)) {
                }
                else {
                    connectionCapability = connectionCapability + ','
                }
            }
            for (var i = 0; i < connectionCapabilitySize; i++) {
                connectionCapabilityName = connectionCapabilityName + $scope.connectionCapabilityOptions.data[i].ipProtocol + ':'
                    + $scope.connectionCapabilityOptions.data[i].portNumber + ':'
                    + $scope.connectionCapabilityOptions.data[i].status;
                if (i == (connectionCapabilitySize - 1)) {
                }
                else {
                    connectionCapabilityName = connectionCapabilityName + ','
                }
            }

            // $scope.temporary.connectionCapability = $scope.connectionCapabilityOptions.data;
            $scope.temporary.connectionCapability = connectionCapability;
            $scope.temporary.connectionCapabilityName = connectionCapabilityName;

            $scope.temporary.splashPageCustom = $scope.loginTemplate.select.name + '.tar';

            /*
             * Todo
             * 根据页面实际情况判断并修改传输值
             */
            // 数据类型调整
            for (var i = 0; i < typeCoversion.length; i++) {
                $scope.temporary[typeCoversion[i]] -= 0;
            }
            ;
            // 将无效的值转为初始值
            for (var x in $scope.temporary) {
                if (typeof ($scope.temporary[x]) == "undefined") {
                    // 初始化 $scope.temporary[x] 的值
                    $scope.temporary[x] = initialValue[x];
                }
            }
            ;
            // Hotspot Enabled 下拉選項為 Disabled
            if ($scope.temporary.enabled == 0) {
                delete $scope.temporary.hotspot2;
                delete $scope.temporary.enabled;
                delete $scope.temporary.osen;
                delete $scope.temporary.accessCrossConnection;
                delete $scope.temporary.managep2p;
                delete $scope.temporary.dgaf;
                delete $scope.temporary.proxyAPR;
                delete $scope.temporary.l2TIF;
                delete $scope.temporary.interworking;
                delete $scope.temporary.accessNetworkType;
                delete $scope.temporary.internet;
                delete $scope.temporary.asra;
                delete $scope.temporary.esr;
                delete $scope.temporary.usea;
                delete $scope.temporary.venueGroup;
                delete $scope.temporary.venueType;
                delete $scope.temporary.venueName;
                delete $scope.temporary.venueNameText;
                delete $scope.temporary.hessid;
                delete $scope.temporary.wanLinkStatus;
                delete $scope.temporary.wanSymmetricLink;
                delete $scope.temporary.wanAtCapacity;
                delete $scope.temporary.wanMetricsDLSpeed;
                delete $scope.temporary.wanMetricsULSpeed;
                delete $scope.temporary.networkAuthType;
                delete $scope.temporary.networkAuthURL;
                delete $scope.temporary.ipAddressTypeAvailability;
                delete $scope.temporary.domainName;
                delete $scope.temporary.roamingConsortium;
                delete $scope.temporary.naiRealm;
                delete $scope.temporary.mcc;
                delete $scope.temporary.mnc;
                delete $scope.temporary.ipProtocol;
                delete $scope.temporary.portNumber;
                delete $scope.temporary.status;
                delete $scope.temporary.operatorFriendlyName;
                delete $scope.temporary.operatorFriendlyNameText;
                delete $scope.temporary.OSUSSID;
                delete $scope.temporary.OSUServerURI;
                delete $scope.temporary.languageCode;
                delete $scope.temporary.method;
                delete $scope.temporary.OSUConfig;
                delete $scope.temporary.OSULanguageCode;
                delete $scope.temporary.OSUFriendlyName;
                delete $scope.temporary.OSUFriendlyNameText;
                delete $scope.temporary.OSUNai;
                delete $scope.temporary.OSUNaiURL;
                delete $scope.temporary.OSUNaiString;
                delete $scope.temporary.OSUServiceDescription;
                delete $scope.temporary.OSUIconLanguageCode;
                delete $scope.temporary.OSUIconFilePath;
                delete $scope.temporary.OSUIconFileName;
                delete $scope.temporary.OSUIconWidth;
                delete $scope.temporary.OSUIconHeight;
                delete $scope.temporary.OSUIconType;
                // delete $scope.temporary.osuMethodName;
                delete $scope.temporary.wanMetrics;
                delete $scope.temporary.OSU;
                delete $scope.temporary.venueNameString;
                delete $scope.temporary.operatorFriendlyNameString;
                delete $scope.temporary.OSUFriendlyNameString;
                delete $scope.temporary.domainNameList;
                delete $scope.temporary.roamingConsortiumList;
                delete $scope.temporary.naiRealmList;
                delete $scope.temporary.eapMethod;
                delete $scope.temporary.authAndTypeList;
                delete $scope.temporary.rfc4282;

                delete $scope.temporary.gppCellularNetwork;
                delete $scope.temporary.methodList;
                delete $scope.temporary.methodListName;
                delete $scope.temporary.connectionCapability;
                delete $scope.temporary.connectionCapabilityName;

                // Hotspot Enabled 下拉選項為 Enabled
            } else {
                $scope.temporary.hotspot2 = {
                    "enabled": $scope.temporary.enabled,
                    "osen": $scope.temporary.osen,
                    "allowCrossConn": $scope.temporary.accessCrossConnection,
                    "manageP2P": $scope.temporary.managep2p,
                    "dgaf": $scope.temporary.dgaf,
                    "proxyArp": $scope.temporary.proxyAPR,
                    "l2tif": $scope.temporary.l2TIF,
                    "interworking": $scope.temporary.interworking,
                    "accessNetType": $scope.temporary.accessNetworkType,
                    "internet": $scope.temporary.internet,
                    "asra": $scope.temporary.asra,
                    "esr": $scope.temporary.esr,
                    "usea": $scope.temporary.usea,
                    "venueGroup": parseInt($scope.temporary.venueGroup),
                    "venueType": parseInt($scope.temporary.venueType),
                    "hessid": $scope.temporary.hessid,
                    "netAuthType": $scope.temporary.networkAuthType + $scope.temporary.networkAuthURL,
                    "ipAddrTypeAvail": $scope.temporary.ipAddressTypeAvailability,
                    "domainName": $scope.temporary.domainNameList,
                    "roamingConsortium": $scope.temporary.roamingConsortiumList,
                    "naiRealm": $scope.temporary.naiRealm,
                    "operFriendlyName": $scope.temporary.operatorFriendlyNameString,
                    "osuSSID": $scope.temporary.OSUSSID,
                    "osuServerUri": $scope.temporary.OSUServerURI,
                    // "osuMethodName": $scope.temporary.methodListName,
                    "osuMethod": $scope.temporary.methodList,
                    "osuConfig": $scope.temporary.OSUConfig,
                    "osuLangCode": $scope.temporary.OSULanguageCode,
                    "osuFriendlyName": $scope.temporary.OSUFriendlyNameString,
                    "osuNai": $scope.temporary.OSUNaiString,
                    "osuServiceDesc": $scope.temporary.OSUServiceDescription,
                    "wanData": $scope.temporary.wanMetrics,
                    "osuIcon": $scope.temporary.OSU,
                    "venueName": $scope.temporary.venueNameString,
                    "threeGppCellNet": $scope.temporary.gppCellularNetwork,
                    "connCapability": $scope.temporary.connectionCapability,
                    // "connCapabilityName": $scope.temporary.connectionCapabilityName
                }
                $scope.methodListNameStr = $scope.temporary.methodListName;
                $scope.connectionCapabilityNameStr = $scope.temporary.connectionCapabilityName;

                delete $scope.temporary.enabled;
                delete $scope.temporary.osen;
                delete $scope.temporary.accessCrossConnection;
                delete $scope.temporary.managep2p;
                delete $scope.temporary.dgaf;
                delete $scope.temporary.proxyAPR;
                delete $scope.temporary.l2TIF;
                delete $scope.temporary.interworking;
                delete $scope.temporary.accessNetworkType;
                delete $scope.temporary.internet;
                delete $scope.temporary.asra;
                delete $scope.temporary.esr;
                delete $scope.temporary.usea;
                delete $scope.temporary.venueGroup;
                delete $scope.temporary.venueType;
                delete $scope.temporary.venueName;
                delete $scope.temporary.venueNameText;
                delete $scope.temporary.hessid;
                delete $scope.temporary.wanLinkStatus;
                delete $scope.temporary.wanSymmetricLink;
                delete $scope.temporary.wanAtCapacity;
                delete $scope.temporary.wanMetricsDLSpeed;
                delete $scope.temporary.wanMetricsULSpeed;
                delete $scope.temporary.networkAuthType;
                delete $scope.temporary.networkAuthURL;
                delete $scope.temporary.ipAddressTypeAvailability;
                delete $scope.temporary.domainName;
                delete $scope.temporary.roamingConsortium;
                delete $scope.temporary.mcc;
                delete $scope.temporary.mnc;
                delete $scope.temporary.ipProtocol;
                delete $scope.temporary.portNumber;
                delete $scope.temporary.status;
                delete $scope.temporary.operatorFriendlyName;
                delete $scope.temporary.operatorFriendlyNameText;
                delete $scope.temporary.OSUSSID;
                delete $scope.temporary.OSUServerURI;
                delete $scope.temporary.languageCode;
                delete $scope.temporary.method;
                delete $scope.temporary.OSUConfig;
                delete $scope.temporary.OSULanguageCode;
                delete $scope.temporary.OSUFriendlyName;
                delete $scope.temporary.OSUFriendlyNameText;
                delete $scope.temporary.OSUNai;
                delete $scope.temporary.OSUNaiURL;
                delete $scope.temporary.OSUNaiString;
                delete $scope.temporary.OSUServiceDescription;
                delete $scope.temporary.OSUIconLanguageCode;
                delete $scope.temporary.OSUIconFilePath;
                delete $scope.temporary.OSUIconFileName;
                delete $scope.temporary.OSUIconWidth;
                delete $scope.temporary.OSUIconHeight;
                delete $scope.temporary.OSUIconType;
                // delete $scope.temporary.osuMethodName;
                delete $scope.temporary.wanMetrics;
                delete $scope.temporary.OSU;
                delete $scope.temporary.venueNameString;
                delete $scope.temporary.operatorFriendlyNameString;
                delete $scope.temporary.OSUFriendlyNameString;
                delete $scope.temporary.domainNameList;
                delete $scope.temporary.roamingConsortiumList;
                delete $scope.temporary.naiRealm;
                delete $scope.temporary.naiRealmList;
                delete $scope.temporary.eapMethod;
                delete $scope.temporary.authAndTypeList;
                delete $scope.temporary.rfc4282;
                delete $scope.temporary.gppCellularNetwork;
                delete $scope.temporary.methodList;
                delete $scope.temporary.methodListName;
                delete $scope.temporary.connectionCapability;
                delete $scope.temporary.connectionCapabilityName;
            }
            if ($scope.temporary.i80211kvr == 1) {
                switch ($scope.temporary.authentication) {
                    case 1:
                        $scope.temporary.authentication = 101;
                        delete $scope.temporary.i80211kvr;
                        break;
                    case 2:
                        $scope.temporary.authentication = 102;
                        delete $scope.temporary.i80211kvr;
                        break;
                    case 3:
                        $scope.temporary.authentication = 103;
                        delete $scope.temporary.i80211kvr;
                        break;
                    case 4:
                        $scope.temporary.authentication = 104;
                        delete $scope.temporary.i80211kvr;
                        break;
                    case 5:
                        $scope.temporary.authentication = 105;
                        delete $scope.temporary.i80211kvr;
                        break;
                    case 6:
                        $scope.temporary.authentication = 106;
                        delete $scope.temporary.i80211kvr;
                        break;
                    case 7:
                        $scope.temporary.authentication = 107;
                        delete $scope.temporary.i80211kvr;
                        break;
                    case 8:
                        $scope.temporary.authentication = 108;
                        delete $scope.temporary.i80211kvr;
                        break;
                    case 9:
                        $scope.temporary.authentication = 109;
                        delete $scope.temporary.i80211kvr;
                        break;
                    case 10:
                        $scope.temporary.authentication = 110;
                        delete $scope.temporary.i80211kvr;
                        break;
                }
            } else {
                delete $scope.temporary.i80211kvr;
            }
        };

        function cancleAlert() {
            $timeout(function () {
                initState();
            }, 10000);
        }

        function initState() {
            $scope.state.ssid.processing = false;
            $scope.state.ssid.isSuccess = false;
            $scope.state.ssid.isError = false;
            $scope.state.ssid.conflictError = false;
            $scope.state.ssid.osuMethodError = false;
            $scope.state.ssid.networkAuthTypeIsEmpty = false;
            $scope.state.ssid.osuNaiURLIsEmpty = false;
            $scope.state.ssid.roamingConsortiumError = false;
            $scope.state.ssid.domainNameError = false;
            $scope.state.template.isError = false;
        }

        function resetURL() {
            if ($scope.temporary.webRedirectUrl) {
                var arr = $scope.temporary.webRedirectUrl.split("//");
                $scope.websiteType.select = arr[0].length == 5 ? $scope.websites[0] : $scope.websites[1];
                $scope.temporary.webRedirectUrl = arr[1];
            }
            // externalCaptPort 字符串拆分
            if ($scope.temporary.externalCaptPort) {
                var arr = $scope.temporary.externalCaptPort.split("//");
                $scope.websiteType1.select = arr[0].length == 5 ? $scope.websites[0] : $scope.websites[1];
                $scope.temporary.externalCaptPort = arr[1];
            }
        }

        $scope.addSSID = function () {
            var ousIcon = $scope.temporary.OSUIconWidth + ':' + $scope.temporary.OSUIconHeight + ':' +
                $scope.temporary.OSUIconLanguageCode + ':' + $scope.temporary.OSUIconType + ':' + $scope.temporary.OSUIconFileName + ':' +
                $scope.temporary.OSUIconFilePath;

            if (ousIcon.length > 199) {
                $scope.state.ssid.isError = true;
                $scope.state.ssid.msgFalse = 'configuration.ssid.osuIconIsError';
                cancleAlert();
                return;
            } else {
                $scope.temporary.OSU = ousIcon;
            }


            // Venue Name
            if ($scope.temporary.venueNameText == '') {
                $scope.temporary.venueNameString = '';
            } else {
                var venueNameString = $scope.temporary.venueName + ':' + $scope.temporary.venueNameText;
                $scope.temporary.venueNameString = venueNameString;
            }

            // OSU Nai
            if ($scope.temporary.OSUNaiURL == '') {
                $scope.temporary.OSUNaiString = '';
            } else {
                var OSUNaiString = $scope.temporary.OSUNai + '@' + $scope.temporary.OSUNaiURL;
                if (OSUNaiString.length <= 199) {
                    $scope.temporary.OSUNaiString = OSUNaiString;
                } else {
                    $scope.state.ssid.isError = true;
                    $scope.state.ssid.msgFalse = 'configuration.ssid.osuNaiIsError';
                    cancleAlert();
                    return;
                }
            }

            if ($scope.state.ssid.processing) return;
            initState();
            if (!$scope.temporary.ssid || $scope.temporary.ssid == "") {
                $scope.state.ssid.processing = false;
                return;
            }
            var findindex = _.find($scope.ssidData.list, function (val) {
                return val.ssidIndex == $scope.temporary.ssidIndex;

            });
            //存在相同index的 SSID
            if (findindex) {
                var findindexband = _.find($scope.ssidData.list, function (val) {
                    return val.ssidIndex == $scope.temporary.ssidIndex && val.band == $scope.temporary.band;

                });
                if (findindexband) {
                    /* return alert('this SSID is already existed');*/
                    $scope.state.ssid.isError = true;
                    $scope.state.ssid.msgFalse = 'configuration.ssid.ssidExist';
                    cancleAlert();
                    return;
                } else {

                    var findname = _.find($scope.ssidData.list, function (val) {
                        return val.ssidIndex == $scope.temporary.ssidIndex && val.band != $scope.temporary.band && val.ssid == $scope.temporary.ssid;

                    });
                    //存在相同index 不同band 同名的SSID，需要提示是否覆盖已有配置
                    if (findname) {
                        $scope.confirmSSID($scope.temporary, $scope.wirelessData, 'reset');
                    } else {
                        //index不同，band相同
                        findname = _.find($scope.ssidData.list, function (val) {
                            return val.ssidIndex != $scope.temporary.ssidIndex && val.band == $scope.temporary.band && val.ssid == $scope.temporary.ssid;

                        });
                        if (findname) {
                            $scope.state.ssid.isError = true;
                            $scope.state.ssid.msgFalse = 'configuration.ssid.ssidNameExist';
                            cancleAlert();
                            return;
                        } else {
                            $scope.state.ssid.processing = true;
                            changeSSIDData();
                            BatchConfigService.addSSID($scope.profileId, $scope.agUuid, $scope.temporary, undefined, function (result) {
                                $scope.state.ssid.processing = false;
                                if (result.success) {
                                    for (var i = 0; i < $scope.SSIDOptions.data.length; i++) {
                                        if ($scope.SSIDOptions.data[i].band == $scope.temporary.band) {
                                            $scope.SSIDOptions.data[i].idleTimeout = $scope.temporary.idleTimeout;
                                            resetWEPValue($scope.SSIDOptions.data[i], $scope.temporary);
                                        }
                                    }
                                    $scope.SSIDOptions.data.push($scope.temporary);
                                    resetting();
                                    resetAuthType();
                                    $scope.$emit('refreshBCTree');
                                    $scope.$emit('refreshActiveProfile');
                                } else {
                                    resetURL();
                                }
                            });
                        }
                    }
                }
            } else {
                var findrename = _.find($scope.ssidData.list, function (val) {
                    return val.ssidIndex != $scope.temporary.ssidIndex && val.band == $scope.temporary.band && val.ssid == $scope.temporary.ssid;

                });
                if (findrename) {
                    $scope.state.ssid.isError = true;
                    $scope.state.ssid.msgFalse = 'configuration.ssid.ssidNameExist';
                    cancleAlert();
                    return;
                } else {
                    $scope.confirmSSID($scope.temporary, $scope.wirelessData, 'create');
                }

            }

        };

        function resetWEPValue(oldssid, newssid) {
            if ((newssid.authentication == 1 || newssid.authentication == 2) && newssid.encryption == 1)
                if (oldssid.keyIndex == newssid.keyIndex) {
                    oldssid.keySize = newssid.keySize;
                    oldssid.keyValue = newssid.keyValue;
                    oldssid.keyType = newssid.keyType;
                }
        }

        $scope.confirmSSID = function (item, wirelessData, flag) {

            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: 'confirmSSIDDialog.html',
                windowClass: 'modal-del',
                resolve: {
                    item: function () {
                        return item;
                    },
                    wirelessData: function () {
                        return wirelessData;
                    },
                    flag: function () {
                        return flag;
                    }
                },
                size: "w500",
                controller: function ($scope, $uibModalInstance, item, wirelessData, flag) {
                    $scope.ssidIndex = item.ssidIndex == 1 ? 'Primary' : ('SSID ' + (item.ssidIndex - 1));
                    $scope.con = {
                        content: ''
                    };

                    if (flag == 'reset' || flag == 'resave') {
                        $scope.con.content = "configuration.ssid.noticeMsg";

                    } else {
                        $scope.con.hint = "configuration.ssid.sameTip";
                        $scope.con.content = "configuration.ssid.noticeMsg1";

                    }
                    if (item.band == 1) {

                        $scope.con.contentvals = {
                            band: TS.ts('configuration.band2'),
                            band1: TS.ts('configuration.band3')
                        };
                    }
                    if (item.band == 2) {
                        $scope.con.contentvals = {
                            band: TS.ts('configuration.band1'),
                            band1: TS.ts('configuration.band3')
                        };
                    }
                    if (item.band == 3) {
                        $scope.con.contentvals = {
                            band: TS.ts('configuration.band1'),
                            band1: TS.ts('configuration.band2')
                        };
                    }
                    $scope.con.contentvals.ssidIndex = $scope.ssidIndex;
                    $scope.ok = function () {
                        $uibModalInstance.close('yes');
                    };
                    $scope.no = function () {
                        if (wirelessData && wirelessData.bandSteer.status == 1) {
                            $scope.con.hint1 = "configuration.ssid.bandErrorTip2";
                            return;
                        }
                        if (flag == 'create') {
                            $uibModalInstance.close('no');
                        } else if (flag == 'resave') {
                            $uibModalInstance.close('no');
                        } else {
                            $uibModalInstance.dismiss('cancel');
                            setMACListLen();
                        }
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                        setMACListLen();

                    };
                }
            });
            modalInstance.result.then(function (result) {
                if (flag == 'create') {
                    if (result == 'yes') {
                        flag = 'createAll';
                    } else {
                        flag = 'createOne';
                    }
                }
                $scope.conflict = {
                    content: 'configuration.ssid.bandErrorTip'
                }
                if (flag == 'createAll' || flag == 'createOne' || flag == 'reset') {
                    changeSSIDData();
                    BatchConfigService.addSSID($scope.profileId, $scope.agUuid, $scope.temporary, flag, function (result) {
                        if (result.success) {
                            var bandtags = result.bandtags;
                            if (flag == 'createAll') {
                                var newitem = angular.copy(item);
                                var newitem1 = angular.copy(item);
                                if (newitem.band == 1) {
                                    newitem.band = 2;
                                    newitem1.band = 3;
                                    if (bandtags[1]) newitem = null;
                                    if (bandtags[2]) newitem1 = null;
                                } else if (newitem.band == 2) {
                                    newitem.band = 1;
                                    newitem1.band = 3;
                                    if (bandtags[0]) newitem = null;
                                    if (bandtags[2]) newitem1 = null;
                                } else {
                                    newitem.band = 1;
                                    newitem1.band = 2;
                                    if (bandtags[0]) newitem = null;
                                    if (bandtags[1]) newitem1 = null;
                                }
                                if (newitem) {
                                    $scope.SSIDOptions.data.push(newitem);
                                }
                                if (newitem1) {
                                    $scope.SSIDOptions.data.push(newitem1);
                                }

                                for (var i = 0; i < $scope.SSIDOptions.data.length; i++) {
                                    if ($scope.SSIDOptions.data[i].band == item.band || (newitem && $scope.SSIDOptions.data[i].band == newitem.band) || (newitem1 && $scope.SSIDOptions.data[i].band == newitem1.band)) {
                                        $scope.SSIDOptions.data[i].idleTimeout = item.idleTimeout;
                                        resetWEPValue($scope.SSIDOptions.data[i], item);

                                    }
                                }
                            }
                            if (flag == 'reset') {
                                var newitem = angular.copy(item);
                                var newitem1 = angular.copy(item);
                                if (newitem.band == 1) {
                                    newitem.band = 2;
                                    newitem1.band = 3;
                                    if (bandtags[1]) newitem = null;
                                    if (bandtags[2]) newitem1 = null;
                                } else if (newitem.band == 2) {
                                    newitem.band = 1;
                                    newitem1.band = 3;
                                    if (bandtags[0]) newitem = null;
                                    if (bandtags[2]) newitem1 = null;
                                } else {
                                    newitem.band = 1;
                                    newitem1.band = 2;
                                    if (bandtags[0]) newitem = null;
                                    if (bandtags[1]) newitem1 = null;
                                }
                                var newitemfind = false, newitemfind1 = false;
                                for (var i = 0; i < $scope.SSIDOptions.data.length; i++) {
                                    if (newitem) {
                                        if ($scope.SSIDOptions.data[i].ssidIndex == newitem.ssidIndex && $scope.SSIDOptions.data[i].band == newitem.band) {
                                            $scope.SSIDOptions.data[i] = newitem;
                                            newitemfind = true;
                                        }
                                    }
                                    if (newitem1) {
                                        if ($scope.SSIDOptions.data[i].ssidIndex == newitem1.ssidIndex && $scope.SSIDOptions.data[i].band == newitem1.band) {
                                            $scope.SSIDOptions.data[i] = newitem1;
                                            newitemfind1 = true;
                                        }
                                    }

                                    if ($scope.SSIDOptions.data[i].band == item.band || (newitem && $scope.SSIDOptions.data[i].band == newitem.band) || (newitem1 && $scope.SSIDOptions.data[i].band == newitem1.band)) {
                                        $scope.SSIDOptions.data[i].idleTimeout = item.idleTimeout;
                                        resetWEPValue($scope.SSIDOptions.data[i], item);
                                    }
                                }
                            }
                            if (newitemfind && newitem) {
                                $scope.SSIDOptions.data.push(newitem);
                            }
                            if (newitemfind1 && newitem1) {
                                $scope.SSIDOptions.data.push(newitem1);
                            }
                            $scope.SSIDOptions.data.push(item);
                            setMACListLen();
                            resetting();
                            resetAuthType();
                            $scope.$emit('refreshBCTree');
                            $scope.$emit('refreshActiveProfile');
                            if (bandtags && (bandtags[0] || bandtags[1] || bandtags[2])) {
                                $scope.state.ssid.conflictError = true;
                                $scope.conflict.contentvals = {
                                    band: "",
                                };
                                var bandStr = "";
                                if (bandtags[0]) bandStr += TS.ts('configuration.band1') + " ";
                                if (bandtags[1]) bandStr += TS.ts('configuration.band2') + " ";
                                if (bandtags[2]) bandStr += TS.ts('configuration.band3') + " ";
                                $scope.conflict.contentvals.band = bandStr;
                                cancleAlert();
                            }
                        } else {
                            resetURL();
                            if (result.error == -3) {
                                $scope.state.ssid.isError = true;
                                $scope.state.ssid.msgFalse = 'configuration.ssid.passcodeSSIDMore';
                                cancleAlert();
                            }
                            if (result.error == -2) {
                                $scope.state.ssid.isError = true;
                                $scope.state.ssid.msgFalse = 'configuration.ssid.aclMore';
                                cancleAlert();
                            }
                            //band steering error
                            if (result.error == -5) {
                                $scope.state.ssid.isError = true;
                                $scope.state.ssid.msgFalse = 'configuration.ssid.bandErrorTip2';
                                cancleAlert();
                            }
                        }
                    });
                } else {
                    if (result == 'no' && flag == 'resave') {
                        flag = 'resaveone';
                    }
                    changeSSIDData();
                    $scope.conflict = {
                        content: 'configuration.ssid.bandErrorTip1'
                    }
                    BatchConfigService.updateSSID($scope.profileId, $scope.agUuid, $scope.temporary, flag, function (result) {
                        if (result.success) {
                            if (flag == 'resave' || flag == 'resavesame' || flag == 'resavetosame') {
                                var newitem = angular.copy($scope.temporary);
                                var newitem1 = angular.copy($scope.temporary);
                                if (newitem.band == 1) {
                                    newitem.band = 2;
                                    newitem1.band = 3;
                                } else if (newitem.band == 2) {
                                    newitem.band = 1;
                                    newitem1.band = 3;
                                } else {
                                    newitem.band = 1;
                                    newitem1.band = 2;
                                }
                                var find11 = _.find($scope.SSIDOptions.data, function (val) {
                                    return val.ssidIndex == newitem.ssidIndex && val.band == newitem.band;

                                });

                                var find22 = _.find($scope.SSIDOptions.data, function (val) {
                                    return val.ssidIndex == newitem1.ssidIndex && val.band == newitem1.band;

                                });
                                if (!find11 && newitem) {
                                    $scope.SSIDOptions.data.push(newitem);
                                }
                                if (!find22 && newitem1) {
                                    $scope.SSIDOptions.data.push(newitem1);
                                }
                                for (var i = 0; i < $scope.SSIDOptions.data.length; i++) {
                                    if (newitem) {
                                        if ($scope.SSIDOptions.data[i].ssidIndex == newitem.ssidIndex && $scope.SSIDOptions.data[i].band == newitem.band) {
                                            $scope.SSIDOptions.data[i] = newitem;
                                        }
                                    }
                                    if (newitem1) {
                                        if ($scope.SSIDOptions.data[i].ssidIndex == newitem1.ssidIndex && $scope.SSIDOptions.data[i].band == newitem1.band) {
                                            $scope.SSIDOptions.data[i] = newitem1;
                                        }
                                    }
                                    if ($scope.SSIDOptions.data[i].ssidIndex == item.ssidIndex && $scope.SSIDOptions.data[i].band == item.band) {
                                        $scope.SSIDOptions.data[i] = item;
                                    }
                                    if (newitem) {
                                        if ($scope.SSIDOptions.data[i].band == newitem.band) {
                                            $scope.SSIDOptions.data[i].idleTimeout = newitem.idleTimeout;
                                            resetWEPValue($scope.SSIDOptions.data[i], newitem);
                                        }
                                    }
                                    if (newitem1) {
                                        if ($scope.SSIDOptions.data[i].band == newitem1.band) {
                                            $scope.SSIDOptions.data[i].idleTimeout = newitem1.idleTimeout;
                                            resetWEPValue($scope.SSIDOptions.data[i], newitem1);
                                        }
                                    }
                                    if ($scope.SSIDOptions.data[i].band == item.band) {
                                        $scope.SSIDOptions.data[i].idleTimeout = item.idleTimeout;
                                        resetWEPValue($scope.SSIDOptions.data[i], item);
                                    }
                                }
                            } else if (flag == 'resaveone') {
                                for (var i = 0; i < $scope.SSIDOptions.data.length; i++) {
                                    if ($scope.SSIDOptions.data[i].ssidIndex == item.ssidIndex && $scope.SSIDOptions.data[i].band == item.band) {
                                        $scope.SSIDOptions.data[i] = item;
                                    }
                                    if ($scope.SSIDOptions.data[i].band == item.band) {
                                        $scope.SSIDOptions.data[i].idleTimeout = item.idleTimeout;
                                        resetWEPValue($scope.SSIDOptions.data[i], item);
                                    }
                                }
                            }
                            setMACListLen();
                            resetting();
                            resetAuthType();
                            $scope.$emit('refreshBCTree');
                            $scope.$emit('refreshActiveProfile');

                        } else {
                            resetURL();
                            if (result.error == -3) {
                                $scope.state.ssid.isError = true;
                                $scope.state.ssid.msgFalse = 'configuration.ssid.passcodeSSIDMore';
                                cancleAlert();
                            }
                            if (result.error == -2) {
                                $scope.state.ssid.isError = true;
                                $scope.state.ssid.msgFalse = 'configuration.ssid.aclMore';
                                cancleAlert();
                            }
                            if (result.error == -4) {
                                var bandtags = result.bandtags;
                                $scope.state.ssid.conflictError = true;
                                $scope.conflict = {
                                    content: 'configuration.ssid.bandErrorTip1'
                                }
                                $scope.conflict.contentvals = {
                                    band: "",
                                };
                                var bandStr = "";
                                if (bandtags[0]) bandStr += TS.ts('configuration.band1') + " ";
                                if (bandtags[1]) bandStr += TS.ts('configuration.band2') + " ";
                                if (bandtags[2]) bandStr += TS.ts('configuration.band3') + " ";
                                $scope.conflict.contentvals.band = bandStr;
                                cancleAlert();
                            }
                            //band steering error
                            if (result.error == -5) {
                                $scope.state.ssid.isError = true;
                                $scope.state.ssid.msgFalse = 'configuration.ssid.bandErrorTip2';
                                cancleAlert();
                            }
                        }
                    });
                }

            }, function () {

            });
        };
        $scope.saveSSID = function () {
            var ousIcon = $scope.temporary.OSUIconWidth + ':' + $scope.temporary.OSUIconHeight + ':' +
                $scope.temporary.OSUIconLanguageCode + ':' + $scope.temporary.OSUIconType + ':' + $scope.temporary.OSUIconFileName + ':' +
                $scope.temporary.OSUIconFilePath;

            if (ousIcon.length > 199) {
                $scope.state.ssid.isError = true;
                $scope.state.ssid.msgFalse = 'configuration.ssid.osuIconIsError';
                cancleAlert();
                return;
            } else {
                $scope.temporary.OSU = ousIcon;
            }

            // OSU Nai
            if ($scope.temporary.OSUNaiURL == '') {
                $scope.temporary.OSUNaiString = '';
            } else {
                var OSUNaiString = $scope.temporary.OSUNai + '@' + $scope.temporary.OSUNaiURL;
                if (OSUNaiString.length <= 199) {
                    $scope.temporary.OSUNaiString = OSUNaiString;
                } else {
                    $scope.state.ssid.isError = true;
                    $scope.state.ssid.msgFalse = 'configuration.ssid.osuNaiIsError';
                    cancleAlert();
                    return;
                }
            }

            initState();
            var saveIndex = $scope.editSSIDStatus;
            var findname1 = _.find($scope.ssidData.list, function (val) {
                return val.ssidIndex != $scope.temporary.ssidIndex && val.ssid == $scope.temporary.ssid;

            });
            if (findname1) {
                $scope.state.ssid.isError = true;
                $scope.state.ssid.msgFalse = 'configuration.ssid.ssidNameExist';
                cancleAlert();
                return;
            }
            var findname = _.find($scope.ssidData.list, function (val) {
                return val.ssidIndex == $scope.temporary.ssidIndex && val.band != $scope.temporary.band;

            });
            var findname2 = _.find($scope.ssidData.list, function (val) {
                return val.ssidIndex == $scope.temporary.ssidIndex && val.band == $scope.temporary.band;

            });
            //未改名字，原来名字一样，现在还一样
            if (findname && findname2 && (findname.ssid == findname2.ssid && findname2.ssid == $scope.temporary.ssid)) {
                $scope.confirmSSID($scope.temporary, $scope.wirelessData, 'resavesame');
            }
            //改名字了,名字由相同改为不同了
            else if (findname && findname2 && (findname.ssid == findname2.ssid && findname2.ssid != $scope.temporary.ssid)) {
                $scope.confirmSSID($scope.temporary, $scope.wirelessData, 'resave');
            }
            //改名字了，名字由不同改为相同
            else if (findname && findname2 && (findname.ssid != findname2.ssid && findname.ssid == $scope.temporary.ssid)) {
                $scope.confirmSSID($scope.temporary, $scope.wirelessData, 'resavetosame');
            } else {

                changeSSIDData();
                // 调用接口保存ssid
                BatchConfigService.updateSSID($scope.profileId, $scope.agUuid, $scope.temporary, undefined, function (result) {
                    if (result.success) {
                        for (var i = 0; i < $scope.SSIDOptions.data.length; i++) {
                            if ($scope.SSIDOptions.data[i].$$hashKey == saveIndex) {
                                $scope.SSIDOptions.data[i] = $scope.temporary;
                            }
                            if ($scope.SSIDOptions.data[i].band == $scope.temporary.band) {
                                $scope.SSIDOptions.data[i].idleTimeout = $scope.temporary.idleTimeout;
                                resetWEPValue($scope.SSIDOptions.data[i], $scope.temporary);
                            }
                        }
                        setMACListLen();
                        resetting();
                        resetAuthType();
                        $scope.$emit('refreshBCTree');
                        $scope.$emit('refreshActiveProfile');
                    } else {
                        resetURL();
                        if (result.error == -3) {
                            $scope.state.ssid.isError = true;
                            $scope.state.ssid.msgFalse = 'configuration.ssid.passcodeSSIDMore';
                            cancleAlert();
                        }
                        if (result.error == -2) {
                            $scope.state.ssid.isError = true;
                            $scope.state.ssid.msgFalse = 'configuration.ssid.aclMore';
                            cancleAlert();
                        }
                        //band steering error
                        if (result.error == -5) {
                            $scope.state.ssid.isError = true;
                            $scope.state.ssid.msgFalse = 'configuration.ssid.bandErrorTip2';
                            cancleAlert();
                        }
                    }
                })
            }
        };
        $scope.resetSSID = function () {
            if ($scope.copyDateForReset) $scope.editSSID($scope.copyDateForReset);
            setMACListLen();
        };
        $scope.clearSSID = function () {
            resetting();
        };
        $scope.mac = {};
        // access control
        $scope.macAdded = false;
        $scope.addMacAddress = function (fileList) {
            // TODO:
            // $scope.macAddressTemporary.mac 转化大写
            var macAdd = fileList || angular.uppercase($scope.macAddressTemporary.mac);
            for (var i = 0; i < $scope.addressOptions.data.length; i++) {
                if ($scope.addressOptions.data[i].macAddr == macAdd) {
                    if (!fileList) $scope.macAdded = true;
                    return;
                }
            }
            ;
            $scope.addressOptions.data.push({macAddr: macAdd});
            if ($scope.temporary.band == 1) {
                $scope.maclistLen24 += 1;
            } else if ($scope.temporary.band == 2) {
                $scope.maclistLen5 += 1;
            } else {
                $scope.maclistLen52 += 1;
            }
            $scope.macAddressTemporary.mac = '';
        };
        $scope.returnNoOfRow = function (r) {
            var index = r.$$hashKey;
            for (var i = 0; i < $scope.addressOptions.data.length; i++) {
                if ($scope.addressOptions.data[i].$$hashKey == index) {
                    return i + 1;
                }
            }
            ;
        };
        $scope.macAddressChange = function () {
            $scope.mac.invalid = false;
            $scope.macAdded = false;

        };
        $scope.delMacAddress = function (r) {
            var delIndex = r.$$hashKey;
            for (var i = 0; i < $scope.addressOptions.data.length; i++) {
                if ($scope.addressOptions.data[i].$$hashKey == delIndex) {
                    $scope.addressOptions.data.splice(i, 1);
                    if ($scope.temporary.band == 1) {
                        $scope.maclistLen24 -= 1;
                    } else if ($scope.temporary.band == 2) {
                        $scope.maclistLen5 -= 1;
                    } else {
                        $scope.maclistLen52 -= 1;
                    }
                    return;
                }
            }
            ;
        };
        $scope.acl = {error: false, maxSize: false, fileError: false};
        $scope.uploadMacAddress = function () {
            $scope.acl.error = false;
            $scope.acl.fileError = false;
            $scope.acl.maxSize = false;
            if (!$scope.macAddressTemporary.file) return;
            if ($scope.macAddressTemporary.file.size > 102400) {
                $scope.acl.maxSize = true;
                $timeout(function () {
                    $scope.acl.maxSize = false;
                }, 10000);
                return;
            }
            var params = {
                url: base_url + '/batchConfig/uploadMacList',
                data: {}
            };
            params.data.file = $scope.macAddressTemporary.file;
            Upload.upload(params).then(function (result) {
                ajaxService.updateToken(result.headers);
                if (result.data.success) {
                    var uploadList = result.data.data;
                    if ($scope.temporary.band == 1) {
                        if (($scope.maclistLen24 + uploadList.length - $scope.addressOptions.data.length) <= 512) {
                            $scope.maclistLen24 += (-$scope.addressOptions.data.length);
                            $scope.addressOptions.data = [];
                            for (var i = 0; i < uploadList.length; i++) {
                                var re = /[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}:[A-Fa-f0-9]{2}/;
                                //var re = /((([a-f0-9]{2}:){5})|(([a-f0-9]{2}-){5}))[a-f0-9]{2}/gi;
                                if (re.test(uploadList[i])) {
                                    if (uploadList[i].length == 17) {
                                        $scope.addMacAddress(uploadList[i]);
                                    }
                                }
                            }
                        } else {
                            $scope.acl.error = true;
                            $timeout(function () {
                                $scope.acl.error = false;
                            }, 10000);
                        }
                    } else if ($scope.temporary.band == 2) {
                        if (($scope.maclistLen5 + uploadList.length - $scope.addressOptions.data.length) <= 512) {
                            $scope.maclistLen5 += (-$scope.addressOptions.data.length);
                            $scope.addressOptions.data = [];
                            for (var i = 0; i < uploadList.length; i++) {
                                $scope.addMacAddress(uploadList[i]);
                            }
                        } else {
                            $scope.acl.error = true;
                            $timeout(function () {
                                $scope.acl.error = false;
                            }, 10000);
                        }
                    } else {
                        if (($scope.maclistLen52 + uploadList.length - $scope.addressOptions.data.length) <= 512) {
                            $scope.maclistLen52 += (-$scope.addressOptions.data.length);
                            $scope.addressOptions.data = [];
                            for (var i = 0; i < uploadList.length; i++) {
                                $scope.addMacAddress(uploadList[i]);
                            }
                        } else {
                            $scope.acl.error = true;
                            $timeout(function () {
                                $scope.acl.error = false;
                            }, 10000);
                        }
                    }
                } else {
                    //文件错误
                    $scope.acl.fileError = true;
                    $timeout(function () {
                        $scope.acl.fileError = false;
                    }, 10000);
                }

                // 覆盖则先清空列表

                $scope.macAddressTemporary.file = null;
            }, function () {

            }, function () {
            });
        };
        $scope.downloadMacAddress = function () {
            // $scope.addressOptions.data
            var arrData = [];
            $scope.addressOptions.data.forEach(function (r) {
                arrData.push(r.macAddr);
            })
            BatchConfigService.downloadMacAddress(arrData, function (result) {
                var fileName = 'macAddr.txt';
                var blob = new Blob([result], {type: "application/octet-stream"});
                if ('msSaveOrOpenBlob' in navigator) {

                    // Microsoft Edge and Microsoft Internet Explorer 10-11
                    window.navigator.msSaveOrOpenBlob(blob, fileName);
                } else {
                    var a = document.getElementById("exportCSVlink");
                    a.download = fileName;
                    a.href = URL.createObjectURL(blob);
                    a.click();
                }
            }, function () {
            });
        };
        // ip filter
        $scope.IPFilterAdded = false;
        $scope.addIpFilter = function () {
            for (var i = 0; i < $scope.ipFilterOptions.data.length; i++) {
                var temp = $scope.ipFilterOptions.data[i];
                if (temp.ipAddress == $scope.ipFilterTemporary.ipAddress && temp.subMask == $scope.ipFilterTemporary.subMask) {
                    $scope.IPFilterAdded = true;
                    return;
                }
            }
            $scope.ipFilterOptions.data.push($scope.ipFilterTemporary);
            $scope.ipFilterTemporary = {
                ipAddress: '',
                subMask: ''
            };
        };
        $scope.IPFilterChange = function () {
            $scope.IPFilterAdded = false;
        };
        $scope.delIpFilter = function (r) {
            var delIndex = r.$$hashKey;
            for (var i = 0; i < $scope.ipFilterOptions.data.length; i++) {
                if ($scope.ipFilterOptions.data[i].$$hashKey == delIndex) {
                    $scope.ipFilterOptions.data.splice(i, 1);
                }
            }
        };
        $scope.delGardenIP = function (r) {
            var delIndex = r.$$hashKey;
            for (var i = 0; i < $scope.gardenOptions.data.length; i++) {
                if ($scope.gardenOptions.data[i].$$hashKey == delIndex) {
                    $scope.gardenOptions.data.splice(i, 1);
                }
            }
        }
        $scope.addGardenIP = function () {
            var ipAdd = $scope.gardenTemporary.ip;
            for (var i = 0; i < $scope.gardenOptions.data.length; i++) {
                if ($scope.gardenOptions.data[i].ip == ipAdd) {
                    $scope.gardenAdded = true;
                    $timeout(function () {
                        $scope.gardenAdded = false;
                    }, 5000);
                    return;
                }
            }
            $scope.gardenOptions.data.push($scope.gardenTemporary);
            $scope.gardenTemporary = {
                ip: ''
            }
        }
        // user pass
        $scope.editUserPassStatus = null;
        $scope.addUser = function () {
            var userAdd = $scope.userPassTemporary.username;
            for (var i = 0; i < $scope.userPassOptions.data.length; i++) {
                if ($scope.userPassOptions.data[i].username == userAdd) {
                    $scope.userAdded = true;
                    $timeout(function () {
                        $scope.userAdded = false;
                    }, 5000);
                    return;
                }
            }
            ;
            $scope.userPassOptions.data.push($scope.userPassTemporary);
            $scope.userPassTemporary = {
                username: '',
                password: ''
            };
        };
        $scope.delUser = function (r) {
            var delIndex = r.$$hashKey;
            for (var i = 0; i < $scope.userPassOptions.data.length; i++) {
                if ($scope.userPassOptions.data[i].$$hashKey == delIndex) {
                    var temp = $scope.userPassOptions.data[i];
                    if ($scope.editUserPassStatus) {
                        $scope.clearUser();
                    }
                    $scope.userPassOptions.data.splice(i, 1);
                }
            }
            ;
        };
        $scope.editUser = function (r) {
            $scope.editUserPassStatus = r.$$hashKey;
            $scope.userPassTemporary = angular.copy(r);
        };
        $scope.saveUser = function () {
            var saveIndex = $scope.editUserPassStatus;
            for (var i = 0; i < $scope.userPassOptions.data.length; i++) {
                if ($scope.userPassOptions.data[i].$$hashKey == saveIndex) {
                    $scope.userPassOptions.data[i] = $scope.userPassTemporary;
                    $scope.clearUser();
                    break;
                }
            }
            ;
        };
        $scope.clearUser = function () {
            $scope.userPassTemporary = {
                username: '',
                password: ''
            };
            $scope.editUserPassStatus = null;
        };
        // mac by pass
        $scope.whiteAdded = false;
        $scope.addMacByPass = function (fileList) {
            var macAdd = fileList || angular.uppercase($scope.macByPass.mac);
            for (var i = 0; i < $scope.whiteListOptions.data.length; i++) {
                if ($scope.whiteListOptions.data[i].mac == macAdd) {
                    if (!fileList) $scope.whiteAdded = true;
                    return;
                }
            }
            ;
            $scope.whiteListOptions.data.push({mac: macAdd});
            $scope.macByPass.mac = '';
        };
        $scope.returnNoOfWhite = function (r) {
            var index = r.$$hashKey;
            for (var i = 0; i < $scope.whiteListOptions.data.length; i++) {
                if ($scope.whiteListOptions.data[i].$$hashKey == index) {
                    return i + 1;
                }
            }
            ;
        };
        $scope.returnNoOfGarden = function (r) {
            var index = r.$$hashKey;
            for (var i = 0; i < $scope.gardenOptions.data.length; i++) {
                if ($scope.gardenOptions.data[i].$$hashKey == index) {
                    return i + 1;
                }
            }
            ;
        }
        $scope.macByPassChange = function () {
            $scope.whiteAdded = false;
        };
        $scope.delMacByPass = function (r) {
            var delIndex = r.$$hashKey;
            for (var i = 0; i < $scope.whiteListOptions.data.length; i++) {
                if ($scope.whiteListOptions.data[i].$$hashKey == delIndex) {
                    $scope.whiteListOptions.data.splice(i, 1);
                }
            }
            ;
        };
        $scope.whitelist = {error: false, fileError: false};
        $scope.uploadMacByPassFile = function () {
            $scope.whitelist = {error: false, fileError: false};
            if (!$scope.macByPassTemporary.file) return;
            var params = {
                url: base_url + '/batchConfig/upLoadWhiteList',
                data: {}
            };
            params.data.file = $scope.macByPassTemporary.file;
            Upload.upload(params).then(function (result) {
                ajaxService.updateToken(result.headers);
                if (result.data.success) {
                    var uploadList = result.data.data;
                    if (uploadList.length > 64) {
                        $scope.whitelist.error = true;
                        $timeout(function () {
                            $scope.whitelist.error = false;
                        }, 10000);

                    } else {
                        // 覆盖则先清空列表
                        $scope.whiteListOptions.data = [];
                        for (var i = 0; i < uploadList.length; i++) {
                            $scope.addMacByPass(uploadList[i]);
                        }
                    }

                } else {
                    //文件错误
                    $scope.whitelist.fileError = true;
                    $timeout(function () {
                        $scope.whitelist.fileError = false;
                    }, 10000);
                }
                $scope.macByPassTemporary.file = null;

            }, function () {
            }, function () {
            });
        };
        $scope.downloadMacByPass = function () {
            // $scope.whiteListOptions.data
            var arrData = [];
            $scope.whiteListOptions.data.forEach(function (r) {
                arrData.push(r.mac);
            })
            BatchConfigService.downloadMacByPass(arrData, function (result) {
                var fileName = 'macByPass.txt';
                var blob = new Blob([result], {type: "application/octet-stream"});
                if ('msSaveOrOpenBlob' in navigator) {
                    // Microsoft Edge and Microsoft Internet Explorer 10-11
                    window.navigator.msSaveOrOpenBlob(blob, fileName);
                } else {
                    var a = document.getElementById("exportCSVlink");
                    a.download = fileName;
                    a.href = URL.createObjectURL(blob);
                    a.click();
                }
            }, function () {
            });
        };

        // login view template
        $scope.viewTemplate = function () {
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: 'viewLoginFile.html',
                // windowClass: '',
                size: 'w900',
                resolve: {
                    temp: function () {
                        return $scope.loginTemplate.select;
                    },
                    authType: function () {
                        return $scope.temporary.authType;
                    }
                },
                controller: function ($scope, $uibModalInstance, temp, authType) {
                    $scope.title = temp.name;
                    var path = temp.filePath;
                    path = path.substr(1);
                    if (authType == 11) {
                        var type = 'sla';
                    } else {
                        var type = authType == 7 ? 'cwm' : 1; //authType:7 passcode
                    }
                    var param = "?type=" + type + "&dis=1";
                    $scope.src = path + param;
                    console.log($scope.src);
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function (data) {

            }, function () {

            });
        };
        $scope.openUpload = function () {
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: 'uploadLoginFile.html',
                // windowClass: '',
                size: 'w600',
                resolve: {
                    loginTemplates: function () {
                        return $scope.loginTemplates
                    },
                    profileId: function () {
                        return $scope.profileId;
                    }
                },
                controller: function ($scope, $uibModalInstance, Upload, loginTemplates, profileId) {
                    $scope.loginFile = {processing: false};
                    $scope.nameRepeat = {isError: false};
                    $scope.suffixOk = true;
                    $scope.tarOk = true;
                    $scope.verifyFile = function (file) {
                        if (file[0] && file[0].size <= 1024 * 1024 * 2) {
                            var upFileName = file[0].name;
                            var index1 = upFileName.lastIndexOf(".");
                            var index2 = upFileName.length;
                            var suffix = upFileName.substring(index1 + 1, index2);
                            $scope.suffixOk = (suffix == 'tar');
                            $scope.tarOk = true;
                        }
                    }
                    $scope.fileNameFilter = function (ssidName) {
                        $scope.loginFile.name = (ssidName || "").replace(/[.,;:?\[\]<>/\*{}^\|()@#$+=%!\s"'~&\\`~！￥…*（）—｛｝：“”《》？、。，；‘’【】、=·]/g, "");
                        $scope.loginFile.name = (ssidName || "").replace(/[\u4E00-\u9FA5]/g, "");//core在取压缩包的时候压缩中文字符取不到，所以要限制中文字符
                    }
                    $scope.ok = function () {
                        $scope.fileNameFilter($scope.loginFile.name);
                        // 页面验证重命名
                        $scope.nameRepeat = {isError: false};
                        for (var i = 0; i < loginTemplates.length; i++) {
                            if (loginTemplates[i].name == $scope.loginFile.name) {
                                $scope.nameRepeat.isError = true;
                                return;
                            }
                        }
                        $scope.loginFile.processing = true;
                        // 上传
                        var params = {
                            url: base_url + '/batchConfig/uploadLoginFile',
                            data: {}
                        };
                        params.data.name = $scope.loginFile.name;
                        params.data.profileId = profileId;
                        params.data.file = $scope.loginFile.file;
                        Upload.upload(params).then(function (result) {
                            ajaxService.updateToken(result.headers);
                            $scope.loginFile.processing = false;
                            if (result.data.success) {
                                $uibModalInstance.close();
                                getLoginTemplateList();
                            } else {
                                if (result.data.error == -1) {
                                    // 上传失败
                                    $scope.nameRepeat.isError = true;
                                }
                                if (result.data.error == -2) {
                                    // 文件不能正常解压
                                    $scope.tarOk = false;
                                }
                            }
                        }, function () {
                        }, function () {
                        });
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function () {

            }, function () {
            });
        };
        $scope.delTemplate = function () {
            $scope.state.template.isError = false;
            if ($scope.loginTemplate.select.isDefault) {
                $scope.state.template.isError = true;
                $scope.state.template.msgFalse = "configuration.ssid.templateIsDefault";
                return;
            }
            BatchConfigService.deleteLoginTemplate({
                profileId: $scope.profileId,
                LoginFile: $scope.loginTemplate.select
            }, function (result) {
                if (result.success) {
                    getLoginTemplateList();
                } else {
                    $scope.state.template.isError = true;
                    $scope.state.template.msgFalse = "configuration.ssid.templateIsUsed";
                    cancleAlert();
                }
            }, function () {
            })
        };
        $scope.downloadTemplate = function () {
            BatchConfigService.downloadLoginTemplate($scope.loginTemplate.select, function (result) {
                var fileName = $scope.loginTemplate.select.name + '.tar';
                var blob = new Blob([result], {type: "application/octet-stream"});
                if ('msSaveOrOpenBlob' in navigator) {
                    // Microsoft Edge and Microsoft Internet Explorer 10-11
                    window.navigator.msSaveOrOpenBlob(blob, fileName);
                } else {
                    var a = document.getElementById("exportCSVlink");
                    a.download = fileName;
                    a.href = URL.createObjectURL(blob);
                    a.click();
                }
            }, function () {
            });
        };

        $scope.authTypeChange = function (item, model) {
            if (item == 1) {
                $scope.temporary.webRedirectState = true;
            }
        };

        function trimStr(str) {
            // 用正则表达式将前后空格
            // 用空字符串替代。
            if (str) {
                return str.replace(/(^\s*)|(\s*$)/g, "");
            } else {
                return "";
            }

        }

        $scope.checkSSIDName = function () {
            $scope.temporary.ssid = trimStr($scope.temporary.ssid);
        };
        $scope.error = {};
        // special 
        $scope.serverRe = /^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;
        $scope.gateway = /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9]{1,2})(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9]{1,2})){3}$/;
        //  $scope.domainRe=/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/
        //  $scope.domainRe = /[\w\-]+(\.[\w\-]+)+([\w\-\.@?^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?$/;
        $scope.domainRe = /^(?!https?:\/\/)+([\w\-\.@?^=%&:;\/~\+#]*[\w\-\@?^=%&\/~\+#])?$/;
        $scope.domainHttpRe = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
        $scope.domainListRe = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
        $scope.portRe = /^([1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]|[1-9]\d{3}|[1-9]\d{2}|[1-9]\d|[1-9])$/;
        $scope.subMaskRe = /^(255)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;
        $scope.vlanGroupRe = /^([1-3]\d{3}|40[1-8]\d|409[1-4]|[1-9]\d{2}|[1-9]\d|[1-9])$/;
        // VLAN Group 1-4094
        // $scope.vlanGroupBlur = function(name){
        //     var re = /^([1-3]\d{3}|40[1-8]\d|409[1-4]|[1-9]\d{2}|[1-9]\d|[1-9])$/;
        //     $scope.error[name] = !re.test($scope.temporary.IPIFVlanGroup);
        // };
        // public server port 验证
        $scope.serverBlur = function (name) {
            var re = /^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|[1-9])\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;
            $scope.error[name] = !re.test($scope.temporary[name]);
        };
        $scope.portBlur = function (name) { // 65535
            var re = /^([1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]|[1-9]\d{3}|[1-9]\d{2}|[1-9]\d|[1-9])$/;
            $scope.error[name] = !re.test($scope.temporary[name]);
        };
        $scope.valueChange = function (name) {
            $scope.error[name] = false;
        };
        $scope.checkPhrase = function () {
            $scope.phraseError = false;
            if ($scope.temporary.passPhrase && $scope.temporary.passPhrase.length == 64) {
                var re = /^[0-9A-Fa-f]{0,64}$/
                if (!re.test($scope.temporary.passPhrase)) {
                    $scope.phraseError = true;
                }
            }
        };
        $scope.checkKeyValue = function () {
            $scope.keyvalueError = false;
            if ($scope.temporary.keyValue) {
                if ($scope.temporary.keyType == 2) {
                    var re = /^[0-9A-Fa-f]+$/

                    if (!re.test($scope.temporary.keyValue)) {
                        $scope.keyvalueError = true;
                    }
                }
            }
        }
        // public 输入框限制输入
        $scope.IPKeydown = function ($event) {
            if (($event.ctrlKey && ($event.keyCode == 67 || $event.keyCode == 86)) || $event.keyCode == 9) {
                return;
            }
            var re = /(\.|\d|Backspace)/;
            if (!re.test($event.key)) {
                $event.preventDefault();
            }
            ;
        };
        $scope.invalidIP = {
            IPIFIpAddress: false,
            Error: false,
            IPIFGateway: false,
            IPIFDns: false,
            IPIFMask: false
        }

        function checkMask(mask) {
            var obj = mask;
            if (!obj) return false;
            var exp = /^(254|252|248|240|224|192|128|0)\.0\.0\.0|255\.(254|252|248|240|224|192|128|0)\.0\.0|255\.255\.(254|252|248|240|224|192|128|0)\.0|255\.255\.255\.(254|252|248|240|224|192|128|0)$/;
            var reg = obj.match(exp);
            if (reg == null) {
                return false; //"非法"
            } else {
                return true; //"合法"
            }
        }

        $scope.IPKeyup = function (key) {
            $scope.invalidIP[key] = false;
            var verifyRule2 = ['127.0.0.1', '0.0.0.0', '255.255.255.255'];
            if ((verifyRule2.indexOf($scope.temporary[key]) != -1)) {
                $scope.invalidIP[key] = true;
                $scope.invalidIP.Error = true;
            } else {
                if (key == 'IPIFMask') {
                    if (!checkMask($scope.temporary[key])) {
                        $scope.invalidIP[key] = true;
                        $scope.invalidIP.Error = true;
                    }
                } else {
                    if ($scope.temporary[key]) {
                        let IP = $scope.temporary[key].split(".");
                        if (IP[3] == 0 || IP[3] == 255 || IP[0] == 127) {
                            $scope.invalidIP[key] = true;
                            $scope.invalidIP.Error = true;
                        }
                        if (IP[0] == 0) {
                            $scope.invalidIP[key] = true;
                            $scope.invalidIP.Error = true;
                        }
                        if (IP[0] == 169 && IP[1] == 254) {
                            $scope.invalidIP[key] = true;
                            $scope.invalidIP.Error = true;
                        }
                    }

                }
                if (!$scope.invalidIP.IPIFDns && !$scope.invalidIP.IPIFIpAddress && !$scope.invalidIP.IPIFGateway && !$scope.invalidIP.IPIFMask) {
                    $scope.invalidIP.Error = false;
                }
            }

        }
        $scope.keyValuePattern = /^[A-Fa-f0-9]+$/;
        $scope.MACKeydown = function ($event) {
            if (($event.ctrlKey && ($event.keyCode == 67 || $event.keyCode == 86)) || $event.keyCode == 9) {
                return;
            }
            var re = /(\:|\d|Backspace|[A-F]|[a-f])/;
            if (!re.test($event.key)) {
                $event.preventDefault();
            }

        };
        $scope.numberKeydown = function ($event) {
            if (($event.ctrlKey && ($event.keyCode == 67 || $event.keyCode == 86)) || $event.keyCode == 9) {
                return;
            }
            var re = /(\d|Backspace)/;
            if (!re.test($event.key)) {
                $event.preventDefault();
            }
            ;
        }
        $scope.inputKeyDown = function ($event) {
            if (($event.ctrlKey && ($event.keyCode == 67 || $event.keyCode == 86)) || $event.keyCode == 9) {
                return;
            }
            var re = /\s/;
            if (re.test($event.key)) {
                $event.preventDefault();
            }
        };
        $scope.checkNaiRealm = function ($index) {
            var naiRealmIndex = 'naiRealm' + $index;
            var naiRealm = document.getElementsByName(naiRealmIndex)[0].value;
            if ($scope.domainListRe.test(naiRealm)) {
                $scope['inValidNaiRealm' + $index] = false;
            } else {
                $scope['inValidNaiRealm' + $index] = true;
            }
        };
        $scope.checkEapMethhod = function () {
            if ($scope.temporary.eapMethod == undefined) {
                $scope.inValidEapMethhod = true;
            }
            if (parseInt($scope.temporary.eapMethod) >= 0 && parseInt($scope.temporary.eapMethod) <= 4294967295) {
                $scope.inValidEapMethhod = false;
            } else {
                $scope.inValidEapMethhod = true;
            }
        };
        $scope.checkAuthenticationID = function ($index) {
            var authenticationIDIndex = 'authenticationID' + $index;
            var authenticationID = document.getElementsByName(authenticationIDIndex)[0].value;
            if (parseInt(authenticationID) >= 0 && parseInt(authenticationID) <= 255) {
                $scope['inValidAuthenticationID' + $index] = false;
            } else {
                $scope['inValidAuthenticationID' + $index] = true;
            }
        };
        $scope.checkParameterType = function ($index) {
            var parameterTypeIndex = 'parameterType' + $index;
            var parameterType = document.getElementsByName(parameterTypeIndex)[0].value;
            if (parseInt(parameterType) >= 0 && parseInt(parameterType) <= 4294967295) {
                $scope['inValidParameterType' + $index] = false;
            } else {
                $scope['inValidParameterType' + $index] = true;
            }
        };
        $scope.addEapMethodDisabled = function () {
            if ($scope.temporary.eapMethod == undefined || $scope.temporary.authAndTypeList == undefined) {
                return true;
            }
            if ($scope.inValidEapMethhod || $scope.temporary.eapMethod == '' || $scope.temporary.authAndTypeList.length <= 0) {
                return true;
            }
            for (var i = 0; i < $scope.temporary.authAndTypeList.length; i++) {
                if ($scope['inValidAuthenticationID' + i] ||
                    $scope['inValidParameterType' + i] ||
                    $scope.temporary.authAndTypeList[i].authenticationID == '' ||
                    $scope.temporary.authAndTypeList[i].parameterType == '') {
                    return true;
                }
            }
            return false;
        };
        $scope.addNaiRealmDisabled = function () {
            if ($scope.temporary.eapMethod == undefined || $scope.temporary.authAndTypeList == undefined) {
                return true;
            }
            if ($scope.inValidEapMethhod || (($scope.temporary.eapMethod != '') && ($scope.temporary.authAndTypeList.length == 0))) {
                return true;
            }
            if ($scope.temporary.authAndTypeList.length > 0) {
                for (var i = 0; i < $scope.temporary.authAndTypeList.length; i++) {
                    if ($scope['inValidAuthenticationID' + i] ||
                        $scope['inValidParameterType' + i] ||
                        $scope.temporary.authAndTypeList[i].authenticationID == '' ||
                        $scope.temporary.authAndTypeList[i].parameterType == '') {
                        return true;
                    }
                }
            }
            if ($scope.temporary.naiRealmList.length > 0) {
                for (var i = 0; i < $scope.temporary.naiRealmList.length; i++) {
                    if ($scope['inValidNaiRealm' + i] || $scope.temporary.naiRealmList[i].domainName == '') {
                        return true;
                    }
                }
            }
            if ($scope.eapMethodOptions.data.length == 0 || $scope.temporary.naiRealmList.length == 0) {
                return true;
            }
            return false;
        };

        function loadPasscode(ssid) {
            BatchConfigService.loadPasscodeList($scope.agUuid, ssid, function (result) {
                if (result.success) {
                    var oneDay = 60 * 24;
                    var oneHour = 60;
                    var current = new Date().getTime();
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
                    $scope.passcodeOptions.data = result.data;
                }
            })

        }


    });
    app.register.directive('siteSsid', function () {
        return {
            restrict: 'AE',
            scope: {
                ssidData: '=',
                performanceData: '=',
                wirelessData: '=',
                profileId: '=',
                agUuid: '='
            },
            templateUrl: "./views/configuration/site-SSID.html",
            controller: 'siteSsidController'
        };
    });

})