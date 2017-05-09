//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.SyncValidator', {
    implement: 'Ext.ux.validator.ISyncValidator',

    extend: 'Ext.data.validator.Validator',
    alias: 'data.validator.syncvalidator',

    fieldName: '',

    config: {
        infoMessageTpl: '',
        errorMessageTpl: AsyncModelTexts.invalidValue,
    },

    validResult: {
        error: '',
        info: ''
    },

    errorResult: function (modelRecord, fieldName) {
        return {
            error: me.getErrorMessageTpl().apply(me.getValidationContext(modelRecord, fieldName)),
            info: ''
        };
    },

    infoResult: function (modelRecord, fieldName) {
        return {
            error: '',
            info: me.getInfoMessageTpl().apply(me.getValidationContext(modelRecord, fieldName))
        };
    },

    constructor: function (config) {
        if (typeof config === 'function') {
            this.validateSync = config;
        } else {
            this.callParent(arguments);
        }
    },

    applyInfoMessageTpl: function (template) {
        return new Ext.XTemplate(template);
    },

    applyErrorMessageTpl: function (template) {
        return new Ext.XTemplate(template);
    },

    //region public
    validate: function (fieldValue, modelRecord) {
        var me = this;
        var errorMessage = me.validateSync(fieldValue, me.fieldName, modelRecord, {}).error;
        return errorMessage || true;
    },

    validateSync: function (fieldValue, fieldName, modelRecord, options) {
        var me = this;
        return !me.isValid(fieldValue, fieldName, modelRecord, options)
            ? me.errorResult(modelRecord, fieldName)
            : me.validResult;
    },
    //endregion

    //region protected
    isValid: function (fieldValue, fieldName, modelRecord, options) {
        return true;
    },

    getValidationContext: function (modelRecord, validatedFieldName) {
        var me = this;
        return ValidationContext.create(modelRecord, validatedFieldName);
    },
    //endregion

    statics: {
        from: function (validator) {
            if (validator.$is('Ext.ux.validator.ISyncValidator')) {
                return validator;
            }
            return new Ext.ux.data.validator.SyncValidator(function (fieldValue, fieldName, modelRecord, options) {
                var validationResult = validator.validate(fieldValue, modelRecord);
                var errorMessage = '';
                if (validationResult !== true) {
                    if (!Ext.isString(validationResult) || !validationResult) {
                        errorMessage = AsyncModelTexts.invalidValue;
                    } else {
                        errorMessage = validationResult;
                    }
                }

                return {
                    error: errorMessage,
                    info: ''
                };
            });
        }
    }
});
