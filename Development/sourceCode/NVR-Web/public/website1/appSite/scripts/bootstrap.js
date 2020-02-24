/**
 * Created by lizhimin on 2015/9/7.
 */
define([ 'require','angular', 'app','routes','underscore'], function (require, ng) {
    'use strict';
    require(['domReady!'], function (document) {
        ng.bootstrap(document, ['app']);

    });
});