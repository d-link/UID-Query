/**
 * Created by lizhimin on 2018/9/27.
 */

({
    baseUrl: "public/website1/nuclias_connect",
    name: "main",
    out: "public/website1/nuclias_connect/main-build.js",
    paths: {
        "lang_en": "scripts/lang/lang_en",
        "lang_cn": "scripts/lang/lang_cn",
        "lang_tw": "scripts/lang/lang_tw",
        "lang_jp": "scripts/lang/lang_jp",
        "lang_ru": "scripts/lang/lang_ru",
        "lang_it": "scripts/lang/lang_it",
        "lang_kr": "scripts/lang/lang_kr",
        "lang_es": "scripts/lang/lang_es",
        "lang_de": "scripts/lang/lang_de",
        "lang_fr": "scripts/lang/lang_fr",
        "lang_tk": "scripts/lang/lang_tk",
        "lang": "scripts/lang/lang",
        "app": "scripts/app",
        "bootstrap": "scripts/bootstrap",
        "routes": "scripts/routes",

        'domReady': '../public/vendor/domReady/domReady',
        'underscore': '../public/vendor/underscore/underscore-min',
        'kalendae': '../public/vendor/Kalendae/kalendae.standalone.min',
        'moment': '../public/vendor/moment/min/moment.min',
        // angular
        "angular": "../public/vendor/angular/angular.min",
        "angular-translate": "../public/vendor/angular-translate/angular-translate.min",
        "angular-messages": "../public/vendor/angular-messages/angular-messages.min",
        // angular-ui
        "angular-ui-router": "../public/vendor/angular-ui-router/release/angular-ui-router.min",
        "angular-ui-grid": "../public/vendor/angular-ui-grid/ui-grid.min",
        "angular-ui-select": "../public/vendor/angular-ui-select/select.min",
        "angular-gridster": "../public/vendor/angular-gridster/angular-gridster.min",
        "angular-switch": "../public/vendor/angular-switch/angular-toggle-switch.min",
        "angular-ui-switch": "../public/vendor/angular-ui-switch/angular-ui-switch.min",
        "angular-scroll": "../public/vendor/angular-scroll/angular-scroll.min",
        //"angular-file-upload": "../public/vendor/angular-file-upload/dist/angular-file-upload.min",
        "ngstorage": "../public/vendor/ngstorage/ngStorage.min",
        'echarts': '../public/vendor/echarts/dist/echarts.min',

        //bootstrap-ui
        'ui-bootstrap': '../public/vendor/angular-bootstrap/ui-bootstrap-tpls.min',
        'angular-sanitize': '../public/vendor/angular-sanitize/angular-sanitize.min',
        'ngFileUpload': '../public/vendor/ng-file-upload/ng-file-upload.min',

        'control': "scripts/controllers/index",
        'service': "scripts/services/index",
        'directive': "scripts/directives/index",
        'filter': "scripts/filters/index",
        //service

        'canvasContainer': 'scripts/services/dashboard/canvasContainer',
        'navController': 'views/templates/navController',
        'ip-mask': 'scripts/directives/ip-mask',

        //'captcha-directive': '../public/scripts/captcha-directive',
        'dview8-components': '../public/scripts/dviewComponents',
        'globalEnum': '../public/scripts/common/globalEnum',

        'commonFilter': 'scripts/filter/commonFilter',
        'globalGridOptions': 'scripts/common/globalGridOptions',
        'directiveModule': 'scripts/directives/module',
        'serviceModule': 'scripts/services/module',
        'controllerModule': 'scripts/controllers/module',
        'filterModule': 'scripts/filters/module',

        'device-select3': 'scripts/directives/selectDevice',
        'interface-select': 'scripts/directives/interfaceMultiSelect',
        'wizard-template': 'scripts/directives/wizardTemplate',
        'cwmBarChart': 'scripts/directives/cwmBarChart',
        'crypto-js': '../public/vendor/crypto-js/crypto-js'
    },
    // Add angular modules that does not support AMD out of the box, put it in a shim
    shim: {
        angular: {
            exports: "angular"
        },
        /*  "angularAMD":["angular"],*/
        "angular-translate": ["angular"],
        "angular-messages": ["angular"],
        "angular-ui-router": ["angular"],
        "angular-ui-grid": ["angular"],
        'angular-gridster': ['angular'],
        'angular-ui-switch': ['angular'],
        'angular-scroll': ['angular'],
        'echarts': {
            exports: "echarts"
        },
        'ngFileUpload': ['angular'],
        'angular-sanitize': ['angular'],
        'ui-bootstrap': ['angular'],
        'ip-mask': ['angular'],
        'dview8-components': ['angular'],
        'angular-ui-select': ['angular']
    },
    // kick start application
    deps: ['bootstrap']
})
