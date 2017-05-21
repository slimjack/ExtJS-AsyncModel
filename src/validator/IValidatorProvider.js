Ext.defineInterface('Ext.ux.validator.IValidatorProvider', {
    inherit: 'ISingleton',
    methods: [
        /**
         * Returns validator for the field if it is applicable.
         * @param {Object} fieldDescriptor Descriptor of the field to wire up the validator to
         * @return {Ext.ux.validator.IAsyncValidator/Ext.ux.validator.ISyncValidator/null} validator or null if validator is not applicable
         */
        'getValidator'
    ]
});