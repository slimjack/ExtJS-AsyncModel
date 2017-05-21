Ext.override(Ext.data.field.Field, {
    isEqual: function (a, b) {
        var me = this;
        if (Ext.isArray(a) && Ext.isArray(b)) {
            return Ext.Array.equals(a, b);
        } else {
            return me.callParent(arguments);
        }
    }
});
