//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.FieldMetaModel', {
    extend: 'Ext.data.Model',
    fields: [
        { name: 'storeUnique', type: 'bool', defaultValue: false },
        { name: 'readOnly', type: 'bool', defaultValue: false },
        { name: 'displayName', type: 'string', defaultValue: '' },
        { name: 'required', type: 'bool', defaultValue: false },
        { name: 'desired', type: 'bool', defaultValue: false },
        { name: 'validationErrorMessages', type: 'auto', defaultValue: [] },
        { name: 'validationInfoMessages', type: 'auto', defaultValue: [] }
    ]
});