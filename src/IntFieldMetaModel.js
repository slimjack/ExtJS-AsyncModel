//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.IntFieldMetaModel', {
    extend: 'Ext.ux.data.FieldMetaModel',
    fields: [
        { name: 'max', type: 'integer', allowNull: true, defaultValue: null },
        { name: 'min', type: 'integer', allowNull: true, defaultValue: null }
    ]
});
Ext.ux.data.MetaModel.assignDefaultFieldMetaModel('Ext.ux.data.IntFieldMetaModel', 'int');
Ext.ux.data.MetaModel.assignDefaultFieldMetaModel('Ext.ux.data.IntFieldMetaModel', 'integer');
