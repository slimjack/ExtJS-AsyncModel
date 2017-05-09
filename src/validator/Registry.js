//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.Registry', {
    alternateClassName: 'ValidatorRegistry',
    singleton: true,

    constructor: function () {
        this._data = {};
    },

    register: function (registrationData) {
        var me = this;
        var registryRecord = me.createRegistryRecord(registrationData);
        Ext.Array.each(registryRecord.fieldAttributeNames, function (fieldAttributeName) {
            me._data[fieldAttributeName] = me._data[fieldAttributeName] || [];
            me._data[fieldAttributeName].push(registryRecord);
        });
    },

    getData: function (additionalRegistrations) {
        var me = this;
        var result = {};
        Ext.Object.each(me._data, function (fieldAttributeName, registryRecord) {
            if (!result[fieldAttributeName]) {
                var resultRecord = {
                    validator: registryRecord.validator,
                    activator: registryRecord.activator
                };
                Ext.Array.each(registryRecord.aliases, function (alias) {
                    result[alias] = resultRecord;
                });
            }
        });
        if (additionalRegistrations) {
            Ext.Object.each(additionalRegistrations, function (fieldAttributeName, data) {
                var registryRecord = me.createRegistryRecord(data.validator, data.activator, [fieldAttributeName]);
                result[fieldAttributeName] = {
                    validator: registryRecord.validator,
                    activator: registryRecord.activator
                };
            });
        }
        return result;
    },

    //region private methods
    createRegistryRecord: function (registrationData) {
        var me = this;
        if (!registrationData.fieldAttributeNames) {
            Ext.Error.raise("'fieldAttributeNames' not specified");
        }
        if (!registrationData.validator) {
            Ext.Error.raise("'validator' not specified");
        }
        return {
            fieldAttributeNames: Ext.Array.from(registrationData.fieldAttributeNames),
            validator: validator,
            activator: registrationData.activator || me.defaultActivationRule
        };
    },

    defaultActivationRule: function (model, fieldName, fieldAttributeName) {
        var fieldMetaDataNames = model.getMetaDataNames(fieldName);
        var attributeValue;
        if (Ext.Array.contains(fieldMetaDataNames, fieldAttributeName)) {
            attributeValue = model.getMetaValue(fieldName, fieldAttributeName);
        } else {
            var fieldDescriptor = model.getFieldDescriptor(fieldName);
            attributeValue = fieldDescriptor[fieldAttributeName];
        }
        return Ext.isDefined(attributeValue) && attributeValue !== null && !!attributeValue;
    }
    //endregion

});
