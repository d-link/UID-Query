/**
 * Created by lizhimin on 2016/3/2.
 */
define([
    '../public/scripts/common/storageService',
    '../public/scripts/common/avtService',
    '../public/scripts/common/nucliasService',
    '../public/scripts/common/jwtHelper',
    '../public/scripts/common/ajaxService',
    '../public/scripts/common/current',
    '../public/scripts/common/utilService',
    '../public/scripts/common/commonService',
    '../public/scripts/common/authentication',
    '../public/scripts/common/moudlesService',
    '../public/scripts/common/translateService',
    'scripts/services/organization/organizationService',
    'scripts/services/organization/networkService',
    'scripts/services/inventory/inventoryService',

    'scripts/services/dashboard/dashboardService',
    'scripts/services/dashboard/statsService',
    //'scripts/services/task/taskService',暂时没有用到
    'scripts/services/custom/customService',

    //放到后面加载
    //'scripts/services/report/reportExportService',
    //'scripts/services/maintenance/batchConfigService',
    //'scripts/services/inventory/deviceDetailService',
    //'scripts/services/frontdesk/frontdeskService'
    //'scripts/services/organization/teamService',
    //'scripts/services/log/logService',
    //以下不用加载
    //'scripts/services/organization/licenseService',//全局搜索没有这个文件
    //'scripts/services/notification/triggerService',
    //'scripts/services/notification/notificationService',//应该是之前的菜单
], function () {
});