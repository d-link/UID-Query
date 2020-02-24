/**
 * Created by lizhimin on 2017/6/9.
 */
define(["filterModule"], function (fliters) {

    fliters.filter('vlanTagDetail', function (utils) {
        return function (input) {
            var vlanText = utils.getVlanText();
            var result = "";
            if (input) {
                for (var key in input) {
                    if (key == 'index' || key == 'vid' || key == 'name') continue;
                    if (input[key] == 1) {
                        result += vlanText[key] + ', ';
                    }
                }
                ;
            }
            if (result.length > 0) {
                result = result.slice(0, -2);

            }
            return result;
        };
    });
    fliters.filter('vlanUnTagDetail', function (utils) {
        return function (input) {
            var result = "";
            var vlanText = utils.getVlanText();
            if (input) {
                for (var key in input) {
                    if (key == 'index' || key == 'vid' || key == 'name') continue;
                    if (input[key] == 2) {
                        result += vlanText[key] + ', ';
                    }
                }
            }
            if (result.length > 0) {
                result = result.slice(0, -2);
            }
            return result;
        };
    });

});