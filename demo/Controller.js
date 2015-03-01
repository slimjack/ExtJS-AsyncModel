Ext.define('demo.Controller', {
    extend: 'Deft.mvc.ViewController',
    alias: 'controller.demo',

    onBindModelClick: function () {
        this.model = new demo.MainModel();
        //this.model.get('field4').get('field4').add(new demo.StoreModel());
        this.getView().bindModel(this.model);
    },

    onAddRowClick: function () {
        this.model.get('field4').get('field4').add(new demo.StoreModel());
    },

    onValidateClick: function () {
        this.model.validate({ validatePresence: true });
    },

    onField1RequiredChange: function (ctrl, value) {
        this.model.setMeta('field1', 'required', value);
    },

    onField1ReadOnlyChange: function (ctrl, value) {
        this.model.setMeta('field1', 'readOnly', value);
    },

    onField2RequiredChange: function (ctrl, value) {
        this.model.setMeta('field2', 'required', value);
    }
});
