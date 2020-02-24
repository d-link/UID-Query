/**
 * Created by lizhimin on 2018/7/20.
 */
define(['directiveModule'], function (directives) {
    directives.directive('cwmbarChart', function () {
        return {
            restrict: 'EA',
            template: "<div ><canvas  width='100%' height='100%'  background-color: #F00'/><div style='display:none;position:absolute;background:rgba(255,255,255,0.9);" +
            "border-radius: 4px;border: 1px solid #ddd;padding: 8px;'></div></div>",
            replace: true,
            scope: {
                options: '=',
                size: '=',
                theme: '='
            },
            link: function (scope, element, attrs) {
                var bars = [];
                var dataArr = scope.options.series;
                var linex = dataArr.length;
                // 声明所需变量
                var canvas, ctx;
                // 图表属性
                var cWidth, cHeight, cMargin, cSpace;
                var originX, originY;
                // 柱状图属性
                var bMargin, tobalBars, bWidth, maxValue;
                var totalYNomber;
                var gradient;
                var totalNumber = 1;
                // 运动相关变量
                var ctr, numctr, speed;
                //鼠标移动
                var mousePosition = {};
                var font="normal 12px 微软雅黑, Arial, Verdana, sans-serif";
                if(scope.theme){
                    font="normal 12px "+ scope.theme.textStyle.fontFamily;
                }
                function getFont() {
                    return font;
                }

                // 获得canvas上下文
                //  canvas = element.find('canvas')[0];
                canvas = element[0].firstChild;
                var tipdiv = element[0].lastChild
                ctx = canvas.getContext('2d');
                if (canvas && canvas.getContext) {
                    canvas.width = scope.size.width;
                    canvas.height = scope.size.height;
                }
                scope.$watch('options.series', function () {
                    dispose();

                    initChart(); // 图表初始化
                    drawLineLabelMarkers(); // 绘制图表轴、标签和标记
                });
                scope.$watch('size', function () {
                    if (canvas && canvas.getContext) {
                        canvas.width = scope.size.width;
                        canvas.height = scope.size.height;
                    }
                    initChart(); // 图表初始化
                    drawLineLabelMarkers(); // 绘制图表轴、标签和标记
                });
                scope.$watch('theme', function () {
                    if (canvas && canvas.getContext) {
                        canvas.width = scope.size.width;
                        canvas.height = scope.size.height;
                    }
                    if(scope.theme){
                        font="normal 12px "+ scope.theme.textStyle.fontFamily;
                    }
                    initChart(); // 图表初始化
                    drawLineLabelMarkers(); // 绘制图表轴、标签和标记
                });
                function dispose() {
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.clearRect(0, 0, canvas.width,
                        canvas.height);
                    ctx.fillStyle = "#fff";
                    /*  ctx.rect(0, 0, canvas.width,
                     canvas.height);
                     ctx.fill();*/
                    ctx.restore();
                }

                // 图表初始化
                function initChart() {
                    bars = [];
                    dataArr = scope.options.series;
                    linex = dataArr.length;
                    // 图表信息
                    cMargin = 36;
                    cSpace = 16;
                    cHeight = canvas.height - cMargin * 2 - 8;
                    cWidth = canvas.width - cMargin * 2 - cSpace;
                    originX = cMargin + cSpace;
                    originY = cMargin / linex + cHeight / linex + 8;

                    // 柱状图信息
                    bMargin = 20;

                    tobalBars = dataArr[0].length;
                    bWidth = parseInt(cWidth / scope.options.maxBar - bMargin);
                    if (bWidth < 6)bWidth = 6;
                    maxValue = scope.options.maxValue;
                    totalNumber = 0;
                    for (var i = 0; i < dataArr.length; i++) {
                        for (var j = 0; j < tobalBars; j++) {
                            var barVal = parseInt(dataArr[i][j][1]);
                            totalNumber += barVal;
                        }
                    }
                    var mode = maxValue % 15;
                    maxValue = maxValue + 30 - mode;

                    //  maxValue += 80;
                    totalYNomber = 3;
                    // 运动相关
                    ctr = 1;
                    numctr = 100;
                    speed = 10;


                    //柱状图渐变色
                    gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, '#22b7db');
                    gradient.addColorStop(1, 'rgba(67,203,36,1)');
                }


                // 绘制图表轴、标签和标记
                function drawLineLabelMarkers() {


                    if (linex == 1) {
                        ctx.translate(0.5, 0.5);  // 当只绘制1像素的线的时候，坐标点需要偏移，这样才能画出1像素实线
                        // x轴
                        drawLine(originX, originY, originX + cWidth, originY);
                        // Y轴
                        drawLine(originX, originY, originX, originY - cHeight);
                        drawGrid(originX, originY, cWidth, cHeight, 3, 25);
                        ctx.translate(-0.5, -0.5);  // 还原位置
                        // 绘制标记
                        drawMarkers(0);
                        drawBarAnimate(0);
                    } else {
                        for (var i = 0; i < linex; i++) {
                            ctx.translate(0.5, 0.5);
                            drawLine(originX, originY, originX + cWidth, originY);
                            // Y轴
                            drawLine(originX, originY, originX, originY - cHeight);
                            drawGrid(originX, originY, cWidth, cHeight, 3, 25);
                            ctx.translate(-0.5, -0.5);  // 还原位置
                            // 绘制标记
                            drawMarkers(i);
                            drawBarAnimate(i);

                            originY += cHeight / linex + cMargin / linex;
                        }
                    }


                }

                function drawGrid(x, y, w, h, row, colum) {
                    var rowH = h / row;
                    var columW = w / colum;
                    for (var i = 1; i <= row; i++) {
                        drawGridLine(originX, originY - rowH * i, originX + cWidth, originY - rowH * i);
                    }
                    for (var i = 1; i <= colum; i++) {
                        drawGridLine(originX + columW * i, originY, originX + columW * i, originY - cHeight);
                    }
                    function drawGridLine(x, y, X, Y) {
                        ctx.save();
                        ctx.font = getFont();
                        ctx.lineWidth = 1;
                        ctx.fillStyle = "#f5f5f5";
                        ctx.strokeStyle = "#f5f5f5";
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(X, Y);
                        ctx.stroke();
                        ctx.closePath();
                        ctx.restore();
                    }
                }

                // 画线的方法
                function drawLine(x, y, X, Y) {
                    ctx.save();
                    ctx.font = getFont();
                    ctx.lineWidth = 1;
                    ctx.fillStyle = "#dddddd";
                    ctx.strokeStyle = "#dddddd";
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(X, Y);
                    ctx.stroke();
                    ctx.closePath();
                    ctx.restore();
                }

                // 绘制标记
                function drawMarkers(line) {
                    ctx.save();
                    ctx.font = getFont();
                    ctx.fillStyle = "#999";
                    ctx.strokeStyle = "#999";
                    // 绘制 y
                    var oneVal = parseInt(maxValue / totalYNomber);
                    ctx.textAlign = "right";
                    for (var i = 0; i <= totalYNomber; i++) {
                        var markerVal = i * oneVal;
                        var xMarker = originX - 8;
                        var yMarker = originY - ( cHeight * i / totalYNomber ) + 3;
                        //console.log(xMarker, yMarker+3,markerVal/maxValue,originY);
                        ctx.fillText(markerVal, xMarker, yMarker, cSpace); // 文字

                    }
                    // 绘制 x
                    ctx.textAlign = "center";
                    var wwidth = cWidth / scope.options.maxBar;
                    for (var i = 0; i < tobalBars; i++) {
                        var markerVal = dataArr[line][i][0];
                        var xMarker = parseInt(originX + wwidth * i + (cMargin + bWidth) / 2);
                        var yMarker = originY + 20;
                        var ss = ctx.measureText(markerVal).width / 2;
                        ctx.fillText(markerVal, xMarker - ss, yMarker, cSpace); // 文字

                    }
                    ctx.restore();

                    ctx.save();
                    ctx.font = getFont();
                    ctx.fillStyle = "#444";
                    ctx.strokeStyle = "#444";
                    // 绘制标题 x
                    var ww = ctx.measureText(scope.options.title).width;
                    ctx.fillText(scope.options.title, originX - cSpace, 22);
                    ctx.restore();
                };
                //绘制柱形图
                function drawBarAnimate(line, mouseMove) {
                    ctx.save();
                    ctx.font = getFont();
                    ctx.fillStyle = "#444";
                    ctx.strokeStyle = "#444";
                    var wwidth = cWidth / scope.options.maxBar;
                    for (var i = 0; i < tobalBars; i++) {
                        var oneVal = parseInt(maxValue / totalYNomber);
                        var barVal = dataArr[line][i][1];
                        var barH = parseInt(cHeight * barVal / maxValue);
                        var y = originY - barH;
                        var x = originX + (wwidth) * i + bMargin / 2;
                        var xMarker = parseInt(originX + cWidth * (i / tobalBars) + bMargin + bWidth / 2);
                        var percent = barVal * 100 / totalNumber;
                        percent = percent ? parseInt(percent) : 0;
                        if (barVal > 0) {
                            var bar = {
                                x: x,
                                y: y,
                                width: bWidth,
                                height: barH,
                                name: dataArr[line][i][0],
                                count: barVal,
                                percent: percent
                            };
                            bars.push(bar);
                            drawRect(x, y, bWidth, barH, mouseMove);  //高度减一避免盖住x轴
                            var ww = ctx.measureText(barVal).width;
                            ctx.fillText(barVal, x + bWidth / 2 - ww / 2, y - 4, cSpace); // 文字
                        }


                    }
                    ctx.restore();
                    /*  if(ctr<numctr){
                     ctr++;
                     setTimeout(function(){
                     ctx.clearRect(0,0,canvas.width, canvas.height);
                     drawLineLabelMarkers();
                     drawBarAnimate();
                     }, speed);
                     }*/
                }

                function roundRect(x, y, w, h, r) {
                    if (w < 2 * r) r = w / 2;
                    if (h < 2 * r) r = h / 2;
                    ctx.beginPath();
                    ctx.moveTo(x, y + h);
                    ctx.lineTo(x, y + r);
                    ctx.arcTo(x, y, x + r, y, r);
                    ctx.lineTo(x + w - r, y);
                    ctx.arcTo(x + w, y, x + w, y + r, r);
                    ctx.lineTo(x + w, y + h);
                    ctx.lineTo(x, y + h);
                    ctx.closePath();
                }

                //绘制方块
                function drawRect(x, y, w, h, mouseMove) {

                    ctx.save();

                    //  ctx.rect( x, y, X, Y );
                    if (mouseMove && ctx.isPointInPath(mousePosition.x, mousePosition.y)) { //如果是鼠标移动的到柱状图上，重新绘制图表
                        ctx.fillStyle = "#22b7db";
                    } else {
                        ctx.fillStyle = "#22b7db";
                        ctx.strokeStyle = "#22b7db";
                    }
                    roundRect(x, y, w, h, 6);
                    ctx.stroke();
                    ctx.fill();
                    ctx.closePath();
                    ctx.restore();
                }

                var mouseTimer = null;
                canvas.addEventListener("mousemove", function (e) {
                    e = e || window.event;
                    e.preventDefault();
                    tipdiv.style.display = "none";
                    var loc = windowToCanvas(e.clientX, e.clientY);
                    for (var i = 0; i < bars.length; i++) {
                        var bar = bars[i];
                        if (loc.x < bar.x + bar.width && loc.x > bar.x && loc.y < bar.y + bar.height && loc.y > bar.y) {
                            var bbox = canvas.getBoundingClientRect();
                            var width = bbox.width;
                            var left = loc.x + 10;
                            if (left + 110 < width) {
                                tipdiv.style.left = left + "px";
                            } else {
                                tipdiv.style.left = (left - 110) + "px";
                            }
                            tipdiv.style.top = loc.y + "px";
                            tipdiv.className = "heattip";
                            tipdiv.style.display = "inline";
                            tipdiv.style.zIndex = 999;
                            var html = "<p style='margin:0'>Channel " + bar.name + ":<span  style='    font-size: 12px;color: #ef9612;    margin-left: 8px;'>" + bar.count + "</span>, <span  style='    font-size: 12px;color: #ef9612;    margin-left: 8px;'>" + bar.percent + "%</span></p>";
                            tipdiv.innerHTML = html;
                            break;
                        }
                    }
                });
                function windowToCanvas(x, y) {
                    var bbox = canvas.getBoundingClientRect();
                    return {
                        x: ((x - bbox.left) * (canvas.width / bbox.width)),
                        y: ((y - bbox.top) * (canvas.height / bbox.height))
                    };
                };
            }
        };
    });
});