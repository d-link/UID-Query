/**
 * Created by lilihong on 2019/4/26.
 */
define(["app"], function (app) {
    app.register.directive('ticTok', function () {

        return {
            restrict: 'AE',
            scope: {
                dataInfo: '=',
                state: '='
            },
            templateUrl: "./views/configuration/ticTok.html",
            controller: function ($scope, $interval,Auth) {
                if( $scope.dataInfo){
                    var second = $scope.dataInfo.second;
                    var text = $scope.dataInfo.text;
                }
                $scope.$on("hideTickTok", function (event) {
                    $scope.showTic = false;
                    $scope.showTickToc = false;
                    $scope.showSDLoading = false;
                });
                $scope.$on("tickTok", function (event, text, second, webAccessPort, ipAddress) {
                    if (text.text4) {
                        tictok1(text, 10, second, webAccessPort, ipAddress);//显示sd卡在备份 10s
                        $scope.showTic = true;
                        $scope.text = text;
                    } else {
                        tictok(text, second, webAccessPort, ipAddress);
                        $scope.showTic = true;
                        $scope.text = text;
                    }

                });

                function tictok1(text, second1, second, webAccessPort, ipAddress) {
                    $scope.showTickToc = false;
                    $scope.showSDLoading2 = true;
                    //先显示sd在备份
                    var secondInterval1 = $interval(function () {
                        if (second1 < 0) {
                            // 倒计时结束
                            // 关闭定时器
                            $interval.cancel(secondInterval1);
                            tictok(text, second, webAccessPort, ipAddress);
                        } else {
                            // 继续计时
                            $scope.second = second1;
                            second1--;
                        }
                    }, 1000);
                }

                function tictok(text, second, webAccessPort, ipAddress) {
                    if (second) {
                        $scope.showTickToc = true;
                        $scope.showSDLoading = false;
                        $scope.showSDLoading2 = false;
                        var secondInterval = $interval(function () {
                            if (second < 0) {
                                // 倒计时结束
                                $scope.second = "";
                                // 关闭定时器
                                $interval.cancel(secondInterval);
                                secondInterval = undefined;
                                //退出系统
                                logout(webAccessPort, ipAddress);
                            } else {
                                // 继续计时
                                $scope.second = second;
                                second--;
                            }
                        }, 1000);
                    } else {
                        $scope.showTickToc = false;
                        $scope.showSDLoading = true;
                    }

                }

                function logout(webAccessPort, ipAddress) {
                    if(ipAddress){
                        var webAccessPort = webAccessPort || 443;
                        window.location = "https://" + ipAddress + ":" + webAccessPort;
                    }else{
                        window.location = "/";
                    }
                }
            }
        };
    });
});