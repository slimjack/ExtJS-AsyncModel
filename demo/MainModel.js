var __validators = {
    validateField1: function (fieldValue, fieldName, model, options) {
        return new Ext.Promise(function (resolve) {
            Ext.defer(function () {
                if (fieldValue === 'badvalue') {
                    resolve({ error: 'badvalue is invalid', info: '' });
                } else {
                    resolve({error: '', info: ''});
                }
            }, 2000);
        });
    },

    validateField2: function (fieldValue, fieldName, model, options) {
        return new Ext.Promise(function (resolve) {
            Ext.defer(function () {
                if (fieldValue === 'invalidvalue') {
                    resolve({ error: 'invalidvalue is invalid', info: '' });
                } else {
                    resolve({ error: '', info: '' });
                }
            }, 2000);
        });
    },

    validateField3: function (fieldValue, fieldName, model, options) {
        return new Ext.Promise(function (resolve) {
            Ext.defer(function () {
                if (fieldValue === 'testvalue') {
                    resolve({ error: 'testvalue is invalid', info: '' });
                } else {
                    resolve({ error: '', info: '' });
                }
            }, 2000);
        });
    }
};


Ext.define('demo.MainModel', {
    extend: 'Ext.ux.data.AsyncModel',
    validateOnMetaDataChange: true,
    fields: [
        { name: 'stringField', type: 'string', required: true, requiredMessage: 'Required field' },
        { name: 'field2', type: 'string', required: true },
        { name: 'field4', type: 'email', desired: true },
        { name: 'field5', type: 'string', desired: true, email: true },
        { name: 'storeField', reference: 'demo.NestedModel', unique: true },
        { name: 'field3', type: 'bool', defaultValue: false }
    ],

    hasMany: {
        name: 'children',
        model: 'demo.StoreModel',
        field: true
    },

    businessRules: {
        field3Change: function (value, callback) {
            this.setMeta('field2', 'readOnly', value);
            callback();
        }
    },

    validationRules: {
        field1: new Ext.ux.data.validator.AsyncValidator(__validators.validateField1),
        field2: [{ type: 'exclusion', list: ['excluded'] }, new Ext.ux.data.validator.AsyncValidator(__validators.validateField2)]
    },
    proxy: {
        type: 'memory'
        //url: 'data.json',
        //reader: {
        //    type: 'json',
        //    rootProperty: 'data'
        //}
    }
});
Ext.define('TestViewModel', {
    extend: 'Ext.app.ViewModel',

    alias: 'viewmodel.test', // connects to viewModel/type below

    data: {
        model: null,
        curChild: null
    }
});
