define(["controllerModule"], function (controllers) {

    controllers.controller('appGlobalController',["$rootScope","$scope","$translate","$timeout","StorageService","Current","moudlesService", function ($rootScope,$scope, $translate,$timeout,StorageService,Current,moudlesService) {
        $scope.title="Login";
        $scope.theme='green';
         
        $scope.moudle={};

        //设置应用语系
        var languageKey = sessionStorage.getItem("language");
        $translate.use(languageKey);


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
        }, {'langflag': 'it','gridlang':'it', 'name': 'In Italiano'}];
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

        };

        $scope.changeLanguage(languageKey);



        $scope.$on('title',function(event, type, ev){
            $scope.title="menu."+type;
        });
        $scope.$on('menu State change',function(event,type,ev){
             moudlesService.moudles().then(function(data){
                $scope.moudle =data;
            });
        });
        $scope.$on('moudle changed',function(){
         //   moudlesService.resetModule();
            moudlesService.moudles(true).then(function(data){
                $scope.moudle=data;
            });
            moudlesService.showMenu('summary');
        });
        $scope.$on('hide',function(event,hide,ev){
            if(hide==null){
                if($scope.isHided){
                    $scope.isHided=false;
                    $scope.isHide=false;
                }else{
                    $scope.isHided=true;
                    $scope.isHide=true;
                }
            }else{
                $scope.isOver=!hide;
                if(!$scope.isHided){
                    $scope.isHide=false;
                }else {
                    $scope.isHide=hide;
                }
            }
        });
        $scope.isHided=false;
        $scope.isHide=false;
        $scope.isOver=false;


    }]);
});