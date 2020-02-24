/**
 * Created by lizhimin on 11/7/16.
 */
define(["serviceModule"], function (services) {

    services.service("LicenseService", function (ajaxService, Current) {
        this.addLicense = function (license,success,error) {
            ajaxService.post(base_url + '/license/add', license,success,error);
        };
        this.delLicense = function (licenseId,success,error) {
            ajaxService.post(base_url + '/license/del', {_id: licenseId},success,error);
        };
        this.getLicenses=function(success,error){
            ajaxService.post(base_url + '/license',{orgId:Current.org().orgId},success,error);
        }
    });
});