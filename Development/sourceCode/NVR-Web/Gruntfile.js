module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                files: {
                    //1
                    "public/website1/nuclias_connect/scripts/dev/dev_common.js": [
                        "public/website1/nuclias_connect/scripts/common/globalGridOptions.js",
                        "public/website1/nuclias_connect/scripts/directives/theme/blue.js",
                        "public/website1/nuclias_connect/scripts/directives/theme/green.js",
                        "public/website1/nuclias_connect/scripts/directives/theme/orange.js",
                        "public/website1/nuclias_connect/scripts/directives/cwmBarChart.js",
                        "public/website1/nuclias_connect/scripts/directives/echart-connect-directive.js",
                        "public/website1/nuclias_connect/scripts/directives/echart-directive.js",
                        "public/website1/nuclias_connect/scripts/directives/InterfaceMultiSelect.js",
                        "public/website1/nuclias_connect/scripts/directives/ip-mask.js",
                        "public/website1/nuclias_connect/scripts/directives/passwordInput.js",
                        "public/website1/nuclias_connect/scripts/directives/portDetail.js",
                        "public/website1/nuclias_connect/scripts/directives/selectDevice.js",
                        "public/website1/nuclias_connect/scripts/directives/theme.js",
                        "public/website1/nuclias_connect/scripts/directives/validateDirective.js",
                        "public/website1/nuclias_connect/scripts/directives/wizardTemplate.js",
                    ],
                    //2
                    "public/website1/nuclias_connect/scripts/dev/dev_filter.js": [
                        "public/website1/nuclias_connect/scripts/filters/batchConfigFilter.js",
                        "public/website1/nuclias_connect/scripts/filters/commonFilter.js",
                    ],
                    //3
                    "public/website1/nuclias_connect/scripts/dev/dev_lang.js": [
                        "public/website1/nuclias_connect/scripts/lang/lang.js",
                        "public/website1/nuclias_connect/scripts/lang/lang_cn.js",
                        "public/website1/nuclias_connect/scripts/lang/lang_en.js",

                    ],
                }
            }
        },
        uglify: {
            dist: {
                files: {
                    "public/website1/nuclias_connect/scripts/dev/dev_common.min.js": ["public/website1/nuclias_connect/scripts/dev/dev_common.js"],
                    "public/website1/nuclias_connect/scripts/dev/dev_filter.min.js": ["public/website1/nuclias_connect/scripts/dev/dev_filter.js"],
                    "public/website1/nuclias_connect/scripts/dev/dev_lang.min.js": ["public/website1/nuclias_connect/scripts/dev/dev_lang.js"],

                }
            },
            javascripts: {
                options: {}
            }
        },
        cssmin: {
            banner: {
                options: {
                    banner: '/* My minified css file test test */'
                },
                files: {}
            },
            compress: {
                files: {}
            }
        }
    });

    // 加载包含 "uglify" 任务的插件。
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    // 默认被执行的任务列表。
    grunt.registerTask("default", ["jasmine:test"]);
    grunt.registerTask("dist", ["concat:dist", "uglify:dist", "cssmin:banner"]);//合并
    grunt.registerTask("temp", ["jasmine:temp"]);
};