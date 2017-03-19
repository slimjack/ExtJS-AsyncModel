//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.StringFieldMetaModel', {
    extend: 'Ext.ux.data.FieldMetaModel',
    fields: [
        { name: 'requireLetter', type: 'bool', defaultValue: false },
        { name: 'requireDigit', type: 'bool', defaultValue: false },
        { name: 'textCase', type: 'string', defaultValue: null },
        { name: 'maskRe', type: 'auto', defaultValue: null },
        { name: 'maxLength', type: 'integer', allowNull: true, defaultValue: null },
        { name: 'minLength', type: 'integer', allowNull: true, defaultValue: null },
        { name: 'displaySecured', type: 'bool', defaultValue: false }
    ]
});
Ext.ux.data.MetaModel.assignDefaultFieldMetaModel('Ext.ux.data.StringFieldMetaModel', 'string');
