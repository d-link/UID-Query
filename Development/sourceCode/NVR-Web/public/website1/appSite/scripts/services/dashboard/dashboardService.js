/**
 * Created by lizhimin on 11/7/16.
 */
define(["serviceModule"], function (services) {

    services.service("DashboardService", function ($http, ajaxService, $q, Current) {

        this.getSiteAndNetwork = function (success, error) {
            ajaxService.post(base_url + '/network/getSiteAndNetworkByOrg', {orgId: Current.org().orgId}, success, error);
        };

        this.getStateSummary = function (success, error) {
            ajaxService.post(base_url + '/dashboard/getStateSummary', {orgId: Current.org().orgId}, success, error);
        };
        //param:{orgId:'',siteId:'',networkId:''}
        this.getChannelUsedSummary = function (param, success, error) {
            param.orgId = Current.org().orgId;
            ajaxService.post(base_url + '/dashboard/getChannelUsedSummary', param, success, error);
        };
        this.getTOPApUsage = function (param, success, error) {
            param.orgId = Current.org().orgId;
            ajaxService.post(base_url + '/dashboard/getTopApUsage', param, success, error);
        };
        this.getLatestEvents = function (param, success, error) {
            param.orgId = Current.org().orgId;
            ajaxService.post(base_url + '/dashboard/getLatestEvents', param, success, error);
        };
        this.getClientInfos = function (param, page, success, error) {
            param.orgId = Current.org().orgId;
            ajaxService.post(base_url + '/monitor/getClientInfo', {searchRule: param, page: page}, success, error);
        };
        this.getBlockedClient = function (param, success, error) {
            param.orgId = Current.org().orgId;
            ajaxService.post(base_url + '/monitor/getBlockedClient', param, success, error);
        };
        this.getAPInfo = function (param, page, success, error) {
            param.orgId = Current.org().orgId;
            ajaxService.post(base_url + '/monitor/getAccessPoints', {searchRule: param, page: page}, success, error);
        };
        this.getTotalAPCount = function (param, success, error) {
            param.orgId = Current.org().orgId;
            ajaxService.post(base_url + '/monitor/getAccessPoints', {searchRule: param, page: page}, success, error);
        };
        this.getUDInfo = function (param, time, success, error) {
            param.orgId = Current.org().orgId;
            ajaxService.post(base_url + '/monitor/getAllUsageData', {searchRule:param, time:time}, success, error);
        };
    });
});