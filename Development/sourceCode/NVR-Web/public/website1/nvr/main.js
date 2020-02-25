/*
 * @Description: app 模块路径配置文件
 * @Version: 0.4.0
 * @Vender: D-link
 * @Author: YueXiangling
 * @Date: 2020-02-19 15:39:07
 * @LastEditRelease: 
 * @LastEditors: YueXiangling
 * @LastEditTime: 2020-02-25 17:06:37
 */
require.config({
    // baseUrl: '',
    paths: {
        "app": "scripts/app",
        "routes": "scripts/routes",
        "bootstrap": "scripts/bootstrap",

        "controllerModule": "scripts/controllers/module",
        'control': "scripts/controllers/index",

        'serviceModule': 'scripts/services/module',
        'service': "scripts/services/index",

        'globalEnum': '../public/scripts/common/globalEnum',

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

        // --------以下为插件/第三方包----------
        "angular": "../public/vendor/angular/angular.min",
        // 基于angular的第三方路由模块
        "angular-ui-router": "../public/vendor/angular-ui-router/release/angular-ui-router.min",
        // 监听路由状态的， 和angular-route一起用。
        "angular-ui-router-stateEvents": "../public/vendor/angular-ui-router/release/stateEvents.min",
        // 国际化
        "angular-translate": "../public/vendor/angular-translate/angular-translate.min",
        // 检测dom加载完成插件，在angular中使用
        'domReady': '../public/vendor/domReady/domReady',
        //处理时间格式
        'moment': '../public/vendor/moment/min/moment.min',
        // 加密
        'crypto-js': '../public/vendor/crypto-js/crypto-js',
        // <md-icon > 图标
        'dview8-components': '../public/scripts/dviewComponents',
        // angular-ui-bootstrap,//基于bootstrap的 angular的ui组件
        'ui-bootstrap': '../public/vendor/angular-bootstrap/ui-bootstrap-tpls.min',



    },
    shim: {//让不支持模块化的插件，重新包装下支持模块化，并指定导出对象
        "angular": {
            "exports": "angular"//使用时angular/ng都有效
        },
        "angular-ui-router": ["angular"],
        "angular-translate": ["angular"],

    },
    // 会执行的
    deps: ['bootstrap']
});

// 请求地址开头,
var base_url = "/api/web";
var root_url = "";
var NCTime = new Date();
// ---------以下为全局方法---------
/**
 * @Description: 左侧栏的高度自适应
 * @Param: 
 * @Return: 
 * @Author: lizhimi
 */
function changeDivHeight() {
    var left = document.getElementsByClassName('main-sidebar')[0];
    if (left) {
        var height = left.clientHeight;
        document.getElementsByClassName('sidebar')[0].style.height = (height - 42) + "px";
    }
}

