//https://github.com/slimjack/ExtJs-AsyncModel

ValidatorRegistry.register({
    fieldAttributeNames: 'storeUnique',

    validator: function (fieldConfig) {
        var messageTpl = new Ext.XTemplate(fieldConfig.storeUniqueMessageTpl || AsyncModelTexts.storeUniqueTpl);
        var fieldName = fieldConfig.name;
        return new Ext.data.validator.Validator(function (value, record) {
            if (Ext.isString(value) && fieldConfig.validateTrimmed) {
                value = Ext.String.trim(value);
            }

            if (Ext.isEmpty(value) || !record.store) {
                return true;
            }

            var duplicateIndex = record.store.findBy(function (r) {
                var anotherValue = r.get(fieldName);
                if (Ext.isString(anotherValue) && fieldConfig.validateTrimmed) {
                    anotherValue = Ext.String.trim(anotherValue);
                }
                return r !== record && anotherValue === value;
            });

            if (duplicateIndex !== -1) {
                return messageTpl.apply(ValidationContext.create(record, fieldName));
            } else {
                return true;
            }
        });
    }
});
