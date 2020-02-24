/**
 * Created by lizhimin on 11/25/16.
 */
define(["serviceModule"], function (services) {

    services.service("LogService", function (ajaxService, Current) {
       //rules :{snmpVersion:'',genericType:'',timeRange:{from:'date',to:'date'},siteId:'',networkId:'',}
        this.getAllTraps = function (rules,page,success,error) {
            ajaxService.post(base_url + '/log/traplog/getAll', {orgId: Current.org().orgId,searchRule:rules,page:page},success,error);
        };
        //rules:{timeRange:{from:'date',to:'date'},siteId:'',networkId:'','severity':1}
        this.getAllSyslogs = function (rules,page,success,error) {
            ajaxService.post(base_url + '/log/syslog/getAll', {orgId: Current.org().orgId,searchRule:rules,page:page},success,error);
        };
        //rules:{timeRange:{from:'date',to:'date'},siteId:'',networkId:'','severity':1}
        this.getEUSyslogs = function (rules,page,success,error) {
            ajaxService.post(base_url + '/log/syslog/getEU', 
            {orgId: Current.org().orgId,
             searchRule:rules,
             page:page},
             success,
             error);
        };
        //rules:{timeRange:{from:'date',to:'date'},siteId:'',networkId:'','taskType':''}
        this.getAllDevs = function (rules,page,success,error) {
            ajaxService.post(base_url + '/log/devicelog/getAll', {orgId: Current.org().orgId,searchRule:rules,page:page},success,error);
        };
        //rules:{timeRange:{from:'date',to:'date'},siteId:'',networkId:'','logType':''}
        this.getAllEvents = function (rules,page, success,error) {
            ajaxService.post(base_url + '/log/eventlog/getAll', {orgId: Current.org().orgId,searchRule:rules,page:page},success,error);
        };
        this.getAllOperateLogs = function (time, success,error) {
            ajaxService.post(base_url + '/log/operatelog/getAll', {orgId: Current.org().orgId, time:time},success,error);
        };
        this.getAllNotification = function (success,error) {
            ajaxService.post(base_url + '/log/notifylog/getAll', {orgId: Current.org().orgId},success,error);
        };
    });
});