//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.TextFieldMaxLengthBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',
    metaDataName: 'maxLength',

    applyMetaData: function (formField, metaValue, model, fieldName) {
        var me = this;
        if (metaValue !== null && metaValue !== undefined) {
            formField.setMaxLength(metaValue);
        }
    },

    isApplicable: function (control) {
        var me = this;
        return me.callParent(arguments) && (control instanceof Ext.form.field.Text);
    }
});
