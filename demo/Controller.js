Ext.define('demo.Controller', {
    extend: 'Ext.ux.util.DynamicViewController',
    alias: 'controller.demo',

    onBindModelClick: function () {
        this.model = new demo.MainModel(null, null, {eagerNetsedInstantiation: true});
        this.getViewModel().set('model', this.model);
        this.model.setId(1);
        this.model.load();
        this.getViewModel().bind('{curChild}', function (v) {
            if (v) {
                console.log(v.get('stringField'));
            }
        });
        (new DynamicComponentQuery(this.lookupReference('metacontrols'), 'checkbox')).enable();
    },

    onAddRowClick: function () {
        this.model.children().add(new demo.StoreModel());
    },

    onValidateClick: function () {
        this.model.validate({ validatePresence: true }).then(function (result) { alert(result.errors.join(';')); });
    },

    onField1RequiredChange: function (ctrl, value) {
        this.model.setMetaValue('stringField', 'required', value);
    },

    onField1ReadOnlyChange: function (ctrl, value) {
        this.model.setMetaValue('stringField', 'readOnly', value);
    },

    onField2RequiredChange: function (ctrl, value) {
        this.model.setMetaValue('field2', 'required', value);
    }
});
