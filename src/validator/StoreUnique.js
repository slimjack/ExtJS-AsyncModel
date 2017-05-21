//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.StoreUnique', {
    extend: 'Ext.ux.data.validator.SyncValidator',
    alias: 'data.validator.storeunique',
    type: 'storeunique',

    config: {
        errorMessageTpl: AsyncModelTexts.storeUniqueTpl,
        trimStrings: true
    },

    isValid: function (fieldValue, fieldName, modelRecord, options) {
        var me = this;
        if (Ext.isString(fieldValue) && me.getTrimStrings()) {
            fieldValue = Ext.String.trim(fieldValue);
        }

        if (Ext.isEmpty(fieldValue) || !modelRecord.store) {
            return true;
        }

        var duplicateIndex = modelRecord.store.findBy(function (r) {
            var anotherValue = r.get(fieldName);
            if (Ext.isString(anotherValue) && modelRecord.store) {
                anotherValue = Ext.String.trim(anotherValue);
            }
            return r !== modelRecord && anotherValue === fieldValue;
        });

        return duplicateIndex === -1;
    }
});

Ext.define('Ext.ux.data.validator.StoreUniqueValidatorProvider', {
    extend: 'Ext.ux.data.validator.ValidatorProvider',
    shareValidatorInstance: true,
    associatedFieldProperties: ['storeUnique'],

    createValidatorInstance: function (fieldDescriptor) {
        return new Ext.ux.data.validator.Required();
    }
});