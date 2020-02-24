/**
 * Created by lizhimin on 2018/9/27.
 */
({
    baseUrl: "public/website1",
    name: "main",
    out: "public/website1/main-build.js",
    paths: {
        "lang": "public/scripts/lang",
        "app": "public/app",
        "bootstrap": "public/bootstrap",
        "routes": "public/routes",
        'domReady': 'public/vendor/domReady/domReady',
        'underscore': 'public/vendor/underscore/underscore-min',
        // angular
        "angular": "public/vendor/angular/angular.min",
        "angular-translate": "public/vendor/angular-translate/angular-translate.min",
        "angular-messages": "public/vendor/angular-messages/angular-messages.min",

        // angular-ui
        "angular-ui-router": "public/vendor/angular-ui-router/release/angular-ui-router.min",
        "angular-ui-select": "public/vendor/angular-ui-select/select.min",
        // angularAMD
        /*   "angularAMD": "scripts/vendor/angularAMD/angularAMD",*/
        /*  "ngload": "scripts/vendor/angularAMD/ngload",*/
        //bootstrap-ui
        'ui-bootstrap': 'public/vendor/angular-bootstrap/ui-bootstrap-tpls.min',
        'angular-sanitize': 'public/vendor/angular-sanitize/angular-sanitize.min',
        'globalEnum': 'public/scripts/common/globalEnum',
        'control': "public/scripts/controllers/index",
        'service': "public/scripts/services/index",
        'directive':"public/scripts/directives/index",
        'directiveModule': 'public/scripts/directives/module',
        'serviceModule': 'public/scripts/services/module',
        'controllerModule': 'public/scripts/controllers/module',
        'dview8-component': 'public/scripts/dviewComponents',
        'crypto-js': 'public/vendor/crypto-js/crypto-js',
        'moment': 'public/vendor/moment/min/moment.min',
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
        'angular-sanitize': ['angular'],
        'ui-bootstrap': ['angular'],
        'dview8-component': ['angular'],
        'angular-ui-select': ['angular']
    },
    // kick start application
    deps: ['bootstrap']
})
