/**
 * Created by lizhimin on 2016/5/19.
 */
define(['app', 'scripts/directives/theme/blue', 'scripts/directives/theme/green', 'scripts/directives/theme/orange'], function (app) {
    app.register.factory('theme', ['blue', 'green', 'orange', function (blue, green, orange) {
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