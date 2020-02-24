/**
 * Created by lizhimin on 2015/12/7.
 */
define(['angular', "angular-translate", "lang_en", "lang_cn", "lang_tw","lang_es","lang_it","lang_kr","lang_de","lang_fr","lang_jp","lang_ru","lang_tk"], function (ng) {
    var lang_en = require("./lang_en");
    var lang_cn = require("./lang_cn");
    var lang_tw = require("./lang_tw");
    var lang_es = require("./lang_es");
    var lang_it = require("./lang_it");
    var lang_kr = require("./lang_kr");
    var lang_de = require("./lang_de");
    var lang_fr = require("./lang_fr");
    var lang_jp = require("./lang_jp");
    var lang_ru = require("./lang_ru");
    var lang_tk = require("./lang_tk");
    var lang = ng.module('app.lang', ["pascalprecht.translate"]);
    lang.config(function ($translateProvider) {
        $translateProvider
            .translations('en', lang_en)
            .translations('cn', lang_cn)
            .translations('tw', lang_tw)
            .translations('es', lang_es)
            .translations('it', lang_it)
            .translations('kr', lang_kr)
            .translations('de', lang_de)
            .translations('fr', lang_fr)
            .translations('jp', lang_jp)
            .translations('ru', lang_ru)
            .translations('tk', lang_tk);

        $translateProvider.preferredLanguage('en').useSanitizeValueStrategy('escapeParameters');
    });
    return lang;
});