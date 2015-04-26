Ext.define('demo.Controller', {
    extend: 'Deft.mvc.ViewController',
    alias: 'controller.demo',

    onBindModelClick: function () {
        this.model = new demo.MainModel(null, null, {eagerNetsedInstantiation: true});
        this.getViewModel().set('model', this.model);
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
