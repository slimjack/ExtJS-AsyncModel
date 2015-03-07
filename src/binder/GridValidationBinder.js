//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.GridValidationBinder', {
    implement: 'IGridMetaDataBinder',
    invalidCellCls: 'invalidGridCell',
    
    onInit: function (grid, plugin) { },
    onDestroy: function (grid, plugin) { },

    onRender: function(metadata, record, rowIndex, colIndex, store, view) {
        var dataIndex = metadata.column.dataIndex;
        var validationErrorMessages = record.getMeta(dataIndex, 'validationErrorMessages');
        if (validationErrorMessages.length) {
            metadata.tdCls += ' ' + this.invalidCellCls;
            metadata.tdAttr = 'data-errorqtip="' + validationErrorMessages.join('</br>') + '"';
        } else {
            metadata.tdAttr = 'data-errorqtip=""';
        }
    }
});