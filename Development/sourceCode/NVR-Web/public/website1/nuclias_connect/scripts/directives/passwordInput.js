/**
 * Created by lizhimin on 2018/8/6.
 */
define(['directiveModule'], function (directives) {
    directives.directive('passwordInput', function () {
        return {
            restrict: 'AE',
            require: 'ngModel',
            scope: {
                showPass:'@',
                maxLength: '=',
                minLength: '=',
                patternStr: '@',
                patternStr1:'@',
                placeholder: '@',
                ngBlank: '@',
                lostFocus: '&',
                ngDisabled: '='
            },
            templateUrl: './scripts/directives/passwordInput.html',
            link: getLinkFunction()
        };
        function getLinkFunction() {
            return function (scope, element, attrs, ngModel) {
                if(scope.showPass){
                    scope.showpass=scope.showPass;
                }
                var inputs = element.find('input');
                var div = element.find('div');
                if (attrs.class) {
                    div.addClass(attrs.class);
                }
                if (attrs.$attr.disabled == "disabled") {
                    inputs.attr('disabled', 'disabled');
                    element.addClass('disabled');
                    element.find('a').attr('disabled', 'disabled');
                    div.addClass('disabled');
                } else {

                }
                if (scope.maxLength) {
                    inputs.attr('maxlength', scope.maxLength);
                }
                if (scope.minLength) {
                    inputs.attr('minlength', scope.minLength);
                }
                if (scope.placeholder) {
                    inputs.attr('placeholder', scope.placeholder);
                }
                if (ngModel) {
                    ngModel.$render = function () {
                        if (ngModel.$modelValue) {
                            scope.passValue = ngModel.$modelValue;
                        }
                    }
                }
                scope.$watch('ngDisabled', function (value) {
                    if (scope.ngDisabled) {
                        inputs.attr('disabled', 'disabled');
                        element.addClass('disabled');
                        element.find('a').attr('disabled', 'disabled');
                        div.addClass('disabled');
                    } else {
                        inputs.removeAttr('disabled');
                        element.removeClass('disabled');
                        element.find('a').removeAttr('disabled');
                        div.removeClass('disabled');
                    }
                })
                scope.$on('resetInvalid', function(e, d) {

                });
                scope.$watch('maxLength', function (value) {
                    inputs.attr('maxlength', scope.maxLength);
                    if (scope.maxLength) {
                        if (ngModel.$modelValue && ngModel.$modelValue.length > scope.maxLength) {
                            ngModel.$setValidity('maxlength', false);
                         //   return false;
                        } else {
                            ngModel.$setValidity('maxlength', true);
                        }
                    }
                })
                scope.$watch('minLength', function (value) {
                    inputs.attr('minlength', scope.minLength);
                    if (scope.minLength) {
                        if (!ngModel.$modelValue|| ngModel.$modelValue.length < scope.minLength) {
                            ngModel.$setValidity('minlength', false);
                          //  return false;
                        } else {
                            ngModel.$setValidity('minlength', true);
                        }
                    }
                })
                scope.$watch('passValue', function (value) {
                    ngModel.$setViewValue(value);
                })
                ngModel.$parsers.push(function (v) {
                    if (scope.minLength) {
                        if (!v|| (v.length < scope.minLength)) {
                            ngModel.$setValidity('minlength', false);
                          //  return false;
                        } else {
                            ngModel.$setValidity('minlength', true);
                        }
                    }
                    if (scope.maxLength) {
                        if (v && v.length > scope.maxLength) {
                            ngModel.$setValidity('maxlength', false);
                           // return false;
                        } else {
                            ngModel.$setValidity('maxlength', true);
                        }
                    }
                    if (scope.ngBlank) {
                        var validity = verify(v);
                        ngModel.$setValidity('blank', validity);
                       // if (!validity) return  false;
                    }
                    if (scope.patternStr) {
                        var verifyRule = new RegExp(scope.patternStr);
                        var validity = verifyRule.test(v);
                        ngModel.$setValidity('pattern', validity);
                       // if (!validity) return false;
                    }
                    return v;
                });
                var verifyRule = /^[\s]|[]$/gi;
                var verifyRule1 = /^\s+/;
                var verifyRule2 = /\s+$/;
                var verify = function (input) {
                    var test1 = !verifyRule1.test(input);
                    var test2 = !verifyRule2.test(input);
                    return test1 && test2;
                };
                ngModel.$formatters.push(function (v) {
                    if (scope.minLength) {
                        if (v && v.length < scope.minLength) {
                            ngModel.$setValidity('minlength', false);
                        } else {
                            ngModel.$setValidity('minlength', true);
                        }
                    }
                    if (scope.maxLength) {
                        if (v && v.length > scope.maxLength) {
                            ngModel.$setValidity('maxlength', false);
                        } else {
                            ngModel.$setValidity('maxlength', true);
                        }
                    }
                    if (scope.ngBlank) {
                        var validity = verify(v);
                        ngModel.$setValidity('blank', validity);
                    }
                    if (scope.patternStr) {
                        var verifyRule = new RegExp(scope.patternStr);
                        var validity = verifyRule.test(v);
                        ngModel.$setValidity('pattern', validity);
                    }
                    scope.passValue = v;
                    return v;
                });
                scope.checkValue = function () {
                    if (scope.lostFocus) {
                        scope.lostFocus();
                    }
                }
                scope.changePass = function () {
                    if (scope.ngDisabled) return;
                    scope.showpass = !scope.showpass;
                }
            }
        };
    });
});