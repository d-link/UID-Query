/**
 * Created by lizhimin on 2018/1/4.
 */
define(["controllerModule"], function (controllers) {
    controllers.controller('operatelogController', function ($scope, $timeout, LogService){
        setHeight();
        $timeout(function(){
            setGridHeight('operategrid')
        },100);
        $scope.timer = null;
        window.onresize = function(){
            setHeight();
            $timeout.cancel($scope.timer);
            $scope.timer = $timeout(function(){
                setGridHeight('operategrid');
            },300);
        }
        $scope.gridOptions={
            enablePagination: true, //是否分页，默认为true
            paginationPageSizes: [20, 50, 100],
            paginationPageSize: 50,
            paginationTemplate: './views/templates/gridBurster.html'
        };
        $scope.gridOptions.columnDefs=[
            {field: 'logTime',  width: "12%", displayName: 'Time' ,type: 'date',cellFilter: 'date:"yyyy-MM-dd HH:mm:ss"'},
            {field: 'category', displayName: 'Category',  width: "12%"},
            {field: 'userAccount', displayName: 'User',  width: "12%"},
            {field: 'target', displayName: 'Target',  width: "12%"},
            {field: 'operateType', displayName: 'Action',  width: "12%"},
            {field: 'message', displayName: 'Message',  width: "40%"}
        ];
        function getOperateLog() {
            let from = '';
            let to = "";
            LogService.getAllOperateLogs({from:from, to:to}, function (result) {
                if(result.success){
                    $scope.gridOptions.data = result.data;
                }
            })
        }
        getOperateLog();
    });
});