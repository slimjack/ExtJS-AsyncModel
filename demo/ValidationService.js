Ext.define('demo.ValidationService', {
    implement: 'IValidationService',
    
    validateField1: function (model, config, value, options, callback) {
        Ext.defer(function() {
            if (value === 'badvalue') {
                callback('bad value is invalid');
            } else {
                callback('');
            }
        }, 2000);
    },

    validateField2: function (model, config, value, options, callback) {
        Ext.defer(function () {
            if (value === 'invalidvalue') {
                callback('invalidvalue value is invalid');
            } else {
                callback('');
            }
        }, 2000);
    },

    validateField3: function (model, config, value, options, callback) {
        Ext.defer(function () {
            if (value === 'testvalue') {
                callback('testvalue value is invalid');
            } else {
                callback('');
            }
        }, 2000);
    }
});