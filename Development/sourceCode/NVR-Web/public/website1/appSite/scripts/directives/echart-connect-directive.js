/**
 * Created by lizhimin on 2016/7/18.
 */
define(['directiveModule', 'echarts','echart-theme'], function (directives, echarts, barChart) {

    directives.directive('connectChart', ['$http','theme', function ($http,theme) {
        return {
            restrict: 'EA',
            template: '<div><div class="chart" width="440px" height="280px" ng-repeat="option in options" ></div></div>',
            replace: true,
            scope: {
                options: '=',
                size: '=',
                theme:'='
            },
            link: getLinkFunction(theme)
        };
        function getLinkFunction(theme) {

            return function (scope, element, attrs) {
                scope.size = scope.size || {};

                function getSizes(config) {
                    if(!config) config={};
                    width = config.width || parseInt(attrs.width) || 320;
                    height = config.height || parseInt(attrs.height) || 240;

                    element[0].style.width = width + 'px';
                    var els= element[0].getElementsByClassName('chart');
                    for(var i=0;i<els.length;i++){
                        els[i].style.height=height + 'px';
                    }
                }

                // 基于准备好的dom，初始化echarts图表
                var myChart=[];
                //监听options变化
                scope.$watch('options',function () {
                    getSizes(scope.size);
                    myChart=[];
                    var els= element[0].getElementsByClassName('chart');
                    for(var i=0;i<scope.options.length;i++){
                        var chart= echarts.init(els[i], theme.get(scope.theme || 'blue'));
                        var options = getOptions(scope.options[i]);
                        if(options){
                            chart.setOption(options);
                        }
                        myChart.push(chart);
                    }
                    for(var k=0;k<myChart.length;k++){
                        var temp=[];
                        angular.copy(myChart,temp);
                        temp.splice(k,1);
                        myChart[k].connect(temp);
                    }

                }, true);
                scope.$watch('size', function () {
                    getSizes(scope.size);
                    for(var k=0;k<myChart.length;k++){
                        myChart[k].resize();
                    }


                }, true);
                scope.$watch('theme',function () {

                    for(var k=0;k<myChart.length;k++){
                        myChart[k].setTheme(theme.get(scope.theme || 'blue'));
                    }

                }, true);
                function getOptions(_option) {
                    var option = {  };
                    if(!_option) return null;
                    if(_option.title){
                        option.title = _option.title;
                    }
                    option.legend = _option.legend;
                    if (_option.type == 'pie') {
                        option.tooltip = {
                            trigger: 'item',
                            formatter: "{a} <br/>{b} : {c} ({d}%)"
                        };
                        option.toolbox = {show: false};
                        option.series = [];
                        _option.series.forEach(function (ser) {
                            option.series.push(ser);
                        });
                    } else {
                        if (_option.dataZoom) {
                            option.dataZoom = _option.dataZoom;
                        }
                        if(_option.toolbox){
                            option.toolbox = _option.toolbox;
                        }
                        option.xAxis=_option.xAxis;
                        option.yAxis = [];
                        _option.yAxis.forEach(function (yAxis) {
                            var x = {
                                type: 'value',
                                axisLabel: {
                                    formatter: '{value} ' + (yAxis.formatter?yAxis.formatter:'')
                                }
                            };
                            option.yAxis.push(x);
                        });
                        option.series = [];
                        _option.series.forEach(function (ser) {
                            ser.type=_option.type;
                            option.series.push(ser);
                        });
                    }
                    return option;
                }
            }
        }
    }]);
});
