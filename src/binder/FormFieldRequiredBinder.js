//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.FormFieldRequiredBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',

    requiredClassName: 'requiredField',
    metaDataName: 'required',

    applyMetaData: function (control, metaValue, modelRecord, fieldName) {
        var me = this;
        var requiredClassName = (control.requiredClassName === undefined) ? me.requiredClassName : control.requiredClassName;
        if (metaValue && !modelRecord.getMetaValue(fieldName, 'readOnly')) {
            control.addCls(requiredClassName);
        } else {
            control.removeCls(requiredClassName);
        }
    }
});