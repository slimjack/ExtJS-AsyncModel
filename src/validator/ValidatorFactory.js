//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.ValidatorFactory', {
    statics: {
        createValidator: function (config) {
            var validator = Ext.Factory.dataValidator(config);
            if (!(validator.$is('Ext.ux.validator.ISyncValidator') || validator.$is('Ext.ux.validator.IAsyncValidator'))) {
                validator = Ext.ux.data.validator.SyncValidator.from(validator);
            }
            return validator;
        }
    }
});
