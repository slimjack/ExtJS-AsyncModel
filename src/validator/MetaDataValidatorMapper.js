//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.validator.MetaDataValidatorMapper', {
    alternateClassName: 'MetaDataValidatorMapper',
    singleton: true,

    constructor: function() {
        this.map = {};
    },

    assosiate: function (metaDataName, validatorConfig, fieldConfigReplications) {
        this.map[metaDataName] = {
            config: validatorConfig,
            fieldConfigReplications: fieldConfigReplications
        };
    },

    getValidatorsMap: function () {
        return this.map;
    }

});
