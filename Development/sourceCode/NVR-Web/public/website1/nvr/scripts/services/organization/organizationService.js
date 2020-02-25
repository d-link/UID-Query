/*
 * @Description: 
 * @Version: 0.4.0
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-25 15:29:23
 * @LastEditRelease: 
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-02-25 16:20:40
 */
/**
 * Created by lizhimin on 2016/1/7.
 */
define(["serviceModule"], function (services) {

    services.service("OrganizationService", function (ajaxService) {

        this.listAllOrgs = function (success, error) {
            ajaxService.post(base_url + '/org/listAll', success, error);
        }
    })

});