//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.DynamicLength', {
    extend: 'Ext.ux.data.validator.DynamicBound',
    alias: 'data.validator.dynamiclength',
    type: 'dynamiclength',

    minBoundMetadataName: 'minLength',
    maxBoundMetadataName: 'maxLength',

    config: {
        minOnlyMessageTpl: AsyncModelTexts.minLengthViolatedTpl,
        maxOnlyMessageTpl: AsyncModelTexts.maxLengthViolatedTpl,
        bothMessageTpl: AsyncModelTexts.minMaxLengthViolatedTpl
    },

    getValue: function (fieldValue) {
        var me = this;
        if (fieldValue instanceof Ext.data.Store) {
            return fieldValue.count();
        }
        return fieldValue.length;
    }
});

Ext.define('Ext.ux.data.validator.DynamicLengthdValidatorProvider', {
    extend: 'Ext.ux.data.validator.ValidatorProvider',
    associatedFieldProperties: ['minLength', 'maxLength'],
    shareValidatorInstance: true,

    createValidatorInstance: function (fieldDescriptor) {
        return new Ext.ux.data.validator.DynamicLength();
    }
});