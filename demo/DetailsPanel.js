Ext.define('demo.DetailsPanel', {
    extend: 'Ext.form.FieldSet',
    alias: 'widget.detailspanel',
    layout: {
        type: 'vbox'
    },
    plugins: ['databinding'],
    controller: 'details',

    listeners: {
        modelbound: 'onModelBound'
    },

    items: [{
        xtype: 'container',
        reference: 'metacontrols',
        disabled: true,
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
            name: 'field1',
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