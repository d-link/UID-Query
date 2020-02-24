/**
 * Created by lizhimin on 2016/3/15.
 */
define(["controllerModule"], function (controllers) {

    controllers.controller('GlobalController', ["$rootScope", "$scope", "$translate", "$timeout", "StorageService", "Current", "moudlesService", "TS", function ($rootScope, $scope, $translate, $timeout, StorageService, Current, moudlesService, TS) {     
        $scope.title = "Nuclias Connect";
        $scope.theme ={
            color:'green',
            textStyle:"微软雅黑, Arial, Verdana, sans-serif"
        } ;
        $scope.showaside = false;
        $scope.moudle = {};
        $rootScope.alerts = [];
        $scope.langStyle={"min-width":"126px"};
        $rootScope.closeAlert = function (index) {
            $rootScope.alerts.splice(index, 1);
        }
        $scope.toggleAside = function () {
            $scope.showaside = !$scope.showaside;
        };
        /**
         * 这个地方主要是为了解决ui-gird和我们自定义语言不同的映射
         * langflag代表我们自己定义和切换的语言和lang文件对应，gridlang代表ui-grid.js中定义的语言
         * **/
       $scope.langFlags = [{'langflag': 'en', 'gridlang':'en','name': 'English'}, {
            'langflag': 'tw','gridlang':'zh-tw',
            'name': '繁體中文'
        }, {'langflag': 'cn', 'gridlang':'zh-cn','name': '简体中文'}, {'langflag': 'fr','gridlang':'fr', 'name': 'Français'}, {
            'langflag': 'es','gridlang':'es',
            'name': 'Español'
        }, {
            'langflag': 'de','gridlang':'de',
            'name': 'Deutsch'
        }, {
            'langflag': 'kr','gridlang':'ko',
            'name': '한국어.'
        }, {'langflag': 'jp','gridlang':'ja', 'name': '日本語'}, {
            'langflag': 'ru','gridlang':'ru',
            'name': 'русский язык'
       }, {'langflag': 'it', 'gridlang': 'it', 'name': 'In Italiano'}, {
           'langflag': 'tk',
           'gridlang': 'tr',
           'name': 'Turkish'
       }];
        $scope.langFlag = {selected: $scope.langFlags[0]};
        var lang = StorageService.get("lang");
        if (lang) {
            for (var i = 0; i < $scope.langFlags.length; i++) {
                if ($scope.langFlags[i].langflag == lang) {
                    $scope.langFlag = {selected: $scope.langFlags[i]};
                }
            }
        }
        // $scope.langFlag = "en";

        $translate.use($scope.langFlag.selected.langflag);
        resetFontFamily($scope.langFlag.selected.langflag);
        function resetFontFamily(langflag){
            if(langflag=='jp'){
                $scope.theme.textStyle= {
                    fontFamily: 'Georgia, "游明朝", "Yu Mincho", "游明朝体", YuMincho, "ヒラギノ明朝 Pro", "Hiragino Mincho ProN", "MS P明朝", "MS PMincho", HGS明朝E, "MS Mincho", serif'
                };
                document.body.setAttribute('style', 'font-family:Georgia, "游明朝", "Yu Mincho", "游明朝体", YuMincho, "ヒラギノ明朝 Pro", "Hiragino Mincho ProN", "MS P明朝", "MS PMincho", HGS明朝E, "MS Mincho", serif;');
            }else{
                $scope.theme.textStyle= {
                    fontFamily: '\'LatoWeb\', Microsoft YaHei,serif'
                };
                document.body.setAttribute('style', 'font-family: \'LatoWeb\', Microsoft YaHei, STKaiti;');
            }
            if(langflag=='ru'){
                $scope.langStyle={"min-width":"186px"};

            }else  if(langflag=='jp'||langflag=='fr'){
                $scope.langStyle={"min-width":"156px"};

            }else{
                $scope.langStyle={"min-width":"126px"};
            }
        }

        $scope.changeLanguage = function (langFlag) {
            // $scope.langFlag = langFlag;
            $translate.use(langFlag);
            // Current.setLang($scope.langFlag);
            StorageService.set("lang", langFlag);
            for (var i = 0; i < $scope.langFlags.length; i++) {
                if ($scope.langFlags[i].langflag == langFlag) {
                    $scope.langFlag = {selected: $scope.langFlags[i]};
                }
            }
            Current.broadcast("changeLang1");
            resetFontFamily(langFlag);
        };
        $scope.langSelect = function ($item) {
            $scope.changeLanguage($item.langflag);

        };
        // $scope.$watch('langFlag',function(){
        //     $scope.changeLanguage($scope.langFlag);
        // });
        $scope.$on('changeLang', function () {
            // $scope.langFlag=Current.getLang();
            $translate.use($scope.langFlag.selected.langflag);
            StorageService.set("lang", $scope.langFlag.selected.langflag);
            resetFontFamily($scope.langFlag.selected.langflag);
        });
        $scope.$on('title', function (event, type, ev) {
            $scope.title = "Nuclias Connect";

        });
        $scope.$on('devIP',function(event,devId,ev){
            var dev=Current.getDevice(devId);
            if(dev){
                $scope.title =  dev.ip;
            }
        })
        $scope.$on('menu State change', function (event, type, ev) {
            moudlesService.moudles().then(function (data) {
                $scope.moudle = data;
            });

        });
        /*     $scope.$on('theme',function(event,theme,ev){
         $scope.theme =theme;
         if($scope.isHide){
         angular.element(document.body).attr('class','hold-transition sidebar-mini skin-'+$scope.theme);
         }else{
         angular.element(document.body).attr('class','hold-transition  skin-'+$scope.theme);
         }
         });*/
        $scope.$on('moudle changed', function () {
            //   moudlesService.resetModule();
            moudlesService.moudles(true).then(function (data) {
                $scope.moudle = data;
            });
            //  moudlesService.showMenu('summary');
        });
        $scope.$on('hide', function (event, hide, ev) {
            if (hide == null) {
                if ($scope.isHided) {
                    $scope.isHided = false;
                    $scope.isHide = false;
                } else {
                    $scope.isHided = true;
                    $scope.isHide = true;
                }
            } else {
                $scope.isOver = !hide;
                if (!$scope.isHided) {
                    $scope.isHide = false;
                } else {
                    $scope.isHide = hide;
                }
            }
        });
        $scope.isHided = false;
        $scope.isHide = false;
        $scope.isOver = false;

        $scope.showContentSide = true;
        $scope.sideToggle = function () {
            $scope.showContentSide = !$scope.showContentSide;
        };
        $scope.showAlertDialog=function(msg){

        }
    }]);
});