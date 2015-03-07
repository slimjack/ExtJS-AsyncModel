//https://github.com/slimjack/ExtJs-AsyncModel

//Ext.ux.data.AsyncStore can be used only with Ext.ux.data.AsyncModel
Ext.define('Ext.ux.data.AsyncStore', {
    extend: 'Ext.data.Store',
    selectionModel: null,
    current: null,

    constructor: function () {
        var me = this;
        me._validationCallbacks = [];
        me._businessLogicSyncCallbacks = [];
        me.callParent(arguments);
        me.recordBusinessLogicCompletedCallback = function () {
            me.onRecordBusinessLogicCompleted();
        };
    },

    //region Public methods
    applyModelConfig: function(config) {
        var me = this;
        me._modelConfig = config;
        me.each(function (record) {
            Ext.apply(record, config);
        });
    },

    syncWithBusinessRules: function (callback) {
        var me = this;
        me.businessRulesSyncCounter = me.count();
        me.each(function (record) {
            record.syncWithBusinessRules(me.recordBusinessLogicCompletedCallback);
        });
        if (me.businessRulesSyncCounter === 0) {
            Ext.callback(callback);
        } else {
            me._businessLogicSyncCallbacks.push(callback);
        }

    },

    getRawData: function (options) {
        var me = this;
        var result = [];
        me.each(function (record) {
            result.push(record.getData(options));
        });
        return result;
    },

    clear: function () {
        var me = this;
        me.removeAll();
        Ext.Array.erase(me._validationCallbacks, 0, me._validationCallbacks.length);
    },

    validate: function (options, callback) {
        var me = this;
        if (callback) {
            me._validationCallbacks.push(callback);
        }
        if (me.isValidating) {
            return;
        }
        var syncCounter = me.count();
        var resultErrorMessages = [];
        var resultInfoMessages = [];
        var recordValidationCallback = function (errorMessages, infoMessages) {
            resultErrorMessages = resultErrorMessages.concat(errorMessages);
            resultInfoMessages = resultInfoMessages.concat(infoMessages);
            syncCounter--;
            if (syncCounter === 0) {
                me.isValidating = false;
                if (me.isValidated()) {
                    me.onStoreValidated(resultErrorMessages, resultInfoMessages);
                } else {
                    me.validate(options);
                }
            }
        };
        if (syncCounter) {
            me.isValidating = true;
            me.each(function (record) {
                record.validate(options, recordValidationCallback);
            });
        } else {
            me.onStoreValidated(resultErrorMessages, resultInfoMessages);
        }
    },

    resetMetaData: function() {
        var me = this;
        me.each(function (record) {
            record.resetMetaData();
        });
    },

    resetValidation: function () {
        var me = this;
        me.each(function (record) {
            record.resetValidation();
        });
        Ext.Array.erase(me._validationCallbacks, 0, me._validationCallbacks.length);
    },

    isValidated: function () {
        var me = this;
        var isValidated = true;
        me.each(function (record) {
            isValidated = record.isValidated();
            if (!isValidated) {
                return false;
            }
        });
        return isValidated;
    },

    isValid: function () {
        var me = this;
        var isValid = true;
        me.each(function (record) {
            isValid = record.isValid();
            if (!isValid) {
                return false;
            }
        });
        return isValid;
    },

    getAllValidationInfo: function () {
        var me = this;
        var result = [];
        me.each(function (record) {
            result.push(record.getAllValidationInfo());
        });
        return result;
    },
    //endregion

    //region Protected methods
    onRecordBusinessLogicCompleted: function () {
        var me = this;
        me.businessRulesSyncCounter--;
        if (me.businessRulesSyncCounter === 0) {
            me.onBusinessLogicCompleted();

        }
    },

    onBusinessLogicCompleted: function () {
        var me = this;
        Ext.each(me._businessLogicSyncCallbacks, function (businessLogicSyncCallback) {
            Ext.callback(businessLogicSyncCallback);
        });
        Ext.Array.erase(me._businessLogicSyncCallbacks, 0, me._businessLogicSyncCallbacks.length);
    },

    onStoreValidated: function (resultErrorMessages, resultInfoMessages) {
        var me = this;
        Ext.each(me._validationCallbacks, function (validationCallback) {
            validationCallback(resultErrorMessages, resultInfoMessages);
        });
        Ext.Array.erase(me._validationCallbacks, 0, me._validationCallbacks.length);
    },
    //endregion

    //region Overrides
    createModel: function() {
        var me = this;
        var result = me.callParent(arguments);
        if (me._modelConfig) {
            Ext.apply(result, me._modelConfig);
        }
        return result;
    },
    //endregion

    //region Private methods
    afterMetaDataChange: function (record, modifiedFieldNames) {
        this.getData().itemChanged(record, modifiedFieldNames || null, undefined, Ext.data.Model.METACHANGE);
    },

    afterValidChange: function (record, modifiedFieldNames) {
        this.getData().itemChanged(record, modifiedFieldNames || null, undefined, Ext.data.Model.VALIDCHANGE);
    }
    //endregion

});