/**
 * Created by lizhimin on 2016/3/30.
 */
define(['angular'], function (ng) {
    'use strict';
    var global=ng.module('app.globalEnum', []);
    global.constant('AccessLevels', {
        anon: 0,
        user: 1
    }).constant('globalEnum', {
        deviceManageType: {
            new: "new",
            managed: "managed",
            ignore: "ignore"
        },
        teamPrivilegeLevel: {
            manager: "manager",
            owner: "owner",
            tag: "tag"
        },
        teamRole:{
            rw:1,
            ro:2
        },
        severity:{
            critical:'Critical',
            warning:'Warning',
            info:'Info'
        }
    });
    return global;
});

