//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.TextFieldCasingBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',
    metaDataName: 'textCase',

    onComponentBound: function (formField, model, modelFieldName) {
        this.applyPlugin(formField, 'fieldcasing');
    },

    applyMetaData: function (formField, metaValue, model, fieldName) {
        var me = this;
        formField.setCasing(metaValue);
    },

    isApplicable: function (control) {
        return this.callParent(arguments) && (control instanceof Ext.form.field.Text);
    }
});
