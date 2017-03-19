//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.field.Email', {
    extend: 'Ext.data.field.String',
    alias: 'data.field.email',
    isEmailField: true
});
Ext.ux.data.MetaModel.assignDefaultFieldMetaModel('Ext.ux.data.StringFieldMetaModel', 'email');
