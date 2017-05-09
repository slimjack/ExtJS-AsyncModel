//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.MaskRe', {
    extend: 'Ext.ux.data.validator.SyncValidator',
    alias: 'data.validator.maskre',
    type: 'maskre',

    config: {
        validateTrimmed: true,
        errorMessageTpl: AsyncModelTexts.forbiddenSymbols
    },

    isValid: function (fieldValue, fieldName, modelRecord, options) {
        var me = this;
        var maskRe = modelRecord.getMetaValue(fieldName, 'maskRe');
        if (!maskRe) {
            return true;
        }
        fieldValue = me.getValidateTrimmed() ? Ext.String.trim(fieldValue) : fieldValue;
        if (fieldValue) {
            for (var i = 0; i < fieldValue.length; i++) {
                if (!maskRe.test(fieldValue[i])) {
                    return false;
                }
            }
        }
        return true;
    }
});

Ext.define('Ext.ux.data.validator.MaskReValidatorProvider', {
    extend: 'Ext.ux.data.validator.ValidatorProvider',
    associatedFieldTypes: ['string'],
    shareValidatorInstance: true,

    createValidatorInstance: function (fieldDescriptor) {
        return new Ext.ux.data.validator.MaskRe();
    }
});