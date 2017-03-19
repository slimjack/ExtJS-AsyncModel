//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.Registry', {
    alternateClassName: 'ValidatorRegistry',
    singleton: true,

    constructor: function () {
        this._data = {};
    },

    register: function (fieldAttributeNames, validator, activator, aliases) {
        var me = this;
        if (Ext.isObject(fieldAttributeNames)) {
            validator = fieldAttributeNames.validator;
            activator = fieldAttributeNames.validator;
            aliases = fieldAttributeNames.aliases;
            fieldAttributeNames = fieldAttributeNames.fieldAttributeNames;
        }
        if (!fieldAttributeNames) {
            Ext.Error.raise("'fieldAttributeNames' not specified");
        }
        fieldAttributeNames = Ext.Array.from(fieldAttributeNames);
        var registryRecord = me.createRegistryRecord(validator, activator, fieldAttributeNames);
        Ext.Array.each(fieldAttributeNames, function (fieldAttributeName) {
            if (me._data[fieldAttributeName]) {
                Ext.Error.raise("Validator for '" + fieldAttributeName + "' has been already registered");
            }
            me._data[fieldAttributeName] = registryRecord;
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
    createRegistryRecord: function (validator, activator, fieldAttributeNames) {
        var me = this;
        if (!validator) {
            Ext.Error.raise("'validator' not specified");
        }
        activator = activator || me.defaultActivationRule;
        return {
            aliases: fieldAttributeNames,
            validator: validator,
            activator: activator
        };
    },

    defaultActivationRule: function (model, fieldName, fieldAttributeName) {
        var fieldMetaDataNames = model.getMetaDataNames(fieldName);
        if (Ext.Array.contains(fieldMetaDataNames, fieldAttributeName)) {
            return !!model.getMetaValue(fieldName, fieldAttributeName);
        } else {
            var fieldDescriptor = model.getFieldDescriptor(fieldName);
            return !!fieldDescriptor[fieldAttributeName];
        }
    }
    //endregion

});
