/**
 * Created by lizhimin on 2016/1/4.
 */
define(["serviceModule"], function (services) {
    services.service("StorageService",function() {
            this.get=function (key) {
                return localStorage.getItem(key);
            };
            this.set=function(key, val) {
                return localStorage.setItem(key, val);
            };
            this.unset=function(key) {
                return localStorage.removeItem(key);
            }
    });
});