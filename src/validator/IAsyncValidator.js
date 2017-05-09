Ext.defineInterface('Ext.ux.validator.IAsyncValidator', {
    methods: [
        /**
         * Validates record field in asynchronous way.
         * @param {Object} fieldValue Field value to validate
         * @param {String} fieldName Field name beign validated
         * @param {Ext.ux.data.AsyncModel} record Model record which the field belongs to
         * @param {Object} options Validation options. Options can be passed while forcibly validating the record. Standard options:
         * @param {Boolean} [options.validatePresence=false] If set, field shall be validated against presense requirements like required, desired.
         * @return {Ext.Promise} Async result.
         * @return {Object} return.resolve Successful result:
         * @return {String} return.resolve.error Error message
         * @return {String} return.resolve.info Info message
         * @return {String} return.reject Failure message
         */
        'validateAsync'
    ]
});