Ext.define('Ext.ux.binder.GridReadOnlyBinder', {
    implement: 'IGridMetaDataBinder',

    onInit: function(grid, plugin) {
        var me = this;
        grid.on('beforeedit', me.onBeforeCellEdit);
    },

    onDestroy: function(grid, plugin) {
        var me = this;
        grid.un('beforeedit', me.onBeforeCellEdit);
    },

    onRender: function(metadata, record, rowIndex, colIndex, store, view) {},

    onBeforeCellEdit: function (plugin, context) {
        var isEditable = !context.record.getMeta(context.column.dataIndex, 'readOnly');
        return isEditable;
    }

});