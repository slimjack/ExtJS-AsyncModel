Ext.define('demo.Grid', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.demogrid',
    plugins: ['griddatabinding', {
        ptype: 'cellediting',
        clicksToEdit: 1
    }],
    store: new Ext.data.Store(),

    dockedItems: [{
        xtype: 'textfield',
        name: 'field1',
        margin: 5,
        fieldLabel: 'Nested Field 1'
    }, {
        xtype: 'textfield',
        name: 'field2',
        margin: 5,
        fieldLabel: 'Nested Field 2'
    }, {
        xtype: 'textfield',
        name: 'field3',
        margin: 5,
        fieldLabel: 'Nested Field 3'
    }],

    columns: [{
        dataIndex: 'field1',
        text: 'field1',
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