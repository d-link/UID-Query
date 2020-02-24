/**
 * Created by lizhimin on 2015/9/7.
 */
define([
    'angular','angular-translate',
    //'angular-messages',
    "ui-bootstrap", "angular-ui-router","angular-ui-router-stateEvents",  
    //"ngstorage",
    "angular-ui-grid", 'angular-ui-switch', 'angular-ui-select', 
    //'angular-sanitize',
    'angular-scroll',  'dview8-components',
    'globalEnum',
    'lang',
    //'kalendae',
    'control',
    'service','directive',
    'filter', 
    'echart-directive','echart-connect','Jquery','zdialog',
    // 'wui-date',

], function (ng) {
    'use strict';

    return ng.module('app', 
    [
       //'ngMessages',
        'pascalprecht.translate',
        "ui.router","ui.router.state.events",
        'ui.grid','ui.grid.i18n',
        'ui.grid.expandable', 'ui.grid.selection',
        'ui.grid.edit', 'ui.grid.pagination','ui.grid.autoResize',
        'ui.grid.pinning', 'ui.grid.exporter','ui.grid.resizeColumns','duScroll',
        //'ngSanitize', 
        'ui.bootstrap',
        'uiSwitch',  'ui.select','dview8.components',
        'app.globalEnum',
        'app.lang',  'app.directives',
        'app.filters', 
        'app.services',
        'app.controllers', 
        // 'wui.date'
        //'ngStorage'
    ]);
});