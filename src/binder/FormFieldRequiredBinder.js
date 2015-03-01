//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.FormFieldRequiredBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',

    requiredClassName: 'requiredField',
    metaDataName: 'required',

    applyMetaData: function (control, metaValue, model, fieldName) {
        var me = this;
        var requiredClassName = (control.requiredClassName === undefined) ? me.requiredClassName : control.requiredClassName;
        if (metaValue) {
            control.addCls(requiredClassName);
        } else {
            control.removeCls(requiredClassName);
        }
    }
});