//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.field.Array', {
    extend: 'Ext.data.field.Field',
    alias: 'data.field.array',
    isArrayField: true,
    compare: function (a, b) {
        var aLength = a.length;
        var bLength = b.length;
        return aLength == bLength ? 0 : aLength < bLength ? -1 : 1;
    },

    isEqual: function (a, b) {
        if (!a || !b) {
            return a === b;
        }
        return Ext.Array.equals(a, b);
    }
});
