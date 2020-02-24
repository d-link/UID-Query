/**
 * Created by lizhimin on 2017/6/9.
 */
define(["app"], function (app) {
    app.register.controller('siteSSLController', function ($scope, BatchConfigService, Upload, $timeout, Current, ajaxService, utils, TS) {
        $scope.hasPrivilege = Current.user().role == "root admin" || Current.user().role == "local admin";
        /*
         * 页面固定参数
         */
        $scope.state = {
            ssl: {
                isSuccess: false, isError: false, processing: false, msgTrue: 'ssl.msgTrue',
                msgFalse: 'ssl.msgFalse',
                upload: 'common.upload'
            },
        };
        function initSslState() {
            $scope.state.ssl.processing = false;
            $scope.state.ssl.isSuccess = false;
            $scope.state.ssl.isError = false;
        };
        initSslState();

        $scope.ssl = {
            certificate: '',
            key: ''
        };
        // ssl结果配置
        $scope.sslResultOption = {
            onRegisterApi: function (gridApi) {
                $scope.gridApi = gridApi;
            }
        };
        $scope.sslResultOption.columnDefs = [
            {
                name: 'logTime',
                displayName: TS.ts('column.runTime'),
                width: "20%",
                minWidth: "140",
                enableHiding: false,
                sort:{
                    direction:'desc'
                },
                cellFilter: 'date:"yyyy-MM-dd HH:mm:ss"'
            },
            {name: 'target.name', displayName: TS.ts('column.name'), width: "15%", minWidth: "130",enableHiding: false},
            {
                name: 'target.ip', displayName: TS.ts('column.ipv4'), width: "18%", minWidth: "110",enableHiding: false,
                suppressRemoveSort: true, sortingAlgorithm: function (a, b, rowA, rowB, direction) {
                var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
                return utils.sortByIP(nulls, a, b);

            }
            },
            {name: 'target.mac', displayName: TS.ts('column.mac'), width: "18%", minWidth: "110",enableHiding: false},
            {name: 'target.moduleType', displayName: TS.ts('column.moduleType'), width: "13%",minWidth: "96", enableHiding: false},
            {name: 'execResult', displayName: TS.ts('column.result'), minWidth: "80", enableHiding: false,
                cellTemplate: '<div ng-if="row.entity.resultType==\'Success\'" class="ui-grid-cell-contents">'+ TS.ts('common.success')+'</div>' +
                '<div ng-if="(row.entity.resultType==\'Cancel\' && row.entity.execResult!=\'\')" class="ui-grid-cell-contents">'+ TS.ts('common.cancel') +': {{row.entity.execResult}}</div>' +
                '<div ng-if="(row.entity.resultType==\'Cancel\' && row.entity.execResult==\'\')" class="ui-grid-cell-contents">'+ TS.ts('common.cancel')+'</div>' +
                '<div ng-if="(row.entity.resultType==\'Error\' && row.entity.execResult!=\'\')" class="ui-grid-cell-contents">'+ TS.ts('common.fail') +': {{row.entity.execResult}}</div>' +
                '<div ng-if="(row.entity.resultType==\'Error\' && row.entity.execResult==\'\')" class="ui-grid-cell-contents">'+ TS.ts('common.fail')+'</div>' }
        ];
        $scope.runStatus = {
            status: '0/0'
        };
        $scope.fileError = {};
        $scope.fileChange = function (type) {
            //console.log($scope.ssl[type]);
            // 匹配后缀名
        };

        $scope.progressPercentage = 0;
        function getSSLCerInfo() {
            var parameter = {
                networkId: $scope.networkId
            };
            BatchConfigService.getSSLCerInfo(parameter, function (result) {

            })
            $scope.ssl = {
                certificate: '',
                key: ''
            };
        };
        $scope.$watch('networkId', function () {
            getSSLCerInfo();
            refreshSSLResult();
        })
        var refreshSSLResult = function () {
            BatchConfigService.getSSLResult($scope.networkId, function (result) {
                if (result.success) {
                    $scope.runStatus = result.data;
                    $scope.sslResultOption.data = $scope.runStatus.result;
                }
                $timeout(function () {
                    setGridHeight('sslResultInfo', true,200);
                }, 100);
            });
        };
        getSSLCerInfo();
        $scope.$on('refreshSSLResult', refreshSSLResult);
        $scope.upload = function () {
            initSslState();

            var params = {
                url: base_url + '/batchConfig/uploadSSLCerInfo',
                data: {
                    file: []
                }
            };
            // 添加文件
            params.data.file.push($scope.ssl.certificate);
            params.data.file.push($scope.ssl.key);

            params.data.orgId = Current.org().orgId;
            params.data.networkId = $scope.networkId;
            $scope.state.ssl.processing = true;
            Upload.upload(params).progress(function (evt) {
                $scope.progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                var bars= document.getElementsByClassName("processBar");
                for(var i=0;i<bars.length;i++){
                    bars[i].style.width=$scope.progressPercentage+"%";
                }
                $scope.processText={width:$scope.progressPercentage+"%"};
            }).then(function (response) {
                ajaxService.updateToken(response.headers);
                $scope.state.ssl.processing = false;
                if (response.status == 200) {
                    if (!response.data.success) {
                        $scope.state.ssl.isError = true;
                        if (response.data.error == 1) {
                            $scope.state.ssl.msgFalse = "ssl.msgFalse1";
                        }
                        else if (response.data.error == 2 || response.data.error != 'data') {
                            $scope.state.ssl.msgFalse = 'ssl.msgFalse2';
                        } else {
                            $scope.state.ssl.msgFalse = "ssl.msgFalse3";
                        }
                    } else {
                        $scope.state.ssl.isSuccess = true;
                        refreshSSLResult();
                    }

                }
            }, function () {
            }, function () {
            });
            // https://www.awesomes.cn/repo/danialfarid/ng-file-upload
        };
    })
    app.register.directive('siteSsl', function () {
        return {
            restrict: 'AE',
            templateUrl: "./views/configuration/site-SSL.html",
            scope: {
                networkId: '='
            },
            controller: 'siteSSLController'
        };
    });
})
