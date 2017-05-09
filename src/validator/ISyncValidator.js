Ext.defineInterface('Ext.ux.validator.ISyncValidator', {
    methods: [
        /**
         * Validates record field synchronously.
         * @param {Object} fieldValue Field value to validate
         * @param {String} fieldName Field name beign validated
         * @param {Ext.ux.data.AsyncModel} record Model record which the field belongs to
         * @param {Object} options Validation options. Options can be passed while forcibly validating the record. Standard options:
         * @param {Boolean} [options.validatePresence=false] If set, field shall be validated against presense requirements like required, desired.
         * @return {Object} Result:
         * @return {String} return.error Error message
         * @return {String} return.info Info message
         */
        'validateSync'
    ]
});