//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.AsyncValidator', {
    implement: 'Ext.ux.validator.IAsyncValidator',
    extend: 'Ext.data.validator.Validator',
    alias: 'data.validator.asyncvalidator',

    type: 'asyncvalidator',

    constructor: function (config) {
        if (typeof config === 'function') {
            this.validateAsync = config;
        } else {
            this.callParent(arguments);
        }
    },

    validate: function (fieldValue, modelRecord) {
        Ext.Error.raise('Synchronous validation cannot be used with "Ext.ux.data.validator.AsyncValidator"');
    },

    validateAsync: Ext.abstractFn(),

    getValidationContext: function (modelRecord, validatedFieldName) {
        var me = this;
        return ValidationContext.create(modelRecord, validatedFieldName);
    }
});
