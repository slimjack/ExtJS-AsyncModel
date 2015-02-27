Ext.define('Ext.ux.data.field.AsyncModel', {
    extend: 'Ext.data.field.Field',

    alias: [
        'data.field.asyncmodel'
    ],

    isModelField: true,

    convert: function (value, modelInstance) {
        var fieldModel = modelInstance.get(this.name);
        if (!fieldModel && !value && this.lazy) {
            return null;
        }
        if (!fieldModel || !(fieldModel instanceof Ext.ux.data.AsyncModel)) {
            if (!this.model) {
                Ext.Error.raise("'model'  must be defined for field with type 'asyncmodel'");
            }
            if (!(Ext.ClassManager.get(this.model).prototype instanceof Ext.data.Model)) {
                Ext.Error.raise("Field with type 'asyncmodel' accepts only 'Ext.ux.data.AsyncModel' types of models");
            }
            fieldModel = Ext.create(this.model);
        }
        if (value) {
            fieldModel.set(value);
        }
        return fieldModel;
    },

    getType: function () {
        return 'model';
    }
});