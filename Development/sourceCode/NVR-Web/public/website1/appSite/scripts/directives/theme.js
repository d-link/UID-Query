/**
 * Created by lizhimin on 2016/5/19.
 */
define(['directiveModule','blue','green','orange'], function (directives) {
    directives.factory('theme', ['blue', 'green', 'orange', function (blue, green, orange) {
        var themes = {
            orange: orange,
            blue: blue,
            green: green
        };

        return {
            get: function (name) {
                return themes[name] ? themes[name] : {};
            }
        };

    }]);
});