/**
 * Created by lizhimin on 2016/1/19.
 */
define(["serviceModule"], function (services) {

    services.service("InventoryService", function (ajaxService, Current, globalEnum,TS, $filter) {
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
        function getDateString() {
            var date = new Date();
            var str = "";
            var month = date.getMonth() + 1;
            if (month < 10) month = "0" + month;
            var day = date.getDate();
            if (day < 10) day = "0" + day;
            var hour = date.getHours();
            if (hour < 10) hour = "0" + hour;
            var minute = date.getMinutes();
            if (minute < 10) minute = "0" + minute;
            var second = date.getSeconds();
            if (second < 10) second = "0" + second;
            str += date.getFullYear().toString() + "" + month.toString() + day + hour + minute + second.toString();

            return str;
        }
        this.exportCSV=function(env,flag,data,callback){
            var array = [];
            if(env){
                array.push(TS.ts('column.no'));
            }

            array.push(TS.ts('column.status'));
            array.push(TS.ts('column.ip'));
            array.push(TS.ts('column.lanIP'));
            array.push(TS.ts('column.mac'));
            array.push(TS.ts('column.moduleType'));
            array.push(TS.ts('column.hardware'));
            array.push(TS.ts('column.firmware'));
            array.push(TS.ts('column.backupfw'));

            if(flag=='ignored'){
                array.push(TS.ts('column.unmanageTime'));
            }else{
                array.push(TS.ts('column.manageTime'));
            }

            var logItem = data;
            var outStr = "";
            for (var i = 0; i < array.length; i++) {//这里是写入列名，即在页面上显示的名称
                var temp = (array[i]);
                if (temp != null && temp != "") {
                    outStr += "\"" + temp + "\",";
                }
            }
            outStr.substring(0, outStr.lastIndexOf(',') - 1);
            outStr += "\r\n";
            if (logItem && logItem.length > 0) {
                for (i = 0; i < logItem.length; i++) {//这里是界面上的字段和返回的json中的数据字段匹配，匹配的就是界面要求显示的，不匹配的就不输出
                    var dataObj = logItem[i];
                    if(env){
                        outStr += "\"" + dataObj.index + "\",";
                    }
                    outStr += "\"" + dataObj.status+ "\",";
                    outStr += "\"" + dataObj.ip + "\",";
                    outStr += "\"" + (dataObj.lanIP ) + "\",";
                    outStr += "\"" + (dataObj.mac) + "\",";
                    outStr += "\"" + (dataObj.moduleType) + "\",";
                    outStr += "\"" + (dataObj.hardware) + "\",";
                    outStr += "\"" + (dataObj.firmware) + "\",";
                    outStr += "\"" + (dataObj.backupFW) + "\",";
                    outStr += "\"" + $filter('date')(dataObj.manageTime, "yyyy-MM-dd HH:mm:ss") + "\",";
                    outStr += "\r\n";
                }
            }
            var date = getDateString();
            var filename = "NucliasConnect_Managed_" + date + ".csv";
            if(flag=='ignored'){
                filename = "NucliasConnect_Unmanaged_" + date + ".csv";
            }

            callback(outStr, filename);

        }


    });
});