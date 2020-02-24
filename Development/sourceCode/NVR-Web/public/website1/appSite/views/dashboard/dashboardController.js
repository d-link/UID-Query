/* **************************************************************
* Copyright (C)2010-2020 Dlink Corp.
* 
* Author      : WangHui
* Mail        : Hui.Wang@cn.dlink.com
* Create Date : 2018-05-21
* Modify Date : 
* Summary     : app dashboard function controller
* 
*************************************************************/
define(["controllerModule", "canvasContainer"], function (controllers) {

    controllers.controller('dashboardController', function ($rootScope, statsService, $scope, DashboardService, NetworkService, CustomService, OrganizationService, InventoryService, $state, Current, Auth, TS, utils) {
        utils.getNodeTime(function () {
            //取ntp状态
            $scope.NTPStatus1 = 0;
            OrganizationService.getSystemStatus(function (result) {
                if (result.success) {
                    $scope.NTPStatus1 = result.data.ntpStatus;
                }

                //$scope.NTPStatus1 = 1;//測試
                //获取LasthourDiagram数据
                $scope.searchLasthourDiagram = searchLasthourDiagram;
                //dashboard页面初始化
                $scope.initPage = initPage;
                //获取summarys数据
                $scope.getSummarysData = getSummarysData;
                //获取site、network下拉框数据
                $scope.getSiteAndNetwork = getSiteAndNetwork;
                //获取hotTime模块数据
                $scope.searchHotTimeDiagram = searchHotTimeDiagram;
                //获取hourly模块数据
                $scope.searchHourlyDiagram = searchHourlyDiagram;
                //获取Daily模块数据
                $scope.searchDailyDiagram = searchDailyDiagram;
                //清除Daily搜索参数
                $scope.clearDailyParams = clearDailyParams;
                //打开LastHour弹出框
                $scope.openLastHourDiagrams = openLastHourDiagrams;
                //LastHour选择site
                $scope.changeLHSite = changeLHSite;
                //LH初始化已选择条件
                $scope.cleanLasthourDiagram = cleanLasthourDiagram;
                //打开hotTimeMenu
                $scope.openHotTimeMenu = openHotTimeMenu;
                //清空hot time 已经选择好的值
                $scope.cleanHotTimeDiagram = cleanHotTimeDiagram;
                //防止移动端打开系统自带的输入框
                $scope.preventSystemKeyboard = preventSystemKeyboard;
                //日期转换
                $scope.dateConversion = dateConversion;
                //hotTime threshold参数
                //$scope.getThreshold          = getThreshold;
                //hot ap module
                $scope.searchHotApDiagram = searchHotApDiagram;
                //打开hotap 下拉菜单框
                $scope.openHotApMenu = openHotApMenu;
                //绘制hot ap map
                $scope.createHotApMap = createHotApMap;
                //将hot ap map绘制到画布上
                $scope.showMap = showMap;
                //获取hot ap state data
                $scope.getHotApStatsData = getHotApStatsData;
                //根据map name 选择对应的地图
                $scope.searchHotApMapByName = searchHotApMapByName;
                //hot ap clear
                $scope.ckearHotApParams = ckearHotApParams;
                //获取hot ap net list
                $scope.getNetWorksList = getNetWorksList;
                //hot hourly module
                //打开hothourlyMenu菜单
                $scope.openHotHourlyMenu = openHotHourlyMenu;
                //复原选中的条件
                $scope.clearHourlyParams = clearHourlyParams;
                //强制隐藏Echarts tooltip
                $scope.hideTooltip = hideTooltip;
                //获取当前点击的 Echarts，用于处理tooltip内容过长导致显示置位有问题的处理
                $scope.chartTooltipClick = chartTooltipClick;               
                
                // $scope.webpageVisibleW = document.documentElement.clientWidth || document.body.clientWidth;
                // $scope.webpageVisibleH = document.documentElement.clientHeight || document.body.clientHeight;

                function FormatDate(date) {
                    return date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
                }

                //刷新页面数据
                setTimeout(function () {
                    //获取刷新按钮
                    var refreshBtn = $('#dsRefreshData')[0];
                    //触发事件
                    $(refreshBtn).click(function () {
                        utils.getNodeTime(function () {
                            //根据筛选条件刷新数据
                            $scope.searchLasthourDiagram();
                            $scope.getSummarysData();
                            $scope.searchHotTimeDiagram();
                            $scope.searchHourlyDiagram();
                            $scope.searchDailyDiagram();
                            $scope.searchHotApDiagram();
                            closeTooltip();
                        });
                    });
                }, 0);

                $scope.set = {};
                $scope.isOpenCTranslate = false;
                $scope.showSetTraffic = false;
                $scope.showClientSet = function () {
                    $scope.hideTooltip();
                    //设置input 为readonly ，防止移动端打开系统自带的输入框
                    $scope.preventSystemKeyboard();
                    $scope.isOpenCTranslate = true;
                    $scope.set.uniqueClientsThreshold = $scope.hotTime.uniqueClients.threshold;

                    //赋值
                    // $scope.set.trafficUsageThreshold = $scope.hotTime.trafficUsage.threshold;
                    // $scope.set.trafficUsageThresholdUnit = {unit:$scope.hotTime.trafficUsage.thresholdUnit};
                };
                //阀值设置
                $scope.showTrafficSet = function () {
                    $scope.hideTooltip();
                    //设置input 为readonly ，防止移动端打开系统自带的输入框
                    $scope.preventSystemKeyboard();
                    $scope.isOpenTTranslate = true;
                    $scope.set.trafficUsageThreshold = $scope.hotTime.trafficUsage.threshold;
                    $scope.set.trafficUsageThresholdUnit = {unit: $scope.hotTime.trafficUsage.thresholdUnit};

                    //赋值
                    // $scope.set.uniqueClientsThreshold = $scope.hotTime.uniqueClients.threshold;
                }
                $scope.cancelClientSet = function () {
                    $scope.isOpenCTranslate = false;
                }
                $scope.cancelTrafficSet = function () {
                    $scope.isOpenTTranslate = false;
                }
                $scope.saveClientSet = function () {
                    if ($scope.set.uniqueClientsThreshold == '' || !$scope.set.uniqueClientsThreshold) {
                        return false;
                    }
                    ;
                    //先关闭再查询
                    $scope.isOpenCTranslate = false;
                    $scope.hotTime.uniqueClients.threshold = $scope.set.uniqueClientsThreshold;

                    OrganizationService.updateThreshold({
                        uniqueClientsThreshold: $scope.set.uniqueClientsThreshold,
                        trafficUsageThreshold: $scope.set.trafficUsageThreshold,
                        trafficUsageThresholdUnit: $scope.set.trafficUsageThresholdUnit ? $scope.set.trafficUsageThresholdUnit.unit : null,
                    }, function () {
                        getDefaultTrafficUsageThreshold(function () {
                            $scope.searchHotTimeDiagram();
                        });

                    });
                    // $scope.showSetClients = false;
                }
                $scope.saveTrafficSet = function () {
                    if ($scope.set.trafficUsageThreshold == '' || !$scope.set.trafficUsageThreshold) {
                        return false;
                    }
                    ;
                    $scope.isOpenTTranslate = false;

                    $scope.hotTime.trafficUsage.threshold = $scope.set.trafficUsageThreshold;
                    $scope.hotTime.trafficUsage.thresholdUnit = $scope.set.trafficUsageThresholdUnit.unit;

                    OrganizationService.updateThreshold({
                        uniqueClientsThreshold: $scope.set.uniqueClientsThreshold,
                        trafficUsageThreshold: $scope.set.trafficUsageThreshold,
                        trafficUsageThresholdUnit: $scope.set.trafficUsageThresholdUnit.unit,
                    }, function () {
                        getDefaultUniqueClientsThreshold(function () {
                            $scope.searchHotTimeDiagram();
                        });
                    });

                }
                $scope.showTrafficSetMol = function () {
                    console.log('123');
                }

                $scope.unitTypes = [{unit: 'KB'}, {unit: 'MB'}, {unit: 'GB'}, {unit: 'TB'}, {unit: 'PB'}];

                // $scope.unitTypes = ['KB', 'MB', 'GB', 'TB', 'PB'];

                //首页指标概览页面跳转
                $scope.gotoOtherPage = function (moudleId, parentId) {
                    //设置跳转后的标题
                    $rootScope.navTitle = moudleId;
                    //获取当前用户
                    $scope.appUser = Current.user();
                    //获取用户ID
                    var userId = $scope.appUser._id;
                    //访问页面
                    var page = moudleId;
                    //定制传入参数
                    var params = {
                        page: page,
                        userId: userId
                    };
                    //存储访问页面信息
                    Auth.updateLastPage(params, function (res) {
                        if (res.success) {
                            //查看更新后的用户信息
                            Auth.getUserInfo({_id: userId}, function (result) {
                                if (result.success) {
                                    Current.setUser(result.data);
                                    $scope.user = Current.user();
                                    $scope.org = Current.org();
                                }
                            });
                        }
                        ;
                    });
                    //跳转页面
                    $state.go('user.org.subdetail', {moudleId: moudleId, parentId: parentId});
                };


                $scope.initPage();

                $(document).on('mousedown', function (e) {
                    var dropdownMenu = $(e.target).parents('.dropdown-menu-right')[0];
                    if (!dropdownMenu || dropdownMenu.getAttribute('class') !== 'dropdown-menu-right ng-scope dropdown-menu') {
                        $scope.isOpenLHMenu = false;
                        $scope.isOpenHotTimeMenu = false;
                        $scope.isOpenHotHourlyMenu = false;
                        $scope.isOpenHotDailyMenu = false;
                        $scope.isOpenHotAPMenu = false;
                    }
                });

                //阻止弹出框事件冒泡
                $scope.stop = function () {
                    event.stopPropagation();
                };


                function hideTooltip() {
                    var eContainner = document.getElementsByClassName('col-sm-6');
                    //将类数组集合转化为数组
                    eContainner = Array.prototype.slice.apply(eContainner);
                    eContainner.forEach(function (eChart, index) {
                        if (typeof(eChart.children[1]) !== 'undefined') {
                            if (eChart.children[1].children[1]) eChart.children[1].children[1].style.display = 'none';
                        }
                    });
                }


                function dateConversion(date) {
                    return date.getFullYear() + '.' + (date.getMonth() + 1) + '.' + date.getDate();
                }

                function preventSystemKeyboard() {
                    //设置input 为readonly ，防止移动端打开系统自带的输入框
                    var uiSelect = Array.prototype.slice.call(document.getElementsByClassName('uiSelect'));
                    uiSelect.forEach(function (select, index) {
                        var input = select.children[2];
                        input.setAttribute('readonly', 'true');
                    });
                }

                function clearDailyParams() {
                    //将输入参数复原
                    $scope.daily.site = '';
                    $scope.daily.network = '';
                    $scope.daily.startDay = '';
                    $scope.daily.endDay = '';
                }


                function openHotTimeMenu() {
                    $scope.hideTooltip();
                    //设置input 为readonly ，防止移动端打开系统自带的输入框
                    $scope.preventSystemKeyboard();
                    closeTooltip();
                }

                function cleanHotTimeDiagram() {
                    $scope.hotTime.site = '';
                    $scope.hotTime.network = '';
                }

                function changeLHSite(index, item) {
                    //当选择site 时，设置network第一项选中
                    $scope.LHSelect.network = $scope.LHSelect.site.networks[0];

                    $scope.LHSelect.site = item;
                }

                //做日期减一天的操作
                $scope.subtractionTimeDay = function () {
                    for (var i = 0; i < $scope.LHSelect.networkdays.length; i++) {
                        if ($scope.LHSelect.networkday == $scope.LHSelect.networkdays[i]) {
                            if (i == $scope.LHSelect.networkdays.length - 1) {
                                $scope.LHSelect.networkday = $scope.LHSelect.networkdays[0];
                            } else {
                                $scope.LHSelect.networkday = $scope.LHSelect.networkdays[i + 1];
                            }
                            break;
                        }
                    }
                };
                //做日期加一天的操作
                $scope.addTimeDay = function () {
                    for (var i = 0; i < $scope.LHSelect.networkdays.length; i++) {
                        if ($scope.LHSelect.networkday == $scope.LHSelect.networkdays[i]) {
                            if (i == 0) {
                                $scope.LHSelect.networkday = $scope.LHSelect.networkdays[$scope.LHSelect.networkdays.length - 1];
                            } else {
                                $scope.LHSelect.networkday = $scope.LHSelect.networkdays[i - 1];
                            }
                            break;
                        }
                    }
                };

                /*
                * 选择site时，设置network选择第一项
                */
                $scope.changeAPSite = function () {
                    $scope.hotTime.network = $scope.hotTime.site.networks[0];
                };
                $scope.changeHourlySite = function () {
                    $scope.hourly.network = $scope.hourly.site.networks[0];
                };
                $scope.changeDailySite = function () {
                    $scope.daily.network = $scope.daily.site.networks[0];
                };


                function getSummarysData() {
                    DashboardService.getStateSummary(function (result) {
                        if (result.success) {
                            $scope.summarys[0].value = result.data.siteCount;
                            $scope.summarys[1].value = result.data.networkCount;
                            $scope.summarys[2].value = {online: result.data.apOnline, total: result.data.apCount};
                            $scope.summarys[3].value = result.data.clientCount;
                        }
                    });
                };

                function initPage() {
                    //初始化变量、参数
                    //顶部模块
                    $scope.summarys = [
                        {name: 'site', value: 0, class: 'violet', moudleId: 'network', parentId: 'configuration'},
                        {name: 'networks', value: 0, class: 'orange', moudleId: 'network', parentId: 'configuration'},
                        {name: 'access', value: 0, class: 'gray', moudleId: 'accessPoint', parentId: 'monitor'},
                        {name: 'clients', value: 0, class: 'blue', moudleId: 'wirelessClient', parentId: 'monitor'}
                    ];

                    //初始化 LHSelect
                    $scope.LHSelect = {};
                    $scope.LHSelect.networkdays = [];
                                                            
                    var moment = new Date(NCTime);
                    // $scope.hotTimeUniqueClientsvalue = "initPage NCTime:"+NCTime +"   initPage moment:"+moment;
                    let flag = new Date('1970/1/1');
                    var offset = NCTimeOffset;
                   
                    for (var i = 0; i < 7; i++) {
                        var date = new Date(moment);
                        date.setDate(date.getDate() - i);
                        let dateSeconds = ((date.getTime() - flag.getTime()) / 1000);
                        //let dateSeconds = ((date.getTime()) / 1000);
                        $scope.LHSelect.networkdays.push({
                            value: parseInt(dateSeconds / 86400) * 86400,
                            // str: date.toLocaleDateString()
                            str: FormatDate(date)
                        });
                    }
                    $scope.LHSelect.networkday = $scope.LHSelect.networkdays[0];
                    // $scope.hotTimeUniqueClientsData = "networkdays:"+ JSON.stringify($scope.LHSelect.networkdays);
                    
                    var temp = moment.getHours() * 60 * 60 + (parseInt(moment.getMinutes() / 15) - 1) * 15 * 60;
                    if (temp < 0) {
                        temp = temp + 86400;
                        $scope.LHSelect.networkday = $scope.LHSelect.networkdays[1];
                    }
                    else if (temp >= 86400) {
                        temp = temp - 86400;
                    }
                    $scope.LHSelect.networkHours = [];
                    $scope.LHSelect.networkHour = {};
                    var index = 0;
                    for (var i = 0; i < 24; i++) {
                        for (var j = 0; j < 60; j += 15) {
                            // var hourvalue=i*60*60 + j*60 + offset*60;//i * 60 * 60 + j * 60
                            var item = {
                                index: index++,
                                value: i * 60 * 60 + j * 60,
                                str: (i < 10 ? "0" + i : i) + ":" + (j < 10 ? "0" + j : j)
                            };
                            $scope.LHSelect.networkHours.push(item);
                            if (item.value == temp) {
                                $scope.LHSelect.networkHour = item;
                            }
                        }
                    }
                    // $scope.hotTimeUniqueClientsvalue = "networkHour:"+ JSON.stringify($scope.LHSelect.networkHour);

                    //初始化开始时间
                    var startDay = new Date(NCTime);
                    startDay.setDate(startDay.getDate() - 6);
                    var endDay = new Date(NCTime);
                    endDay.setDate(endDay.getDate());
                    //初始化hotTime
                    $scope.hotTime = {
                        period: "quarter",
                        export: "pdf",
                        uniqueClients: {probability: 25},
                        trafficUsage: {probability: 25},
                        startDay: startDay,
                        endDay: endDay
                    };

                    //初始化houtly
                    $scope.hourly = {
                        period: "quarter",
                        export: "pdf",
                        threshold: {
                            clients: 900,
                            traffic: 900
                        },
                        date: {}
                    };
                    $scope.hourly.days = [];

                    var moment = new Date(NCTime);
                    let hourly_flag = new Date('1970/1/1');
                    for (var i = 0; i < 7; i++) {
                        var date = new Date(moment);
                        date.setDate(date.getDate() - i);
                        let dateSeconds = ((date.getTime() - hourly_flag.getTime()) / 1000);
                        //let dateSeconds = ((date.getTime()) / 1000);
                        $scope.hourly.days.push({
                            // str: date.toLocaleDateString(),
                            str: FormatDate(date),
                            value: parseInt(dateSeconds / 86400) * 86400
                        });
                    }
                    $scope.hourly.date = $scope.hourly.days[0];
                    //初始化daily
                    $scope.daily = {
                        trafficUsage: true,
                        uniqueClients: true,
                        period: "quarter",
                        export: "pdf",
                        startDay: $scope.dateConversion(startDay),
                        endDay: $scope.dateConversion(new Date(NCTime)),
                        threshold: {
                            clients: 900,
                            traffic: 900
                        }
                    };
                    //初始化 LHSelect
                    $scope.dailySelect = {};
                    $scope.dailySelect.startDays = [];
                    $scope.dailySelect.endDays = [];
                    var daily_moment = new Date(NCTime);
                    //let daily_flag = new Date('1970/1/1');
                    for (var i = 0; i < 11; i++) {
                        var daily_date = new Date(daily_moment);
                        daily_date.setDate(daily_date.getDate() - i);
                        // let daily_dateSeconds = ((daily_date.getTime() - daily_flag.getTime()) / 1000);
                        let daily_dateSeconds = ((daily_date.getTime()) / 1000);
                        $scope.dailySelect.startDays.push({
                            value: parseInt(daily_dateSeconds / 86400) * 86400,
                            // str: daily_date.toLocaleDateString()
                            str: FormatDate(daily_date)
                        });
                        $scope.dailySelect.endDays.push({
                            value: parseInt(daily_dateSeconds / 86400) * 86400,
                            // str: daily_date.toLocaleDateString()
                            str: FormatDate(daily_date)
                        });
                    }
                    $scope.daily.startDay = $scope.dailySelect.startDays[$scope.dailySelect.startDays.length - 1];
                    $scope.daily.endDay = $scope.dailySelect.endDays[1];
                    //---------hot ap
                    //初始化 ApSelect
                    $scope.ApSelect = {};
                    $scope.ApSelect.networkdays = [];
                    var ApMoment = new Date(NCTime);
                    let ApFlag = new Date('1970/1/1');
                    for (var i = 0; i < 7; i++) {
                        var date = new Date(ApMoment);
                        date.setDate(date.getDate() - i);
                        let dateSeconds = ((date.getTime() - ApFlag.getTime()) / 1000);
                        $scope.ApSelect.networkdays.push({
                            value: parseInt(dateSeconds / 86400) * 86400,
                            // str: date.toLocaleDateString()
                            str: FormatDate(date)
                        });
                    }
                    $scope.ApSelect.networkday = $scope.ApSelect.networkdays[0];
                    //var ApSeconds = ApMoment.getHours() * 60 * 60 + ApMoment.getMinutes() * 60 + ApMoment.getSeconds();
                    //var ApSeconds = ApMoment.getUTCHours() * 60 * 60 + ApMoment.getUTCMinutes() * 60 + ApMoment.getUTCSeconds();
                    var temp = ApMoment.getHours() * 60 * 60 + (parseInt(ApMoment.getMinutes() / 15) - 1) * 15 * 60;
                    if (temp < 0) {
                        temp = temp + 86400;
                        $scope.ApSelect.networkday = $scope.ApSelect.networkdays[1];
                    }
                    else if (temp >= 86400) {
                        temp = temp - 86400;
                    }
                    $scope.ApSelect.networkHours = [];
                    var index = 0;
                    for (var i = 0; i < 24; i++) {
                        for (var j = 0; j < 60; j += 15) {
                            var hourvalue = i * 60 * 60 + j * 60;//i * 60 * 60 + j * 60
                            var item = {
                                index: index++,
                                value: hourvalue,
                                str: (i < 10 ? "0" + i : i) + ":" + (j < 10 ? "0" + j : j)
                            };
                            $scope.ApSelect.networkHours.push(item);
                            // if (ApSeconds - item.value < 1800 && seconds - item.value > 900) {
                            //     $scope.ApSelect.networkHour = item;
                            // }
                            if (item.value == temp) {
                                $scope.ApSelect.networkHour = item;
                            }
                        }
                    }
                    
                    //-----------hot ap

                    //获取屏幕的高度和宽度，用于判断是否为平板电脑
                    var windowWidth = window.innerWidth;
                    var windowHeight = window.innerHeight;


                    var defaultPage = 70;
                    //默认图标高度
                    var defaultHeight = 260;
                    //图标文字大小
                    $scope.chartFontSize = 12;
                    //图表左侧距离
                    $scope.chartleft = 0;
                    $scope.chartTop = 0;

                    if (windowWidth >= 1024 && windowHeight >= 768) {//平板电脑横屏模式
                        defaultHeight = 470;
                        defaultPage = 110;
                        $scope.chartFontSize = 20;
                        $scope.chartleft = 25;
                        $scope.chartTop = 20;
                    }
                    ;
                    if (windowWidth >= 768) {
                        defaultHeight = 470;
                        defaultPage = 110;
                        $scope.chartFontSize = 17;
                        $scope.chartleft = 20;
                        $scope.chartTop = 20;
                    }
                    ;
                    if (windowWidth <= 320) {
                        defaultHeight = 270;
                        defaultPage = 90;
                        $scope.chartFontSize = 10;
                        $scope.chartleft = 0;
                        $scope.chartTop = 0;
                    }
                    //获控制内容区域高度并调整
                    setHeight('set-height', [], defaultPage);
                    window.onresize = function () {
                        setHeight('set-height', [], defaultPage);
                    };

                    //Echarts图表自适应调整
                    $scope.Chartsize;
                    var eContainner = document.getElementsByClassName('col-sm-6');
                    //将类数组集合转化为数组
                    eContainner = Array.prototype.slice.apply(eContainner);
                    //遍历echarts容器
                    eContainner.forEach(function (containner, index) {
                        $scope.Chartsize = {
                            width: containner.offsetWidth + 30,
                            height: defaultHeight
                        }
                    });


                    //初始化加载函数
                    //加载顶部指标概览数据
                    $scope.getSummarysData();
                    //获取site、network,并加载LasthourDiagram四个E charts图标数据
                    $scope.getSiteAndNetwork();
                    //获取hot ap map
                    $scope.searchHotApDiagram();
                };


                function openLastHourDiagrams() {
                    $scope.hideTooltip();
                    //设置不打开系统输入框
                    $scope.preventSystemKeyboard();
                    closeTooltip();
                };

                function closeTooltip() {
                    $('#lastHourNumberCharts').each(function () {
                        $($(this).children('div')[1]).css('display', 'none');
                    });
                    $('#lastHourTrafficCharts').each(function () {
                        $($(this).children('div')[1]).css('display', 'none');
                    });
                    $('#lastHourTrafficDownUpCharts').each(function () {
                        $($(this).children('div')[1]).css('display', 'none');
                    });
                    $('#lastHourTrafficSsidCharts').each(function () {
                        $($(this).children('div')[1]).css('display', 'none');
                    });
                    $('#MostClientsHotTimeCharts').each(function () {
                        $($(this).children('div')[1]).css('display', 'none');
                    });
                    $('#MostTrafficUsageCharts').each(function () {
                        $($(this).children('div')[1]).css('display', 'none');
                    });
                    $('#HourlyUniqueCharts').each(function () {
                        $($(this).children('div')[1]).css('display', 'none');
                    });
                    $('#HourlyTrafficCharts').each(function () {
                        $($(this).children('div')[1]).css('display', 'none');
                    });
                    $('#DailyTrafficUsageCharts').each(function () {
                        $($(this).children('div')[1]).css('display', 'none');
                    });
                };

                function chartTooltipClick($event) {
                    // alert("chartTooltipClick:"+$event)
                    // if($('#lastHourTrafficSsidCharts')){
                    //     var ccc = $('#lastHourTrafficSsidCharts');
                    // }
                    var currentTarget = $event.currentTarget;
                    if (currentTarget.childNodes.length >= 2) {
                        var tooltipCon = currentTarget.childNodes[1];
                        var tooltipConStyle = tooltipCon.getAttribute('style');
                        var tooltipConStyle_left = tooltipCon.style.left;
                        if (tooltipConStyle_left) {
                            tooltipConStyle_left = tooltipConStyle_left.substr(0, tooltipConStyle_left.indexOf("px"));
                            tooltipConStyle_left = parseInt(tooltipConStyle_left);
                            if (tooltipConStyle_left <= 0) {
                                // tooltipCon.setAttribute("style","left:10px");//这样是设置整个"style" 的值
                                tooltipCon.style.setProperty('left', '15px');//('left', '10px', 'important'); 这样是设置"style"中left的值
                            }
                        }
                    }
                }

                function cleanLasthourDiagram() {
                    //清空已选值
                    $scope.LHSelect.site = '';
                    $scope.LHSelect.network = '';
                    $scope.LHSelect.networkday = '';
                    $scope.LHSelect.networkHour = '';
                };

                function getBinDate(date) {
                    date = new Date(date);
                    let flag = new Date('1970/1/1');
                    let dateSeconds = ((date.getTime() - flag.getTime()) / 1000);
                    //let dateSeconds = ((date.getTime()) / 1000);
                    return parseInt((dateSeconds + NCTimeOffset * 60) / 86400) * 86400;
                };

                function getDefaultUniqueClientsThreshold(callback) {
                    if (!$scope.hotTime.uniqueClients.threshold) {
                        statsService.getHotTimeUniqueClientsThreshold({
                            startDay: getBinDate($scope.hotTime.startDay),
                            endDay: getBinDate($scope.hotTime.endDay),
                            site: $scope.hotTime.site._id,
                            uuid: $scope.hotTime.network.agentUUID ? $scope.hotTime.network.agentUUID : $scope.hotTime.network._id,
                            probability: 0.25
                        }, function (result) {
                            if (result.success) {
                                $scope.hotTime.uniqueClients.threshold = result.data;
                            }
                            callback();
                        });
                    } else {
                        callback();
                    }
                }

                function getDefaultTrafficUsageThreshold(callback) {
                    if (!$scope.hotTime.trafficUsage.threshold) {
                        statsService.getHotTimeTrafficUsageThreshold({
                            startDay: getBinDate($scope.hotTime.startDay),
                            endDay: getBinDate($scope.hotTime.endDay),
                            site: $scope.hotTime.site._id,
                            uuid: $scope.hotTime.network.agentUUID ? $scope.hotTime.network.agentUUID : $scope.hotTime.network._id,
                            probability: 0.25
                        }, function (result) {
                            if (result.success) {
                                $scope.hotTime.trafficUsage.threshold = parseFloat(result.data);
                                $scope.hotTime.trafficUsage.thresholdUnit = result.unit;
                            }
                            callback();
                        });
                    } else {
                        callback();
                    }
                }

                function timezoneOffset(data) {
                    var offsetData = [];
                    var offset = NCTimeOffset;
                    var binStartTimestamp = data[0] - offset * 60;
                    if (binStartTimestamp < 0) {
                        offsetData[0] = binStartTimestamp + 86400;
                        offsetData[2] = data[2] - 86400;
                    }
                    else if (binStartTimestamp >= 86400) {
                        offsetData[0] = binStartTimestamp - 86400;
                        offsetData[2] = data[2] + 86400;
                    }
                    else {
                        offsetData[0] = binStartTimestamp;
                        offsetData[2] = data[2];
                    }
                    offsetData[1] = data[1];
                    return offsetData;
                }

                function searchHotTimeDiagram() {
                    if (!$scope.hotTime.site._id || (!$scope.hotTime.network.agentUUID && !$scope.hotTime.network._id)) {
                        return;
                    }

                    //loading
                    $('#MostClientsHotTimeChartsLoading').show();
                    $('#MostTrafficUsageChartsLoading').show();

                    var xAxisData = [];
                    for (var i = 0; i < 24; i++) {
                        for (var j = 0; j < 60; j += 15) {
                            // var str = (i < 10 ? "0" + i : i) + ":" + (j < 10 ? "0" + j : j);
                            xAxisData.push(i * 3600 + j * 60);
                        }
                    }
                    $scope.MostClientsHotTimeCharts.options.xAxis[0].data = xAxisData;
                    $scope.MostTrafficUsageCharts.options.xAxis[0].data = xAxisData;
                    $scope.hotTime.params = {
                        site: $scope.hotTime.site._id,
                        uuid: $scope.hotTime.network.agentUUID ? $scope.hotTime.network.agentUUID : $scope.hotTime.network._id,
                        thresholdClients: $scope.hotTime.uniqueClients.threshold,
                        thresholdTraffic: transThreshold($scope.hotTime.trafficUsage.threshold, $scope.hotTime.trafficUsage.thresholdUnit),
                        startDay: getBinDate($scope.hotTime.startDay),
                        endDay: getBinDate($scope.hotTime.endDay)
                    };
                    //日期格式化
                    Date.prototype.Format = function (fmt) {
                        var o = {
                            "M+": this.getMonth() + 1,                 //月份
                            "d+": this.getDate(),                    //日
                            "h+": this.getHours(),                   //小时
                            "m+": this.getMinutes(),                 //分
                            "s+": this.getSeconds(),                 //秒
                            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
                            "S": this.getMilliseconds()             //毫秒
                        };
                        if (/(y+)/.test(fmt)) {
                            fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
                        }
                        for (var k in o) {
                            if (new RegExp("(" + k + ")").test(fmt)) {
                                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                            }
                        }
                        return fmt;
                    };
                    //新增时间范围
                    $scope.dayRange = $scope.hotTime.startDay.Format("yyyy/MM/dd") + "~" + $scope.hotTime.endDay.Format("yyyy/MM/dd");

                    function transThreshold(threshold, unit) {
                        if (unit == 'KB') {
                            return threshold * Math.pow(1024, 1);
                        } else if (unit == 'MB') {
                            return threshold * Math.pow(1024, 2);
                        }
                        else if (unit == 'GB') {
                            return threshold * Math.pow(1024, 3);
                        }
                        else if (unit == 'TB') {
                            return threshold * Math.pow(1024, 4);
                        } else {
                            return threshold * Math.pow(1024, 5);
                        }
                    }

                    $scope.MostClientsHotTimeCharts.options.series = [];

                    var color = ["#172664", "#22b7db", "#e6185a", "#afcb20", "#f59d24", "#f25130", "#607896"];
                    statsService.getHotTimeUniqueClients($scope.hotTime.params, function (result) {
                        if (result.success) {
                            //$scope.MostClientsHotTimeCharts.options.title.text = TS.ts('report.hotTimeChartTitle1');

                            var count = result.data.length;
                            var dd = [];
                            var index = 0;
                            if (result.data.length > 0) {
                                var date = (timezoneOffset(result.data[0]))[2];
                                for (var i = 0; i < result.data.length; i++) {
                                    result.data[i] = timezoneOffset(result.data[i])
                                    if (result.data[i][2] == date) {
                                        dd.push(result.data[i]);
                                    } else {
                                        $scope.MostClientsHotTimeCharts.options.series.push({
                                            color: [color[index++]],
                                            symbolSize: 10,
                                            type: "scatter",
                                            data: angular.copy(dd)
                                        });
                                        date = result.data[i][2];
                                        dd = [];
                                        dd.push(result.data[i]);
                                    }
                                }
                                $scope.MostClientsHotTimeCharts.options.series.push({
                                    color: [color[index++]],
                                    symbolSize: 10,
                                    type: "scatter",
                                    data: angular.copy(dd)
                                });
                            }
                            $scope.hotTime.uniqueClients.probability = (count * 100 / (7 * 96)).toFixed(2);
                            $scope.MostClientsHotTimeCharts.options.needInit = true;
                        }
                        ;

                        $('#MostClientsHotTimeChartsLoading').hide();
                    });

                    $scope.MostTrafficUsageCharts.options.series = [];
                    statsService.getHotTimeTrafficUsage($scope.hotTime.params, function (result) {
                        if (result.success) {
                            //$scope.MostTrafficUsageCharts.options.title.text = TS.ts('report.hotTimeChartTitle2');

                            var data = result.data;
                            $scope.mtuc = data.unit;
                            //$scope.MostTrafficUsageCharts.options.yAxis[0].name = TS.ts('report.trafficUsage') + " (" + data.unit + ")";
                            var count = data.data.length;

                            var dd = [];
                            var index = 0;
                            if (data.data.length > 0) {
                                var date = (timezoneOffset(data.data[0]))[2];
                                for (var i = 0; i < data.data.length; i++) {
                                    data.data[i] = timezoneOffset(data.data[i]);
                                    if (data.data[i][2] == date) {
                                        dd.push(data.data[i]);
                                    } else {
                                        $scope.MostTrafficUsageCharts.options.series.push({
                                            color: [color[index++]],
                                            symbolSize: 10,
                                            type: "scatter",
                                            data: angular.copy(dd)
                                        });
                                        date = data.data[i][2];
                                        dd = [];
                                        dd.push(data.data[i]);
                                    }
                                }
                                $scope.MostTrafficUsageCharts.options.series.push({
                                    color: [color[index++]],
                                    symbolSize: 10,
                                    type: "scatter",
                                    data: angular.copy(dd)
                                });
                            }
                            $scope.hotTime.trafficUsage.probability = (count * 100 / (7 * 96)).toFixed(2);
                        }
                        $scope.MostTrafficUsageCharts.options.needInit = true;
                        $('#MostTrafficUsageChartsLoading').hide();
                    });

                    $scope.isOpenHotTimeMenu = false;
                };


                function getSiteAndNetwork() {
                    /*
                    * 下拉选框内容
                    */
                    $scope.optionSites = [];
                    // 获取site、network下拉框数据
                    DashboardService.getSiteAndNetwork(function (result) {
                        if (result.success) {
                            $scope.optionSites = result.data;
                            // 添加 all network
                            var allNetwork = [{name: 'common.allNetwork', _id: 'ALL'}];
                            for (var i = 0; i < $scope.optionSites.length; i++) {
                                allNetwork = allNetwork.concat($scope.optionSites[i].networks);
                                $scope.optionSites[i].networks.unshift({name: 'common.allNetwork', _id: 'ALL'});
                            }
                            ;
                            $scope.optionSites.unshift({siteName: 'common.allSite', networks: allNetwork, _id: 'ALL'});

                            //排序
                            $scope.optionSites.sort(function (a, b) {
                                if (a._id == "ALL") return -1;
                                if (b._id == "ALL") return 1;
                                if (a.siteName == b.siteName) return 0;
                                if (a.siteName > b.siteName) return 1;
                                if (a.siteName < b.siteName) return -1;
                                return 0;
                            });
                            for (var i = 0; i < $scope.optionSites.length; i++) {
                                $scope.optionSites[i].networks.sort(function (a, b) {
                                    if (a._id == "ALL") return -1;
                                    if (b._id == "ALL") return 1;
                                    if (a.name == b.name) return 0;
                                    if (a.name > b.name) return 1;
                                    if (a.name < b.name) return -1;
                                    return 0;
                                })
                            }
                            // select 赋值
                            //lastHourSelect

                            $scope.LHSelect.site = $scope.optionSites[0];
                            $scope.LHSelect.network = $scope.LHSelect.site.networks[0];
                            $scope.LESelect = {site: $scope.optionSites[0]};
                            $scope.LESelect.network = $scope.LESelect.site.networks[0];


                            $scope.hotTime.site = $scope.optionSites[0];
                            $scope.hotTime.network = $scope.hotTime.site.networks[0];

                            $scope.hourly.site = $scope.optionSites[0];
                            $scope.hourly.network = $scope.hourly.site.networks[0];

                            $scope.hotTime.site = $scope.optionSites[0];
                            $scope.hotTime.network = $scope.hotTime.site.networks[0];

                            $scope.daily.site = $scope.optionSites[0];
                            $scope.daily.network = $scope.daily.site.networks[0];


                            var param = {
                                page: "dashboard",
                                subPage: "overView"
                            };
                            CustomService.getUseCustom(param, function (result) {
                                if (result.success) {
                                    var data = result.data;
                                    param.customData = data;
                                    $rootScope.customParam = param;
                                    if (data) {
                                        // 根据用户习惯，初始化select选择
                                        for (var i = 0; i < $scope.optionSites.length; i++) {
                                            if (data.LHSelect) {
                                                if ($scope.optionSites[i]._id == data.LHSelect.site) {
                                                    for (var j = 0; j < $scope.optionSites[i].networks.length; j++) {
                                                        if ($scope.optionSites[i].networks[j]._id == data.LHSelect.network) {
                                                            $scope.LHSelect.site = $scope.optionSites[i];
                                                            $scope.LHSelect.network = $scope.optionSites[i].networks[j];
                                                        }
                                                    }
                                                }
                                            }

                                            if (data.LESelect) {
                                                if ($scope.optionSites[i]._id == data.LESelect.site) {
                                                    for (var j = 0; j < $scope.optionSites[i].networks.length; j++) {
                                                        if ($scope.optionSites[i].networks[j]._id == data.LESelect.network) {
                                                            $scope.LESelect.site = $scope.optionSites[i];
                                                            $scope.LESelect.network = $scope.optionSites[i].networks[j];
                                                        }
                                                    }
                                                }
                                            }

                                        }
                                    }
                                    ;
                                    if (data && data.gridVisible && data.gridVisible.lastEvents) {
                                        data.gridVisible.lastEvents.forEach(function (v) {
                                            for (var i = 0; i < $scope.lastEventsOptions.columnDefs.length; i++) {
                                                if ($scope.lastEventsOptions.columnDefs[i].field == v) {
                                                    $scope.lastEventsOptions.columnDefs[i].visible = false;
                                                }
                                            }
                                        });
                                    }
                                    ;

                                    //获取初始化界面参数,加载几个模块函数
                                    $scope.searchLasthourDiagram();
                                    $scope.searchHourlyDiagram();
                                    $scope.searchDailyDiagram();
                                    OrganizationService.listAllOrgs(function (orgs) {
                                        if (orgs && orgs.length > 0) {
                                            var org = orgs[0];
                                            if (org.threshold) {
                                                $scope.hotTime.uniqueClients.threshold = org.threshold.uniqueClientsThreshold;
                                                $scope.hotTime.trafficUsage.threshold = org.threshold.trafficUsageThreshold;
                                                $scope.hotTime.trafficUsage.thresholdUnit = org.threshold.trafficUsageThresholdUnit;
                                            }
                                        }
                                        getDefaultUniqueClientsThreshold(function () {
                                            getDefaultTrafficUsageThreshold(function () {
                                                $scope.searchHotTimeDiagram();
                                            })
                                        });
                                    });
                                }
                                ;
                            });

                        }
                        ;
                    });
                }

                /**
                 * 获取Last Hour Diagrams数据
                 */
                function searchLasthourDiagram() {
                    //测试用
                    // $scope.hotTimeUniqueClientsvalue = "networkHour:"+ JSON.stringify($scope.LHSelect.networkHour);
                    // $scope.hotTimeUniqueClientsData = "$scope.LHSelect:"+ JSON.stringify($scope.LHSelect);
                    //如果传入参数有一个为空，或者为undefined，则不进行查询
                    if (typeof $scope.LHSelect.networkHour.value == 'undefined'
                        || !$scope.LHSelect.networkday.value
                        || !$scope.LHSelect.site._id
                        || (!$scope.LHSelect.network.agentUUID && !$scope.LHSelect.network._id)) {
                        return;
                    };
                    //loading
                    $('#lastHourNumberChartsLoading').show();
                    $('#lastHourTrafficChartsLoading').show();
                    $('#lastHourTrafficDownUpChartsLoading').show();
                    $('#lastHourTrafficSsidChartsLoading').show();

                    //用户历史操作数据
                    if (!$rootScope.customParam) {
                        $rootScope.customParam = {customData: {}};
                    }
                    if (!$rootScope.customParam.customData) {
                        $rootScope.customParam.customData = {};
                    }
                    $rootScope.customParam.customData.LHSelect = {
                        "site": $scope.LHSelect.site._id,
                        "network": $scope.LHSelect.network._id
                    };
                    //时间参数设置
                    var moment = new Date(NCTime);
                    let flag = new Date('1970/1/1');
                    var todaySeconds = parseInt(((moment.getTime() - flag.getTime()) / 1000) / 86400) * 86400;
                    var seconds = moment.getHours() * 60 * 60 + moment.getMinutes() * 60 + moment.getSeconds();
                    //var seconds = moment.getUTCHours() * 60 * 60 + moment.getUTCMinutes() * 60 + moment.getUTCSeconds();
                    // offset = 0; //2019.5.26 传后台时间参数需要修改 UTC
                    var offset = NCTimeOffset;
                    if ($scope.NTPStatus1 == 1) {
                        var startDay = new Date(NCTime);
                        startDay.setDate(startDay.getDate() - 6);
                        var endDay = new Date(NCTime);
                        endDay.setDate(endDay.getDate());
                        //传入参数
                        var param = {
                            ntpStatus: $scope.NTPStatus1,
                            timestampArr: getTimestampArr($scope.LHSelect.networkHour.value, 8),
                            timestampMap: getTimestampMap($scope.LHSelect.networkday.value, $scope.LHSelect.networkHour.value, 5),
                            site: $scope.LHSelect.site._id,
                            uuid: $scope.LHSelect.network.agentUUID ? $scope.LHSelect.network.agentUUID : $scope.LHSelect.network._id,
                            startDay: getBinDate(startDay),
                            endDay: getBinDate(endDay)
                        };
                    }else{
                        var param = {
                            ntpStatus: $scope.NTPStatus1,
                            timestampMap: getTimestampMap($scope.LHSelect.networkday.value, $scope.LHSelect.networkHour.value, 5),
                            site: $scope.LHSelect.site._id,
                            uuid: $scope.LHSelect.network.agentUUID ? $scope.LHSelect.network.agentUUID : $scope.LHSelect.network._id,
                        };
                    }

                    //颜色
                    var pieColor = [
                        "#22b7db", "#02a1d1", "#028fba", "#037ca8", "#03668a",
                        "#025a7a", "#b3eefc", "#82e2fa", "#4fd6f7", "#2accf5"
                    ];
                    var areaColor = ["rgba(34,183,219,0.2)", "rgba(02,161,209,0.2)", "rgba(02,143,186,0.2)", "rgba(03,124,168,0.2)",
                        "rgba(03,102,138,0.2)", "rgba(02,90,122,0.2)", "rgba(179,238,252,0.2)", "rgba(130,226,250,0.2)", "rgba(79,214,247,0.2)", "rgba(42,204,245,0.2)"];

                    function getTimestampArr(timestamp, length) {
                        var result = [];
                        for (var i = -4; i < length - 4; i++) {
                            var temp = timestamp + 15 * 60 * i + offset * 60;
                            if (temp < 0) temp = temp + 86400;
                            else if (temp >= 86400) temp = temp - 86400;
                            result.push(temp);
                        }
                        return result;
                    };
                    
                    function getTimestampMap(binDate, timestamp, length) {
                        var result = [];
                        for (var i = -4; i < length - 4; i++) {
                            var temp = timestamp + 15 * 60 * i + offset * 60;
                            if ((binDate == todaySeconds && timestamp + 15 * 60 * i > seconds) || binDate > todaySeconds) {
                                continue;
                            }
                            if (temp < 0) {
                                temp = temp + 86400;
                                result.push({binDate: binDate - 86400, timestamp: temp});
                            }
                            else if (temp >= 86400) {
                                temp = temp - 86400;
                                result.push({binDate: binDate + 86400, timestamp: temp});
                            } else {
                                result.push({binDate: binDate, timestamp: temp});
                            }
                        }
                        return result;
                    };

                    // console.log(param);

                    //x轴data
                    var index = $scope.LHSelect.networkHour.index;
                    var fiveArrLabel = [];
                    var eightArrLabel = [];
                    if ($scope.NTPStatus1 == 1) {
                        for (var i = -4; i < 4; i++) {
                            var s = index + i;
                            if (s >= 96) s = s - 96;
                            else if (s < 0) s = s + 96;
                            if (i <= 0) {
                                fiveArrLabel.push($scope.LHSelect.networkHours[s].str);
                            }
                            eightArrLabel.push($scope.LHSelect.networkHours[s].str);
                        }
                        $scope.lastHourNumberCharts.options.xAxis[0].data = eightArrLabel;
                        $scope.lastHourTrafficCharts.options.xAxis[0].data = eightArrLabel;
                        // $scope.lastHourTrafficDownUpCharts.options.xAxis[0].data = fiveArrLabel;
                        // $scope.lastHourTrafficSsidCharts.options.xAxis[0].data = fiveArrLabel;
                        $scope.lastHourTrafficDownUpCharts.options.xAxis[0].data = eightArrLabel;
                        $scope.lastHourTrafficSsidCharts.options.xAxis[0].data = eightArrLabel;
                    } else {
                        for (var i = -5; i < 0; i++) {
                            var s = index + i;
                            if (s >= 96) s = s - 96;
                            else if (s < 0) s = s + 96;
                            if (i <= 0) {
                                fiveArrLabel.push($scope.LHSelect.networkHours[s].str);
                            }
                        }
                        fiveArrLabel[0] = TS.ts("dashboard.last60");
                        fiveArrLabel[1] = TS.ts("dashboard.last45");
                        fiveArrLabel[2] = TS.ts("dashboard.last30");
                        fiveArrLabel[3] = TS.ts("dashboard.last15");
                        fiveArrLabel[4] = TS.ts("dashboard.now");
                        $scope.lastHourNumberCharts.options.xAxis[0].data = fiveArrLabel;
                        $scope.lastHourTrafficCharts.options.xAxis[0].data = fiveArrLabel;
                        $scope.lastHourTrafficDownUpCharts.options.xAxis[0].data = fiveArrLabel;
                        $scope.lastHourTrafficSsidCharts.options.xAxis[0].data = fiveArrLabel;
                    }

                    statsService.getLastHourUniqueClients(param, function (result) {
                        if (result.success && result.data) {
                            $scope.lastHunit = (result.data.unit ? (" (" + result.data.unit + ")") : "");
                            //$scope.lastHourNumberCharts.options.title.text = TS.ts('dashboard.lastHourNumber') + (result.data.unit ? ( " (" + result.data.unit + ")") : "");
                            if ($scope.NTPStatus1 == 1) {
                                $scope.lastHourNumberCharts.options.legend.data = [TS.ts('report.average'), TS.ts('report.high'), TS.ts('report.lasthour')];
                            } else {
                                $scope.lastHourNumberCharts.options.legend.data = [];
                            }
                            $scope.lastHourNumberCharts.options.series[0].name = TS.ts('report.average');
                            $scope.lastHourNumberCharts.options.series[1].name = TS.ts('report.high');
                            $scope.lastHourNumberCharts.options.series[2].name = TS.ts('report.lasthour');
                            $scope.lastHourNumberCharts.options.series[0].data = result.data.average;
                            $scope.lastHourNumberCharts.options.series[1].data = result.data.high;
                            $scope.lastHourNumberCharts.options.series[2].data = result.data.lastHour;
                            $scope.lastHourNumberCharts.options.needInit = true;
                            //绘制Echarts
                            $('#lastHourNumberChartsLoading').hide();
                        }
                    });
                    statsService.getLastHourTraffic(param, function (result) {
                        if (result.success && result.data) {
                            $scope.lastHourni = (result.data.unit ? (" (" + result.data.unit + ")") : "");
                            //设置标题
                            //$scope.lastHourTrafficCharts.options.title.text = TS.ts('dashboard.lastHourTraffic') + (result.data.unit ? ( " (" + result.data.unit + ")") : "");
                            $scope.lastHourTrafficCharts.options.series[0].data = result.data.average;
                            $scope.lastHourTrafficCharts.options.series[1].data = result.data.high;
                            $scope.lastHourTrafficCharts.options.series[2].data = result.data.lastHour;
                            if ($scope.NTPStatus1 == 1) {
                                $scope.lastHourTrafficCharts.options.legend.data = [TS.ts('report.average'), TS.ts('report.high'), TS.ts('report.lasthour')];
                            } else {
                                $scope.lastHourTrafficCharts.options.legend.data = [];
                            }
                            $scope.lastHourTrafficCharts.options.series[0].name = TS.ts('report.average');
                            $scope.lastHourTrafficCharts.options.series[1].name = TS.ts('report.high');
                            $scope.lastHourTrafficCharts.options.series[2].name = TS.ts('report.lasthour');

                            $scope.lastHourTrafficCharts.options.needInit = true;
                            $('#lastHourTrafficChartsLoading').hide();
                        }
                    });
                    statsService.getLastHourTrafficTxRx(param, function (result) {
                        if (result.success && result.data) {
                            //$scope.lastHourTrafficDownUpCharts.options.title.text = TS.ts('dashboard.lastHourTrafficDownUp') + (result.data.unit ? ( " (" + result.data.unit + ")") : "");
                            // if(result.data.tx.length !==0){
                            //     $scope.lastHourTrafficDownUpCharts.options.series[0].data = result.data.tx;
                            // };
                            // if(result.data.rx !==0){
                            //     $scope.lastHourTrafficDownUpCharts.options.series[1].data = result.data.rx;
                            // };
                            $scope.lastHourTra = (result.data.unit ? (" (" + result.data.unit + ")") : "");

                            $scope.lastHourTrafficDownUpCharts.options.series[0].data = result.data.tx;
                            $scope.lastHourTrafficDownUpCharts.options.series[1].data = result.data.rx;

                            $scope.lastHourTrafficDownUpCharts.options.legend.data = [TS.ts('label.downlink'), TS.ts('label.uplink')];
                            $scope.lastHourTrafficDownUpCharts.options.series[0].name = TS.ts('label.downlink');
                            $scope.lastHourTrafficDownUpCharts.options.series[1].name = TS.ts('label.uplink');
                            $scope.lastHourTrafficDownUpCharts.options.needInit = true;
                            $('#lastHourTrafficDownUpChartsLoading').hide();
                        }
                    });

                    $scope.lastHourTrafficSsidCharts.options.legend.data = [];
                    $scope.lastHourTrafficSsidCharts.options.series = [];

                    statsService.getLastHourTrafficSSID(param, function (result) {
                        if (result.success && result.data) {
                            $scope.ssidnui = (result.unit ? (" (" + result.unit + ")") : "");
                            //测试数据 ///////////////////////////////////////////////////////
                            // $scope.ssidnui = "KB";
                            // var valueTemp = [41199.60,31199.60,21199.60,31199.60,41199.60]
                            // result.data.push({ssid: "dlink",value:valueTemp});
                            // valueTemp = [11499.60,11399.60,11299.60,11399.60,11499.60]
                            // result.data.push({ssid: "FangzhuDAPTest1",value:valueTemp});
                            ////////////////////////////////////////////////////////////////
                            for (var i = 0; i < result.data.length; i++) {
                                $scope.lastHourTrafficSsidCharts.options.legend.data.push(result.data[i].ssid);
                                var index = (parseInt(i / 5) + i % 5 * 4) % 10;
                                $scope.lastHourTrafficSsidCharts.options.series.push(
                                    {
                                        name: result.data[i].ssid,
                                        color: [pieColor[index]],
                                        type: 'line',
                                        stack: '总量',
                                        areaStyle: {
                                            normal: {
                                                color: areaColor[index],
                                                default: i == 0 ? 'default' : undefined
                                            }
                                        },
                                        symbol: 'circle',
                                        symbolSize: 6,
                                        smooth: false,
                                        hoverAnimation: false,
                                        data: result.data[i].value
                                    }
                                );
                            }
                            $scope.lastHourTrafficSsidCharts.options.needInit = true;
                            $('#lastHourTrafficSsidChartsLoading').hide();
                        }
                    });
                    //关闭下拉框
                    $scope.isOpenLHMenu = false;
                };


                //--------------searchDailyDiagram---------------------------------------

                var DailyDiagramxAxisData = [];

                var labelTraffic = TS.ts('report.trafficUsage');
                var labelClients = TS.ts('report.uniqueClients');
                var yAxisTraffic = {
                    //name: labelTraffic,
                    position: 'left',
                    type: 'value',
                };
                var yAxisClients = {
                    //name: labelClients,
                    position: 'right',
                    type: 'value',
                };

                var seriesTraffic = {
                    name: labelTraffic,
                    color: ['#64b5f6'],
                    type: 'line',
                    areaStyle: {
                        normal: {
                            color: '#64b5f6',
                            default: 'default'
                        }
                    },
                    symbol: 'circle',
                    symbolSize: 6,
                    smooth: false,
                    hoverAnimation: false,
                    data: []
                };
                var seriesClients = {
                    name: labelClients,
                    color: ['#ffad34'],
                    type: 'line',
                    // areaStyle: {
                    //     normal: {
                    //         color: '#FFFFFF',
                    //         default: 'default'
                    //     }
                    // },
                    symbol: 'circle',
                    symbolSize: 6,
                    smooth: false,
                    hoverAnimation: false,
                    data: []
                };

                function dailyError() {
                    $.DialogByZ.Close();
                };

                //show dailyTraffic Usage
                function searchDailyDiagram() {
                    if (!$scope.daily.site._id
                        || (!$scope.daily.network.agentUUID && !$scope.daily.network._id)
                        || !$scope.daily.startDay.str
                        || !$scope.daily.endDay.str) {
                        return;
                    }
                    $('#DailyTrafficUsageChartsLoading').show();
                    var binDateArr = [];
                    var start = getBinDate(new Date(new Date($scope.daily.startDay.str).setHours(23, 59, 59, 0)));
                    var end = getBinDate(new Date(new Date($scope.daily.endDay.str).setHours(23, 59, 59, 0)));
                    //时间参数输入错误
                    if (start > end) {
                        //显示错误弹出框
                        $.DialogByZ.Alert({
                            Title: "",
                            Content: TS.ts('invalid.timeRangeOver'),
                            BtnL: TS.ts('common.confirm'),
                            FunL: dailyError
                        })
                        $('#DailyTrafficUsageChartsLoading').hide();
                        $scope.isOpenHotDailyMenu = false;
                        return false;
                    }

                    DailyDiagramxAxisData = [];
                    var count = 0;
                    for (var i = start; i <= end; i += 86400) {
                        binDateArr.push(i);
                        var date = new Date($scope.daily.startDay.str);
                        date.setDate(date.getDate() + count++);
                        // DailyDiagramxAxisData.push(date.toLocaleDateString());
                        DailyDiagramxAxisData.push(FormatDate(date));
                    }
                    $scope.daily.params = {
                        binDateArr: binDateArr,
                        site: $scope.daily.site._id,
                        uuid: $scope.daily.network.agentUUID ? $scope.daily.network.agentUUID : $scope.daily.network._id,
                    };
                    seriesTraffic.data = [];
                    seriesClients.data = [];
                    console.log($scope.daily.params);
                    statsService.getTrafficUsageDaily($scope.daily.params, function (result) {
                        if (result.data) {
                            $scope.dtun = result.data.unit;
                            labelTraffic = TS.ts('report.trafficUsage') + ' (' + result.data.unit + ")";
                            //yAxisTraffic.name = labelTraffic;
                            seriesTraffic.name = labelTraffic;
                            seriesTraffic.data = result.data.data;
                        }
                        statsService.getUniqueClientsDaily($scope.daily.params, function (result) {
                            //$scope.DailyTrafficUsageCharts.options.title.text = TS.ts('report.dailyChartTitle');
                            if (result.data) {
                                seriesClients.data = result.data;
                            }
                            $scope.DailyTrafficUsageCharts.options.xAxis[0].data = DailyDiagramxAxisData;
                            $scope.DailyTrafficUsageCharts.options.legend.data = [];
                            $scope.DailyTrafficUsageCharts.options.series = [];
                            $scope.DailyTrafficUsageCharts.options.yAxis = [];
                            if ($scope.daily.trafficUsage) {
                                $scope.DailyTrafficUsageCharts.options.legend.data.push(labelTraffic);
                                $scope.DailyTrafficUsageCharts.options.series.push(seriesTraffic);
                                $scope.DailyTrafficUsageCharts.options.yAxis.push(yAxisTraffic);
                            }
                            if ($scope.daily.uniqueClients) {
                                $scope.DailyTrafficUsageCharts.options.legend.data.push(labelClients);
                                if ($scope.daily.trafficUsage) {
                                    seriesClients.yAxisIndex = 1;
                                } else {
                                    seriesClients.yAxisIndex = 0;
                                }
                                $scope.DailyTrafficUsageCharts.options.series.push(seriesClients);
                                $scope.DailyTrafficUsageCharts.options.yAxis.push(yAxisClients);
                            }
                            $scope.DailyTrafficUsageCharts.options.needInit = true;
                            $scope.isOpenHotDailyMenu = false;
                            $('#DailyTrafficUsageChartsLoading').hide();
                            console.log($scope.DailyTrafficUsageCharts.options);
                        });
                    });
                };


                //--------------hot hourly module
                function openHotHourlyMenu() {
                    $scope.hideTooltip();
                    //需要打开菜单栏才能使用，未打开的话会出现undefined，因为页面还没有渲染
                    $scope.preventSystemKeyboard();
                    closeTooltip();
                }

                function clearHourlyParams() {
                    $scope.hourly.site = '';
                    $scope.hourly.network = '';
                    $scope.hourly.date = '';
                }

                var HourlyxAxisData = [];
                for (var i = 0; i < 24; i++) {
                    HourlyxAxisData.push((i < 10 ? "0" + i : i) + ":00");
                }

                function searchHourlyDiagram() {
                    if (!$scope.hourly.site._id
                        || (!$scope.hourly.network.agentUUID && !$scope.hourly.network._id)
                        || !$scope.hourly.date.value) {
                        return;
                    }
                    function getBinDate(date) {
                        date = new Date(date);
                        let flag = new Date('1970/1/1');
                        let dateSeconds = ((date.getTime() - flag.getTime()) / 1000);
                        //let dateSeconds = (date.getTime() / 1000);
                        return parseInt((dateSeconds + NCTimeOffset * 60) / 86400) * 86400;
                    }
                    $('#HourlyUniqueChartsLoading').show();
                    $('#HourlyTrafficChartsLoading').show();
                    var startDay = new Date(NCTime);
                    startDay.setDate(startDay.getDate() - 6);
                    var endDay = new Date(NCTime);
                    endDay.setDate(endDay.getDate());
                    $scope.hourly.params = {
                        time: {offset: NCTimeOffset, dateTime: NCTime},
                        site: $scope.hourly.site._id,
                        uuid: $scope.hourly.network.agentUUID ? $scope.hourly.network.agentUUID : $scope.hourly.network._id,
                        binDate: $scope.hourly.date.value,
                        startDay: getBinDate(startDay),
                        endDay: getBinDate(endDay)
                    };
                    console.log($scope.hourly.params);
                    statsService.getUniqueClientsHourlyThreshold($scope.hourly.params, function (result) {
                        if (result.data) {
                            $scope.HourlyUniqueCharts.options.legend.data[1] = TS.ts('report.average');
                            $scope.HourlyUniqueCharts.options.legend.data[2] = TS.ts('report.high');
                            $scope.HourlyUniqueCharts.options.series[1].name = TS.ts('report.average');
                            $scope.HourlyUniqueCharts.options.series[2].name = TS.ts('report.high');
                            //$scope.HourlyUniqueCharts.options.title.text = TS.ts('report.hourlyChartTitle1');
                            $scope.HourlyUniqueCharts.options.series[1].data = result.data.average;
                            $scope.HourlyUniqueCharts.options.series[2].data = result.data.high;
                            $scope.HourlyUniqueCharts.options.needInit = true;
                        }
                    });
                    statsService.getTrafficHourlyThreshold($scope.hourly.params, function (result) {
                        if (result.data) {
                            $scope.HourlyTrafficCharts.options.legend.data[1] = TS.ts('report.average');
                            $scope.HourlyTrafficCharts.options.legend.data[2] = TS.ts('report.high');
                            $scope.HourlyTrafficCharts.options.series[1].name = TS.ts('report.average');
                            $scope.HourlyTrafficCharts.options.series[2].name = TS.ts('report.high');
                            $scope.HourlyTrafficCharts.options.series[1].data = result.data.data.average;
                            $scope.HourlyTrafficCharts.options.series[2].data = result.data.data.high;
                            $scope.HourlyTrafficCharts.options.needInit = true;
                        }
                    });
                    $scope.HourlyUniqueCharts.options.series[0].name = $scope.hourly.date.str;
                    $scope.HourlyUniqueCharts.options.legend.data[0] = $scope.hourly.date.str;
                    statsService.getUniqueClientsHourlyByDay($scope.hourly.params, function (result) {
                        if (result.data) {
                            $scope.HourlyUniqueCharts.options.series[0].data = result.data;
                            $scope.HourlyUniqueCharts.options.needInit = true;
                        }
                        $('#HourlyUniqueChartsLoading').hide();
                    });
                    $scope.HourlyTrafficCharts.options.series[0].name = $scope.hourly.date.str;
                    $scope.HourlyTrafficCharts.options.legend.data[0] = $scope.hourly.date.str;
                    $scope.htan;
                    statsService.getTrafficHourlyByDay($scope.hourly.params, function (result) {
                        if (result.data) {
                            //$scope.HourlyTrafficCharts.options.title.text = TS.ts('report.hourlyChartTitle2');
                            //$scope.HourlyTrafficCharts.options.yAxis[0].name = TS.ts('report.trafficUsage') + " (" + result.data.unit + ")";
                            $scope.htan = result.data.unit;
                            $scope.HourlyTrafficCharts.options.series[0].data = result.data.data;
                            $scope.HourlyTrafficCharts.options.needInit = true;
                        }
                        $('#HourlyTrafficChartsLoading').hide();
                    });
                    $scope.isOpenHotHourlyMenu = false;
                }

                //--------------hot hourly module


                //--------------Hot Ap module
                //hot ap params init
                var CanvasContainer = require("canvasContainer");
                var canvasContainer;
                //初始化hotAp
                $scope.HotApSelect = {};
                //hot ap map init
                $scope.hotApMaps = [];
                //site net list
                $scope.allSiteNetworks = [];
                //hot ap  uniqueClients
                $scope.uniqueClients = {average: 0, high: 0};
                //hot ap  trafficUsage
                $scope.trafficUsage = {average: 0, high: 0, unit: "KB"};


                function createHotApMap() {
                    setTimeout(function () {
                        var canvas = document.getElementById("showCanvas");
                        var context = canvas.getContext("2d");
                        var bbox = canvas.getBoundingClientRect();
                        canvas.width = bbox.width + 200;
                        canvas.height = bbox.height + 100;
                        canvasContainer = new CanvasContainer(canvas, context);
                        canvasContainer.addTipHandler(tipdiv, TS);

                        var startDay = new Date(NCTime);
                        startDay.setDate(startDay.getDate() - 6);
                        var endDay = new Date(NCTime);
                        endDay.setDate(endDay.getDate());

                        var param = {
                            startDay: getBinDate(startDay),
                            endDay: getBinDate(endDay)
                        };

                        function getBinDate(date) {
                            date = new Date(date);
                            let flag = new Date('1970/1/1');
                            let dateSeconds = ((date.getTime() - flag.getTime()) / 1000);
                            //let dateSeconds = ((date.getTime()) / 1000);
                            return parseInt((dateSeconds + NCTimeOffset * 60) / 86400) * 86400;
                        }

                        statsService.getHotApUniqueClientThreshold(param, function (result) {
                            if (result.success) {
                                $scope.uniqueClients = result.data;
                                canvasContainer.uniqueClients = $scope.uniqueClients;
                            }
                            $scope.showMap();
                        });
                        statsService.getHotApTrafficThreshold(param, function (result) {
                            if (result.success) {
                                $scope.trafficUsage = result.data;
                                console.log($scope.trafficUsage);
                                canvasContainer.trafficUsage = $scope.trafficUsage;
                            }
                            $scope.showMap();
                        });


                    }, 500);
                };

                function showMap() {
                    if (!canvasContainer) return;
                    if (!$scope.hotApMapActive) return;
                    var img = new Image();
                    img.onload = function () {
                        canvasContainer.initialImageArea(this);
                        canvasContainer.setDevices($scope.hotApMapActive.devices, $scope.hotApMapActive.rate);
                        $scope.getHotApStatsData();
                        canvasContainer.refresh();
                        $scope.$apply();
                    };
                    img.src = $scope.hotApMapActive.mapPath;
                }

                function ckearHotApParams() {
                    //恢复默认值
                    $scope.HotApSelect.map = '';
                    $scope.ApSelect.networkHour = '';
                    $scope.ApSelect.networkday = '';
                };

                function openHotApMenu() {
                    $scope.hideTooltip();
                    //防止打开系统输入框
                    $scope.preventSystemKeyboard();
                    closeTooltip();
                };

                function searchHotApDiagram() {
                    //获取hot ap map list
                    OrganizationService.getAllHotApMaps(function (result) {
                        if (result.success) {
                            $scope.hotApMaps = result.data;
                            if ($scope.hotApMaps && $scope.hotApMaps.length > 0) {
                                $scope.hotApMapActive = $scope.hotApMaps[0];
                            }
                            ;
                            //设置默认值
                            $scope.HotApSelect.map = $scope.hotApMaps[0];
                            //绘制hot ap map
                            $scope.createHotApMap();
                            //ap list
                            $scope.getNetWorksList();
                        }
                    });

                };

                function searchHotApMapByName() {
                    //防止必填项没有填入
                    if (!$scope.HotApSelect.map || !$scope.ApSelect.networkday || !$scope.ApSelect.networkHour) {
                        return;
                    }
                    ;
                    //active
                    $scope.hotApMapActive = $scope.HotApSelect.map;
                    //绘制hot ap map
                    $scope.createHotApMap();
                    //关闭menu
                    $scope.isOpenHotAPMenu = false;

                    //设置样式
                    //  var tipdiv = $('#tipdiv')[0];


                    //  tipdiv.style.padding = "0.5rem";
                };

                function getHotApStatsData() {
                    if ($scope.hotApMapActive == null) return;
                    if (!canvasContainer) return;
                    var apList = [];
                    if ($scope.hotApMapActive.devices) {
                        for (var i = 0; i < $scope.hotApMapActive.devices.length; i++) {
                            apList.push($scope.hotApMapActive.devices[i].apMACAddr);
                        }
                    }
                    let d = $scope.ApSelect.networkday.value;
                    let t = $scope.ApSelect.networkHour.value;
                    //这个地方改时间
                    //utils.getNodeTime(function () {
                    let offset = NCTimeOffset;
                    let utc = new Date((d + t + (offset) * 60) * 1000);

                    let uYear = utc.getUTCFullYear();
                    let uMonth = utc.getUTCMonth();
                    let uDate = utc.getUTCDate();
                    let uHour = utc.getUTCHours();
                    let uMinute = utc.getUTCMinutes();
                    let uSecond = utc.getUTCSeconds();

                    let dateFilter = Date.UTC(uYear, uMonth, uDate, 0, 0, 0) / 1000;
                    let timeFilter = Date.UTC(1970, 0, 1, uHour, uMinute, uSecond) / 1000;
                    var params = {
                        apList: apList,
                        binDate: dateFilter,
                        timestamp: timeFilter,
                        unit: $scope.trafficUsage.unit
                    };
                    statsService.getUniqueClientsForAps(params, function (result) {
                        if (result.success) {

                            for (var i = 0; i < canvasContainer.devices.length; i++) {
                                var find = _.find(result.data, function (item) {
                                    return item._id == canvasContainer.devices[i].apMACAddr;
                                });
                                canvasContainer.devices[i].uniqueClients = find ? find.count : -1;
                            }
                            canvasContainer.refresh();
                        }
                    });
                    statsService.getTrafficUsageForAps(params, function (result) {
                        if (result.success) {

                            for (var i = 0; i < canvasContainer.devices.length; i++) {
                                var find = _.find(result.data, function (item) {
                                    return item._id == canvasContainer.devices[i].apMACAddr;
                                })
                                canvasContainer.devices[i].trafficUsage = find ? find.usage : -1;
                            }
                            canvasContainer.refresh();
                        }
                    });
                };

                function getNetWorksList() {

                    NetworkService.listShortNetworks(function (result) {
                        if (result.success) {
                            var sites = result.data;
                            if ($scope.hotApMaps && $scope.hotApMaps.devices && $scope.hotApMaps.devices.length > 0) {
                                if (sites.length > 0) {
                                    sites[0].open = true;
                                    if (sites[0].networks.length > 0) {
                                        sites[0].networks[0].open = true;
                                    }
                                    for (var i = 0; i < sites.length; i++) {
                                        for (var j = 0; j < sites[i].networks.length; j++) {
                                            var network = sites[i].networks[j];
                                            InventoryService.listManagedDevicesByNetwork(network, function (result) {
                                                network.devices = result.data;
                                                for (var k = 0; k < network.devices.length; k++) {
                                                    var find = $scope.hotApMaps.devices.find(function (item) {
                                                        return item._id == network.devices[k]._id;
                                                    });
                                                    if (find) {
                                                        network.devices[k].check = true;
                                                        network.devices[k].x = find.x;
                                                        network.devices[k].y = find.y;
                                                    }
                                                }

                                            });
                                        }
                                    }
                                }
                            } else {
                                if (sites.length > 0) {
                                    sites[0].open = true;
                                    if (sites[0].networks.length > 0) {
                                        sites[0].networks[0].open = true;
                                        InventoryService.listManagedDevicesByNetwork(sites[0].networks[0], function (result) {
                                            sites[0].networks[0].devices = result.data;
                                        });
                                    }
                                }
                            }
                            $scope.allSiteNetworks = sites;
                        }
                    });
                };
                //--------------Hot Ap module


                //-------------------------------options-----------------------------------------------------------------------------------------

                /*
                * lastHourNumberCharts配置参数
                */
                $scope.lastHourNumberCharts = {
                    options: {
                        title: {
                            textStyle: {
                                //文字颜色
                                color: 'RGB(23,38,100)',
                                //字体风格,'normal','italic','oblique'
                                fontStyle: 'normal',
                                //字体粗细 'normal','bold','bolder','lighter',100 | 200 | 300 | 400...
                                fontWeight: 'bold',
                                //字体系列
                                //字体大小
                                fontSize: $scope.chartFontSize
                            },
                            textAlign: 'left',
                            display: true,
                            //text: $rootScope.lastHourNumberChartsTitle?$rootScope.lastHourNumberChartsTitle:'Number of Clients in the Last Hour vs \nNumber of Clients in the Past 7 Days'
                        },
                        legend: {
                            icon: 'rect',
                            selectedMode: true,
                            formatter: "{name}",
                            bottom: 0,
                            data: ['Average', 'High', 'Last Hour',],
                            itemGap: 20,
                            textStyle: {fontSize: $scope.chartFontSize},
                        },
                        grid: {
                            show: true,
                            left: 10 + $scope.chartleft,
                            top: 10 + $scope.chartTop,
                            right: 5,
                            bottom: 48,
                            containLabel: true
                        },
                        xAxis: [
                            {
                                splitLine: {
                                    show: true
                                },
                                type: 'category',
                                data: [],
                                axisLabel: {
                                    textStyle: {
                                        fontSize: $scope.chartFontSize
                                    },
                                },
                            }
                        ],
                        yAxis: [
                            {
                                name: '',
                                type: 'value',
                                axisLabel: {
                                    textStyle: {fontSize: $scope.chartFontSize}
                                },
                            }
                        ],
                        series: [
                            {
                                name: 'Average',
                                color: ['#ffad34'],
                                type: 'line',

                                symbol: 'circle',
                                symbolSize: 6,
                                smooth: false,
                                hoverAnimation: false,
                                data: []
                            },
                            {
                                name: 'High',
                                color: ['#607896'],
                                type: 'line',

                                symbol: 'circle',
                                symbolSize: 6,
                                smooth: false,
                                hoverAnimation: false,
                                data: []
                            },
                            {
                                name: 'Last Hour',
                                color: ['#64b5f6'],
                                type: 'line',

                                symbol: 'circle',
                                symbolSize: 6,
                                smooth: false,
                                hoverAnimation: false,
                                data: []
                            },
                        ]
                    }
                };
                /*
                * lastHourTrafficCharts配置参数
                */
                $scope.lastHourTrafficCharts = {
                    options: {
                        title: {
                            textStyle: {
                                //文字颜色
                                color: 'RGB(23,38,100)',
                                //字体风格,'normal','italic','oblique'
                                fontStyle: 'normal',
                                //字体粗细 'normal','bold','bolder','lighter',100 | 200 | 300 | 400...
                                fontWeight: 'bold',
                                //字体系列
                                //字体大小
                                fontSize: $scope.chartFontSize
                            },
                            textAlign: 'left',
                            display: true,
                        },
                        legend: {
                            icon: 'rect',
                            selectedMode: true,
                            formatter: "{name}",
                            bottom: 0,
                            data: ['Last Hour(MB)', 'Average(MB)', 'High(MB)',],
                            itemGap: 20,
                            textStyle: {fontSize: $scope.chartFontSize},
                        },
                        grid: {
                            show: true,
                            left: 10 + $scope.chartleft,
                            top: 10 + $scope.chartTop,
                            right: 5,
                            bottom: 48,
                            containLabel: true,
                        },
                        xAxis: [
                            {
                                splitLine: {
                                    show: true
                                },

                                type: 'category',
                                data: [],
                                axisLabel: {
                                    textStyle: {
                                        fontSize: $scope.chartFontSize
                                    }
                                },
                            }
                        ],
                        yAxis: [
                            {
                                name: '',
                                type: 'value',
                                axisLabel: {
                                    textStyle: {fontSize: $scope.chartFontSize}
                                },
                            }
                        ],
                        series: [
                            {
                                name: 'Average(MB)',
                                color: ['#ffad34'],
                                type: 'line',
                                symbol: 'circle',
                                symbolSize: 4,
                                smooth: false,
                                hoverAnimation: false,
                                data: []
                            },
                            {
                                name: 'High(MB)',
                                color: ['#607896'],
                                type: 'line',
                                symbol: 'circle',
                                symbolSize: 4,
                                smooth: false,
                                hoverAnimation: false,
                                data: []
                            },
                            {
                                name: 'Last Hour(MB)',
                                color: ['#64b5f6'],
                                type: 'line',
                                symbol: 'circle',
                                symbolSize: 4,
                                smooth: false,
                                hoverAnimation: false,
                                data: []
                            },
                        ]
                    }
                };
                /*
                * lastHourTrafficDownUpCharts配置参数
                */
                $scope.lastHourTrafficDownUpCharts = {
                    options: {
                        title: {
                            textStyle: {
                                //文字颜色
                                color: 'RGB(23,38,100)',
                                //字体风格,'normal','italic','oblique'
                                fontStyle: 'normal',
                                //字体粗细 'normal','bold','bolder','lighter',100 | 200 | 300 | 400...
                                fontWeight: 'bold',
                                //字体系列

                                //字体大小
                                fontSize: $scope.chartFontSize
                            },
                            textAlign: 'left',
                            display: true,
                            //text: $rootScope.lastHourTrafficDownUpChartsTitle?$rootScope.lastHourTrafficDownUpChartsTitle:'Downlink/Uplink Traffic Usage Structure\n in the Last Hour(KB)'
                        },
                        legend: {
                            icon: 'rect',
                            selectedMode: true,
                            formatter: "{name}",
                            bottom: 0,
                            data: ['Tx to Client(MB)', 'Rx from Client(MB)'],
                            textStyle: {fontSize: $scope.chartFontSize},
                            itemGap: 20,
                        },
                        grid: {
                            show: true,
                            left: 10 + $scope.chartleft,
                            top: 10 + $scope.chartTop,
                            right: 5,
                            bottom: 48,
                            containLabel: true,
                        },
                        xAxis: [
                            {
                                splitLine: {
                                    show: true
                                },

                                type: 'category',
                                data: [],
                                axisLabel: {
                                    textStyle: {
                                        fontSize: $scope.chartFontSize
                                    },
                                },
                            }
                        ],
                        yAxis: [
                            {
                                name: '',
                                type: 'value'
                            }
                        ],
                        series: [
                            {
                                name: 'Tx to Client(MB)',
                                color: ['#22b7db'],
                                type: 'line',
                                stack: '总量',
                                areaStyle: {
                                    normal: {
                                        color: '#ECF9F8',
                                    }
                                },
                                symbol: 'circle',
                                symbolSize: 6,
                                smooth: false,
                                hoverAnimation: false,
                                data: []
                            }, {
                                name: 'Rx from Client(MB)',
                                color: ['#afcb20'],
                                type: 'line',
                                stack: '总量',
                                areaStyle: {
                                    normal: {
                                        color: '#ECF9F8',
                                    }
                                },
                                symbol: 'circle',
                                symbolSize: 6,
                                smooth: false,
                                hoverAnimation: false,
                                data: []
                            }
                        ]
                    }
                };
                /*
                * lastHourTrafficSsidCharts配置参数
                */
                $scope.lastHourTrafficSsidCharts = {
                    options: {
                        title: {
                            textStyle: {
                                //文字颜色
                                color: 'RGB(23,38,100)',
                                //字体风格,'normal','italic','oblique'
                                fontStyle: 'normal',
                                //字体粗细 'normal','bold','bolder','lighter',100 | 200 | 300 | 400...
                                fontWeight: 'bold',
                                //字体系列

                                //字体大小
                                fontSize: $scope.chartFontSize
                            },
                            textAlign: 'left',
                            display: true,
                            //text: $rootScope.lastHourTrafficSsidChartsTitle?$rootScope.lastHourTrafficSsidChartsTitle:'Traffic Usage Structure by SSID in the Last Hour(KB)'
                        },
                        legend: {
                            type: 'scroll',
                            icon: 'rect',
                            selectedMode: true,
                            formatter: "{name}",
                            bottom: -12,
                            data: [],
                            itemGap: 20,
                            textStyle: {fontSize: $scope.chartFontSize},
                        },
                        grid: {
                            show: true,
                            left: 10 + $scope.chartleft,
                            top: 10 + $scope.chartTop,
                            right: 5,
                            bottom: 60,
                            containLabel: true,
                        },
                        xAxis: [
                            {
                                splitLine: {
                                    show: true
                                },

                                type: 'category',
                                data: [],
                                axisLabel: {
                                    textStyle: {
                                        fontSize: $scope.chartFontSize
                                    }
                                },
                            }
                        ],
                        yAxis: [
                            {
                                name: '',
                                type: 'value'
                            }
                        ],
                        series: []
                    }
                };

                /**
                 * hot time echarts for most client hot time
                 */
                function getDateStr(bindate) {
                    let flag = new Date('1970/1/1');
                    var date = new Date(bindate * 1000 + flag.getTime());

                    var month = date.getMonth() + 1;
                    if (month < 10) month = "0" + month;
                    var day = date.getDate();
                    if (day < 10) day = "0" + day;
                    return date.getFullYear() + "-" + month + "-" + day;
                }

                function getTimeStr(timestamp) {
                    let hour = parseInt(timestamp / (60 * 60));
                    let min = parseInt((timestamp % (60 * 60)) / 60);
                    return (hour < 10 ? "0" + hour : hour) + ":" + (min < 10 ? "0" + min : min);
                }

                $scope.MostClientsHotTimeCharts = {
                    options: {
                        title: {
                            textStyle: {
                                //文字颜色
                                color: 'RGB(23,38,100)',
                                //字体风格,'normal','italic','oblique'
                                fontStyle: 'normal',
                                //字体粗细 'normal','bold','bolder','lighter',100 | 200 | 300 | 400...
                                fontWeight: 'bold',
                                //字体系列
                                //字体大小
                                fontSize: $scope.chartFontSize
                            },
                            textAlign: 'left',
                            display: true,
                            //text: $rootScope.MostClientsHotTimeChartsTitle?$rootScope.MostClientsHotTimeChartsTitle:'Most Clients Hot Time According Past 7 Days Experience'

                        },
                        tooltip: {
                            trigger: 'item',
                            showDelay: 0,
                            formatter: function (params) {
                                if (params.value.length > 1) {
                                    return getDateStr(params.value[2]) + ' '
                                        + getTimeStr(params.value[0]) + ' <br/>' + TS.ts('report.uniqueClients') + ': '
                                        + params.value[1] + ' ';
                                }
                                else {
                                    return "";
                                }
                            }
                        },
                        legend: {
                            icon: 'rect',
                            selectedMode: true,
                            formatter: "{name}",
                            top: 0,
                            right: 16,
                            data: [],
                            itemGap: 20,
                            textStyle: {fontSize: $scope.chartFontSize},
                        },
                        grid: {
                            show: true,
                            left: 10,
                            top: 10 + $scope.chartTop,
                            right: 5,
                            bottom: 48,
                            containLabel: true
                        },
                        xAxis: [
                            {
                                splitLine: {
                                    show: true
                                },
                                min: 0,
                                max: 86400,
                                type: 'value',
                                scale: false,
                                //interval: 30,
                                axisLabel: {
                                    formatter: getTimeStr,
                                    textStyle: {
                                        fontSize: $scope.chartFontSize
                                    }
                                },
                                axisTick: { //刻度线样式
                                    show: true
                                },
                                data: []
                            }
                        ],
                        yAxis: [
                            {
                                //name: TS.ts('report.uniqueClients'),
                                type: 'value',
                                axisTick: { //刻度线样式
                                    show: true
                                }
                            }
                        ],
                        series: []
                    }
                };
                $scope.MostTrafficUsageCharts = {
                    options: {
                        title: {
                            textStyle: {
                                //文字颜色
                                color: 'RGB(23,38,100)',
                                //字体风格,'normal','italic','oblique'
                                fontStyle: 'normal',
                                //字体粗细 'normal','bold','bolder','lighter',100 | 200 | 300 | 400...
                                fontWeight: 'bold',
                                //字体系列
                                //字体大小
                                fontSize: $scope.chartFontSize
                            },
                            textAlign: 'left',
                            display: true,
                            //text: $rootScope.MostTrafficUsageChartsTitle?$rootScope.MostTrafficUsageChartsTitle:'Most Traffic Usage Hot Time According Past 7 Days Experience'
                        },
                        legend: {
                            icon: 'rect',
                            selectedMode: true,
                            formatter: "{name}",
                            top: 0,
                            right: 16,
                            itemGap: 20,
                            data: [],
                            textStyle: {fontSize: $scope.chartFontSize},
                        },
                        tooltip: {
                            trigger: 'item',
                            showDelay: 0,
                            formatter: function (params) {
                                if (params.value.length > 1) {
                                    return getDateStr(params.value[2]) + ' '
                                        + getTimeStr(params.value[0]) + ' <br/>' + TS.ts('report.trafficUsage') + ': '
                                        + params.value[1] + ' ';
                                }
                                else {
                                    return "";
                                }
                            }
                        },
                        grid: {
                            show: true,
                            left: 10,
                            top: 10 + $scope.chartTop,
                            right: 5,
                            bottom: 48,
                            containLabel: true
                        },
                        xAxis: [
                            {
                                splitLine: {
                                    show: true
                                },
                                axisLabel: {
                                    interval: 10
                                },
                                min: 0,
                                max: 86400,
                                type: 'value',
                                scale: false,
                                axisLabel: {
                                    formatter: getTimeStr,
                                    textStyle: {
                                        fontSize: $scope.chartFontSize
                                    }
                                },
                                axisTick: { //刻度线样式
                                    show: true
                                },
                                data: []
                            }
                        ],
                        yAxis: [
                            {
                                //name: TS.ts('report.trafficUsage'),
                                type: 'value',
                                axisTick: { //刻度线样式
                                    show: true
                                }
                            }
                        ],
                        series: []
                    }
                };

                $scope.HourlyUniqueCharts = {
                    type: 'line',
                    options: {
                        title: {
                            textStyle: {
                                //文字颜色
                                color: 'RGB(23,38,100)',
                                //字体风格,'normal','italic','oblique'
                                fontStyle: 'normal',
                                //字体粗细 'normal','bold','bolder','lighter',100 | 200 | 300 | 400...
                                fontWeight: 'bold',
                                //字体系列

                                //字体大小
                                fontSize: $scope.chartFontSize
                            },
                            textAlign: 'left',
                            display: true,
                            //text: $rootScope.HourlyUniqueChartsTitle?$rootScope.HourlyUniqueChartsTitle:'Hourly Unique Clients vs Past 7 Days Experiences'
                        },
                        legend: {
                            icon: 'rect',
                            selectedMode: true,
                            formatter: "{name}",
                            itemGap: 20,
                            orient: "horizontal",
                            bottom: 0,
                            left: 'center',
                            data: [$scope.hourly.date.str, 'Average', 'High'],
                            textStyle: {fontSize: $scope.chartFontSize},
                        },
                        grid: {
                            show: true,
                            left: 15,
                            top: 10 + $scope.chartTop,
                            right: 5,
                            bottom: 48,
                            containLabel: true,
                        },
                        xAxis: [
                            {
                                splitLine: {
                                    show: true
                                },
                                axisLabel: {
                                    interval: 1,
                                    textStyle: {
                                        fontSize: $scope.chartFontSize
                                    }
                                },
                                type: 'category',
                                data: HourlyxAxisData
                            }
                        ],
                        yAxis: [
                            {
                                //name: TS.ts('report.uniqueClients'), // 需根据实际数据修改
                                type: 'value',
                            }
                        ],
                        // dataZoom: {
                        //     show: true,
                        //     start: 0
                        // },
                        series: [
                            {
                                name: $scope.hourly.date.str,
                                color: ['#64b5f6'],
                                type: 'line',
                                // areaStyle: {
                                //     normal: {
                                //         color: '#FFFFFF',
                                //         default: 'default'
                                //     }
                                // },
                                symbol: 'circle',
                                symbolSize: 6,
                                smooth: false,
                                hoverAnimation: false,
                                data: []
                            }, {
                                name: 'Average',
                                color: ['#ffad34'],
                                type: 'line',
                                // areaStyle: {
                                //     normal: {
                                //         color: '#FFFFFF',
                                //         default: 'default'
                                //     }
                                // },
                                symbol: 'circle',
                                symbolSize: 6,
                                smooth: false,
                                hoverAnimation: false,
                                data: []
                            },
                            {
                                name: 'High',
                                color: ['#607896'],
                                type: 'line',
                                // areaStyle: {
                                //     normal: {
                                //         color: '#FFFFFF',
                                //         default: 'default'
                                //     }
                                // },
                                symbol: 'circle',
                                symbolSize: 6,
                                smooth: false,
                                hoverAnimation: false,
                                data: []
                            }
                        ]
                    }
                };


                $scope.HourlyTrafficCharts = {
                    type: 'line',
                    options: {
                        title: {
                            textStyle: {
                                //文字颜色
                                color: 'RGB(23,38,100)',
                                //字体风格,'normal','italic','oblique'
                                fontStyle: 'normal',
                                //字体粗细 'normal','bold','bolder','lighter',100 | 200 | 300 | 400...
                                fontWeight: 'bold',
                                //字体系列
                                //字体大小
                                fontSize: $scope.chartFontSize
                            },
                            textAlign: 'left',
                            display: true,
                            //text: $rootScope.HourlyTrafficChartsTitle?$rootScope.HourlyTrafficChartsTitle:'Hourly Traffic Usage vs Past 7 Days Experiences'
                        },
                        legend: {
                            icon: 'rect',
                            selectedMode: true,
                            formatter: "{name}",
                            itemGap: 20,
                            orient: "horizontal",
                            bottom: 0,
                            left: 'center',
                            data: [$scope.hourly.date.str, 'Average', 'High'],
                            textStyle: {fontSize: $scope.chartFontSize},
                        },
                        grid: {
                            show: true,
                            left: 15,
                            top: 10 + $scope.chartTop,
                            right: 5,
                            bottom: 48,
                            containLabel: true,
                        },
                        xAxis: [
                            {
                                splitLine: {
                                    show: true
                                },
                                axisLabel: {
                                    interval: 1,
                                    textStyle: {
                                        fontSize: $scope.chartFontSize
                                    }
                                },
                                type: 'category',
                                data: HourlyxAxisData
                            }
                        ],
                        yAxis: [
                            {
                                //name: TS.ts('report.trafficUsage'),
                                type: 'value'
                            }
                        ],
                        series: [
                            {
                                name: $scope.hourly.date.str,
                                color: ['#64b5f6'],
                                type: 'line',
                                symbol: 'circle',
                                symbolSize: 6,
                                smooth: false,
                                hoverAnimation: false,
                                data: []
                            }, {
                                name: 'Average',
                                color: ['#ffad34'],
                                type: 'line',
                                symbol: 'circle',
                                symbolSize: 6,
                                smooth: false,
                                hoverAnimation: false,
                                data: []
                            },
                            {
                                name: 'High',
                                color: ['#607896'],
                                type: 'line',
                                symbol: 'circle',
                                symbolSize: 6,
                                smooth: false,
                                hoverAnimation: false,
                                data: []
                            }
                        ]
                    }
                };


                $scope.DailyTrafficUsageCharts = {
                    type: 'line',
                    options:
                        {
                            title: {
                                textStyle: {
                                    //文字颜色
                                    color: 'RGB(23,38,100)',
                                    //字体风格,'normal','italic','oblique'
                                    fontStyle: 'normal',
                                    //字体粗细 'normal','bold','bolder','lighter',100 | 200 | 300 | 400...
                                    fontWeight: 'bold',
                                    //字体系列

                                    //字体大小
                                    fontSize: $scope.chartFontSize
                                },
                                textAlign: 'left',
                                display: true,
                                //text: $rootScope.DailyTrafficUsageChartsTitle?$rootScope.DailyTrafficUsageChartsTitle:'Daily Traffic USage VS Unique Clients'
                            },
                            legend: {
                                icon: 'rect',
                                selectedMode: true,
                                formatter: "{name}",
                                itemGap: 10,
                                orient: "horizontal",
                                bottom: 0,
                                left: 'center',
                                data: [labelTraffic, labelClients],
                                textStyle: {fontSize: $scope.chartFontSize},
                            },
                            grid: {
                                show: true,
                                left: 35,
                                top: 10 + $scope.chartTop,
                                right: 0,
                                bottom: 60,
                                containLabel: true,
                            },
                            xAxis: [
                                {
                                    splitLine: {
                                        show: true
                                    },
                                    axisLabel: {
                                        textStyle: {
                                            fontSize: $scope.chartFontSize
                                        }
                                    },
                                    type: 'category',
                                    data: []
                                }
                            ],
                            yAxis: [yAxisTraffic, yAxisClients],
                            series: []
                        }
                };


                //-------------------------------options---------------------------------------------
            });
        })
    });
});