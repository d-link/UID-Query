/**
 * Created by lizhimin on 2016/1/4.
 */
require.config({
    // alias libraries paths
    paths: {
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
        "angular-ui-router-stateEvents":"../public/vendor/angular-ui-router/release/stateEvents.min",
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
    // kick start application
    deps: ['bootstrap'],
    waitSeconds: 0
});

//var base_url=window.location.origin;
//var base_url = "";
var root_url="";
var base_url = "/api/web/dnh";
var NCTime = new Date();
var NCISOTime = new Date().toISOString();
var NCTimeOffset = new Date().getTimezoneOffset();
//var base_url = "http://"+window.location.hostname+":30002";
window.onresize = function () {
    changeDivHeight();
};
/*var url = location.origin;*/
function changeDivHeight() {
    var left = document.getElementsByClassName('main-sidebar')[0];
    if (left) {
        var height = left.clientHeight;
        document.getElementsByClassName('sidebar')[0].style.height = (height - 42) + "px";
    }
}
var closetimer;
function showLogDetail(message, e) {
    if (closetimer) {
        window.clearTimeout(closetimer);
        closetimer = null;
    }
    closetimer = window.setTimeout(function () {
        var find = document.getElementById("log_Detail");
        find.style.display = 'block';
        find.innerHTML = message;
        var souEle = e.target;
        var sHeight = e.clientY + 64;
        var height = document.body.offsetHeight;
        var sOffsetT = sHeight - 1 + find.offsetHeight;
        var width=parseInt(souEle.parentNode.offsetWidth);
        width=width<220?220:width;
        find.style.width = width + 'px';
        if (sOffsetT < height) {
            find.style.top = ( e.clientY + 16) + 'px';
        } else {
            find.style.top = ( e.clientY - find.offsetHeight - 16) + 'px';
        }
        souEle.onmouseleave = function () {
            closetimer = window.setTimeout(function () {
                var find = document.getElementById("log_Detail");
                find.style.display = 'none';
            }, 50);
        };
        find.onmouseover = function () {
            if (closetimer) {
                window.clearTimeout(closetimer);
                closetimer = null;
            }
        }
        find.onmouseleave = function () {
            closetimer = window.setTimeout(function () {
                var find = document.getElementById("log_Detail");
                find.style.display = 'none';
            }, 50);
        };
    }, 50);


}
function hideLogDetail(row, e) {
    closetimer = window.setTimeout(function () {
        var find = document.getElementById("log_Detail");
        find.style.display = 'none';
    }, 50);

}
function randomGridSize(gridId) {

    var left = document.getElementsByClassName('main-sidebar')[0];
    if (left) {
        var newHeight = left.clientHeight - 200;
        var grid = document.getElementById(gridId);
        if (grid) {
            angular.element(grid).css('height', newHeight + 'px');
        }
    }
};
function setHeight(ele, subtractArr, num) { //用于控制没有grid的内容区域高度
    var num = num || 0;
    var subtractArr = subtractArr || [];
    var ele = ele || 'set-height';
    var height = document.documentElement.clientHeight - 89 + num;
    var cont = document.getElementsByClassName(ele);
    for (var i = 0; i < subtractArr.length; i++) {
        if (document.getElementsByClassName(subtractArr[i])[0]) {
            height -= document.getElementsByClassName(subtractArr[i])[0].offsetHeight;
        }
    }
    if (cont.length == 1) {
        angular.element(cont[0]).css('height', height + 'px');
    } else {
        for (var i = 0; i < cont.length; i++) {
            angular.element(cont[i]).css('height', height + 'px');
        }
    };
}
function setGridHeight(gridId, type, padding) { //用于控制grid高度以撑起内容区域
    var padding = padding || 0;
    var cont = document.getElementsByClassName("set-height")[0];
    var grid = document.getElementById(gridId);
    var titElement = document.getElementsByClassName("elementFlag1")[0];
    var titElementHeight = titElement ? titElement.clientHeight : 0;
    if (cont) {
        var newHeight = cont.clientHeight - 8 - (type ? 40 : 0) - titElementHeight - padding; // type 是否分页器 titElementHeight头部按钮或说明 padding容器上下padding
        angular.element(grid).css('min-height', newHeight + 'px');
        angular.element(grid).css('height', newHeight + 'px');
    }
};
function setGridAccuracyHeight(gridId, height) {
    var grid = document.getElementById(gridId);
    if (grid) {
        angular.element(grid).css('min-height', height + 'px');
        angular.element(grid).css('height', height + 'px');
    }
}
function Timestamp() {
    var now = new Date();
    var month = now.getMonth() + 1;
    var date = now.getDate();
    var hour = now.getHours();
    var min = now.getMinutes();
    var str = "";
    str += now.getFullYear().toString() + (month < 10 ? "0" + month : month) + (date < 10 ? "0" + date : date) + (hour < 10 ? "0" + hour : hour) + (min < 10 ? "0" + min : min);
    return str;
}
function bursterInit(totalItems, pageSizes){
    this.totalItems = totalItems;
    this.pageSizes = pageSizes;
    this.pageSize = pageSizes[0];
    this.currentPage = 1;
    this.maxPage = Math.ceil(this.totalItems/this.pageSize);
    this.pageFirst = function(){
        this.currentPage = 1;
    };
    this.pageLast = function(){
        this.currentPage = this.maxPage;
    };
    this.pagePrevious = function(){
        this.currentPage--;
    };
    this.pageNext = function(){
        this.currentPage++
    };
    this.pageSizeChange = function(){
        this.pageFirst();
        this.maxPage = Math.ceil(this.totalItems/this.pageSize);
    };
    return this;
}
