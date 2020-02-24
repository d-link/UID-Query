/**
 * Created by lizhimin on 11/9/16.
 */
define(["app"], function (app) {

    app.register.service("TeamService", function ($http, ajaxService, $q, Current, utils) {

        this.delTeam = function (userId, success, error) {
            if (Current.user()._id == userId) {
                return;
            }
            ajaxService.post(base_url + '/team/del', {
                userId: userId,
                orgId: Current.org().orgId
            }, success, error);
        };
        // this.getTeamListAll = function (success, error) {
        //     ajaxService.post(base_url + '/team/listAll', {orgId: Current.org().orgId},success, error);
        // };
        this.getUsers = function (success, error) {
            ajaxService.post(base_url + '/team/getUsers', success, error);
        };
        this.addTeam = function (teamUser, success, error) {
            let _teamUser=angular.copy(teamUser);
            _teamUser.password = utils.encryptMethod(_teamUser.username,_teamUser.password);
            ajaxService.post(base_url + '/team/add', {teamUser: _teamUser}, success, error);
        };
        this.editTeam = function (teamUser, success, error) {
            let _teamUser=angular.copy(teamUser);
            if(_teamUser.password){
                _teamUser.password = utils.encryptMethod(_teamUser.username,_teamUser.password);
            }
            ajaxService.post(base_url + '/team/edit', {teamUser: _teamUser}, success, error);
        };
        this.editPrivilege = function (param, success, error) {
            ajaxService.post(base_url + '/team/privilege', param, success, error);
        };
    })
})