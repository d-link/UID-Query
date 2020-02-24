/**
 * Created by lizhimin on 2016/7/12.
 */
define(['directiveModule'], function (directives) {
    directives.factory('orange', function () {

        return {
            // 默认色板
            color: [
                '#d8361b','#f16b4c','#f7b4a9','#d26666',
                '#99311c','#c42703','#d07e75'
            ],

            // 图表标题
            title: {
                itemGap: 8,
                textStyle: {
                    fontWeight: 'normal',
                    color: '#d8361b'
                }
            },

            // 值域
            dataRange: {
                color:['#bd0707','#ffd2d2']
            },

            // 工具箱
            toolbox: {
                color: ['#d8361b','#d8361b','#d8361b','#d8361b']
            },

            // 提示框
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.5)',
                axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                    type: 'line',         // 默认为直线，可选为：'line' | 'shadow'
                    lineStyle: {          // 直线指示器样式设置
                        color: '#d8361b',
                        type: 'dashed'
                    },
                    crossStyle: {
                        color: '#d8361b'
                    },
                    shadowStyle: {                     // 阴影指示器样式设置
                        color: 'rgba(200,200,200,0.3)'
                    }
                }
            },

            // 区域缩放控制器
            dataZoom: {
                dataBackgroundColor: '#eee',            // 数据背景颜色
                fillerColor: 'rgba(216,54,27,0.2)',   // 填充颜色
                handleColor: '#d8361b'     // 手柄颜色
            },

            grid: {
                borderWidth: 0
            },

            // 类目轴
            categoryAxis: {
                axisLine: {            // 坐标轴线
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#d8361b'
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
                        color: '#d8361b'
                    }
                },
                splitArea: {
                    show: true,
                    areaStyle: {
                        color: ['rgba(250,250,250,0.1)','rgba(200,200,200,0.1)']
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
                    color: '#d8361b'
                },
                controlStyle: {
                    normal: { color: '#d8361b'},
                    emphasis: { color: '#d8361b'}
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