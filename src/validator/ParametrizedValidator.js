Ext.define('Ext.data.validator.ParametrizedValidator', {
    extend: 'Ext.data.validator.Validator',
    alias: 'data.validator.baseparametrizedvalidator',

    _infoMessage: '',

    validateWithOptions: function (fieldValue, modelRecord, options) {
        return this.validate(fieldValue, modelRecord);
    },

    getInfoMessage: function() {
        return this._infoMessage;
    }
});