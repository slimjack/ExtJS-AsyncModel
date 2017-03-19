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
    _suppressValidityReset: 0,
    _suppressValidChangeEvent: 0,
    _suppressChangeEvent: 0,
    _errorMessage: '',
    _infoMessage: '',

    fields: [
        { name: 'meta', persist: false, reference: 'Ext.ux.data.MetaModel' }
    ],

    //region Initialization
    constructor: function (data, session, options) {
        var me = this;
        var initialData = Ext.clone(data);
        me.mixins.observable.constructor.call(me);
        me.validationRules = me.validationRules || {};
        me.businessRules = me.businessRules || {};
        //TODO CHECK
        options = options || {};
        options.eagerNetsedInstantiation = true;
        me._defaultValidatorRegistry = {
            required: {
                validator: function (fieldDescriptor) {
                    return {
                        type: 'required',
                        errorMessageTpl: fieldDescriptor.requiredMessage,
                        fieldName: fieldDescriptor.name,
                        trimStrings: fieldDescriptor.validateTrimmed
                    }
                }
            },
            desired: {
                validator: function (fieldDescriptor) {
                    return {
                        type: 'desired',
                        errorMessageTpl: fieldDescriptor.desiredMessage,
                        fieldName: fieldDescriptor.name,
                        trimStrings: fieldDescriptor.validateTrimmed
                    }
                }
            }
        };
        me._ignoredFieldNames = [];
        me._modifiedNestedFieldNames = [];
        me._validationCallbacks = [];
        me._businessLogicSyncCallbacks = [];

        me._suppressValidityReset++;
        me.callParent(arguments);
        me.initFields(options ? options.eagerNetsedInstantiation : false);
        me.initMetaData();
        me.initBusinessRules();
        me.initValidationModel();
        me._suppressValidityReset--;
        //isEqual is private. Therefore, we need to override in unusual way
        var originalIsEqual = me.isEqual;
        me.isEqual = function (a, b, field) {
            var me = this;
            var fieldDescriptor = null;
            if (field) {
                var fieldName = field.isField ? field.name : field;
                fieldDescriptor = me.getFieldDescriptor(fieldName);
            }
            if (fieldDescriptor && (fieldDescriptor.isModelField || fieldDescriptor.isStoreField)) {
                return a === b;
            } else {
                return originalIsEqual.apply(me, arguments);
            }
        };
        me.join({
            afterEdit: function () {
                var args = Array.prototype.slice.call(arguments, 0);
                args.shift();
                me.afterEdit.apply(me, args);
            }
        });
        if (data) {
            me.initData();
        }
        if (options && options.applyNested) {
            me.loadData(initialData);
        }
    },

    getFieldsDescriptors: function () {
        var me = this;
        return me._fieldsDescriptors;
    },

    getMetaDataNames: function (fieldName) {
        var me = this;
        return me._metaModel.getMetaDataNames(fieldName);
    },

    initData: function () {
        var me = this;
        var fieldNames = Ext.Array.map(me._fieldsDescriptors, function (fieldDescriptor) { return fieldDescriptor.name; });
        Ext.Object.each(me.data, function (dataFieldName) {
            if (!Ext.Array.contains(fieldNames, dataFieldName)) {
                delete me.data[dataFieldName];
            }
        });
    },

    initFields: function (eagerNetsedInstantiation) {
        var me = this;
        me._fieldsDescriptors = [];
        Ext.Array.forEach(me.fields, function (field) {
            if (field.name !== 'meta' && !field.reference) {
                me._fieldsDescriptors.push(field);
            }
        });
        Ext.Object.eachValue(me.associations, function (schemaRole) {
            var isOwnedAssociation = schemaRole.association.isOneToOne ? !schemaRole.left : schemaRole.left;
            var fieldConfig = schemaRole.association.field || schemaRole.field;
            if (!fieldConfig || !isOwnedAssociation || schemaRole.role === 'meta') {
                return;
            }
            var field = { name: schemaRole.role, schemaRole: schemaRole };
            if (Ext.isObject(fieldConfig)) {
                field = Ext.apply(field, fieldConfig);
            }
            field.instance = Ext.bind(me[schemaRole.getterName], me);
            if (schemaRole.association.isOneToOne) {
                if (eagerNetsedInstantiation) {
                    me[schemaRole.setterName].call(me, new schemaRole.cls(null, null, { eagerNetsedInstantiation: eagerNetsedInstantiation }));
                    me.subscribeNestedModel(field.instance(), field.name);
                }
                field.isModelField = true;
            } else {
                var store = field.instance();
                Ext.ux.data.AsyncStore.decorate(store);
                me.subscribeNestedStore(store, field.name);
                field.isStoreField = true;
                store.applyModelConfig({
                    validateOnChange: me.validateOnChange,
                    validateOnMetaDataChange: me.validateOnMetaDataChange
                });
            }
            me._fieldsDescriptors.push(field);
        });
    },

    initMetaData: function () {
        var me = this;
        me._metaModel = Ext.ux.data.MetaModel.createMetaModel(me);
        me._metaModel.join({
            onMetaDataChanged: function (metaModel, fieldName, modifiedMetaNames, fieldMetaRecord) {
                Ext.Array.each(modifiedMetaNames, function (modifiedMetaName) {
                    me.onMetaDataChange(fieldName, modifiedMetaName, fieldMetaRecord.get(modifiedMetaName));
                });
            }
        });
        me.setMeta(me._metaModel);
    },

    initValidationModel: function () {
        var me = this;
        var modelValidatorRegistry = Ext.apply(me._defaultValidatorRegistry, me.validatorRegistry);
        me._validatorRegistry = ValidatorRegistry.getData(modelValidatorRegistry);
        var emptyOptions = JSON.stringify({});
        me._validationModel = {};
        me._validationRules = {};
        Ext.Array.forEach(me._fieldsDescriptors, function (field) {
            me._validationModel[field.name] = {
                callbacks: []
            };
            me.initFieldValidationRules(field.name);
        });
        me.resetValidation();
    },

    initFieldValidationRules: function (fieldName) {
        var me = this;
        var rules = me.createFieldAutomaticValidationRules(fieldName);
        var ruleDefinitions = Ext.Array.from(me.validationRules[fieldName]);
        Ext.Array.each(ruleDefinitions, function (ruleDefinition) {
            rules.push(me.createValidationRule(ruleDefinition, fieldName));
        });
        me._validationRules[fieldName] = rules;
    },

    initBusinessRules: function () {
        var me = this;
        me._businessRuleCompletedCallback = Ext.bind(me.onBusinessRuleCompleted, me);
        me._businessRules = {};
        Ext.Array.forEach(me._fieldsDescriptors, function (field) {
            var changeRuleName = field.name + 'Change';
            var changeRule = me.businessRules[changeRuleName];
            if (changeRule) {
                me._businessRules[changeRuleName] = me.createAsyncRule(field.name, changeRule, me.defaultBusinessService);
            }
            var validChangeRuleName = field.name + 'ValidChange';
            var validChangeRule = me.businessRules[validChangeRuleName];
            if (validChangeRule) {
                me._businessRules[validChangeRuleName] = me.createAsyncRule(field.name, validChangeRule, me.defaultBusinessService);
            }
        });
    },
    //endregion

    //region Public methods
    syncWithBusinessRules: function (callback) {
        var me = this;
        me._businessRulesSyncCounter += me._fieldsDescriptors.length;
        Ext.Array.forEach(me._fieldsDescriptors, function (field) {
            if ((field.isStoreField || field.isModelField) && field.instance()) {
                field.instance().syncWithBusinessRules(me._businessRuleCompletedCallback);
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
        me.syncWithBusinessRules(function () {
            me._suppressValidityReset++;
            me._suppressBusinessLogic++;
            me.resetMetaData();
            if (data[me.idProperty] === undefined) {
                me.clearAllFields([me.idProperty]);
            } else {
                me.clearAllFields();
            }
            me.beginEdit();
            Ext.Array.forEach(me._fieldsDescriptors, function (field) {
                if (field.isStoreField) {
                    var instance = field.instance();
                    if (data[field.name] && instance) {
                        var records = [];
                        for (var i = 0; i < data[field.name].length; i++) {
                            var record = instance.createModel({});
                            record.loadData(data[field.name][i]);
                            records.push(record);
                        }
                        instance.loadData(records);
                    }
                } else if (field.isModelField) {
                    if (data[field.name] && field.instance()) {
                        field.instance().loadData(data[field.name]);
                    }
                } else if (data[field.name] !== undefined) {
                    me.set(field.name, data[field.name]);
                }
            });
            me.endEdit();
            me.commit(true);
            me.onLoading();
            me._suppressBusinessLogic--;
            me._suppressValidityReset--;
            me.resetValidation();
            me.onLoad();
        });
    },

    runBusinessLogic: function (businessFn, scope, syncWithBusinessRules) {
        var me = this;
        if (syncWithBusinessRules) {
            me.syncWithBusinessRules(function () {
                me.callBusinessRuleFn(businessFn, scope);
            });
        } else {
            me.callBusinessRuleFn(businessFn, scope);
        }
    },

    clear: function (excludedFields) {
        var me = this;

        me.syncWithBusinessRules(function () {
            me.resetMetaData();
            me._suppressValidityReset++;
            me._suppressBusinessLogic++;
            me.clearAllFields(excludedFields);
            me.onClearing();
            me._suppressBusinessLogic--;
            me._suppressValidityReset--;
            me.resetValidation();
            me.onClear();
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
            Ext.Array.forEach(me._fieldsDescriptors, function (field) {
                me.validateField(field.name, options, fieldCallback);
                if ((field.isStoreField || field.isModelField) && field.instance()) {
                    field.instance().validate(options, fieldCallback);
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
        Ext.Array.forEach(me._fieldsDescriptors, function (field) {
            me.resetFieldValidation(field.name);
            if ((field.isStoreField || field.isModelField) && field.instance()) {
                field.instance().resetValidation();
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
        Ext.Array.each(me._fieldsDescriptors, function (field) {
            var fieldValidationModel = me._validationModel[field.name];
            isValidated = fieldValidationModel.isValidated;
            if (isValidated && ((field.isStoreField || field.isModelField) && field.instance())) {
                isValidated = field.instance().isValidated();
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
            Ext.Array.each(me._fieldsDescriptors, function (field) {
                isValid = !me.getMetaValue(field.name, 'validationErrorMessages').length;
                if (isValid && ((field.isStoreField || field.isModelField) && field.instance())) {
                    isValid = field.instance().isValid();
                }
                if (!isValid) {
                    return false;
                }
            });
        }
        return isValid;
    },

    setMetaValue: function (fieldName, metaDataFieldName, value) {
        var me = this;
        if (metaDataFieldName === 'validationErrorMessages' || metaDataFieldName === 'validationInfoMessages') {
            Ext.Error.raise('Direct set of "validationErrorMessages" or "validationInfoMessages" is forbidden');
        }
        me.setMetaInternal(fieldName, metaDataFieldName, value);
    },

    setAllFieldsMeta: function (metaDataFieldName, value) {
        var me = this;
        Ext.Array.forEach(me._fieldsDescriptors, function (field) {
            me.setMetaValue(field.name, metaDataFieldName, value);
        });
    },

    getMetaValue: function (fieldName, metaDataFieldName) {
        var me = this;
        return me._metaModel.getMeta(fieldName, metaDataFieldName);
    },

    resetMetaData: function () {
        var me = this;
        me._metaModel.reset();
    },

    getFieldValidationInfo: function (fieldName) {
        var me = this;
        if (fieldName !== me.idProperty) {
            var field = me.getFieldDescriptor(fieldName);
            var fieldValidationModel = me._validationModel[fieldName];
            return {
                isValidated: fieldValidationModel.isValidated,
                isValidating: fieldValidationModel.isValidating,
                validationErrorMessages: me.getMetaValue(fieldName, 'validationErrorMessages'),
                validationInfoMessages: me.getMetaValue(fieldName, 'validationInfoMessages'),
                subInfo: ((field.isStoreField || field.isModelField) && field.instance()) ? field.instance().getAllValidationInfo() : null
            };
        } else {
            return null;
        }
    },

    getAllValidationInfo: function () {
        var me = this;
        var result = {};
        Ext.Object.each(me._validationModel, function (fieldName, validationInfo) {
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
        me.executeFieldValidationCallbacks(fieldName);
        var errorMessages = me.getMetaValue(fieldName, 'validationErrorMessages');
        var infoMessages = me.getMetaValue(fieldName, 'validationInfoMessages');
        me.fireEvent('validated', me, fieldName, errorMessages, infoMessages);
        me.afterValidated([fieldName]);
        if (!errorMessages.length
            && !me._suppressValidChangeEvent
            && !me.isEqual(fieldValidationModel.lastValidValue, me.get(fieldName), fieldName)) {
            fieldValidationModel.lastValidValue = me.get(fieldName);
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
    },

    onLoading: Ext.emptyFn,

    onClearing: Ext.emptyFn,

    onLoad: Ext.emptyFn,

    onClear: Ext.emptyFn,

    onModelChange: function (modifiedFieldNames) {
        var me = this;
        if (modifiedFieldNames) {
            modifiedFieldNames = modifiedFieldNames.filter(function (fieldName) { return fieldName !== 'meta' });
        }
        Ext.each(modifiedFieldNames, function (fieldName) {
            if (!me._suppressBusinessLogic) {
                me.runBusinessRule(fieldName, 'Change');
            }
        });
        if (!me._suppressChangeEvent) {
            me.fireChangeEvent(modifiedFieldNames);
        }
        if (!me._suppressValidityReset) {
            me.resetValidity(modifiedFieldNames);
        }
    },

    onMetaDataChange: function (fieldName, metaDataFieldName, value) {
        var me = this;

        me.fireEvent('metadatachange', me, fieldName, metaDataFieldName, value);
        if (!me._suppressValidityReset
            && me.validateOnMetaDataChange
            && (metaDataFieldName !== 'validationErrorMessages')
            && (metaDataFieldName !== 'validationInfoMessages')) {

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
        if (!options.includeMeta) {
            delete result.meta;
        }
        return result;
    },

    reject: function (silent) {
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

    set: function (fieldName, newValue, opts) {
        var me = this;
        if (opts && opts.silent) {
            me._suppressChangeEvent++;
        }
        me.callParent(arguments);
        if (opts && opts.silent) {
            me._suppressChangeEvent--;
        }
    },
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

    afterMetaDataChange: function (modifiedFieldNames) {
        var me = this;
        me.callJoined('afterMetaDataChange', modifiedFieldNames);
    },

    getFieldValue: function (fieldName) {
        var me = this;
        var field = Ext.Array.findBy(me._fieldsDescriptors, function (field) { return field.name === fieldName; });
        if (field && (field.isStoreField || field.isModelField)) {
            return field.instance();
        } else {
            return me.get(fieldName);
        }
    },

    //region running validation

    resetFieldValidation: function (fieldName) {
        var me = this;
        var fieldValidationModel = me._validationModel[fieldName];
        fieldValidationModel.isValidating = false;
        fieldValidationModel.isValidated = true;
        fieldValidationModel.lastValidatingOptions = '{}';
        fieldValidationModel.fieldState = 0;
        fieldValidationModel.lastValidValue = me.get(fieldName);
        Ext.Array.erase(fieldValidationModel.callbacks, 0, fieldValidationModel.callbacks.length);
        me._suppressValidChangeEvent = true;
        me.resetValidationMessages(fieldName);
        me.onFieldValidated(fieldName);
        me._suppressValidChangeEvent = false;
    },

    performValidation: function (fieldName, options, callback) {
        var me = this;
        var fieldValidationModel = me._validationModel[fieldName];
        var currentOptions = JSON.stringify(options);
        var currentFieldState = fieldValidationModel.fieldState;
        var newValidation = currentOptions !== fieldValidationModel.lastValidatingOptions || currentFieldState !== fieldValidationModel.fieldState;
        if (newValidation) {
            fieldValidationModel.lastValidatingOptions = currentOptions;
        }
        if (callback) {
            fieldValidationModel.callbacks.push(callback);
        }
        if (!fieldValidationModel.isValidating || newValidation) {
            fieldValidationModel.isValidating = true;
            if (fieldValidationModel.isValidated && !newValidation) {
                fieldValidationModel.isValidating = false;
                me.executeFieldValidationCallbacks(fieldName);
            } else {
                fieldValidationModel.isValidated = false;
                me.runFieldValidationRules(fieldName, options, function (errorMessages, infoMessages) {
                    if (fieldValidationModel.lastValidatingOptions === currentOptions) {
                        fieldValidationModel.isValidating = false;
                        if (currentFieldState === fieldValidationModel.fieldState) {
                            me.setValidationMessages(fieldName, errorMessages, infoMessages);
                            fieldValidationModel.isValidated = true;
                            me.onFieldValidated(fieldName);
                        } else {
                            me.performValidation(fieldName, options);
                        }
                    }
                });
            }
        } else if (!fieldValidationModel.isValidating) {
            me.executeFieldValidationCallbacks(fieldName);
        }
    },

    runFieldValidationRules: function (fieldName, options, callback) {
        var me = this;
        var fieldValidationRules = me._validationRules[fieldName];
        var syncRules = Ext.Array.filter(fieldValidationRules, function (r) { return !r.isAsync; });
        var asyncRules = Ext.Array.filter(fieldValidationRules, function (r) { return r.isAsync; });
        var errorMessages = [];
        var infoMessages = [];
        var fieldValue = me.getFieldValue(fieldName);
        Ext.Array.each(syncRules, function (syncRule) {
            var syncValidationResult = syncRule.fn.call(syncRule.scope, fieldValue, me, options);
            if (syncValidationResult.errorMessage) { errorMessages.push(syncValidationResult.errorMessage); }
            if (syncValidationResult.infoMessage) { infoMessages.push(syncValidationResult.infoMessage); }
        });
        if (!errorMessages.length && asyncRules.length) {
            var asyncValidationCounter = asyncRules.length;
            var asyncRuleCallback = function (errorMessage, infoMessage) {
                asyncValidationCounter--;
                if (errorMessage) { errorMessages.push(errorMessage); }
                if (infoMessage) { infoMessages.push(infoMessage); }
                if (!asyncValidationCounter) {
                    callback(errorMessages, infoMessages);
                }
            }
            Ext.Array.forEach(asyncRules, function (asyncRule) {
                asyncRule.fn.call(asyncRule.scope, fieldValue, me, options, asyncRuleCallback);
            });
        } else {
            callback(errorMessages, infoMessages);
        }

    },

    executeFieldValidationCallbacks: function (fieldName) {
        var me = this;
        var fieldValidationModel = me._validationModel[fieldName];
        Ext.each(fieldValidationModel.callbacks, function (fieldValidationCallback) {
            fieldValidationCallback(me.getMetaValue(fieldName, 'validationErrorMessages'), me.getMetaValue(fieldName, 'validationInfoMessages'));
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
        fieldValidationModel.fieldState++;
        fieldValidationModel.isValidated = false;
        fieldValidationModel.isValidating = false;
        me.validateField(fieldName, null);
    },
    //endregion

    //region running business rules
    runBusinessRule: function (fieldName, ruleType) {
        var me = this;
        var businessRuleName = fieldName + ruleType;
        if (me._businessRules[businessRuleName]) {
            me.callBusinessRuleFn(function (model, callback) {
                var rule = me._businessRules[businessRuleName];
                rule.fn.call(rule.fn.scope, me.getFieldValue(fieldName), me, callback);
            });
        }
    },

    callBusinessRuleFn: function (businessRuleFn, scope) {
        var me = this;
        me._businessRulesSyncCounter++;
        businessRuleFn.call(scope, me, me._businessRuleCompletedCallback);
    },
    //endregion

    //region creating mapped rules
    createFieldAutomaticValidationRules: function (fieldName) {
        var me = this;
        var result = [];
        var fieldDescriptor = me.getFieldDescriptor(fieldName);
        var fieldMetaDataNames = me.getMetaDataNames(fieldName);
        var processedDescriptors = [];
        Ext.Object.each(me._validatorRegistry, function (fieldAttributeName, validatorDescriptor) {
            if (Ext.Array.contains(processedDescriptors, validatorDescriptor)) { return; }//this is to avoid creation of the same validator by alias

            if (Ext.Array.contains(fieldMetaDataNames, fieldAttributeName) || validatorDescriptor.activator(me, fieldDescriptor.name, fieldAttributeName)) {
                var rule = me.createAutomaticValidationRule(fieldDescriptor, validatorDescriptor, fieldAttributeName);
                processedDescriptors.push(validatorDescriptor);
                result.push(rule);
            }
        });
        return result;
    },

    createAutomaticValidationRule: function (fieldDescriptor, validatorDescriptor, fieldAttributeName) {
        var me = this;
        var ruleConfig = validatorDescriptor.validator;
        if (Ext.isString(ruleConfig)) {
            ruleConfig = {
                type: ruleConfig,
                fieldName: fieldDescriptor.name
            };
        } else if (Ext.isObject(ruleConfig)) {
            ruleConfig = Ext.clone(ruleConfig);
            ruleConfig.fieldName = fieldDescriptor.name;
        } else if (Ext.isFunction(ruleConfig)) {
            ruleConfig = ruleConfig(fieldDescriptor);
            for (var prop in ruleConfig) {
                if (!Ext.isDefined(ruleConfig[prop])) { delete ruleConfig[prop]; }
            }
        } else {
            Ext.Error.raise("Validator is improperly defined. Detected while creating validation rules for '" + fieldDescriptor.name + "'");
        }
        var ruleName = '';
        var rule = me.createStandardValidationRule(ruleName, ruleConfig);
        if (!rule) {
            Ext.Error.raise("Failed to create validation rule");
        }
        var activationRule = validatorDescriptor.activator;
        if (rule.isAsync) {
            var originalValidationFn = rule.fn;
            rule.fn = function (fieldValue, options, callback) {
                if (activationRule(me, fieldDescriptor.name, fieldAttributeName)) {
                    originalValidationFn.apply(rule.scope, arguments)
                } else {
                    Ext.callback(callback, null, ['', '']);
                }
            };
        } else {
            var originalValidationFn = rule.fn;
            rule.fn = function () {
                if (activationRule(me, fieldDescriptor.name, fieldAttributeName)) {
                    return originalValidationFn.apply(rule.scope, arguments)
                } else {
                    return {
                        errorMessage: '',
                        infoMessage: ''
                    }
                }
            };
        }
        return rule;
    },
    //endregion

    //region creating standard validation rules
    createFieldStandardValidationRule: function (fieldName, ruleDefinition) {
        var me = this;
        var result = null;
        if ((Ext.isString(ruleDefinition) && ruleDefinition.indexOf('.') === -1) || Ext.isObject(ruleDefinition)) {
            var ruleConfig = { fieldName: fieldName };
            var ruleName = null;
            if (Ext.isObject(ruleDefinition)) {
                Ext.apply(ruleConfig, ruleDefinition);
                ruleName = ruleDefinition.name;
                delete ruleConfig.name;
            } else {
                ruleConfig.type = ruleDefinition;
            }
            result = me.createStandardValidationRule(ruleName, ruleConfig);
        }
        return result;
    },

    createStandardValidationRule: function (ruleName, ruleConfig) {
        var me = this;
        var rule;
        try {//we can't detect the type of validator from ruleConfig. So, we are trying to create sync validator first
            rule = me.createStandardSyncValidationRule(ruleName, ruleConfig);
        } catch (ex) { }
        rule = rule || me.createStandardAsyncValidationRule(ruleName, ruleConfig);
        return rule;
    },

    createStandardSyncValidationRule: function (ruleName, ruleConfig) {
        var me = this;
        var validator;
        if (ruleConfig instanceof Ext.data.validator.Validator) {
            validator = ruleConfig;
        } else {
            try {
                validator = Ext.Factory.dataValidator(ruleConfig);
            } catch (ex) { }
        }
        if (!validator) {
            return null;
        }
        Ext.ux.data.validator.ParametrizedValidator.decorateStandard(validator);
        return {
            isAsync: false,
            name: ruleName || Ext.id(validator, 'StandardSyncValidationRule-' + validator.type + '-'),
            fn: validator.validateWithOptions,
            scope: validator
        };
    },

    createStandardAsyncValidationRule: function (ruleName, ruleConfig) {
        var me = this;
        var validator;
        if (ruleConfig instanceof Ext.ux.data.validator.AsyncValidator) {
            validator = ruleConfig;
        } else {
            try {
                var validator = Ext.Factory.dataAsyncValidator(ruleConfig);
            } catch (ex) { }
        }
        if (!validator) {
            return null;
        }
        if (validator) {
            return {
                isAsync: true,
                name: ruleName || Ext.id(validator, 'StandardAsyncValidationRule-' + validator.type + '-'),
                fn: validator.validate,
                scope: validator
            };
        }
    },
    //endregion

    //region creating validation rules
    createValidationRule: function (ruleDefinition, fieldName) {
        var me = this;
        return me.createFieldStandardValidationRule(fieldName, ruleDefinition) || me.createAsyncRule(fieldName, ruleDefinition, me.defaultValidationService);
    },
    //endregion

    createAsyncRule: function (fieldName, ruleDefinition, defaultScopeName) {
        var me = this;
        var ruleConfig = { fieldName: fieldName };
        var ruleFn;
        var ruleScope;
        var ruleDescriptor;
        if (Ext.isObject(ruleDefinition)) {
            Ext.apply(ruleConfig, ruleDefinition);
            ruleDescriptor = rule.descriptor;
            delete ruleConfig.descriptor;
        } else {
            ruleDescriptor = ruleDefinition;
        }

        var ruleName = ruleConfig.name || Ext.id(me, 'AsyncRule');
        delete ruleConfig.name;
        if (Ext.isFunction(ruleDescriptor)) {
            ruleFn = Ext.bind(ruleDescriptor, me, [ruleConfig], 0);
            ruleScope = me;
        } else {
            var scopeName = defaultScopeName || 'this';
            var methodName = ruleDescriptor;
            var methodPathParts = ruleDescriptor.split('.');
            if (methodPathParts.length === 2) {
                scopeName = methodPathParts[0];
                methodName = methodPathParts[1];
            }
            if (scopeName === 'this') {
                if (!me[methodName]) {
                    Ext.Error.raise(methodName + ' is not defined');
                }
                ruleScope = me;
            } else {
                if (Deft.Injector.canResolve(scopeName)) {
                    ruleScope = Deft.Injector.resolve(scopeName);
                } else {
                    ruleScope = me[scopeName];
                }
            }
            ruleFn = Ext.bind(ruleScope[methodName], ruleScope, [ruleConfig], 0);
        }
        return {
            isAsync: true,
            name: ruleName,
            fn: ruleFn,
            scope: ruleScope
        };
    },

    getDefaultData: function (excludedFields) {
        var me = this;
        var result = {};
        Ext.Array.forEach(me._fieldsDescriptors, function (field) {
            if (!excludedFields || !Ext.Array.contains(excludedFields, field.name)) {
                result[field.name] = me.getDefaultFieldValue(field.name);
            }
        });
        return result;
    },

    getDefaultFieldValue: function (fieldName) {
        var me = this;
        var fieldDescriptor = me.getFieldDescriptor(fieldName);
        var fieldValue = me.getFieldValue(fieldName);
        var allowNull = fieldDescriptor.allowNull;
        var fieldDefaultValue = fieldDescriptor.defaultValue;
        var result = null;
        if (fieldDescriptor.isModelField) {
            if (fieldValue) {
                result = fieldValue.getDefaultData();
            }
        } else if (fieldDescriptor.isStoreField || Ext.isArray(fieldValue)) {
            result = fieldDefaultValue || [];
        } else if (Ext.isString(fieldValue)) {
            result = fieldDefaultValue || '';
        } else if (Ext.isNumber(fieldValue)) {
            result = fieldDefaultValue || (allowNull ? null : 0);
        } else if (Ext.isBoolean(fieldValue)) {
            result = fieldDefaultValue || (allowNull ? null : false);
        } else if (Ext.isDate(fieldValue)) {
            result = fieldDefaultValue || (allowNull ? null : '');
        }
        return result;
    },

    getField: function (fieldName) {
        var me = this;
        return Ext.Array.findBy(me.getFields(), function (field) {
            return field.name === fieldName;
        });
    },

    clearAllFields: function (excludedFields) {
        var me = this;
        me.beginEdit();
        Ext.Array.forEach(me._fieldsDescriptors, function (field) {
            if (!excludedFields || !Ext.Array.contains(excludedFields, field.name)) {
                me.clearField(field.name);
            }
        });
        me.endEdit();
    },

    clearField: function (fieldName) {
        var me = this;
        var field = me.getFieldDescriptor(fieldName);
        if (field.isModelField || field.isStoreField) {
            var fieldValue = me.getFieldValue(fieldName);
            if (fieldValue) {
                fieldValue.clear();
            }
            return;
        }
        me.set(fieldName, me.getDefaultFieldValue(fieldName));
    },

    getNumOfFields: function () {
        var me = this;
        return me._fieldsDescriptors.length;
    },

    getNumOfComplexFields: function () {
        var me = this;
        return Ext.Array.filter(me._fieldsDescriptors, function (field) { return field.isStoreField || field.isModelField; }).length;
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
        store.on('add', me.onNestedStoreAdd, me, { fieldName: fieldName });
        store.on('remove', me.onNestedStoreRemove, me, { fieldName: fieldName });
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
        if (suppressValidation) {
            me._suppressValidityReset++;
        }
        me._metaModel.setMeta(fieldName, metaDataFieldName, value);
        if (suppressValidation) {
            me._suppressValidityReset--;
        }
    },

    onNestedStoreChange: function (store, record, index, options) {
        var me = this;
        if (me.editing) {
            me._modifiedNestedFieldNames.push(options.fieldName);
        } else {
            me.afterEdit([options.fieldName]);
        }
    },

    onNestedStoreRemove: function (store, record, index, isMove, options) {
        var me = this;
        me.onNestedStoreChange(store, record, index, options);
    },

    onNestedStoreAdd: function (store, record, index, options) {
        var me = this;
        me.onNestedStoreChange(store, record, index, options);
    },

    getFieldDescriptor: function (fieldName) {
        var me = this;
        return Ext.Array.findBy(me._fieldsDescriptors, function (f) { return f.name === fieldName; });
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

        initValidatorsMap: function (data, cls, proto) {
            var validatorsMap = {};
            if (proto._validatorsMap) {
                var superValidatorsMap = proto._validatorsMap;
                delete proto._validatorsMap;
                validatorsMap = Ext.merge(validatorsMap, superValidatorsMap);
            }

            if (data._validatorsMap) {
                var validatorsMapDefs = data._validatorsMap;
                delete data._validatorsMap;
                validatorsMap = Ext.merge(validatorsMap, validatorsMapDefs);
            }
            cls._validatorsMap = proto._validatorsMap = validatorsMap;
        }
    }
},
    function () {
        var Model = this;

        Model.onExtended(function (cls, data) {
            var proto = cls.prototype;

            Model.initValidationRules(data, cls, proto);
            Model.initBusinessRules(data, cls, proto);
            Model.initValidatorsMap(data, cls, proto);
        });
    });

Ext.data.Model.addStatics({
    METACHANGE: 'metachange',
    VALIDCHANGE: 'validchange',
    VALIDATED: 'validated'
});