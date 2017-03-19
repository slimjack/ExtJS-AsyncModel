//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.FormFieldDesiredBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',

    desiredClassName: 'desiredField',
    metaDataName: 'desired',

    applyMetaData: function (control, metaValue, modelRecord, fieldName) {
        var me = this;
        var desiredClassName = (control.desiredClassName === undefined) ? me.desiredClassName : control.desiredClassName;
        if (metaValue && !modelRecord.getMetaValue(fieldName, 'readOnly')) {
            control.addCls(desiredClassName);
        } else {
            control.removeCls(desiredClassName);
        }
    }
});