//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.MetaModel', {
    extend: 'Ext.data.Model',
    idProperty: '__fakeId__',

    constructor: function () {
        var me = this;
        me.callParent(arguments);
        var receiver = {
            afterEdit: function (record, modifiedFieldNames) {
                me.callJoined('onMetaDataChanged', [record.fieldName, modifiedFieldNames, record]);
            }
        };
        me._fieldMetaRecordsMap = {};
        Ext.Array.forEach(me.fields, function (field) {
            if (field.identifier) {
                return;
            }
            var setterName = 'set' + Ext.String.capitalize(field.name);
            var fieldMetaRecord = Ext.create(field.metaModelName);
            fieldMetaRecord.fieldName = field.name;
            me[setterName].call(me, fieldMetaRecord);
            fieldMetaRecord.join(receiver);
            me._fieldMetaRecordsMap[field.name] = fieldMetaRecord;
        });
        me.reset();
    },

    getMeta: function (fieldName, metaName) {
        var me = this;
        return me._fieldMetaRecordsMap[fieldName].get(metaName);
    },

    setMeta: function (fieldName, metaName, value) {
        var me = this;
        return me._fieldMetaRecordsMap[fieldName].set(metaName, value);
    },

    reset: function () {
        var me = this;
        Ext.Array.forEach(me.fields, function (field) {
            if (!field.identifier) {
                me._fieldMetaRecordsMap[field.name].set(field.defaultValues);
            }
        });
    },

    getMetaDataNames: function (fieldName) {
        var me = this;
        if (!fieldName) {
            Ext.Error.raise(me.$className + '.getMetaDataNames: "fieldName" parameter is not specified');
        }
        var metaModelField = Ext.Array.findBy(me.fields, function (field) {
            return field.name === fieldName;
        });
        if (!metaModelField) {
            Ext.Error.raise(me.$className + '.getMetaDataNames: Field "' + fieldName + '" not found');
        }
        var metaFields = Ext.ClassManager.get(metaModelField.metaModelName).fields;
        var result = [];
        Ext.Array.each(metaFields, function (metaField) {
            if (!metaField.identifier) {
                result.push(metaField.name);
            }

        });
        return result;
    },

    statics: {
        globalFieldMetaModelMap: {},

        createMetaModel: function (record) {
            var me = this;
            if (!(record instanceof Ext.ux.data.AsyncModel)) {
                Ext.Error.raise('Ext.ux.data.MetaModel can be applied to Ext.ux.data.AsyncModel only');
            }
            var metaModelClassName = Ext.getClassName(record) + '__Meta__';
            if (!Ext.ClassManager.isCreated(metaModelClassName)) {
                var fieldDefinitions = Ext.Array.map(record.getFieldsDescriptors(), function (fieldDescription) {
                    var fieldMetaModelName = me.getFieldMetaModelName(record, fieldDescription);
                    var defaultMetaValues = me.getMetaDefaults(fieldMetaModelName, fieldDescription);
                    return {
                        name: fieldDescription.name,
                        reference: { type: fieldMetaModelName, role: fieldDescription.name },
                        defaultValues: defaultMetaValues,
                        metaModelName: fieldMetaModelName
                    };
                });
                Ext.define(metaModelClassName, {
                    extend: 'Ext.ux.data.MetaModel',
                    fields: fieldDefinitions
                });
            }
            return Ext.create(metaModelClassName);
        },

        getMetaDefaults: function (fieldMetaModelName, fieldDescription) {
            var metaFields = Ext.ClassManager.get(fieldMetaModelName).fields;
            var result = {};
            Ext.Array.forEach(metaFields, function (metaField) {
                result[metaField.name] = fieldDescription[metaField.name] || metaField.defaultValue || null;
            });
            return result;
        },

        getFieldMetaModelName: function (record, fieldDescription) {
            var me = this;
            var result = fieldDescription.metaModelName;
            if (!result && record.fieldMetaModelMap && fieldDescription.type) {
                result = record.fieldMetaModelMap[fieldDescription.type];
            }

            if (!result && fieldDescription.type) {
                result = me.globalFieldMetaModelMap[fieldDescription.type];
            }

            if (!result) {
                result = record.fieldMetaModelName || 'Ext.ux.data.FieldMetaModel';
            }
            return result;
        },

        assignDefaultFieldMetaModel: function (fieldMetaModelName, fieldType) {
            var me = this;
            me.globalFieldMetaModelMap[fieldType] = fieldMetaModelName;
        }
    }
});
