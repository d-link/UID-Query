/**
 * Created by lizhimin on 2015/9/7.
 */
define([
    'angular', 'angular-translate', 'angular-messages', "ui-bootstrap", "angular-ui-router","angular-ui-router-stateEvents",
    'angular-sanitize', 'angular-ui-select',
    'globalEnum',
    'lang',
    'control', 'service', 'directive', 'dview8-component'
], function (ng) {
    'use strict';
    return ng.module('app', ['ngMessages','pascalprecht.translate',
        "ui.router", 'ngSanitize','ui.bootstrap','app.globalEnum','ui.select','app.lang','dview8.components',  'app.directives', 'app.services',
        'app.controllers',"ui.router.state.events"
    ])
    // ,'dview8.components',  'app.directives', 'app.services',
    //                     'app.controllers'
});