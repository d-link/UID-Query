/**
 * Created by lizhimin on 2016/7/12.
 */
define(['directiveModule'], function (directives) {
    directives.factory('green', function () {

        return {
            // 默认色板
            color: [
                '#3fcab7', '#f36a6a', '#bbbbbb', '#408829', '#68a54a', '#a9cba2', '#86b379',
                '#397b29', '#8abb6f', '#759c6a', '#bfd3b7'
            ],

            // 图表标题
            title: {
                x: 'left',
                padding: 14,
                textAlign: 'left ',
                textStyle: {
                    color: '#444',
                    fontWeight: 'normal',
                    fontSize: 12
                }
            },
            // 图例
            legend: {
                show: true,
                selectedMode: false,
                itemGap: 16,               // 各个item之间的间隔，单位px，默认为10
                itemWidth: 16,             // 图例图形宽度
                itemHeight: 12,            // 图例图形高度
                padding: 14,
                textStyle: {
                    color: '#444',         // 图例文字颜色
                    fontSize: 12
                }
            },
            // 值域
            dataRange: {
                color: ['#1f610a', '#97b58d']
            },

            // toolbox: {
            //     show: true,
            //     orient: 'vertical',
            //     iconStyle: {
            //         normal: {
            //             color: ['#ccc','#1e90ff','#22bb22','#4b0082','#d2691e']
            //         },
            //         emphasis: {
            //             color: 'red'
            //         }
            //     },
            //     // color : ['#ccc','#1e90ff','#22bb22','#4b0082','#d2691e'],
            //     padding: 5,                // 工具箱内边距，单位px，默认各方向内边距为5，
            //                                // 接受数组分别设定上右下左边距，同css
            //     itemGap: 10,               // 各个item之间的间隔，单位px，默认为10，
            //                                // 横向布局时为水平间隔，纵向布局时为纵向间隔
            //     itemSize: 16,              // 工具箱图形宽度
            //     featureImageIcon : {},     // 自定义图片icon
            //     featureTitle : {
            //         mark : '辅助线开关',
            //         markUndo : '删除辅助线',
            //         markClear : '清空辅助线',
            //         dataZoom : '区域缩放',
            //         dataZoomReset : '区域缩放后退',
            //         dataView : '数据视图',
            //         lineChart : '折线图切换',
            //         barChart : '柱形图切换',
            //         restore : '还原',
            //         saveAsImage : '保存为图片'
            //     }
            // },

            // 提示框
            tooltip: {
                //triggerOn: 'click',
                confine:true,//在移动端，提示框中的内容如果长了就会移动到窗口外，所以该参数是限制提示框始终在窗口内
                backgroundColor: 'rgba(255,255,255,0.8)',
                trigger: 'axis',
                padding: 10,
                axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                    type: 'none'          // 默认为直线，可选为：'line' | 'shadow'
                },
                textStyle: {
                    color: '#777',
                    fontSize: 12
                },
                extraCssText: 'box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.3);'
            },

            // 区域缩放控制器
            dataZoom: {
                backgroundColor: '#fff',       // 背景颜色
                dataBackgroundColor: '#f5f5f5',            // 数据背景颜色
                fillerColor: 'rgba(0,0,0,0.04)',   // 填充颜色
                handleColor: '#ccc',     // 手柄颜色
                height: 24
            },
            //网格
            grid: {
                borderWidth: 1,
                borderColor: '#f5f5f5',
                x: 50,
                y: 50,
                x2: 30,
                y2: 50
            },

            // 类目轴
            categoryAxis: {
                axisLine: {            // 坐标轴线
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#dddddd',
                        width: 1
                    }
                },
                axisLabel: {
                    interval: 0,
                    rotate: 30,
                    textStyle: {
                        fontSize: 12,
                        color: '#999'
                    },
                   /* formatter: function (c) {
                        for (i in c) {
                            if (c.length > 8) {
                                return c.substring(0, 6) + '...';
                            } else {
                                return c;
                            }
                        }
                    }*/
                },
                splitLine: {           // 分隔线
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: ['#f5f5f5']
                    }
                },
                axisTick: {
                    show: false
                }
            },

            // 数值型坐标轴默认参数
            valueAxis: {

                axisLine: {            // 坐标轴线
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#dddddd',
                        width: 1
                    }
                },
            /*    splitArea: {
                    show: false,
                    areaStyle: {
                        color: ['rgba(250,250,250,0.1)', 'rgba(200,200,200,0.1)']
                    }
                },*/
                splitLine: {           // 分隔线
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: ['#f5f5f5']
                    }
                },
                axisTick: {
                    show: false
                },
                axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
                    show: true,
                    rotate: 0,
                    // formatter: null,
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        fontSize: 12,
                        color: '#999'
                    }
                },
                minInterval: 1
            },

            timeline: {
                lineStyle: {
                    color: '#408829'
                },
                controlStyle: {
                    normal: {color: '#408829'},
                    emphasis: {color: '#408829'}
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
            },
            // 柱形图默认参数
            bar: {
                barMinHeight: 0,          // 最小高度改为0
                // barWidth: null,        // 默认自适应
                // barGap: '30%',            // 柱间距离，默认为柱形宽度的30%，可设固定值
                // barCategoryGap : '20%',   // 类目间柱形距离，默认为类目间距的20%，可设固定值
                boundaryGap: [0, 0],
                barWidth: 16,
                itemStyle: {
                    normal: {
                        // color: '各异',
                        barBorderColor: '#fff',       // 柱条边线
                        barBorderRadius: 4,           // 柱条边线圆角，单位px，默认为0
                        barBorderWidth: 0,            // 柱条边线线宽，单位px，默认为0
                        label: {
                            show: false
                            // position: 默认自适应，水平布局为'top'，垂直布局为'right'，可选为
                            //           'inside'|'left'|'right'|'top'|'bottom'
                            // textStyle: null      // 默认使用全局文本样式，详见TEXTSTYLE
                        }
                    },
                    emphasis: {
                        // color: '各异',
                        barBorderColor: 'rgba(0,0,0,0)',   // 柱条边线
                        barBorderRadius: 4,                // 柱条边线圆角，单位px，默认为0
                        barBorderWidth: 0,                 // 柱条边线线宽，单位px，默认为1
                        label: {
                            show: false
                            // position: 默认自适应，水平布局为'top'，垂直布局为'right'，可选为
                            //           'inside'|'left'|'right'|'top'|'bottom'
                            // textStyle: null      // 默认使用全局文本样式，详见TEXTSTYLE
                        }
                    }
                }
            },
            // 折线图默认参数
            line: {
                boundaryGap: false,
                itemStyle: {
                    normal: {
                        // color: 各异,
                        label: {
                            show: false
                            // position: 默认自适应，水平布局为'top'，垂直布局为'right'，可选为
                            //           'inside'|'left'|'right'|'top'|'bottom'
                            // textStyle: null      // 默认使用全局文本样式，详见TEXTSTYLE
                        }
                    },
                    emphasis: {
                        // color: 各异,
                        label: {
                            show: false
                            // position: 默认自适应，水平布局为'top'，垂直布局为'right'，可选为
                            //           'inside'|'left'|'right'|'top'|'bottom'
                            // textStyle: null      // 默认使用全局文本样式，详见TEXTSTYLE
                        }
                    }
                },
                lineStyle: {
                    normal: {
                        width: 1.5,
                        type: 'solid',
                        shadowColor: 'rgba(0,0,0,0)', //默认透明
                        shadowBlur: 1
                    }
                },
               // smooth: true,
                //symbol: null,         // 拐点图形类型
              //  symbolSize: 2,          // 拐点图形大小
                //symbolRotate : null,  // 拐点图形旋转控制
               // showAllSymbol: false    // 标志图形默认只有主轴显示（随主轴标签间隔隐藏策略）
            },
            pie: {
                center: ['50%', '50%'],    // 默认全局居中
                radius: ['40%', '85%'],
                clockWise: false,          // 默认逆时针
                startAngle: 90,
                minAngle: 0,                // 最小角度改为0
                selectedOffset: 10,         // 选中是扇区偏移量
                itemStyle: {
                    normal: {
                        // color: 各异,
                        borderColor: '#fff',
                        borderWidth: 2,
                        label: {
                            show: true,
                            position: 'outer'
                            // textStyle: null      // 默认使用全局文本样式，详见TEXTSTYLE
                        },
                        labelLine: {
                            show: true,
                            length: 20,
                            lineStyle: {
                                // color: 各异,
                                width: 1,
                                type: 'solid'
                            }
                        }
                    },
                    emphasis: {
                        // color: 各异,
                        borderColor: 'rgba(0,0,0,0)',
                        borderWidth: 1,
                        label: {
                            show: false
                            // position: 'outer'
                            // textStyle: null      // 默认使用全局文本样式，详见TEXTSTYLE
                        },
                        labelLine: {
                            show: false,
                            length: 20,
                            lineStyle: {
                                // color: 各异,
                                width: 1,
                                type: 'solid'
                            }
                        }
                    }
                },
                calculable: false
            }

        };

    });
});