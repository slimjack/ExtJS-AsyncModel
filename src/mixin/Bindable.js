//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.mixin.Bindable', {
    isBindable: true,

    //'model' is an instance of 'Ext.ux.data.AsyncModel' or 'Ext.ux.data.AsyncStore'
    bindModel: function (model) {
        Ext.Error.raise('Ext.ux.mixin.Bindable.bindModel method is not implemented');
    },

    clearModelBinding: function () {
        Ext.Error.raise('Ext.ux.mixin.Bindable.clearModelBinding method is not implemented');
    }

});