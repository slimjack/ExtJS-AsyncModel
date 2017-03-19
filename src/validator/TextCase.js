//https://github.com/slimjack/ExtJs-AsyncModel

ValidatorRegistry.register('textCase', function (fieldConfig) {
    var fieldName = fieldConfig.name;
    return new Ext.data.validator.Validator(function (value, record) {
        if (Ext.isString(value) && fieldConfig.validateTrimmed) {
            value = Ext.String.trim(value);
        }

        if (Ext.isEmpty(value)) {
            return true;
        }

        var textCase = record.getMetaValue(fieldName, 'textCase');
        var matcher;
        var messageTpl;
        switch (textCase) {
            case TextCasings.upper:
                matcher = /^[^a-z]*$/;
                messageTpl = new Ext.XTemplate(AsyncModelTexts.onlyUpperCaseAllowedTpl);
                break;
            case TextCasings.lower:
                matcher = /^[^A-Z]*$/;
                messageTpl = new Ext.XTemplate(AsyncModelTexts.onlyLowerCaseAllowedTpl);
                break;
            case TextCasings.mixed:
                matcher = /^(?=.*[a-z])(?=.*[A-Z]).+$/;
                messageTpl = new Ext.XTemplate(AsyncModelTexts.onlyMixedCaseAllowedTpl);
                break;
            default: throw "Unsupported text case mode: " + fieldConfig.textCase;
        }
        if (!matcher.test(value)) {
            return messageTpl.apply(ValidationContext.create(record, fieldName));
        } else {
            return true;
        }
    });
});