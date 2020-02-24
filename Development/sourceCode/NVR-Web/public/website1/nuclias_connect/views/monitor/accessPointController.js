/**
 * Created by guojiangchao on 2017/9/15.
 */
define(["app", "echarts"], function (app, echarts) {

    app.register.controller('accessPointController', function ($rootScope, $scope, DashboardService, $uibModal, $timeout, Current, utils, DeviceDetailService, InventoryService, CustomService, OrganizationService, moudlesService, TS) {


        /*
         * 控制内容区域高度
         */
        setHeight('set-height', [], 48);
        $timeout(function () {
            setGridHeight('accessPointsGrid', true);
        }, 100);
        $scope.aplistCharts = echarts.init(document.getElementById('accessPointsCharts'));
        window.onresize = function () {
            setHeight('set-height', [], 48);
            resetCartSize();
            $timeout(function () {
                setGridHeight('accessPointsGrid', true);
            }, 100);
        };
        $scope.$watch('isHide', function (val) {
            resetCartSize();

        })

        function resetCartSize() {
            if ($scope.isHide) {
                $scope.size = {
                    width: document.body.clientWidth - 128,
                    height: 252
                }
            } else {
                $scope.size = {
                    width: document.body.clientWidth - 244,
                    height: 252
                }
            }
        }

        var userInfo = Current.user();
        $scope.power = {
            hasCreate: userInfo.role == 'root admin',
            hasEdit: function (ap) {
                if (userInfo.role == 'root admin') return true;
                if (userInfo.role == 'local admin') {
                    if (userInfo.privilege.indexOf(ap.networkId) != -1)
                        return true;
                }
                return false;
            },
            hasRead: function (ap) {
                if (userInfo.role == 'root admin' || userInfo.role == 'root user') return true;
                if (userInfo.role == 'local admin' || userInfo.role == 'local user') {
                    if (userInfo.privilege.indexOf(ap.networkId) != -1)
                        return true;
                }
                return false;
            }
        }

        /*
         * 折线图横轴数据
         */
        var timeData = ['0:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00',
            '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
            '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
        var noNTPTimeData = ['-23' + TS.ts("label.hours"), '-22' + TS.ts("label.hours"), '-21' + TS.ts("label.hours"), '-20' + TS.ts("label.hours"),
            '-19' + TS.ts("label.hours"), '-18' + TS.ts("label.hours"), '-17' + TS.ts("label.hours"), '-16' + TS.ts("label.hours"),
            '-15' + TS.ts("label.hours"), '-14' + TS.ts("label.hours"), '-13' + TS.ts("label.hours"), '-12' + TS.ts("label.hours"),
            '-11' + TS.ts("label.hours"), '-10' + TS.ts("label.hours"), '-9' + TS.ts("label.hours"), '-8' + TS.ts("label.hours"),
            '-7' + TS.ts("label.hours"), '-6' + TS.ts("label.hours"), '-5' + TS.ts("label.hours"), '-4' + TS.ts("label.hours"),
            '-3' + TS.ts("label.hours"), '-2' + TS.ts("label.hours"), '-1' + TS.ts("label.hours"), TS.ts("dashboard.now")];
        /*
         * 折线图mock数据
         */
        var rxData = [];
        var txData = [];
        // option for search
        $scope.optionTypes = ['ip', 'localipv6', 'lanIP', 'mac', 'moduleType', 'firmware', 'name', 'location', 'channel24Ghz', 'channel5Ghz', 'channel5Ghz2', 'power24Ghz', 'power5Ghz', 'power5Ghz2']; // channel5Ghz2  power5Ghz2
        $scope.percentTypes = ['power24Ghz', 'power5Ghz', 'power5Ghz2', 'totalUsage', 'cpuUsage', 'memoryUsage'];
        $scope.unsupportTypes = ['channel24Ghz', 'channel5Ghz', 'channel5Ghz2', 'power24Ghz', 'power5Ghz', 'power5Ghz2'];
        /*
         * 下拉选框数据
         */
        $scope.usageSelect = {
            site: "",
            network: ""
        };
        /*
         * 根据 搜索条件 过滤表格数据
         */
        $scope.searchData = {
            type: $scope.optionTypes[0],
            value: ''
        };
        $scope.Error = {sysName: false};
        /*
         * 统计数据
         */
        $scope.total = {
            aps: 0,
            clients: 0,
            download: 0,
            upload: 0
        };
        /*
         * 表格中下拉选框内容
         */
        $scope.channel24s = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
        $scope.channel5s = [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116,
            120, 124, 128, 132, 136, 140, 149, 153, 157, 161, 165];
        $scope.powerSettings = ['default', '12.5', '25', '50', '100'];

        /*
         * 返回跳转信息
         */
        $scope.goto = {parentId: 'dashboard', moudleId: 'accessPoint', pageId: 'deviceDetail', id: 'test switch'};
        $scope.gotoDetail = function (device) {
            $scope.goto.id = device._id;
            Current.setDevice(device);
            return $scope.goto;
        };

        $scope.changeSite = function () {
            $scope.usageSelect.network = $scope.usageSelect.site.networks[0];
        };
        /*
         * echart 图标大小
         */
        $scope.size = {
            width: document.body.clientWidth - 224,
            height: 252
        };
        //showChartsLoading();

        /*显示正在加载*/
        function showChartsLoading() {
            //setTimeout(() => {
            $scope.aplistCharts = echarts.init(document.getElementById('accessPointsCharts'));
            // // 调用showLoading方法
            $scope.aplistCharts.showLoading({
                text: TS.ts('column.loading'),
                color: '#D5D5D5',
                textColor: '#000',
                maskColor: 'rgba(255, 255, 255, 0.8)',
                zlevel: 0,
            });
            //}, 0);
        }

        /*
         * 折线图配置参数
         */
        $scope.accessPointsCharts = {
            options: {
                legend: {
                    right: 12,
                    data: ['Download (MB)', 'Upload (MB)']
                },
                grid: {
                    show: true,
                    left: 24,
                    top: 44,
                    right: 24,
                    bottom: 28,
                    containLabel: true
                },
                xAxis: [
                    {
                        type: 'category',
                        data: timeData
                    }
                ],
                yAxis: [
                    {
                        name: 'MB', // 需根据实际数据修改
                        type: 'value'
                    }
                ],
                // dataZoom: {
                //     show: true,
                //     start: 0
                // },
                series: [
                    {
                        name: 'Download (MB)',
                        color: ['#22b7db'],
                        type: 'line',
                        stack: '总量',
                        areaStyle: {
                            normal: {
                                color: 'rgba(34,183,219,0.1)',
                            }
                        },
                        symbol: 'circle',
                        symbolSize: 4,
                        smooth: false,
                        hoverAnimation: false,
                        data: txData
                    }, {
                        name: 'Upload (MB)',
                        color: ['#afcb20'],
                        type: 'line',
                        stack: '总量',
                        areaStyle: {
                            normal: {
                                color: 'rgba(175,203,32,0.1)',
                            }
                        },
                        symbol: 'circle',
                        symbolSize: 4,
                        smooth: false,
                        hoverAnimation: false,
                        data: rxData
                    }
                ]
            }
        };
        $scope.returnNoOfAP = function (r) {
            var index = r.$$hashKey;
            for (var i = 0; i < $scope.accessPointsOptions.data.length; i++) {
                if ($scope.accessPointsOptions.data[i].$$hashKey == index) {
                    return i + 1;
                }
            }
            ;
        }
        /*
         * 表格配置参数
         */
        var detailHtml = '<a  class="btn-grid" ng-if="grid.appScope.power.hasRead(row.entity)" title="{{\'accessPoint.linktoPage\'|translate}}" target="_blank" rel="noopener noreferrer" ui-sref="user.org.menuDetails(grid.appScope.gotoDetail(row.entity))" ' +
            '><md-icon md-svg-icon="modal:detail"></md-icon></a>';
        var rebootHtml = '<a class="btn-grid" ng-if="grid.appScope.power.hasEdit(row.entity)" ng-disabled="row.entity.status!=\'online\'||row.entity.isProcessing" ng-click="grid.appScope.reboot(row.entity)" title="{{\'accessPoint.reboot\'|translate}}"><md-icon md-svg-icon="modal:reboot"></md-icon></a>';
        var removeHtml = '<a class="btn-grid" ng-if="grid.appScope.power.hasCreate"  ng-click="grid.appScope.removeToIgnore(row.entity)" title="{{\'accessPoint.ignoreDevice\'|translate}}"><md-icon md-svg-icon="modal:moveToIgnore"></md-icon></a>'
        $scope.accessPointsOptions = {
            isLoading: true,
            enableGridMenu: true,
            excessRows: 100,
            paginationPageSizes: [20, 25, 50],
            paginationTemplate: './views/templates/gridBurster.html',
            paginationPageSize: 20,
            enableSorting: true,
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
                    field: 'status', minWidth: "75", displayName: TS.ts('column.status'),
                    cellTemplate: '<a style="padding:2px;" ng-class="row.entity.status">' +
                        '<md-icon md-svg-icon="status:online_status"  title="{{\'common.\'+row.entity.status|translate}}"></md-icon></a>'
                },
                {
                    field: 'action',
                    minWidth: "100",
                    enableColumnMenu: false,
                    displayName: TS.ts('column.action'),
                    enableHiding: false,
                    enableSorting: false,
                    cellTemplate: '<div class="ui-grid-cell-contents">' + rebootHtml + removeHtml + detailHtml + '</div>'
                },
                {
                    field: 'ip',
                    minWidth: "128",
                    displayName: TS.ts('column.ip'),
                    sort: {
                        direction: 'asc'
                    },
                    cellTemplate: '<div class="ui-grid-cell-contents"><a target="_blank" href="http://{{row.entity.ip}}" rel="noopener noreferrer">{{row.entity.ip}}</a></div>',
                    sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                        var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                        return utils.sortByIP(nulls, a, b);

                    }
                },
                {
                    field: 'localipv6',
                    minWidth: "16",
                    width: 180,
                    displayName: TS.ts('column.localipv6'),
                    visible: false
                },
                {
                    field: 'lanIP', minWidth: "125", displayName: TS.ts('column.lanIP'), visible: false,
                    sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                        var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                        return utils.sortByIP(nulls, a, b);

                    }
                },
                {field: 'mac', minWidth: "120", displayName: TS.ts('column.mac')},
                {field: 'moduleType', minWidth: "105", displayName: TS.ts('column.moduleType')},
                {field: 'firmware', minWidth: "105", displayName: TS.ts('column.firmware'), visible: false},
                {
                    field: 'server.name',
                    minWidth: "100",
                    displayName: TS.ts('column.name'),
                    cellClass: 'ofv',
                    visible: false,
                    cellTemplate: '<div class="hoverTest" ><span>{{row.entity.server.name||"&nbsp;"}}</span>' +
                        '<div ng-class="row.entity.sysNameError?\'error\':\'\'"><input type="text" name="sysname"  class="form-control" ng-model="row.entity.server.name" ng-blur="grid.appScope.saveName(row.entity)" ' +
                        'ng-keydown="grid.appScope.enterKeydown($event)" ng-keyup="grid.appScope.enterKeyUpSysName(row.entity,$event)"    maxLength="63"  ng-trim="false">' +
                        '<span class="hint-span"></span></div></div>'
                },
                {
                    field: 'server.location',
                    minWidth: "100",
                    displayName: TS.ts('column.location'),
                    cellClass: 'ofv',
                    visible: false,
                    cellTemplate: '<div  class="hoverTest" ><span >{{row.entity.server.location||"&nbsp;"}}</span>' +
                        '<div ng-class="row.entity.locationError?\'error\':\'\'"><input type="text" name="location"  class="form-control" ng-model="row.entity.server.location" ng-blur="grid.appScope.saveLocation(row.entity)" ' +
                        'ng-keydown="grid.appScope.enterKeydown($event)"  ng-keyup="grid.appScope.enterKeyUpLocation(row.entity,$event)"  maxLength="32"  ng-trim="false">' +
                        '</div></div>'
                },
                {field: 'network', minWidth: "120", displayName: TS.ts('column.network')},
                {field: 'client', displayName: TS.ts('column.client'), minWidth: "75", type: 'number'},
                {
                    field: 'server.channel24Ghz',
                    minWidth: "128",
                    type: 'number',
                    displayName: TS.ts('column.channel24Ghz'),
                    cellClass: 'ofv',
                    cellTemplate: '<div ng-if="row.entity.server.channel24Ghz==-1" class="ui-grid-cell-contents">{{"common.notSupport"|translate}}</div><div class="hoverTest" ng-if="row.entity.server.channel24Ghz!=-1"><span>{{row.entity.server.channel24Ghz|autoFilterForChannel}}</span>' +
                        '<div class="select-autowidth" style="width: 104px;height: 32px;">' +
                        '<ui-select ng-model="row.entity.server.channel24Ghz" theme="bootstrap"   on-select="grid.appScope.applyChannel24(row.entity);">' +
                        '<ui-select-match placeholder="{{\'common.pickone\'|translate}}">{{$select.selected|autoFilterForChannel}}</ui-select-match>' +
                        '<ui-select-choices repeat="c in row.entity.channelList24Ghz">{{c|autoFilterForChannel}}</ui-select-choices></ui-select></div></div>'
                },
                {
                    field: 'server.channel5Ghz',
                    minWidth: "128",
                    type: 'number',
                    displayName: TS.ts('column.channel5Ghz'),
                    cellClass: 'ofv',
                    cellTemplate: '<div ng-if="row.entity.server.channel5Ghz==-1" class="ui-grid-cell-contents">{{"common.notSupport"|translate}}</div><div class="hoverTest" ng-if="row.entity.server.channel5Ghz!=-1"><span>{{row.entity.server.channel5Ghz|autoFilterForChannel}}</span>' +
                        '<div class="select-autowidth" style="width: 104px;height: 32px;">' +
                        '<ui-select ng-model="row.entity.server.channel5Ghz" theme="bootstrap"  on-select="grid.appScope.applyChannel5(row.entity);">' +
                        '<ui-select-match placeholder="{{\'common.pickone\'|translate}}">{{$select.selected|autoFilterForChannel}}</ui-select-match>' +
                        '<ui-select-choices repeat="c in row.entity.channelList5Ghz">{{c|autoFilterForChannel}}</ui-select-choices></ui-select></div></div>'
                },
                {
                    field: 'server.channel5Ghz2', visible: false,
                    minWidth: "128",
                    type: 'number',
                    displayName: TS.ts('column.channel5Ghz2'),
                    cellClass: 'ofv',
                    cellTemplate: '<div ng-if="row.entity.server.channel5Ghz2==-1" class="ui-grid-cell-contents">{{"common.notSupport"|translate}}</div><div class="hoverTest" ng-if="row.entity.server.channel5Ghz2!=-1"><span>{{row.entity.server.channel5Ghz2|autoFilterForChannel}}</span>' +
                        '<div class="select-autowidth" style="width: 104px;height: 32px;">' +
                        '<ui-select ng-model="row.entity.server.channel5Ghz2" theme="bootstrap"  on-select="grid.appScope.applyChannel5G2(row.entity);">' +
                        '<ui-select-match placeholder="{{\'common.pickone\'|translate}}">{{$select.selected|autoFilterForChannel}}</ui-select-match>' +
                        '<ui-select-choices repeat="c in row.entity.channelList5Ghz2">{{c|autoFilterForChannel}}</ui-select-choices></ui-select></div></div>'
                },
                {
                    field: 'server.power24Ghz', visible: false,
                    minWidth: "128",
                    displayName: TS.ts('column.power24Ghz'),
                    cellClass: 'ofv',
                    cellTemplate: '<div ng-if="row.entity.server.power24Ghz==-1" class="ui-grid-cell-contents">{{"common.notSupport"|translate}}</div><div class="hoverTest" ng-if="row.entity.server.power24Ghz!=-1"><span>{{row.entity.server.power24Ghz|autoFilterForPower}}</span>' +
                        '<div class="select-autowidth" style="width: 104px;height: 32px;">' +
                        '<ui-select ng-model="row.entity.server.power24Ghz" theme="bootstrap"  on-select="grid.appScope.applyPower24(row.entity);">' +
                        '<ui-select-match placeholder="{{\'common.pickone\'|translate}}">{{$select.selected|autoFilterForPower}}</ui-select-match>' +
                        '<ui-select-choices repeat="c in grid.appScope.powerSettings">{{c|autoFilterForPower}}</ui-select-choices></ui-select></div></div>'
                },
                {
                    field: 'server.power5Ghz', visible: false,
                    minWidth: "128",
                    displayName: TS.ts('column.power5Ghz'),
                    cellClass: 'ofv',
                    cellTemplate: '<div ng-if="row.entity.server.power5Ghz==-1" class="ui-grid-cell-contents">{{"common.notSupport"|translate}}</div><div class="hoverTest" ng-if="row.entity.server.power5Ghz!=-1"><span>{{row.entity.server.power5Ghz|autoFilterForPower}}</span>' +
                        '<div class="select-autowidth" style="width: 104px;height: 32px;">' +
                        '<ui-select ng-model="row.entity.server.power5Ghz" theme="bootstrap"  on-select="grid.appScope.applyPower5(row.entity);">' +
                        '<ui-select-match placeholder="{{\'common.pickone\'|translate}}">{{$select.selected|autoFilterForPower}}</ui-select-match>' +
                        '<ui-select-choices repeat="c in grid.appScope.powerSettings">{{c|autoFilterForPower}}</ui-select-choices></ui-select></div></div>'
                },
                {
                    field: 'server.power5Ghz2', visible: false,
                    minWidth: "128",
                    displayName: TS.ts('column.power5Ghz2'),
                    cellClass: 'ofv',
                    cellTemplate: '<div ng-if="row.entity.server.power5Ghz2==-1" class="ui-grid-cell-contents">{{"common.notSupport"|translate}}</div><div class="hoverTest" ng-if="row.entity.server.power5Ghz2!=-1"><span>{{row.entity.server.power5Ghz2|autoFilterForPower}}</span>' +
                        '<div class="select-autowidth" style="width: 104px;height: 32px;">' +
                        '<ui-select ng-model="row.entity.server.power5Ghz2" theme="bootstrap"  on-select="grid.appScope.applyPower5G2(row.entity);">' +
                        '<ui-select-match placeholder="{{\'common.pickone\'|translate}}">{{$select.selected|autoFilterForPower}}</ui-select-match>' +
                        '<ui-select-choices repeat="c in grid.appScope.powerSettings">{{c|autoFilterForPower}}</ui-select-choices></ui-select></div></div>'
                },
                {
                    field: 'apToStaTxDataBytes',
                    visible: false,
                    minWidth: "100",
                    type: 'number',
                    displayName: TS.ts('column.download'),
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.apToStaTxDataBytes|bytesFilter}}</div>'
                },
                {
                    field: 'staToApRxDataBytes', visible: false, minWidth: "90", displayName: TS.ts('column.upload'),
                    type: 'number',
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.staToApRxDataBytes|bytesFilter}}</div>'
                },
                {
                    field: 'totalUsage', visible: false, minWidth: "110", displayName: TS.ts('column.totalUsage'),
                    type: 'number',
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.totalUsage|bytesFilter}}</div>'
                },
                {
                    field: 'percentUsage', visible: false, minWidth: "125", displayName: TS.ts('column.percentUsage'),
                    type: 'number',
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.percentUsage|number:2}}%</div>'
                },
                {
                    field: 'cpuUsage', visible: false, minWidth: "120", displayName: TS.ts('column.cpuUsage'),
                    type: 'number',
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.cpuUsage}}%</div>'
                },
                {
                    field: 'memoryUsage', visible: false, minWidth: "140", displayName: TS.ts('column.memoryUsage'),
                    type: 'number',
                    cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.memoryUsage}}%</div>'
                },
                {
                    field: 'lastUpdateTime',
                    minWidth: "140",
                    displayName: TS.ts('column.lastUpdateTime'),
                    cellFilter: 'ISOTimeFilter'
                },
                {
                    field: 'upTime',
                    type: 'number',
                    visible: false,
                    minWidth: "105",
                    displayName: TS.ts('column.sysUpTime'),
                    cellFilter: 'uptimeFilter'
                }
            ],
            data: [],
            useExternalPagination: true,
            onRegisterApi: function (gridApi) {
                $scope.gridApi = gridApi;
                //分页按钮事件
                $scope.gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {

                    if ($scope.searchAP) {
                        $scope.searchAP();
                    }

                    //換頁不影響No. 排序
                    var number = pageSize * (newPage - 1);
                    var originalSorting = document.getElementsByClassName('ui-grid-cell-contents item_number');

                    for (var i = 0; i < originalSorting.length; i++) {
                        originalSorting[i].innerHTML = i + number + 1;
                    }

                });
                $scope.gridApi.core.on.sortChanged($scope, function (grid, sortColumns) {
                    console.log(sortColumns);
                    // if( sortColumns.length === 0){
                    // } else {
                    //     let options=[]
                    //     for (const item of sortColumns) {
                    //         //console.log("item:", item);
                    //         var Option = {}
                    //         Option.field = TransField(item.field);
                    //         Option.priority = item["sort"].priority === undefined ? -1 : item["sort"].priority;
                    //         Option.direction = item["sort"].direction === "asc" ? 1 : -1;
                    //         options.push(Option)
                    //     }
                    //     // options.sort(function (a, b) {
                    //     //     return (a.priority - b.priority)
                    //     // })
                    //     //console.log("options:",JSON.stringify(options))
                    //     $scope.sortOptions=options
                    //     $scope.search()
                    // }
                });
                gridApi.core.on.columnVisibilityChanged($scope, function (column) {
                    // 记录列表隐藏列
                    // Todo 存储用户习惯
                    if (column.visible) {
                        if ($rootScope.customAction.gridVisible)
                            $rootScope.customAction.gridVisible.accessPointsOptions.push(column.field)
                    } else {
                        $rootScope.customAction.gridVisible.accessPointsOptions = _.without($rootScope.customAction.gridVisible.accessPointsOptions, column.field);
                    }
                });
            }
        };
        // $scope.sortOptions = [];
        //
        // //取自DView7-SP1-Web/cwmcontroller/dashboard.js 中 transferDeviceServerData()方法
        // function TransField(input) {
        //     switch (input) {
        //         case "server.channel24Ghz":
        //             return "channel24Ghz"
        //         case "server.channel5Ghz":
        //             return "channel5Ghz"
        //         case "server.channel5Ghz2":
        //             return "channel5Ghz2"
        //         case "server.power24Ghz":
        //             return "power24Ghz"
        //         case "server.power5Ghz":
        //             return "power5Ghz"
        //         case "server.power5Ghz2":
        //             return "power5Ghz2"
        //         case "server.name":
        //             return "name"
        //         case "server.location":
        //             return "location"
        //         //其它自定义转换
        //         case "percentUsage":
        //             return "totalUsage"
        //         default:
        //             return input;
        //     }
        // }
        /*
         * 表格中，应用channel 2.4G
         */
        $scope.applyChannel24 = function (row) {
            var param = {
                networkId: row.networkId,
                devMac: row.mac,
                newChannel: row.server.channel24Ghz
            };
            DeviceDetailService.resetChannel24(param, function (result) {

            });
        };
        /*
         * 表格中，应用channel 5G
         */
        $scope.applyChannel5 = function (row) {
            $scope.isEdit = false;
            var param = {
                networkId: row.networkId,
                devMac: row.mac,
                newChannel: row.server.channel5Ghz
            };
            DeviceDetailService.resetChannel5(param, function (result) {

            });
        };
        /*
         * 表格中，应用channel 5G 2nd
         */
        $scope.applyChannel5G2 = function (row) {
            $scope.isEdit = false;
            var param = {
                networkId: row.networkId,
                devMac: row.mac,
                newChannel: row.server.channel5Ghz2
            };
            DeviceDetailService.resetChannel5G2(param, function (result) {

            });
        };
        /*
         * 表格中，应用power 2.4G
         */
        $scope.applyPower24 = function (row) {
            $scope.isEdit = false;
            var param = {
                networkId: row.networkId,
                devMac: row.mac,
                newPower: row.server.power24Ghz
            };
            DeviceDetailService.resetPowerSetting24(param, function (result) {

            });
        };
        /*
         * 表格中，应用power 5G
         */
        $scope.applyPower5 = function (row) {
            $scope.isEdit = false;
            var param = {
                networkId: row.networkId,
                devMac: row.mac,
                newPower: row.server.power5Ghz
            };
            DeviceDetailService.resetPowerSetting5(param, function (result) {

            });
        };

        /*
         * 表格中，应用power 5G 2nd
         */
        $scope.applyPower5G2 = function (row) {
            $scope.isEdit = false;
            var param = {
                networkId: row.networkId,
                devMac: row.mac,
                newPower: row.server.power5Ghz2
            };
            DeviceDetailService.resetPowerSetting5G2(param, function (result) {

            });
        };
        /*
         * 表格中，保存loaction
         */
        $scope.saveLocation = function (row) {
            $scope.isEdit = false;
            if (!row.locationError) {
                row.locationError = false;
                var param = {
                    networkId: row.networkId,
                    devMac: row.mac,
                    newLocation: row.server.location
                };
                DeviceDetailService.resetLocation(param, function (result) {

                });
            }
            checkLocationErrors();
        };
        /*
         * 表格中，保存name
         */
        $scope.saveName = function (row) {
            $scope.isEdit = false;
            if (!row.sysNameError) {
                row.sysNameError = false;
                var param = {
                    networkId: row.networkId,
                    devMac: row.mac,
                    newName: row.server.name
                };
                DeviceDetailService.resetName(param, function (result) {

                });
            }

            checkErrors();
        };
        /*
         * 表格中，reboot功能
         */
        $scope.reboot = function (row) {
            if (row.status != 'online') return;
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/templates/dialogConfirm.html',
                windowClass: 'modal-del',
                resolve: {
                    row: row
                },
                size: "w500",
                controller: function ($scope, $uibModalInstance, row) {
                    $scope.con = {
                        title: TS.ts("accessPoint.rebootTitle"),
                        content: TS.ts("accessPoint.rebootTip"),
                        type: 'modal:reboot'
                    };
                    $scope.ok = function () {
                        $uibModalInstance.close(row);
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function (row) {
                row.isProcessing = true;
                var param = {
                    networkId: row.networkId,
                    devMac: row.mac
                };
                DeviceDetailService.reboot(param, function (result) {

                });
            }, function () {

            });
        };
        /*
         * 表格中，remove to ignore功能
         */
        $scope.removeToIgnore = function (row) {


            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/templates/dialogConfirm.html',
                windowClass: 'modal-del',
                resolve: {
                    row: row
                },
                size: "w500",
                controller: function ($scope, $uibModalInstance, row) {
                    $scope.con = {
                        title: TS.ts("deviceManage.removeToUnmanaged"),
                        content: TS.ts("deviceManage.unmanageTip"),
                        type: 'modal:moveToIgnore'
                    };
                    $scope.ok = function () {
                        $uibModalInstance.close(row);
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function (row) {
                InventoryService.deleteDevice([{devMac: row.mac, uuid: row.uuid}], function (result) {
                    getAPInfo($scope.usageSelect.site, $scope.usageSelect.network);
                    $scope.search();
                });
            }, function () {

            });
        };
        /*
         * 表格中，输入框 enter 失去焦点(失去焦点后会执行保存方法)
         */
        $scope.enterKeydown = function ($event) {
            var keycode = window.event ? $event.keyCode : $event.which;//获取按键编码  
            if (keycode == 13) {
                if ($event.target) {
                    $event.target.blur();
                }
            }
            $scope.isEdit = true;
        };
        $scope.enterKeydownSysName = function (row, $event) {
            var keycode = window.event ? $event.keyCode : $event.which;//获取按键编码
            if (keycode == 13) {
                if ($event.target) {
                    $event.target.blur();
                }
            }

        };
        $scope.enterKeyUpSysName = function (row, $event) {
            if (row.server.name) {
                var reg = /^[\u4E00-\u9FA5A-Za-z0-9_-]+$/
                var verifyRule1 = /^\s+/;
                var verifyRule2 = /\s+$/;
                if (reg.test(row.server.name) && !verifyRule1.test(row.server.name) && !verifyRule2.test(row.server.name)) {
                    row.sysNameError = false;
                } else {
                    row.sysNameError = true;
                }
            } else {
                row.sysNameError = true;
            }
            checkErrors();
        };
        $scope.enterKeyUpLocation = function (row, $event) {
            if (row.server.location) {
                var reg = /^[\u4E00-\u9FA5A-Za-z0-9_@.-]+$/
                if (reg.test(row.server.location)) {
                    row.locationError = false;
                } else {
                    row.locationError = true;
                }
            } else {
                row.sysNameError = true;
            }
            checkLocationErrors();
        }

        function checkErrors() {
            var count = $scope.accessPointsOptions.data.length;
            var len = count;
            for (var i = 0; i < len; i++) {
                if ($scope.accessPointsOptions.data[i].sysNameError) {
                    $scope.Error.sysName = true;
                    break;
                }
                count--;
            }
            if (count == 0) {
                $scope.Error.sysName = false;
            }
        }

        function checkLocationErrors() {
            var count = $scope.accessPointsOptions.data.length;
            var len = count;
            for (var i = 0; i < len; i++) {
                if ($scope.accessPointsOptions.data[i].locationError) {
                    $scope.Error.location = true;
                    break;
                }
                count--;
            }
            if (count == 0) {
                $scope.Error.location = false;
            }
        }

        function fwVersionTransInAPList(data) {
            for (var i = 0; i < data.length; i++) {
                var location_r = data[i].firmware.indexOf('r');
                if (location_r != -1) {
                    var firmware = data[i].firmware.substring(0, location_r);
                    data[i].firmware = firmware;
                }
            }
            return data;
        }

        /*
         * 获取表格数据
         */
        function getAPInfo(site, network) {
            if (!site && !network) return;
            var curPage = $scope.accessPointsOptions.paginationCurrentPage;
            var pageSize = $scope.accessPointsOptions.paginationPageSize;

            var rule = {siteId: site._id, networkId: network._id};
            if ($scope.searchData.value && $scope.searchData.value != "") {
                var temp = $scope.searchData.value;
                if ($scope.searchData.value == 'n/a' && $scope.unsupportTypes.indexOf($scope.searchData.type) != -1) {
                    temp = -1;
                    rule[$scope.searchData.type] = temp;
                }
                else {
                    if ($scope.percentTypes.indexOf($scope.searchData.type) != -1) {
                        var temp = $scope.searchData.value;
                        if ($scope.searchData.value.lastIndexOf('%') != -1) {
                            temp = temp.replace(/%/g, "");
                        }
                        rule[$scope.searchData.type] = temp;
                    }
                    else {
                        rule[$scope.searchData.type] = temp;
                    }
                }

            }
            DashboardService.getAPInfo(rule, {start: curPage - 1, count: pageSize}, function (result) {
                //DashboardService.getAPInfo(rule, {start: curPage - 1, count: pageSize, sort: $scope.sortOptions}, function (result) {
                $scope.accessPointsOptions.isLoading = false;
                if (result.success) {
                    for (var i = 0; i < result.data.length; i++) {
                        var item = result.data[i];
                        item.supplier = getSupplier(item.supplierId);
                    }

                    $scope.accessPointsOptions.data = fwVersionTransInAPList(result.data);
                    $scope.accessPointsOptions.totalItems = result.total;
                    $scope.totalOnline = result.online;
                    $scope.gridCopyData = angular.copy(fwVersionTransInAPList(result.data));
                }
            });
        };
        $scope.$on('refreshAPList', function () {
            if ($scope.isEdit) return;
            $scope.searchAP(false, true);
        });
        /**
         * @method 以NCTime也就是后台时间为准
         * @author 李莉红
         * @version
         * */
        //utils.getNodeTime(function () {
        //$scope.searchAP();
        //getNetWork();
        //});
        $scope.NTPStatus1 = 0;
        OrganizationService.getSystemStatus(function (result) {
            if (result.success) {
                $scope.NTPStatus1 = result.data.ntpStatus;
            }
            //$scope.NTPStatus1 = 0;//测试代码;
            /**
             * 获取site、network下拉框数据
             */
            DashboardService.getSiteAndNetwork(function (result) {
                if (result.success) {
                    $scope.optionSites = result.data;
                    // 添加 all network
                    var allNetwork = [{name: 'common.allNetwork', _id: 'ALL', agentUUID: 'ALL'}];
                    for (var i = 0; i < $scope.optionSites.length; i++) {
                        allNetwork = allNetwork.concat($scope.optionSites[i].networks);
                        $scope.optionSites[i].networks.unshift({
                            name: 'common.allNetwork',
                            _id: 'ALL',
                            agentUUID: 'ALL'
                        });
                    }
                    $scope.optionSites.unshift({siteName: 'common.allSite', networks: allNetwork, _id: 'ALL'});
                    // select 赋值
                    $scope.usageSelect.site = $scope.optionSites[0];
                    $scope.usageSelect.network = $scope.usageSelect.site.networks[0];
                    // test code
                    /*
                     * 获取并设置用户使用记录
                     *
                     */
                    $scope.nodeEnv = false;
                    OrganizationService.getNodeEnv(function (result) {
                        if (result.success) {
                            Current.setNodeEnv(result.data);
                            $scope.nodeEnv = result.data == "Production_hualian";
                            if (Current.getNodeEnv() == "Production_hualian") {
                                $scope.accessPointsOptions.columnDefs.splice(12, 0, {
                                    field: 'schoolId',
                                    minWidth: "120",
                                    displayName: TS.ts('column.schoolId')
                                });
                                $scope.accessPointsOptions.columnDefs.splice(13, 0, {
                                    field: 'supplier',
                                    minWidth: "120",
                                    displayName: TS.ts('supplier.supplier'),
                                    cellClass: 'ofv',
                                    cellTemplate: '<div class="hoverTest"><span>{{row.entity.supplier|supplierFilter}}</span>' +
                                        '<div class="select-autowidth" style="width: 104px;height: 32px;">' +
                                        '<ui-select ng-model="row.entity.supplier" theme="bootstrap"   on-select="grid.appScope.applySupplier(row.entity);">' +
                                        '<ui-select-match placeholder="{{\'common.pickone\'|translate}}">{{$select.selected|supplierFilter}}</ui-select-match>' +
                                        '<ui-select-choices repeat="c in grid.appScope.suppliers">{{c|supplierFilter}}</ui-select-choices></ui-select></div></div>'
                                })
                            }
                        }

                        CustomService.getPageAction(function (result) {
                            if (result.success) {
                                var data = result.data;
                                $rootScope.customAction = data;
                                if (data) {
                                    // 根据用户习惯隐藏列表列，初始化select选择
                                    for (var i = 0; i < $scope.optionSites.length; i++) {
                                        if ($scope.optionSites[i]._id == data.site) {
                                            for (var j = 0; j < $scope.optionSites[i].networks.length; j++) {
                                                if ($scope.optionSites[i].networks[j].agentUUID == data.network) {
                                                    $scope.usageSelect.site = $scope.optionSites[i];
                                                    $scope.usageSelect.network = $scope.optionSites[i].networks[j];
                                                }
                                            }
                                        }
                                    }
                                    if (data.gridVisible && data.gridVisible.accessPointsOptions) {
                                        for (var i = 0; i < $scope.accessPointsOptions.columnDefs.length; i++) {
                                            if (data.gridVisible.accessPointsOptions.indexOf($scope.accessPointsOptions.columnDefs[i].field) == -1) {
                                                $scope.accessPointsOptions.columnDefs[i].visible = false;
                                            } else {
                                                $scope.accessPointsOptions.columnDefs[i].visible = true;
                                            }
                                        }
                                    }

                                }
                                OrganizationService.listSuppliers(function (result) {
                                    if (result.success) {
                                        $scope.suppliers = result.data;
                                        getAPInfo($scope.usageSelect.site, $scope.usageSelect.network);
                                    }
                                });

                                getUDInfo();
                            }
                        });

                    });

                }
            });
            //$scope.searchAP();
        });
        /*
         * 获取折线图数据 upload download
         */
        var getUDInfo = function (isRefresh) {
            var hour = new Date(NCTime).getHours();
            var offset = NCTimeOffset;
            var rule = {siteId: $scope.usageSelect.site._id, networkId: $scope.usageSelect.network._id};
            var time = {startHour: hour, offset: offset, ntpStatus: $scope.NTPStatus1};
            if (!isRefresh) {
                showChartsLoading();
            }
            DashboardService.getAllUsageData(rule, time, function (result) {
                if (result.success && result.data) {
                    var data = result.data;
                    $scope.accessPointsCharts.options.legend.data[0] = TS.ts('column.download') + ' (' + data.unit + ')';
                    $scope.accessPointsCharts.options.legend.data[1] = TS.ts('column.upload') + ' (' + data.unit + ')';
                    $scope.accessPointsCharts.options.yAxis[0].name = data.unit;
                    if ($scope.NTPStatus1 == 1) {
                        $scope.accessPointsCharts.options.xAxis[0].data = data.timeData;
                    } else {
                        $scope.accessPointsCharts.options.xAxis[0].data = noNTPTimeData;
                    }
                    $scope.accessPointsCharts.options.series[0].data = data.rxData;
                    $scope.accessPointsCharts.options.series[0].name = TS.ts('column.download') + ' (' + data.unit + ')';
                    $scope.accessPointsCharts.options.series[1].data = data.txData;
                    $scope.accessPointsCharts.options.series[1].name = TS.ts('column.upload') + ' (' + data.unit + ')';
                    $scope.accessPointsCharts.options.needInit = true;
                    var upload = 0;
                    var download = 0;
                    for (var i = 0; i < data.rxData.length; i++) {
                        upload += parseFloat(data.txData[i]);
                        download += parseFloat(data.rxData[i]);
                    }
                    $scope.total.upload = upload.toFixed(2);
                    $scope.total.download = download.toFixed(2);
                    $scope.total.unit = data.unit;
                }
                $scope.aplistCharts.hideLoading();

            });
        };

        /*
         * 根据 site network 搜索表格数据
         */
        $scope.searchAP = function (isSave, isRefresh) {
            getUDInfo(isRefresh);
            var site = $scope.usageSelect.site;
            var network = $scope.usageSelect.network;
            if (isSave) {
                $rootScope.customAction.site = site._id;
                $rootScope.customAction.network = network.agentUUID ? network.agentUUID : 'ALL';
            }
            getAPInfo(site, network);
        };

        $scope.search = function () {
            $scope.searchAP();
        };

        $scope.applySupplier = function (row) {
            var param = {
                networkId: row.networkId,
                devMac: row.mac,
                supplierId: row.supplier._id
            };
            DeviceDetailService.resetSupplier(param, function (result) {

            });
        };

        function getSupplier(supplierId) {
            if ($scope.suppliers) {
                for (var i = 0; i < $scope.suppliers.length; i++) {
                    if ($scope.suppliers[i]._id == supplierId) {
                        return $scope.suppliers[i];
                    }
                }
            }
            return null;
        }


        $scope.openOfflineList = function () {
            var site = $scope.usageSelect.site;
            var network = $scope.usageSelect.network;
            if (!site && !network) return;
            var curPage = 1;
            var pageSize = $scope.accessPointsOptions.totalItems;
            var rule = {siteId: site._id, networkId: network._id, status: 'offline'};
            if ($scope.searchData.value && $scope.searchData.value != "") {
                var temp = $scope.searchData.value;
                if ($scope.searchData.value == 'n/a' && $scope.unsupportTypes.indexOf($scope.searchData.type) != -1) {
                    temp = -1;
                    rule[$scope.searchData.type] = temp;
                }
                else {
                    if ($scope.percentTypes.indexOf($scope.searchData.type) != -1) {
                        var temp = $scope.searchData.value;
                        if ($scope.searchData.value.lastIndexOf('%') != -1) {
                            temp = temp.replace(/%/g, "");
                        }
                        rule[$scope.searchData.type] = temp;
                    }
                    else {
                        rule[$scope.searchData.type] = temp;
                    }
                }

            }

            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: 'offlineList.html',
                // windowClass: '',
                size: 'w900',
                resolve: {
                    rule: function () {
                        return rule;
                    }
                },
                controller: function ($scope, $uibModalInstance, DashboardService, CustomService, rule) {
                    /*  setHeight('set-height', [], 48);
                      $timeout(function () {
                          setGridHeight('offlineGrid', true);
                      }, 100);*/
                    $scope.returnNoOfOffline = function (r) {
                        var index = r.$$hashKey;
                        for (var i = 0; i < $scope.offlineOptions.data.length; i++) {
                            if ($scope.offlineOptions.data[i].$$hashKey == index) {
                                return i + 1;
                            }
                        }
                        ;
                    }
                    $scope.offlineOptions = {
                        isLoading: true,
                        enableSorting: true,
                        columnDefs: [
                            {
                                field: 'index', enableHiding: false,
                                minWidth: "60",
                                maxWidth: "60",
                                displayName: TS.ts('column.no'),
                                cellTemplate: "<div class='ui-grid-cell-contents'>{{grid.appScope.returnNoOfOffline(row.entity)}}</div>"
                            },
                            {
                                field: 'status', minWidth: "80", maxWidth: "80", displayName: TS.ts('column.status'),
                                cellTemplate: '<a style="padding:2px;" ng-class="row.entity.status">' +
                                    '<md-icon md-svg-icon="status:online_status"  title="{{\'common.\'+row.entity.status|translate}}"></md-icon></a>'
                            },
                            {
                                field: 'ip',
                                minWidth: "130",
                                displayName: TS.ts('column.ip'),
                                sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                                    var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                                    return utils.sortByIP(nulls, a, b);

                                }
                            },
                            {
                                field: 'localipv6',
                                minWidth: "160",
                                width: 180,
                                displayName: TS.ts('column.localipv6'),
                                visible: false
                            },
                            {field: 'lanIP', minWidth: "120", displayName: TS.ts('column.lanIP'), visible: false},
                            {field: 'mac', minWidth: "120", displayName: TS.ts('column.mac')},
                            {field: 'moduleType', minWidth: "106", displayName: TS.ts('column.moduleType')},
                            {field: 'firmware', minWidth: "106", displayName: TS.ts('column.firmware'), visible: false},
                            {
                                field: 'server.name',
                                minWidth: "120",
                                displayName: TS.ts('column.name'),
                                visible: false
                            },
                            {
                                field: 'server.location',
                                minWidth: "120",
                                displayName: TS.ts('column.location'),
                                visible: false
                            },
                            {field: 'network', minWidth: "120", displayName: TS.ts('column.network')},
                            {field: 'client', displayName: TS.ts('column.client'), minWidth: "80", type: 'number'},
                            {
                                field: 'server.channel24Ghz',
                                minWidth: "128",
                                type: 'number',
                                displayName: TS.ts('column.channel24Ghz')
                            },
                            {
                                field: 'server.channel5Ghz',
                                minWidth: "128",
                                type: 'number',
                                displayName: TS.ts('column.channel5Ghz')
                            },
                            {
                                field: 'server.channel5Ghz2', visible: false,
                                minWidth: "128",
                                type: 'number',
                                displayName: TS.ts('column.channel5Ghz2')
                            },
                            {
                                field: 'server.power24Ghz', visible: false,
                                minWidth: "128",
                                displayName: TS.ts('column.power24Ghz')
                            },
                            {
                                field: 'server.power5Ghz', visible: false,
                                minWidth: "128",
                                displayName: TS.ts('column.power5Ghz')
                            },
                            {
                                field: 'server.power5Ghz2', visible: false,
                                minWidth: "128",
                                displayName: TS.ts('column.power5Ghz2')
                            },
                            {
                                field: 'apToStaTxDataBytes',
                                visible: false,
                                minWidth: "120",
                                type: 'number',
                                displayName: TS.ts('column.download'),
                                cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.apToStaTxDataBytes|bytesFilter}}</div>'
                            },
                            {
                                field: 'staToApRxDataBytes',
                                visible: false,
                                minWidth: "120",
                                displayName: TS.ts('column.upload'),
                                type: 'number',
                                cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.staToApRxDataBytes|bytesFilter}}</div>'
                            },
                            {
                                field: 'totalUsage',
                                visible: false,
                                minWidth: "120",
                                displayName: TS.ts('column.totalUsage'),
                                type: 'number',
                                cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.totalUsage|bytesFilter}}</div>'
                            },
                            {
                                field: 'percentUsage',
                                visible: false,
                                minWidth: "140",
                                displayName: TS.ts('column.percentUsage'),
                                type: 'number',
                                cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.percentUsage|number:2}}%</div>'
                            },
                            {
                                field: 'cpuUsage',
                                visible: false,
                                minWidth: "120",
                                displayName: TS.ts('column.cpuUsage'),
                                type: 'number',
                                cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.cpuUsage}}%</div>'
                            },
                            {
                                field: 'memoryUsage',
                                visible: false,
                                minWidth: "140",
                                displayName: TS.ts('column.memoryUsage'),
                                type: 'number',
                                cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.memoryUsage}}%</div>'
                            },
                            {
                                field: 'lastUpdateTime',
                                minWidth: "150",
                                displayName: TS.ts('column.lastUpdateTime'),
                                cellFilter: 'ISOTimeFilter'
                            },
                            {
                                field: 'upTime',
                                type: 'number',
                                visible: false,
                                minWidth: "120",
                                displayName: TS.ts('column.sysUpTime'),
                                cellFilter: 'uptimeFilter'
                            },
                            {
                                field: 'schoolId',
                                minWidth: "120",
                                displayName: TS.ts('column.schoolId')
                            }, {
                                field: 'supplier',
                                minWidth: "120",
                                displayName: TS.ts('supplier.supplier'),
                                cellClass: 'ofv',
                                cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.supplier|supplierFilter}}</div>'
                            }


                        ],
                        data: [],
                        useExternalPagination: true,
                        onRegisterApi: function (gridApi) {
                            $scope.gridApi = gridApi;

                            gridApi.core.on.columnVisibilityChanged($scope, function (column) {
                                // 记录列表隐藏列
                                // Todo 存储用户习惯
                                if (column.visible) {
                                    if ($rootScope.customAction.gridVisible)
                                        $rootScope.customAction.gridVisible.accessPointsOptions.push(column.field)
                                } else {
                                    $rootScope.customAction.gridVisible.accessPointsOptions = _.without($rootScope.customAction.gridVisible.accessPointsOptions, column.field);
                                }
                            });
                        }
                    }
                    if ($rootScope.customAction) {
                        if ($rootScope.customAction.gridVisible && $rootScope.customAction.gridVisible.accessPointsOptions) {
                            for (var i = 0; i < $scope.offlineOptions.columnDefs.length; i++) {
                                if ($rootScope.customAction.gridVisible.accessPointsOptions.indexOf($scope.offlineOptions.columnDefs[i].field) == -1) {
                                    $scope.offlineOptions.columnDefs[i].visible = false;
                                } else {
                                    $scope.offlineOptions.columnDefs[i].visible = true;
                                }
                            }
                        }

                    }
                    DashboardService.getAPInfo(rule, {start: curPage - 1, count: pageSize}, function (result) {
                        $scope.offlineOptions.isLoading = false;
                        if (result.success) {
                            for (var i = 0; i < result.data.length; i++) {
                                var item = result.data[i];
                                item.supplier = getSupplier(item.supplierId);
                            }
                            $scope.offlineOptions.data = fwVersionTransInAPList(result.data);
                            $scope.totalOffline = result.total;
                        }
                    });

                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function (data) {

            }, function () {

            });
        }

    });

});