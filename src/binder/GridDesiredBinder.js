//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.GridDesiredBinder', {
    implement: 'IGridMetaDataBinder',
    desiredCellCls: 'desiredGridCell',

    onInit: function (grid, plugin) { },
    onDestroy: function (grid, plugin) { },

    onRender: function (metadata, record, rowIndex, colIndex, store, view) {
        var dataIndex = metadata.column.dataIndex;

        if (record.getMetaValue(dataIndex, 'desired') && !record.getMetaValue(dataIndex, 'readOnly')) {
            metadata.tdCls += ' ' + this.desiredCellCls;
        }
    }

});
