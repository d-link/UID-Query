/**
 * Created by lizhimin on 2016/3/18.
 */
define(['directiveModule'],function(directives){
    directives.directive('ipMask', function($rootScope,$timeout){
        return {
            restrict: 'AE',
            require: '?^ngModel',
            templateUrl: './scripts/directives/ip-mask-template.html',
            link: getLinkFunction($rootScope,$timeout)

        }
        function getLinkFunction($rootScope,$timeout) {
            return function (scope, element, attrs, ngModel) {

                var inputs = element.find('input'), firstInputEl = inputs.eq(0), secondInputEl = inputs.eq(1),
                    thirdInputEl = inputs.eq(2), fourthInputEl = inputs.eq(3);
                if (attrs.$attr.disabled == "disabled") {
                    inputs.attr('disabled', 'disabled');
                    element.addClass('disabled');
                }else{
                    scope.$on('disabledChange', function(e, d) {
                        if (d) {
                            inputs.removeAttr('disabled');
                            element.removeClass('disabled');
                        }else{
                            inputs.attr('disabled', 'disabled');
                            element.addClass('disabled');
                        }
                    });
                };
                var current = {first: '', second: '', third: '', fourth: ''};
                if (ngModel) {
                    ngModel.$render = function () {
                        if (ngModel.$modelValue) {
                            var ipString = ngModel.$modelValue;
                            var valArr = ipString.split(".");
                            if (4 == valArr.length) {
                                current.first = valArr[0];
                                current.second = valArr[1];
                                current.third = valArr[2];
                                current.fourth = valArr[3];
                                scope.first = valArr[0];
                                scope.second = valArr[1];
                                scope.third = valArr[2];
                                scope.fourth = valArr[3];
                            }
                        }
                    }
                }
                scope.checkIP = function () {
                    scope.isFocus = false;
                    var ipString = ngModel.$modelValue;
                    var reg = new RegExp("^(1\\d{2}|2[0-4]\\d|25[0-5]|[1-9]\\d|[1-9])\\."
                        + "(1\\d{2}|2[0-4]\\d|25[0-5]|[1-9]\\d|\\d)\\."
                        + "(1\\d{2}|2[0-4]\\d|25[0-5]|[1-9]\\d|\\d)\\."
                        + "(1\\d{2}|2[0-4]\\d|25[0-5]|[1-9]\\d|\\d)$");
                    $timeout(function () {
                        if (!scope.isFocus) {
                            if (!ipString.match(reg)) {
                                scope.error = true;
                            } else {
                                scope.error = false;
                            }
                            $rootScope.$emit('ValidIP', scope.error);
                            console.log(scope.error);
                        }

                    }, 100);

                }
                scope.resetIP = function () {
                    scope.isFocus = true;
                }
                scope.checkValue = function (flag, ev) {
                    if (!(/[\d.]/.test(String.fromCharCode(ev.keyCode)))) {
                        return;
                    }
                    var code = ev.keyCode;
                    if ((code < 48 && 8 != code && 37 != code && 39 != code)
                        || (code > 57 && code < 96)
                        || (code > 105 && 110 != code && 190 != code)) {
                        return false;
                    }

                };
                function refresh() {
                    var ipString = (current.first > 223 || current.first < 1 ? ("") : current.first) + "."
                        + (current.second > 255 || current.second < 0 ? ("") : current.second) + "."
                        + (current.third > 255 || current.third < 0 ? ("") : current.third) + "."
                        + (current.fourth > 255 || current.fourth < 0 ? ("") : current.fourth);
                    ngModel.$setViewValue(ipString);
                    updateTemplate();
                }

                function updateTemplate() {
                    scope.first = current.first;
                    scope.second = current.second;
                    scope.third = current.third;
                    scope.fourth = current.fourth;
                }

                scope.updateFirst = function (ev) {
                    var code = ev.keyCode;
                    if (scope.first == "") {
                        current.first = "";
                        refresh();
                        if (code == 46) {
                            secondInputEl[0].focus();
                        }
                        return;
                    }
                    var number = getFirstNumberFromTemplate();
                    if (angular.isDefined(number)) {
                        current.first = number;
                    }

                    if ((current.first > 23 && current.first < 100) || current.first.toString().length == 3) {
                        secondInputEl[0].focus();
                    }

                    if (110 == code || 190 == code) {
                        secondInputEl[0].focus();
                    }
                    refresh();
                };
                scope.updateOther = function (flag, ev) {
                    var code = ev.keyCode;
                    if (flag == "second" && scope.second == "") {
                        current.second = "";
                        refresh();
                        if (code == 8) {
                            firstInputEl[0].focus();
                        }
                        if (code == 46) {
                            thirdInputEl[0].focus();
                        }
                        return;
                    }
                    if (flag == "third" && scope.third == "") {
                        current.third = "";
                        refresh();
                        if (code == 8) {
                            secondInputEl[0].focus();
                        }
                        if (code == 46) {
                            fourthInputEl[0].focus();
                        }
                        return;
                    }
                    if (flag == "fourth" && scope.fourth == "") {
                        current.fourth = "";
                        refresh();
                        if (code == 8) {
                            thirdInputEl[0].focus();
                        }
                        return;
                    }
                    var number = getNumberFromTemplate(flag);


                    if (angular.isDefined(number)) {
                        if (flag == "second") {
                            current.second = number;
                            if ((current.second > 25 && current.second < 100) || current.second.toString().length == 3) {
                                thirdInputEl[0].focus();
                            }
                        }
                        if (flag == "third") {
                            current.third = number;
                            if ((current.third > 25 && current.third < 100) || current.third.toString().length == 3) {
                                fourthInputEl[0].focus();
                            }
                        }
                        if (flag == "fourth") {
                            current.fourth = number;
                        }

                    }
                    if (110 == code || 190 == code) {
                        if (flag == "second") thirdInputEl[0].focus();
                        if (flag == "third") fourthInputEl[0].focus();
                    }

                    refresh();
                };
                function getFirstNumberFromTemplate() {
                    var number = parseInt(scope.first, 10);

                    var valid = (number > 0 && number <= 223);
                    if (!valid) {
                        return undefined;
                    }
                    return number;
                }

                function getNumberFromTemplate(flag) {
                    var number = 0;
                    if (flag == "second") number = parseInt(scope.second, 10);
                    if (flag == "third") number = parseInt(scope.third, 10);
                    if (flag == "fourth") number = parseInt(scope.fourth, 10);
                    var valid = (number >= 0 && number <= 255);
                    if (!valid) {
                        return undefined;
                    }
                    return number;
                }
            }
        }
    });
});
