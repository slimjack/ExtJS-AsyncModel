Ext.define('demo.DetailsController', {
    extend: 'Deft.mvc.ViewController',
    alias: 'controller.details',

    onModelBound: function (view, model) {
        this.lookupReference('metacontrols').setDisabled(false);
        this.model = model;
        this.updateMetaControls();
    },

    onModelUnbound: function (view, model) {
        this.lookupReference('metacontrols').setDisabled(true);
        this.model = null;
    },

    onField1RequiredChange: function (ctrl, value) {
        if (!this.model) return;
        this.model.setMeta('field1', 'required', value);
    },

    onField1ReadOnlyChange: function (ctrl, value) {
        if (!this.model) return;
        this.model.setMeta('field1', 'readOnly', value);
    },

    onField2RequiredChange: function (ctrl, value) {
        if (!this.model) return;
        this.model.setMeta('field2', 'required', value);
    },

    onField2ReadOnlyChange: function (ctrl, value) {
        if (!this.model) return;
        this.model.setMeta('field2', 'readOnly', value);
    },

    onField3RequiredChange: function (ctrl, value) {
        if (!this.model) return;
        this.model.setMeta('field3', 'required', value);
    },

    onField3ReadOnlyChange: function (ctrl, value) {
        if (!this.model) return;
        this.model.setMeta('field3', 'readOnly', value);
    },

    updateMetaControls: function() {
        if (!this.model) return;
        this.lookupReference('required1').setValue(this.model.getMeta('field1', 'required'));
        this.lookupReference('required2').setValue(this.model.getMeta('field2', 'required'));
        this.lookupReference('required3').setValue(this.model.getMeta('field3', 'required'));
        this.lookupReference('readOnly1').setValue(this.model.getMeta('field1', 'readOnly'));
        this.lookupReference('readOnly1').setValue(this.model.getMeta('field2', 'readOnly'));
        this.lookupReference('readOnly1').setValue(this.model.getMeta('field3', 'readOnly'));

    }
});
