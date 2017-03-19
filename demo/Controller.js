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
                console.log(v.get('field1'));
            }
        });
        (new DynamicComponentQuery(this.lookupReference('metacontrols'), 'checkbox')).enable();
    },

    onAddRowClick: function () {
        this.model.children().add(new demo.StoreModel());
    },

    onValidateClick: function () {
        this.model.validate({ validatePresence: true });
    },

    onField1RequiredChange: function (ctrl, value) {
        this.model.setMetaValue('field1', 'required', value);
    },

    onField1ReadOnlyChange: function (ctrl, value) {
        this.model.setMetaValue('field1', 'readOnly', value);
    },

    onField2RequiredChange: function (ctrl, value) {
        this.model.setMetaValue('field2', 'required', value);
    }
});
