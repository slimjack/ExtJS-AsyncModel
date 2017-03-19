//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.ParametrizedValidator', {
    extend: 'Ext.data.validator.Validator',
    alias: 'data.validator.baseparametrizedvalidator',
    config: {
        fieldName: '',
        infoMessage: '',
        errorMessageTpl: AsyncModelTexts.invalidValue,
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
        if (!me.isValid()) {
            return Ext.String.format(me.getErrorMessageTpl(), me.getFieldDisplayName());
        }
        return true;
    },

    validateWithOptions: function (fieldValue, modelRecord, options) {
        var me = this;
        var validationResult = me.validate(fieldValue, modelRecord);
        var errorMessage = '';
        if (validationResult !== true) {
            if (!Ext.isString(validationResult) || !validationResult) {
                errorMessage = me.getErrorMessageTpl().apply(me.getValidationContext(modelRecord));
            } else {
                errorMessage = validationResult;
            }
        }

        return {
            errorMessage: errorMessage,
            infoMessage: me.getInfoMessage()
        };
    },
    //endregion

    //region protected
    isValid: function (fieldValue, modelRecord) {
        return true;
    },

    getValidationContext: function (record) {
        var me = this;
        return ValidationContext.create(modelRecord, me.getFieldName());
    },
    //endregion

    statics: {
        decorateStandard: function (standardValidator) {
            if (!standardValidator.validateWithOptions) {
                standardValidator.validateWithOptions = this.validateWithOptions;
            }
        },

        validateWithOptions: function (fieldValue, modelRecord, options) {
            var me = this;
            var validationResult = me.validate(fieldValue, modelRecord);
            var errorMessage = '';
            if (validationResult !== true) {
                if (!Ext.isString(validationResult) || !validationResult) {
                    errorMessage = me.defaultErrorMessage || AsyncModelTexts.invalidValue;
                } else {
                    errorMessage = validationResult;
                }
            }

            return {
                errorMessage: errorMessage,
                infoMessage: ''
            };
        }

    }
});
