/**
 * Created by guojiangchao on 24/5/17.
 */
define(["serviceModule"], function (services) {

    services.service("BatchConfigService", function (ajaxService, Current) {
        this.getProfileByNetworkId = function(networkId, success, error){
            ajaxService.post(base_url + '/batchConfig/getProfileByNetworkId',{orgId: Current.org().orgId, networkId:networkId},success,error);
        }
        this.getProfileTree = function (success,error) {
            ajaxService.post(base_url + '/batchConfig/getProfileTree', {orgId: Current.org().orgId},success,error);
        };
        this.getProfileHotmapTree = function (success,error) {
            ajaxService.post(base_url + '/batchConfig/getProfileHotmapTree', {orgId: Current.org().orgId},success,error);
        };
        this.getProfileHotmapAps = function (apID,success,error) {
            ajaxService.post(base_url + '/batchConfig/getProfileHotmapAps', {orgId: apID},success,error);
        };
        this.geFWTree = function (success,error) {
            ajaxService.post(base_url + '/batchConfig/getFWTree', {orgId: Current.org().orgId},success,error);
        };
        // this.getProfileList = function (parameter, success,error) {
        // 	parameter.orgId = Current.org().orgId;
        //     ajaxService.post(base_url + '/batchConfig/getProfile', parameter,success,error);
        // };
        this.getProfileResult = function(profileId,success,error){
            ajaxService.post(base_url + '/batchConfig/getProfileResult',{profileId:profileId},success,error);
        }
        // this.addProfile = function (parameter, success,error) {
        // 	parameter.orgId = Current.org().orgId;
        // 	parameter.creator = Current.user().username;
        //     ajaxService.post(base_url + '/batchConfig/addProfile', parameter,success,error);
        // };
        this.resetPvid=function(profileId,pvid,success,error){
            ajaxService.post(base_url + '/batchConfig/resetPVID', {profileId:profileId,pvid:pvid},success,error);
        };
        this.addVLAN=function(profileId,vlan,success,error){
            ajaxService.post(base_url + '/batchConfig/addVlan', {profileId:profileId,vlan:vlan},success,error);
        };
        this.updateVLAN=function(profileId,vlan,success,error){
            ajaxService.post(base_url + '/batchConfig/updateVlan', {profileId:profileId,vlan:vlan},success,error);
        };
        this.delVLAN=function(profileId,vlan,success,error){
            ajaxService.post(base_url + '/batchConfig/delVlan', {profileId:profileId,vlan:vlan},success,error);
        };
        this.resetVLANStatus=function(profileId,status,success,error){
            ajaxService.post(base_url + '/batchConfig/resetVLANStatus', {profileId:profileId,status:status},success,error);
        };
        this.saveSchedule=function(profileId,schedule,success,error){
            ajaxService.post(base_url + '/batchConfig/saveSchedule', {profileId:profileId,schedule:schedule},success,error);
        };
        this.addBandWidthOpt=function(profileId,bandwidth,success,error){
            ajaxService.post(base_url + '/batchConfig/addBandWidthOptRule', {profileId:profileId,bandwidth:bandwidth},success,error);
        };
        this.updateDevSetting=function(profileId,deviceSetting,success,error){
            ajaxService.post(base_url + '/batchConfig/updateDeviceSetting', {profileId:profileId,deviceSetting:deviceSetting},success,error);
        };
        this.updatePerformance=function(profileId,performance,success,error){
            ajaxService.post(base_url + '/batchConfig/updatePerformance', {profileId:profileId,performance:performance},success,error);
        };
        this.updateSchedule=function(profileId,schedule,success,error){
            ajaxService.post(base_url + '/batchConfig/updateSchedule', {profileId:profileId,schedule:schedule},success,error);
        };
        this.updateWlanPartition=function(profileId,wlanPartition,success,error){
            ajaxService.post(base_url + '/batchConfig/updateWlanPartition', {profileId:profileId,wlanPartition:wlanPartition},success,error);
        };
        this.updateWirelessResource=function(profileId,wirelessResource,success,error){
            ajaxService.post(base_url + '/batchConfig/updateWirelessResource', {profileId:profileId,wirelessResource:wirelessResource},success,error);
        };
        this.addSSID=function(profileId,ssid,flag,success,error){
            ajaxService.post(base_url + '/batchConfig/addSSID', {profileId:profileId,ssid:ssid,flag:flag},success,error);
        };
        this.updateSSID=function(profileId,ssid,flag,success,error){
            ajaxService.post(base_url + '/batchConfig/updateSSID', {profileId:profileId,ssid:ssid,flag:flag},success,error);
        };
        this.delSSID=function(profileId,ssid,success,error){
            ajaxService.post(base_url + '/batchConfig/delSSID',{profileId:profileId,ssid:ssid},success,error);
        };
        this.saveSSID=function(profileId,ssid,flag,success,error){
            ajaxService.post(base_url + '/batchConfig/saveSSID',{profileId:profileId,ssid:ssid,flag:flag},success,error);
        };
        this.getLoginTemplateList=function(profileId,success,error){
            ajaxService.post(base_url + '/batchConfig/getLoginFiles',{profileId:profileId},success,error);
        };
        this.deleteLoginTemplate=function(delFile,success,error){
            ajaxService.post(base_url + '/batchConfig/deleteLoginFiles',delFile,success,error);
        };
        this.downloadLoginTemplate=function(data,success,error){
            ajaxService.downloadFile(base_url + '/batchConfig/downLoadLoginFile',data,success,error);
        };
        this.downloadMacAddress=function(data,success,error){
            ajaxService.downloadFile(base_url + '/batchConfig/downloadMacList',{macList: data},success,error);
        };
        this.downloadMacByPass=function(data,success,error){
            ajaxService.downloadFile(base_url + '/batchConfig/downloadWhiteList',{macByPass: data},success,error);
        };
        this.getFWUpgradeInfo = function(parameter, success, error){
            parameter.orgId = Current.org().orgId;
            ajaxService.post(base_url + '/batchConfig/getFwInfo', parameter, success, error);
        };
        this.getFWUpgradeResult = function(networkId, success, error){
            ajaxService.post(base_url + '/batchConfig/getFwResult', {orgId: Current.org().orgId,networkId: networkId}, success, error);
        };
        this.saveFWUpgradeInfo = function(parameter, success, error){
            parameter.orgId = Current.org().orgId;
            ajaxService.post(base_url + '/batchConfig/updateFwOper', parameter, success, error);
        };
        this.getSSLCerInfo = function(parameter, success, error){
            parameter.orgId = Current.org().orgId;
            ajaxService.post(base_url + '/batchConfig/getSSLCerInfo', parameter, success, error);
        };
        this.updateRFOpt = function(parameter, success, error){
            ajaxService.post(base_url + '/batchConfig/updateRFOpt', parameter, success, error);
        };
        this.getSSLResult = function(networkId, success, error){
            ajaxService.post(base_url + '/batchConfig/getSSLResult', {orgId: Current.org().orgId,networkId: networkId}, success, error);
        };
        this.loadPasscodeList=function(uuid,success,error){
            ajaxService.post(base_url+'/batchConfig/getPasscodeByUUID',{uuid:uuid},success,error);
        }
        // this.uploadSSLCerInfo = function(parameter, success, error){
        //     parameter.orgId = Current.org().orgId;
        //     ajaxService.post(base_url + '/batchConfig/uploadSSLCerInfo', parameter, success, error);
        // };
    });
});