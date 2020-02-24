/******
 * 一些公共的方法写在这里------------李莉红
 * ******/

define(["serviceModule"], function (services) {

    services.service("CommonService", function ($http, ajaxService) {

        /**
         * @method 从后台获取板子的时间，并且设置到全局变量里面
         * @author 李莉红
         * @version
         * */
        this.getNodeTime = function (success, error) {
            ajaxService.post(base_url + '/systemSetting/getDateAndTime', success, error);
        };
        this.getStatus = function (callback) {
            ajaxService.post(base_url + '/auth/getSystemInfo', function (result) {
                if (result.success) {
                    NTPStatus = result.data.NTPStatus;
                    SDStatus = result.data.sdStatus;
                }
                callback(result);
            });
        };
    });
});