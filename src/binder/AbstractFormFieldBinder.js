Ext.define('Ext.ux.binder.AbstractFormFieldBinder', {
    implement: 'IMetaDataBinder',
    abstractClass: true,
    
    getMetaDataName: function () {
        if (!this.metaDataName) {
            Ext.Error.raise('metaDataName not defined');
        }
        return this.metaDataName;
    },

    onComponentBound: function (formField, model, modelFieldName) {},
    
    onComponentUnbound: function (formField) { },

    isApplicable: function (control) {
        return control.isFormField;
    },

    applyMetaData: function (control, metaValue, model, fieldName) { },

    applyPlugin: function (formField, ptype) {
        if (!formField.findPlugin(ptype)) {
            formField.addPlugin(ptype);
        }
    }
});