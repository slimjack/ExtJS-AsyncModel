//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.Required', {
    extend: 'Ext.ux.data.validator.SyncValidator',
    alias: 'data.validator.required',
    type: 'required',

    config: {
        errorMessageTpl: AsyncModelTexts.requiredFieldMessageTpl,
        trimStrings: true
    },

    isValid: function (fieldValue, fieldName, modelRecord, options) {
        var me = this;
        var required = modelRecord.getMetaValue(fieldName, 'required');
        if (!required || !options.validatePresence) {
            return true;
        }
        return !me.isEmpty(fieldValue);
    },

    isEmpty: function (fieldValue) {
        var me = this;
        if (fieldValue === false) {
            //for boolean type only null is treated as empty
            return false;
        }
        if (!fieldValue) {
            return true;
        }
        if (fieldValue instanceof Ext.data.Store) {
            return !fieldValue.count();
        }
        if (Ext.isString(fieldValue)) {
            if (me.getTrimStrings()) {
                fieldValue = Ext.String.trim(fieldValue);
            }
            return !fieldValue.length;
        }
        if (Ext.isArray(fieldValue)) {
            return !fieldValue.length;
        }

        return false;
    }
});

Ext.define('Ext.ux.data.validator.RequiredValidatorProvider', {
    extend: 'Ext.ux.data.validator.ValidatorProvider',
    shareValidatorInstance: true,

    createValidatorInstance: function (fieldDescriptor) {
        return new Ext.ux.data.validator.Required();
    }
});