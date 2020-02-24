/**
 * Created by lizhimin on 2017/2/23.
 */
define(['directiveModule'], function (directives) {
    directives.directive('captchaDirective', function ($document) {
        var linkFunction = function(scope, element, attributes) {
            var imag = element.children()[0];
            scope.captcha="/api/web/auth/getCaptcha?width=100&height=26&"+(new Date().getTime());
          /*  angular.element(element).on("click", function() {
                angular.element(imag).attr("src", "/api/auth/getCaptcha?width=100&height=26");
            });*/
            scope.refresh=function(){
              /*  angular.element(imag).attr("src", "");
                angular.element(imag).attr("src", "/api/auth/getCaptcha?width=100&height=26");*/
               // scope.captcha="/api/auth/getCaptcha?width=100&height=26";
                var d = new Date()
                angular.element(imag).attr("src", "/api/web/auth/getCaptcha?width=80&height=26&"+d.getTime());
            };
            // 刷新验证码
            scope.$on('refresh captcha', function() {  
                scope.refresh();
            });
        };

        return {
            restrict: "E",
            template: '<img src="/api/web/auth/getCaptcha?width=80&height=26&'+(new Date().getTime())+'" ng-click="refresh();"></img>',
            link: linkFunction
        };
    });
})
;