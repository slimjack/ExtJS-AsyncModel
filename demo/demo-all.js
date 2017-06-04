Ext.defineInterface('IBusinessService', {
    inherit: 'ISingleton',
    methods: [
        'updateField3'
    ]
});
Ext.define('demo.BusinessService', {
    implement: 'IBusinessService',
    
    updateField3: function (config, value, modelRecord, callback) {
        Ext.defer(function () {
            modelRecord.set('field3', value + ' related' + config.fieldName);
            callback();
        }, 1000);
    }
});
Ext.define('demo.StoreModel', {
    extend: 'Ext.ux.data.AsyncModel',
    fields: [
        { name: 'stringField', type: 'string', required: true, requiredMessage: 'Required field' },
        { name: 'field2', type: 'string', required: true },
        { name: 'field3', type: 'string', storeUnique: true, desired: true }
    ],

    businessRules: {
        field1ValidChange: 'IBusinessService.updateField3'
    },

    validationRules: {
        field1: 'email'
    }
});
Ext.define('demo.NestedModel', {
    extend: 'Ext.ux.data.AsyncModel',
    fields: [
        { name: 'stringField', type: 'string', required: true, requiredMessage: 'Required field' },
        { name: 'field2', type: 'string', required: true },
        { name: 'field3', type: 'string' }
    ],

    businessRules: {
        field1ValidChange: 'IBusinessService.updateField3'
    },

    validationRules: {
        field1: 'email'
    }
});
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

Ext.define('demo.DetailsController', {
    extend: 'Deft.mvc.ViewController',
    alias: 'controller.details',

    init: function() {
        var me = this;
        Ext.defer(function() {
            me.lookupReference('metacontrols').setDisabled(true);
            me.getViewModel().bind('{curChild}', function (curChild) {
                me.updateMetaControls();
                if (curChild) {
                    me.lookupReference('metacontrols').setDisabled(false);
                }
            });
        }, 5);
    },

    onField1RequiredChange: function (ctrl, value) {
        var model = this.getViewModel().get('curChild');
        model.setMetaValue('stringField', 'required', value);
    },

    onField1ReadOnlyChange: function (ctrl, value) {
        var model = this.getViewModel().get('curChild');
        model.setMetaValue('stringField', 'readOnly', value);
    },

    onField2RequiredChange: function (ctrl, value) {
        var model = this.getViewModel().get('curChild');
        model.setMetaValue('field2', 'required', value);
    },

    onField2ReadOnlyChange: function (ctrl, value) {
        var model = this.getViewModel().get('curChild');
        model.setMetaValue('field2', 'readOnly', value);
    },

    onField3RequiredChange: function (ctrl, value) {
        var model = this.getViewModel().get('curChild');
        model.setMetaValue('field3', 'required', value);
    },

    onField3ReadOnlyChange: function (ctrl, value) {
        var model = this.getViewModel().get('curChild');
        model.setMetaValue('field3', 'readOnly', value);
    },

    updateMetaControls: function() {
        var model = this.getViewModel().get('curChild');
        if (!model) {
            return;
        }
        this.lookupReference('required1').setValue(model.getMetaValue('stringField', 'required'));
        this.lookupReference('required2').setValue(model.getMetaValue('field2', 'required'));
        this.lookupReference('required3').setValue(model.getMetaValue('field3', 'required'));
        this.lookupReference('readOnly1').setValue(model.getMetaValue('stringField', 'readOnly'));
        this.lookupReference('readOnly1').setValue(model.getMetaValue('field2', 'readOnly'));
        this.lookupReference('readOnly1').setValue(model.getMetaValue('field3', 'readOnly'));

    }
});

Ext.define('demo.DetailsPanel', {
    extend: 'Ext.form.FieldSet',
    alias: 'widget.detailspanel',
    layout: {
        type: 'vbox'
    },
    controller: 'details',

    items: [{
        xtype: 'container',
        reference: 'metacontrols',
        layout: 'hbox',
        defaults: {
            margin: 5
        },
        items: [{
            xtype: 'checkbox',
            fieldLabel: 'Field 1 required',
            reference: 'required1',
            value: true,
            listeners: {
                change: 'onField1RequiredChange'
            }
        }, {
            xtype: 'checkbox',
            fieldLabel: 'Field 1 readOnly',
            reference: 'readOnly1',
            value: false,
            listeners: {
                change: 'onField1ReadOnlyChange'
            }
        }, {
            xtype: 'checkbox',
            fieldLabel: 'Field 2 required',
            reference: 'required2',
            value: true,
            listeners: {
                change: 'onField2RequiredChange'
            }
        }, {
            xtype: 'checkbox',
            fieldLabel: 'Field 2 readOnly',
            reference: 'readOnly2',
            value: false,
            listeners: {
                change: 'onField2ReadOnlyChange'
            }
        }, {
            xtype: 'checkbox',
            fieldLabel: 'Field 3 required',
            reference: 'required3',
            value: false,
            listeners: {
                change: 'onField3RequiredChange'
            }
        }, {
            xtype: 'checkbox',
            fieldLabel: 'Field 3 readOnly',
            reference: 'readOnly3',
            value: false,
            listeners: {
                change: 'onField3ReadOnlyChange'
            }
        }]
    }, {
        xtype: 'container',
        layout: 'hbox',
        defaults: {
            margin: 5
        },
        items: [{
            xtype: 'textfield',
            name: 'stringField',
            bind: '{curChild.field1}',
            fieldLabel: 'Field 1',
            width: 300
        }, {
            xtype: 'label',
            flex: 1,
            text: 'should be an email in correct format'
        }]
    }, {
        xtype: 'container',
        layout: 'hbox',
        defaults: {
            margin: 5
        },
        items: [{
            xtype: 'textfield',
            bind: '{curChild.field2}',
            name: 'field2',
            fieldLabel: 'Field 2',
            width: 300
        }, {
            xtype: 'label',
            flex: 1,
            text: ''
        }]
    }, {
        xtype: 'container',
        layout: 'hbox',
        defaults: {
            margin: 5
        },
        items: [{
            xtype: 'textfield',
            bind: '{curChild.field3}',
            name: 'field3',
            fieldLabel: 'Field 3',
            width: 300
        }, {
            xtype: 'label',
            flex: 1,
            text: ''
        }]
    }]

});
Ext.define('demo.Controller', {
    extend: 'Ext.ux.util.DynamicViewController',
    alias: 'controller.demo',

    onBindModelClick: function () {
        this.model = new demo.MainModel(null, null, {eagerNetsedInstantiation: true});
        this.getViewModel().set('model', this.model);
        this.model.setId(1);
        this.model.load();
        this.getViewModel().bind('{curChild}', function (v) {
            if (v) {
                console.log(v.get('stringField'));
            }
        });
        (new DynamicComponentQuery(this.lookupReference('metacontrols'), 'checkbox')).enable();
    },

    onAddRowClick: function () {
        this.model.children().add(new demo.StoreModel());
    },

    onValidateClick: function () {
        this.model.validate({ validatePresence: true }).then(function (result) { alert(result.errors.join(';')); });
    },

    onField1RequiredChange: function (ctrl, value) {
        this.model.setMetaValue('stringField', 'required', value);
    },

    onField1ReadOnlyChange: function (ctrl, value) {
        this.model.setMetaValue('stringField', 'readOnly', value);
    },

    onField2RequiredChange: function (ctrl, value) {
        this.model.setMetaValue('field2', 'required', value);
    }
});

Ext.define('demo.Grid', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.demogrid',
    plugins: ['gridmetadatabinding', {
        ptype: 'cellediting',
        clicksToEdit: 1
    }],

    bind: {
        store: '{model.children}',
        selection: '{curChild}'
    },

    dockedItems: [{
        xtype: 'textfield',
        name: 'stringField',
        bind: '{model.nested.field1}',
        margin: 5,
        fieldLabel: 'Nested Field 1'
    }, {
        xtype: 'textfield',
        bind: '{model.nested.field2}',
        name: 'field2',
        margin: 5,
        fieldLabel: 'Nested Field 2'
    }, {
        xtype: 'textfield',
        bind: '{model.nested.field3}',
        name: 'field3',
        margin: 5,
        fieldLabel: 'Nested Field 3'
    }],

    columns: [{
        dataIndex: 'stringField',
        text: 'stringField',
        editor: 'textfield'
    }, {
        dataIndex: 'field2',
        text: 'field2',
        editor: 'textfield'
    }, {
        dataIndex: 'field3',
        text: 'field3',
        editor: 'textfield'
    }]
});
Ext.define('demo.MainPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.demomainpanel',
    layout: {
        type: 'vbox'
    },
    viewModel: 'test',
    plugins: ['metadatabinding'],
    controller: 'demo',
    defaults: {
        width: 800
    },

    items: [{
        xtype: 'container',
        width: 800,
        layout: 'hbox',
        reference: 'metacontrols',
        defaults: {
            margin: 5
        },
        items: [{
            xtype: 'button',
            text: 'Create And Bind Model',
            listeners: {
                click: 'onBindModelClick'
            }
        }, {
            xtype: 'button',
            text: 'Add grid row',
            listeners: {
                click: 'onAddRowClick'
            }
        }, {
            xtype: 'button',
            text: 'Validate',
            listeners: {
                click: 'onValidateClick'
            }
        }, {
            xtype: 'checkbox',
            fieldLabel: 'Field 1 required',
            disabled: true,
            value: true,
            listeners: {
                change: 'onField1RequiredChange'
            }
        }, {
            xtype: 'checkbox',
            value: false,
            disabled: true,
            fieldLabel: 'Field 1 readOnly',
            listeners: {
                change: 'onField1ReadOnlyChange'
            }
        }, {
            xtype: 'checkbox',
            value: true,
            disabled: true,
            fieldLabel: 'Field 2 required',
            listeners: {
                change: 'onField2RequiredChange'
            }
        }]
    }, {
        xtype: 'container',
        layout: 'hbox',
        defaults: {
            margin: 5
        },
        items: [{
            xtype: 'textfield',
            name: 'stringField',
            fieldLabel: 'Field 1',
            bind: '{model.field1}',
            width: 300
        }, {
            xtype: 'label',
            flex: 1,
            text: '"badvalue" is invalid (deferred validation)'
        }]
    }, {
        xtype: 'container',
        layout: 'hbox',
        defaults: {
            margin: 5
        },
        items: [{
            xtype: 'textfield',
            name: 'field2',
            bind: '{model.field2}',
            fieldLabel: 'Field 2',
            width: 300
        }, {
            xtype: 'label',
            flex: 1,
            text: '"excluded" is in exclusion list, "invalidvalue" is also invalid (deferred validation)'
        }]
    }, {
        xtype: 'container',
        layout: 'hbox',
        defaults: {
            margin: 5
        },
        items: [{
            xtype: 'textfield',
            name: 'field4',
            bind: '{model.field4}',
            fieldLabel: 'Field 4',
            width: 300
        }, {
            xtype: 'label',
            flex: 1,
            text: 'email field'
        }]
    }, {
        xtype: 'container',
        layout: 'hbox',
        defaults: {
            margin: 5
        },
        items: [{
            xtype: 'textfield',
            name: 'field5',
            bind: '{model.field5}',
            fieldLabel: 'Field 5',
            width: 300
        }, {
            xtype: 'label',
            flex: 1,
            text: 'email field'
        }]
    }, {
        xtype: 'container',
        layout: 'hbox',
        defaults: {
            margin: 5
        },
        items: [{
            xtype: 'textfield',
            name: 'stringField',
            bind: '{model.field1}',
            fieldLabel: 'One more field 1',
            width: 300
        }, {
            xtype: 'label',
            flex: 1,
            text: '"badvalue" is invalid (deferred validation)'
        }]
    }, {
        xtype: 'container',
        layout: 'hbox',
        defaults: {
            margin: 5
        },
        items: [{
            xtype: 'textfield',
            name: 'field2',
            bind: '{model.field2}',
            fieldLabel: 'One more field 2',
            width: 300
        }, {
            xtype: 'label',
            flex: 1,
            text: '"excluded" is in exclusion list, "invalidvalue" is also invalid (deferred validation)'
        }]
    }, {
        xtype: 'container',
        layout: 'hbox',
        defaults: {
            margin: 5
        },
        items: [{
            xtype: 'checkbox',
            name: 'field3',
            bind: '{model.meta.field2.readOnly}',
            fieldLabel: 'Field 3',
            width: 300
        }, {
            xtype: 'label',
            flex: 1,
            text: 'Controls readOnly state of "field2"'
        }]
    }, {
        xtype: 'demogrid',
        height: 200
    }, {
        xtype: 'detailspanel',
        reference: 'details',
        title: 'Details'
    }]

});
Ext.define('demo.Viewport', {
    extend: 'Ext.container.Viewport',
    alias: 'widget.demoviewport',
    layout: 'fit',

    items: [{
        xtype: 'demomainpanel'
    }]
});
//Ext.Loader.setConfig({
//    enabled: true,
//    disableCaching: true
//});

Ext.application({
    name: "App",
    launch: function () {
        Ext.create('demo.Viewport', {});
    }
});