//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.AsyncModel', {
    extend: 'Ext.data.Model',

    mixins: [
        'Ext.util.Observable'
    ],

    inject: {
        _validatorProviders: 'Ext.ux.validator.IValidatorProvider[]'
    },

    validateOnChange: true,
    validateOnMetaDataChange: false,
    defaultFieldErrorMessage: 'Value is invalid',
    defaultModelErrorMessage: 'Some fields have incorrect data',

    _businessRulesSyncCounter: 0,
    _suppressBusinessLogic: 0,
    _suppressValidityReset: 0,
    _suppressValidChangeEvent: 0,
    _suppressChangeEvent: 0,
    _stateCounter: 0,
    _metaDataStateCounter: 0,

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
        options = options || { eagerNetsedInstantiation: true };
        me._ignoredFieldNames = [];
        me._modifiedNestedFieldNames = [];
        me._businessLogicSyncCallbacks = [];

        me._suppressValidityReset++;
        me.callParent(arguments);
        me.initFields(options.eagerNetsedInstantiation);
        me.initMetaData();
        me.initBusinessRules();
        me.initValidationState();
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
        if (options.applyNested) {
            me.loadData(initialData);
        }
    },

    initData: function () {
        var me = this;
        var fieldNames = Ext.Array.map(me.getFieldsDescriptors(), function (fieldDescriptor) { return fieldDescriptor.name; });
        Ext.Object.each(me.data, function (dataFieldName) {
            if (!Ext.Array.contains(fieldNames, dataFieldName)) {
                delete me.data[dataFieldName];
            }
        });
    },

    initFields: function (eagerNetsedInstantiation) {
        var me = this;
        me._fieldDescriptors = [];
        Ext.Array.forEach(me.fields, function (field) {
            if (field.name !== 'meta' && !field.reference) {
                me._fieldDescriptors.push(field);
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
            me._fieldDescriptors.push(field);
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

    initValidationState: function () {
        var me = this;
        me._validationState = {};
        me._validationRules = {};
        Ext.Array.forEach(me.getFieldsDescriptors(), function (field) {
            me._validationState[field.name] = {
                callbacks: []
            };
            me.initFieldValidationRules(field.name);
        });
        me.resetValidation();
    },

    initFieldValidationRules: function (fieldName) {
        var me = this;
        var fieldDescriptor = me.getFieldDescriptor(fieldName);
        var rules = me.createImplicitValidationRules(fieldName);
        var ruleConfigs = Ext.Array.from(me.validationRules[fieldName]);
        Ext.Array.each(ruleConfigs, function (ruleConfig) {
            rules.push(me.createExplicitValidationRule(ruleConfig));
        });
        me._validationRules[fieldName] = {
            syncRules: Ext.Array.filter(rules, function (rule) { return rule.$is('Ext.ux.validator.ISyncValidator'); }),
            asyncRules: Ext.Array.filter(rules, function (rule) { return rule.$is('Ext.ux.validator.IAsyncValidator'); })
        };
    },

    createImplicitValidationRules: function (fieldName) {
        var me = this;
        return Ext.Array.map(me._validatorProviders, function (provider) { return provider.getValidator(fieldDescriptor); })
    },

    createExplicitValidationRule: function (ruleConfig) {
        var me = this;
        return Ext.ux.data.validator.ValidatorFactory.createValidator(ruleConfig)
    },

    initBusinessRules: function () {
        var me = this;
        me._businessRuleCompletedCallback = Ext.bind(me.onBusinessRuleCompleted, me);
        me._businessRules = {};
        Ext.Array.forEach(me.getFieldsDescriptors(), function (field) {
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
    getFieldsDescriptors: function () {
        var me = this;
        return me._fieldDescriptors;
    },

    getMetaDataNames: function (fieldName) {
        var me = this;
        return me._metaModel.getMetaDataNames(fieldName);
    },

    syncWithBusinessRules: function (callback) {
        var me = this;
        me._businessRulesSyncCounter += me.getFieldsDescriptors().length;
        Ext.Array.forEach(me.getFieldsDescriptors(), function (field) {
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

    getStateCounter: function () {
        var me = this;
        return me._stateCounter;
    },

    getMetaDataStateCounter: function () {
        var me = this;
        return me._metaDataStateCounter;
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
            Ext.Array.forEach(me.getFieldsDescriptors(), function (field) {
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

    validate: function (options, originalValidation) {
        var me = this;
        options = options || {};

        var currentValidationStateSnapshot = me.getValidationStateSnapshot();
        var currentValidationOptionsSnapshot = JSON.stringify(options);
        var newValidation = currentValidationStateSnapshot !== me._lastValidationStateSnapshot
            || currentValidationOptionsSnapshot !== me._lastValidationOptionsSnapshot;
        if (newValidation) {
            me._lastValidationStateSnapshot = currentValidationStateSnapshot;
            me._lastValidationOptionsSnapshot = currentValidationOptionsSnapshot;
            if (!originalValidation) {
                originalValidation = new Ext.Deferred();
                me._lastValidation = originalValidation;
            }
            me.syncWithBusinessRules(function () {
                var fieldDescriptors = me.getFieldsDescriptors();
                var fieldValidations = Ext.Array.map(fieldDescriptors, function (fieldDescriptor) { return me.validateField(fieldDescriptor.name, options); });
                if (Ext.isFunction(me.onValidate)) {
                    fieldValidations.push(me.onValidate(options));
                }
                Ext.Promise.all(fieldValidations).then(function (validationResults) {
                    if (currentValidationStateSnapshot === me.getValidationStateSnapshot()) {
                        originalValidation.resolve({
                            errors: Ext.Array.union(Ext.Array.map(validationResults, function (validationResult) { return validationResult.errors; })),
                            infos: Ext.Array.union(Ext.Array.map(validationResults, function (validationResult) { return validationResult.infos; }))
                        });
                    } else {
                        me.validate(options, originalValidation);
                    }
                });
            });
            return originalValidation.promise();
        }
        return me._lastValidation.promise();
    },

    resetValidation: function () {
        var me = this;
        Ext.Array.forEach(me.getFieldsDescriptors(), function (fieldDescriptor) {
            me.resetFieldValidation(fieldDescriptor.name);
            if ((fieldDescriptor.isStoreField || fieldDescriptor.isModelField) && fieldDescriptor.instance()) {
                fieldDescriptor.instance().resetValidation();
            }
        });
        me._lastValidationStateSnapshot = null;
        me._lastValidationOptionsSnapshot = null;
    },

    isValid: function (options) {
        var me = this;
        return me.validate(options).then(function (validationResult) { return !validationResult.errors; })
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
        Ext.Array.forEach(me.getFieldsDescriptors(), function (field) {
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
            return {
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
        Ext.Array.forEach(me.getFieldsDescriptors(), function (fieldDescriptor) {
            result[fieldDescriptor.name] = me.getFieldValidationInfo(fieldDescriptor.name);
        });
        return result;
    },

    //endregion

    //region Protected methods

    onFieldValidated: function (fieldName) {
        var me = this;
        var fieldValidationState = me._validationState[fieldName];
        var errorMessages = me.getMetaValue(fieldName, 'validationErrorMessages');
        var infoMessages = me.getMetaValue(fieldName, 'validationInfoMessages');
        me.fireEvent('validated', me, fieldName, errorMessages, infoMessages);
        me.afterValidated([fieldName]);
        if (!errorMessages.length
            && !me._suppressValidChangeEvent
            && !me.isFieldStateEqual(fieldName, fieldValidationState.lastValidState)) {
            fieldValidationState.lastValidState = me.getFieldState(fieldName);
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
            modifiedFieldNames = modifiedFieldNames.filter(function (fieldName) { debugger; return fieldName !== 'meta'; });
        }
        if (!modifiedFieldNames) {
            return;
        }
        me.incrementStateCounter();
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

        me.incrementMetaDataStateCounter();

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
    isFieldStateEqual: function (fieldName, stateToCompare) {
        var me = this;
        var fieldDescriptor = me.getFieldDescriptor(fieldName);
        if (fieldDescriptor.isModelField || fieldDescriptor.isStoreField) {
            var currentState = fieldDescriptor.instance() ? fieldDescriptor.instance().getStateCounter() : null;
            return currentState == stateToCompare;
        } else {
            return me.isEqual(stateToCompare, me.get(fieldName), fieldName);
        }
    },

    getFieldState: function (fieldName) {
        var me = this;
        var fieldDescriptor = me.getFieldDescriptor(fieldName);
        if (fieldDescriptor.isModelField || fieldDescriptor.isStoreField) {
            return fieldDescriptor.instance() ? fieldDescriptor.instance().getStateCounter() : null;
        } else {
            return me.get(fieldName);
        }
    },

    incrementStateCounter: function () {
        var me = this;
        me._stateCounter++;
    },

    incrementMetaDataStateCounter: function () {
        var me = this;
        me._metaDataStateCounter++;
    },

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
        var fieldDescriptor = me.getFieldDescriptor(fieldName);
        if (fieldDescriptor.isModelField || fieldDescriptor.isStoreField) {
            return field.instance();
        } else {
            return me.get(fieldName);
        }
    },

    //region running validation

    resetFieldValidation: function (fieldName) {
        var me = this;
        var fieldValidationState = me._validationState[fieldName];
        fieldValidationState.lastValidation = null;
        fieldValidationState.lastValidationStateSnapshot = null;
        fieldValidationState.lastValidationOptionsSnapshot = null;
        fieldValidationState.lastValidState = me.getFieldState(fieldName);
        me._suppressValidChangeEvent = true;
        me.resetValidationMessages(fieldName);
        me.onFieldValidated(fieldName);
        me._suppressValidChangeEvent = false;
    },

    validateField: function (fieldName, options, originalValidation) {
        var me = this;
        options = options || {};
        var fieldValidationState = me._validationState[fieldName];
        var currentValidationStateSnapshot = me.getFieldValidationStateSnapshot(fieldName);
        var currentValidationOptionsSnapshot = JSON.stringify(options);
        var newValidation = currentValidationStateSnapshot !== fieldValidationState.lastValidationStateSnapshot
            || currentValidationOptionsSnapshot !== fieldValidationState.lastValidationOptionsSnapshot;
        if (newValidation) {
            fieldValidationState.lastValidationStateSnapshot = currentValidationStateSnapshot;
            fieldValidationState.lastValidationOptionsSnapshot = currentValidationOptionsSnapshot;
            if (!originalValidation) {
                originalValidation = new Ext.Deferred();
                fieldValidationState.lastValidation = originalValidation;
            }
            me.performValidation(fieldName, options).then(function (validationResult) {
                if (me.getFieldValidationStateSnapshot(fieldName, options) === currentValidationStateSnapshot) {
                    me.setValidationMessages(fieldName, validationResult.errors, validationResult.infos);
                    fieldValidationState.isValidated = true;
                    me.onFieldValidated(fieldName);
                    originalValidation.resolve(validationResult);
                } else {
                    me.validateField(fieldName, options, originalValidation);
                }
            });
            return originalValidation.promise();
        }
        return fieldValidationState.lastValidation.promise();
    },

    getFieldValidationStateSnapshot: function (fieldName) {
        var me = this;
        return JSON.stringify(me.getFieldValidationState(fieldName));
    },

    getFieldValidationState: function (fieldName) {
        var me = this;
        var fieldDescriptor = me.getFieldDescriptor(fieldName);
        if (fieldDescriptor.isStoreField || fieldDescriptor.isModelField) {
            return fieldDescriptor.instance().getStateCounter();
        } else {
            var validationDependencies = Ext.Array.from(fieldDescriptor.validationDependencies);
            var value = me.get(fieldName);
            var dependencies = Ext.Array.map(validationDependencies, me.getFieldState, me);
            return {
                value: value,
                dependencies: dependencies
            };
        }
    },

    performValidation: function (fieldName, options) {
        var me = this;
        var fieldValidationRules = me._validationRules[fieldName];
        var fieldValue = me.getFieldValue(fieldName);
        var validationResults = Ext.Array.map(fieldValidationRules.syncRules, function (rule) { return rule.validateSync(fieldValue, fieldName, this, options); });
        var isInvalidatedBySynchronousRules = Ext.Array.some(validationResults, function (result) { return !!result.error; });
        var filterAndTransformResults = function (results) {
            var errors = Ext.Array.map(results, function (result) { return result.error; });
            errors = Ext.Array.filter(errors, function (error) { return !!error; })
            var infos = Ext.Array.map(results, function (result) { return result.info; });
            infos = Ext.Array.filter(infos, function (info) { return !!info; })
            return {
                errors: errors,
                infos: infos
            };
        };
        var fieldDescriptor = me.getFieldDescriptor(fieldName);
        var isUnderlyingAssociationAvailable = (fieldDescriptor.isStoreField || fieldDescriptor.isModelField) && fieldDescriptor.instance();
        if (!isInvalidatedBySynchronousRules && (fieldValidationRules.asyncRules.length || isUnderlyingAssociationAvailable)) {
            var asyncValidations = Ext.Array.map(fieldValidationRules.asyncRules, function (rule) { return rule.validateAsync(fieldValue, fieldName, this, options); });
            if (isUnderlyingAssociationAvailable) {
                var associationValidation = fieldDescriptor.instance().validate(options).then(function (validationResult) {
                    return {
                        error: validationResult.errors.join(';'),
                        info: validationResult.infos.join(';')
                    };
                });
                asyncValidations.push(associationValidation);
            }
            return Ext.Promise.all(asyncValidations).then(
                function (results) {
                    return filterAndTransformResults(validationResults.concat(results));
                },
                function (errors) {
                    return Ext.Promise.resolve({
                        errors: errors,
                        infos: []
                    });
                }
            );
        } else {
            return filterAndTransformResults(validationResults);
        }

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
        var fieldValidationState = me._validationState[fieldName];
        fieldValidationState.lastValidation = null;
        fieldValidationState.lastValidationStateSnapshot = null;
        fieldValidationState.lastValidationOptionsSnapshot = null;
        me.validateField(fieldName);
    },
    //endregion

    //region running business rules
    runBusinessRule: function (fieldName, ruleType) {
        var me = this;
        var businessRuleName = fieldName + ruleType;
        if (me._businessRules[businessRuleName]) {
            me.callBusinessRuleFn(function (model, callback) {
                var rule = me._businessRules[businessRuleName];
                rule.fn.call(rule.scope, me.getFieldValue(fieldName), me, callback);
            });
        }
    },

    callBusinessRuleFn: function (businessRuleFn, scope) {
        var me = this;
        me._businessRulesSyncCounter++;
        businessRuleFn.call(scope, me, me._businessRuleCompletedCallback);
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
        Ext.Array.forEach(me.getFieldsDescriptors(), function (field) {
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
        Ext.Array.forEach(me.getFieldsDescriptors(), function (field) {
            if (!excludedFields || !Ext.Array.contains(excludedFields, field.name)) {
                me.clearField(field.name);
            }
        });
        me.endEdit();
    },

    clearField: function (fieldName) {
        var me = this;
        var fieldDescriptor = me.getFieldDescriptor(fieldName);
        if ((fieldDescriptor.isModelField || fieldDescriptor.isStoreField) && fieldDescriptor.instance()) {
            fieldDescriptor.instance().clear();
            return;
        }
        me.set(fieldName, me.getDefaultFieldValue(fieldName));
    },

    getNumOfFields: function () {
        var me = this;
        return me.getFieldsDescriptors().length;
    },

    getNumOfComplexFields: function () {
        var me = this;
        return Ext.Array.filter(me.getFieldsDescriptors(), function (fieldDescriptor) { return fieldDescriptor.isStoreField || fieldDescriptor.isModelField; }).length;
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
            me.callJoined('afterEdit', [[options.fieldName]]);
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
                    me.callJoined('afterEdit', [[options.fieldName]]);
                }
                break;
        }
    },

    setValidationMessages: function (fieldName, errorMessages, infoMessages) {
        var me = this;
        me.setMetaInternal(fieldName, 'validationInfoMessages', Ext.Array.from(infoMessages), true);
        me.setMetaInternal(fieldName, 'validationErrorMessages', Ext.Array.from(errorMessages), true);
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
            me.callJoined('afterEdit', [[options.fieldName]]);
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
        return Ext.Array.findBy(me.getFieldsDescriptors(), function (f) { return f.name === fieldName; });
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
        }
    }
},
    function () {
        var Model = this;

        Model.onExtended(function (cls, data) {
            var proto = cls.prototype;

            Model.initValidationRules(data, cls, proto);
            Model.initBusinessRules(data, cls, proto);
        });
    });

Ext.data.Model.addStatics({
    METACHANGE: 'metachange',
    VALIDCHANGE: 'validchange',
    VALIDATED: 'validated'
});