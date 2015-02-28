Ext.define('demo.MainPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.demomainpanel',
    layout: 'vbox',
    plugins: ['databinding'],
    controller: 'demo',

    items: [{
        xtype: 'container',
        layout: 'hbox',
        items: [{
            xtype: 'button',
            text: 'Create And Bind Model',
            listeners: {
                click: 'onBindModelClick'  // no scope given here
            }
        }, {
            xtype: 'button',
            text: 'Add grid row',
            listeners: {
                click: 'onAddRowClick'  // no scope given here
            }
        }, {
            xtype: 'button',
            text: 'Validate',
            listeners: {
                click: 'onValidateClick'  // no scope given here
            }
        }]
    }, {
        xtype: 'textfield',
        name: 'field1',
        fieldLabel: 'Nested Field 1'
    }, {
        xtype: 'textfield',
        name: 'field2',
        fieldLabel: 'Nested Field 2'
    }, {
        xtype: 'textfield',
        name: 'field3',
        fieldLabel: 'Nested Field 3'
    }, {
        xtype: 'demogrid',
        dataField: 'field4',
        storeDataField: 'field4'
    }]

});