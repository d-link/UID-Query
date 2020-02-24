/**
 * Created by Redd Lin on 2018/11/19.
 */

define(["serviceModule"], function (services) {
    services.service('Avt', function($http, ajaxService, Current){
        this.getAvt = function(success, error) {
            ajaxService.post('/api/web/avt/getAvt', success, error);            
        };
        this.updateRemindMe = function(success, error) {
            ajaxService.post('/api/web/avt/updateRemindMe', success, error);     
        };  
        this.activateStrav = function(actData, success, error) {
            ajaxService.post('/api/web/avt/activateStrav', {
                email: actData.email,
                access_token: actData.access_token
            }, success, error);
        };
        this.getNucliasPublicKey = function(success, error) {
            ajaxService.get('/api/web/avt/nuclias/getPublicKey', success, error);
        };
        this.nucliasLogin = function(formData, success, error) {            
            ajaxService.post('/api/web/avt/nuclias/nucliasLogin', {
                publicKey: formData.publicKey,
                userName: formData.userName,
                password: formData.password
            }, success, error);
        };
        this.nucliasQuest = function(formData, success, error) {            
            ajaxService.post('/api/web/avt/nuclias/nucliasQuest', {
                access_token: formData.access_token,
                email: formData.email,
                quests: formData.quests,
                server_site: formData.server_site
            }, success, error);
        };
    });
});
