Ext.define('Ext.ux.binder.GridValidationBinder', {
    implement: 'IGridMetaDataBinder',
    invalidCellCls: 'invalidGridCell',
    
    onInit: function (grid, plugin) { },
    onDestroy: function (grid, plugin) { },

    onRender: function(metadata, record, rowIndex, colIndex, store, view) {
        var dataIndex = metadata.column.dataIndex;
        var validationErrorMessage = record.getMeta(dataIndex, 'validationErrorMessage');
        if (validationErrorMessage) {
            metadata.tdCls += ' ' + this.invalidCellCls;
            metadata.tdAttr = 'data-errorqtip="' + validationErrorMessage + '"';
        } else {
            metadata.tdAttr = 'data-errorqtip=""';
        }
    }
});