//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.Context', {
    alternateClassName: 'ValidationContext',
    statics: {
        getFieldDisplayName: function (modelRecord, validatedFieldName) {
            var me = this;
            return modelRecord.getMetaValue(me.getFieldName(), 'displayName') || validatedFieldName;
        },

        create: function (modelRecord, validatedFieldName, additionalContext) {
            var result = {
                fieldName: this.getFieldDisplayName(record, validatedFieldName),
            };
            if (additionalContext) {
                Ext.apply(result, additionalContext);
            }
            return result;

        }
    }
});