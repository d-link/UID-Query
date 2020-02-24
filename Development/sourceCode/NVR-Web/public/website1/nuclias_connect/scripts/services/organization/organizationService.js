/**
 * Created by lizhimin on 2016/1/7.
 */
define(["serviceModule"], function (services) {

    services.service("OrganizationService", function ($q, ajaxService, Current,utils) {

        this.listOneOrg = function (userId, success, error) {
            ajaxService.post(base_url + '/org/listOne', {userId: userId}, success, error);
        };
        this.getOrgInfo = function (orgId, success, error) {
            ajaxService.post(base_url + '/org/getOrg', {orgId: orgId, userId: Current.user()._id}, success, error);
        };
        this.listOrgDetails = function (userId, success, error) {
            ajaxService.post(base_url + '/org/listDetail', {userId: userId}, success, error);
        }
        this.listAllOrgs = function (success, error) {
            ajaxService.post(base_url + '/org/listAll', success, error);
        }
        this.getNodeEnv = function (success, error) {
            ajaxService.get(base_url + '/getNodeEnv', success, error);
        }
        this.getNotificationCount = function (success, error) {
            if (Current.org()) {
                ajaxService.post(base_url + '/notification/getCount', {orgId: Current.org().orgId}, success, error);
            } else {
                success({success: false});
            }
        };
        this.getServerIPs = function (success, error) {
            ajaxService.get(base_url + '/global/serverIPs', success, error);
        };
        this.updateSystemSetting = function (setting, success, error) {
            ajaxService.post(base_url + '/org/updateSystemSetting', setting, success, error);
        };
        this.updateChipSystemSetting = function (cliSetting, dbSetting, success, error) {
            ajaxService.postWithTimeout(base_url + '/org/updateChipSystemSetting', {cliSetting: cliSetting, dbSetting: dbSetting}, success, error);
        };
        this.updateConnection = function (orgId, connection, success, error) {
            ajaxService.post(base_url + '/org/updateConnection', {
                orgId: orgId,
                connection: connection
            }, success, error);
        };
        this.updateBasic = function (orgId, basic, success, error) {
            ajaxService.post(base_url + '/org/updateBasic', {
                orgId: orgId,
                basic: basic
            }, success, error);
        };

        this.updateSMTP = function (orgId, smtpServer, success, error) {
            let _smtpServer=angular.copy(smtpServer);
            if(_smtpServer.auth&& _smtpServer.auth.password){
                _smtpServer.auth.password=utils.encryptMethod(_smtpServer.auth.username,_smtpServer.auth.password);
            }
            ajaxService.post(base_url + '/org/updateSMTP', {orgId: orgId, smtpServer: _smtpServer}, success, error);
        };
        this.updatePayment = function (orgId, payment, success, error) {
            let _payment=angular.copy(payment);
            _payment.APIPassword=utils.encryptMethod(_payment.APIUsername,_payment.APIPassword);
            ajaxService.post(base_url + '/org/updatePayment', {orgId: orgId, payment: _payment}, success, error);
        };
        this.testSMTP = function (data, success, error) {
            let _smtpServer=angular.copy(data);
            if(_smtpServer.smtpServer&&_smtpServer.smtpServer.auth&&_smtpServer.smtpServer.auth.password){
                _smtpServer.smtpServer.auth.password=utils.encryptMethod(_smtpServer.smtpServer.auth.username,_smtpServer.smtpServer.auth.password);
            }

            ajaxService.post(base_url + '/org/testSMTP', _smtpServer, success, error);
        };
        this.listModules = function (success, error) {
            ajaxService.get(base_url + '/org/getModules', success, error);
        };
        this.loadVersion = function (success, error) {
            ajaxService.get(base_url + '/org/getVersion', success, error);
        };
        this.UpdateModules = function (success, error) {
            ajaxService.get(base_url + '/org/UpdateModules', success, error);
        };

        this.generateRestAPIKey = function (success, error) {
            ajaxService.post(base_url + '/org/generateRestAPIKey', {orgId: Current.org().orgId}, success, error);
        };
        this.getRestAPIKey = function (success, error) {
            ajaxService.post(base_url + '/org/getRestAPIKey', {orgId: Current.org().orgId}, success, error);
        };

        this.getAllHotApMaps = function (success, error) {
            ajaxService.post(base_url + '/org/hotAP/getAll', {orgId: Current.org().orgId}, success, error);
        };
        this.delHotAPMap = function (id, success, error) {
            ajaxService.post(base_url + '/org/hotAP/del', {mapId: id}, success, error);
        };
        this.saveHotApDevices = function (id, devices, success, error) {
            ajaxService.post(base_url + '/org/hotAP/saveDevices', {id: id, devices: devices}, success, error);
        };

        this.updateThreshold = function (threshold, success, error) {
            ajaxService.post(base_url + '/user/updateThreshold', {
                threshold: threshold
            }, success, error);
        };

        this.saveSupplier = function (supplier, success, error) {
            ajaxService.post(base_url + '/org/supplier/save', supplier, success, error);
        };
        this.listSuppliers = function (success, error) {
            ajaxService.post(base_url + '/org/supplier/list', success, error);
        };
        this.delSupplier = function (supplierId, success, error) {
            ajaxService.post(base_url + '/org/supplier/del', {supplierId: supplierId}, success, error);
        };
        this.getBackupSetting = function (success, error) {
            ajaxService.post(base_url + '/global/database/getBackupSetting', {orgId: Current.org().orgId}, success, error);
        };
        this.setBackupSetting = function (setting, success, error) {
            setting.orgId = Current.org().orgId;
            ajaxService.post(base_url + '/global/database/setBackupSetting', {setting: setting}, success, error);
        };
        this.getDownloadFiles = function (flag, success, error) {
            ajaxService.post(base_url + '/global/database/getBackupList', {backupType: flag}, success, error);
        };
        this.backupNow = function (flag, success, error) {
            ajaxService.post(base_url + '/global/database/backupNow', {backupType: flag}, success, error);
        };
        this.restoreConfig = function (config, success, error) {
            ajaxService.postWithTimeout(base_url + '/global/database/restoreConfig', config, success, error);
        };
        this.downloadBackup = function (flag, fileName, location, usbStoragePath, success, error) {
            if (location == 'computer') {
                ajaxService.downloadFile(base_url + '/global/database/downloadBackup',
                    {
                        backupType: flag,
                        fileName: fileName,
                        location: location,
                        usbStoragePath: usbStoragePath
                    }, success, error);
            } else {
                ajaxService.post(base_url + '/global/database/downloadBackup',
                    {
                        backupType: flag,
                        fileName: fileName,
                        location: location,
                        usbStoragePath: usbStoragePath
                    }, success, error);
            }
        };
        this.deleteBackup = function (flag, deleteBackupList, success, error) {
            //todo 删除备份
            ajaxService.post(base_url + '/global/database/deleteBackup', {
                backupType: flag,
                deleteBackupList: deleteBackupList
            }, success, error);
        };
        this.changePath = function (path, success, error) {
            ajaxService.post(base_url + '/global/database/changePath', {backupPath: path}, success, error);
        };
        this.getUSBStorage = function (success, error) {
            ajaxService.post(base_url + '/usbStorage/getUSBStorageList', success, error);
        };
        this.browserUSBFiles = function (success, error) {
            ajaxService.post(base_url + '/usbStorage/browserUSBFileList', success, error);
        };
        this.saveChipConfig = function (config, success, error) {
            ajaxService.post(base_url + '/systemSetting/saveChipConfig', {config: config}, success, error);
        };
        this.getLANSetting = function (success, error) {
            ajaxService.post(base_url + '/systemSetting/getLANSetting', success, error);
        };
        this.getSystemTime = function (success, error) {
            ajaxService.post(base_url + '/systemSetting/getSystemTime', success, error);
        };
        this.getDateAndTime = function (success, error) {
            ajaxService.post(base_url + '/systemSetting/getDateAndTime', success, error);
        };
        this.getConsoleSetting = function (success, error) {
            ajaxService.post(base_url + '/systemSetting/getConsoleSetting', success, error);
        };
        this.restartMonitoring = function (success, error) {
            ajaxService.postWithTimeout(base_url + '/systemSetting/restartMonitoring', success, error);
        };
        this.restartDevice = function (success, error) {
            ajaxService.postWithTimeout(base_url + '/systemOperation/restartDevice', success, error);
        };
        this.restoreDevice = function (exceptIPAddress, success, error) {
            ajaxService.postWithTimeout(base_url + '/systemOperation/restoreDevice', {exceptIPAddress: exceptIPAddress}, success, error);
        };
        this.formatSDCard = function (success, error) {
            ajaxService.post(base_url + '/systemOperation/formatMicroSDCard', success, error);
        };
        this.getSystemStatus = function (success, error) {
            ajaxService.post(base_url + '/systemAbout/getSystemStatus', success, error);
        };
        this.getFirmwareUpgradeStatus = function (success, error) {
            ajaxService.post(base_url + '/systemFwUpgrade/getFirmwareUpgradeStatus', success, error);
        };
        this.getFtpData = function (success, error) {
            ajaxService.post(base_url + '/systemFwUpgrade/getFtpData', success, error);
        };
        this.setFtpData = function (config, success, error) {
            ajaxService.post(base_url + '/systemFwUpgrade/setFtpData', {config: config}, success, error);
        };
        this.getSystemInfo = function (success, error) {
            ajaxService.post(base_url + '/systemAbout/getSystemInfo', success, error);
        }
    })

});