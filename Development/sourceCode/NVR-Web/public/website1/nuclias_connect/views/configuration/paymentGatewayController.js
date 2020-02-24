/**
 * Created by g on 18-2-9.
 */
define(["app"], function (app) {

    app.register.controller('paymentGatewayController', function ($scope, $timeout, Current, OrganizationService, TS, utils) {
        /**
         * 修改页面和表格高度
         */
        setHeight(); // set-height 表格高度依据
        /**
         * payment
         */
            // select 选项
        $scope.codes = ['USD', 'AUD', 'GBP', 'CAD', 'CZK',
            'DKK', 'EUR', 'HKD', 'ILS', 'MXN',
            'NZD', 'NOK', 'PHP', 'PLN', 'RUB',
            'SGD', 'SEK', 'CHF', 'THB', 'BRL'];
        $scope.durationTypes = ['unitMin', 'unitHour', 'unitDay'];
        $scope.payment = {
            currencyCode: $scope.codes[0],
            APIUsername: '',
            APIPassword: '',
            options: []
        };
        $scope.hasPrivilege = Current.user().role == "root admin";
        // 添加option
        $scope.addOption = function () {
            $scope.saveDisabled = function(){
                return false;
            }
            var op = {
                duration: 0,
                type: 'unitMin',
                cost: 0,
            };
            $scope.payment.options.push(op);    
        };

        // 删除option
        $scope.delOption = function (index) {
            $scope.payment.options.splice(index, 1);
            //若Options無輸入資料, Save按鈕為disabled
            if(JSON.stringify($scope.payment.options) == '[]'){   
                $scope.saveDisabled = function(){
                    return true;
                }
            }      
        };
        $scope.clearNoNum = function (obj, index, e) {
            if (obj) {
                if (e.currentTarget.value > 1024.00) {
                    $scope.payment.options[index].cost = 0;
                }
                if (e.currentTarget.value === "0.00") {
                    $scope.payment.options[index].cost = 0;
                }
            }
        };

        $scope.state = {
            msgTrue: 'settings.saveOK',
            msgFalse: 'Error',
            isSuccess: false,
            isError: false,
            processing: false
        }
        
        // 保存payment
        $scope.savePayment = function () {
            $scope.state.processing = true;
            $scope.state.isSuccess = false;
            $scope.state.isError = false;
            OrganizationService.updatePayment($scope.org._id, $scope.payment, function (result) {
                if (result.success) {
                    $scope.state.processing = false;
                    $scope.state.isSuccess = true;
                } else {
                    $scope.state.processing = false;
                    $scope.state.isError = true;
                }
            });
        };

        OrganizationService.listAllOrgs(function (orgs) {

            if (orgs && orgs.length > 0) {
                $scope.org = orgs[0];
                $scope.org.orgId = $scope.org._id;

                $scope.payment = $scope.org.payment;
                $scope.payment.APIPassword= utils.decryptMethod($scope.payment.APIUsername,$scope.payment.APIPassword);
                if (!$scope.payment.currencyCode) $scope.payment.currencyCode = $scope.codes[0];
                if (!$scope.payment.options)$scope.payment.options = [];
                if ($scope.payment.options.length == 0) {
                    $scope.addOption();
                }
            }
        });

        $scope.numberKeydown = function ($event) {
            var re = /(\d|Backspace)/;
            if (!re.test($event.key)) {
                $event.preventDefault();
            }
        }

        $scope.costKeydown = function ($event) {
            var re = /(\d|\.|Backspace)/;
            if (!re.test($event.key)) {
                $event.preventDefault();
            }
        }
    })
});
