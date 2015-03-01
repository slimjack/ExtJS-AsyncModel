//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.data.validator.Required', {
    extend: 'Ext.data.validator.ParametrizedValidator',
    alias: 'data.validator.required',
    type: 'required',
    config: {
        autoTrim: true,
        requiredMessage: 'This is a required field'
    },

    getValue: function (fieldValue) {
        var me = this;
        if (fieldValue instanceof Ext.data.Store) {
            return fieldValue.count();
        }
        var stringified = String(fieldValue);
        if (me.getAutoTrim()) {
            stringified = Ext.String.trim(stringified);
        }
        return stringified.length;
    },

    validate: function (fieldValue) {
        var me = this;
        if (fieldValue === undefined || fieldValue === null || !me.getValue(fieldValue)) {
            return me.getRequiredMessage();
        }
        return true;
    },

    validateWithOptions: function (fieldValue, modelRecord, options) {
        var me = this;
        if (options.validatePresence) {
            return me.callParent(arguments);
        }
        return true;
    }
});