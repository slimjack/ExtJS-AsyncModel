Ext.define('demo.Viewport', {
    extend: 'Ext.container.Viewport',
    alias: 'widget.demoviewport',
    layout: 'fit',

    items: [{
        xtype: 'demomainpanel'
    }]
});