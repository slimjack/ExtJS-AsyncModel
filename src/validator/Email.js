//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.Email', {
    extend: 'Ext.ux.data.validator.SyncValidator',
    alias: 'data.validator.email',
    type: 'email',

    config: {
        errorMessageTpl: AsyncModelTexts.incorrectEmail
    },

    statics: {
        emailMatcher: /^(")?(?:[^\."])(?:(?:[\.])?(?:[\w\-!#$%&'*+\/=?\^_`{|}~]))*\1@(\w[\-\w]*\.){1,5}([A-Za-z]){2,6}$/
    },

    isValid: function (fieldValue, fieldName, modelRecord, options) {
        var me = this;
        fieldValue = Ext.String.trim(fieldValue);
        return fieldValue ? Ext.ux.data.validator.Email.emailMatcher.test(fieldValue) : true;
    }
});


Ext.define('Ext.ux.data.validator.EmailValidatorProvider', {
    extend: 'Ext.ux.data.validator.ValidatorProvider',
    associatedFieldTypes: ['email'],
    shareValidatorInstance: true,

    createValidatorInstance: function (fieldDescriptor) {
        return new Ext.ux.data.validator.Email();
    }
});