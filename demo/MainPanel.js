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
        fieldLabel: 'Field 1'
    }, {
        xtype: 'textfield',
        name: 'field2',
        fieldLabel: 'Field 2'
    }, {
        xtype: 'checkbox',
        name: 'field3',
        fieldLabel: 'Field 3'
    }, {
        xtype: 'demogrid',
        height: 500,
        width: 500,
        dataField: 'field4',
        storeDataField: 'field4',
        layout: 'fit'
    }]

});