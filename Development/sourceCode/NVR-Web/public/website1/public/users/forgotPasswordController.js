/**
 * Created by lizhimin on 2016/3/18.
 */
define(["controllerModule"], function (controllers) {

    controllers.controller('ForgotPasswordController', function ($rootScope, $scope, $state, Auth, Current, $timeout) {
        $state.go("anon.user.forgotPass.profile");
        $scope.userInfo = {email: '', validCode: '', newPass: '', repeatPass: ''};
        $scope.alert = {msg: ''};
        $rootScope.forgotStates = {
            'userEmail': {'active': true, 'passed': false, 'btnDisabled': false},
            'userInfo': {'active': false, 'passed': false, 'btnDisabled': true},
            'userPass': {'active': false, 'passed': false, 'btnDisabled': false}
        };

        $scope.processForm = function () {

        };
        //发送邮件
        var sendEmail = function () {
            $scope.InvalidEmail = false;
            $scope.InvalidSMTP=false;
            $scope.sendEmailFailed=false;
            $scope.time = 60;
            Auth.forgotPass($scope.userInfo.email,function (result) {
                result = result.data;
                if (!result.success) {
                    if(result.error==1){
                        $scope.InvalidEmail = true;
                    }else if(result.error==2){
                        $scope.InvalidSMTP=true;
                    }else{
                        $scope.sendEmailFailed=true;
                    }
                } else {
                    $state.go("anon.user.forgotPass.valid");
                    $rootScope.forgotStates.userEmail.passed = true;
                    $rootScope.forgotStates.userInfo.active = true;
                    $scope.userInfo.username=result.data.username;
                }
                $rootScope.forgotStates.userEmail.btnDisabled =false;
            });
            countDown();

        };
        //检查验证码的有效性
        $scope.checkCode = function () {
            $scope.InvalidCaptcha = false;
            Auth.checkValidCode($scope.userInfo.email,$scope.userInfo.validCode,function (result) {
                result = result.data;
                if (!result.success) {
                    $scope.InvalidCaptcha = true;
                } else {
                    $state.go("anon.user.forgotPass.resetPass");
                    $rootScope.forgotStates.userEmail.passed = true;
                    $rootScope.forgotStates.userInfo.passed = true;
                    $rootScope.forgotStates.userPass.active = true;
                }
            });
        };

        $scope.resetPass=function(){
            $scope.InvalidReset = false;
            Auth.resetPass($scope.userInfo.email,$scope.userInfo.newPass,$scope.userInfo.validCode,function (result) {
                result = result.data;
                if (!result.success) {
                    $scope.InvalidReset = true;
                } else {
                    $state.go("anon.user.login");
                }
            });
        }
        var countDown = function () {
            $timeout(function () {
                $scope.time -= 1;
                if ($scope.time >= 1) {
                    countDown();
                }else{
                    $scope.time = '';
                }
            }, 1000);
        };

        $scope.testEmail = function(){
            $rootScope.forgotStates.userEmail.btnDisabled = true;
            $scope.InvalidEmail = false;
            $scope.InvalidSMTP=false;
            $scope.sendEmailFailed=false;
            Auth.checkEmailExist($scope.userInfo.email,function (result) {
                result = result.data;
                if (result.success) {
                    $rootScope.forgotStates.userEmail.passed= result.data;
                }
                if(result.data){
                    sendEmail();
                }else{
                    $scope.InvalidEmail = true;
                }
            });
        };
        $scope.$watch('userInfo.validCode',function(){
            validCodeText();
        });
        function validCodeText(){
            if($scope.userInfo.validCode && $scope.userInfo.validCode.length >= 8){
                // $scope.trueCode == $scope.userInfo.validCode //验证验证码
                $rootScope.forgotStates.userInfo.btnDisabled = false;
            }else{
                $rootScope.forgotStates.userInfo.btnDisabled = true;
            }
        }
        // 重新发送验证码
        $scope.resetCode = function(){
            // $http.post(base_url + "/api/auth/forgotPass", {email: $scope.userInfo.email}).then(function (result) {

            // });
            sendEmail();
            // validCodeText()
        }
    });
})