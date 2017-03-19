//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.FormFieldDisplayNameBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',
    metaDataName: 'displayName',

    applyMetaData: function (control, metaValue, model, fieldName) {
        if (Ext.isString(metaValue)) {
            control.setFieldLabel(metaValue);
        }
    }
});
