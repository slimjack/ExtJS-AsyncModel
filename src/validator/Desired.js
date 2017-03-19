//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.Desired', {
    extend: 'Ext.ux.data.validator.Required',
    alias: 'data.validator.desired',
    type: 'desired',
    config: {
        trimStrings: true,
        errorMessage: AsyncModelTexts.desiredField
    },

    validate: function (fieldValue) {
        var me = this;
        var requiredValidatorResult = me.callParent(arguments);
        if (Ext.isString(requiredValidatorResult)) {
            me.setInfoMessage(requiredValidatorResult);
        }
        return true;
    }
});