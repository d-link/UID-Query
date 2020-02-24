/**
 * Created by lizhimin on 11/9/16.
 */
define(["serviceModule"], function (services) {

    services.service("TaskService", function (ajaxService, Current) {
        this.getTaskByType = function (type,success,error) {
            ajaxService.post(base_url + '/task', {type: type},success,error);
        };
        this.addTask = function (taskData,success,error) {
            ajaxService.post(base_url + '/task/add', taskData,success,error);
        };
        this.getModulesByDeviceType=function(deviceType,success,error){
            ajaxService.post(base_url + '/modules', {deviceType: deviceType},success,error);
        };
        this.getDeviceCommandByModuleType=function(moduleType,success,error){

            ajaxService.post(base_url + '/deviceCommand', {moduleType: moduleType},success,error);
        }
        this.getDeviceTypes=function(success,error){
            ajaxService.post(base_url + "/deviceTypes",{},success,error);
        }
        this.getModulesFun=function(fun,success,error){
            ajaxService.post(base_url + '/modules/funName', {funName: fun},success,error);
        };
        this.getDevice=function(id,success,error){
            ajaxService.post(base_url+"/tag/devices", {tagId: id},success,error);
        }
    });
});