//https://github.com/slimjack/ExtJs-AsyncModel

//Ext.ux.data.AsyncStore can be used only with Ext.ux.data.AsyncModel
Ext.define('Ext.ux.data.AsyncStore', {
    statics: {
        decorate: function (store) {
            Ext.override(store, {
                isAsyncStore: true,
                _businessLogicSyncCallbacks: [],
                _stateCounter: 0,
                _validationStateCounter: 0,

                //region Public methods
                getStateCounter: function () {
                    var me = this;
                    return me._stateCounter;
                },

                applyModelConfig: function (config) {
                    var me = this;
                    me._modelConfig = config;
                    me.each(function (record) {
                        Ext.apply(record, config);
                    });
                },

                syncWithBusinessRules: function (callback) {
                    var me = this;
                    me.businessRulesSyncCounter = me.count();
                    var recordBusinessLogicCompletedCallback = function () {
                        me.onRecordBusinessLogicCompleted();
                    };
                    me.each(function (record) {
                        record.syncWithBusinessRules(recordBusinessLogicCompletedCallback);
                    });
                    if (me.businessRulesSyncCounter === 0) {
                        Ext.callback(callback);
                    } else {
                        me._businessLogicSyncCallbacks.push(callback);
                    }
                },

                clear: function () {
                    var me = this;
                    me.removeAll();
                    Ext.Array.erase(me._validationCallbacks, 0, me._validationCallbacks.length);
                },

                validate: function (options, originalValidation) {
                    var me = this;
                    options = options || {};

                    var currentValidationStateCounter = me._validationStateCounter;
                    var currentValidationOptionsSnapshot = JSON.stringify(options);
                    var newValidation = currentValidationStateCounter !== me._lastValidationStateCounter
                        || currentValidationOptionsSnapshot !== me._lastValidationOptionsSnapshot;
                    if (newValidation) {
                        if (!originalValidation) {
                            me._lastValidationOptionsSnapshot = currentValidationOptionsSnapshot;
                            originalValidation = new Ext.Deferred();
                            me._lastValidation = originalValidation;
                        }
                        me.syncWithBusinessRules(function () {
                            var recordValidations = [];
                            me.each(function (record) {
                                recordValidations.push(record.validate(options));
                            });
                            Ext.Promise.all(recordValidations).then(function (validationResults) {
                                if (currentValidationStateCounter === me._validationStateCounter) {
                                    if (currentValidationOptionsSnapshot === me._lastValidationOptionsSnapshot) {
                                        me._lastValidationStateCounter = currentValidationStateCounter;
                                    }
                                    originalValidation.resolve({
                                        errors: Ext.Array.flatten(Ext.Array.map(validationResults, function (validationResult) { return validationResult.errors; })),
                                        infos: Ext.Array.flatten(Ext.Array.map(validationResults, function (validationResult) { return validationResult.infos; }))
                                    });
                                } else {
                                    me.validate(options, originalValidation);
                                }
                            });
                        });
                        return originalValidation.promise;
                    }
                    return me._lastValidation.promise;
                },

                resetMetaData: function () {
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
                    delete me._lastValidation;
                    delete me._lastValidationStateCounter;
                    delete me._lastValidationOptionsSnapshot;
                },

                isValid: function (options) {
                    var me = this;
                    return me.validate(options).then(function (validationResult) { return !validationResult.errors; })
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

                onStoreUpdated: function () {
                    var me = this;
                    me._stateCounter++;
                    me._validationStateCounter++;
                },

                onStoreDataChanged: function () {
                    var me = this;
                    me._stateCounter++;
                },
                //endregion

                //region Overrides
                createModel: function () {
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

            store.on('update', store.onStoreUpdated, store)
            store.on('datachanged', store.onStoreDataChanged, store)
        }
    }
});