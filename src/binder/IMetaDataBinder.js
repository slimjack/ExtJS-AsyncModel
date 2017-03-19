//https://github.com/slimjack/ExtJs-AsyncModel

Ext.defineInterface('IMetaDataBinder', {
    inherit: 'ISingleton',
    methods: [
        'isApplicable',
        'onComponentBound',
        'onComponentUnbound',
        'applyMetaData'//(control, metaDataFieldName, metaValue, model, fieldName)
    ],
    properties: [
        { name: 'listenedMetaDataNames', readOnly: true },
        { name: 'metaDataName', readOnly: true }
    ]
});