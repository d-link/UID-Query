/**
 * Created by zhiyuan on 2018/4/11.
 */

define(["serviceModule"], function (services) {

    services.service("statsService", function ($http, ajaxService, Current) {

        this.getQuarterlySiteNetworks = function (success, error) {
            ajaxService.post(base_url + '/stats/getDailySiteNetworks', success, error)
        }

        this.getHourlySiteNetworks = function (success, error) {
            ajaxService.post(base_url + '/stats/getHourlySiteNetworks', success, error)
        }

        this.getDailySiteNetworks = function (success, error) {
            ajaxService.post(base_url + '/stats/getDailySiteNetworks', success, error)
        }

        this.getLastHourUniqueClients = function (param, success, error) {
            ajaxService.post(base_url + '/stats/lastHour/uniqueClients', param, success, error)
        };

        this.getLastHourTraffic = function (param, success, error) {
            ajaxService.post(base_url + '/stats/lastHour/traffic', param, success, error)
        };

        this.getLastHourTrafficTxRx = function (param, success, error) {
            ajaxService.post(base_url + '/stats/lastHour/trafficTxRx', param, success, error)
        };

        this.getLastHourTrafficSSID = function (param, success, error) {
            ajaxService.post(base_url + '/stats/lastHour/trafficSSID', param, success, error)
        };

        this.getHotTimeUniqueClientsThreshold = function (param, success, error) {
            ajaxService.post(base_url + '/stats/hotTime/uniqueClientsThreshold', param, success, error)
        };

        this.getHotTimeTrafficUsageThreshold = function (param, success, error) {
            ajaxService.post(base_url + '/stats/hotTime/trafficUsageThreshold', param, success, error)
        };

        this.getHotTimeUniqueClients = function (param, success, error) {
            ajaxService.post(base_url + '/stats/hotTime/uniqueClients', param, success, error)
        };

        this.getHotTimeTrafficUsage = function (param, success, error) {
            ajaxService.post(base_url + '/stats/hotTime/traffic', param, success, error)
        };

        this.getUniqueClientsHourlyThreshold = function (param, success, error) {
            ajaxService.post(base_url + '/stats/hourly/uniqueClientsThreshold', param, success, error)
        };

        this.getTrafficHourlyThreshold = function (param, success, error) {
            ajaxService.post(base_url + '/stats/hourly/trafficThreshold', param, success, error)
        };

        this.getUniqueClientsHourlyByDay = function (param, success, error) {
            ajaxService.post(base_url + '/stats/hourly/uniqueClients', param, success, error)
        };

        this.getTrafficHourlyByDay = function (param, success, error) {
            ajaxService.post(base_url + '/stats/hourly/traffic', param, success, error)
        };

        this.getUniqueClientsDaily = function (param, success, error) {
            ajaxService.post(base_url + '/stats/daily/uniqueClients', param, success, error)
        };

        this.getTrafficUsageDaily = function (param, success, error) {
            ajaxService.post(base_url + '/stats/daily/trafficUsage', param, success, error)
        };

        this.getHotApUniqueClientThreshold = function (success, error) {
            ajaxService.post(base_url + '/stats/getHotApUniqueClientThreshold', success, error)
        };

        this.getHotApTrafficThreshold = function (success, error) {
            ajaxService.post(base_url + '/stats/getHotApTrafficThreshold', success, error)
        };

        this.getUniqueClientsForAps = function (param, success, error) {
            ajaxService.post(base_url + '/stats/getUniqueClientsForAps', param, success, error)
        };

        this.getTrafficUsageForAps = function (param, success, error) {
            ajaxService.post(base_url + '/stats/getTrafficUsageForAps', param, success, error)
        };

    });
});