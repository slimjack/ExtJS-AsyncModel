//https://github.com/slimjack/ExtJs-AsyncModel

Ext.override('Ext.data.validator.Bound', {
    autoTrim: true,
    getValue: function (fieldValue) {
        var me = this;
        if (fieldValue instanceof Ext.data.Store) {
            return fieldValue.count();
        }
        var stringified = String(fieldValue);
        if (me.autoTrim) {
            stringified = Ext.String.trim(stringified);
        }
        return stringified.length;
    },

    validateValue: function(value) {
        var me = this;
        if (value === undefined || value === null || !me.getValue(value)) {
            return this.getEmptyMessage();
        }
        return true;
    },

    validate: function (fieldValue) {
        var me = this;
        if (fieldValue instanceof Ext.data.Model) {
            return true;
        }
        return me.callParent(arguments);
    }
});