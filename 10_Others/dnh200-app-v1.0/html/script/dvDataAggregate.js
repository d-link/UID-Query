/**
 * Created by hailong li on 2016/10/20.
 * content:merge sensor datas
 * merge algorithm:
 *      1. 按照0.5H，2H，6H和24H的固定周期进行数据合并，合并从realData逐级向上,从低周期的数据往高周期合并。
 *      2.合并时，找到数组中第一条没有被合并的数据，向后查找在合并时间内(第一条的时间+相应合并的周期)的数据，
 *        找到后合并成一条，插入到高周期的数组里，然后继续查找并执行同样的操作。如果最后还剩未合并的数据，
 *        需要检查未合并数据的第一条时间+周期（即合并时间）是否已经小于当前时间，是也要合并。
 *      3.合并数据的数组保留固定的372条数据，换成天数的话，则保留的时间长度为:
 *        0.5*372/24=7.75D,  2*372/24=31D,  6*372/24=93D,  24*372/24=372D。
 *      4.该合并脚本运行于mongodb数据库中。
 */

function dataMerge(isHalfHMerge, isTowHMerge, isSixHMerge, isOneDMerge) {

    /******************************************COMMON***********************************************************/
    /**
     * 合并类型
     * @type {{half: number, two: number, six: number, day: number}}
     * @private
     */
    var _mergeType = {
        half: 1,
        two: 2,
        six: 3,
        day: 4
    };

    /**
     * 是否为有效的数组对象
     * @param obj
     * @returns {boolean}
     * @private
     */
    function _validDatas(obj) {
        if (obj && Object.prototype.toString.call(obj) === '[object Array]') {
            return (obj.length > 0);
        }
    }

    /**
     * 获取合并后的单条数据
     * @param tempMergeDatas
     * @param property
     * @returns {{avg: number, min: number, max: number}}   返回格式
     * @private
     */
    // function _getStasticData(tempMergeDatas, property) {
    //     var data = {avg: 0, min: 0, max: 0};
    //     if (_validDatas(tempMergeDatas) && property) {
    //         var total = 0, len = tempMergeDatas.length;
    //         var resultMax = -100, resultMin = -100;  //最终结果的max和min值
    //         var valueMax = 0, valueMin = 0, valueAvg = 0;  //统计数据中的相关值
    //
    //         tempMergeDatas.forEach(function (data) {  //循环数据，取出最大值，最小值，平均值
    //             var item = data[property];
    //             data.isMerged = true;  //标记不再合并
    //             if (Object.is(typeof item, 'object')) {  //非realData数据时，数组内数据为对象，[{property:{avg:10,max:20,min:5}}]
    //                 valueMax = item.max;
    //                 valueMin = item.min;
    //                 valueAvg = item.avg;
    //             } else {  //realData时，数组的数据格式为[{property:10}]
    //                 valueMax = valueMin = valueAvg = item;
    //             }
    //
    //             if (!isNaN(valueMax) && (valueMax > resultMax)) {
    //                 resultMax = valueMax;  //最大值替换
    //             }
    //             if (!isNaN(valueMin)) {
    //                 if (resultMin < 0 || (valueMin < resultMin)) {
    //                     resultMin = valueMin; //最小值替换
    //                 }
    //             }
    //             if (!isNaN(valueAvg)) {
    //                 total += valueAvg;  //求和
    //             }
    //         });
    //
    //         data.avg = total / len;
    //         data.min = (resultMin === -100) ? 0 : resultMin;
    //         data.max = (resultMax === -100) ? 0 : resultMax;
    //     }
    //     return data;
    // }

    /**
     * 获取合并后的单条数据
     * @param tempMergeDatas
     * @param propertys
     * @returns {{avg: number, min: number, max: number}}   返回格式
     * @private
     */
    function _getStasticData(tempMergeDatas, propertys) {
        if (_validDatas(tempMergeDatas) && _validDatas(propertys)) {
            var stasticData = {};
            var len = tempMergeDatas.length;
            var avgSum = 0, stasticSum = 0;  //求平均值的sum,统计的sum
            var resultMin = -100, resultMax = -100; //最终结果的max和min值
            var valueMax = 0, valueMin = 0, valueAvg = 0, valueSum = 0;//统计数据中的相关值

            propertys.forEach(function (p) {//针对不同的属性求值
                avgSum = 0, stasticSum = 0, resultMax = -100, resultMin = -100, valueMax = 0, valueMin = 0, valueAvg = 0;
                var isStasticSum = (typeof p === 'object');
                var prop = isStasticSum ? p.pSum : p;
                var propExists = (tempMergeDatas[0][prop] !== undefined); //属性是否存在
                tempMergeDatas.forEach(function (data) {  //循环数据，取出最大值，最小值，平均值
                    var item = data[prop];
                    if (propExists) {
                        if (typeof item === 'object') {  //非realData数据时，数组内数据为对象，[{p:{avg:10,max:20,min:5}}]
                            valueMax = +item.max;
                            valueMin = +item.min;
                            valueAvg = +item.avg;
                            valueSum = +item.sum;
                        } else {  //直接跟数字时，数组的数据格式为[{p:10}]
                            valueMax = valueMin = valueAvg = valueSum = (+item);
                        }
                        //最大值替换
                        if (!isNaN(valueMax) && (valueMax > resultMax)) {
                            resultMax = valueMax;
                        }
                        //最小值替换
                        if (!isNaN(valueMin)) {
                            if (resultMin < 0 || (valueMin < resultMin)) {
                                resultMin = valueMin;
                            }
                        }
                        //平均值求和
                        if (!isNaN(valueAvg)) {
                            avgSum += valueAvg;
                        }
                        //traffic求和
                        if (isStasticSum && !isNaN(valueSum)) {
                            stasticSum += valueSum;
                        }
                        if (!data.isMerged) {
                            data.isMerged = true; //标记不再合并
                        }
                    }
                });

                if (propExists) { //属性存在才写入
                    stasticData[prop] = isStasticSum ? {sum: stasticSum} :
                    {
                        avg: avgSum / len,
                        min: ((resultMin === -100) ? 0 : resultMin),
                        max: ((resultMax === -100) ? 0 : resultMax),
                    };
                    stasticData.isMerged = false;
                }
            });
            return stasticData;
        }
    }

    /**
     * 获取要合并的时间
     * @param mergeType
     * @param startTime  第一条要合并的数据时间
     * @returns {Date}   要执行合并的时间
     * @private
     */
    function _getMergeTime(mergeType, startTime) {
        if (mergeType && startTime) {
            var millSecToMerged = 60 * 1000;
            switch (mergeType) {
                case _mergeType.half: {
                    millSecToMerged *= 30;
                    break;
                }
                case _mergeType.two: {
                    millSecToMerged *= 60 * 2;
                    break;
                }
                case _mergeType.six: {
                    millSecToMerged *= 60 * 6;
                    break;
                }
                case _mergeType.day: {
                    millSecToMerged *= 60 * 24;
                    break;
                }
            }
            return new Date(startTime.getTime() + millSecToMerged);
        } else {
            return new Date();
        }
    }

    /**
     * 执行数据合并
     *
     * 所有的合并数据，最多保留372条。合并时，按时间向后执行。
     * 比如进行30分钟数据合并，先找到realData数组中第一条没合并的数据，然后循环找出相隔30分钟时间的所有数据，
     * 合并成一条，插入半小时的数组中，然后接着找以后相隔30分钟的数据再合并，直到全部找完，
     * 这样做的目的是不会丢掉未合并的数据，也不依赖于该脚本具体的执行时间，而只是根据数据库中数据的时间。
     *
     * @param dataArr
     * @param mergeType
     * @param mergeHandler
     * @private
     */
    function _startDataMerge(dataArr, mergeType, mergeHandler) {
        var docChange = false;
        if (_validDatas(dataArr)) {
            dataArr = dataArr.filter(function (item) {
                return !item.isMerged; //过滤出未合并的数据
            });
            var count = dataArr.length;

            if (count > 0) {
                var tempMergeDataArr = [];  //一个周期范围内要合并的所有数据
                var mergeTime = '';  //合并时间范围内的最后一条数据的时间。比如30分钟合并一次，则该值为第一条未合并的数据的时间加上30分钟。
                var doMerge = false;  //是否执行合并操作

                while ((--count) >= 0) {  //循环执行合并
                    var item = dataArr[count];
                    if (!item.isMerged) {
                        if (!mergeTime) {
                            mergeTime = _getMergeTime(mergeType, item.time); //获取合并范围时间
                        }
                        if (item.time > mergeTime) {  //数据的时间超出要合并的时间，则表示一个周期的数据已经取完，需要进行合并
                            doMerge = true;
                            count++; //下一次循环时需要从当前数据开始
                        } else {
                            tempMergeDataArr.push(item);
                            if (count == 0 && mergeTime <= new Date()) {  //循环结束，如果有未合并的数据，需要检查剩余数据的待合并时间是否小于或者等于当前时间，是表示剩余数据也需要合并
                                doMerge = true;
                            }
                        }
                        //执行合并操作
                        if (doMerge) {
                            mergeHandler(tempMergeDataArr);

                            //合并完成，需要重置相关变量，继续进行后续合并
                            tempMergeDataArr.length = 0;
                            mergeTime = '';
                            doMerge = !doMerge;
                            docChange = true;
                        }
                    }
                }
            }
        }
        return docChange;
    }

    /***********************************Each Sensor Handle*****************************************************/
    /**
     * 具体sensor的逻辑处理映射
     * @type {{CPUUtilization: {handler: _getMergedCPUData, props: string[]}, MemoryUtilization: {handler: _getMergedMemData, props: string[]}, WiredTraffic: {handler: _getMergedTrafficData, props: *[]}}}
     */
    var handlerMap = {
        'CPUUtilization': {
            handler: _getMergedCPUData,
            props: ['cpuLoadPercent', 'cpuUtilization1Min', 'cpuUtilization5Min']
        },
        'MemoryUtilization': {
            handler: _getMergedMemData,
            props: ['memoryUtilization']
        },
        'WiredTraffic': {
            handler: _getMergedTrafficData,
            props: ['discardRealOut', 'discardRealIn', 'errRealOut', 'errRealIn',
                'rateRealOut', 'rateRealIn', 'rateRelativeIn', 'rateRelativeOut',
                'rateAveIn', 'rateAveOut', 'rateAveRelativeIn', 'rateAveRelativeOut',
                'errAveIn', 'errAveOut', 'discardAveIn', 'discardAveOut',
                {'pSum': 'totalIfOutDiscards'}, {'pSum': 'totalIfInDiscards'}, {'pSum': 'totalIfOutErrors'},//对象表示求和
                {'pSum': 'totalIfInErrors'}, {'pSum': 'totalIfOutOctets'}, {'pSum': 'totalIfInOctets'}
            ]
        }
    }

    /**
     *将数据插入到目标数组中
     * @param sensorType
     * @param mergeType
     * @param destArr   插入合并数据的数组
     * @param tempMergeDatas  要合并的数据
     * @private
     */
    function _addDataToDestArr(sensorType, mergeType, destArr, tempMergeDatas) {
        if (sensorType && _validDatas(tempMergeDatas)) {
            var mapValue = handlerMap[sensorType];
            var mergedData = mapValue.handler(tempMergeDatas, mapValue.props);
            var mergedTime = _getMergeTime(mergeType, tempMergeDatas[0].time);  //合并时间为第一条数据加上周期时间

            if (mergedData && Object.keys(mergedData).length) {
                mergedData.time = mergedTime;  //时间：第一条数据的时间+周期
                [].splice.call(destArr, 0, 0, mergedData);  //最新的数据在最前面。时间降序排序
            }
        }
    }

    /**
     * 获取合并的CPU数据
     * @param tempMergeDatas
     * @param props
     * @returns {string}
     * @private
     */
    function _getMergedCPUData(tempMergeDatas, props) {
        var mergeData = '';
        if (_validDatas(tempMergeDatas)) {
            var firstData = tempMergeDatas[0];
            if (firstData.hasOwnProperty('cpuUtilization1Min')) {//包含三种数据
                mergeData = _getStasticData(tempMergeDatas, props);
            } else {
                if (firstData.hasOwnProperty('cpuLoadPercent')) { //只有loadPercent一种
                    mergeData = _getStasticData(tempMergeDatas, props.slice(0, 1));
                }
            }
        }
        return mergeData;
    }

    /**
     * 获取Memory数据
     * @param tempMergeDatas
     * @param props
     * @returns {string}
     * @private
     */
    function _getMergedMemData(tempMergeDatas, props) {
        var mergeData = '';
        if (_validDatas(tempMergeDatas)) {
            mergeData = _getStasticData(tempMergeDatas, props);
        }
        return mergeData;
    }

    /**
     * 获取traffic数据
     * @param tempMergeDatas
     * @param props
     * @returns {string}
     * @private
     */
    function _getMergedTrafficData(tempMergeDatas, props) {
        var mergeData = '';
        if (_validDatas(tempMergeDatas)) {
            mergeData = _getStasticData(tempMergeDatas, props);
            mergeData['ifIndex'] = tempMergeDatas[0].ifIndex;
        }
        return mergeData;
    }

    /***********************************Aggregate Handle*****************************************************/

    function aggregateSensors(isHalfHMerge, isTowHMerge, isSixHMerge, isOneDMerge, tableName) {
        // var sensorCursor = db[tableName].find();
        [1].forEach(function (doc) {
            var sensorType = "MemoryUtilization";
            var iterator = [];
            // if (isHalfHMerge) {
            //     iterator.push({
            //         originArr: doc.realData,
            //         destArr: doc.halfHData,
            //         mergeType: _mergeType.half
            //     });
            // }
            // if (isTowHMerge) {
            //     iterator.push({
            //         originArr: doc.halfHData,
            //         destArr: doc.twoHData,
            //         mergeType: _mergeType.two
            //     });
            // }
            // if (isSixHMerge) {
            //     iterator.push({
            //         originArr: doc.twoHData,
            //         destArr: doc.sixHData,
            //         mergeType: _mergeType.six
            //     });
            // }
            // if (isOneDMerge) {
            //     iterator.push({
            //         originArr: doc.sixHData,
            //         destArr: doc.oneDData,
            //         mergeType: _mergeType.day
            //     });
            // }
            //如果有多种合并周期的话，依次合并：0.5h->2h->6h->24h
            var changeTimes = 0;  //数据改变的次数，大于0表示已改变
            var destArr = [];
            [{
                originArr: data,
                destArr: destArr,
                mergeType: _mergeType.half
            }].forEach(function (item) {
                var docChange = _startDataMerge(item.originArr, item.mergeType, function (tempMergeDatas) {
                    _addDataToDestArr(sensorType, item.mergeType, item.destArr, tempMergeDatas);
                });
                if (docChange) {
                    changeTimes++;
                }
            });
            if (changeTimes > 0) {  //有更改才执update
                //   db[tableName].save(doc);
                console.log(JSON.stringify(destArr));
            }
        });
    }

    aggregateSensors(isHalfHMerge, isTowHMerge, isSixHMerge, isOneDMerge, 'Sensor_Common_Data');
    // aggregateSensors(isHalfHMerge, isTowHMerge, isSixHMerge, isOneDMerge, 'Sensor_Port_Data');
}