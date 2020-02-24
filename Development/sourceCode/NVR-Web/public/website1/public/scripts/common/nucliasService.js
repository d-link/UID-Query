/**
 * Created by Redd Lin on 2019/02/11.
 */

define(["serviceModule"], function (services) {
    services.service('Nuclias', function($http, ajaxService, Current){

        this.getNucliasPublicKey = function(success, error) {
            ajaxService.get('/api/web/nuclias/getPublicKey', success, error);
        };

        this.nucliasLogin = function(formData, success, error) {            
            ajaxService.post('/api/web/nuclias/nucliasLogin', {
                publicKey: formData.publicKey,
                userName: formData.userName,
                password: formData.password
            }, success, error);
        };

        this.nucliasQuest = function(formData, success, error) {            
            ajaxService.post('/api/web/nuclias/nucliasQuest', {
                access_token: formData.access_token,
                email: formData.email,
                quests: formData.quests,
                server_site: formData.server_site
            }, success, error);
        };

        this.getSSOInfo = function(success, error) {
            ajaxService.post('/api/web/nuclias/getSSOInfo', success, error);
        }

        this.enableSSO = function(formData, success, error) {
            ajaxService.post('/api/web/nuclias/enableSSO', {
                access_token: formData.access_token,
                server_site: formData.server_site,
                refresh_token: formData.refresh_token,
                userName: formData.userName,
                public_ip: formData.public_ip,
                port: formData.port,
                modifier: formData.modifier
            }, success, error);
        };

        this.disableSSO = function(formData, success, error) {
            ajaxService.post('/api/web/nuclias/disableSSO', {
                access_token: formData.access_token,
                modifier: formData.modifier
            }, success, error);
        };

        this.statistic = function(formData, success, error) {
            ajaxService.post('/api/web/nuclias/statistic', {
                access_token: formData.access_token,
                orgId: formData.orgId,
                data: formData.data
            }, success, error);
        };

        this.refreshAccessToken = function(formData, success, error) {
            ajaxService.post('/api/web/nuclias/refreshAccessToken', {
                refresh_token: formData.refresh_token
            }, success, error);
        }
    });
});