Ext.define('demo.MainPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.demomainpanel',
    layout: {
        type: 'vbox'
    },
    plugins: ['databinding'],
    controller: 'demo',
    defaults: {
        width: 800
    },

    items: [{
        xtype: 'container',
        width: 800,
        layout: 'hbox',
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
            value: true,
            listeners: {
                change: 'onField1RequiredChange'
            }
        }, {
            xtype: 'checkbox',
            value: false,
            fieldLabel: 'Field 1 readOnly',
            listeners: {
                change: 'onField1ReadOnlyChange'
            }
        }, {
            xtype: 'checkbox',
            value: true,
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
            name: 'field1',
            fieldLabel: 'Field 1',
            width: 300
        }, {
            xtype: 'label',
            flex: 1,
            text: '"badvalue" is invalid'
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
            text: '"excluded" is in exclusion list, "invalidvalue" is also invalid'
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
            fieldLabel: 'One more field 1',
            width: 300
        }, {
            xtype: 'label',
            flex: 1,
            text: '"badvalue" is invalid'
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
            fieldLabel: 'One more field 2',
            width: 300
        }, {
            xtype: 'label',
            flex: 1,
            text: '"excluded" is in exclusion list, "invalidvalue" is also invalid'
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
            fieldLabel: 'Field 3',
            width: 300
        }, {
            xtype: 'label',
            flex: 1,
            text: 'Controls readOnly state of "field2"'
        }]
    }, {
        xtype: 'demogrid',
        height: 500,
        dataField: 'field4',
        storeDataField: 'field4'
    }]

});