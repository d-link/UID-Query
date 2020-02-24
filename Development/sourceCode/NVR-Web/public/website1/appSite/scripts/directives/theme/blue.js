/**
 * Created by lizhimin on 2016/7/12.
 */
define(['directiveModule'], function (directives) {
    directives.factory('blue', function () {

        return {
            // 默认色板
            color: [
                '#1790cf', '#1bb2d8', '#99d2dd', '#88b0bb',
                '#1c7099', '#038cc4', '#75abd0', '#afd6dd'
            ],

            // 图表标题
            title: {
                itemGap: 8,
                textStyle: {
                    fontWeight: 'normal',
                    color: '#1790cf'
                }
            },

            // 值域
            dataRange: {
                color: ['#1178ad', '#72bbd0']
            },

            // 工具箱
            toolbox: {
                color: ['#1790cf', '#1790cf', '#1790cf', '#1790cf']
            },

            // 提示框
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.5)',
                axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                    type: 'line',         // 默认为直线，可选为：'line' | 'shadow'
                    lineStyle: {          // 直线指示器样式设置
                        color: '#1790cf',
                        type: 'dashed'
                    },
                    crossStyle: {
                        color: '#1790cf'
                    },
                    shadowStyle: {                     // 阴影指示器样式设置
                        color: 'rgba(200,200,200,0.3)'
                    }
                }
            },

            // 区域缩放控制器
            dataZoom: {
                dataBackgroundColor: '#eee',            // 数据背景颜色
                fillerColor: 'rgba(144,197,237,0.2)',   // 填充颜色
                handleColor: '#1790cf'     // 手柄颜色
            },

            grid: {
                borderWidth: 0
            },

            // 类目轴
            categoryAxis: {
                axisLine: {            // 坐标轴线
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#1790cf'
                    }
                },
                splitLine: {           // 分隔线
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: ['#eee']
                    }
                }
            },

            // 数值型坐标轴默认参数
            valueAxis: {
                axisLine: {            // 坐标轴线
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#1790cf'
                    }
                },
                splitArea: {
                    show: true,
                    areaStyle: {
                        color: ['rgba(250,250,250,0.1)', 'rgba(200,200,200,0.1)']
                    }
                },
                splitLine: {           // 分隔线
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: ['#eee']
                    }
                }
            },

            timeline: {
                lineStyle: {
                    color: '#1790cf'
                },
                controlStyle: {
                    normal: {color: '#1790cf'},
                    emphasis: {color: '#1790cf'}
                }
            },

            force: {
                itemStyle: {
                    normal: {
                        linkStyle: {
                            strokeColor: '#1790cf'
                        }
                    }
                }
            },
            textStyle: {
                fontFamily: '微软雅黑, Arial, Verdana, sans-serif'
            }
        };

    });
});
