/**
 * Created by lizhimin on 2016/1/19.
 */
define(["serviceModule"], function (services) {

    services.service("InventoryService", function (ajaxService, Current, globalEnum) {
        this.listNewDevices = function (success) {
            ajaxService.post(base_url + "/device/listType", {
                manageType: globalEnum.deviceManageType.new,
                orgId: Current.org().orgId
            }, success);
        };
        this.listManagedDevices = function (success) {
            ajaxService.post(base_url + "/device/listType", {
                manageType: globalEnum.deviceManageType.managed,
                orgId: Current.org().orgId
            }, success);
        };
        this.listDevicesForRackPanel=function(success){
            ajaxService.post(base_url + "/rack/listDevice", {
                orgId: Current.org().orgId
            }, success);
        }
        this.listNewDevicesByNetwork = function (network, success) {
            ajaxService.post(base_url + "/device/listType", {
                manageType: globalEnum.deviceManageType.new,
                orgId: Current.org().orgId,
                networkId: network._id
            }, success);
        };
        this.listManagedDevicesByNetwork = function (network, success) {
            ajaxService.post(base_url + "/device/listType", {
                manageType: globalEnum.deviceManageType.managed,
                orgId: Current.org().orgId,
                networkId: network._id
            }, success);
        };
        this.listIgnoreDevices = function(network, success){
            ajaxService.post(base_url + "/device/listIgnoredDevice", {networkId: network._id}, success);
        };
        this.listByGroup = function(data, success){
            ajaxService.post(base_url + "/device/listByNetworkAndGroup", data, success)
        };
        this.getDeviceByOrg = function(success, error){
            ajaxService.post(base_url + '/device/getByOrg', {orgId: Current.org().orgId},success, error);
        };
        //删除manage列表设备
        this.deleteDevice = function (devs, success, error) {
            ajaxService.post(base_url + "/device/moveManagedToIgnore", {devMacs: devs}, success);
            // ajaxService.post(base_url + "/device/delManaged", {
            //     manageType: globalEnum.deviceManageType.ignore,
            //     networkId: networkId,
            //     devIds: ids
            // }, success);
        };
        //删除lgnore列表设备
        this.deleteIgnoreDevice = function (uuid,devs, success, error) {
            ajaxService.post(base_url + "/device/delIgnored", {uuid:uuid,devMacs: devs}, success);
        };
        //删除discover列表数据
        this.deleteNewDevice = function (networkId, ids, success, error) {
            ajaxService.post(base_url + "/device/delDiscovered", {
                manageType: globalEnum.deviceManageType.ignore,
                networkId: networkId,
                devIds: ids
            }, success);
        };


        this.getTagList = function (success) {
            ajaxService.post(base_url + '/tag/list', {orgId: Current.org().orgId}, success);
        };

        this.checkInDevice = function (devs, networkInfo, success, error) {
            ajaxService.post(base_url + "/device/manageDevice", {manageDevs: devs, networkInfo: networkInfo}, success, error);
            // ajaxService.post(base_url + "/api/device/manageDevice",
            //     {devIds: ids, manageType: globalEnum.deviceManageType.managed, networkId: networkId}, success, error);
        };
        this.getDeviceByType = function (type, success, error) {
            ajaxService.post(base_url + '/device/getDeviceByType', {
                userId: Current.user()._id,
                orgId: Current.org().orgId,
                deviceType: type
            }, success, error);
        };
        this.getDeviceModules = function (funName, success, error) {
            ajaxService.post(base_url + '/device/modules', {
                funNames: funName,
                orgId: Current.org().orgId
            }, success, error);
        };
        this.getDevicesByOrg = function(success, error) {
            ajaxService.post(base_url + '/device/listDevicesByOrg', {orgId: Current.org().orgId}, success,error)
        };
        this.getDevicesTotal = function(success, error) {
            ajaxService.post(base_url + '/device/getDevicesTotal', {}, success, error)
        };

    });
});