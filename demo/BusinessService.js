Ext.define('demo.BusinessService', {
    implement: 'IBusinessService',
    
    updateField3: function (model, value, callback) {
        Ext.defer(function () {
            model.set('field3', value + 'related');
            callback();
        }, 1000);
    }
});