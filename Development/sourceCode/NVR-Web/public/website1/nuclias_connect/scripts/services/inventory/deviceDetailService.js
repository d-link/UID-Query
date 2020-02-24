/**
 * Created by lizhimin on 9/22/16.
 */
define(["app"], function (app) {

    app.register.service("DeviceDetailService", function (ajaxService, Current) {
        this.getDeviceDetail = function (devId, success) {
            ajaxService.post(base_url + "/device/getDeviceById", {devId: devId}, success);
        };
        this.getCurrentLoad = function (devId, success) {
            ajaxService.post(base_url + '/monitor/getCurrentLoad', {devId: devId}, success);
        };
        this.getDevicePanel=function(devId,success){
            ajaxService.post(base_url + '/device/getPanelDevice', {devId: devId}, success);
        };
        this.getPortDetail=function(devId,portId,success){
            ajaxService.post(base_url + '/rack/getPortDetails', {devId: devId,portId:portId}, success);
        };
        //param={devId:'',clientMAC:''}
        this.kickOffClient=function(param,success,error){
            ajaxService.post(base_url + '/deviceDetail/kickOffClient', param, success,error);
        };
        this.blockClient=function(param,success,error){
            ajaxService.post(base_url + '/deviceDetail/blockClient', param, success,error);
        };
        this.unblockClient=function(param,success,error){
            ajaxService.post(base_url + '/deviceDetail/unblockClient', param, success,error);
        };
        this.renameClient=function(param,success,error){
            ajaxService.post(base_url + '/deviceDetail/renameClient', param, success,error);
        };
        this.getDeviceInfo = function (devId, success, error) {
            ajaxService.post(base_url + "/deviceDetail/getDeviceInfo", {devId: devId}, success, error);
        };
        this.getClientInfos = function (devMAC, success, error) {
            ajaxService.post(base_url + "/deviceDetail/getClientInfos", {devMAC: devMAC}, success, error);
        };
        this.getNotification = function (devId, success, error) {
            ajaxService.post(base_url + "/deviceDetail/getDeviceNotify", {devId: devId}, success, error);
        };
        this.saveDeviceInfo = function (param, success, error) {
            ajaxService.post(base_url + "/deviceDetail/updateDeviceInfo", param, success, error);
        };
        this.saveTriggerAndProfile = function (param, success, error) {
            ajaxService.post(base_url + "/deviceDetail/updateProfileAndTriggerByDev", param, success, error);
        };
        this.getSupplierInfo = function(supplierId, success, error) {
            ajaxService.post(base_url + "/deviceDetail/getSupplierInfo", {supplierId: supplierId}, success, error);
        };


        this.resetPowerSetting24 = function(param, success, error){
            ajaxService.post(base_url + '/device/resetPowerSetting24', param, success, error)
        }
        this.resetPowerSetting5 = function(param, success, error){
            ajaxService.post(base_url + '/device/resetPowerSetting5', param, success, error)
        }
        this.resetPowerSetting5G2 = function(param, success, error){
            ajaxService.post(base_url + '/device/resetPowerSetting5G2', param, success, error)
        }
        this.resetChannel24 = function(param, success, error){
            ajaxService.post(base_url + '/device/resetChannel24', param, success, error)
        }
        this.resetChannel5 = function(param, success, error){
            ajaxService.post(base_url + '/device/resetChannel5', param, success, error)
        }
        this.resetChannel5G2 = function(param, success, error){
            ajaxService.post(base_url + '/device/resetChannel5G2', param, success, error)
        }
        this.resetSupplier = function (param, success, error) {
            ajaxService.post(base_url + '/device/resetSupplier', param, success, error)
        }
        this.resetLocation = function(param, success, error){
            ajaxService.post(base_url + '/device/resetLocation', param, success, error)
        }
        this.resetName = function(param, success, error){
            ajaxService.post(base_url + '/device/resetName', param, success, error)
        }
        this.resetTrigger = function(param, success, error){
            ajaxService.post(base_url + '/device/resetTrigger', param, success, error)
        }
        this.resetProfile = function(param, success, error){
            ajaxService.post(base_url + '/device/resetProfile', param, success, error)
        }
        this.reboot = function(param, success, error){
            ajaxService.post(base_url + '/device/reboot', param, success, error)
        }
    });
});
