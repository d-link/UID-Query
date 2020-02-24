/**
 * Created by lizhimin on 2016/1/4.
 */
define(["serviceModule"], function (services) {

    services.service('ajaxService', function ($http, $q) {

        // setting timeout of 1 second to simulate a busy server.
            this.post=function (route, data, successFunction, errorFunction) {
                // blockUI.start();
                //  setTimeout(function () {
                if (typeof data === 'function'){
                    errorFunction=successFunction;
                    successFunction=data;
                    data={};
                }
                var cancelRequest = $q.defer();
                $http.post(route, data, {
                    timeout: cancelRequest.promise, /*当你需要手动取消请求的时候，需要给timeout传递一个promise对象*/
                    cancel: cancelRequest
                }).then(function (result) {
                    //  blockUI.stop();
                    var status = result.status;
                    var headers = result.headers;
                    var config = result.config;
                    var data = result.data;
                    _updateToken(headers);

                    if(successFunction){
                        successFunction(data);
                    }
                    cancelRequest.resolve(data);
                }).catch(function (data) {
                    //  blockUI.stop();
                    if(errorFunction){
                        errorFunction(data.data);
                    }
                    cancelRequest.reject(data.data);
                });
                //  }, 1000);
                //return cancelRequest.promise; // 把defered对象中的promise对象返回出来,是为了在外部用then的方式调用
            };
            this.get=function (route, successFunction, errorFunction) {
              //  blockUI.start();
              //  setTimeout(function () {
                var cancelRequest = $q.defer();
                $http({
                    method: 'GET', url: route,
                    timeout: cancelRequest.promise, /*当你需要手动取消请求的时候，需要给timeout传递一个promise对象*/
                    cancel: cancelRequest
                }).then(function (result) {
                       // blockUI.stop();
                      //  _updateToken(headers);
                        var status = result.status;
                        var headers = result.headers;
                        var config = result.config;
                        var data = result.data;
                        if(successFunction){
                            successFunction(data);
                        }
                    cancelRequest.resolve(data);
                    }).catch(function (data) {
                      //  blockUI.stop();
                        if(errorFunction){
                            errorFunction(data.data);
                        }
                    cancelRequest.reject(data.data);
                    });
               // }, 1000);

            };
            this.AjaxGetWithData=function (route,data,  successFunction, errorFunction) {
              //  blockUI.start();
             //   setTimeout(function () {
                var cancelRequest = $q.defer();
                    $http({
                        method: 'GET',
                        url: route,
                        params: data,
                        timeout: cancelRequest.promise, /*当你需要手动取消请求的时候，需要给timeout传递一个promise对象*/
                        cancel: cancelRequest
                    }).then(function (result) {
                        //  blockUI.stop();
                        var status = result.status;
                        var headers = result.headers;
                        var config = result.config;
                        var data = result.data;
                        successFunction(data);
                        cancelRequest.resolve(data);
                    }).catch(function (data) {
                       // blockUI.stop();
                        if(errorFunction){
                            errorFunction(data.data);
                        }
                        cancelRequest.reject(data.data);
                    });
               // }, 1000);

            };
            this.AjaxGetWithNoBlock=function (route,data,  successFunction, errorFunction) {
                setTimeout(function () {
                    var cancelRequest = $q.defer();
                    $http({
                        method: 'GET',
                        url: route,
                        params: data,
                        timeout: cancelRequest.promise, /*当你需要手动取消请求的时候，需要给timeout传递一个promise对象*/
                        cancel: cancelRequest
                    }).then(function (result) {
                        var status = result.status;
                        var headers = result.headers;
                        var config = result.config;
                        var data = result.data;
                        successFunction(data);
                        cancelRequest.resolve(data);
                    }).catch(function (data) {
                        if(errorFunction){
                            errorFunction(data.data);
                        }
                        cancelRequest.reject(data.data);
                    });
                }, 0);

            };
            this.downloadFile=function(route,data,successFunction,errorFunction){
                $http({
                    url: route,
                    method: "POST",
                    data: data, //this is your json data string
                    headers: {
                        'Content-type': 'application/json'
                    },
                    responseType: 'arraybuffer'
                }).then(function (result) {
                    var status = result.status;
                    var headers = result.headers;
                    var config = result.config;
                    var data = result.data;
                    if(successFunction){
                        successFunction(data);
                    }

                }).catch(function (result) {
                    var status = result.status;
                    var headers = result.headers;
                    var config = result.config;
                    var data = result.data;
                    //upload failed
                });
            };
            //lanSetting
           this.postWithTimeout=function (route, data, successFunction, errorFunction) {
               if (typeof data === 'function'){
                   errorFunction=successFunction;
                   successFunction=data;
                   data={};
               }
               if(!errorFunction){
                   errorFunction = successFunction;
               }
               $http.post(route, data, {timeout: 10000}).then(function (result) {
                    var status = result.status;
                    var headers = result.headers;
                    var config = result.config;
                    var data = result.data;
                    _updateToken(headers);

                    if(successFunction){
                        successFunction(data);
                    }
               }).catch(function (result) {
                    var status = result.status;
                    var headers = result.headers;
                    var config = result.config;
                    var data = result.data;
                    if(errorFunction){
                        if(!data){
                            data = {success: false, error: 408}; //timeout
                        }
                        errorFunction(data);
                    }
               });
            };
            this.updateToken=function(headers){
                _updateToken(headers);
            };
            function _updateToken(headers){
                if(headers){
                    var auth = headers('Authorization');
                    if(auth){
                        var part = auth.split(' ');
                        var token='';
                        if (part.length == 2) {
                            token= part[1];
                            
                            if(token){
                               // console.log("update token");
                                localStorage.setItem('auth_token',token);
                            }

                        }
                    }else{
                        //console.log("header is null");
                    }
                }

            }
    });
});
