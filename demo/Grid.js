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