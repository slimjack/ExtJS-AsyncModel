//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.FormFieldReadOnlyBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',
    metaDataName: 'readOnly',

    onComponentBound: function (formField, model, modelFieldName) {
        this.applyPlugin(formField, 'readonlylatching');
    },
    
    applyMetaData: function (control, metaValue, model, fieldName) {
        if (metaValue) {
            control.latchReadOnly();
        } else {
            control.unlatchReadOnly();
        }
    }
});