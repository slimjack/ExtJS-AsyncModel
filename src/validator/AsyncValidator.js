//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.AsyncValidator', {
    mixins: [
        'Ext.mixin.Factoryable'
    ],

    alias: 'data.async.validator.base', // also configures Factoryable

    isAsyncValidator: true,
    type: 'base',

    config: {
        fieldName: ''
    },

    statics: {
        all: {},

        register: function (name, cls) {
            var all = this.all;
            all[name.toUpperCase()] = all[name.toLowerCase()] = all[name] = cls.prototype;
        }
    },

    onClassExtended: function (cls, data) {
        if (data.type) {
            Ext.data.validator.AsyncValidator.register(data.type, cls);
        }
    },

    constructor: function (config) {
        if (typeof config === 'function') {
            this.fnOnly = true;
            this.validate = config;
        } else {
            this.initConfig(config);
        }
    },

    validate: function (fieldValue, model, options, callback) {
        Ext.callback(callback, null, ['', '']);
    },

    getValidationContext: function (record) {
        var me = this;
        return ValidationContext.create(modelRecord, me.getFieldName());
    }
},
    function () {
        this.register(this.prototype.type, this);
    });
