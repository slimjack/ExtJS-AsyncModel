//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.AsyncModel', {
    extend: 'Ext.data.Model',

    mixins: [
        'Ext.util.Observable'
    ],

    validateOnChange: true,
    validateOnMetaDataChange: false,
    defaultFieldErrorMessage: 'Value is invalid',
    defaultModelErrorMessage: 'Some fields have incorrect data',

    _businessRulesSyncCounter: 0,
    _suppressBusinessLogic: 0,
    _suppressValidation: 0,
    _suppressValidChangeEvent: 0,
    _suppressChangeEvent: 0,
    _modelState: 0,
    _errorMessage: '',
    _infoMessage: '',
    _defaultProxy: {
        type: 'memory'
    },
    _defaultMetaDataValidatorsMap: {
        required: {
            config: 'required',
            fieldConfigReplications: ['requiredMessage']
        }
    },

    //region Initialization
    constructor: function (data) {
        var me = this;
        me.mixins.observable.constructor.call(me);
        me.validationRules = me.validationRules || {};
        me.businessRules = me.businessRules || {};
        me.proxy = me.proxy || me._defaultProxy;

        me._ignoredFieldNames = [];
        me._modifiedNestedFieldNames = [];
        me._validationCallbacks = [];
        me._businessLogicSyncCallbacks = [];
        me._defaultMetaDataModel = {
            required: false,
            readOnly: false,
            validationErrorMessages: [],
            validationInfoMessages: []
        };

        me._suppressValidation++;
        me.initMetaData();
        me.callParent(arguments);
        me.initBusinessRules();
        me.initFields();
        me.initValidationModel();
        me._suppressValidation--;

        me.join({
            afterEdit: function () {
                var args = Array.prototype.slice.call(arguments, 0);
                args.shift();
                me.afterEdit.apply(me, args);
            }
        });
        if (data) {
            me.onLoad();
        }
    },

    initFields: function () {
        var me = this;
        var data = me.data;
        Ext.Array.each(me.fields, function (field) {
            if (field.isStoreField || field.isModelField) {
                if (!data[field.name]) {
                    data[field.name] = field.convert(null, me);
                }
                if (field.isModelField) {
                    me.subscribeNestedModel(data[field.name], field.name);
                    data[field.name].validateOnChange = me.validateOnChange;
                    data[field.name].validateOnMetaDataChange = me.validateOnMetaDataChange;
                } else {
                    me.subscribeNestedStore(data[field.name], field.name);
                    data[field.name].applyModelConfig({
                        validateOnChange: me.validateOnChange,
                        validateOnMetaDataChange: me.validateOnMetaDataChange
                    });
                }
            }
        });
    },

    initMetaData: function () {
        var me = this;
        me._metaDataModel = Ext.apply({}, me.metaDataModel, me._defaultMetaDataModel);
        me._metaData = {};
        Ext.Array.each(me.fields, function (field) {
            if (field.name !== me.idProperty) {
                me._metaData[field.name] = {};
                Ext.Object.each(me._metaDataModel, function (metaName, metaValue) {
                    field[metaName] = field[metaName] || metaValue;//initial meta value
                    me._metaData[field.name][metaName] = field[metaName] || metaValue;
                });
            }
        });
    },

    initValidationModel: function () {
        var me = this;
        me._metaDataValidatorsMap = Ext.apply({}, MetaDataValidatorMapper.getValidatorsMap(), me.metaDataValidatorsMap);
        me._metaDataValidatorsMap = Ext.applyIf(me._metaDataValidatorsMap, me._defaultMetaDataValidatorsMap);
        Ext.Object.each(me._metaDataValidatorsMap, function(metaDataName, mapRecord) {
            mapRecord.activationRule = mapRecord.activationRule || function (model, fieldName) {
                return !!model.getMeta(fieldName, metaDataName);
            };
        });
        var emptyOptions = JSON.stringify({});
        me._validationModel = {};
        me._validationRules = {};
        Ext.Array.each(me.fields, function (field) {
            if (field.name !== me.idProperty) {
                me._validationModel[field.name] = {
                    isValidated: true,
                    isValidating: false,
                    lastValidatingOptions: emptyOptions,
                    callbacks: [],
                    dependentFieldNames: field.dependentFields || []
                };
                me._validationRules[field.name] = me.createValidationRule(field.name);
            }
        });
    },

    initBusinessRules: function () {
        var me = this;
        me._businessRuleCompletedCallback = Ext.bind(me.onBusinessRuleCompleted, me);
        me._businessRules = {};
        Ext.Array.each(me.fields, function (field) {
            if (field.name === me.idProperty) { return; }

            var changeRuleName = field.name + 'Change';
            var changeRule = me.businessRules[changeRuleName];
            if (changeRule) {
                me._businessRules[changeRuleName] = me.createAsyncRule(changeRule, me.defaultBusinessService);
            }
            var validChangeRuleName = field.name + 'ValidChange';
            var validChangeRule = me.businessRules[validChangeRuleName];
            if (validChangeRule) {
                me._businessRules[validChangeRuleName] = me.createAsyncRule(validChangeRule, me.defaultBusinessService);
            }
        });
    },
    //endregion

    //region Public methods
    getMetaDataNames: function() {
        var me = this;
        var result = [];
        Ext.Object.each(me._metaDataModel, function (metaDataName) {
            result.push(metaDataName);
        });
        return result;
    },

    syncWithBusinessRules: function (callback) {
        var me = this;
        me._businessRulesSyncCounter += (me.fields.length - 1);
        Ext.Array.each(me.fields, function (field) {
            if (field.name === me.idProperty) { return; }
            if (field.isStoreField || field.isModelField) {
                me.get(field.name).syncWithBusinessRules(me._businessRuleCompletedCallback);
            } else {
                me._businessRulesSyncCounter--;
            }
        });
        if (me._businessRulesSyncCounter === 0) {
            callback();
        } else {
            me._businessLogicSyncCallbacks.push(callback);
        }
    },

    loadData: function (data) {
        var me = this;
        if (!data) {
            return;
        }
        me.syncWithBusinessRules(function () {
            me.resetValidation();
            me._suppressValidation++;
            me._suppressBusinessLogic++;
            me.resetMetaData();
            me.clearAllFields();
            me.beginEdit();
            me.fields.each(function (field) {
                if (field.isStoreField || field.isModelField) {
                    me.set(field.name, data[field.name]);
                } else {
                    me.get(field.name).loadData(data[field.name]);
                }
            });
            me.endEdit();
            me.commit(true);
            me._suppressBusinessLogic--;
            me._suppressValidation--;
            me.onLoad();
        });
    },

    runBusinessLogic: function (businessFn, syncWithBusinessRules) {
        var me = this;
        if (syncWithBusinessRules) {
            me.syncWithBusinessRules(function () {
                me._businessRulesSyncCounter++;
                businessFn(me._businessRuleCompletedCallback);
            });
        } else {
            me._businessRulesSyncCounter++;
            businessFn(me._businessRuleCompletedCallback);
        }
    },

    clear: function (excludedFields) {
        var me = this;

        me.syncWithBusinessRules(function () {
            me.resetValidation();
            me.resetMetaData();
            me._suppressValidation++;
            me._suppressBusinessLogic++;
            me.clearAllFields(excludedFields);
            me.onClear();
            me._suppressBusinessLogic--;
            me._suppressValidation--;
        });
    },

    validate: function (options, callback) {
        var me = this;
        options = options || {};
        if (callback) {
            me._validationCallbacks.push(callback);
        }
        if (me.isValidating) {
            return;
        }
        me.isValidating = true;
        me.syncWithBusinessRules(function () {
            var resultErrorMessages = [];
            var resultInfoMessages = [];
            var syncCounter = me.getNumOfFields() + me.getNumOfComplexFields();
            var fieldCallback = function (errorMessages, infoMessages) {
                resultErrorMessages = resultErrorMessages.concat(errorMessages);
                resultInfoMessages = resultInfoMessages.concat(infoMessages);
                syncCounter--;
                if (syncCounter === 0) {
                    me.isValidating = false;
                    if (me.isValidated()) {
                        me.onModelValidated(resultErrorMessages, resultInfoMessages);
                    } else {
                        me.validate(options);
                    }
                }
            };
            if (Ext.isFunction(me.onValidate)) {
                syncCounter++;
                me.onValidate(options, function (errorMessage, infoMessage) {
                    me._errorMessage = errorMessage;
                    me._infoMessage = infoMessage;
                    fieldCallback([errorMessage], [infoMessage]);
                });
            }
            Ext.Array.each(me.fields, function (field) {
                if (field.name === me.idProperty) { return; }
                me.validateField(field.name, options, fieldCallback);
                if (field.isStoreField || field.isModelField) {
                    me.get(field.name).validate(options, fieldCallback);
                }
            });
        });
    },

    validateField: function (fieldName, options, callback) {
        var me = this;
        options = options || {};
        me.performValidation(fieldName, options, callback);
    },

    resetValidation: function () {
        var me = this;
        me._errorMessage = '';
        me._infoMessage = '';
        Ext.Array.each(me.fields, function (field) {
            if (field.name === me.idProperty) { return; }

            me.resetFieldValidation(field.name);
            if (field.isStoreField || field.isModelField) {
                me.get(field.name).resetValidation();
            }
        });
        Ext.Array.erase(me._validationCallbacks, 0, me._validationCallbacks.length);
    },

    isValidated: function () {
        var me = this;
        if (me.isValidating) {
            return false;
        }
        var isValidated = true;
        Ext.Array.each(me.fields, function (field) {
            if (field.name === me.idProperty) { return; }

            var fieldValidationModel = me._validationModel[field.name];
            isValidated = fieldValidationModel.isValidated;
            if (isValidated && (field.isStoreField || field.isModelField)) {
                isValidated = me.get(field.name).isValidated();
            }
            if (!isValidated) {
                return false;
            }
        });
        return isValidated;
    },

    isValid: function () {
        var me = this;
        var isValid = !me._errorMessage;
        if (isValid) {
            Ext.Array.each(me.fields, function(field) {
                if (field.name === me.idProperty) { return; }

                isValid = !me.getMeta(field.name, 'validationErrorMessages').length;
                if (isValid && (field.isStoreField || field.isModelField)) {
                    isValid = me.get(field.name).isValid();
                }
                if (!isValid) {
                    return false;
                }
            });
        }
        return isValid;
    },

    setMeta: function (fieldName, metaDataFieldName, value, suppressValidation) {
        var me = this;
        if (metaDataFieldName === 'validationErrorMessages' || metaDataFieldName === 'validationInfoMessages') {
            Ext.Error.raise('Direct set of "validationErrorMessages" or "validationInfoMessages" is forbidden');
        }
        me.setMetaInternal(fieldName, metaDataFieldName, value, suppressValidation);
    },

    setDefaultMeta: function (fieldName, metaDataFieldName, value, suppressValidation) {
        var me = this;
        var targetField = me.getField(fieldName);
        if (targetField) {
            targetField[metaDataFieldName] = value;
            me.setMeta(fieldName, metaDataFieldName, value, suppressValidation);
        }
    },

    getMeta: function (fieldName, metaDataFieldName) {
        var me = this;
        return me._metaData[fieldName][metaDataFieldName];
    },

    resetMetaData: function () {
        var me = this;
        me._suppressValidation++;
        Ext.Array.each(me.fields, function (field) {
            if (field.name !== me.idProperty) {
                Ext.Object.each(me._metaData[field.name], function (metaName) {
                    if (metaName !== 'validationErrorMessages' || metaName !== 'validationInfoMessages') {
                        me.setMeta(field.name, metaName, field[metaName]);
                    }
                });
                if (field.isStoreField || field.isModelField) {
                    me.get(field.name).resetMetaData();
                }
            }
        });
        me._suppressValidation--;
    },

    getFieldValidationInfo: function (fieldName) {
        var me = this;
        if (fieldName !== me.idProperty) {
            var field = me.getField(fieldName);
            var fieldValidationModel = me._validationModel[fieldName];
            return {
                isValidated: fieldValidationModel.isValidated,
                isValidating: fieldValidationModel.isValidating,
                validationErrorMessages: me.getMeta(fieldName, 'validationErrorMessages'),
                validationInfoMessages: me.getMeta(fieldName, 'validationInfoMessages'),
                subInfo: (field.isStoreField || field.isModelField) ? me.get(fieldName).getAllValidationInfo() : null
            };
        } else {
            return null;
        }
    },

    getAllValidationInfo: function () {
        var me = this;
        var result = {};
        Ext.Object.each(me.validationModel, function (fieldName, validationInfo) {
            result[fieldName] = me.getFieldValidationInfo(fieldName);
        });
        return result;
    },

    //endregion

    //region Protected methods
    onModelValidated: function (errorMessages, infoMessages) {
        var me = this;
        Ext.each(me._validationCallbacks, function (validationCallback) {
            validationCallback(errorMessages, infoMessages);
        });
        Ext.Array.erase(me._validationCallbacks, 0, me._validationCallbacks.length);
    },

    onFieldValidated: function (fieldName) {
        var me = this;
        var fieldValidationModel = me._validationModel[fieldName];
        fieldValidationModel.isValidating = false;
        fieldValidationModel.isValidated = true;
        me.executeFieldValidationCallbacks(fieldName);
        var errorMessages = me.getMeta(fieldName, 'validationErrorMessages');
        var infoMessages = me.getMeta(fieldName, 'validationInfoMessages');
        me.fireEvent('validated', me, fieldName, errorMessages, infoMessages);
        me.afterValidated([fieldName]);
        if (!errorMessages.length && !me._suppressValidChangeEvent) {
            me.onValidChange(fieldName);
        }
    },

    onValidChange: function (fieldName) {
        var me = this;
        if (!me._suppressBusinessLogic) {
            me.runBusinessRule(fieldName, 'ValidChange');
        }
        me.fireEvent('validchange', me, fieldName);
        me.afterValidChange([fieldName]);
        var fieldValidationModel = me._validationModel[fieldName];
        Ext.each(fieldValidationModel.dependentFieldNames, function (dependentFieldName) {
            me.resetFieldValidity(dependentFieldName);
        });
    },

    onLoad: Ext.emptyFn,

    onClear: Ext.emptyFn,

    onModelChange: function (modifiedFieldNames) {
        var me = this;
        me._modelState++;
        Ext.each(modifiedFieldNames, function (fieldName) {
            if (!me._suppressBusinessLogic) {
                me.runBusinessRule(fieldName, 'Change');
            }
        });
        if (!me._suppressChangeEvent) {
            me.fireChangeEvent(modifiedFieldNames);
        }
        if (!me._suppressValidation) {
            me.resetValidity(modifiedFieldNames);
        }
    },

    onMetaDataChange: function (fieldName, metaDataFieldName, value) {
        var me = this;

        me.fireEvent('metadatachange', me, fieldName, metaDataFieldName, value);
        if (!me._suppressValidation
            && me.validateOnMetaDataChange
            && (metaDataFieldName !== 'validationErrorMessages')
            && (metaDataFieldName !== 'validationInfoMessages')) {

            me._modelState++;
            me.resetFieldValidity(fieldName);
        }
        me.afterMetaDataChange([fieldName]);
    },

    onBusinessRuleCompleted: function () {
        var me = this;
        me._businessRulesSyncCounter--;
        if (me._businessRulesSyncCounter === 0) {
            me.onBusinessLogicCompleted();
        }
    },

    onBusinessLogicCompleted: function () {
        var me = this;
        Ext.each(me._businessLogicSyncCallbacks, function (businessLogicSyncCallback) {
            businessLogicSyncCallback();
        });
        Ext.Array.erase(me._businessLogicSyncCallbacks, 0, me._businessLogicSyncCallbacks.length);
    },
    //endregion

    //region Ext.data.Model overrides

    endEdit: function (silent, modifiedFieldNames) {
        var me = this;
        if (!modifiedFieldNames) {
            modifiedFieldNames = me.getModifiedFieldNames();
            modifiedFieldNames = modifiedFieldNames.concat(me._modifiedNestedFieldNames);
        }
        me.callParent([silent, modifiedFieldNames]);
        me._modifiedNestedFieldNames = [];
    },

    cancelEdit: function () {
        var me = this;
        me._modifiedNestedFieldNames = [];
        me.callParent(arguments);
    },

    afterEdit: function (modifiedFieldNames) {
        var me = this;
        me.onModelChange(modifiedFieldNames);
    },

    getData: function (options) {
        var me = this;
        options = options || {};
        var result = me.callParent(arguments);
        delete result[me.idProperty];
        var thisModelData = me.data;
        Ext.Array.each(me.fields, function (field) {
            if (field.name === me.idProperty) { return; }
            if (options.includeViewFields || !me.getMeta(field.name, 'viewField')) {

                if (field.isModelField) {
                    result[field.name] = thisModelData[field.name].getData();
                } else if (field.isStoreField) {
                    result[field.name] = thisModelData[field.name].getRawData();
                }
            }
        });
        return result;
    },

    commit: function (silent, modifiedFieldNames, ignoreNested) {
        var me = this;
        me.callParent(arguments);
        if (!ignoreNested) {
            var thisModelData = me.data;
            Ext.Array.each(me.fields, function (field) {
                if (field.isModelField) {
                    thisModelData[field.name].commit(silent);
                } else if (field.isStoreField) {
                    thisModelData[field.name].commitChanges(silent);
                }
            });
        }
    },

    reject: function (silent, ignoreNested) {
        var me = this;
        var field;
        var modified = me.modified;
        var modifiedFieldNames = [];
        for (field in modified) {
            if (modified.hasOwnProperty(field)) {
                if (typeof modified[field] != "function") {
                    modifiedFieldNames.push(field);
                }
            }
        }
        me.callParent(arguments);
        if (!ignoreNested) {
            var thisModelData = me.data;
            Ext.Array.each(me.fields, function (field) {
                if (field.isModelField) {
                    thisModelData[field.name].reject(silent);
                } else if (field.isStoreField) {
                    thisModelData[field.name].rejectChanges();
                }
            });
        }
        if (silent) {
            me._suppressChangeEvent++;
        }
        if (modifiedFieldNames.length) {
            me.onModelChange(modifiedFieldNames);
        }
        if (silent) {
            me._suppressChangeEvent--;
        }
    },

    set: function (fieldName, newValue, silent) {
        var me = this;
        if (silent) {
            me._suppressChangeEvent++;
        }
        me.callParent(arguments);
        if (silent) {
            me._suppressChangeEvent--;
        }
    },

    //isEqual: function (a, b) {
    //    var me = this;
    //    if (Ext.isArray(a) && Ext.isArray(b)) {
    //        return Ext.Array.equals(a, b);
    //    } else {
    //        return me.callParent(arguments);
    //    }
    //},
    //endregion

    //region Private methods
    afterValidated: function (modifiedFieldNames) {
        var me = this;
        me.callJoined('afterValidated', modifiedFieldNames);
    },

    afterValidChange: function (modifiedFieldNames) {
        var me = this;
        me.callJoined('afterValidChange', modifiedFieldNames);
    },

    resetFieldValidation: function (fieldName) {
        var me = this;
        var fieldValidationModel = me.validationModel[fieldName];
        Ext.Array.erase(fieldValidationModel.callbacks, 0, fieldValidationModel.callbacks.length);
        me._suppressValidChangeEvent = true;
        me.resetValidationMessages(fieldName);
        me.onFieldValidated(fieldName);
        me._suppressValidChangeEvent = false;
    },

    performValidation: function (fieldName, options, callback) {
        var me = this;
        var fieldValidationModel = me._validationModel[fieldName];
        var fieldValue = me.get(fieldName);
        var currentOptions = JSON.stringify(options);
        var newValidation = currentOptions !== fieldValidationModel.lastValidatingOptions;
        if (newValidation) {
            fieldValidationModel.lastValidatingOptions = currentOptions;
        }
        var modelState = me._modelState;
        var validateFn = me._validationRules[fieldName];
        if (callback) {
            fieldValidationModel.callbacks.push(callback);
        }
        if (!fieldValidationModel.isValidating || newValidation) {
            fieldValidationModel.isValidating = true;
            if (fieldValidationModel.isValidated && !newValidation) {
                fieldValidationModel.isValidating = false;
                me.executeFieldValidationCallbacks(fieldName);
            } else {
                if (validateFn) {
                    validateFn.call(me, fieldValue, options, function (errorMessages, infoMessages) {
                        if (modelState === me._modelState && fieldValidationModel.lastValidatingOptions === currentOptions) {
                            me.setValidationMessages(fieldName, errorMessages, infoMessages);
                            me.onFieldValidated(fieldName);
                        }
                    });
                } else {
                    me.resetValidationMessages(fieldName);
                    me.onFieldValidated(fieldName);
                }
            }
        }
    },

    executeFieldValidationCallbacks: function (fieldName) {
        var me = this;
        var fieldValidationModel = me._validationModel[fieldName];
        Ext.each(fieldValidationModel.callbacks, function (fieldValidationCallback) {
            fieldValidationCallback(me.getMeta(fieldName, 'validationErrorMessages'), me.getMeta(fieldName, 'validationInfoMessages'));
        });
        Ext.Array.erase(fieldValidationModel.callbacks, 0, fieldValidationModel.callbacks.length);
    },

    resetValidity: function (fieldNames) {
        var me = this;
        if (!me.validateOnChange) {
            return;
        }
        Ext.each(fieldNames, function (fieldName) {
            if (fieldName !== me.idProperty) {
                me.resetFieldValidity(fieldName);
            }
        });
    },

    resetFieldValidity: function (fieldName) {
        var me = this;
        if (!me.validateOnChange) {
            return;
        }
        var fieldValidationModel = me._validationModel[fieldName];
        fieldValidationModel.isValidated = false;
        fieldValidationModel.isValidating = false;
        me.validateField(fieldName, null);
    },

    afterMetaDataChange: function (modifiedFieldNames) {
        var me = this;
        me.callJoined('afterMetaDataChange', modifiedFieldNames);
    },

    runBusinessRule: function (fieldName, ruleType) {
        var me = this;
        var businessRuleName = fieldName + ruleType;
        if (me._businessRules[businessRuleName]) {
            me._businessRulesSyncCounter++;
            me._businessRules[businessRuleName](me.get(fieldName), me._businessRuleCompletedCallback);
        }
    },

    tryCreateStandardValidatorRule: function (ruleDefinition) {
        var me = this;
        var result = null;
        if ((Ext.isString(ruleDefinition) && ruleDefinition.indexOf('.') === -1) || Ext.isObject(ruleDefinition)) {
            result = me.createStandardValidator(ruleDefinition);
        }
        return result;
    },

    createMappedValidators: function (fieldName) {
        var me = this;
        var result = [];
        var field = me.getField(fieldName);
        Ext.Object.each(me._metaDataModel, function (metaDataName) {
            if (me._metaDataValidatorsMap[metaDataName]) {
                var validator = me.createMappedValidator(field, me._metaDataValidatorsMap[metaDataName]);
                result.push(validator);
            }
        });
        return result;
    },

    createMappedValidator: function (field, mappingData) {
        var me = this;
        var validatorConfig = mappingData.config;
        if (Ext.isString(validatorConfig)) {
            validatorConfig = { type: validatorConfig };
        } else {
            validatorConfig = Ext.apply({}, validatorConfig);
        }

        var fieldConfigReplications = mappingData.fieldConfigReplications;
        if (fieldConfigReplications) {
            Ext.Array.each(fieldConfigReplications, function (fieldConfigName) {
                if (field[fieldConfigName] !== undefined) {
                    validatorConfig[fieldConfigName] = field[fieldConfigName];
                }
            });
        }

        var activationRule = mappingData.activationRule;
        var standardValidator = me.createStandardValidator(validatorConfig);
        return function () {
            if (activationRule(me, field.name)) {
                return standardValidator.apply(window, arguments);
            } else {
                return {
                    errorMessage: '',
                    infoMessage: ''
                }
            }
        }
    },

    createStandardValidator: function (validatorConfig) {
        var me = this;
        var validator = Ext.Factory.dataValidator(validatorConfig);
        if (validator instanceof Ext.data.validator.ParametrizedValidator) {
            return function(fieldValue, options) {
                var validationResult = validator.validateWithOptions(fieldValue, me, options);
                var errorMessage = '';
                if (validationResult !== true) {
                    if (!Ext.isString(validationResult) || !validationResult) {
                        errorMessage = me.defaultFieldErrorMessage;
                    } else {
                        errorMessage = validationResult;
                    }
                }
                return {
                    errorMessage: errorMessage,
                    infoMessage: validator.getInfoMessage()
                }
            }
        } else {
            return function (fieldValue) {
                var validationResult = validator.validate(fieldValue, me);
                var errorMessage = '';
                if (validationResult !== true) {
                    if (!Ext.isString(validationResult) || !validationResult) {
                        errorMessage = me.defaultFieldErrorMessage;
                    } else {
                        errorMessage = validationResult;
                    }
                }
                return {
                    errorMessage: errorMessage,
                    infoMessage: ''
                }
            }
        }
    },

    createValidationRule: function (fieldName) {
        var me = this;
        var ruleDefinitions = Ext.Array.from(me.validationRules[fieldName]);
        var syncRules = me.createMappedValidators(fieldName);
        var asyncRules = [];
        Ext.Array.each(ruleDefinitions, function (ruleDefinition) {
            var syncRule = me.tryCreateStandardValidatorRule(ruleDefinition);
            if (syncRule) {
                syncRules.push(syncRule);
            } else {
                asyncRules.push(me.createAsyncRule(ruleDefinition, me.defaultValidationService));
            }
        });
        if (!asyncRules.length && !syncRules.length) {
            return null;
        }
        return function (fieldValue, options, callback) {
            var errorMessages = [];
            var infoMessages = [];
            Ext.Array.each(syncRules, function(syncRule) {
                var syncValidationResult = syncRule(fieldValue, options);
                if (syncValidationResult.errorMessage) { errorMessages.push(syncValidationResult.errorMessage); }
                if (syncValidationResult.infoMessage) { infoMessages.push(syncValidationResult.infoMessage); }
            });
            if (!errorMessages.length && asyncRules.length) {
                var asyncValidationCounter = asyncRules.length;
                var asyncRuleCallback = function(errorMessage, infoMessage) {
                    asyncValidationCounter--;
                    if (errorMessage) { errorMessages.push(errorMessage); }
                    if (infoMessage) { infoMessages.push(infoMessage); }
                    if (!asyncValidationCounter) {
                        callback(errorMessages, infoMessages);
                    }
                }
                Ext.Array.each(asyncRules, function(asyncRule) {
                    asyncRule.call(me, fieldValue, options, asyncRuleCallback);
                });
            } else {
                callback(errorMessages, infoMessages);
            }
        }
    },

    createAsyncRule: function (rule, defaultService) {
        var me = this;
        if (Ext.isFunction(rule)) {
            return Ext.bind(rule, me);
        }
        var serviceName = defaultService;
        var methodName = rule;
        var methodPathParts = rule.split('.');
        if (methodPathParts.length === 2) {
            serviceName = methodPathParts[0];
            methodName = methodPathParts[1];
        }
        if (serviceName === 'this') {
            if (!me[methodName]) {
                Ext.Error.raise(methodName + ' is not defined');
            }
            return me[methodName];
        } else {
            var service = null;
            if (Deft.Injector.canResolve(serviceName)) {
                service = Deft.Injector.resolve(serviceName);
            } else {
                service = me[serviceName];
            }
            return Ext.bind(service[methodName], service, [me], 0);
        }
    },

    clearAllFields: function (excludedFields) {
        var me = this;
        me.beginEdit();
        Ext.Array.each(me.fields, function (field) {
            if (field.name !== me.idProperty) {
                if (!excludedFields || !Ext.Array.contains(excludedFields, field.name)) {
                    me.clearField(field.name);
                }
            }
        });
        me.endEdit();
    },

    clearField: function (fieldName) {
        var me = this;
        var field = me.getField(fieldName);
        var fieldValue = me.get(fieldName);
        var useNull = field.useNull;
        var defaultValue = field.defaultValue;
        var clearedValue = null;
        if (field.isModelField || field.isStoreField) {
            me.get(fieldName).clear();
            return;
        }
        if (Ext.isString(fieldValue)) {
            clearedValue = defaultValue || '';
        } else if (Ext.isArray(fieldValue)) {
            clearedValue = defaultValue || [];
        } else if (Ext.isNumber(fieldValue)) {
            clearedValue = defaultValue || (useNull ? null : 0);
        } else if (Ext.isBoolean(fieldValue)) {
            clearedValue = defaultValue || (useNull ? null : false);
        } else if (Ext.isDate(fieldValue)) {
            clearedValue = defaultValue || (useNull ? null : '');
        }
        me.set(fieldName, clearedValue);
    },

    getNumOfFields: function () {
        return this.fields.length - 1; //id field is excluded
    },

    getNumOfComplexFields: function () {
        var me = this;
        var result = 0;
        Ext.Array.each(me.fields, function (field) {
            if ((field.name !== me.idProperty) && (field.isModelField || field.isStoreField)) {
                result++;
            }
        });
        return result;
    },

    fireChangeEvent: function (modifiedFieldNames) {
        var me = this;
        //notIgnoredFields - fields which was not modified for their 'change' event handlers. This is to prevent endless loops
        var notIgnoredFieldNames = Ext.Array.remove(Ext.Array.clone(modifiedFieldNames), me._ignoredFieldNames);
        me._ignoredFieldNames.concat(notIgnoredFieldNames);
        me.fireEvent('change', me, notIgnoredFieldNames);
        Ext.Array.remove(me._ignoredFieldNames, notIgnoredFieldNames);
    },

    subscribeNestedModel: function (model, fieldName) {
        var me = this;
        model.on('change', me.onNestedModelChange, me, { fieldName: fieldName });
    },

    onNestedModelChange: function (model, nestedFieldNames, options) {
        var me = this;
        if (me.editing) {
            me._modifiedNestedFieldNames.push(options.fieldName);
        } else {
            me.afterEdit([options.fieldName]);
        }
    },

    subscribeNestedStore: function (store, fieldName) {
        var me = this;
        store.on('datachanged', me.onNestedStoreChange, me, { fieldName: fieldName });
        store.on('update', me.onNestedStoreUpdate, me, { fieldName: fieldName });
    },

    onNestedStoreUpdate: function (store, record, operation, modifiedFieldNames, details, options) {
        var me = this;
        switch (operation) {
            case Ext.data.Model.EDIT:
            case Ext.data.Model.REJECT:
                if (me.editing) {
                    me._modifiedNestedFieldNames.push(options.fieldName);
                } else {
                    me.afterEdit([options.fieldName]);
                }
                break;
        }
    },

    setValidationMessages: function (fieldName, errorMessages, infoMessages) {
        var me = this;
        me.setMetaInternal(fieldName, 'validationInfoMessages', infoMessages || [], true);
        me.setMetaInternal(fieldName, 'validationErrorMessages', errorMessages || [], true);
    },

    resetValidationMessages: function (fieldName) {
        var me = this;
        me.setMetaInternal(fieldName, 'validationInfoMessages', [], true);
        me.setMetaInternal(fieldName, 'validationErrorMessages', [], true);
    },

    setMetaInternal: function (fieldName, metaDataFieldName, value, suppressValidation) {
        var me = this;

        if (!me.isMetaEqual(me._metaData[fieldName][metaDataFieldName], value)) {
            if (suppressValidation) {
                me._suppressValidation++;
            }
            me._metaData[fieldName][metaDataFieldName] = value;
            me.onMetaDataChange(fieldName, metaDataFieldName, value);
            if (suppressValidation) {
                me._suppressValidation--;
            }
        }
    },

    isMetaEqual: function (a, b) {
        if (Ext.isArray(a) && Ext.isArray(b)) {
            return Ext.Array.equals(a, b);
        } else {
            return a === b;
        }
    },

    onNestedStoreChange: function (store, options) {
        var me = this;
        if (me.editing) {
            me._modifiedNestedFieldNames.push(options.fieldName);
        } else {
            me.afterEdit([options.fieldName]);
        }
    },

    getField: function (fieldName) {
        var me = this;
        return Ext.Array.findBy(me.fields, function (f) { return f.name === fieldName; });
    },

    getStuckValidations: function () {
        var me = this;
        var stuck = [];
        Ext.Object.each(me._validationModel, function (fieldName, validationInfo) {
            if (validationInfo.callbacks.length) {
                stuck.push(fieldName);
            }
        });
        return stuck;
    },
    //endregion

    statics: {
        initValidationRules: function (data, cls, proto) {
            var validationRules = {};
            if (proto._validationRules) {
                var superValidationRules = proto._validationRules;
                delete proto._validationRules;
                validationRules = Ext.merge(validationRules, superValidationRules);
            }

            if (data._validationRules) {
                var validationRulesDefs = data._validationRules;
                delete data._validationRules;
                validationRules = Ext.merge(validationRules, validationRulesDefs);
            }
            cls._validationRules = proto._validationRules = validationRules;
        },

        initBusinessRules: function (data, cls, proto) {
            var businessRules = {};
            if (proto._businessRules) {
                var superBusinessRules = proto._businessRules;
                delete proto._businessRules;
                businessRules = Ext.merge(businessRules, superBusinessRules);
            }

            if (data._businessRules) {
                var businessRulesDefs = data._businessRules;
                delete data._businessRules;
                businessRules = Ext.merge(businessRules, businessRulesDefs);
            }
            cls._businessRules = proto._businessRules = businessRules;
        },

        initMetaDataModel: function (data, cls, proto) {
            var metaDataModel = {};
            if (proto._metaDataModel) {
                var superMetaDataModel = proto._metaDataModel;
                delete proto._metaDataModel;
                metaDataModel = Ext.merge(metaDataModel, superMetaDataModel);
            }

            if (data._metaDataModel) {
                var metaDataModelDefs = data._metaDataModel;
                delete data._metaDataModel;
                metaDataModel = Ext.merge(metaDataModel, metaDataModelDefs);
            }
            cls._metaDataModel = proto._metaDataModel = metaDataModel;
        },

        initMetaDataValidatorsMap: function (data, cls, proto) {
            var metaDataValidatorsMap = {};
            if (proto._metaDataValidatorsMap) {
                var superMetaDataValidatorsMap = proto._metaDataValidatorsMap;
                delete proto._metaDataValidatorsMap;
                metaDataValidatorsMap = Ext.merge(metaDataValidatorsMap, superMetaDataValidatorsMap);
            }

            if (data._metaDataValidatorsMap) {
                var metaDataValidatorsMapDefs = data._metaDataValidatorsMap;
                delete data._metaDataValidatorsMap;
                metaDataValidatorsMap = Ext.merge(metaDataValidatorsMap, metaDataValidatorsMapDefs);
            }
            cls._metaDataValidatorsMap = proto._metaDataValidatorsMap = metaDataValidatorsMap;
        }
    }
},
function () {
    var Model = this;

    Model.onExtended(function (cls, data) {
        var proto = cls.prototype;

        Model.initValidationRules(data, cls, proto);
        Model.initBusinessRules(data, cls, proto);
        Model.initMetaDataModel(data, cls, proto);
        Model.initMetaDataValidatorsMap(data, cls, proto);
    });
});

Ext.data.Model.addStatics({
    METACHANGE: 'metachange',
    VALIDCHANGE: 'validchange',
    VALIDATED: 'validated'
});