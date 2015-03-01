//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.plugin.ReadOnlyLatching', {
    alias: 'plugin.readonlylatching',
    extend: 'Ext.AbstractPlugin',

    init: function (formField) {
        var me = this;
        var readOnlyLatched = false;
        var originalReadOnlyState = false;
        if (!formField.isFormField) {
            Ext.Error.raise('ReadOnlyLatching plugin may be applied only to form fields');
        }
        Ext.override(formField, {
            setReadOnly: function (readOnly) {
                if (!readOnlyLatched) {
                    this.callParent(arguments);
                }
                originalReadOnlyState = readOnly;
            },

            latchReadOnly: function () {
                var temReadonly = originalReadOnlyState;
                formField.setReadOnly(true);
                readOnlyLatched = true;
                originalReadOnlyState = temReadonly;
            },

            unlatchReadOnly: function () {
                readOnlyLatched = false;
                formField.setReadOnly(originalReadOnlyState);
            }
        });
    }
});