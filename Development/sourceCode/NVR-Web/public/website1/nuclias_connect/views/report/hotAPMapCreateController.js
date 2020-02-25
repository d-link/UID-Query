/**
 * Created by zhiyuan on 2018/5/18.
 */
define(["app", "canvasContainer",], function (app) {
    app.register.controller('hotAPMapCreateController', function ($scope, $uibModalInstance, hotAPMap, NetworkService, InventoryService, OrganizationService, Upload, TS) {
        "use strict";

        $scope.nameRepeat = false;
        $scope.showPanel = false;
        $scope.mapFile = null;
        $scope.mapTempFile = null;
        $scope.hotAPMap = {};
        $scope.title = TS.ts('report.hotAPTitleCreate');
        if (hotAPMap.mapPath) {
            $scope.hotAPMap = angular.copy(hotAPMap);
            $scope.title = TS.ts('report.hotAPTitleEdit');
        }

        var CanvasContainer = require("canvasContainer");

        var canvasContainer;
        setTimeout(function () {
            var canvas = document.getElementById("canvas");
            var context = canvas.getContext("2d");
            canvasContainer = new CanvasContainer(canvas, context);
            canvasContainer.addMouseHandlers();
            if (hotAPMap.mapPath) {
                var img = new Image();
                img.onload = function (e) {
                    $scope.mapImage = this;
                    canvasContainer.initialImageArea($scope.mapImage);
                    refreshDrawDevices();
                    $scope.$apply();
                };
                img.src = hotAPMap.mapPath;
            }

            var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll"
                : "mousewheel"; // FF doesn't recognize mousewheel as of FF3.x
            if (canvas.attachEvent) // if IE (and Opera depending on user setting)
                canvas.attachEvent("on" + mousewheelevt, function (e) {
                    e.preventDefault();
                    displaywheel(e);
                });
            else if (canvas.addEventListener) // WC3 browsers
                canvas.addEventListener(mousewheelevt, function (e) {
                    e.preventDefault();
                    displaywheel(e);
                }, false);

            function displaywheel(e) {
                var evt = window.event || e;
                var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta;
                if (delta > 0) {
                    $scope.bigger();
                } else {
                    $scope.smaller();
                }
            }
        }, 200);
        loadDeviceTree();

        function loadDeviceTree() {

            if ($scope.hotAPMap && $scope.hotAPMap.devices) {
                for (var i = 0; i < $scope.hotAPMap.devices.length; i++) {
                    if ($scope.hotAPMap.devices[i].isDelete) {
                        $scope.hotAPMap.devices[i].check = true;
                        $scope.hotAPMap.showDelete = true;
                        $scope.hotAPMap.open = true;
                    }
                }
            }

            NetworkService.listShortNetworks(function (result) {
                if (result.success) {
                    var sites = result.data;

                    if (sites.length > 0) {
                        sites[0].open = true;
                        if (sites[0].networks.length > 0) {
                            sites[0].networks[0].open = true;
                        }
                        for (var i = 0; i < sites.length; i++) {
                            for (var j = 0; j < sites[i].networks.length; j++) {
                                var network = sites[i].networks[j];
                                (function (network) {
                                    InventoryService.listManagedDevicesByNetwork(network, function (result) {
                                        network.devices = result.data;
                                        if (network.devices.length > 0) network.open = true;
                                        for (var k = 0; k < network.devices.length; k++) {
                                            var device = network.devices[k];

                                            (function (device) {
                                                var find;
                                                if (hotAPMap && hotAPMap.devices) {
                                                    find = _.find(hotAPMap.devices, function (item) {
                                                        return item._id == device._id;
                                                    });
                                                }
                                                if (find) {
                                                    network.devices[k].check = true;
                                                    network.devices[k].x = find.x;
                                                    network.devices[k].y = find.y;
                                                }
                                            })(device);
                                        }
                                        refreshDrawDevices();
                                    })
                                })(network);
                            }
                        }
                    }

                    $scope.allSiteNetworks = sites;
                }
            })
        }

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
        $scope.saveMap = function () {
            $scope.mapFile = $scope.mapTempFile;
            if ($scope.mapFile && $scope.mapFile.size > 1024 * 1024 * 10) {
                $scope.maxSizeErr = 1;
                return;
            }

            if (!$scope.mapImage) {
                return;
            }
            if ($scope.mapFile) {
                var fType = $scope.mapFile.name.substring($scope.mapFile.name.lastIndexOf("."),
                    $scope.mapFile.name.length).toLowerCase();
                if (fType != ".png" && fType != ".jpg" && fType != ".jpeg") {
                    $scope.typeErr = 1;
                    return;
                }
            }
            var devices = [];
            if (canvasContainer.devices) {
                for (var i = 0; i < canvasContainer.devices.length; i++) {
                    devices.push({
                        _id: canvasContainer.devices[i]._id,
                        ip: canvasContainer.devices[i].ip,
                        name: canvasContainer.devices[i].name,
                        apMACAddr: canvasContainer.devices[i].mac,
                        x: canvasContainer.devices[i].x,
                        y: canvasContainer.devices[i].y
                    });
                }
            }
            var params = {
                url: base_url + '/org/hotAP/save',
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                data: {
                    _id: $scope.hotAPMap._id,
                    // devices: devices,
                    mapName: $scope.hotAPMap.mapName,
                    rate: canvasContainer.rate,
                    imagearea: canvasContainer.imagearea,
                    file: $scope.mapFile
                }

            };
            Upload.upload(params).then(function (result) {
                if (result.data.success) {
                    OrganizationService.saveHotApDevices(result.data.data, devices, function () {
                        $uibModalInstance.close(result.data.data);
                    });
                } else {
                    if (result.data.error == 1) {
                        $scope.nameRepeat = true;
                        $scope.mapnameBlur = true;
                    }
                }
            });
        }
        $scope.$watch('mapFile', function (file) {
            $scope.maxSizeErr = 0;
            $scope.typeErr = 0;
            if (!file) return;
            $scope.mapTempFile = file;
            if (file.size > 1024 * 1024 * 10) {
                $scope.maxSizeErr = 1;
            }

            var fType = file.name.substring(file.name.lastIndexOf("."),
                file.name.length).toLowerCase();
            if (fType != ".png" && fType != ".jpg" && fType != ".jpeg") {
                $scope.typeErr = 1;
            }

            var reader = new FileReader();
            reader.onload = function (event) {
                var img = new Image();
                img.onload = function (e) {
                    $scope.mapImage = this;
                    canvasContainer.initialImageArea($scope.mapImage);
                    canvasContainer.refresh();
                    $scope.$apply();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });

        $scope.changeHotApPic = function () {
            var fileSelector = document.getElementById("choose");
            fileSelector.click();
        };

        $scope.siteCheckChange = function (site) {
            if (site.networks) {
                for (var i = 0; i < site.networks.length; i++) {
                    site.networks[i].check = site.check;
                    $scope.networkCheckChange(site.networks[i]);
                }
                refreshDrawDevices();
            }
        }
        $scope.delCheckChange = function () {
            if ($scope.hotAPMap && $scope.hotAPMap.devices) {
                for (var i = 0; i < $scope.hotAPMap.devices.length; i++) {
                    $scope.hotAPMap.devices[i].check = $scope.hotAPMap.check;
                }
                refreshDrawDevices();
            }
        }
        $scope.networkCheckChange = function (network) {
            if (network.devices) {
                for (var i = 0; i < network.devices.length; i++) {
                    network.devices[i].check = network.check;
                }
                refreshDrawDevices();
            }
        }
        $scope.deviceCheckChange = function (device) {
            refreshDrawDevices();
        }
        $scope.deviceCount = 0;

        function refreshDrawDevices() {
            if (!canvasContainer) return;
            if (!$scope.allSiteNetworks) return;
            var devices = [];
            for (var i = 0; i < $scope.allSiteNetworks.length; i++) {
                var site = $scope.allSiteNetworks[i];
                for (var j = 0; j < site.networks.length; j++) {
                    var network = site.networks[j];
                    if (network.devices) {
                        for (var k = 0; k < network.devices.length; k++) {
                            if (network.devices[k].check) {
                                devices.push(network.devices[k]);
                            }
                        }
                        //network全选
                        const index = network.devices.filter(device => device.check == true);
                        if (index.length > 0 && index.length == network.devices.length) {
                            network.check = true;
                        }
                    }
                    //所有的network的check值为false，则没有勾选site，去掉勾选site的值，在页面操作
                    //site全选
                    const index1 = site.networks.filter(net => net.check == true);
                    if (index1.length > 0 && index1.length == site.networks.length) {
                        site.check = true;
                    }
                }
            }

            //$scope.otherDevices = [];
            if ($scope.hotAPMap && $scope.hotAPMap.devices) {
                for (var i = 0; i < $scope.hotAPMap.devices.length; i++) {
                    if ($scope.hotAPMap.devices[i].isDelete && $scope.hotAPMap.devices[i].check) {
                        devices.push($scope.hotAPMap.devices[i]);
                    }
                }
            }

            $scope.deviceCount = devices.length;
            canvasContainer.initialDevices(devices);
            canvasContainer.refresh();
        }

        $scope.bigger = function () {
            canvasContainer.zoomIn();
        }
        $scope.reset = function () {
            canvasContainer.zoomReset();
        }
        $scope.smaller = function () {
            canvasContainer.zoomOut();
        }
        $scope.changeShowpanel = function () {
            $scope.showPanel = !$scope.showPanel;
        }

    });
});
