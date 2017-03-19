//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.Required', {
    extend: 'Ext.ux.data.validator.ParametrizedValidator',
    alias: 'data.validator.required',
    type: 'required',
    config: {
        trimStrings: true,
        errorMessageTpl: AsyncModelTexts.requiredFieldMessageTpl
    },

    getValue: function (fieldValue) {
        var me = this;
        if (fieldValue instanceof Ext.data.Store) {
            return fieldValue.count();
        }
        if (Ext.isArray(fieldValue)) {
            return fieldValue.length;
        }
        var stringified = String(fieldValue);
        if (me.getTrimStrings()) {
            stringified = Ext.String.trim(stringified);
        }
        return stringified.length;
    },

    isValid: function (fieldValue, modelRecord) {
        var me = this;
        var isValueEmpty = fieldValue === undefined
            || fieldValue === null
            || !me.getValue(fieldValue);
        return !isValueEmpty;
    },

    validateWithOptions: function (fieldValue, modelRecord, options) {
        var me = this;
        if (options.validatePresence) {
            return me.callParent(arguments);
        }
        return {
            errorMessage: '',
            infoMessage: ''
        };
    }
});