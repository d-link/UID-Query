/**
 * Created by lizhimin on 2018/12/14.
 */
define(["app"], function (app) {

    app.register.controller('downloadController', function ($scope, $uibModalInstance, OrganizationService, Current, flag, type, $timeout, utils) {
        //console.log(flag, type);
        $scope.type = type;
        $scope.backups = [];
        $scope.location = 'computer';
        $scope.usbStorageStatus = false;
        $scope.usbStoragePath = '/media/usb0';
        $scope.disableDelete = false;//多选按钮
        $scope.disableDownload = false;
        $scope.state = {
            msgTrue: 'settings.downloadOK',
            msgFalse: 'settings.db.useStorageFailed1',
            usbStorage: {
                isError: false,
                processing: false
            },
            download: {
                isSuccess: false,
                isError: false,
                processing: false
            },
            delete: {
                isSuccess: false,
                isError: false,
                processing: false
            },
        };

        OrganizationService.getDownloadFiles(flag, function (result) {
            if (result.success) {
                //设置备份文件，单选要选择第一个
                $scope.backups = result.data;
                if ($scope.backups.length > 0) {
                    //单选选择第一个
                    $timeout(function () {
                        var inputD = document.getElementById("d0");
                        inputD.checked = true;
                        inputD.nextElementSibling.firstElementChild.style.display = "block";
                        //deleteBackupList.push(inputE.value);
                    }, 0, false);
                    //多选也要选择第一个
                    $timeout(function () {
                        var inputE = document.getElementById("0");
                        inputE.checked = true;
                        inputE.nextElementSibling.firstElementChild.style.display = "block";
                        //deleteBackupList.push(inputE.value);
                    }, 0, false);
                } else {
                    //$scope.currentBackup = null;
                }


            }
        });
        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        /**
         * @method 下载备份
         * @author 李莉红
         * */
        function downloadBackup() {
            utils.getNodeTime(function(result){
                let now = new Date();
                var systimeByDay = `${now.getFullYear()}${('0'+(now.getMonth()+1)).slice(-2)}${('0'+now.getDate()).slice(-2)}`;
                if(result.success){
                    systimeByDay = utils.format(new Date(NCTime), 'yyyyMMdd');
                }
                var downloadBackupChar = "";
                var data = {};
                //多选的数组
                var list = document.getElementsByClassName("download_backup");
                for (var i = 0; i < list.length; i++) {
                    if (list[i].checked == true) {
                        if (!downloadBackupChar) {
                            downloadBackupChar = list[i].value;
                        } else {
                            downloadBackupChar = downloadBackupChar + "," + list[i].value;
                        }
    
                    }
                }
                OrganizationService.downloadBackup(flag, downloadBackupChar, $scope.location, $scope.usbStoragePath, function (result) {
                    if ($scope.location == 'computer') {
                        let flist = downloadBackupChar.split(',');
                        var fileName = downloadBackupChar;
                        if (flist.length>1){
                            let type = flag===1?"configuration":"log";
                            fileName = `${systimeByDay}_${type}_batch.tar`;
                        }
                        var blob = new Blob([result], {type: "application/octet-stream"});
                        if ('msSaveOrOpenBlob' in navigator) {
    
                            // Microsoft Edge and Microsoft Internet Explorer 10-11
                            window.navigator.msSaveOrOpenBlob(blob, fileName);
                        } else {
                            var a = document.getElementById("exportCSVlink");
                            a.download = fileName;
                            a.href = URL.createObjectURL(blob);
                            a.click();
                        }
                        data.flag = flag;
                        data.type = "success";
                        $uibModalInstance.close(data);
                    } else {
                        if (result.success) {
                            $scope.state.download.processing = false;
                            $scope.state.download.isSuccess = true;
                            data.flag = flag;
                            data.type = "success";
                            $uibModalInstance.close(data);
                        } else {
                            data.flag = flag;
                            data.type = "failed";
                            $scope.state.download.processing = false;
                            $scope.state.download.isError = true;
                            $scope.state.msgFalse = 'settings.db.downloadFailed';
                        }
                    }
                })
            });
        }

        /**
         * @method 下载备份的时候先检查usbstorage的状态
         * @author 李莉红
         * */
        $scope.download = function () {
            if ($scope.location == 'computer') {
                downloadBackup();
            } else {

                $scope.state.usbStorage.processing = true;
                $scope.state.usbStorage.isSuccess = false;
                $scope.state.usbStorage.isError = false;
                OrganizationService.getUSBStorage(function (result) {
                    if (result.success) {
                        $scope.usbStorageStatus = true;
                        $scope.state.usbStorage.processing = false;
                        $scope.usbStoragePath = result.data[0];
                        downloadBackup();
                    } else {
                        $scope.usbStorageStatus = false;
                        $scope.state.usbStorage.processing = false;
                        $scope.state.usbStorage.isError = true;
                        if (40001 == result.error) {
                            $scope.state.msgFalse = 'settings.usbStorageFailed1';
                        }
                        if (40010 == result.error) {
                            $scope.state.msgFalse = 'settings.usbStorageFailed2';
                        }
                    }
                })
            }

        };
        /**
         * @method 下载备份，多选
         * @author 李莉红
         * */
        $scope.clickDownloadCheckbox = function (item, e) {
            if (e.currentTarget.firstElementChild.checked == true) {
                e.currentTarget.lastElementChild.firstElementChild.style.display = "block";
            } else {
                e.currentTarget.lastElementChild.firstElementChild.style.display = "none";
            }
            var tempList = [];
            var list = document.getElementsByClassName("download_backup_span");
            for (var i = 0; i < list.length; i++) {
                if (list[i].style.display == "block") {
                    tempList.push(list[i].value);
                }
            }
            if (tempList.length > 0) {
                $scope.disableDownload = false;
            } else {
                $scope.disableDownload = true;
            }
        };
        /**
         * @method 删除备份，多选
         * @author 李莉红
         * */
        $scope.clickCheckbox = function (item, e) {
            if (e.currentTarget.firstElementChild.checked == true) {
                e.currentTarget.lastElementChild.firstElementChild.style.display = "block";
            } else {
                e.currentTarget.lastElementChild.firstElementChild.style.display = "none";
            }
            var tempList = [];
            var list = document.getElementsByClassName("delete_backup_span");
            for (var i = 0; i < list.length; i++) {
                if (list[i].style.display == "block") {
                    tempList.push(list[i].value);
                }
            }
            if (tempList.length > 0) {
                $scope.disableDelete = false;
            } else {
                $scope.disableDelete = true;
            }
        };
        /**
         * @method 从数据库删除备份
         * @author 李莉红
         * */
        $scope.deleteBackup = function () {
            var deleteBackupList = [];
            var data = {};
            //多选的数组
            var list = document.getElementsByClassName("delete_backup");
            for (var i = 0; i < list.length; i++) {
                if (list[i].checked == true) {
                    deleteBackupList.push(list[i].value);
                }
            }
            OrganizationService.deleteBackup(flag, deleteBackupList, function (result) {
                if (result.success) {
                    $scope.state.delete.processing = false;
                    $scope.state.delete.isSuccess = true;
                    data.flag = flag;
                    data.type = "success";
                    $uibModalInstance.close(data);
                } else {
                    $scope.state.delete.processing = false;
                    $scope.state.delete.isError = true;
                    $scope.state.msgFalse = 'settings.db.deleteBackupFailed';
                    data.flag = flag;
                    data.type = "failed";
                    $uibModalInstance.close(data);
                }
            })
        };
        $scope.cleanUSBstorage = function () {
            $scope.state.usbStorage.processing = false;
            $scope.state.usbStorage.isError = false;
            $scope.state.download.processing = false;
            $scope.state.download.isError = false;
            $scope.state.download.isSuccess = false;
        };
        // setTimeout(function () {
        //     if(document.getElementById("db_download")){
        //         var parent = document.getElementById("db_download").parentNode.parentNode;
        //         addClass(parent, 'clearfix');
        //     }else{
        //         var parent = document.getElementById("delete_backup").parentNode.parentNode;
        //         addClass(parent, 'clearfix');
        //     }
        // }, 100);
        // function hasClass(elem, cls) {
        //     cls = cls || '';
        //     if (cls.replace(/\s/g, '').length == 0) return false; //当cls没有参数时，返回false
        //     return new RegExp(' ' + cls + ' ').test(' ' + elem.className + ' ');
        // }
        //
        // function addClass(ele, cls) {
        //     if (!hasClass(ele, cls)) {
        //         ele.className = ele.className == '' ? cls : ele.className + ' ' + cls;
        //     }
        // }
    });

});