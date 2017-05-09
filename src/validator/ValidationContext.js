//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.ValidationContext', {
    alternateClassName: 'ValidationContext',
    statics: {
        getFieldDisplayName: function (modelRecord, validatedFieldName) {
            var me = this;
            return modelRecord.getMetaValue(validatedFieldName, 'displayName') || validatedFieldName;
        },

        create: function (modelRecord, validatedFieldName, additionalContext) {
            var result = {
                fieldName: (modelRecord instanceof Ext.ux.data.AsyncModel) && validatedFieldName
                    ? this.getFieldDisplayName(modelRecord, validatedFieldName)
                    : validatedFieldName,
            };
            if (additionalContext) {
                Ext.apply(result, additionalContext);
            }
            return result;

        }
    }
});