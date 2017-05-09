Ext.define('demo.BusinessService', {
    implement: 'IBusinessService',
    
    updateField3: function (config, value, modelRecord, callback) {
        Ext.defer(function () {
            modelRecord.set('field3', value + ' related' + config.fieldName);
            callback();
        }, 1000);
    }
});