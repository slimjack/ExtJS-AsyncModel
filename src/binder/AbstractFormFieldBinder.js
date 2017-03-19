//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.AbstractFormFieldBinder', {
    implement: 'IMetaDataBinder',
    abstractClass: true,

    getMetaDataName: function () {
        if (!this.metaDataName) {
            Ext.Error.raise('metaDataName not defined');
        }
        return this.metaDataName;
    },

    getListenedMetaDataNames: function () {
        if (!this.metaDataName) {
            Ext.Error.raise('metaDataName not defined');
        }
        return [this.metaDataName];
    },

    onComponentBound: function (formField, model, modelFieldName) { },

    onComponentUnbound: function (formField) { },

    isApplicable: function (control) {
        return control.isFormField;
    },

    applyMetaData: function (control, metaValue, model, fieldName) { },

    applyPlugin: function (formField, plugin) {
        var ptype = Ext.isString(plugin) ? plugin : plugin.ptype;
        if (!formField.findPlugin(ptype)) {
            formField.addPlugin(plugin);
        }
    }
});
