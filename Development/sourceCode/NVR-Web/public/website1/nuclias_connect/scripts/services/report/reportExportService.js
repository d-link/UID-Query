/**
 * Report模块相关的服务
 * Created by GongChen on 2018.3.22
 **/

define(["app"], function (app) {

    app.register.service("ReportExportService", function ($http, ajaxService) {
        //export hot time data and image to pdf file
        this.exportHotTime2PDF = function(param, success, error){
            ajaxService.downloadFile(base_url + '/cwmReportExport/exportHotTime2PDF', param, success, error);
        };

        //export hourly data and image to pdf file
        this.exportHourly2PDF = function(param, success, error){
            ajaxService.downloadFile(base_url + '/cwmReportExport/exportHourly2PDF', param, success, error);
        };
        //export daily traffic usage data and image to pdf file
        this.exportDailyTraffic2PDF = function(param, success, error){
            ajaxService.downloadFile(base_url + '/cwmReportExport/exportDailyTraffic2PDF', param, success, error);
        };
        //export hot ap data and image to pdf file
        this.exportHotAP2PDF = function(param, success, error) {
            ajaxService.downloadFile(base_url + '/cwmReportExport/exportHotAP2PDF', param, success, error);
        };
    });
})