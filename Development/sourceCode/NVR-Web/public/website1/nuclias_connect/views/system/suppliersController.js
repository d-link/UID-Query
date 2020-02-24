/**
 * Created by zzy on 2018/9/11.
 */

define(["controllerModule"], function (controllers) {

    controllers.controller('suppliersController', function ($rootScope, $scope, $uibModal, $state, $http, Current, OrganizationService, $timeout, TS) {

        setHeight('set-height', ['elementFlag'], 49);
        $timeout(function () {
            setGridHeight('supplier-grid', true);
        }, 100);
        window.onresize = function () {
            setHeight('set-height', ['elementFlag'], 49);
            $timeout(function () {
                setGridHeight('about-grid', true);
            }, 100);
        };
        $scope.liveIntervals = [1, 2, 3, 4, 5];
        $scope.hasPrivilege = Current.user().role == "root admin";

        $scope.openSupplierItemModel = function (supplier) {

            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: 'supplierItem.html',
                windowClass: 'modal-usermanage',
                size: 'w600',
                resolve: {
                    supplier: function () {
                        return supplier;
                    }
                },
                controller: function ($scope, $uibModalInstance, supplier) {
                    $scope.invalidSupplier = false;
                    $scope.invalidSupplierMsg = "";
                    $scope.title = "supplierAdd";
                    $scope.iconName = "inviteUser";
                    $scope.buttonName = "add";
                    if (supplier) {
                        $scope.iconName = "edit";
                        $scope.title = "supplierEdit";
                        $scope.buttonName = "save";
                    }
                    $scope.supplier = supplier;
                    $scope.save = function () {
                        OrganizationService.saveSupplier($scope.supplier, function (result) {
                            if (!result.success) {
                                if (result.error == 1) {
                                    $scope.invalidSupplier = true;
                                    $scope.invalidSupplierMsg = $scope.supplier.year + "," + $scope.supplier.name + " has exists";
                                    return;
                                }
                            }
                            $uibModalInstance.close();
                        });

                    };
                    // 取消
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function () {
                loadSuppliers();

            }, function () {

            });
        }

        $scope.delSuppliers = function (supplier) {
            var modalInstance = $uibModal.open({
                backdrop: 'static',
                animation: true,
                keyboard: false,
                templateUrl: './views/templates/dialogConfirm.html',
                windowClass: 'modal-del',
                resolve: {
                    supplier: function () {
                        return supplier;
                    }
                },
                size: "w500",
                controller: function ($scope, $uibModalInstance, supplier) {
                    $scope.con = {
                        title: TS.ts("supplier.delTitle"),
                        content: TS.ts("supplier.delTip"),
                        type: 'common:remove'
                    };
                    $scope.ok = function () {
                        $uibModalInstance.close(supplier);
                    };
                    $scope.cancel = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            });
            modalInstance.result.then(function (supplier) {
                OrganizationService.delSupplier(supplier._id, function (result) {
                    if (result.success) {
                        loadSuppliers();
                    }
                });
            }, function () {

            });
        }

        function loadSuppliers() {
            OrganizationService.listSuppliers(function (result) {
                if (result.success) {
                    $scope.gridOptionsSupplier.data = result.data;
                }
            });
        }

        $scope.gridOptionsSupplier = {
            enableGridMenu: false,
            paginationPageSizes: [5, 10, 15],
            paginationPageSize: 10,
            paginationTemplate: './views/templates/gridBurster.html',
            columnDefs: [
                {field: 'name', enableHiding: false, minWidth: "120", displayName: TS.ts('supplier.name')},
                {
                    field: 'year', enableHiding: false,
                    minWidth: "110",
                    displayName: TS.ts('supplier.year')
                },
                {field: 'liaison', enableHiding: false, minWidth: "110", displayName: TS.ts('supplier.liaison')},
                {field: 'tel', enableHiding: false, minWidth: "110", displayName: TS.ts('supplier.tel')},
                {
                    field: 'site',  enableHiding: false,minWidth: "360", displayName: TS.ts('supplier.site'),
                    cellTemplate: '<div class="ui-grid-cell-contents"><a target="_blank" href="http://{{row.entity.site}}" rel="noopener noreferrer">{{row.entity.site}}</a></div>'
                },
                {
                    name: TS.ts('column.action'), enableHiding: false,
                    cellTemplate: '<div class="ui-grid-cell-contents"> ' +
                    '<a type="button" class="btn-grid" title="{{\'column.edit\'|translate}}"' +
                    '  ng-click="grid.appScope.openSupplierItemModel(row.entity)">' +
                    '<md-icon md-svg-icon="user:edit"></md-icon></a>' +
                    '<a type="button" class="btn-grid" title="{{\'column.delete\'|translate}}" ' +
                    '  ng-click="grid.appScope.delSuppliers(row.entity)">' +
                    '<md-icon md-svg-icon="user:remove"></md-icon></a>' +
                    '</div>',
                    minWidth: "120", maxWidth: "120", enableHiding: false, enableSorting: false,
                    visible: $scope.hasPrivilege
                }
            ]
        };

        loadSuppliers();
    })
});