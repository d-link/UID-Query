/**
 * Created by guojiangchao on 2017.12.19.
 */
define(["serviceModule"], function (services) {

    services.service("CustomService", function ($http,$q, ajaxService, Current) {

		return {
			getUseCustom:function(param, success, error){
				ajaxService.post(base_url + '/useCustom/getUseCustom',param,success,error)
			},
			setUseCustom:function(param, success, error){
				ajaxService.post(base_url + '/useCustom/setUseCustom',param,success,error)
			},
			getPageAction:function( success, error){
				ajaxService.post(base_url + '/useCustom/getPageAction',{},success,error);
			},
			setPageAction:function(param, success, error){
				ajaxService.post(base_url + '/useCustom/setPageAction',param,success,error)
			}
		}
    })
})