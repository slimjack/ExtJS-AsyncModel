Ext.define('demo.DetailsController', {
    extend: 'Deft.mvc.ViewController',
    alias: 'controller.details',

    init: function() {
        var me = this;
        Ext.defer(function() {
            me.lookupReference('metacontrols').setDisabled(true);
            me.getViewModel().bind('{curChild}', function (curChild) {
                me.updateMetaControls();
                if (curChild) {
                    me.lookupReference('metacontrols').setDisabled(false);
                }
            });
        }, 5);
    },

    onField1RequiredChange: function (ctrl, value) {
        var model = this.getViewModel().get('curChild');
        model.setMetaValue('stringField', 'required', value);
    },

    onField1ReadOnlyChange: function (ctrl, value) {
        var model = this.getViewModel().get('curChild');
        model.setMetaValue('stringField', 'readOnly', value);
    },

    onField2RequiredChange: function (ctrl, value) {
        var model = this.getViewModel().get('curChild');
        model.setMetaValue('field2', 'required', value);
    },

    onField2ReadOnlyChange: function (ctrl, value) {
        var model = this.getViewModel().get('curChild');
        model.setMetaValue('field2', 'readOnly', value);
    },

    onField3RequiredChange: function (ctrl, value) {
        var model = this.getViewModel().get('curChild');
        model.setMetaValue('field3', 'required', value);
    },

    onField3ReadOnlyChange: function (ctrl, value) {
        var model = this.getViewModel().get('curChild');
        model.setMetaValue('field3', 'readOnly', value);
    },

    updateMetaControls: function() {
        var model = this.getViewModel().get('curChild');
        if (!model) {
            return;
        }
        this.lookupReference('required1').setValue(model.getMetaValue('stringField', 'required'));
        this.lookupReference('required2').setValue(model.getMetaValue('field2', 'required'));
        this.lookupReference('required3').setValue(model.getMetaValue('field3', 'required'));
        this.lookupReference('readOnly1').setValue(model.getMetaValue('stringField', 'readOnly'));
        this.lookupReference('readOnly1').setValue(model.getMetaValue('field2', 'readOnly'));
        this.lookupReference('readOnly1').setValue(model.getMetaValue('field3', 'readOnly'));

    }
});
