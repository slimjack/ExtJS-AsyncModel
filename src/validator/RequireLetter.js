//https://github.com/slimjack/ExtJs-AsyncModel

ValidatorRegistry.register('requireLetter', function (fieldConfig) {
    var messageTpl = new Ext.XTemplate(fieldConfig.requireLetterMessageTpl || AsyncModelTexts.requireLetterTpl);
    var fieldName = fieldConfig.name;
    return new Ext.data.validator.Validator(function (value, record) {
        if (Ext.isString(value) && fieldConfig.validateTrimmed) {
            value = Ext.String.trim(value);
        }

        if (Ext.isEmpty(value)) {
            return true;
        }

        if (!/\D/.test(value)) {
            return messageTpl.apply(ValidationContext.create(record, fieldName));
        } else {
            return true;
        }
    });
});
