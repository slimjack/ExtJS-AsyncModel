//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.plugin.ExternalValidating', {
    alias: 'plugin.externalvalidating',
    extend: 'Ext.AbstractPlugin',

    init: function (formField) {
        var me = this;
        me._externalErrors = {};
        if (!formField.isFormField) {
            Ext.Error.raise('ExternalValidating plugin may be applied only to form fields');
        }
        Ext.override(formField, {
            getErrors: function() {
                var errors = this.callParent(arguments);
                Ext.Object.each(me._externalErrors, function (sourceName, errorMessage) {
                    if (errorMessage) {
                        Ext.Array.include(errors, errorMessage);
                    }
                });
                return errors;
            },

            setExternalError: function (sourceName, errorMessage) {
                me._externalErrors[sourceName] = errorMessage;
                formField.validate();
            },

            setExternalErrors: function (errors) {
                Ext.apply(me._externalErrors, errors);
                formField.validate();
            }
        });
    }
});