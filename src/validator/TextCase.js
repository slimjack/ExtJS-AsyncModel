//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.TextCase', {
    implement: 'Ext.ux.validator.ISyncValidator',
    extend: 'Ext.data.validator.Validator',
    alias: 'data.validator.textcase',
    type: 'textcase',

    config: {
        validateTrimmed: true,
        upperCaseMessageTpl: AsyncModelTexts.onlyUpperCaseAllowedTpl,
        lowerCaseMessageTpl: AsyncModelTexts.onlyLowerCaseAllowedTpl,
        mixedCaseMessageTpl: AsyncModelTexts.onlyMixedCaseAllowedTpl
    },

    validResult: function () {
        return {
            error: '',
            info: ''
        };
    },

    errorResult: function (error) {
        return {
            error: error,
            info: ''
        };
    },

    applyUpperCaseMessageTpl: function (template) {
        return new Ext.XTemplate(template);
    },

    applyLowerCaseMessageTpl: function (template) {
        return new Ext.XTemplate(template);
    },

    applyMixedCaseMessageTpl: function (template) {
        return new Ext.XTemplate(template);
    },

    validate: function (fieldValue, modelRecord) {
        var me = this;
        var errorMessage = me.validateSync(fieldValue, me.fieldName, modelRecord, {}).error;
        return errorMessage || true;
    },

    validateSync: function (fieldValue, fieldName, modelRecord, options) {
        var me = this;

        var textCase = modelRecord.getMetaValue(fieldName, 'textCase');
        if (!textCase) {
            return me.validResult;
        }

        fieldValue = me.getValidateTrimmed() ? Ext.String.trim(fieldValue) : fieldValue;
        if (!fieldValue) {
            return me.validResult;
        }

        switch (textCase) {
            case TextCasings.upper:
                return fieldValue === fieldValue.toUpperCase()
                    ? me.validResult
                    : me.errorResult(me.getUpperCaseMessageTpl.apply(me.getValidationContext(modelRecord, fieldName)))
            case TextCasings.lower:
                return fieldValue === fieldValue.toLowerCase()
                    ? me.validResult
                    : me.errorResult(me.getLowerCaseMessageTpl.apply(me.getValidationContext(modelRecord, fieldName)))
            case TextCasings.mixed:
                return fieldValue !== fieldValue.toLowerCase() && fieldValue !== fieldValue.toUpperCase()
                    ? me.validResult
                    : me.errorResult(me.getMixedCaseMessageTpl.apply(me.getValidationContext(modelRecord, fieldName)))
            default: throw "Unsupported text case mode: " + textCase;
        }
    }
});

Ext.define('Ext.ux.data.validator.TextCaseValidatorProvider', {
    extend: 'Ext.ux.data.validator.ValidatorProvider',
    associatedFieldTypes: ['string'],
    shareValidatorInstance: true,

    createValidatorInstance: function (fieldDescriptor) {
        return new Ext.ux.data.validator.TextCase();
    }
});