/**
 * Created by lilihong on 2019/4/26.
 */
define(["app"], function (app) {
    app.register.directive('selectDate', function () {

        return {
            restrict: 'AE',
            scope: {
                dateInfo: '=',
                disabledInfo: '='
            },
            templateUrl: "./views/configuration/selectDate.html",
            controller: function ($scope, $timeout, Current, utils) {
                /*
                 * 数据处理
                 */
                var processing = {
                    dateConversion: function (date) {
                        if (!date) {
                            var date = new Date();
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
                        /* date = date.substr(0, date.indexOf('T')).replace(/-/g, ".");
                         return date;*/
                    },
                    timeConversion: function (time) {
                        if (!time) return '11:11 AM';
                        var t1 = time.slice(0, 5);
                        var t2 = time.slice(8, 11);
                        return t1 + t2;
                    },
                    timeToMytime: function (time) {
                        var d = new Date();
                        if (!time) return d;
                        var h = (time.slice(0, 2) - 0) + (time.slice(9, 11) == 'PM' ? 12 : 0),
                            m = time.slice(3, 5) - 0
                        // m =
                        d.setHours(h, m);
                        return d;
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

                            $scope.dateAndTime.time = hour + ':' + minute + ' ' + amPm;
                            $scope.clockHour = hour;
                            $scope.clockMinute = minute;
                            $scope.amPm = amPm;
                            var time1 = new Date($scope.mytime);
                            var time2 = new Date('2019-01-01T12:00:00'.replace(/-/g, "\/"));
                            if (time1 < time2) {
                                $scope.timeError = true;
                                toggled(event);
                                //发送按钮不可用的事件
                                $scope.$emit('disableButton', true);
                                return;
                            } else {
                                $scope.timeError = false;
                                //发送按钮可用的事件
                                $scope.$emit('disableButton', false);
                                $scope.$emit('dateAndTimeChange', $scope.mytime);
                            }

                        }

                    }
                };
                var calendar = {
                    time: new Date()
                };
                $scope.disabledDateAndTime = $scope.disabledInfo;
                $scope.timeError = false;
                $scope.hasPrivilege = Current.user().username == "admin" || Current.user().isNSUser;

                /*
                 * 数据绑定
                 */
                function initDate(data) {
                    if (data) {
                        $scope.dateInfo = data;
                    }
                    $scope.dateAndTime = {
                        date: processing.dateConversion($scope.dateInfo.date),//startType==“SelectTime”时有效
                        time: $scope.dateInfo.time
                    };
                    $scope.timeError = $scope.dateInfo.timeError;
                    if ($scope.dateInfo.date) {
                        calendar.time = new Date($scope.dateInfo.date);
                    }
                    // Time-picker
                    $scope.ismeridian = true;
                    $scope.hstep = 1;
                    $scope.mstep = 5;
                    $scope.mytime = new Date();
                    if ($scope.dateInfo.time) {
                        $scope.mytime = new Date($scope.dateInfo.time);
                    }
                    $scope.timeChanged = function () {
                        processing.timeChanged();
                    };
                    processing.timeChanged();
                }

                function toggled(event) {
                    //document.getElementById("select_date").style.display = "none";
                    //显示错误的时候隐藏时钟选择，去掉open这个class
                    var input = (event.currentTarget).closest(".dropdown");
                    input.click();
                    // var inputClassName = input.className;
                    // var classList = inputClassName.split(' ');
                    // for (let i = 0; i < classList.length; i++) {
                    //     if (classList[i] == 'open') {
                    //         classList[i] = '';
                    //     }
                    // }
                    // classList = classList.join(' ');
                    // input.className = classList;
                    // //由于再次点击出来的时候需要两次，所以还要做如下处理
                    // var attr = (event.currentTarget).closest(".dropdown").children[1].attributes['aria-expanded'];
                    // //"aria-expanded"
                    // attr.value = 'false';
                };

                initDate();

                $scope.clearSchedule = function () {
                    var data = {};
                    data.date = new Date();
                    data.time = new Date();
                    $scope.dateAndTime = {
                        time: new Date().toUTCString(),//startType==“SelectTime”时有效
                        date: processing.dateConversion(new Date().toUTCString()),// processing.dateConversion(profileInfo.schedule.scheduleStart), // '2017.06.18'
                    };
                    $scope.mytime = new Date();
                    processing.timeChanged();
                    $scope.$emit('scheduleClear', data);
                }
                $scope.showCalender = function ($event) {
                    //1、在使用日期插件的时候由于每次都会new一个所以导致切换多国语时生成的日历找不到准确的那个
                    var length = document.getElementsByClassName('kalendae k-floating').length;
                    var el = document.getElementsByClassName('kalendae k-floating')[length - 1];
                    //var el = document.getElementsByClassName('kalendae k-floating')[0];
                    var curAttr = document.getElementById("select-date-picker-dialog").getBoundingClientRect();
                    var top = curAttr.top;
                    var screenH = document.documentElement.scrollHeight;
                    var left = curAttr.right + 2;
                    var isLeft = false;
                    if ((screenH - top - 32) > 260) {//(
                        top = top + 32;
                    } else if (top > 260) {
                        top = top - 262
                    } else {
                        top = 0;
                        isLeft = true;
                    }
                    el.style.top = top + 'px';
                    if (isLeft) {
                        el.style.left = left + 'px';
                    }
                    document.getElementById('calender_oneTime').focus();
                };
                $scope.$on('dateAndTime', function (event, data) {
                    initDate(data);
                });
                $scope.$on('enableDateAndTime', function (event, data) {
                    $scope.disabledDateAndTime = data;
                });

                /*
                 * Calendar
                 * 配置参数
                 */
                var k1 = new Kalendae.Input('calender_oneTime', {
                    months: 1,
                    direction: 'any',//这个参数默认为any可只选未来的时间
                    mode: 'single',
                    format: 'YYYY.MM.DD',
                    closeButton: false,
                    offsetTop: 1,
                    offsetLeft: 1,
                    subscribe: {
                        'change': function (date) {
                            calendar.time = this.getSelectedAsDates();
                            $scope.mytime = date._d;
                            $scope.$emit('dateAndTimeChange', $scope.mytime);
                            this.hide();
                        },
                        'date-clicked': function (date) {
                            if ($scope.amPm == 'AM') {
                                var clockHour = $scope.clockHour;
                            } else {
                                var clockHour = parseInt($scope.clockHour) + 12;
                            }
                            var time1 = date._i + " " + clockHour + ":" + $scope.clockMinute;
                            time1 = new Date(time1.replace(/-/g, "\/"));
                            var time2 = new Date('2019-01-01T12:00:00'.replace(/-/g, "\/"));
                            if (time1 < time2) {
                                $scope.timeError = true;
                                this.hide();
                                $scope.$apply();//需要手动刷新
                                //发送按钮不能用的事件
                                $scope.$emit('disableButton', true);
                                //return false;
                            } else {
                                $scope.timeError = false;
                                //发送按钮可用的事件
                                $scope.$emit('disableButton', false);
                                return true;
                            }
                        }
                    }
                });
            }
        };
    });
});