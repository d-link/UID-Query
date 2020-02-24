/**
 * Created by lizhimin on 2017/6/9.
 */
define(["app"], function (app) {
    app.register.directive('timeSchedule', function () {

        return {
            restrict: 'AE',
            scope: {
                profileInfo: '=',
                state: '='
            },
            templateUrl: "./views/configuration/timeSchedule.html",
            controller: function ($scope, $timeout, Current, utils) {
                // var profileInfo = angular.copy($scope.profileInfo);
                $scope.hasPrivilege = Current.user().role == "root admin" || Current.user().role == "local admin";
                /*
                 * 页面固定数据
                 */
                $scope.isFwUpgradeSchedule = false;
                $scope.isFwChanged = true;
                $scope.isFwUploading = false;
                $scope.$on("fwUploadSchedule", function (event, isFwChanged, isFwUploading) {
                    $scope.isFwUpgradeSchedule = true;
                    if (isFwChanged != null) {
                        $scope.isFwChanged = isFwChanged;
                    }
                    if (isFwUploading != null) {
                        $scope.isFwUploading = isFwUploading;
                    }
                });
                var kalendaeData = {};
                /**
                 * @method 以NCTime也就是后台时间为准
                 * @author 李莉红
                 * @version
                 * */
                //utils.getNodeTime(function () {
                //初始化
                checkTime($scope.profileInfo.schedule);
                kalendaeData = {
                    scheduleStart: new Date(NCTime)
                };
                if ($scope.profileInfo.schedule.scheduleStart) {//ISO时间
                    kalendaeData.scheduleStart = new Date(utils.ISOTimeChange($scope.profileInfo.schedule.scheduleStart));
                }
                $scope.mytime = new Date(NCTime);
                if ($scope.profileInfo.schedule.executeTime) {
                    $scope.mytime = new Date(utils.ISOTimeChange($scope.profileInfo.schedule.executeTime));
                }
                //});
                /**
                 * kalendae
                 * 配置参数
                 */

                var k1 = new Kalendae.Input('kalendae_oneTime', {
                    months: 1,
                    direction: 'any',
                    mode: 'single',
                    format: 'YYYY.MM.DD',
                    closeButton: false,
                    offsetTop: 1,
                    offsetLeft: 1,
                    subscribe: {
                        'change': function (date) {
                            kalendaeData.scheduleStart = this.getSelectedAsDates();
                            this.hide();
                            // 数据绑定
                            // $scope.specificDate = this.getSelected();
                            // $scope.$apply();
                        }
                    },
                    blackout: function (date) {
                        var today = Kalendae.moment(NCTime).hour(12).minutes(0).subtract({d: 1});
                        return today > date;
                    }
                });
                /*
                 * 数据处理
                 */
                var processing = {
                    dateConversion: function (date, NCTime) {
                        if (!date) {
                            var date = new Date(NCTime);
                            var d = date.getFullYear() + '.' + (date.getMonth() + 1) + '.' + date.getDate();
                            return d;
                        }
                        if (typeof date === 'object') date = date.toUTCString();
                        if (date.indexOf('T') != 10) {
                            // 修改格式
                            date = new Date(Date.parse(date));
                            var d = date.getFullYear() + '.' + (date.getMonth() + 1) + '.' + date.getDate();
                            return d;
                        } else {
                            date = new Date(Date.parse(date));
                            var d = date.getFullYear() + '.' + (date.getMonth() + 1) + '.' + date.getDate();
                            return d;
                        }
                    },
                    timeConversion: function (time) {
                        if (!time) return '11:11 AM';
                        var t1 = time.slice(0, 5);
                        var t2 = time.slice(8, 11);
                        return t1 + t2;
                    },
                    timeToMytime: function (time) {
                        //utils.getNodeTime(function () {
                        var d = new Date(NCTime);
                        if (!time) return d;
                        var h = (time.slice(0, 2) - 0) + (time.slice(9, 11) == 'PM' ? 12 : 0),
                            m = time.slice(3, 5) - 0
                        // m =
                        d.setHours(h, m);
                        return d;
                        //});
                    },
                    timeChanged: function () {
                        if ($scope.mytime) {
                            var copyTime = angular.copy($scope.mytime),
                                hour = copyTime.getHours(),
                                minute = copyTime.getMinutes(),
                                second = copyTime.getSeconds(),
                                amPm = 'AM';

                            function timeShowFormat(num) {
                                return num >= 0 && num < 10 ? '0' + num : num;
                            };
                            amPm = hour >= 12 ? 'PM' : 'AM';
                            hour = hour === 0 || hour === 12 ? 12 : hour % 12;
                            hour = timeShowFormat(hour);
                            minute = timeShowFormat(minute);

                            $scope.schedule.executeTime = hour + ':' + minute + ' ' + amPm;
                        }

                    }
                };
                /**
                 * 数据绑定
                 */
                $scope.schedule = {
                    cyclicalType: $scope.profileInfo.schedule.cyclicalType == 'Immediate' ? "Immediate" : 'SelectTime',//“Immediately”|“SelectTime”->"Once"
                    executeTime: utils.ISOTimeChange($scope.profileInfo.schedule.executeTime),//startType==“SelectTime”时有效
                    scheduleStart: processing.dateConversion(utils.ISOTimeChange($scope.profileInfo.schedule.scheduleStart), NCTime),// processing.dateConversion(profileInfo.schedule.scheduleStart), // '2017.06.18'
                };
                processing.timeChanged();

                $scope.$watch('schedule', function () {
                    $scope.state.processing = false;
                    $scope.state.isSuccess = false;
                    $scope.state.isError = false;

                }, true);

                function checkTime(data) {
                    $scope.state.Indue = false;
                    if (data.cyclicalType != 'Immediate') {
                        var date = new Date(data.scheduleStart);
                        var time = new Date(data.executeTime);
                        date.setHours(time.getHours());
                        date.setMinutes(time.getMinutes());
                        if (date.getTime() > new Date().getTime()) {
                            $scope.state.Indue = true;
                        }

                    }
                }

                // Time-picker
                $scope.toggled = function (open) {
                    var input = document.getElementById("exeTime");
                    open ? input.focus() : input.blur();
                };

                $scope.ismeridian = true;
                $scope.hstep = 1;
                $scope.mstep = 5;
                $scope.timeChanged = function () {
                    processing.timeChanged()
                };

                $scope.clearSchedule = function () {
                    var data = {};
                    data.cyclicalType = 'Immediate';
                    //utils.getNodeTime(function () {
                    data.executeTime = new Date(NCTime);
                    data.scheduleStart = new Date(NCTime);
                    $scope.schedule = {
                        cyclicalType: 'Immediate',//“Immediately”|“SelectTime”->"Once"
                        executeTime: new Date(NCTime).toUTCString(),//startType==“SelectTime”时有效
                        scheduleStart: processing.dateConversion(new Date(NCTime).toUTCString(), NCTime),// processing.dateConversion(profileInfo.schedule.scheduleStart), // '2017.06.18'
                    };
                    $scope.state.Indue = false;
                    $scope.mytime = new Date(NCTime);
                    processing.timeChanged();
                    $scope.$emit('scheduleClear', data);
                    //});
                };
                /**
                 * 保存数据
                 */
                $scope.saveSchedule = function () {

                    var pendingData = angular.copy($scope.schedule);
                    var data = {};
                    //utils.getNodeTime(function () {
                    if (pendingData.cyclicalType == 'Immediate') {
                        // 立即执行
                        data.cyclicalType = 'Immediate';
                        data.executeTime = new Date(NCTime);
                        data.scheduleStart = new Date(NCTime);
                    } else {
                        // 延时执行
                        data.cyclicalType = 'Once';
                        var current = new Date(NCTime);
                        var tempdate = new Date(kalendaeData.scheduleStart);
                        var dd = tempdate.getDate();
                        var curdd = current.getDate();
                        if (dd < curdd) {//如果选中的时间小于今天的，那再看月份，因为日历里面之前的都是不可点击的，所以月份肯定能设置成功
                            //tempdate.setDate(curdd);
                            $scope.schedule.scheduleStart = processing.dateConversion(tempdate, NCTime);
                            var hour = $scope.mytime.getHours(), minute = $scope.mytime.getMinutes();
                            var curhour = current.getHours(), curminute = current.getMinutes();
                            if (hour * 60 + minute < curhour * 60 + curminute) {
                                hour = curhour;
                                minute = curminute;
                                $scope.mytime.setHours(hour);
                                $scope.mytime.setMinutes(minute);
                                $scope.timeChanged();
                            }
                        } else {
                            if (dd == curdd) {
                                var hour = $scope.mytime.getHours(), minute = $scope.mytime.getMinutes();
                                var curhour = current.getHours(), curminute = current.getMinutes();
                                if (hour * 60 + minute < curhour * 60 + curminute) {
                                    hour = curhour;
                                    minute = curminute;
                                    $scope.mytime.setHours(hour);
                                    $scope.mytime.setMinutes(minute);
                                    $scope.timeChanged();
                                }
                            }
                        }

                        data.executeTime = $scope.mytime;//$scope.mytime;
                        data.scheduleStart = tempdate;

                    }
                    //savashedule的时候保存为页面时间转换为utc时间
                    //在这个地方把时区转一下,拿到年月日的时间，然后有时区，将时间转一下
                    var year = data.scheduleStart.getFullYear();
                    var month = data.scheduleStart.getMonth();
                    var date = data.scheduleStart.getDate();
                    var hours = data.executeTime.getHours();
                    var minutes = data.executeTime.getMinutes();
                    var second = data.executeTime.getSeconds();
                    //要设置的时间根据offset设定成utc时间
                    var utcISOTime = new Date(Date.UTC(year, month, date, hours, minutes, second) + NCTimeOffset * 60 * 1000).toISOString();
                    console.log(utcISOTime);
                    data.executeTime = utcISOTime;
                    data.scheduleStart = utcISOTime;
                    checkTime(data);
                    $scope.$emit('scheduleSave', data);
                    //});
                };

                function appendZero(obj) {
                    return obj < 10 ? "0" + obj : obj
                }

                $scope.showCalendae = function () {
                    //utils.getNodeTime(function () {
                    document.getElementById('kalendae_oneTime').focus();
                    //});
                }

            }
        };
    });
});