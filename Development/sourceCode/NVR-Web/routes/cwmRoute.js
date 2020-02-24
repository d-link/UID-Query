/**
 * Created by lizhimin on 2017/12/7.
 */
'use strict';
const express = require('express');
const router = express.Router();
const user = require('./users');
const org = require('./cwmOrg');
const global = require('./cwmGlobalSetting');
const license = require('./cwmLicense');
const teamUser = require('./cwmTeamUser');
const network = require('./cwmNetwork');
const device = require('./cwmDevice');
const dashboard = require('./cwmDashboard');
const trigger = require('./cwmTrigger');
const notification = require('./cwmNotification');
const site = require('./cwmSite');
const cwmLog = require('./cwmLog');
const cwmSystemCli = require('./cwmSystemCli');
const batchConfig = require('./cwmBatchConfig');
const deviceDetail = require('./cwmDeviceDetail');
const printerWork = require('./printerWork');
const useCustom = require('./cwmUseCustom');
const cwmStats = require('./cwmStats');
const cwmFwUpgrade = require('./cwmFwUpgrade');
//Report导出
const cwmReportExport = require('./cwmReportExport');

const backupRestore = require('./cwmDBBackrestore');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
router.post('/user/list', user.list);
router.post('/user/update', user.update);
router.post('/user/changePhoto', multipartMiddleware, user.changePhoto);
router.post('/user/changePass', user.changePass);
router.post('/user/changeEmail', user.changeEmail);
router.post('/user/getUser', user.getUser);
router.post('/user/updateLastPage', user.updateLastPage);
router.post('/user/logout', user.logout);
router.post('/user/updateThreshold', user.updateThreshold);

router.get('/getNodeEnv', org.getNodeEnv);
router.post('/org/listOne', org.listOneOrg);
router.post('/org/getOrg', org.getOrgById);
router.post('/org/listDetail', org.listOrgDetails);
router.post('/org/listAll', org.listOrgs);
router.post('/org/updateCustomized', multipartMiddleware, org.updateCustomized);
router.post('/org/certificate', multipartMiddleware, org.uploadCertificate);
router.post('/org/updateBasic', org.updateBasic);
router.post('/org/updateSMTP', org.updateSMTP);
router.post('/org/updateConnection', org.updateConnection);
router.post('/org/updateSystemSetting', org.updateSystemSetting);
router.post('/org/updateChipSystemSetting', org.updateChipSystemSetting);
router.post('/org/testSMTP', org.testSMTP);
router.post('/org/updatePayment', org.updatePayment);
//router.post('/org/nameExist', org.checkOrgName);//接口废弃且由于变动了name的存放位置导致无法使用，暂时屏蔽，待确认后直接清除@date 20191016 JunxiongTian
router.get('/org/getModules', org.listModules);
router.get('/org/UpdateModules', org.UpdateModules);
router.get('/org/getVersion',org.getVersion);
router.post('/org/generateRestAPIKey', org.generateRestAPIKey);
router.post('/org/getRestAPIKey', org.getRestAPIKey);

router.post('/license', license.listLicenses);
router.post('/license/add', license.addLicense);
router.post('/license/del', license.delLicense);

router.get('/global/serverIPs', global.getServerIPs);
router.post('/global/database/getBackupSetting', global.getBackupSetting);
router.post('/global/database/setBackupSetting', global.setBackupSetting);
router.post('/global/database/backupNow',backupRestore.backupNow);
router.post('/global/database/deleteBackup', backupRestore.deleteBackup);
router.post('/global/database/getBackupList',backupRestore.getBackupList);
router.post('/global/database/restoreConfig',multipartMiddleware,backupRestore.restoreConfig);
router.post('/global/database/downloadBackup',backupRestore.downloadBackup);
router.post('/global/database/changePath',backupRestore.changePath);

router.post('/network/list', network.listNetworks);
router.post('/network/listAll', network.listAllNetworks);
router.post('/network/listShort', network.listShortNetworks);
router.post('/network/copyFrom', network.copyFrom);
router.post('/network/add', network.addNetwork);
router.post('/network/del', network.delNetworks);
router.post('/network/addOrUpdate', network.addOrUpdateNetwork);
router.post('/network/checkName', network.checkName);
router.post('/network/checkSchoolID', network.checkSchoolID);
router.post('/network/export', network.exportNetworkProfile);
//router.post('/network/updateStatus', network.updateNetworkStatus);
router.get('/network/probe/getUUID', network.generateUUID);
router.post('/network/discoverByDDPv5', network.discoverByDDPv5);
router.post('/network/getDiscoveredDevices', network.getDiscoveredDevices);
router.post('/network/setAGProfile', network.setAGProfile);

router.get('/network/probe/exportNetwork', network.exportNetwork);
router.post('/network/probe/exportProbe', network.exportNetworkUUID);
router.post('/network/getSiteAndNetworkByOrg', network.getSiteAndNetworkByOrg);
router.post('/site/getSiteByOrg', network.getSiteByOrg);

router.post('/stats/lastHour/uniqueClients', cwmStats.getLastHourUniqueClients);
router.post('/stats/lastHour/traffic', cwmStats.getLastHourTraffic);
router.post('/stats/lastHour/trafficTxRx', cwmStats.getLastHourTrafficTxRx);
router.post('/stats/lastHour/trafficSSID', cwmStats.getLastHourTrafficSSID);

router.post('/stats/hotTime/uniqueClientsThreshold', cwmStats.getHotTimeUniqueClientThreshold);
router.post('/stats/hotTime/trafficUsageThreshold', cwmStats.getHotTimeTrafficUsageThreshold);
router.post('/stats/hotTime/uniqueClients', cwmStats.getHotTimeUniqueClient);
router.post('/stats/hotTime/traffic', cwmStats.getHotTimeTrafficUsage);

router.post('/stats/hourly/uniqueClientsThreshold', cwmStats.getUniqueClientsHourlyThreshold);
router.post('/stats/hourly/trafficThreshold', cwmStats.getTrafficHourlyThreshold);
router.post('/stats/hourly/uniqueClients', cwmStats.getUniqueClientsHourlyByDay);
router.post('/stats/hourly/traffic', cwmStats.getTrafficHourlyByDay);

router.post('/stats/daily/uniqueClients', cwmStats.getUniqueClientDaily);
router.post('/stats/daily/trafficUsage', cwmStats.getTrafficUsageDaily);

router.post('/stats/getQuarterlySiteNetworks', cwmStats.getQuarterlySiteNetworks);
router.post('/stats/getHourlySiteNetworks', cwmStats.getHourlySiteNetworks);
router.post('/stats/getDailySiteNetworks', cwmStats.getDailySiteNetworks);

router.post('/stats/getHotApUniqueClientThreshold', cwmStats.getHotApUniqueClientThreshold);
router.post('/stats/getHotApTrafficThreshold', cwmStats.getHotApTrafficThreshold);
router.post('/stats/getUniqueClientsForAps', cwmStats.getUniqueClientsForAps);
router.post('/stats/getTrafficUsageForAps', cwmStats.getTrafficUsageForAps);

router.post('/team/getUsers', teamUser.getAllUser);
router.post('/team/add', teamUser.addTeamUser);
router.post('/team/del', teamUser.delTeamUser);
router.post('/team/edit', teamUser.editTeamUser);
router.post('/team/privilege', teamUser.privilegeTeamUser);
//router.post('/team/status', teamUser.allUserStatus);

router.post('/device/listType', device.listDeviceByManageType);
router.post('/device/manageDevice', device.manageDevice);
router.post('/device/listIgnoredDevice', device.listIgnoredDevice);
router.post('/device/moveManagedToIgnore', device.moveManagedDeviceToIgnore);
router.post('/device/delIgnored', device.delIgnoredDevices);
router.post('/device/getDeviceByType', device.getDeviceByType);
router.post('/device/getDeviceById', device.getDeviceById);
router.post('/device/listDevicesByOrg', device.listDevicesByOrg);
router.post('/device/getDevicesTotal', device.calcDevicesTotal);

router.post('/device/getByOrg', device.getDevicesByOrg); //数据格式：var a = {orgId：""}
//数据格式：当取所有workspace的device时{orgId："", wsIds:[]}; 当取单个workspace的device时{orgId："", wsIds:""}
router.post('/device/resetChannel5', device.resetChannel5);
router.post('/device/resetChannel5G2', device.resetChannel5G2);
router.post('/device/resetChannel24', device.resetChannel24);
router.post('/device/resetPowerSetting24', device.resetPowerSetting24);
router.post('/device/resetPowerSetting5', device.resetPowerSetting5);
router.post('/device/resetPowerSetting5G2', device.resetPowerSetting5G2);
router.post('/device/resetSupplier', device.resetSupplier);
router.post('/device/resetLocation', device.resetLocation);
router.post('/device/resetName', device.resetName);
router.post('/device/reboot', device.reboot);

//device detail
router.post('/deviceDetail/getDeviceInfo', deviceDetail.getDeviceInfo);
router.post('/deviceDetail/getClientInfos', deviceDetail.getClientsInfo);
router.post('/deviceDetail/updateDeviceInfo', deviceDetail.updateDeviceInfo);
router.post('/deviceDetail/getDeviceNotify', deviceDetail.getDeviceNotify);
router.post('/deviceDetail/blockClient', deviceDetail.blockClient);
router.post('/deviceDetail/unblockClient', deviceDetail.unblockClient);
router.post('/deviceDetail/renameClient', deviceDetail.renameClient);
router.post('/deviceDetail/getSupplierInfo', deviceDetail.getSupplierInfo);


//device monitor views

//router.post('/deviceDetail/getLogByDevId', deviceDetail.getLogByDevId);


router.post('/dashboard/getStateSummary', dashboard.getStateSummary);
//for cwm only
router.post('/dashboard/getChannelUsedSummary', dashboard.getChannelUsedSummary);
router.post('/dashboard/getTopApUsage', dashboard.getTopApUsage);
router.post('/dashboard/getLatestEvents', dashboard.getLatestEvents);
router.post('/monitor/getAccessPoints', dashboard.getAccessPoints);
router.post('/monitor/getAllUsageData', dashboard.getAllUsageData);
router.post('/monitor/getUsageDataByAP', dashboard.getUsageDataByAP);
router.post('/monitor/getClientInfo', dashboard.getClientInfos);
router.post('/monitor/getBlockedClient', dashboard.getBlockedClientInfos);

//trigger相关接口
router.get('/trigger/getAllSensorItems', trigger.getAllSensorItems);
router.post('/trigger/getAllSensorItemsByGroup', trigger.getAllSensorItemsByGroup);
router.post('/trigger/addTrigger', trigger.addTrigger);//添加新的trigger
router.post('/trigger/update', trigger.updateTrigger);//更新trigger
router.post('/trigger/delTrigger', trigger.delTrigger); //删除trigger
router.post('/trigger/getTriggersByDeviceModule', trigger.getTriggersByDeviceModule);
router.post('/trigger/getTriggerByNetworkIdAndGroup', trigger.getTriggerByNetworkIdAndGroup);
router.post('/trigger/getTriggerTree', trigger.getTriggerTree);
router.post('/trigger/updateTriggerCondition', trigger.updateTriggerCondition);
router.post('/trigger/getTriggerCondition', trigger.getTriggerCondition);
//router.post('/trigger/updateTrapCondition',trigger.updateTrapCondition);
//router.post('/trigger/updateSyslogCondition', trigger.updateSyslogCondition);

router.post('/trigger/trap/getDefaultType', trigger.getDefaultTrapType);
router.post('/trigger/trap/getCustomerTrap', trigger.getCustomerTrapOID);
router.post('/trigger/trap/getCustomerBinding', trigger.getCustomerBinding);
router.post('/trigger/trap/getTrapTypes', trigger.getTrapTypes);

router.post('/notification/AllNotification', notification.getAllNotification);
router.post('/notification/AllSystemEvent', notification.getAllSystemEvent);
router.post('/notification/getCount', notification.getNotificationCount);
router.post('/notification/getEventsByIds', notification.getEventsByIds);
router.post('/notification/acknowledge', notification.acknowledge);
router.post('/notification/createNotifyRule', notification.createNotifyRule);
router.post('/notification/getNotifyRule', notification.getNotifyRule);
router.post('/notification/updateNotifyRule', notification.updateNotifyRule);
router.post('/notification/deleteNotifyRule', notification.deleteNotifyRule);
router.post('/notification/getMoniterItems', notification.getMoniterItems);
router.post('/notification/editNotifyRuleStatus', notification.editNotifyRuleStatus);

router.post('/log/syslog/getAll', cwmLog.getSyslogs);
router.post('/log/syslog/getEU', cwmLog.getEUSyslogs);
router.post('/log/traplog/getAll', cwmLog.getTraps);
router.post('/log/devicelog/getAll', cwmLog.getDeviceLogs);
router.post('/log/eventlog/getAll', cwmLog.getEventLogs);
router.post('/log/operatelog/getAll', cwmLog.getOperateLog);

router.post('/batchConfig/getProfileTree', batchConfig.getProfileTree);
router.post('/batchConfig/getProfileByNetworkId', batchConfig.getProfileByNetworkId);
router.post('/batchConfig/addProfile', batchConfig.addProfile);
router.post('/batchConfig/deleteProfile', batchConfig.deleteProfile);
router.post('/batchConfig/saveSchedule', batchConfig.saveSchedule);
router.post('/batchConfig/clearSchedule', batchConfig.clearSchedule);
router.post('/batchConfig/getProfileResult', batchConfig.getProfileResult);

router.post('/batchConfig/resetPVID', batchConfig.resetPVID);
router.post('/batchConfig/resetVLANStatus', batchConfig.resetVLANStatus);
router.post('/batchConfig/addVlan', batchConfig.addVlan);
router.post('/batchConfig/updateVlan', batchConfig.updateVlan);
router.post('/batchConfig/delVlan', batchConfig.delVlan);
router.post('/batchConfig/addBandWidthOptRule', batchConfig.addBandwidthOptRule);
router.post('/batchConfig/updateDeviceSetting', batchConfig.updateDeviceSetting);
router.post('/batchConfig/updatePerformance', batchConfig.updatePerformance);
router.post('/batchConfig/updateSchedule', batchConfig.updataWirelessSchedule);
router.post('/batchConfig/updateWlanPartition', batchConfig.updateWlanPartition);
router.post('/batchConfig/updateWirelessResource', batchConfig.updateWirelessResource);
router.post('/batchConfig/updateSSID', batchConfig.updateSSID);
router.post('/batchConfig/addSSID', batchConfig.addSSID);
router.post('/batchConfig/delSSID', batchConfig.delSSID);
router.post('/batchConfig/uploadLoginFile', multipartMiddleware, batchConfig.uploadLoginFile);
router.post('/batchConfig/getLoginFiles', batchConfig.getLoginFiles);
router.post('/batchConfig/deleteLoginFiles', batchConfig.deleteLoginFiles);
router.post('/batchConfig/uploadWhiteList', batchConfig.uploadWhiteList);
router.post('/batchConfig/downloadLoginFile', batchConfig.downloadLoginFile);
router.post('/batchConfig/uploadMacList', batchConfig.uploadMacList);
router.post('/batchConfig/downloadWhiteList', batchConfig.downloadWhiteList);
router.post('/batchConfig/downloadMacList', batchConfig.downloadMacList);

router.post('/batchConfig/getFWTree', batchConfig.getFWTree);
router.post('/batchConfig/getFwInfo', batchConfig.getFwInfo);
router.post('/batchConfig/getFwUploadStatus', batchConfig.getFwUploadStatus);
router.post('/batchConfig/getFwResult', batchConfig.getFwResult);
router.post('/batchConfig/upLoadFwFile', multipartMiddleware, batchConfig.upLoadFwFile);
router.post('/batchConfig/updateFwOper', batchConfig.updateFwOper);

router.post('/batchConfig/clearFwOperSchedule', batchConfig.clearFwOperSchedule);
router.post('/batchConfig/removeFwFile', batchConfig.removeFwFile);
router.post('/batchConfig/getSSLCerInfo', batchConfig.getSSLCerInfo);
router.post('/batchConfig/uploadSSLCerInfo', multipartMiddleware, batchConfig.uploadSSLCerInfo);
router.post('/batchConfig/getSSLResult', batchConfig.getSSLResult);

router.post('/batchConfig/updateRFOpt', batchConfig.updateRFOpt);
router.post('/batchConfig/getPasscodeByUUID', batchConfig.getPasscodeByUUID);

router.post('/printerWork/Generate', printerWork.Generate);
router.post('/printerWork/createPassCode', printerWork.createPassCode);
router.post('/printerWork/deletePasscode', printerWork.deletePasscode);
router.post('/printerWork/findPasscode', printerWork.findPasscode);
router.post('/printerWork/updatePassCode', printerWork.updatePassCode);
router.post('/printerWork/readFdConfig', printerWork.readFdConfig);
router.post('/printerWork/writeFdConfig', printerWork.writeFdConfig);
router.post('/printerWork/getSSIDByUUID', printerWork.getSSIDByUUID);
router.post('/printerWork/passcodeIsExist', printerWork.passcodeIsExist);
router.post('/printerWork/findOrdersByPasscode', printerWork.findOrdersByPasscode);

router.post('/useCustom/setUseCustom', useCustom.setUseCustom);
router.post('/useCustom/getUseCustom', useCustom.getUseCustom);
router.post('/useCustom/setPageAction', useCustom.setPageAction);
router.post('/useCustom/getPageAction', useCustom.getPageAction);
//Report导出相关的路由
router.post('/cwmReportExport/exportHotTime2PDF', cwmReportExport.exportHotTime2PDF);
router.post('/cwmReportExport/exportHourly2PDF', cwmReportExport.exportHourly2PDF);
router.post('/cwmReportExport/exportDailyTraffic2PDF', cwmReportExport.exportDailyTraffic2PDF);
router.post('/cwmReportExport/exportHotAP2PDF', cwmReportExport.exportHotAP2PDF);

router.post('/org/hotAP/save', multipartMiddleware, org.saveHotApMap);
router.post('/org/hotAP/saveDevices', org.saveHotApDevices);
router.post('/org/hotAP/getAll', org.getAllHotApMaps);
router.post('/org/hotAP/del', org.delHotAPMap);

router.post('/org/supplier/save', org.saveSupplier);
router.post('/org/supplier/list', org.listSuppliers);
router.post('/org/supplier/del', org.delSupplier);

router.post('/usbStorage/getUSBStorageList', cwmSystemCli.getUSBStorage);
router.post('/usbStorage/browserUSBFileList', cwmSystemCli.browserUSBFiles);
router.post('/systemSetting/getLANSetting', cwmSystemCli.getLanSetting);
router.post('/systemSetting/getDateAndTime', cwmSystemCli.getDateAndTime);
router.post('/systemSetting/getNodeTime', cwmSystemCli.getNodeTime);
router.post('/systemSetting/saveChipConfig', cwmSystemCli.saveChipConfig);
router.post('/systemSetting/getConsoleSetting', cwmSystemCli.getConsoleSetting);
router.post('/systemSetting/restartMonitoring', cwmSystemCli.restartMonitoring);
router.post('/systemOperation/restartDevice', cwmSystemCli.restartDevice);
router.post('/systemOperation/restoreDevice', cwmSystemCli.restoreDevice);
router.post('/systemOperation/formatMicroSDCard', cwmSystemCli.formatMicroSDCard);
router.post('/systemFwUpgrade/getFirmwareUpgradeStatus', cwmFwUpgrade.getFirmwareUpgradeStatus);
router.post('/systemFwUpgrade/firmwareUpgrade', multipartMiddleware, cwmFwUpgrade.firmwareUpgrade);
router.post('/systemFwUpgrade/getFtpData', cwmSystemCli.getFtpDataBySo);
router.post('/systemFwUpgrade/setFtpData', cwmSystemCli.setFtpDataBySo);
router.post('/systemAbout/getSystemInfo', cwmSystemCli.getSystemInfo);
router.post('/systemAbout/getSystemStatus', cwmSystemCli.getSystemStatus);
module.exports = router;
