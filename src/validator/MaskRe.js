//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.MaskRe', {
    extend: 'Ext.ux.data.validator.ParametrizedValidator',
    alias: 'data.validator.maskre',
    type: 'maskre',
    config: {
        validateTrimmed: false,
        ignoreEmpty: false,
        errorMessageTpl: AsyncModelTexts.forbiddenSymbols
    },

    isValid: function (fieldValue, modelRecord) {
        var me = this;
        var maskRe = modelRecord.getMetaValue(me.getFieldName(), 'maskRe');
        var isValid = true;
        fieldValue = Ext.isString(fieldValue) && me.getValidateTrimmed() ? Ext.String.trim(fieldValue) : fieldValue;
        if (Ext.isString(fieldValue)
            && (!Ext.isEmpty(fieldValue) || !me.getIgnoreEmpty())
            && maskRe) {
            for (var i = 0; i < fieldValue.length; i++) {
                if (!maskRe.test(fieldValue[i])) {
                    isValid = false;
                    break;
                }
            }
        }
        return isValid;
    }
});

ValidatorRegistry.register('maskRe', function (fieldConfig) {
    return new Ext.ux.data.validator.MaskRe({
        errorMessageTpl: fieldConfig.maskReMesage,
        fieldName: fieldConfig.name,
        ignoreEmpty: true,
        validateTrimmed: fieldConfig.validateTrimmed
    });
});
