Ext.define('demo.ValidationService', {
    implement: 'IValidationService',
    
    validateField1: function (model, value, options, callback) {
        Ext.defer(function() {
            if (value === 'badvalue') {
                callback('bad value is invalid');
            } else {
                callback('');
            }
        }, 1000);
    },

    validateField2: function (model, value, options, callback) {
        Ext.defer(function () {
            if (value === 'invalidvalue') {
                callback('invalidvalue value is invalid');
            } else {
                callback('');
            }
        }, 1000);
    },

    validateField3: function (model, value, options, callback) {
        Ext.defer(function () {
            if (value === 'testvalue') {
                callback('testvalue value is invalid');
            } else {
                callback('');
            }
        }, 1000);
    }
});