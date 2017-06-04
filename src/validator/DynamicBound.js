//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.DynamicBound', {
    implement: 'Ext.ux.validator.ISyncValidator',

    extend: 'Ext.data.validator.Validator',
    alias: 'data.validator.dynamicbound',
    type: 'dynamicbound',

    minBoundMetadataName: 'min',
    maxBoundMetadataName: 'max',

    config: {
        minOnlyMessageTpl: AsyncModelTexts.minBoundViolatedTpl,
        maxOnlyMessageTpl: AsyncModelTexts.maxBoundViolatedTpl,
        bothMessageTpl: AsyncModelTexts.minMaxBoundViolatedTpl
    },

    applyMinOnlyMessageTpl: function (template) {
        return new Ext.XTemplate(template);
    },

    applyMaxOnlyMessageTpl: function (template) {
        return new Ext.XTemplate(template);
    },

    applyBothMessageTpl: function (template) {
        return new Ext.XTemplate(template);
    },

    validate: function (fieldValue, modelRecord) {
        var me = this;
        var errorMessage = me.validateSync(fieldValue, me.fieldName, modelRecord, {}).error;
        return errorMessage || true;
    },

    validateSync: function (fieldValue, fieldName, record, options) {
        var me = this;
        var errorMessage = '';

        var valueToValidate = me.getValueToValidate(fieldValue);
        if (Ext.isNumber(valueToValidate) || valueToValidate === null) {
            var validationContext = me.getValidationContext(record, fieldName);
            if (validationContext.hasMinBound && validationContext.hasMaxBound) {
                if (valueToValidate === null
                    || valueToValidate < validationContext.min
                    || valueToValidate > validationContext.max) {
                    errorMessage = me.getBothMessageTpl().apply(validationContext);
                }
            } else if (validationContext.hasMinBound) {
                if (valueToValidate === null || valueToValidate < validationContext.min) {
                    errorMessage = me.getMinOnlyMessageTpl().apply(validationContext);
                }
            } else if (validationContext.hasMaxBound) {
                if (valueToValidate === null || valueToValidate > validationContext.max) {
                    errorMessage = me.getMaxOnlyMessageTpl().apply(validationContext);
                }
            }
        }

        return {
            error: errorMessage,
            info: ''
        };
    },

    getValueToValidate: Ext.identityFn,

    getValidationContext: function (record, fieldName) {
        var me = this;
        var min = record.getMetaValue(fieldName, me.minBoundMetadataName);
        var max = record.getMetaValue(fieldName, me.maxBoundMetadataName);
        return ValidationContext.create(record, fieldName, {
            min: min,
            max: max,
            hasMinBound: Ext.isNumber(min),
            hasMaxBound: Ext.isNumber(max)
        });
    }
});

Ext.define('Ext.ux.data.validator.DynamicBoundValidatorProvider', {
    extend: 'Ext.ux.data.validator.ValidatorProvider',
    associatedFieldProperties: ['min', 'max'],
    shareValidatorInstance: true,

    createValidatorInstance: function (fieldDescriptor) {
        return new Ext.ux.data.validator.DynamicBound();
    }
});