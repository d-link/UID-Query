/**
 * Created by lizhimin on 2016/1/4.
 */
require.config({
    // alias libraries paths
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
        "angular-ui-router-stateEvents":"../public/vendor/angular-ui-router/release/stateEvents.min",
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
        //'echart-directive': 'scripts/directives/echart-directive',
        //'echart-theme': 'scripts/directives/theme',
        //'echart-connect': 'scripts/directives/echart-connect-directive',
        //'blue': 'scripts/directives/theme/blue',
        //'green': 'scripts/directives/theme/green',
        //'orange': 'scripts/directives/theme/orange',
        //"wangEditor": "../public/vendor/wangEditor/release/wangEditor.min",
        //'oc.lazyload':'../public/vendor/oclazyload/dist/ocLazyLoad.js',

        // angularAMD
        /*   "angularAMD": "scripts/vendor/angularAMD/angularAMD",*/
        /*  "ngload": "scripts/vendor/angularAMD/ngload",*/
        // 'pdfmake': '../public/vendor/pdfmake/build/pdfmake',
        // 'vfsfont': '../public/vendor/pdfmake/build/vfs_fonts',
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
        // 'vfsfont': {exports: 'vfsfont'},
        // 'pdfmake': {exports: 'pdfmake'},
        'ngFileUpload': ['angular'],
        'angular-sanitize': ['angular'],
        'ui-bootstrap': ['angular'],
        'ip-mask': ['angular'],
        'dview8-components': ['angular'],
        'angular-ui-select': ['angular']
    },
    // kick start application
    deps: ['bootstrap'],
    waitSeconds: 0
});
//var base_url=window.location.origin;
//var base_url = "";
var root_url = "";
var base_url = "/api/web/dnh";
var isFWUpgrade = false;
var NCTime = new Date();
var NCISOTime = new Date().toISOString();
var NCTimeOffset = new Date().getTimezoneOffset();
var NTPStatus = 1;
var SDStatus = 1;
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
//获取元素的纵坐标
function getTop(e) {
    var offset = e.offsetTop;
    if (e.offsetParent != null && e != document.body) offset += getTop(e.offsetParent);
    return offset;
}
function offset(elem) {
    var obj = {
        left: elem.offsetLeft,
        top: elem.offsetTop,
        width: elem.offsetWidth,
        height: elem.offsetHeight
    }
    while (elem != document.body) {
        elem = elem.offsetParent;
        console.log(elem);
        console.log(elem.offsetTop);
        obj.left += elem.offsetLeft;
        obj.top += elem.offsetTop;
    }
    return obj;

}
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
    }
    ;
}
function setGridHeightConst(gridId, newHeight) { //用于控制grid高度以撑起内容区域
    var grid = document.getElementById(gridId);
    angular.element(grid).css('min-height', newHeight + 'px');
    angular.element(grid).css('height', newHeight + 'px');
};
function setGridHeight(gridId, type, padding) { //用于控制grid高度以撑起内容区域
    var padding = padding || 0;
    var cont = document.getElementsByClassName("set-height")[0];
    var grid = document.getElementById(gridId);
    var titElement = document.getElementsByClassName("elementFlag1")[0];
    var titElementHeight = titElement ? titElement.clientHeight : 0;
    var topEle=document.getElementsByClassName("grid-top-menu")[0];
    var topHeight=topEle?topEle.clientHeight:40;
    if (cont) {
        var newHeight = cont.clientHeight - 8 - (type ? topHeight : 0) - titElementHeight - padding; // type 是否分页器 titElementHeight头部按钮或说明 padding容器上下padding

        if ('msSaveOrOpenBlob' in navigator) {
            if (type) {
                angular.element(grid).css('padding-bottom', '36px');
                newHeight = newHeight - 36;
            }

        }
        if (newHeight < 240) newHeight = 240;
        angular.element(grid).css('min-height', newHeight + 'px');
        angular.element(grid).css('height', newHeight + 'px');
        if (gridId == 'about-grid') {
            angular.element(grid).css('min-height', newHeight - 52 + 'px');
            angular.element(grid).css('height', newHeight - 52 + 'px');
        }
        if (!type) {
            angular.element(grid).css('padding-bottom', '16px');
        }
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
Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1,                 //月份
        "d+": this.getDate(),                    //日
        "h+": this.getHours(),                   //小时
        "m+": this.getMinutes(),                 //分
        "s+": this.getSeconds(),                 //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds()             //毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
function bursterInit(totalItems, pageSizes) {
    this.totalItems = totalItems;
    this.pageSizes = pageSizes;
    this.pageSize = pageSizes[0];
    this.currentPage = 1;
    this.maxPage = Math.ceil(this.totalItems / this.pageSize);
    this.pageFirst = function () {
        this.currentPage = 1;
    };
    this.pageLast = function () {
        this.currentPage = this.maxPage;
    };
    this.pagePrevious = function () {
        this.currentPage--;
    };
    this.pageNext = function () {
        this.currentPage++
    };
    this.pageSizeChange = function () {
        this.pageFirst();
        this.maxPage = Math.ceil(this.totalItems / this.pageSize);
    };
    return this;
}

var HtmlUtil = {
    /*1.用浏览器内部转换器实现html转码*/
    htmlEncode: function (html) {
        //1.首先动态创建一个容器标签元素，如DIV
        var temp = document.createElement ("div");
        //2.然后将要转换的字符串设置为这个元素的innerText(ie支持)或者textContent(火狐，google支持)
        (temp.textContent != undefined ) ? (temp.textContent = html) : (temp.innerText = html);
        //3.最后返回这个元素的innerHTML，即得到经过HTML编码转换的字符串了
        var output = temp.innerHTML;
        temp = null;
        return output;
    },
    /*2.用浏览器内部转换器实现html解码*/
    htmlDecode: function (text) {
        //1.首先动态创建一个容器标签元素，如DIV
        var temp = document.createElement("div");
        //2.然后将要转换的字符串设置为这个元素的innerHTML(ie，火狐，google都支持)
        temp.innerHTML = text;
        //3.最后返回这个元素的innerText(ie支持)或者textContent(火狐，google支持)，即得到经过HTML解码的字符串了。
        var output = temp.innerText || temp.textContent;
        temp = null;
        return output;
    }
};
function doKey(e) {
    var ev = e || window.event;//获取event对象
    var obj = ev.target || ev.srcElement;//获取事件源
    var t = obj.type || obj.getAttribute('type');//获取事件源类型
    if(obj.className=='w-e-text') t="textarea";
    var readonly = obj.readOnly;
    if (ev.keyCode == 8 && ( readonly || (t != "password" && t != "text" && t != "number" && t != "email" && t != "tel" && t != "textarea"&&t!="search"))) {
        return false;
    }
}
//禁止后退键 作用于Firefox、Opera
document.onkeypress = doKey;
//禁止后退键  作用于IE、Chrome
document.onkeydown = doKey;