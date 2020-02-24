/**
 * Created by lizhimin on 2016/2/25.
 */
define(['globalGridOptions'], {
        InventoryGrid: {
            paginationPageSizes: [10,15,20],
            paginationPageSize: 15,
          // useExternalPagination: true,
            enableGridMenu: true,
            enableRowSelection: true,
            enableSelectAll: true,
            enableColumnResizing: true,
            selectionRowHeaderWidth: 40,
            multiSelect: true,
            rowHeight:40,
            paginationTemplate: './views/templates/gridBurster.html',
         /*   exporterCsvFilename: 'Inventory-Managed.csv',
            exporterPdfDefaultStyle: {fontSize: 9},
            exporterPdfTableStyle: {margin: [30, 30, 30, 30]},
            exporterPdfTableHeaderStyle: {fontSize: 10, bold: true, italics: true, color: 'red'},
            exporterPdfHeader: {text: "My Header", style: 'headerStyle'},*/
            // exporterPdfFooter: function (currentPage, pageCount) {
            //     return {text: currentPage.toString() + ' of ' + pageCount.toString(), style: 'footerStyle'};
            // },
          /*  exporterPdfCustomFormatter: function (docDefinition) {
                docDefinition.styles.headerStyle = {fontSize: 22, bold: true};
                docDefinition.styles.footerStyle = {fontSize: 10, bold: true};
                return docDefinition;
            },
            exporterPdfOrientation: 'portrait',
            exporterPdfPageSize: 'LETTER',
            exporterPdfMaxGridWidth: 500*/
        }
});