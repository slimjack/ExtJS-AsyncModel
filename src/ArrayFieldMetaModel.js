//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.ArrayFieldMetaModel', {
    extend: 'Ext.ux.data.FieldMetaModel',
    fields: [
        { name: 'maxLength', type: 'integer', allowNull: true, defaultValue: null },
        { name: 'minLength', type: 'integer', allowNull: true, defaultValue: null }
    ]
});
Ext.ux.data.MetaModel.assignDefaultFieldMetaModel('Ext.ux.data.ArrayFieldMetaModel', 'array');
