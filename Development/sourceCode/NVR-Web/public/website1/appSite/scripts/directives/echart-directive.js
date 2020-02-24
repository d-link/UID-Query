/**
 * Created by lizhimin on 2016/5/19.
 */

define(['directiveModule', 'echarts', 'echart-theme'], function (directives, echarts, barChart) {
    var types = ['line', 'bar', 'pie', 'scatter'];
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    //图标文字大小
    var chartFontSize = 12;
    if(windowWidth>=1024&&windowHeight>=768){//平板电脑横屏模式
        chartFontSize = 20;
    };
    for (var i = 0, n = types.length; i < n; i++) {
        (function (type) {
            directives.directive(type + 'Chart', ['$http', 'theme', function ($http, theme) {
                return {
                    restrict: 'EA',
                    template: '<div class="chart" width="100%" height="100%"></div>',
                    replace: true,
                    scope: {
                        options: '=',
                        size: '=',
                        theme: '='
                    },
                    link: getLinkFunction(type, theme)
                };
                function getLinkFunction(type, theme) {
                    return function (scope, element, attrs) {
                        scope.size = scope.size || {};
                        function getSizes(config) {
                            if (!config) config = {};
                            width = config.width || parseInt(attrs.width) || 320;
                            height = config.height || parseInt(attrs.height) || 240;

                            element[0].style.width = width + 'px';
                            element[0].style.height = height + 'px';
                        }

                        // 基于准备好的dom，初始化echarts图表
                        var myChart;
                        //监听options变化
                        scope.$watch('options', function () {
                            getSizes(scope.size);
                            /* if (!myChart) {
                             myChart = echarts.init(element[0], theme.get(scope.theme || 'blue'));
                             }*/
                            var options = getOptions();
                            if (options) {
                                if (options.needInit) {
                                    if (myChart && myChart.dispose) {
                                        myChart.dispose();
                                    }
                                    myChart = echarts.init(element[0], theme.get(scope.theme || 'blue'));
                                } else {
                                    if (!myChart) {
                                        myChart = echarts.init(element[0], theme.get(scope.theme || 'blue'));
                                    }
                                }
                                myChart.setOption(options);
                            }

                        }, true);
                        scope.$watch('size', function () {
                            getSizes(scope.size);
                            if (myChart) {
                                myChart.resize();
                            }
                        }, true);
                        scope.$watch('theme', function () {
                            // getSizes(scope.size);
                            if (myChart) {
                                // myChart.setTheme(theme.get(scope.theme || 'blue'));
                                myChart.dispose();
                                myChart = echarts.init(element[0], theme.get(scope.theme || 'blue'));
                                var options = getOptions();
                                if (options) {
                                    myChart.setOption(options);
                                }
                            }
                            /*var options = getOptions();
                             if(options){
                             myChart.setOption(options);
                             }*/

                        }, true);
                        function getOptions() {

                            var option = {
                                title: {
                                    text: '某设备',
                                    subtext: '纯属虚构'
                                },
                                tooltip: {
                                    trigger: 'axis'
                                },
                                legend: {
                                    data: ['流量']
                                },
                                toolbox: {
                                    show: false,
                                    right: 0,
                                    top: 12,
                                    orient: 'vertical',
                                    feature: {
                                        magicType: {
                                            show: true,
                                            icon: {
                                                line: '<path fill-rule="evenodd" clip-rule="evenodd" d="M3.105,11.857c0.61,0,1.104-0.513,1.104-1.144c0-0.183-0.051-0.35-0.125-0.503l1.263-1.775c0.011,0,0.021,0.007,0.032,0.007c0.065,0,0.123-0.027,0.185-0.039l2.011,3.05c-0.047,0.126-0.079,0.261-0.079,0.404C7.497,12.488,7.992,13,8.603,13c0.609,0,1.104-0.512,1.104-1.143c0-0.125-0.033-0.239-0.068-0.352l2.387-4.247c0.546-0.069,0.976-0.532,0.976-1.116C13.001,5.511,12.506,5,11.896,5c-0.609,0-1.105,0.512-1.105,1.144c0,0.233,0.084,0.437,0.2,0.618L8.73,10.74c-0.044-0.005-0.082-0.026-0.128-0.026c-0.03,0-0.056,0.016-0.085,0.018l-2.092-3.17c0.02-0.085,0.05-0.166,0.05-0.257c0-0.63-0.49-1.14-1.095-1.14c-0.605,0-1.096,0.51-1.096,1.14c0,0.154,0.031,0.299,0.084,0.433L3.057,9.581C2.47,9.608,2,10.101,2,10.714C2,11.345,2.495,11.857,3.105,11.857z M13.001,2H2C0.896,2,0,2.896,0,4v9c0,1.104,0.896,2,2,2h11C14.104,15,15,14.104,15,13V4C15,2.896,14.104,2,13.001,2z M14,14H1V3h13V14z"/>',
                                                bar: '<path fill-rule="evenodd" clip-rule="evenodd" d="M8.625,5h-2.25v8h2.25V5z M13.001,2H2C0.896,2,0,2.896,0,4v9c0,1.104,0.896,2,2,2h11C14.104,15,15,14.104,15,13V4C15,2.896,14.104,2,13.001,2zM14,14H1V3h13V14zM5,9H3v4h2V9z M12.001,7H10v6h2.001V7z"/>',
                                                pie: '<path fill-rule="evenodd" clip-rule="evenodd" d="M6.735,9.265c-0.06,0,0.766-6.118,0.765-6.118C3.832,2.775,1,5.797,1,9.071C1,12.346,3.655,15,6.929,15c3.273,0,6.087-2.716,5.925-6.5C12.849,8.38,6.784,9.265,6.735,9.265z M8.981,2C8.947,2,8.338,7.735,8.265,7.735C8.272,7.735,14,7.05,14,7.019C14,4.303,11.697,2,8.981,2z"/>'
                                            },
                                            iconStyle: {},
                                            type: ['line', 'bar', 'pie']

                                        },
                                        selfButtons: {//自定义按钮 danielinbiti,这里增加，selfbuttons可以随便取名字
                                            show: true,//是否显示
                                            title: '自定义', //鼠标移动上去显示的文字
                                            icon: '/images/grid/summary_a.svg', //图标
                                            option: {},
                                            onclick: function (option1) {//点击事件,这里的option1是chart的option信息
                                                console.log(option1)//这里可以加入自己的处理代码，切换不同的图形
                                            }
                                        }
                                    }
                                }
                            };
                            if (!scope.options) return null;
                            option.title = scope.options.title;
                            option.legend = scope.options.legend;
                            if (type == 'pie') {
                                option.tooltip = {
                                    trigger: 'item',
                                    formatter: "{a} <br/>{b} : {c} ({d}%)"
                                };
                                if (scope.options.color) {
                                    option.color = scope.options.color;
                                }
                                ;
                                option.toolbox = {show: false};
                                option.series = [];
                                scope.options.series.forEach(function (ser) {
                                    option.series.push(ser);
                                });
                            } else {
                                if (scope.options.tooltip) {
                                    option.tooltip = scope.options.tooltip;
                                }
                                if (scope.options.dataZoom) {
                                    option.dataZoom = scope.options.dataZoom;
                                }
                                if (scope.options.toolbox) {
                                    option.toolbox = scope.options.toolbox;
                                }
                                option.xAxis = scope.options.xAxis;
                                if (option.xAxis[0])
                                    option.xAxis[0].boundaryGap = false;
                                option.yAxis = [];
                                scope.options.yAxis.forEach(function (_yAxis) {
                                    _yAxis.type = 'value';
                                    if (_yAxis.formatter && _yAxis.formatter == '%') {
                                        _yAxis.min = 0;
                                        _yAxis.max = 100;
                                    } else {

                                    }
                                    _yAxis.axisLabel = {
                                        formatter: '{value} ' + (_yAxis.formatter ? _yAxis.formatter : ''),
                                        textStyle:{ fontSize:chartFontSize}
                                    };
                                    option.yAxis.push(_yAxis);
                                });
                                option.series = [];
                                option.grid = scope.options.grid;
                                scope.options.series.forEach(function (ser) {
                                    ser.type = type;
                                    option.series.push(ser);
                                });
                            }
                            option.needInit = scope.options.needInit;
                            return option;
                        }
                    }
                }
            }]);
        })(types[i]);
    }
});
