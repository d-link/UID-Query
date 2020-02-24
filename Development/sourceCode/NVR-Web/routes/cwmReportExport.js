/**
 * Report导出相关的路由服务
 * Created by GongChen on 2018.3.22
 **/
'use strict';

const PDFDocument = require('pdfkit');
const stats = require("../cwmcontroller/stats");
const org = require("../cwmcontroller/org");
const util = require("../lib/util");
const db = util.db;
const systemCli = util.common.systemCli;
const fs = require("fs");
const path = require('path');
let fontPath = path.join(__dirname, '../public/website1/public/fonts/simsun.ttf');
/**
 * A4纸的相关信息
 */
const a4PageInfo = {
    width: 595.28,
    height: 841.89,
    validHeight: 710,
    statrY: 40
};

/**
 * 图片相关的配置
 */
const imgConfig = {
    height: 115
};

/**
 * 间距相关配置
 */
const gapConfig = {
    one_two_title_gap: 40,
    two_two_title_gap: 20,
    two_three_title_gap: 60,
    three_four_title_gap: 20,
    four_four_title_gap: 15
};

/**
 * 表格相关配置
 */
const tableConfig = {
    width: a4PageInfo.width - 80,   //表格宽度
    rowHeight: 20                   //行高
};

function createCustomerDic() {
    let customerDir = `${process.cwd()}/customer`;
    if (!fs.existsSync(customerDir)) {
        fs.mkdirSync(customerDir);
    }
};
/**
 * 获取需要导到PDF的热点相关数据
 */
function getHotTimePDFData(uniqueClients, trafficUsage, userName, params, uuids, callback) {
    var hotTimePDFData = {
        siteStr: params.siteStr,
        networkStr: params.networkStr,
        userName: userName,
        mostClients: {
            threshold: uniqueClients.threshold,
            probability: uniqueClients.probability,
            tableData: [
                ["Date", "Timestamp", "Unique Clients"]
            ]
        },
        mostTraffic: {
            threshold: trafficUsage.threshold,
            thresholdUnit: trafficUsage.thresholdUnit,
            probability: trafficUsage.probability,
            tableData: [
                ["Date", "Timestamp", "Traffic Usage(MB)"]
            ]
        }
    };
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        callback(null, hotTimePDFData);
    }
    else {
        stats.getHotTimeUniqueClient(params, uuids, function (err, data) {
            if (err) {
                callback(err);
            } else {
                data.sort((a, b)=> {
                    if (a[2] == b[2]) {
                        if (a[0] == b[0])return 0;
                        if (a[0] > b[0]) return 1;
                        if (a [0] < b[0]) return -1;
                        return 0;
                    }
                    if (a[2] > b[2]) return 1;
                    if (a [2] < b[2]) return -1;
                    return 0;
                })
                for (let i = 0; i < data.length; i++) {
                    let utc = util.datetimeToUTCStamp({binDate:data[i][2],timestamp:data[i][0]});
                    data[i][2] = utc.binDate;
                    data[i][0] = utc.timestamp;
                    hotTimePDFData.mostClients.tableData.push([getDateStr(data[i][2]), getTimeStr(data[i][0]), data[i][1]]);
                }
                stats.getHotTimeTrafficUsage(params, uuids, function (err, data) {
                    if (err) {
                        callback(err);
                    } else {
                        data.data.sort((a, b)=> {
                            if (a[2] == b[2]) {
                                if (a[0] == b[0])return 0;
                                if (a[0] > b[0]) return 1;
                                if (a [0] < b[0]) return -1;
                                return 0;
                            }
                            if (a[2] > b[2]) return 1;
                            if (a [2] < b[2]) return -1;
                            return 0;
                        })
                        hotTimePDFData.mostTraffic.tableData[0][2] = "Traffic Usage(" + data.unit + ")";
                        for (let i = 0; i < data.data.length; i++) {
                            let utc = util.datetimeToUTCStamp({binDate:data.data[i][2],timestamp:data.data[i][0]});
                            data.data[i][2] = utc.binDate;
                            data.data[i][0] = utc.timestamp;
                            hotTimePDFData.mostTraffic.tableData.push([getDateStr(data.data[i][2]), getTimeStr(data.data[i][0]), data.data[i][1]]);
                        }
                        callback(null, hotTimePDFData);
                    }
                });
            }
        });
    }
}
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

/**
 * get the data that it will be added to hourly pdf file
 */
function getHourlyPDFData(curDate, userName, params, uuids, callback) {
    var hourlyPDFData = {
        siteStr: params.siteStr,
        networkStr: params.networkStr,
        userName: userName,
        uniqueClients: {
            curDate: curDate,
            tableData: [
                ["Timestamp", "Average Value", "High Value", "Value"]
            ]
        },
        trafficUsage: {
            curDate: curDate,
            tableData: [
                ["Timestamp", "Average Value", "High Value", "Value(MB)"]
            ]
        }
    };
    for (var i = 0; i < 24; i++) {
        let timestamp = (i < 10 ? "0" + i : i) + ":00";
        hourlyPDFData.uniqueClients.tableData.push([timestamp]);
        hourlyPDFData.trafficUsage.tableData.push([timestamp]);
    }
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        callback(null, hourlyPDFData);
    }
    else {
        stats.getUniqueClientsHourlyThreshold(params, uuids, function (err, data) {
            if (err) {
                callback(err);
            } else {
                for (let i = 0; i < data.average.length; i++) {
                    hourlyPDFData.uniqueClients.tableData[i + 1].push(data.average[i]);
                    hourlyPDFData.uniqueClients.tableData[i + 1].push(data.high[i]);
                }
                stats.getTrafficHourlyThreshold(params, uuids, function (err, data) {
                    if (err) {
                        callback(err);
                    } else {
                        hourlyPDFData.trafficUsage.tableData[0][1] = "Average Value(" + data.unit + ")";
                        hourlyPDFData.trafficUsage.tableData[0][2] = "High Value(" + data.unit + ")";
                        for (let i = 0; i < data.data.average.length; i++) {
                            hourlyPDFData.trafficUsage.tableData[i + 1].push(data.data.average[i]);
                            hourlyPDFData.trafficUsage.tableData[i + 1].push(data.data.high[i]);
                        }
                        stats.getUniqueClientsHourlyByDay(params, uuids, function (err, data) {
                            if (err) {
                                callback(err);
                            } else {
                                for (let i = 0; i < 24; i++) {
                                    if(i<data.length){
                                        hourlyPDFData.uniqueClients.tableData[i + 1].push(data[i]);
                                    }else{
                                        hourlyPDFData.uniqueClients.tableData[i + 1].push(0);
                                    }
                                }
                                stats.getTrafficHourlyByDay(params, uuids, function (err, data) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        hourlyPDFData.trafficUsage.tableData[0][3] = "Value(" + data.unit + ")";
                                        for (let i = 0; i < 24; i++) {
                                            if(i < data.data.length){
                                                hourlyPDFData.trafficUsage.tableData[i + 1].push(data.data[i]);
                                            }else{
                                                hourlyPDFData.trafficUsage.tableData[i + 1].push('0.00');
                                            }
                                        }
                                        callback(null, hourlyPDFData);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
}

/**
 * get the data that it will be added to daily traffic pdf file
 */
function getDailyTrafficData(scopes, userName, params, uuids, callback) {

    var scope = scopes[0] + " ～ " + scopes[scopes.length - 1];
    var dailyTraffic = {
        siteStr: params.siteStr,
        networkStr: params.networkStr,
        userName: userName,
        usageAndClients: {
            scope: scope,
            tableData: [
                ["Date", "Unique Client", "Traffic Usage(MB)"]
            ]
        }
    };
    for (let i = 0; i < scopes.length; i++) {
        dailyTraffic.usageAndClients.tableData.push([scopes[i]]);
    }
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        callback(null, dailyTraffic);
    }
    else {
        stats.getUniqueClientDaily(params, uuids, function (err, data) {
            if (err) {
                callback(err);
            } else {
                for (let i = 0; i < data.length; i++) {
                    dailyTraffic.usageAndClients.tableData[i + 1].push(data[i]);
                }
                stats.getTrafficUsageDaily(params, uuids, function (err, data) {
                    if (err) {
                        callback(err);
                    } else {
                        dailyTraffic.usageAndClients.tableData[0][2] = "Traffic Usage(" + data.unit + ")";
                        for (let i = 0; i < data.data.length; i++) {
                            dailyTraffic.usageAndClients.tableData[i + 1].push(data.data[i]);
                        }
                    }
                    callback(null, dailyTraffic);
                });
            }
        });
    }
}

/**
 * get the data that it will be added to hot time pdf file
 */
function getHotAPData(params, callback) {
    var hotAP = {
        userName: params.userName,
        area: {width: 525},
        binDate: params.networkday.str,
        timestamp: params.networkHour.str,
        uniqueClients: params.uniqueClients,
        trafficUsage: params.trafficUsage,
        tableData: [
            ["AP Name", "AP Mac", "AP IP", "Location", "Traffic Usage(" + params.trafficUsage.unit + ")", "Unique Client"]
        ]
    };
    hotAP.area.height = 525 / params.area.width * params.area.height;
    if(systemCli.getNtpStatus() != 1) { //report在未拿到NTP时或手动设置时间时，都以无资料显示
        callback(null, hotAP);
    }
    else {
        org.getHotApMap(params._id, function (err, data) {
            if (err) {
                callback(err);
            } else {
                if (data) {
                    hotAP.mapName = data.mapName;
                    let apList = [];
                    for (let i = 0; i < data.devices.length; i++) {
                        hotAP.tableData.push([data.devices[i].name, data.devices[i].apMACAddr, data.devices[i].ip, data.devices[i].location, 0, 0]);
                        apList.push(data.devices[i].apMACAddr);
                    }
                    params = {
                        apList: apList,
                        binDate: params.networkday.value,
                        timestamp: params.networkHour.value,
                        unit: params.trafficUsage.unit
                    }
                    stats.getUniqueClientsForAps(params, function (err, data) {
                        if (err) {
                            callback(err);
                        } else {
                            if (data) {
                                for (let i = 0; i < data.length; i++) {
                                    for (let j = 0; j < hotAP.tableData.length; j++) {
                                        if (hotAP.tableData[j][1] == data[i]._id) {
                                            hotAP.tableData[j][5] = data[i].count;
                                            break;
                                        }
                                    }
                                }
                            }
                            stats.getTrafficUsageForAps(params, function (err, data) {
                                if (err) {
                                    callback(err);
                                } else {
                                    if (data) {
                                        for (let i = 0; i < data.length; i++) {
                                            for (let j = 0; j < hotAP.tableData.length; j++) {
                                                if (hotAP.tableData[j][1] == data[i]._id) {
                                                    hotAP.tableData[j][4] = data[i].usage;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    callback(null, hotAP);
                                }
                            });
                        }
                    });
                }

            }
        })
    }
}

/**
 * 画表格，并根据给定的数据为表格填充数据
 * @param {*} doc PDF
 * @param {*} fontSize 字体大小
 * @param {*} startX x坐标
 * @param {*} startY y坐标
 * @param {*} width 表格宽度
 * @param {*} rowHeight 表格行高
 * @param {*} colNums 列数
 * @param {*} allRowData 行数据
 */
function drawTable(doc, fontSize, startX, startY, width, rowHeight, colNums, allRowData) {
    doc.fontSize(fontSize);
    var rowNums = allRowData.length;
    var colWidth = width / colNums;
    var curRowInPage = 0;  //在当前页中的行数
    for (var i = 0, curRowInPage = i; i < rowNums; i++) {
        //判断当前行数据是否超过了列宽
        var rowData = allRowData[i];
        var curRowNeedRowCnt = 0;   //当前行需要占用的实际行数
        for (var t = 0; t < colNums; t++) {
            var colData = String(rowData[t]);
            //如果超出当前列宽，则需要换行，原本只占有一行的变成占成多行
            var tempNeedRow = Math.ceil(colData.length * 4 / colWidth);     // 最小值为1
            //计算分成多少行
            if (tempNeedRow > curRowNeedRowCnt) {
                curRowNeedRowCnt = tempNeedRow;
            }
        }
        //添加加页的逻辑
        if (startY + (curRowInPage + curRowNeedRowCnt) * rowHeight >= a4PageInfo.validHeight) {
            doc.addPage();
            startX = 45;
            startY = a4PageInfo.statrY;
            curRowInPage = 0;
        }
        //先画一行
        doc.lineJoin('miter')
            .rect(startX, startY + curRowInPage * rowHeight, width, curRowNeedRowCnt * rowHeight)   //rect用于画矩形，rect(x, y, width, height) 其中x,y表示矩形左上角的坐标，width,height表示矩形的宽和高
            .stroke();
        //画列
        for (var k = 0; k < colNums - 1; k++) {
            doc.lineCap('butt')
                .moveTo(startX + (k + 1) * colWidth, startY + curRowInPage * rowHeight)
                .lineTo(startX + (k + 1) * colWidth, startY + (curRowInPage + curRowNeedRowCnt) * rowHeight)
                .stroke();
        }
        //再写入一行数据
        //var rowData = allRowData[i];
        for (var j = 0; j < colNums; j++) {
            doc.y = startY + curRowInPage * rowHeight + 7;  //第几行的数据
            doc.x = startX + j * colWidth;   //第几列的数据
            doc.fillColor('black')
            doc.text(rowData[j], {
                lineBreak: true,
                paragraphGap: 5,
                indent: 5,
                align: 'justify',
                columns: 1,
                width: colWidth - 5,
                height: 20 * curRowNeedRowCnt
            });
        }
        curRowInPage = curRowInPage + curRowNeedRowCnt;
    }
    return startY + curRowInPage * rowHeight - 20;
}

/**
 * 将文本内容text添加到PDF中
 * @param {*} doc PDF
 * @param {*} fontSize 字体大小
 * @param {*} text 文本内容
 * @param {*} startX x坐标
 * @param {*} startY y坐标
 */
function addText2PDF(doc, fontSize, text, startX, startY) {
    //如果y坐标的值超出了750，则需要另起一页
    if (startY >= a4PageInfo.validHeight) {
        doc.addPage();
        startY = a4PageInfo.statrY;
    }
    doc.fontSize(fontSize);
    doc.text(text, startX, startY);
    return startY;
}

/**
 * 添加图片到PDF
 * @param {*} doc PDF
 * @param {*} url 图片路径
 * @param {*} startX x坐标
 * @param {*} startY y坐标
 * @param {*} extAttrs 额外属性
 */
function addImg2PDF(doc, url, startX, startY, extAttrs) {
    if (startY + imgConfig.height >= a4PageInfo.validHeight) {
        doc.addPage();
        startY = a4PageInfo.statrY;
    }
    doc.image(url, startX, startY, extAttrs);
    return startY;
}

/**
 * export hot time data and image to pdf file
 * @param mostClientsImgPath the path of most clients image
 * @param mostTrafficImgPath the path of most traffic image
 * @param res response object
 */
function exportHotTime2PDFFile(mostClientsImgPath, mostTrafficImgPath, dayRange, hotTimeData, res) {
    var doc = new PDFDocument();
    doc.font(fontPath);
    doc.pipe(res)

    //一级标题
    var nextYVal = addText2PDF(doc, 25, "Peak Network Activity Report", 150, 50);
    //二级标题
    nextYVal = addText2PDF(doc, 15, "According to Past 7 Days Experience", 190, nextYVal + 40);
    //nextYVal = addText2PDF(doc, 15, dayRange, 240, nextYVal + 20);
    //三级标题
    nextYVal = addText2PDF(doc, 12, "Most Clients Hot Time", 40, nextYVal + 60);
    //四级标题
    nextYVal = addText2PDF(doc, 10, "Site: " + hotTimeData.siteStr, 40, nextYVal + 20);
    nextYVal = addText2PDF(doc, 10, "Network: " + hotTimeData.networkStr, 40, nextYVal + 20);
    nextYVal = addText2PDF(doc, 10, "Threshold: " + hotTimeData.mostClients.threshold, 40, nextYVal + 20);
    nextYVal = addText2PDF(doc, 10, "Probability: " + hotTimeData.mostClients.probability + " %", 40, nextYVal + 15);
    //图片
    nextYVal = addImg2PDF(doc, mostClientsImgPath, 40, nextYVal + 15, {width: 525, height: 110});
    //表格
    nextYVal = drawTable(doc, 8, 45, nextYVal + imgConfig.height, tableConfig.width, tableConfig.rowHeight, 3, hotTimeData.mostClients.tableData);

    //三级标题
    nextYVal = addText2PDF(doc, 12, "Most Traffic Usage Hot Time", 40, nextYVal + 40);
    nextYVal = addText2PDF(doc, 10, "Site: " + hotTimeData.siteStr, 40, nextYVal + 20);
    nextYVal = addText2PDF(doc, 10, "Network: " + hotTimeData.networkStr, 40, nextYVal + 20);
    nextYVal = addText2PDF(doc, 10, "Threshold: " + hotTimeData.mostTraffic.threshold + " " + hotTimeData.mostTraffic.thresholdUnit, 40, nextYVal + 20);
    nextYVal = addText2PDF(doc, 10, "Probability: " + hotTimeData.mostTraffic.probability + " %", 40, nextYVal + 15);
    //图片
    nextYVal = addImg2PDF(doc, mostTrafficImgPath, 40, nextYVal + 15, {width: 525, height: 110});
    //表格
    nextYVal = drawTable(doc, 8, 45, nextYVal + imgConfig.height, tableConfig.width, tableConfig.rowHeight, 3, hotTimeData.mostTraffic.tableData);
    //添加落款
    nextYVal = addText2PDF(doc, 10, "User: " + hotTimeData.userName, 400, nextYVal + 30);
    addText2PDF(doc, 10, "Date: " + fmtDate(new Date()), 400, nextYVal + 15);
    doc.end();
}

/**
 * export hourly data and image to pdf file
 * @param uniqueClientsPath the path of unique clients image
 * @param trafficClientsImgPath the path of traffic traffic image
 * @param res response object
 */
function exportHourly2PDFFile(uniqueClientsPath, trafficClientsImgPath, hourlyData, res) {
    var doc = new PDFDocument();
    doc.font(fontPath);
    doc.pipe(res);
    //一级标题
    var nextYVal = addText2PDF(doc, 25, "Hourly Network Activity Report", 135, 50);
    //二级标题
    //nextYVal = addText2PDF(doc, 15, "vs Past 7 Days Experience", 215, nextYVal + 40);
    //三级标题
    nextYVal = addText2PDF(doc, 12, "Hourly Unique Clients vs Past 7 Days Experiences", 40, nextYVal + 60);
    //四级标题
    nextYVal = addText2PDF(doc, 10, "Site: " + hourlyData.siteStr, 40, nextYVal + 20);
    nextYVal = addText2PDF(doc, 10, "Network: " + hourlyData.networkStr, 40, nextYVal + 20);
    nextYVal = addText2PDF(doc, 10, "Date: " + hourlyData.uniqueClients.curDate, 40, nextYVal + 20);
    //图片
    nextYVal = addImg2PDF(doc, uniqueClientsPath, 40, nextYVal + 15, {width: 525, height: 110});
    //表格
    nextYVal = drawTable(doc, 8, 45, nextYVal + imgConfig.height, tableConfig.width, tableConfig.rowHeight, 4, hourlyData.uniqueClients.tableData);

    //三级标题
    nextYVal = addText2PDF(doc, 12, "Hourly Traffic Usage vs Past 7 Days Experience", 40, nextYVal + 40);
    //四级标题
    nextYVal = addText2PDF(doc, 10, "Site: " + hourlyData.siteStr, 40, nextYVal + 20);
    nextYVal = addText2PDF(doc, 10, "Network: " + hourlyData.networkStr, 40, nextYVal + 20);
    nextYVal = addText2PDF(doc, 10, "Date: " + hourlyData.trafficUsage.curDate, 40, nextYVal + 20);
    //图片
    nextYVal = addImg2PDF(doc, trafficClientsImgPath, 40, nextYVal + 15, {width: 525, height: 110});
    //表格
    nextYVal = drawTable(doc, 8, 45, nextYVal + imgConfig.height, tableConfig.width, tableConfig.rowHeight, 4, hourlyData.trafficUsage.tableData);

    //添加落款
    nextYVal = addText2PDF(doc, 10, "User: " + hourlyData.userName, 400, nextYVal + 30);
    addText2PDF(doc, 10, "Date: " + fmtDate(new Date()), 400, nextYVal + 15);
    doc.end();
}

/**
 * export daily traffic data and image to pdf file
 * @param dailyTrafficImgPath the path of daily traffic image
 * @param res response object
 */
function exportDailyTraffic2PDFFile(dailyTrafficImgPath, dailyData, res) {
    var doc = new PDFDocument();
    doc.font(fontPath);
    doc.pipe(res);
    //一级标题
    var nextYVal = addText2PDF(doc, 25, "Daily Network Activity Report", 135, 50);
    //二级标题
    nextYVal = addText2PDF(doc, 15, "Traffic Usage vs Unique Clients", 200, nextYVal + 40);
    //四级标题
    nextYVal = addText2PDF(doc, 10, "Site: " + dailyData.siteStr, 40, nextYVal + 60);
    nextYVal = addText2PDF(doc, 10, "Network: " + dailyData.networkStr, 40, nextYVal + 20);
    nextYVal = addText2PDF(doc, 10, "Date: " + dailyData.usageAndClients.scope, 40, nextYVal + 20);
    //图片
    nextYVal = addImg2PDF(doc, dailyTrafficImgPath, 40, nextYVal + 15, {width: 525, height: 110});
    //表格
    nextYVal = drawTable(doc, 8, 45, nextYVal + imgConfig.height, tableConfig.width, tableConfig.rowHeight, 3, dailyData.usageAndClients.tableData);

    //添加落款
    nextYVal = addText2PDF(doc, 10, "User: " + dailyData.userName, 400, nextYVal + 30);
    addText2PDF(doc, 10, "Date: " + fmtDate(new Date()), 400, nextYVal + 15);
    doc.end();
}

/**
 * export hot ap data and image to pdf file
 * @param hotAPImgPath the path of hot ap image
 * @param res response object
 */
function exportHotAP2PDFFile(hotAPImgPath, data, res) {
    var doc = new PDFDocument();
    doc.font(fontPath);
    doc.pipe(res);
    //一级标题
    var nextYVal = addText2PDF(doc, 25, "Most Active AP Report", 155, 50);
    //二级标题
    nextYVal = addText2PDF(doc, 15, "According to Past 7 Days Experience", 155, nextYVal + 40);
    //三级标题
    nextYVal = addText2PDF(doc, 12, "Most Active APs Map Name:" + data.mapName, 35, nextYVal + 50);
    //四级标题
    nextYVal = addText2PDF(doc, 10, "Day: " + data.binDate, 40, nextYVal + 20);
    nextYVal = addText2PDF(doc, 10, "Time: " + data.timestamp, 40, nextYVal + 15);
    nextYVal = addText2PDF(doc, 10, "Unique Clients Average / High: " + data.uniqueClients.average + "/" + data.uniqueClients.high, 40, nextYVal + 15);
    var name = "Traffic Usage Average / High: " + data.trafficUsage.average + " (" + data.trafficUsage.unit + ") / " + data.trafficUsage.high + " (" + data.trafficUsage.unit + ")";
    if (!data.trafficUsage.unit) {
        name = "Traffic Usage Average / High: " + data.trafficUsage.average + " / " + data.trafficUsage.high;
    }
    nextYVal = addText2PDF(doc, 10, name, 40, nextYVal + 15);
    //图片
    nextYVal = addImg2PDF(doc, hotAPImgPath, 40, nextYVal + 15, data.area);
    //表格
    nextYVal = drawTable(doc, 8, 45, nextYVal + data.area.height + 5, tableConfig.width, tableConfig.rowHeight, 6, data.tableData);

    //添加落款
    nextYVal = addText2PDF(doc, 10, "User: " + data.userName, 400, nextYVal + 30);
    addText2PDF(doc, 10, "Date: " + fmtDate(new Date()), 400, nextYVal + 15);
    doc.end();
}

/**
 * export hot time data and image to pdf file
 * @param req request, request object
 * @param res response, response object
 */
exports.exportHotTime2PDF = function (req, res) {
    createCustomerDic();
    //get the base64 data of most client image
    var mostClientsCanvasDataURL = req.body.MostClientImg;
    //图片路径
    let mostClientsImgName = `${process.cwd()}/customer/mostClients.png`;
    //过滤data:URL
    var mostClientsBase64Data = mostClientsCanvasDataURL.replace(/^data:image\/\w+;base64,/, "");
    //获取Most Clients图片的base64位的数据
    var mostClientsBuffer = new Buffer(mostClientsBase64Data, 'base64');

    //get the base64 data of most traffic image
    var mostTrafficCanvasDataURL = req.body.MostTrafficImg;
    //图片路径
    let mostTrafficImgName = `${process.cwd()}/customer/mostTraffic.png`;
    //过滤data:URL
    var mostTrafficBase64Data = mostTrafficCanvasDataURL.replace(/^data:image\/\w+;base64,/, "");
    //获取Most Traffic图片的base64位的数据
    var mostTrafficBuffer = new Buffer(mostTrafficBase64Data, 'base64');

    let dayRange = req.body.dayRange;
    let uniqueClients = req.body.uniqueClients;
    let trafficUsage = req.body.trafficUsage;
    let userName = req.body.userName;
    let params = req.body.params;

    let opeUserId = req.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            console.log("--error:--" + err);
            return;
        }

        let customer = `${process.cwd()}/customer`;
        if (!fs.existsSync(customer)) {
            fs.mkdirSync(customer);
        }

        fs.writeFile(mostClientsImgName, mostClientsBuffer, function (err) {
            if (err) {
                console.log("--error:--" + err);
            } else {
                fs.writeFile(mostTrafficImgName, mostTrafficBuffer, function (err) {
                    if (err) {
                        console.log("--error:--" + err);
                    } else {
                        getHotTimePDFData(uniqueClients, trafficUsage, userName, params, uuids, function (err, data) {
                            if (err) {
                                console.log("--error:--" + err);
                            } else {
                                //create pdf file when both images been created
                                exportHotTime2PDFFile(mostClientsImgName, mostTrafficImgName, dayRange, data, res);
                                //delete the temporary images
                                try {
                                    fs.unlinkSync(mostClientsImgName);
                                    fs.unlinkSync(mostTrafficImgName);
                                }
                                catch(e) {
                                    console.log(e.message);
                                }
                            }
                        });

                    }
                });
            }
        });
    });
};

/**
 * export hourly data and image to pdf file
 * @param req request, request object
 * @param res response, response object
 */
exports.exportHourly2PDF = function (req, res) {
    createCustomerDic();
    //get the base64 data of unique client image
    var uniqueClientsDataURL = req.body.UniqueClientsImg;
    let uniqueClientsImgName = `${process.cwd()}/uniqueClients.png`;
    var uniqueClientsBase64Data = uniqueClientsDataURL.replace(/^data:image\/\w+;base64,/, "");
    var uniqueClientsBuffer = new Buffer(uniqueClientsBase64Data, 'base64');

    //get the base64 data of traffic client image
    var trafficUsageDataURL = req.body.TrafficClientsImg;
    let trafficUsageImgName = `${process.cwd()}/trafficUsage.png`;
    var trafficUsageBase64Data = trafficUsageDataURL.replace(/^data:image\/\w+;base64,/, "");
    var trafficUsageBuffer = new Buffer(trafficUsageBase64Data, 'base64');

    let curDate = req.body.curDate;
    let userName = req.body.userName;
    let params = req.body.params;

    let opeUserId = req.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            console.log("--error:--" + err);
            return;
        }

        let customer = `${process.cwd()}/customer`;
        if (!fs.existsSync(customer)) {
            fs.mkdirSync(customer);
        }

        //generate images
        fs.writeFile(uniqueClientsImgName, uniqueClientsBuffer, function (err) {
            if (err) {
                console.log("--error:--" + err);
            } else {
                //generate traffic usage client image
                fs.writeFile(trafficUsageImgName, trafficUsageBuffer, function (err) {
                    if (err) {
                        console.log("--error:--" + err);
                    } else {
                        getHourlyPDFData(curDate, userName, params, uuids, function (err, data) {
                            if (err) {
                                console.log("--error:--" + err);
                            } else {
                                //create pdf file when both images been created
                                exportHourly2PDFFile(uniqueClientsImgName, trafficUsageImgName, data, res);
                                //delete the temporary images
                                try {
                                    fs.unlinkSync(uniqueClientsImgName);
                                    fs.unlinkSync(trafficUsageImgName);
                                }
                                catch(e) {
                                    console.log(e.message);
                                }

                            }
                        });

                    }
                });
            }
        });
    });
};

/**
 * export daily traffic usage data and image to pdf file
 * @param req request, request object
 * @param res response, response object
 */
exports.exportDailyTraffic2PDF = function (req, res) {
    createCustomerDic();
    //get the base64 data of daily traffic image
    var dailyTrafficDataURL = req.body.DailyTrafficImg;
    let scopes = req.body.scopes;
    let params = req.body.params;
    let dailyTrafficImgName = `${process.cwd()}/customer/dailyTraffic.png`;
    var dailyTrafficBase64Data = dailyTrafficDataURL.replace(/^data:image\/\w+;base64,/, "");
    var dailyTrafficBuffer = new Buffer(dailyTrafficBase64Data, 'base64');
    let userName = req.body.userName;

    let opeUserId = req.opeUserId;
    getAuthorisedUUIDs(opeUserId, function (err, uuids) {
        if (err) {
            console.log("--error:--" + err);
            return;
        }

        let customer = `${process.cwd()}/customer`;
        if (!fs.existsSync(customer)) {
            fs.mkdirSync(customer);
        }

        //generate images
        fs.writeFile(dailyTrafficImgName, dailyTrafficBuffer, function (err) {
            if (err) {
                console.log("--error:--" + err);
            } else {
                getDailyTrafficData(scopes, userName, params, uuids, function (err, data) {
                    if (err) {
                        console.log("--error:--" + err);
                    } else {
                        //create pdf file when both images been created
                        exportDailyTraffic2PDFFile(dailyTrafficImgName, data, res);
                        //delete the temporary images
                        try {
                            fs.unlinkSync(dailyTrafficImgName);
                        }
                        catch(e) {
                            console.log(e.message);
                        }

                    }
                });

            }
        });
    });
};

/**
 * export hot ap data and image to pdf file
 * @param req request, request object
 * @param res response, response object
 */
exports.exportHotAP2PDF = function (req, res) {
    createCustomerDic();
    //get the base64 data of hot ap image
    var hotAPDataURL = req.body.HotAPImg;
    let hotAPImgName = `${process.cwd()}/customer/hotAP.png`;
    var hotAPBase64Data = hotAPDataURL.replace(/^data:image\/\w+;base64,/, "");
    var hotAPBuffer = new Buffer(hotAPBase64Data, 'base64');

    let customer = `${process.cwd()}/customer`;
    if (!fs.existsSync(customer)) {
        fs.mkdirSync(customer);
    }

    //generate images
    fs.writeFile(hotAPImgName, hotAPBuffer, function (err) {
        if (err) {
            console.log("--error:--" + err);
        } else {
            getHotAPData(req.body, function (err, data) {
                if (err) {
                    console.log("--error:--" + err);
                } else {
                    //create pdf file when both images been created
                    exportHotAP2PDFFile(hotAPImgName, data, res);
                    //delete the temporary images
                    try {
                        fs.unlinkSync(hotAPImgName);
                    }
                    catch(e) {
                        console.log(e.message);
                    }
                }
            });
        }
    });
};

function getAuthorisedUUIDs(opeUserId, callback) {
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            callback(err, null);
        } else {
            if (opeUser.role == "root admin" || opeUser.role == "root user") {
                callback(null, null);
            } else {
                db.cwmNetwork.findUuidById(opeUser.privilege, function (err, uuids) {
                    if (err) {
                        callback(err, null);
                    } else {
                        let result = [];
                        if (uuids) {
                            for (let i = 0; i < uuids.length; i++) {
                                result.push(uuids[i].agentUUID);
                            }
                        }
                        callback(null, result);
                    }
                });
            }
        }
    });
}

function fmtDate(date) {
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    m = m < 10 ? ('0' + m) : m;
    var d = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    var h = date.getHours();
    h = h < 10 ? ('0' + h) : h;
    var minute = date.getMinutes();
    minute = minute < 10 ? ('0' + minute) : minute;
    return y + '-' + m + '-' + d + ' ' + h + ':' + minute;

}