//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.plugin.GridMetaDataBinding', {
    alias: 'plugin.gridmetadatabinding',
    extend: 'Ext.AbstractPlugin',
    inject: {
        gridMetaDataBinders: 'IGridMetaDataBinder[]'
    },

    mixins: [
        'Ext.util.Observable'
    ],

    init: function (grid) {
        var me = this;
        me._owner = grid;
        me.mixins.observable.constructor.call(me);
        me.callParent(arguments);
        me.initBinders();
    },

    initBinders: function () {
        var me = this;
        if (!me._bindersInitialized) {
            me.overrideColumnRenderers();
            me.overrideGridViewOnUpdate(me._owner);
            me.mon(me._owner, {
                reconfigure: {
                    fn: me.onReconfigure,
                    scope: me
                }
            });
            Ext.Array.each(me.gridMetaDataBinders, function (binder) {
                binder.onInit(me._owner, me);
            });
            me._bindersInitialized = true;
        }
    },

    destroy: function () {
        var me = this;
        if (me._bindersInitialized) {
            Ext.Array.each(me.gridMetaDataBinders, function (binder) {
                binder.onDestroy(me._owner, me);
            });
        }
    },

    getMetaDataMap: function (grid) {
        var columns = grid.columns;
        var metaDataMap = null;
        Ext.each(columns, function (column) {
            if (column.metaDataIndex) {
                metaDataMap = metaDataMap || {};
                if (!metaDataMap[column.metaDataIndex]) {
                    metaDataMap[column.metaDataIndex] = [];
                }
                metaDataMap[column.metaDataIndex].push(column.dataIndex);
            }
        });
        return metaDataMap;
    },

    onReconfigure: function (grid, store, columns, oldStore, oldColumns, eOpts) {
        var me = this;
        if (columns) {
            me.overrideColumnRenderers();
        }
    },

    overrideGridViewOnUpdate: function (grid) {
        var me = this;
        var metaDataMap = me.getMetaDataMap(grid);
        var gridView = grid.getView();
        var originalOnUpdate = gridView.onUpdate;
        if (metaDataMap) {
            gridView.onUpdate = function (store, record, operation, changedFieldNames) {
                if (operation !== Ext.data.Model.VALIDCHANGE) {
                    if (operation === Ext.data.Model.METACHANGE) {
                        arguments[3] = me.updateChangedFieldNames(changedFieldNames, metaDataMap);
                    }
                    originalOnUpdate.apply(gridView, arguments);
                }
            };
        } else {
            gridView.onUpdate = function (store, record, operation) {
                if (operation !== Ext.data.Model.VALIDCHANGE) {
                    originalOnUpdate.apply(gridView, arguments);
                }
            };
        }
    },

    updateChangedFieldNames: function (changedFieldNames, metaDataMap) {
        var result = Ext.Array.clone(changedFieldNames);
        Ext.each(changedFieldNames, function (fieldName) {
            var mappedDataIndexes = metaDataMap[fieldName];
            if (mappedDataIndexes) {
                result = result.concat(mappedDataIndexes);
            }
        });
        return result;
    },

    overrideColumnRenderers: function () {
        var me = this;
        var columns = me._owner.columns;
        Ext.each(columns, function (column) {
            var oldRenderer = column.renderer;
            var colRenderer;
            if (column.xtype === 'rownumberer') {
                return;
            }
            if (oldRenderer) {
                colRenderer = function (value, metadata, record, rowIndex, colIndex, store, view) {
                    value = me.renderer(value, metadata, record, rowIndex, colIndex, store, view);
                    value = oldRenderer.apply(this, [value, metadata, record, rowIndex, colIndex, store, view]);
                    return value;
                };
            } else {
                colRenderer = Ext.bind(me.renderer, me);
            }

            Ext.apply(column, {
                renderer: colRenderer,
                hasCustomRenderer: true
            });
        });
    },

    renderer: function (value, metadata, record, rowIndex, colIndex, store, view) {
        var me = this;
        var dataIndex = metadata.column.dataIndex;

        if (dataIndex) {
            Ext.Array.each(me.gridMetaDataBinders, function (binder) {
                binder.onRender(metadata, record, rowIndex, colIndex, store, view);
            });
        }
        return value;
    }
});