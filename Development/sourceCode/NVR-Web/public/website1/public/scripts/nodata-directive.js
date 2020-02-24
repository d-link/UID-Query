/**
 * Created by lizhimin on 2017/9/14.
 */
define(['directiveModule'], function (directives) {
    directives.directive('nodataDirective', function ($document) {

        return {
            restrict: 'AE',
            template: function(tElement,attrs){
                var _html = '',
                    smallClass = '';
                if (attrs.small) smallClass = 'small-no-data';
                _html += '<div class="grid-no-data '+ smallClass +'"><img src="/public/images/no-data.png"> <p>'+attrs.desc+'</p></div>';
                return _html;
            }
        };
    });
    directives.directive('loadingDirective', function ($document) {

        return {
            restrict: 'AE',
            template: function(tElement,attrs){
                var _html = '',
                    smallClass = '';
                if (attrs.small) smallClass = 'small-no-data';
                _html += '<div class="grid-loading '+ smallClass +'"><img src="/public/images/loading.gif"></div>';
                return _html;
            }
        };
    });
});