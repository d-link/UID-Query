/**
 * Created by lizhimin on 11/10/16.
 */
define(["serviceModule"], function (services) {

    services.service("RackService", function (ajaxService, Current) {
        this.getRackGroup = function (success) {
            ajaxService.post(base_url + '/rack/getRackGroups', {orgId: Current.org().orgId}, success);
        };
        this.addRackGroup = function (newGroup, success) {
            ajaxService.post(base_url + '/rack/addRackGroup', {rackGroup: newGroup}, success);
        };
        this.updateRackGroup = function (newGroup, success) {
            ajaxService.post(base_url + '/rack/updateRackGroup', {rackGroup: newGroup}, success);
        }
        this.delRackGroup = function (groupId, success) {
            ajaxService.post(base_url + '/rack/delRackGroup', {groupId: groupId}, success);
        };
        this.getRacks = function (groupId, success) {
            ajaxService.post(base_url + '/rack/getRack', {groupId: groupId}, success);
        };
        this.addRack = function (rack, success) {
            ajaxService.post(base_url + '/rack/addRack', {rackPanel: rack}, success);
        };
        this.updateRack = function(rack, success) {
            ajaxService.post(base_url + '/rack/updateRack', {rackPanel: rack}, success);
        };
        this.delRack = function (rackId, success) {
            ajaxService.post(base_url + '/rack/delRack', {rackId: rackId}, success);
        };
        /*
         devIds 数组
         rackId string
         */
        this.addDeviceToRack = function (devIds, rackId, success) {
            ajaxService.post(base_url + '/rack/addDevice', {devIds: devIds, rackId: rackId}, success);
        };
        this.removeDeviceFromRack = function (devId, rackId, success) {
            ajaxService.post(base_url + '/rack/removeDevice', {devId: devId, rackId: rackId}, success);
        };
        this.getDevicePortInfo=function(devId,success){
            ajaxService.post(base_url+'/rack/getPortInfo',{devId:devId},success);
        }
    });
});
