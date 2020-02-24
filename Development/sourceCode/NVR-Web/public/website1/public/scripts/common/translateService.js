/**
 * Created by lizhimin on 2018/5/7.
 */

define(["serviceModule"], function (services) {
    services.service("TS",function($translate) {
        this.ts=function(key) {
            if(key){
                return $translate.instant(key);
            }
            return key;
        };
    });
});