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
    },

    onComponentBound: function (formField, modelRecord, modelFieldName) {
        var me = this;
        var handler = function (modelRecord, fieldName, metaDataFieldName, value) {
            if (metaDataFieldName === 'readOnly' && modelFieldName === fieldName) {
                var isRequired = modelRecord.getMetaValue(fieldName, 'required');
                me.applyMetaData(formField, isRequired, modelRecord, modelFieldName);
            }
        };
        modelRecord.on('metadatachange', handler);
        formField.__required_binder_disposer = function () {
            modelRecord.un('metadatachange', handler);
            delete formField.__required_binder_disposer;
        }
    },

    onComponentUnbound: function (formField) {
        formField.__required_binder_disposer();
    },

});