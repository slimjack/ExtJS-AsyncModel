Ext.define('demo.Controller', {
    extend: 'Deft.mvc.ViewController',
    alias: 'controller.demo',

    onBindModelClick: function () {
        this.model = new demo.MainModel();
        this.getView().bindModel(this.model);
    },

    onAddRowClick: function () {
        this.model.get('field4').get('field4').add(new demo.StoreModel());
    },

    onValidateClick: function () {
        this.model.validate({validatePresence: true});
    }
});
