/**
 * Created by lizhimin on 2016/1/7.
 */
define(["serviceModule"], function (services) {

    services.service("OrganizationService", function ($q, ajaxService, Current) {

        this.listOneOrg = function (userId, success, error) {
            ajaxService.post(base_url + '/org/listOne', {userId: userId}, success, error);
        };
        this.getSystemStatus = function (success, error) {
            ajaxService.post(base_url + '/systemAbout/getSystemStatus', success, error);
        };
        this.getOrgInfo = function (orgId, success, error) {
            ajaxService.post(base_url + '/org/getOrg', {orgId: orgId, userId: Current.user()._id}, success, error);
        };
        this.listOrgDetails = function (userId, success, error) {
            ajaxService.post(base_url + '/org/listDetail', {userId: userId}, success, error);
        }
        this.listAllOrgs = function (success, error) {
            ajaxService.post(base_url + '/org/listAll', success, error);
        }
        this.getNotificationCount = function (success, error) {
            if (Current.org()) {
                ajaxService.post(base_url + '/notification/getCount', {orgId: Current.org().orgId}, success, error);
            } else {
                success({success: false});
            }
        };
        this.getServerIPs = function (success, error) {
            ajaxService.get(base_url + '/global/serverIPs', success, error);
        };
        this.updateSystemSetting = function (setting, success, error) {
            ajaxService.post(base_url + '/org/updateSystemSetting', setting, success, error);
        };
        this.updateConnection = function (orgId, connection, success, error) {
            ajaxService.post(base_url + '/org/updateConnection', {
                orgId: orgId,
                connection: connection
            }, success, error);
        };
        this.updateBasic = function (orgId, basic, success, error) {
            ajaxService.post(base_url + '/org/updateBasic', {
                orgId: orgId,
                basic: basic
            }, success, error);
        };

        this.updateSMTP = function (orgId, smtpServer, success, error) {
            ajaxService.post(base_url + '/org/updateSMTP', {orgId: orgId, smtpServer: smtpServer}, success, error);
        };
        this.updatePayment = function (orgId, payment, success, error) {
            ajaxService.post(base_url + '/org/updatePayment', {orgId: orgId, payment: payment}, success, error);
        };
        this.getSensorSetting = function (success, error) {
            ajaxService.post(base_url + '/global/getSensorSetting', {orgId: Current.org().orgId}, success, error);
        };
        this.updatePollingSetting = function (setting, success, error) {
            ajaxService.post(base_url + '/global/updatePollingSetting', {sensor: setting}, success, error);
        };
        this.updateSensorSetting = function (setting, success, error) {
            ajaxService.post(base_url + '/global/updateSensorSetting', {sensor: setting}, success, error);
        };
        this.testSMTP = function (data, success, error) {
            ajaxService.post(base_url + '/org/testSMTP', data, success, error);
        };
        this.listModules = function (success, error) {
            ajaxService.get(base_url + '/org/getModules', success, error);
        };
        this.UpdateModules=function (success, error) {
            ajaxService.get(base_url + '/org/UpdateModules', success, error);
        };
        this.getGlobalSetting = function (success, error) {
            ajaxService.get(base_url + '/global', success, error);
        };
        this.updateDatabaseLogSetting=function(setting,success,error){
            ajaxService.post(base_url + '/global/database/logSetting', setting, success, error);
        };
        this.getAllHotApMaps = function (success, error) {
            ajaxService.post(base_url + '/org/hotAP/getAll', {orgId: Current.org().orgId}, success, error);
        };
        this.updateThreshold = function (threshold, success, error) {
            ajaxService.post(base_url + '/user/updateThreshold', {
                threshold: threshold
            }, success, error);
        };
        this.getNodeEnv = function (success, error) {
            ajaxService.get(base_url + '/getNodeEnv', success, error);
        }
        this.loadVersion=function(success,error){
            ajaxService.get(base_url + '/org/getVersion', success, error);
        }
        this.listSuppliers = function (success, error) {
            ajaxService.post(base_url + '/org/supplier/list', success, error);
        }
    })

});