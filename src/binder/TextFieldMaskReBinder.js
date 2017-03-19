//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.TextFieldMaskReBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',
    metaDataName: 'maskRe',

    applyMetaData: function (formField, metaValue, model, fieldName) {
        var me = this;
        if (metaValue !== null && metaValue !== undefined) {
            formField.setMaskRe(metaValue);
        }
    },

    isApplicable: function (control) {
        var me = this;
        return me.callParent(arguments) && (control instanceof Ext.form.field.Text);
    }
});