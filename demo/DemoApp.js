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