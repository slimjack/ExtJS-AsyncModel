//https://github.com/slimjack/ExtJs-AsyncModel

Ext.defineInterface('IGridMetaDataBinder', {
    inherit: 'ISingleton',
    methods: [
        'onInit',
        'onDestroy',
        'onRender'
    ]
});