/**
 * Created by guojiangchao on 2017/11/28.
 */
define(["app"], function (app) {

    app.register.service("FrontdeskService", function ($http, ajaxService, $q, Current) {
        this.Generate = function (param, success, error) {
            ajaxService.post(base_url + '/printerWork/Generate', param, success, error)
        }
        this.createPassCode = function (param, success, error) {
            ajaxService.post(base_url + '/printerWork/createPassCode', param, success, error)
        }
        this.deletePasscode = function (param, success, error) {
            ajaxService.post(base_url + '/printerWork/deletePasscode', param, success, error)
        }
        this.findPasscode = function (param, success, error) {
            ajaxService.post(base_url + '/printerWork/findPasscode', param, success, error)
        }
        this.updatePassCode = function (param, success, error) {
            param.orgId = Current.org().orgId;
            ajaxService.post(base_url + '/printerWork/updatePassCode', param, success, error)
        }
        this.readFdConfig = function (param, success, error) {
            ajaxService.post(base_url + '/printerWork/readFdConfig', param, success, error)
        }
        this.writeFdConfig = function (param, success, error) {
            ajaxService.post(base_url + '/printerWork/writeFdConfig', param, success, error)
        }
        this.getSSIDByUUID = function (param, success, error) {
            ajaxService.post(base_url + '/printerWork/getSSIDByUUID', param, success, error)
        }
        this.passcodeIsExist = function (param, success, error) {
            ajaxService.post(base_url + '/printerWork/passcodeIsExist', param, success, error)
        }
        this.findOrdersByPasscode = function (param, success, error) {
            ajaxService.post(base_url + '/printerWork/findOrdersByPasscode', param, success, error)
        }
    })
})