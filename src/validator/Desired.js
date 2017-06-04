//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.Desired', {
    extend: 'Ext.ux.data.validator.Required',
    alias: 'data.validator.desired',
    type: 'desired',

    config: {
        infoMessageTpl: AsyncModelTexts.desiredFieldMessageTpl,
        trimStrings: true
    },

    validateSync: function (fieldValue, fieldName, modelRecord, options) {
        var me = this;
        var desired = modelRecord.getMetaValue(fieldName, 'desired');
        if (!desired || !options.validatePresence) {
            return me.validResult();
        }
        return me.isEmpty(fieldValue) ? me.infoResult(modelRecord, fieldName) : me.validResult();
    }
});

Ext.define('Ext.ux.data.validator.DesiredValidatorProvider', {
    extend: 'Ext.ux.data.validator.ValidatorProvider',
    shareValidatorInstance: true,

    createValidatorInstance: function (fieldDescriptor) {
        return new Ext.ux.data.validator.Desired();
    }
});