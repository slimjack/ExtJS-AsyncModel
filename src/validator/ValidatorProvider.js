//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.ValidatorProvider', {
    implement: 'Ext.ux.validator.IValidatorProvider',

    associatedFieldProperties: [],
    associatedFieldTypes: [],
    shareValidatorInstance: false,
    associateWithStoreFields: false,
    associateWithModelFields: false,

    getValidator: function (fieldDescriptor) {
        var me = this;

        return me.isValidatorApplicable(fieldDescriptor) ? me.getValidatorInstance(fieldDescriptor) : null;
    },

    isValidatorApplicable: function (fieldDescriptor) {
        var me = this;
        var isApplicableByFieldProperties = me.associatedFieldProperties.length
            ? Ext.Array.some(me.associatedFieldProperties, function (property) { return fieldDescriptor[property] != null; })//any defined and not null
            : true;

        var isApplicableByFieldType = me.associatedFieldTypes.length || me.associateWithStoreFields || me.associateWithModelFields
            ? Ext.Array.some(me.associatedFieldTypes, function (type) { return fieldDescriptor.type === type; })
                || me.associateWithStoreFields && fieldDescriptor.isStoreField
                || me.associateWithModelFields && fieldDescriptor.isModelField
            : true;

        return isApplicableByFieldProperties && isApplicableByFieldType;
    },

    getValidatorInstance: function (fieldDescriptor) {
        var me = this;

        if (!me.shareValidatorInstance) {
            return me.createValidatorInstance(fieldDescriptor);
        }

        if (!me._validatorInstance) {
            me._validatorInstance = me.createValidatorInstance(fieldDescriptor);
        }

        return me._validatorInstance;
    },

    createValidatorInstance: Ext.abstractFn()
});
