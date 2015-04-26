Ext.define('Ext.ux.data.FieldMetaModel', {
    extend: 'Ext.data.Model',
    fields: [
        { name: 'readOnly', type: 'bool', defaultValue: false },
        { name: 'required', type: 'bool', defaultValue: false },
        { name: 'validationErrorMessages', type: 'auto', defaultValue: [] },
        { name: 'validationInfoMessages', type: 'auto', defaultValue: [] }
    ]
});
