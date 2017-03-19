Ext.define('demo.MainModel', {
    extend: 'Ext.ux.data.AsyncModel',
    validateOnMetaDataChange: true,
    fields: [
        { name: 'field1', type: 'string', required: true, requiredMessage: 'Required field' },
        { name: 'field2', type: 'string', required: true },
        { name: 'field4', type: 'email', desired: true },
        { name: 'field5', type: 'string', desired: true, email: true },
        { name: 'nested', reference: 'demo.NestedModel', unique: true },
        { name: 'field3', type: 'bool', defaultValue: false }
    ],

    hasMany: {
        name: 'children',
        model: 'demo.StoreModel',
        field: true
    },

    businessRules: {
        field3Change: function(value, callback) {
            this.setMeta('field2', 'readOnly', value);
            callback();
        }
    },

    validationRules: {
        field1: 'IValidationService.validateField1',
        field2: [{ type: 'exclusion', list: ['excluded'] }, 'IValidationService.validateField2']
    },
    proxy: {
        type: 'ajax',
        url: 'data.json',
        reader: {
            type: 'json',
            rootProperty: 'data'
        }
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
