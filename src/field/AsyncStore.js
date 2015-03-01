//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.field.AsyncStore', {
    extend: 'Ext.data.field.Field',

    alias: [
        'data.field.asyncstore'
    ],

    isStoreField: true,

    convert: function (value, modelInstance) {
        var fieldStore = modelInstance.get(this.name);
        if (!fieldStore && !value && this.lazy) {
            return null;
        }
        if (!fieldStore || !(fieldStore instanceof Ext.ux.data.AsyncStore)) {
            if (!(modelInstance instanceof Ext.ux.data.AsyncModel)) {
                Ext.Error.raise("Field with type 'asyncstore' can be used only for models of 'Ext.ux.data.AsyncModel' type");
            }
            if ((this.store) && !(Ext.ClassManager.get(this.store).prototype instanceof Ext.ux.data.AsyncStore)) {
                Ext.Error.raise("Field with type 'asyncstore' accepts only 'Ext.ux.data.AsyncStore' types of stores");
            }

            if ((this.model) && !(Ext.ClassManager.get(this.model).prototype instanceof Ext.ux.data.AsyncModel)) {
                Ext.Error.raise("Field with type 'asyncstore' accepts only 'Ext.ux.data.AsyncModel' types of models");
            }

            if (!(this.model || this.store)) {
                Ext.Error.raise("'model' or 'store' must be defined for field with type 'asyncstore'");
            }
            if (this.store) {
                fieldStore = Ext.create(this.store);
            } else {
                fieldStore = Ext.create('Ext.ux.data.AsyncStore', { model: this.model });
            }
        }
        if (value || fieldStore.count()) {
            fieldStore.loadData(value);
        }
        return fieldStore;
    },

    getType: function () {
        return 'store';
    }
});