/**
 * Created by lizhimin on 2016/1/18.
 */
define(["serviceModule"], function (services) {

    services.service("NetworkService", function ($http, $q, ajaxService, Current,utils) {

        this.copyFrom = function (fromNetworkId, toNetworkUUID, toNetworkId, success, error) {
            ajaxService.post(base_url + '/network/copyFrom', {
                fromNetworkId: fromNetworkId,
                toNetwork: {agentUUID: toNetworkUUID, _id: toNetworkId}
            }, success, error);
        };

        this.listNetworks = function (success, error) {
            ajaxService.post(base_url + '/network/list', {orgId: Current.org().orgId}, success, error);
        };
        this.listAllNetworks = function (success, error) {
            ajaxService.post(base_url + '/network/listAll', {orgId: Current.org().orgId}, success, error);
        };
        this.listShortNetworks = function (success, error) {
            ajaxService.post(base_url + '/network/listShort', {orgId: Current.org().orgId}, success, error);
        };
        this.addOrUpdateNetwork = function (obj, success, error) {
            let _obj = angular.copy(obj);
            if (_obj.ssid) {
                _obj.ssid.passPhrase = utils.encryptMethod(_obj.network.orgId, _obj.ssid.passPhrase);
            }
            if (_obj.devSet) {
                _obj.devSet.password = utils.encryptMethod(_obj.network.orgId, _obj.devSet.password);
            }

            ajaxService.post(base_url + '/network/addOrUpdate', _obj, success, error);
        };
        this.checkNetworkName = function (obj, success, error) {
            ajaxService.post(base_url + '/network/checkName', obj, success, error);
        };
        this.checkSchoolID = function (obj, success, error) {
            ajaxService.post(base_url + '/network/checkSchoolID', obj, success, error);
        };
        this.delNetwork = function (data, success, error) {
            ajaxService.post(base_url + '/network/del', data, success, error);
        };
        this.updateNetwork = function (network, success, error) {
            ajaxService.post(base_url + '/network/update', {network: network}, success, error);
        };
        // this.delNetworkProbe=function(delUUID,success,error){
        //     ajaxService.post(base_url + '/network/probe/del',delUUID,success,error);
        // };
        this.updateAutoDiscover = function (data, success, error) {
            ajaxService.post(base_url + '/network/updateAutoDiscover', data, success, error);
        };
        this.updateNetworkStatus = function (data, success, error) {
            ajaxService.post(base_url + '/network/updateStatus', data, success, error);
        };
        this.getUUID = function (success, error) {
            ajaxService.get(base_url + '/network/probe/getUUID', success, error);
        };
        this.exportNetwork = function (network) {
            ajaxService.get(base_url + '/network/probe/exportNetwork', {networkId: network._id});
        };
        this.probeConfig = function (data, success, error) {
            ajaxService.post(base_url + '/network/probe/config', data, success, error);
        };
        this.exportProbe = function (data, success, error) {
            ajaxService.downloadFile(base_url + '/network/probe/exportProbe', {
                networkId: data.networkId,
                uuid: data.uuid
            }, success, error);
        };
        this.exportNetworkProfile = function (network, success, error) {
            ajaxService.downloadFile(base_url + '/network/export', network, success, error);
        };
        this.testIPRange = function (data, success, error) {
            data.orgId = Current.org().orgId;
            ajaxService.post(base_url + '/network/probe/ipRangeTest', data, success, error);
        };
        this.getSiteInfo = function (success, error) {
            ajaxService.post(base_url + '/site/getSiteByOrg', {orgId: Current.org().orgId}, success, error);
        };

        this.discoverByDDPv5 = function (network, success, error) {
            ajaxService.post(base_url + '/network/discoverByDDPv5', network, success, error);
        }

        this.getDiscoveredDevices = function (discoverTime, agentUUID, success, error) {
            ajaxService.post(base_url + '/network/getDiscoveredDevices', {
                discoverTime: discoverTime,
                agentUUID: agentUUID,
                orgId: Current.org().orgId
            }, success, error);
        }
        this.setAGProfile = function (network, devices, authentic, success, error) {
            let _obj = angular.copy(authentic);
            if (_obj.authenticPassword) {
                _obj.authenticPassword = utils.encryptMethod(network.agentUUID, _obj.authenticPassword);
            }
            ajaxService.post(base_url + '/network/setAGProfile', {
                network: network,
                orgId: Current.org().orgId,
                devices: devices,
                authentic: _obj
            }, success, error);
        }
    })

});