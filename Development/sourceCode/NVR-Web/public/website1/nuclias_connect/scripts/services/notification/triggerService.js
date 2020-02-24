/**
 * Created by lizhimin on 11/7/16.
 */
define(["serviceModule"], function (services) {

    services.service("TriggerService", function (ajaxService, Current) {
        //删除指定的trigger
        // this.delTrigger = function (triggerId,groupType, success) {
        //     ajaxService.post(base_url + '/trigger/delTrigger', {id: triggerId,groupType:groupType}, success);
        // };
        this.delTrigger = function (triggerId, success) {
            ajaxService.post(base_url + '/trigger/delTrigger', triggerId, success);
        };
        //删除设备应用的trigger
        this.delTriggerByDev = function (devId, success) {
            ajaxService.post(base_url + '/trigger/delTriggerByDev', {devId: devId}, success);
        };

        this.getTriggerView = function (success) {
            ajaxService.post(base_url + '/trigger/getTriggerView', {orgId: Current.org().orgId}, success);
        };
        //按设备视图返回trigger数据
        this.getDeviceView = function (success) {
            ajaxService.post(base_url + '/trigger/getDeviceView', {orgId: Current.org().orgId}, success);
        };
        //读取设备可选的trigger列表
        this.getTriggersByDeviceModuleType = function (module, success, error) {
            ajaxService.post(base_url + '/trigger/getTriggersByDeviceModule', {
                orgId: Current.org().orgId,
                module: module
            }, success);
        };
        this.getAllSensorItems = function (success, error) {
            ajaxService.get(base_url + "/trigger/getAllSensorItems", success);
        };
        this.addTrigger = function (data, success, error) {
            data.orgId = Current.org().orgId;
            ajaxService.post(base_url + '/trigger/addTrigger', {trigger: data}, success);
        };
        this.updateTrigger = function (data, success, error) {
            ajaxService.post(base_url + '/trigger/update', {trigger: data}, success);
        };
        this.addTrapTrigger = function (data, success, error) {
            ajaxService.post(base_url + '/trigger/addTrigger', {trigger: data, triggerType: 'trap'}, success);
        };
        this.addSyslogTrigger = function (data, success, error) {
            ajaxService.post(base_url + '/trigger/addTrigger', {trigger: data, triggerType: 'syslog'}, success);
        };
        this.getDefaultTrapTypes = function (success, error) {
            ajaxService.post(base_url + '/trigger/trap/getDefaultType', success, error);
        };
        this.getCustomerTrap = function (success, error) {
            ajaxService.post(base_url + '/trigger/trap/getCustomerTrap', {orgId: Current.org().orgId}, success, error);
        };
        this.getCustomerBinding = function (success, error) {
            ajaxService.post(base_url + '/trigger/trap/getCustomerBinding', {orgId: Current.org().orgId}, success, error);
        };
        // 获取trigger页面左侧列表
        this.getTriggerTree = function (success, error) {
            ajaxService.post(base_url + '/trigger/getTriggerTree', {orgId: Current.org().orgId}, success, error);
        };
        // 获取group下trigger列表
        this.getTriggerList = function (data, success, error) {
            data.orgId = Current.org().orgId;
            ajaxService.post(base_url + '/trigger/getTriggerByNetworkIdAndGroup', data, success, error);
        };
        // 提交trigger condition
        this.updateTriggerCondition = function(data, success, error){
            ajaxService.post(base_url+ '/trigger/updateTriggerCondition', data, success, error)
        };
        // 提交syslog condition
        // this.updateSyslogCondition = function(data, success, error){
        //     ajaxService.post(base_url+ '/api/trigger/updateSyslogCondition', data, success, error)
        // };
        // get trigger monitor data 
        this.getTriggerCondition = function(data, success, error){
            data.orgId = Current.org().orgId;
            ajaxService.post(base_url+ '/trigger/getTriggerCondition', data, success, error)
        };
        // get trapTypes
        this.getTrapTypes = function(success, error){
            ajaxService.post(base_url+ '/trigger/trap/getTrapTypes', {orgId: Current.org().orgId}, success, error)
        };
        // get trap data
        // this.getTrapCondition = function(data, success, error){
        //     ajaxService.post(base_url+ '/api/trigger/getTrapCondition', data, success, error)
        // };
        // update trap condition
        // this.updateTrapCondition = function(data, success, error){
        //     ajaxService.post(base_url+ '/api/trigger/updateTrapCondition', data, success, error)
        // };
    });
});