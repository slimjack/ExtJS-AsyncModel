//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.TextFieldDisplaySecuredBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',
    metaDataName: 'displaySecured',

    applyMetaData: function (formField, metaValue, model, fieldName) {
        if (formField.inputEl && formField.inputEl.dom) {
            if (metaValue === true) {
                formField.__originalInputElType = formField.inputEl.dom.type;
                formField.inputEl.dom.type = 'password';
            } else if (metaValue === false && formField.__originalInputElType && formField.inputEl.dom.type === 'password') {
                formField.inputEl.dom.type = formField.__originalInputElType;
            }
        }
    },

    isApplicable: function (control) {
        var me = this;
        return me.callParent(arguments) && (control instanceof Ext.form.field.Text);
    }
});
