/**
 * Created by lizhimin on 11/9/16.
 */
define(["serviceModule"], function (services) {

    services.service("TeamService", function ($http, ajaxService, $q, Current,utils) {

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
            teamUser = angular.copy(teamUser);
            teamUser.password = utils.encryptMethod(teamUser.email,teamUser.password );
            ajaxService.post(base_url + '/team/add', {teamUser: teamUser}, success, error);
        };
        this.editTeam = function (teamUser, success, error) {
            teamUser = angular.copy(teamUser);
            teamUser.password = utils.encryptMethod(teamUser.email,teamUser.password );
            ajaxService.post(base_url + '/team/edit', {teamUser: teamUser}, success, error);
        };
        this.editPrivilege = function (param, success, error) {
            ajaxService.post(base_url + '/team/privilege', param, success, error);
        };
    })
})