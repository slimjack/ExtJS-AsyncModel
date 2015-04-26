///#source 1 1 /src/binder/IGridMetaDataBinder.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.defineInterface('IGridMetaDataBinder', {
    inherit: 'ISingleton',
    methods: [
        'onInit',
        'onDestroy',
        'onRender'
    ]
});
///#source 1 1 /src/binder/IMetaDataBinder.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.defineInterface('IMetaDataBinder', {
    inherit: 'ISingleton',
    methods: [
        'getMetaDataName',
        'isApplicable',
        'onComponentBound',
        'onComponentUnbound',
        'applyMetaData'//(control, metaDataFieldName, metaValue, model, fieldName)
    ]
});
///#source 1 1 /src/binder/AbstractFormFieldBinder.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.AbstractFormFieldBinder', {
    implement: 'IMetaDataBinder',
    abstractClass: true,
    
    getMetaDataName: function () {
        if (!this.metaDataName) {
            Ext.Error.raise('metaDataName not defined');
        }
        return this.metaDataName;
    },

    onComponentBound: function (formField, model, modelFieldName) {},
    
    onComponentUnbound: function (formField) { },

    isApplicable: function (control) {
        return control.isFormField;
    },

    applyMetaData: function (control, metaValue, model, fieldName) { },

    applyPlugin: function (formField, ptype) {
        if (!formField.findPlugin(ptype)) {
            formField.addPlugin(ptype);
        }
    }
});
///#source 1 1 /src/binder/FormFieldReadOnlyBinder.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.FormFieldReadOnlyBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',
    metaDataName: 'readOnly',

    onComponentBound: function (formField, model, modelFieldName) {
        this.applyPlugin(formField, 'readonlylatching');
    },
    
    applyMetaData: function (control, metaValue, model, fieldName) {
        if (metaValue) {
            control.latchReadOnly();
        } else {
            control.unlatchReadOnly();
        }
    }
});
///#source 1 1 /src/binder/FormFieldRequiredBinder.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.FormFieldRequiredBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',

    requiredClassName: 'requiredField',
    metaDataName: 'required',

    applyMetaData: function (control, metaValue, model, fieldName) {
        var me = this;
        var requiredClassName = (control.requiredClassName === undefined) ? me.requiredClassName : control.requiredClassName;
        if (metaValue) {
            control.addCls(requiredClassName);
        } else {
            control.removeCls(requiredClassName);
        }
    }
});
///#source 1 1 /src/binder/FormFieldValidationBinder.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.FormFieldValidationBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',
    metaDataName: 'validationErrorMessages',

    onComponentBound: function (formField, model, modelFieldName) {
        this.applyPlugin(formField, 'externalvalidating');
    },

    applyMetaData: function (control, metaValue, model, fieldName) {
        control.setExternalErrors('modelValidation', metaValue);
    }
});
///#source 1 1 /src/binder/GridReadOnlyBinder.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.GridReadOnlyBinder', {
    implement: 'IGridMetaDataBinder',

    onInit: function(grid, plugin) {
        var me = this;
        grid.on('beforeedit', me.onBeforeCellEdit);
    },

    onDestroy: function(grid, plugin) {
        var me = this;
        grid.un('beforeedit', me.onBeforeCellEdit);
    },

    onRender: function(metadata, record, rowIndex, colIndex, store, view) {},

    onBeforeCellEdit: function (plugin, context) {
        var isEditable = !context.record.getMetaValue(context.column.dataIndex, 'readOnly');
        return isEditable;
    }

});
///#source 1 1 /src/binder/GridRequiredBinder.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.GridRequiredBinder', {
    implement: 'IGridMetaDataBinder',
    requiredCellCls: 'requiredGridCell',

    onInit: function (grid, plugin) { },
    onDestroy: function (grid, plugin) { },

    onRender: function(metadata, record, rowIndex, colIndex, store, view) {
        var dataIndex = metadata.column.dataIndex;

        if (record.getMetaValue(dataIndex, 'required')) {
            metadata.tdCls += ' ' + this.requiredCellCls;
        }
    }

});
///#source 1 1 /src/binder/GridValidationBinder.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.GridValidationBinder', {
    implement: 'IGridMetaDataBinder',
    invalidCellCls: 'invalidGridCell',
    
    onInit: function (grid, plugin) { },
    onDestroy: function (grid, plugin) { },

    onRender: function(metadata, record, rowIndex, colIndex, store, view) {
        var dataIndex = metadata.column.dataIndex;
        var validationErrorMessages = record.getMetaValue(dataIndex, 'validationErrorMessages');
        if (validationErrorMessages.length) {
            metadata.tdCls += ' ' + this.invalidCellCls;
            metadata.tdAttr = 'data-errorqtip="' + validationErrorMessages.join('</br>') + '"';
        } else {
            metadata.tdAttr = 'data-errorqtip=""';
        }
    }
});
///#source 1 1 /src/plugin/MetaDataBinding.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.plugin.MetaDataBinding', {
    alias: 'plugin.metadatabinding',
    extend: 'Ext.AbstractPlugin',
    inject: {
        metaDataBinders: 'IMetaDataBinder[]'
    },

    pathDelimiter: '.',

    init: function (owner) {
        var me = this;
        me._formFields = new DynamicComponentQuery(owner, '[isFormField]:not([excludeForm])');
        me._metaDataBinders = Ext.ux.util.Lookup.fromArray(me.metaDataBinders, function (binder) { return binder.getMetaDataName(); });
        me._modelBindingCallbacks = new Ext.ux.util.Lookup();
        me._modelBinds = {};
        me._formFields.every(function (component) {
            if (!component._metaBound) {
                me.bindComponent(component);
                component._metaBound = true;
            }
        });
        me._formFields.everyRemoved(function (component) {
            if (component._metaBound) {
                me.unbindComponent(component);
                delete component._metaBound;
            }
        });
    },

    bindComponent: function (component) {
        var me = this;
        var bind = component.getBind();
        if (bind && bind.value) {
            var fieldPath = bind.value.stub.path;
            var fieldPathParts = fieldPath.split(me.pathDelimiter);
            if (fieldPathParts.length < 2) {
                //this is not a bind to model
                return;
            }
            var fieldName = fieldPathParts[fieldPathParts.length - 1];
            var modelPath = fieldPathParts.slice(0, -1).join(me.pathDelimiter);
            var metaBasePathParts = Ext.Array.insert(fieldPathParts, fieldPathParts.length - 1, 'meta');
            var metaBasePath = metaBasePathParts.join(me.pathDelimiter);

            var viewModel = component.lookupViewModel();
            var model = viewModel.get(modelPath);
            if (!model) {
                if (!me._modelBinds[modelPath]) {
                    var modelBindDescriptor = '{' + modelPath + '}';
                    me._modelBinds[modelPath] = viewModel.bind(modelBindDescriptor, function (modelInstance) {
                        if (modelInstance) {
                            me._modelBindingCallbacks.eachForKey(modelPath, function(callback) { callback(modelInstance); });
                            me._modelBindingCallbacks.removeKey(modelPath);
                            me._modelBinds[modelPath].destroy();
                        }
                    });
                }
                me._modelBindingCallbacks.add(modelPath, function (modelInstance) {
                    me.bindComponentToModelField(component, modelInstance, fieldName, metaBasePath);
                });
            } else {
                me.bindComponentToModelField(component, model, fieldName, metaBasePath);
            }
        }
    },

    unbindComponent: function (component) {
        var me = this;
        if (component._metaBinds) {
            Ext.Array.forEach(component._metaBinds, function(metaBind) {
                metaBind.bind.destroy();
                metaBind.binder.onComponentUnbound(component);
            });
        }
    },

    bindComponentToModelField: function (component, modelInstance, fieldName, metaBasePath) {
        var me = this;
        if (modelInstance instanceof Ext.ux.data.AsyncModel) {
            var viewModel = component.lookupViewModel();
            var metaNames = modelInstance.getMetaDataNames();
            var metaVMBinds = [];
            Ext.Array.forEach(metaNames, function (metaName) {
                var metaPath = metaBasePath + me.pathDelimiter + metaName;
                var metaBinder = me.getMetaDataBinder(component, metaName);
                if (metaBinder) {
                    var bindDescriptor = '{' + metaPath + '}';
                    metaBinder.onComponentBound(component, modelInstance, fieldName);
                    metaBinder.applyMetaData(component, modelInstance.getMetaValue(fieldName, metaName), modelInstance, fieldName);
                    var metaVMBind = viewModel.bind(bindDescriptor, function (metaValue) {
                        metaBinder.applyMetaData(component, metaValue, modelInstance, fieldName);
                    });
                    metaVMBinds.push({
                        bind: metaVMBind,
                        binder: metaBinder
                    });
                }
            });
            component._metaBinds = metaVMBinds;
        }
    },

    getMetaDataBinder: function (control, metaDataFieldName) {
        var me = this;
        var result;
        var maxSpecificity = 0;
        me._metaDataBinders.eachForKey(metaDataFieldName, function (metaDataBinder) {
            var currentSpecificity = metaDataBinder.isApplicable(control);
            currentSpecificity = currentSpecificity === true ? 1 : (Ext.isNumber(currentSpecificity) ? currentSpecificity : 0);
            if (currentSpecificity > maxSpecificity) {
                result = metaDataBinder;
                maxSpecificity = currentSpecificity;
            }
        });
        return result;
    }
});


///#source 1 1 /src/plugin/GridMetaDataBinding.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.plugin.GridMetaDataBinding', {
    alias: 'plugin.gridmetadatabinding',
    extend: 'Ext.AbstractPlugin',
    inject: {
        gridMetaDataBinders: 'IGridMetaDataBinder[]'
    },

    mixins: [
        'Ext.util.Observable'
    ],

    init: function (grid) {
        var me = this;
        me._owner = grid;
        me.mixins.observable.constructor.call(me);
        me.callParent(arguments);
        me.initBinders();
    },

    initBinders: function() {
        var me = this;
        if (!me._bindersInitialized) {
            me.overrideColumnRenderers();
            me.overrideGridViewOnUpdate(me._owner);
            me.mon(me._owner, {
                reconfigure: {
                    fn: me.onReconfigure,
                    scope: me
                }
            });
            Ext.Array.each(me.gridMetaDataBinders, function(binder) {
                binder.onInit(me._owner, me);
            });
            me._bindersInitialized = true;
        }
    },

    destroy: function() {
        var me = this;
        if (me._bindersInitialized) {
            Ext.Array.each(me.gridMetaDataBinders, function (binder) {
                binder.onDestroy(me._owner, me);
            });
        }
    },

    getMetaDataMap: function (grid) {
        var columns = grid.columns;
        var metaDataMap = null;
        Ext.each(columns, function (column) {
            if (column.metaDataIndex) {
                metaDataMap = metaDataMap || {};
                if (!metaDataMap[column.metaDataIndex]) {
                    metaDataMap[column.metaDataIndex] = [];
                }
                metaDataMap[column.metaDataIndex].push(column.dataIndex);
            }
        });
        return metaDataMap;
    },

    onReconfigure: function (grid, store, columns, oldStore, oldColumns, eOpts) {
        var me = this;
        if (columns) {
            me.overrideColumnRenderers();
        }
    },

    overrideGridViewOnUpdate: function (grid) {
        var me = this;
        var metaDataMap = me.getMetaDataMap(grid);
        var gridView = grid.getView();
        var originalOnUpdate = gridView.onUpdate;
        if (metaDataMap) {
            gridView.onUpdate = function(store, record, operation, changedFieldNames) {
                if (operation !== Ext.data.Model.VALIDCHANGE) {
                    if (operation === Ext.data.Model.METACHANGE) {
                        arguments[3] = me.updateChangedFieldNames(changedFieldNames, metaDataMap);
                    }
                    originalOnUpdate.apply(gridView, arguments);
                }
            };
        } else {
            gridView.onUpdate = function (store, record, operation) {
                if (operation !== Ext.data.Model.VALIDCHANGE) {
                    originalOnUpdate.apply(gridView, arguments);
                }
            };
        }
    },

    updateChangedFieldNames: function (changedFieldNames, metaDataMap) {
        var result = Ext.Array.clone(changedFieldNames);
        Ext.each(changedFieldNames, function (fieldName) {
            var mappedDataIndexes = metaDataMap[fieldName];
            if (mappedDataIndexes) {
                result = result.concat(mappedDataIndexes);
            }
        });
        return result;
    },

    overrideColumnRenderers: function () {
        var me = this;
        var columns = me._owner.columns;
        Ext.each(columns, function (column) {
            var oldRenderer = column.renderer;
            var colRenderer;
            if (column.xtype === 'rownumberer') {
                return;
            }
            if (oldRenderer) {
                colRenderer = function (value, metadata, record, rowIndex, colIndex, store, view) {
                    value = me.renderer(value, metadata, record, rowIndex, colIndex, store, view);
                    value = oldRenderer.apply(this, [value, metadata, record, rowIndex, colIndex, store, view]);
                    return value;
                };
            } else {
                colRenderer = Ext.bind(me.renderer, me);
            }

            Ext.apply(column, {
                renderer: colRenderer,
                hasCustomRenderer: true
            });
        });
    },

    renderer: function (value, metadata, record, rowIndex, colIndex, store, view) {
        var me = this;
        var dataIndex = metadata.column.dataIndex;

        if (dataIndex) {
            Ext.Array.each(me.gridMetaDataBinders, function (binder) {
                binder.onRender(metadata, record, rowIndex, colIndex, store, view);
            });
        }
        return value;
    }
});


///#source 1 1 /src/validator/BoundOverride.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.override('Ext.data.validator.Bound', {
    autoTrim: true,
    getValue: function (fieldValue) {
        var me = this;
        if (fieldValue instanceof Ext.data.Store) {
            return fieldValue.count();
        }
        var stringified = String(fieldValue);
        if (me.autoTrim) {
            stringified = Ext.String.trim(stringified);
        }
        return stringified.length;
    },

    validateValue: function(value) {
        var me = this;
        if (value === undefined || value === null || !me.getValue(value)) {
            return this.getEmptyMessage();
        }
        return true;
    },

    validate: function (fieldValue) {
        var me = this;
        if (fieldValue instanceof Ext.data.Model) {
            return true;
        }
        return me.callParent(arguments);
    }
});
///#source 1 1 /src/validator/MetaDataValidatorMapper.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.validator.MetaDataValidatorMapper', {
    alternateClassName: 'MetaDataValidatorMapper',
    singleton: true,

    constructor: function() {
        this.map = {};
    },

    assosiate: function (metaDataName, validatorConfig, fieldConfigReplications) {
        this.map[metaDataName] = {
            config: validatorConfig,
            fieldConfigReplications: fieldConfigReplications
        };
    },

    getValidatorsMap: function () {
        return this.map;
    }

});

///#source 1 1 /src/validator/ParametrizedValidator.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.data.validator.ParametrizedValidator', {
    extend: 'Ext.data.validator.Validator',
    alias: 'data.validator.baseparametrizedvalidator',

    _infoMessage: '',

    validateWithOptions: function (fieldValue, modelRecord, options) {
        return this.validate(fieldValue, modelRecord);
    },

    getInfoMessage: function() {
        return this._infoMessage;
    }
});
///#source 1 1 /src/validator/Required.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.data.validator.Required', {
    extend: 'Ext.data.validator.ParametrizedValidator',
    alias: 'data.validator.required',
    type: 'required',
    config: {
        autoTrim: true,
        requiredMessage: 'This is a required field'
    },

    getValue: function (fieldValue) {
        var me = this;
        if (fieldValue instanceof Ext.data.Store) {
            return fieldValue.count();
        }
        var stringified = String(fieldValue);
        if (me.getAutoTrim()) {
            stringified = Ext.String.trim(stringified);
        }
        return stringified.length;
    },

    validate: function (fieldValue) {
        var me = this;
        if (fieldValue === undefined || fieldValue === null || !me.getValue(fieldValue)) {
            return me.getRequiredMessage();
        }
        return true;
    },

    validateWithOptions: function (fieldValue, modelRecord, options) {
        var me = this;
        if (options.validatePresence) {
            return me.callParent(arguments);
        }
        return true;
    }
});
///#source 1 1 /src/FieldMetaModel.js
Ext.define('Ext.ux.data.FieldMetaModel', {
    extend: 'Ext.data.Model',
    fields: [
        { name: 'readOnly', type: 'bool', defaultValue: false },
        { name: 'required', type: 'bool', defaultValue: false },
        { name: 'validationErrorMessages', type: 'auto', defaultValue: [] },
        { name: 'validationInfoMessages', type: 'auto', defaultValue: [] }
    ]
});

///#source 1 1 /src/MetaModel.js
Ext.define('Ext.ux.data.MetaModel', {
    extend: 'Ext.data.Model',
    idProperty: '__fakeId__',

    constructor: function () {
        var me = this;
        me.callParent(arguments);
        var receiver = {
            afterEdit: function (record, modifiedFieldNames) {
                me.callJoined('onMetaDataChanged', [record.fieldName, modifiedFieldNames, record]);
            }
        };
        me._fieldMetaRecordsMap = {};
        Ext.Array.forEach(me.fields, function (field) {
            if (field.identifier) {
                return;
            }
            var setterName = 'set' + Ext.String.capitalize(field.name);
            var fieldMetaRecord = Ext.create(me.fieldMetaModelName);
            fieldMetaRecord.fieldName = field.name;
            me[setterName].call(me, fieldMetaRecord);
            fieldMetaRecord.join(receiver);
            me._fieldMetaRecordsMap[field.name] = fieldMetaRecord;
        });
        me.reset();
    },

    getMeta: function (fieldName, metaName) {
        var me = this;
        return me._fieldMetaRecordsMap[fieldName].get(metaName);
    },

    setMeta: function (fieldName, metaName, value) {
        var me = this;
        return me._fieldMetaRecordsMap[fieldName].set(metaName, value);
    },

    reset: function () {
        var me = this;
        Ext.Array.forEach(me.fields, function (field) {
            if (!field.identifier) {
                me._fieldMetaRecordsMap[field.name].set(field.defaultValues);
            }
        });
    },

    getMetaDataNames: function () {
        var me = this;
        var metaFields = Ext.ClassManager.get(me.fieldMetaModelName).fields;
        var result = [];
        Ext.Array.each(metaFields, function (metaField) {
            if (!metaField.identifier) {
                result.push(metaField.name);
            }

        });
        return result;
    },

    statics: {
        createMetaModel: function (record) {
            var me = this;
            if (!(record instanceof Ext.ux.data.AsyncModel)) {
                throw 'Ext.ux.data.MetaModel can be applied only to Ext.ux.data.AsyncModel';
            }
            var metaModelClassName = Ext.getClassName(record) + '__Meta__';
            if (!Ext.ClassManager.isCreated(metaModelClassName)) {
                var fieldMetaModelName = record.fieldMetaModelName || 'Ext.ux.data.FieldMetaModel';
                var fieldDefinitions = Ext.Array.map(record.getFieldsDescription(), function (fieldDescription) {
                    var defaultMetaValues = me.getMetaDefaults(fieldMetaModelName, fieldDescription);
                    return { name: fieldDescription.name, reference: fieldMetaModelName, defaultValues: defaultMetaValues };
                });
                Ext.define(metaModelClassName, {
                    extend: 'Ext.ux.data.MetaModel',
                    fieldMetaModelName: fieldMetaModelName,
                    fields: fieldDefinitions
                });
            }
            return Ext.create(metaModelClassName);
        },

        getMetaDefaults: function (fieldMetaModelName, fieldDescription) {
            var metaFields = Ext.ClassManager.get(fieldMetaModelName).fields;
            var result = {};
            Ext.Array.forEach(metaFields, function (metaField) {
                if (metaField.name !== 'validationErrorMessages' && metaField.name !== 'validationInfoMessages') {
                    result[metaField.name] = fieldDescription[metaField.name] || metaField.defaultValue || null;
                }
            });
            return result;
        }
    }
});
///#source 1 1 /src/AsyncModel.js
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

    _defaultMetaDataValidatorsMap: {
        required: {
            config: 'required',
            fieldConfigReplications: ['requiredMessage']
        }
    },

    fields: [
        { name: 'meta', reference: 'Ext.ux.data.MetaModel' }
    ],

    //region Initialization
    constructor: function (data, session, options) {
        var me = this;
        var initialData = Ext.clone(data);
        me.mixins.observable.constructor.call(me);
        me.validationRules = me.validationRules || {};
        me.businessRules = me.businessRules || {};

        me._ignoredFieldNames = [];
        me._modifiedNestedFieldNames = [];
        me._validationCallbacks = [];
        me._businessLogicSyncCallbacks = [];
        var originalIsEqual = me.isEqual;
        me.isEqual = function (a, b) {
            var me = this;
            if (Ext.isArray(a) && Ext.isArray(b)) {
                return Ext.Array.equals(a, b);
            } else {
                return originalIsEqual.apply(me, arguments);
            }
        };

        me._suppressValidityReset++;
        me.callParent(arguments);
        me.initFields(options ? options.eagerNetsedInstantiation : false);
        me.initMetaData();
        me.initBusinessRules();
        me.initValidationModel();
        me._suppressValidityReset--;

        me.join({
            afterEdit: function () {
                var args = Array.prototype.slice.call(arguments, 0);
                args.shift();
                me.afterEdit.apply(me, args);
            }
        });
        if (options && options.applyNested) {
            me.loadData(initialData);
        }
    },

    getFieldsDescription: function () {
        var me = this;
        return me._fields;
    },

    getMetaDataNames: function () {
        var me = this;
        return me._metaModel.getMetaDataNames();
    },

    initFields: function (eagerNetsedInstantiation) {
        var me = this;
        me._fields = [];
        Ext.Array.forEach(me.fields, function (field) {
            if (field.name !== 'meta' && !field.reference) {
                me._fields.push(field);
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
                    me[schemaRole.setterName].call(me, new schemaRole.cls());
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
            me._fields.push(field);
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
        me._metaDataValidatorsMap = Ext.apply({}, MetaDataValidatorMapper.getValidatorsMap(), me.metaDataValidatorsMap);
        me._metaDataValidatorsMap = Ext.applyIf(me._metaDataValidatorsMap, me._defaultMetaDataValidatorsMap);
        Ext.Object.each(me._metaDataValidatorsMap, function (metaDataName, mapRecord) {
            mapRecord.activationRule = mapRecord.activationRule || function (model, fieldName) {
                return !!model.getMetaValue(fieldName, metaDataName);
            };
        });
        var emptyOptions = JSON.stringify({});
        me._validationModel = {};
        me._validationRules = {};
        Ext.Array.forEach(me._fields, function (field) {
            me._validationModel[field.name] = {
                isValidated: true,
                isValidating: false,
                lastValidatingOptions: emptyOptions,
                fieldState: 0,
                callbacks: [],
                lastValidValue: null
            };
            me._validationRules[field.name] = me.createValidationRule(field.name);
        });
    },

    initBusinessRules: function () {
        var me = this;
        me._businessRuleCompletedCallback = Ext.bind(me.onBusinessRuleCompleted, me);
        me._businessRules = {};
        Ext.Array.forEach(me._fields, function (field) {
            var changeRuleName = field.name + 'Change';
            var changeRule = me.businessRules[changeRuleName];
            if (changeRule) {
                me._businessRules[changeRuleName] = me.createAsyncRule(changeRule, field.name, me.defaultBusinessService);
            }
            var validChangeRuleName = field.name + 'ValidChange';
            var validChangeRule = me.businessRules[validChangeRuleName];
            if (validChangeRule) {
                me._businessRules[validChangeRuleName] = me.createAsyncRule(validChangeRule, field.name, me.defaultBusinessService);
            }
        });
    },
    //endregion

    //region Public methods
    syncWithBusinessRules: function (callback) {
        var me = this;
        me._businessRulesSyncCounter += me._fields.length;
        Ext.Array.forEach(me._fields, function (field) {
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
            me.resetValidation();
            me._suppressValidityReset++;
            me._suppressBusinessLogic++;
            me.resetMetaData();
            me.clearAllFields();
            me.beginEdit();
            Ext.Array.forEach(me._fields, function (field) {
                if (field.isStoreField || field.isModelField) {
                    if (data[field.name] && field.instance()) {
                        field.instance().loadData(data[field.name]);
                    }
                } else {
                    me.set(field.name, data[field.name]);
                }
            });
            me.endEdit();
            me.commit(true);
            me._suppressBusinessLogic--;
            me._suppressValidityReset--;
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
            me._suppressValidityReset++;
            me._suppressBusinessLogic++;
            me.clearAllFields(excludedFields);
            me.onClear();
            me._suppressBusinessLogic--;
            me._suppressValidityReset--;
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
            var syncCounter = me.getNumOfFields();
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
            Ext.Array.forEach(me._fields, function (field) {
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
        Ext.Array.forEach(me._fields, function (field) {
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
        Ext.Array.each(me._fields, function (field) {
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
            Ext.Array.each(me._fields, function (field) {
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
            var field = me.getField(fieldName);
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
        fieldValidationModel.isValidating = false;
        fieldValidationModel.isValidated = true;
        me.executeFieldValidationCallbacks(fieldName);
        var errorMessages = me.getMetaValue(fieldName, 'validationErrorMessages');
        var infoMessages = me.getMetaValue(fieldName, 'validationInfoMessages');
        me.fireEvent('validated', me, fieldName, errorMessages, infoMessages);
        me.afterValidated([fieldName]);
        if (!errorMessages.length
            && !me._suppressValidChangeEvent
            && !me.isEqual(fieldValidationModel.lastValidValue, me.get(fieldName))) {
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

    onLoad: Ext.emptyFn,

    onClear: Ext.emptyFn,

    onModelChange: function (modifiedFieldNames) {
        var me = this;
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

    getRawData: function (options) {
        var me = this;
        options = options || {};
        var result = me.getData();
//        delete result[me.idProperty];
        Ext.Array.forEach(me._fields, function (field) {
            if (options.includeViewFields || !me.getMetaValue(field.name, 'viewField')) {
                if ((field.isStoreField || field.isModelField) && field.instance()) {
                    result[field.name] = field.instance().getRawData();
                }
            }
        });
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
        var fieldValidationModel = me._validationModel[fieldName];
        Ext.Array.erase(fieldValidationModel.callbacks, 0, fieldValidationModel.callbacks.length);
        me._suppressValidChangeEvent = true;
        me.resetValidationMessages(fieldName);
        me.onFieldValidated(fieldName);
        me._suppressValidChangeEvent = false;
    },

    getFieldValue: function (fieldName) {
        var me = this;
        var field = Ext.Array.findBy(me._fields, function (field) { return field.name === fieldName; });
        if (field && (field.isStoreField || field.isModelField)) {
            return field.instance();
        } else {
            return me.get(fieldName);
        }
    },

    performValidation: function (fieldName, options, callback) {
        var me = this;
        var fieldValidationModel = me._validationModel[fieldName];
        var fieldValue = me.getFieldValue(fieldName);
        var currentOptions = JSON.stringify(options);
        var currentFieldState = fieldValidationModel.fieldState;
        var newValidation = currentOptions !== fieldValidationModel.lastValidatingOptions || currentFieldState !== fieldValidationModel.fieldState;
        if (newValidation) {
            fieldValidationModel.lastValidatingOptions = currentOptions;
        }
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
                        if (currentFieldState === fieldValidationModel.fieldState && fieldValidationModel.lastValidatingOptions === currentOptions) {
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

    tryCreateStandardValidator: function (ruleDefinition) {
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

        validatorConfig.fieldName = field.name;

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
        var validateFn = null;
        if (validator instanceof Ext.data.validator.ParametrizedValidator) {
            validateFn = Ext.bind(validator.validateWithOptions, validator);
        } else {
            validateFn = function (fieldValue, record, options) {
                return validator.validate(fieldValue, record);
            }
        }

        return function (fieldValue, options) {
            var validationResult = validateFn(fieldValue, me, options);
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
                infoMessage: validator.getInfoMessage ? validator.getInfoMessage() || '' : ''
            }
        }
    },

    createValidationRule: function (fieldName) {
        var me = this;
        var ruleDefinitions = Ext.Array.from(me.validationRules[fieldName]);
        var syncRules = me.createMappedValidators(fieldName);
        var asyncRules = [];
        Ext.Array.each(ruleDefinitions, function (ruleDefinition) {
            var syncRule = me.tryCreateStandardValidator(ruleDefinition);
            if (syncRule) {
                syncRules.push(syncRule);
            } else {
                asyncRules.push(me.createAsyncRule(ruleDefinition, fieldName, me.defaultValidationService));
            }
        });
        if (!asyncRules.length && !syncRules.length) {
            return null;
        }
        return function (fieldValue, options, callback) {
            var errorMessages = [];
            var infoMessages = [];
            Ext.Array.each(syncRules, function (syncRule) {
                var syncValidationResult = syncRule(fieldValue, options);
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
                Ext.Array.each(asyncRules, function (asyncRule) {
                    asyncRule.call(me, fieldValue, options, asyncRuleCallback);
                });
            } else {
                callback(errorMessages, infoMessages);
            }
        }
    },

    createAsyncRule: function (rule, fieldName, defaultScopeName) {
        var me = this;
        var ruleConfig = { fieldName: fieldName };
        if (Ext.isObject(rule)) {
            Ext.apply(ruleConfig, rule);
            rule = rule.descriptor;
            delete ruleConfig.descriptor;
        }

        var ruleFn;
        var ruleScope;
        var ruleArgs;

        if (Ext.isFunction(rule)) {
            ruleFn = rule;
            ruleScope = me;
            ruleArgs = [ruleConfig];
        } else {
            var scopeName = defaultScopeName;
            var methodName = rule;
            var methodPathParts = rule.split('.');
            if (methodPathParts.length === 2) {
                scopeName = methodPathParts[0];
                methodName = methodPathParts[1];
            }
            if (scopeName === 'this') {
                if (!me[methodName]) {
                    Ext.Error.raise(methodName + ' is not defined');
                }
                ruleFn = me[methodName];
                ruleScope = me;
                ruleArgs = [ruleConfig];
            } else {
                if (Deft.Injector.canResolve(scopeName)) {
                    ruleScope = Deft.Injector.resolve(scopeName);
                } else {
                    ruleScope = me[scopeName];
                }
                ruleFn = ruleScope[methodName];
                ruleArgs = [me, ruleConfig];
            }
        }
        return Ext.bind(ruleFn, ruleScope, ruleArgs, 0);
    },

    clearAllFields: function (excludedFields) {
        var me = this;
        me.beginEdit();
        Ext.Array.forEach(me._fields, function (field) {
            if (!excludedFields || !Ext.Array.contains(excludedFields, field.name)) {
                me.clearField(field.name);
            }
        });
        me.endEdit();
    },

    clearField: function (fieldName) {
        var me = this;
        var field = me.getField(fieldName);
        var fieldValue = me.getFieldValue(fieldName);
        var useNull = field.useNull;
        var defaultValue = field.defaultValue;
        var clearedValue = null;
        if (field.isModelField || field.isStoreField) {
            if (fieldValue) {
                fieldValue.clear();
            }
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
        var me = this;
        return me._fields.length;
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
        if (suppressValidation) {
            me._suppressValidityReset++;
        }
        me._metaModel.setMeta(fieldName, metaDataFieldName, value);
        if (suppressValidation) {
            me._suppressValidityReset--;
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
        return Ext.Array.findBy(me._fields, function (f) { return f.name === fieldName; });
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
        Model.initMetaDataValidatorsMap(data, cls, proto);
    });
});

Ext.data.Model.addStatics({
    METACHANGE: 'metachange',
    VALIDCHANGE: 'validchange',
    VALIDATED: 'validated'
});
///#source 1 1 /src/AsyncStore.js
//https://github.com/slimjack/ExtJs-AsyncModel

//Ext.ux.data.AsyncStore can be used only with Ext.ux.data.AsyncModel
Ext.define('Ext.ux.data.AsyncStore', {
    statics: {
        decorate: function (store) {
            Ext.override(store, {
                isAsyncStore: true,
                _validationCallbacks: [],
                _businessLogicSyncCallbacks: [],

                //region Public methods
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

                getRawData: function (options) {
                    var me = this;
                    var result = [];
                    me.each(function (record) {
                        result.push(record.getRawData(options));
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
        }
    }
});
