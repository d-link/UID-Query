/**
 * Created by chencheng on 2017-11-29.
 */
define(["app"], function (app) {

    app.register.controller('printPreviewController', function ($scope, $timeout, $uibModal, $localStorage, FrontdeskService) {
        function detectIE() {
            var ua = window.navigator.userAgent;
            var msie = ua.indexOf('MSIE ');
            if (msie > 0) {
                // IE 10 or older => return version number
                return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
            }

            var trident = ua.indexOf('Trident/');
            if (trident > 0) {
                // IE 11 => return version number
                var rv = ua.indexOf('rv:');
                return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
            }

            var edge = ua.indexOf('Edge/');
            if (edge > 0) {
                // Edge (IE 12+) => return version number
                return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
            }

            return false;
        }
        $scope.isEDGE = detectIE();
      //  $scope.htmlTemp = '';
        var htmlText = '<table align="center" border="0" cellpadding="0" cellspacing="0" class="printTable">' +
            '<tbody><tr><td>SSID</td><td>%ssid%</td></tr><tr><td>Passcode</td><td>%passcode%</td></tr><tr><td>Duration</td><td>%duration%</td></tr><tr><td>Last Active Day</td><td>%lastActiveTime%</td>' +
            '</tr><tr><td>User Limit</td><td>%connectionLimit%</td></tr></tbody></table>';
        var param = {
            filePath: './customer/fdcfig.js'
        };
       $scope.printData = $localStorage.printData;
        $scope.htmlTemp = replaceStr(htmlText);
        FrontdeskService.readFdConfig(param, function (result) {
            $scope.printData = $localStorage.printData;
            if (result.success) {
                $scope.htmlTemp = replaceStr(result.data);
            } else {
                $scope.htmlTemp = replaceStr(htmlText);
            }
            if($scope.isEDGE&&$scope.isPrint){
                window.print();
                window.close();
            }else{
                window.status="ready to print";
            }
        });

        // $scope.$watch(function () {
        //     return angular.toJson($localStorage);
        // }, function () {
        //     $scope.printData = $localStorage.printData;
        //     htmlText = $localStorage.htmlText;
        //     $scope.htmlTemp = replaceStr(htmlText);
        // });

        // '>%' -> '>{{p.' | '%<' -> ' || ""}}<'
        function replaceStr(str) {
            if(!str) return '';
            var keywords = ['ssid', 'passcode', 'duration', 'lastActiveTime', 'connectionLimit'];
            var strKey = str.match(/>%[^\%]+%</g);
            strKey.forEach(function (s) {
                var k = s.substr(0, s.length - 2).substr(2);
                for (var i = 0; i < keywords.length; i++) {
                    if (k == keywords[i] && $scope.printData && $scope.printData.length > 0) {
                        // 替换字符串
                        var re = new RegExp(">%" + keywords[i] + "%<", "g");
                        str = str.replace(re, "/>{{p." + keywords[i] + "}}</");
                    }
                }
            });
            return str;
        };

    });
    app.register.directive('bindHtmlCompile', ['$compile',
        function ($compile) {
            return {
                restrict: 'EA',
                link: function (scope, element, attrs) {
                   scope.$watch(function () {
                            return scope.$eval(attrs.temp);
                        },
                        function (value) {
                            element.html(value);
                            $compile(element.contents())(scope);
                        });
                }
            };
        }]
    );

});
