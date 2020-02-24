/**
 * Created by lizhimin on 11/7/16.
 */
define(["serviceModule"], function (services) {

    services.service("NotificationService", function (ajaxService, Current) {

        this.allNotification=function(success,error){
            ajaxService.post(base_url+'/notification/AllNotification', {orgId: Current.org().orgId},success,error);
        }
        this.allSystemEvent=function(success,error){
            ajaxService.post(base_url+'/notification/AllSystemEvent',{orgId:Current.org().orgId},success,error);
        }
        this.acknowledgeAlert=function(alertIds,success,error){
            ajaxService.post(base_url+'/notification/acknowledge',{alertIds:alertIds,userName:Current.user().userName},success,error);
        }
        this.getAlertDetails=function(monitorType,eventIds,success,error){
            ajaxService.post(base_url+'/notification/getEventsByIds',{orgId:Current.org().orgId,monitorType:monitorType,eventIds:eventIds},success,error);
        }
        this.createNotifyRule=function(data,success,error){
            data.orgId = Current.org().orgId;
            ajaxService.post(base_url+'/notification/createNotifyRule',{notifyInfo:data},success,error);
        }
        this.getNotifyRule=function(success,error){
            ajaxService.post(base_url+'/notification/getNotifyRule',{orgId:Current.org().orgId},success,error);
        }
        this.updateNotifyRule=function(data,success,error){
            ajaxService.post(base_url+'/notification/updateNotifyRule',{notifyInfo:data},success,error);
        }
        this.deleteNotifyRule=function(_id,success,error){
            ajaxService.post(base_url+'/notification/deleteNotifyRule',{_id:_id},success,error);
        }
        this.getMoniterItems = function (success,error) {
            ajaxService.post(base_url+'/notification/getMoniterItems',success,error);
        }
        this.editStatus = function (id, status, success, error) {
            ajaxService.post(base_url+'/notification/editNotifyRuleStatus',{_id:id, status:status},success,error);
        }
    });
});