/**
 * Created by lizhimin on 2018/7/31.
 */
define(['directiveModule'], function (directives) {
    directives.directive('blankValidator', [function () {

        return {
            restrict: 'A',
            require: 'ngModel',
            link: function ($scope, $element, $attrs, $ngModelCtrl) {
                var verifyRule = /^[\s]|[]$/gi;
                var verifyRule1=/^\s+/;
                var verifyRule2=/\s+$/;
                var verify = function (input) {
                   var test1= !verifyRule1.test(input);
                    var test2= !verifyRule2.test(input);
                    return test1&&test2;
                };
                $ngModelCtrl.$parsers.push(function (input) {
                    var validity = verify(input);
                    $ngModelCtrl.$setValidity('blank', validity);
                    return validity ? input : '';
                });
                $ngModelCtrl.$formatters.push(function (input) {
                    var validity = verify(input);
                    $ngModelCtrl.$setValidity('blank', validity);
                    return validity ? input : '';
                })
            }
        }
    }]);
    directives.directive('macFormat',[function(){
        return {
            restrict:'A',
            require:'ngModel',
            link:function($scope,$element,$attrs,$ngModelCtrl){
                var verifyRule1=/([0-9a-fA-F]{2}(:[0-9a-fA-F]{2}){5})/;
                var verify = function (input) {
                    if(!input) return true;
                    if(!verifyRule1.test(input)){
                        return false;
                    }
                    return true;
                };
                $ngModelCtrl.$parsers.push(function (input) {
                    var validity = verify(input);
                    $ngModelCtrl.$setValidity('macFormat', validity);
                    return validity ? input : '';
                });
                $ngModelCtrl.$formatters.push(function (input) {
                    var validity = verify(input);
                    $ngModelCtrl.$setValidity('macFormat', validity);
                    return validity ? input : '';
                })
            }
        }
    }]);
    directives.directive('macValidator',[function(){
        return {
            restrict:'A',
            require:'ngModel',
            link:function($scope,$element,$attrs,$ngModelCtrl){
                var verifyRule1=/([0-9a-fA-F]{2}(:[0-9a-fA-F]{2}){5})/;
                var verifyRule2=['00:00:00:00:00:00','FF:FF:FF:FF:FF:FF'];
                var verify = function (input) {

                    if(!verifyRule1.test(input)){
                        return true;
                    }else{
                        if((verifyRule2.indexOf(angular.uppercase(input))!=-1)){
                            return false;
                        }
                    }
                    return true;
                };
                $ngModelCtrl.$parsers.push(function (input) {
                    var validity = verify(input);
                    $ngModelCtrl.$setValidity('macInvalid', validity);
                    return validity ? input : '';
                });
                $ngModelCtrl.$formatters.push(function (input) {
                    var validity = verify(input);
                    $ngModelCtrl.$setValidity('macInvalid', validity);
                    return validity ? input : '';
                })
            }
        }
    }]);
    directives.directive('ipFormat',[function(){
        return {
            restrict:'A',
            require:'ngModel',
            link:function($scope,$element,$attrs,$ngModelCtrl){

                var verifyRule1=/^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;
                var verify = function (input) {
                    if(!input) return true;
                    if(!verifyRule1.test(input)){
                        return false;
                    }
                    return true;
                };
                $ngModelCtrl.$parsers.push(function (input) {
                    var validity = verify(input);
                    $ngModelCtrl.$setValidity('ipFormat', validity);
                    return validity ? input : '';
                });
                $ngModelCtrl.$formatters.push(function (input) {
                    var validity = verify(input);
                    $ngModelCtrl.$setValidity('ipFormat', validity);
                    return validity ? input : '';
                })
            }
        }
    }]);
    directives.directive('ipValidator',[function(){
        return {
            restrict:'AE',
            require:'ngModel',
            link:function($scope,$element,$attrs,$ngModelCtrl){
                var verifyRule1=/^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;
                var verifyRule2=['127.0.0.1','0.0.0.0','255.255.255.255'];
                var verify = function (input) {

                    if(!verifyRule1.test(input)){
                        return true;
                    }else{
                        if((verifyRule2.indexOf(input)!=-1)){
                            return false;
                        }
                        let IP = input.split(".");
                        let sortIP = parseInt(parseInt(IP[0]) * 256 * 256 * 256 + parseInt(IP[1]) * 256 * 256 + parseInt(IP[2]) * 256 + parseInt(IP[3]));
                        if(IP[3]==0||IP[3]==255||IP[0]==127) return false;
                        if(IP[0]==0) return false;
                        if(IP[0]==169&&IP[1]==254) return false;
                    }
                    return true;
                };
                $ngModelCtrl.$parsers.push(function (input) {
                    var validity = verify(input);
                    $ngModelCtrl.$setValidity('ipInvalid', validity);
                    return validity ? input : '';
                });
                $ngModelCtrl.$formatters.push(function (input) {
                    var validity = verify(input);
                    $ngModelCtrl.$setValidity('ipInvalid', validity);
                    return validity ? input : '';
                })
            }
        }
    }]);
    directives.directive('ipdomainFormat',[function(){
        return {
            restrict:'AE',
            scope: {
               needValid:'='
            },
            replace:true,
            require:'ngModel',
            template:'<input type="text">',
            link:function(scope,element,attrs,$ngModelCtrl){
                var inputs = element.find('input');
                if (attrs.$attr.placeholder) {
                    inputs.attr('placeholder', attrs.$attr.placeholder);
                }
                if (attrs.$attr.class) {
                    inputs.attr('class', attrs.$attr.class);
                }
                scope.$watch('needValid', function (value) {
                    if (scope.needValid) {
                        var validity = verify($ngModelCtrl.$modelValue);
                        $ngModelCtrl.$setValidity('ipdomainFormat', validity);
                    }else{
                        $ngModelCtrl.$setValidity('ipdomainFormat', true);
                    }
                });
                //verifyRule1:
                //这是标准的匹配ipv4地址的写法,可以参考《精通正则表达式》第三版^
                // 匹配开头1\d{2}匹配1开头的三位数,例如192
                // 2[0-4]\d匹配200至249之间的数字
                // 25[0-5]匹配250至255之间的数字
                // [1-9]\d匹配两位数[1-9]匹配一位数
                // \.匹配ip...
                //verifyRule3:
                //DNS规定，域名中的标号都由英文字母和数字组成，每一个标号不超过63个字符，也不区分大小写字母。
                // 标号中除连字符（-）外不能使用其他的标点符号。级别最低的域名写在最左边，而级别最高的域名写在最右边。由多个标号组成的完整域名总共不超过255个字符。
                // 由此匹配完整域名的正则表达式：
                // ^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$
                // 例如：baidu.com
                //  匹配网址：
                // ^(?=^.{3,255}$)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)*(\/\w+\.\w+)*$
                // 例如： http://www.baidu.com
                // 匹配http url：
                // ^(?=^.{3,255}$)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)*(\/\w+\.\w+)*([\?&]\w+=\w*)*$
                // 例如： http://www.tetet.com/index.html?q=1&m=test
                var verifyRule1=/^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;
                var verifyRule2=['127.0.0.1','0.0.0.0','255.255.255.255'];
                var verifyRule3 = "";
                var verify = function (input, verifyRule3) {
                    if (!verifyRule3) {
                        verifyRule3 = /^(?=^.{3,255}$)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)*(\/\w+\.\w+)*$/;
                    }
                    if(!scope.needValid) return true;
                    if(!verifyRule1.test(input)){
                        if(!verifyRule3.test(input)){
                            return false;
                        }else{
                            return true;
                        }
                    }else{
                        if((verifyRule2.indexOf(input)!=-1)){
                            return false;
                        }
                        let IP = input.split(".");
                        let sortIP = parseInt(parseInt(IP[0]) * 256 * 256 * 256 + parseInt(IP[1]) * 256 * 256 + parseInt(IP[2]) * 256 + parseInt(IP[3]));
                        if(IP[3]==0||IP[3]==255||IP[0]==127) return false;
                        if(IP[0]==0) return false;
                        if(IP[0]==169&&IP[1]==254) return false;
                    }
                    return true;
                };
                $ngModelCtrl.$parsers.push(function (input) {
                    if ($ngModelCtrl.$name == "NTPServer") {
                        verifyRule3 = /^([a-zA-Z0-9][-a-zA-Z0-9]{0,62}\.){1,3}[a-zA-Z0-9][-a-zA-Z0-9]{0,60}$/;
                    }
                    var validity = verify(input, verifyRule3);
                    $ngModelCtrl.$setValidity('ipdomainFormat', validity);
                    return input;
                });
                $ngModelCtrl.$formatters.push(function (input) {
                    var validity = verify(input);
                    $ngModelCtrl.$setValidity('ipdomainFormat', validity);
                    return input;
                })
            }
        }
    }])
});