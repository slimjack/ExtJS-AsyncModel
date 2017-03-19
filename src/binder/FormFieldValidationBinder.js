//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.FormFieldValidationBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',
    metaDataName: 'validationErrorMessages',

    onComponentBound: function (formField, model, modelFieldName) {
        this.applyPlugin(formField, 'externalvalidating');
    },

    applyMetaData: function (control, metaValue, model, fieldName) {
        control.setExternalErrors('modelValidation', metaValue);
    }
});
