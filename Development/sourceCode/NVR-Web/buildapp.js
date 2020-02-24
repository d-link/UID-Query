({
    baseUrl: "public/website1/appSite",
    name: "main",
    out: "public/website1/appSite/Appmain.js",
    paths:{
        "app": "scripts/app",
        "bootstrap": "scripts/bootstrap",
        "routes": "scripts/routes",
        "lang": "scripts/lang/lang",
        "lang_en": "scripts/lang/lang_en",
        "lang_cn": "scripts/lang/lang_cn",
        "lang_tw": "scripts/lang/lang_tw",
        "lang_es": "scripts/lang/lang_es",
        "lang_it": "scripts/lang/lang_it",
        "lang_kr": "scripts/lang/lang_kr",
        "lang_de": "scripts/lang/lang_de",
        "lang_fr": "scripts/lang/lang_fr",
        "lang_jp": "scripts/lang/lang_jp",
        "lang_ru": "scripts/lang/lang_ru",
        "lang_tk": "scripts/lang/lang_tk",
        'domReady': '../public/vendor/domReady/domReady',
        'underscore': '../public/vendor/underscore/underscore-min',
        //'kalendae': '../public/vendor/kalendae.standalone',
        // angular
        "angular": "../public/vendor/angular/angular.min",
        "angular-translate": "../public/vendor/angular-translate/angular-translate.min",
        //"angular-messages": "../public/vendor/angular-messages/angular-messages.min",
        // angular-ui
        "angular-ui-router": "../public/vendor/angular-ui-router/release/angular-ui-router.min",
        "angular-ui-grid": "../public/vendor/angular-ui-grid/ui-grid.min",
        "angular-ui-select": "../public/vendor/angular-ui-select/select",
        "angular-gridster": "../public/vendor/angular-gridster/angular-gridster",
        "angular-switch": "../public/vendor/angular-switch/angular-toggle-switch",
        "angular-ui-switch": "../public/vendor/angular-ui-switch/angular-ui-switch.min",
        "angular-scroll": "../public/vendor/angular-scroll/angular-scroll",
        // "angular-file-upload": "../public/vendor/angular-file-upload/dist/angular-file-upload",
        //"ngstorage": "../public/vendor/ngstorage/ngStorage",
        'echarts': '../public/vendor/echarts/dist/echarts.min',



        'ui-bootstrap': '../public/vendor/angular-bootstrap/ui-bootstrap-tpls',
        //'angular-sanitize': '../public/vendor/angular-sanitize/angular-sanitize',
        // 'ngFileUpload': '../public/vendor/ng-file-upload/ng-file-upload',


        'control': "scripts/controllers/index",
        'service': "scripts/services/index",
        'directive':"scripts/directives/index",
        'filter': "scripts/filters/index",
        //service
        'canvasContainer': 'scripts/services/dashboard/canvasContainer',

        'navController': 'views/templates/navController',

        'dview8-components':'../public/scripts/dviewComponents',
        'globalEnum': '../public/scripts/common/globalEnum',

        'commonFilter': 'scripts/filter/commonFilter',
        'globalGridOptions': 'scripts/common/globalGridOptions',
        'directiveModule': 'scripts/directives/module',
        'serviceModule': 'scripts/services/module',
        'controllerModule': 'scripts/controllers/module',
        'filterModule': 'scripts/filters/module',
        'echart-directive': 'scripts/directives/echart-directive',
        'echart-theme': 'scripts/directives/theme',
        'echart-connect': 'scripts/directives/echart-connect-directive',
        'blue': 'scripts/directives/theme/blue',
        'green': 'scripts/directives/theme/green',
        'orange': 'scripts/directives/theme/orange',


        'Jquery':'../public/vendor/jquery-3.1.1.min',
        'zdialog':'../public/vendor/zdialog',
        'crypto-js': '../public/vendor/crypto-js/crypto-js',
        // 'wui-date':'../public/vendor/wui-date/js/wui-date',
        'moment': '../public/vendor/moment/min/moment.min'
    },
    // Add angular modules that does not support AMD out of the box, put it in a shim
    shim: {
        angular: {
            exports: "angular"
        },
        /*  "angularAMD":["angular"],*/
        "angular-translate": ["angular"],
        //"angular-messages": ["angular"],
        "angular-ui-router": ["angular"],
        "angular-ui-grid": ["angular"],
        'angular-gridster': ['angular'],
        'angular-ui-switch': ['angular'],
        'angular-scroll': ['angular'],
        'echarts': {
            exports: "echarts"
        },
        // 'ngFileUpload': ['angular'],
        //'angular-sanitize': ['angular'],
        'ui-bootstrap': ['angular'],
        'dview8-components': ['angular'],
        'angular-ui-select': ['angular'],
        'Jquery':{
            exports: "Jquery"
        },
        'zdialog':{
            exports:'zdialog',
            deps: ['Jquery']
        },
        // 'wui-date':{
        //     exports:'wui-date',
        //     deps: ['angular','Jquery',]
        // },
    },
   deps: ['bootstrap']
  })
  