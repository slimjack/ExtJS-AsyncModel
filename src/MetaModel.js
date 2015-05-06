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
            var fieldMetaRecord = Ext.create(me.fieldMetaModelName);
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

    getMetaDataNames: function () {
        var me = this;
        var metaFields = Ext.ClassManager.get(me.fieldMetaModelName).fields;
        var result = [];
        Ext.Array.each(metaFields, function (metaField) {
            if (!metaField.identifier) {
                result.push(metaField.name);
            }

        });
        return result;
    },

    statics: {
        createMetaModel: function (record) {
            var me = this;
            if (!(record instanceof Ext.ux.data.AsyncModel)) {
                throw 'Ext.ux.data.MetaModel can be applied only to Ext.ux.data.AsyncModel';
            }
            var metaModelClassName = Ext.getClassName(record) + '__Meta__';
            if (!Ext.ClassManager.isCreated(metaModelClassName)) {
                var fieldMetaModelName = record.fieldMetaModelName || 'Ext.ux.data.FieldMetaModel';
                var fieldDefinitions = Ext.Array.map(record.getFieldsDescription(), function (fieldDescription) {
                    var defaultMetaValues = me.getMetaDefaults(fieldMetaModelName, fieldDescription);
                    return { name: fieldDescription.name, reference: { type: fieldMetaModelName, role: fieldDescription.name }, defaultValues: defaultMetaValues };
                });
                Ext.define(metaModelClassName, {
                    extend: 'Ext.ux.data.MetaModel',
                    fieldMetaModelName: fieldMetaModelName,
                    fields: fieldDefinitions
                });
            }
            return Ext.create(metaModelClassName);
        },

        getMetaDefaults: function (fieldMetaModelName, fieldDescription) {
            var metaFields = Ext.ClassManager.get(fieldMetaModelName).fields;
            var result = {};
            Ext.Array.forEach(metaFields, function (metaField) {
                if (metaField.name !== 'validationErrorMessages' && metaField.name !== 'validationInfoMessages') {
                    result[metaField.name] = fieldDescription[metaField.name] || metaField.defaultValue || null;
                }
            });
            return result;
        }
    }
});