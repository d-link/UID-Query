/**
 * Created by guojiangchao on 2017.12.19.
 */
define(["serviceModule"], function (services) {

    services.service("CustomService", function ($http, ajaxService, Current) {
    	this.getUseCustom=function(param, success, error){
    	    ajaxService.post(base_url + '/useCustom/getUseCustom',param,success,error)
    	}
       	this.setUseCustom=function(param, success, error){
       	    ajaxService.post(base_url + '/useCustom/setUseCustom',param,success,error)
       	}
    })
})