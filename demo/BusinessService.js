Ext.define('demo.BusinessService', {
    implement: 'IBusinessService',
    
    updateField3: function (model, config, value, callback) {
        Ext.defer(function () {
            model.set('field3', value + ' related ' + config.fieldName);
            callback();
        }, 1000);
    }
});