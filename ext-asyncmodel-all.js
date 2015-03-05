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
    metaDataName: 'validationErrorMessage',

    onComponentBound: function (formField, model, modelFieldName) {
        this.applyPlugin(formField, 'externalvalidating');
    },

    applyMetaData: function (control, metaValue, model, fieldName) {
        control.setExternalError('modelValidation', metaValue);
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
        var isEditable = !context.record.getMeta(context.column.dataIndex, 'readOnly');
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

        if (record.getMeta(dataIndex, 'required')) {
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
        var validationErrorMessage = record.getMeta(dataIndex, 'validationErrorMessage');
        if (validationErrorMessage) {
            metadata.tdCls += ' ' + this.invalidCellCls;
            metadata.tdAttr = 'data-errorqtip="' + validationErrorMessage + '"';
        } else {
            metadata.tdAttr = 'data-errorqtip=""';
        }
    }
});
///#source 1 1 /src/mixin/Bindable.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.mixin.Bindable', {
    isBindable: true,

    //'model' is an instance of 'Ext.ux.data.AsyncModel' or 'Ext.ux.data.AsyncStore'
    bindModel: function (model) {
        Ext.Error.raise('Ext.ux.mixin.Bindable.bindModel method is not implemented');
    },

    clearModelBinding: function () {
        Ext.Error.raise('Ext.ux.mixin.Bindable.clearModelBinding method is not implemented');
    }

});
///#source 1 1 /src/plugin/DataBinding.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.plugin.DataBinding', {
    alias: 'plugin.databinding',
    extend: 'Ext.AbstractPlugin',
    inject: {
        metaDataBinders: 'IMetaDataBinder[]'
    },

    //region Private fields
    _rootModelIndex: '__root__',
    //endregion

    //region Initialization
    constructor: function (config) {
        var me = this;
        me._formFieldsMap = new Ext.ux.util.Lookup();
        me._bindableControlsMap = new Ext.ux.util.Lookup();
        me._metaDataBinders = Ext.ux.util.Lookup.fromArray(me.metaDataBinders, function (binder) { return binder.getMetaDataName(); });
        me._subscribedModels = {};
        me._modelFieldsMap = {};
        me.callParent(arguments);
    },

    init: function (owner) {
        var me = this;
        me._owner = owner;
        me._formFields = new DynamicComponentQuery(me._owner, '[isFormField][name]:not([excludeForm]), [isFormField][dataField]:not([excludeForm])', '[isBindable] [isFormField], [isFormField] [isFormField]');
        me._bindableControls = new DynamicComponentQuery(me._owner, '[isBindable][dataField]', '[isBindable]:not([dataField]) [isBindable]');
        me._formFields.on('queryadd', me.onFormFieldsAdded, me);
        me._formFields.on('queryremove', me.onFormFieldsRemoved, me);
        me._bindableControls.on('queryadd', me.onBindableControlsAdded, me);
        me._bindableControls.on('queryremove', me.onBindableControlsRemoved, me);
        me.applyBindableInterfaceToOwner();
    },

    applyBindableInterfaceToOwner: function () {
        var me = this;
        //Add 'Ext.ux.mixin.Bindable' implementation to plugin's owner
        Ext.apply(me._owner, {
            //'model' must be an instance of 'Ext.ux.data.AsyncModel'
            bindModel: function (model) {
                if (!(model instanceof Ext.ux.data.AsyncModel)) {
                    Ext.Error.raise(me._owner.$className + '.bindModel method accepts only "Ext.ux.data.AsyncModel" type');
                }
                this.clearModelBinding();
                me.bindModel(model);
            },
            clearModelBinding: function () {
                me.clearBinding();
            },
            isBindable: true
        });
    },
    //endregion

    //region Protected methods
    onFormFieldBound: function (formField, model, modelFieldName) {},
    onFormFieldUnbound: function (formField, model, modelFieldName) { },

    onBindableControlBound: function (control, model, modelFieldName) { },
    onBindableControlUnbound: function (control, model, modelFieldName) { },
    //endregion

    //region Private methods
    bindModel: function (model) {
        var me = this;
        me.model = model;
        me.bindFormFields();
        me.bindBindableControls();

        me._owner.fireEvent('modelbound', me._owner, me.model);
    },

    clearBinding: function () {
        var me = this;
        if (me.model) {
            me.unbindFormFields();
            me.unbindBindableControls();
            var model = me.model;
            me.model = null;
            me._owner.fireEvent('modelunbound', me._owner, model);
        }
    },

    //region Form fields binding
    bindFormFields: function () {
        var me = this;
        me._formFields.each(function (formField) {
            me.bindFormField(formField);
        });
    },

    unbindFormFields: function () {
        var me = this;
        me._formFieldsMap.clone().each(function (formFieldRecord) {
            me.unbindFormField(formFieldRecord.formField);
        });
    },

    onFormFieldsAdded: function (addedFormFields) {
        var me = this;
        Ext.Array.each(addedFormFields, function (formField) {
            me.bindFormField(formField);
        });
    },

    onFormFieldsRemoved: function (removedFormFields) {
        var me = this;
        Ext.Array.each(removedFormFields, function (formField) {
            me.unbindFormField(formField);
        });
    },

    bindFormField: function (formField) {
        var me = this;
        formField.dataField = formField.dataField || formField.name;
        var model = me.getFieldModel(formField.dataField);
        if (!model) {//there is no such field in model
            return;
        }
        var modelFieldPathElements = formField.dataField.split('.');
        var modelPath = modelFieldPathElements.length > 1 ? modelFieldPathElements.slice(0, modelFieldPathElements.length - 1).join('.') : '';
        var modelIndex = modelPath || me._rootModelIndex;
        var modelFieldName = modelFieldPathElements[modelFieldPathElements.length - 1];

        formField.setValue(model.get(modelFieldName));

        me.subscribeFormField(formField);

        if (!me._subscribedModels[modelIndex]) {
            me.subscribeModel(model, modelPath);
            me._subscribedModels[modelIndex] = model;
        }
        var metaDataBindersMap = me.getMetaDataBindersMap(model, formField);
        me._formFieldsMap.add(formField.dataField, {
            formField: formField,
            metaDataBindersMap: metaDataBindersMap
        });
        me._modelFieldsMap[formField.dataField] = {
            model: model,
            modelFieldName: modelFieldName
        };
        Ext.Object.each(metaDataBindersMap, function (metaDataName, metaDataBinder) {
            metaDataBinder.onComponentBound(formField, model, modelFieldName);
            metaDataBinder.applyMetaData(formField, model.getMeta(modelFieldName, metaDataName), model, modelFieldName);
        });
        me.onFormFieldBound(formField, model, modelFieldName);
    },

    unbindFormField: function (formField) {
        var me = this;
        var formFieldRecord = me._formFieldsMap.find(formField.dataField, function (item) { return item.formField === formField; });
        if (!formFieldRecord) {
            return;
        }
        me.unsubscribeFormField(formField);
        me._formFieldsMap.remove(formField.dataField, formFieldRecord);

        var model = me._modelFieldsMap[formField.dataField].model;
        var modelFieldPathElements = formField.dataField.split('.');
        var modelFieldName = modelFieldPathElements[modelFieldPathElements.length - 1];
        if (!me._formFieldsMap.get(formField.dataField).length) {
            var modelPath = modelFieldPathElements.length > 1 ? modelFieldPathElements.slice(0, modelFieldPathElements.length - 1).join('.') : '';
            var modelIndex = modelPath || me._rootModelIndex;
            me.unsubscribeModel(model);
            delete me._subscribedModels[modelIndex];
            delete me._modelFieldsMap[formField.dataField];
        }

        Ext.Object.eachValue(formFieldRecord.metaDataBindersMap, function (metaDataBinder) {
            metaDataBinder.onComponentUnbound(formField, model, modelFieldName);
        });

        me.onFormFieldUnbound(formField, model, modelFieldName);
    },

    subscribeModel: function (model, modelPath) {
        var me = this;
        model.on('metadatachange', me.onModelMetaDataChanged, me, { modelPath: modelPath });
        model.on('change', me.onModelChanged, me, { modelPath: modelPath });
    },

    unsubscribeModel: function (model) {
        var me = this;
        model.un('metadatachange', me.onModelMetaDataChanged, me);
        model.un('change', me.onModelChanged, me);
    },

    subscribeFormField: function (formField) {
        var me = this;

        if (formField.modelUpdateMode === 'onChange') {
            formField.on('change', me.onFormFieldChange, me);
        } else {
            formField.on('change', me.onFormFieldChange, me);
            formField.on('blur', me.onFormFieldBlur, me);
        }
    },

    unsubscribeFormField: function (formField) {
        var me = this;

        formField.un('change', me.onFormFieldChange, me);
        formField.un('blur', me.onFormFieldBlur, me);
    },
    //endregion

    //region Bindable controls binding
    bindBindableControls: function () {
        var me = this;
        me._bindableControls.each(function (bindableControl) {
            me.bindBindableControl(bindableControl);
        });
    },

    unbindBindableControls: function () {
        var me = this;
        me._bindableControlsMap.clone().each(function (bindableControlRecord) {
            me.unbindBindableControl(bindableControlRecord.control);
        });
    },

    onBindableControlsAdded: function (addedBindableControls) {
        var me = this;
        Ext.Array.each(addedBindableControls, function (bindableControl) {
            me.bindBindableControl(bindableControl);
        });
    },

    onBindableControlsRemoved: function (removedBindableControls) {
        var me = this;
        Ext.Array.each(removedBindableControls, function (bindableControl) {
            me.unbindBindableControl(bindableControl);
        });
    },

    bindBindableControl: function (bindableControl) {
        var me = this;
        var model = me.getFieldModel(bindableControl.dataField);
        if (!model) {//there is no such field in model
            return;
        }
        var modelFieldPathElements = bindableControl.dataField.split('.');
        var modelFieldName = modelFieldPathElements[modelFieldPathElements.length - 1];

        bindableControl.bindModel(model.get(modelFieldName));

        var metaDataBindersMap = me.getMetaDataBindersMap(model, bindableControl);
        me._bindableControlsMap.add(bindableControl.dataField, {
            control: bindableControl,
            metaDataBindersMap: metaDataBindersMap
        });
        me._modelFieldsMap[bindableControl.dataField] = {
            model: model,
            modelFieldName: modelFieldName
        };
        Ext.Object.each(metaDataBindersMap, function (metaDataName, metaDataBinder) {
            metaDataBinder.onComponentBound(bindableControl, model, modelFieldName);
            metaDataBinder.applyMetaData(bindableControl, model.getMeta(modelFieldName, metaDataName), model, modelFieldName);
        });
        me.onBindableControlBound(bindableControl, model, modelFieldName);
    },

    unbindBindableControl: function (bindableControl) {
        var me = this;
        var bindableControlRecord = me._bindableControlsMap.find(bindableControl.dataField, function (item) { return item.control === bindableControl; });
        if (!bindableControlRecord) {
            return;
        }
        bindableControl.clearModelBinding();
        me._bindableControlsMap.remove(bindableControl.dataField, bindableControl);

        var model = me._modelFieldsMap[bindableControl.dataField].model;
        var modelFieldPathElements = bindableControl.dataField.split('.');
        var modelFieldName = modelFieldPathElements[modelFieldPathElements.length - 1];
        if (!me._bindableControlsMap.get(bindableControl.dataField).length) {
            delete me._modelFieldsMap[bindableControl.dataField];
        }

        Ext.Object.eachValue(bindableControlRecord.metaDataBindersMap, function (metaDataBinder) {
            metaDataBinder.onComponentUnbound(bindableControl, model, modelFieldName);
        });

        me.onBindableControlUnbound(bindableControl, model, modelFieldName);
    },
    //endregion

    //region Event handlers
    onModelMetaDataChanged: function (model, fieldName, metaDataFieldName, metaValue, eventOptions) {
        var me = this;
        var modelFieldPathBase = eventOptions.modelPath ? eventOptions.modelPath + '.' : '';
        me.updateFormFieldsMetaData(modelFieldPathBase + fieldName, metaDataFieldName, metaValue);
        me.updateBoundBindableControlsMetaData(modelFieldPathBase + fieldName, metaDataFieldName, metaValue);
    },

    onModelChanged: function (model, modifiedFieldNames, eventOptions) {
        var me = this;
        var modelFieldPathBase = eventOptions.modelPath ? eventOptions.modelPath + '.' : '';
        Ext.each(modifiedFieldNames, function (fieldName) {
            me.updateFormFieldsValue(modelFieldPathBase + fieldName, model.get(fieldName));
        });
    },

    onFormFieldChange: function (formField) {
        var me = this;
        if (formField.modelUpdateMode === 'onBlur') {
            if (!formField.hasFocus) {
                me.applyFormFieldChange(formField);
            }
            return;
        } else {
            me.applyFormFieldChange(formField);
        }
    },

    onFormFieldBlur: function (formField) {
        var me = this;
        me.applyFormFieldChange(formField);
    },
    //endregion

    //region Meta data updating
    updateFormFieldsMetaData: function (fieldName, metaDataFieldName, metaValue) {
        var me = this;
        if (metaValue !== undefined) {
            var modelFieldRecord = me._modelFieldsMap[fieldName];
            me._formFieldsMap.eachForKey(fieldName, function (formFieldRecord) {
                var metaDataBinder = formFieldRecord.metaDataBindersMap[metaDataFieldName];
                if (metaDataBinder) {
                    metaDataBinder.applyMetaData(formFieldRecord.formField, metaValue, modelFieldRecord.model, modelFieldRecord.modelFieldName);
                }
            });
        }
    },

    updateBoundBindableControlsMetaData: function (fieldPath, metaDataFieldName, metaValue) {
        var me = this;
        if (metaValue !== undefined) {
            var modelFieldRecord = me._modelFieldsMap[fieldPath];
            me._bindableControlsMap.eachForKey(fieldPath, function(controlRecord) {
                var metaDataBinder = controlRecord.metaDataBindersMap[metaDataFieldName];
                if (metaDataBinder) {
                    metaDataBinder.applyMetaData(controlRecord.formField, metaValue, modelFieldRecord.model, modelFieldRecord.modelFieldName);
                }
            });
        }
    },

    getMetaDataBindersMap: function (model, control) {
        var me = this;
        var metaDataNames = model.getMetaDataNames();
        var result = {};
        Ext.Array.each(metaDataNames, function (metaName) {
            var foundMetaDataBinder = me.getMetaDataBinder(control, metaName);
            if (foundMetaDataBinder) {
                result[metaName] = foundMetaDataBinder;
            }
        });
        return result;
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
    },
    //endregion

    //region Value exchange
    applyFormFieldChange: function (formField) {
        var me = this;
        if (formField.dataField === me._ignoredModelFieldPath) {
            return;
        }
        me.ignoredFormField = formField;
        var modelFieldRecord = me._modelFieldsMap[formField.dataField];
        modelFieldRecord.model.set(modelFieldRecord.modelFieldName, formField.getValue());
        me.ignoredFormField = null;
    },

    updateFormFieldsValue: function (fieldPath, value) {
        var me = this;
        me._ignoredModelFieldPath = fieldPath;
        me._formFieldsMap.eachForKey(fieldPath, function (formFieldRecord) {
            if (formFieldRecord.formField !== me.ignoredFormField) {
                formFieldRecord.formField.setValue(value);
            }
        });
        me._ignoredModelFieldPath = '';
    },
    //endregion

    getFieldModel: function (modelFieldPath) {
        var me = this;
        var modelFieldPathElements = modelFieldPath.split('.');
        var fieldOwner = me.model;
        var fieldOwnerPathDepth = modelFieldPathElements.length - 1;
        var fieldName = modelFieldPathElements[modelFieldPathElements.length - 1];
        for (var i = 0; i < fieldOwnerPathDepth; i++) {
            fieldOwner = fieldOwner.get(modelFieldPathElements[i]);
        }
        var ownerFields = fieldOwner instanceof Ext.ux.data.AsyncModel ? Ext.getClass(fieldOwner).getFields() : [];
        var ownerHasField = Ext.Array.some(ownerFields, function(field) { return field.name === fieldName; });
        return ownerHasField ? fieldOwner : null;
    }
    //endregion
});


///#source 1 1 /src/plugin/GridDataBinding.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.plugin.GridDataBinding', {
    alias: 'plugin.griddatabinding',
    extend: 'Ext.ux.plugin.DataBinding',
    inject: {
        gridMetaDataBinders: 'IGridMetaDataBinder[]'
    },

    mixins: [
        'Ext.util.Observable'
    ],

    init: function (grid) {
        var me = this;
        me.mixins.observable.constructor.call(me);
        if (!grid.findPlugin(ptype)) {
            grid.addPlugin('gridstorereconfiguring');
        }

        me.callParent(arguments);
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

    applyBindableInterfaceToOwner: function () {
        var me = this;
        me.callParent(arguments);
        Ext.apply(me._owner, {
            //'model' must be an instance of 'Ext.ux.data.AsyncModel'
            bindModel: function (model) {
                if (!(model instanceof Ext.ux.data.AsyncStore) && !(model instanceof Ext.ux.data.AsyncModel)) {
                    Ext.Error.raise(Ext.create('ArgumentTypeException', { msg: owner.$className + '.bindModel method accepts only "Ext.ux.data.AsyncStore" type' }));
                }
                if (model instanceof Ext.ux.data.AsyncStore) {
                    this.clearModelBinding();
                    me.bindStore(model);
                } else {
                    this.clearModelBinding();
                    if (me._owner.storeDataField) {
                        me.bindStore(model.get(me._owner.storeDataField));
                    }
                    me.bindModel(model);
                }
            }
        });
    },

    bindStore: function (store) {
        var me = this;
        me.initBinders();
        me._store = store;
        me._originalStore = me._owner.store;
        me._storebinding = true;
        me._owner.reconfigure(store);
        me._storebinding = false;
        me._owner.fireEvent('storebound', me._owner, store);
    },

    clearBinding: function () {
        var me = this;
        me.callParent(arguments);
        if (me._store) {
            me._storebinding = true;
            me._owner.reconfigure(me._originalStore);
            me._storebinding = false;
            var store = me._store;
            me._store = null;
            me._originalStore = null;
            me._owner.fireEvent('storeunbound', me._owner, store);
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
        if (store && !me._storebinding) {
            Ext.Error.raise('Reconfiguring with store is forbidden for bindable grid');
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
///#source 1 1 /src/field/AsyncModel.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.field.AsyncModel', {
    extend: 'Ext.data.field.Field',

    alias: [
        'data.field.asyncmodel'
    ],

    isModelField: true,

    convert: function (value, modelInstance) {
        var fieldModel = modelInstance.get(this.name);
        if (!fieldModel && !value && this.lazy) {
            return null;
        }
        if (!fieldModel || !(fieldModel instanceof Ext.ux.data.AsyncModel)) {
            if (!this.model) {
                Ext.Error.raise("'model'  must be defined for field with type 'asyncmodel'");
            }
            if (!(Ext.ClassManager.get(this.model).prototype instanceof Ext.data.Model)) {
                Ext.Error.raise("Field with type 'asyncmodel' accepts only 'Ext.ux.data.AsyncModel' types of models");
            }
            fieldModel = Ext.create(this.model);
        }
        if (value) {
            fieldModel.set(value);
        }
        return fieldModel;
    },

    getType: function () {
        return 'model';
    }
});
///#source 1 1 /src/field/AsyncStore.js
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.field.AsyncStore', {
    extend: 'Ext.data.field.Field',

    alias: [
        'data.field.asyncstore'
    ],

    isStoreField: true,

    convert: function (value, modelInstance) {
        var fieldStore = modelInstance.get(this.name);
        if (!fieldStore && !value && this.lazy) {
            return null;
        }
        if (!fieldStore || !(fieldStore instanceof Ext.ux.data.AsyncStore)) {
            if (!(modelInstance instanceof Ext.ux.data.AsyncModel)) {
                Ext.Error.raise("Field with type 'asyncstore' can be used only for models of 'Ext.ux.data.AsyncModel' type");
            }
            if ((this.store) && !(Ext.ClassManager.get(this.store).prototype instanceof Ext.ux.data.AsyncStore)) {
                Ext.Error.raise("Field with type 'asyncstore' accepts only 'Ext.ux.data.AsyncStore' types of stores");
            }

            if ((this.model) && !(Ext.ClassManager.get(this.model).prototype instanceof Ext.ux.data.AsyncModel)) {
                Ext.Error.raise("Field with type 'asyncstore' accepts only 'Ext.ux.data.AsyncModel' types of models");
            }

            if (!(this.model || this.store)) {
                Ext.Error.raise("'model' or 'store' must be defined for field with type 'asyncstore'");
            }
            if (this.store) {
                fieldStore = Ext.create(this.store);
            } else {
                fieldStore = Ext.create('Ext.ux.data.AsyncStore', { model: this.model });
            }
        }
        if (value || fieldStore.count()) {
            fieldStore.loadData(value);
        }
        return fieldStore;
    },

    getType: function () {
        return 'store';
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
    _suppressValidation: 0,
    _suppressValidChangeEvent: 0,
    _suppressChangeEvent: 0,
    _modelState: 0,
    _defaultProxy: {
        type: 'memory'
    },
    _defaultMetaDataModel: {
        required: false,
        readOnly: false,
        validationErrorMessage: '',
        validationInfoMessage: ''
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
                    isValid: true,
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
            var syncCounter = me.getNumOfFields() + me.getNumOfComplexFields();
            var fieldCallback = function (errorMessage, infoMessage) {
                syncCounter--;
                if (syncCounter === 0) {
                    me.isValidating = false;
                    if (me.isValidated()) {
                        me.onModelValidated(me.isValid() && !errorMessage, errorMessage, infoMessage);
                    } else {
                        me.validate(options);
                    }
                }
            };
            if (Ext.isFunction(me.onValidate)) {
                syncCounter++;
                me.onValidate(options, fieldCallback);
            }
            Ext.Array.each(me.fields, function (field) {
                if (field.name === me.idProperty) { return; }
                me.validateField(field.name, options, fieldCallback);
                if (field.isStoreField || field.isModelField) {
                    me.get(field.name).validate(options, fieldCallback);
                }
            });
            me.onAfterModelValidationStarted();
        });
    },

    validateField: function (fieldName, options, callback) {
        var me = this;
        options = options || {};
        me.performValidation(fieldName, options, callback);
    },

    resetValidation: function () {
        var me = this;
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
        var isValid = true;
        Ext.Array.each(me.fields, function (field) {
            if (field.name === me.idProperty) { return; }

            isValid = !me.getMeta(field.name, 'validationErrorMessage');
            if (isValid && (field.isStoreField || field.isModelField)) {
                isValid = me.get(field.name).isValid();
            }
            if (!isValid) {
                return false;
            }
        });
        return isValid;
    },

    setMeta: function (fieldName, metaDataFieldName, value, suppressValidation) {
        var me = this;
        if (metaDataFieldName === 'validationErrorMessage' || metaDataFieldName === 'validationInfoMessage') {
            Ext.Error.raise('Direct set of "validationErrorMessage" or "validationInfoMessage" is forbidden');
        }
        me.setMetaInternal(fieldName, metaDataFieldName, value, suppressValidation);
    },

    setDefaultMeta: function (fieldName, metaDataFieldName, value, suppressValidation) {
        var me = this;
        var targetField = Ext.Array.findBy(me.fields, function (field) { return field.name === fieldName; });
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
                    if (metaName !== 'validationErrorMessage' || metaName !== 'validationInfoMessage') {
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
            var fieldValidationModel = me._validationModel[fieldName];
            return {
                isValidated: fieldValidationModel.isValidated,
                isValidating: fieldValidationModel.isValidating,
                validationErrorMessage: me.getMeta(fieldName, 'validationErrorMessage'),
                validationInfoMessage: me.getMeta(fieldName, 'validationInfoMessage')
            };
        } else {
            return null;
        }
    },

    getAllValidationInfo: function () {
        var me = this;
        var result = {};
        Ext.Object.each(me.validationModel, function (fieldName, validationInfo) {
            var info = me.getFieldValidationInfo(fieldName);
            var field = me.getField(fieldName);
            if (field.isStoreField || field.isModelField) {
                info.subInfo = me.get(fieldName).getAllValidationInfo();
            }
            result[fieldName] = info;
        });
        return result;
    },

    //endregion

    //region Protected methods
    onAfterModelValidationStarted: Ext.emptyFn,

    onBeforeModelValidationStarted: Ext.emptyFn,

    onModelValidated: function (isValid, errorMessage, infoMessage) {
        var me = this;
        if (!isValid && !errorMessage) {
            errorMessage = me.defaultModelErrorMessage;
        }
        Ext.each(me._validationCallbacks, function (validationCallback) {
            validationCallback(isValid, errorMessage, infoMessage);
        });
        Ext.Array.erase(me._validationCallbacks, 0, me._validationCallbacks.length);
    },

    onFieldValidated: function (fieldName, isValid) {
        var me = this;
        var fieldValidationModel = me._validationModel[fieldName];
        fieldValidationModel.isValidating = false;
        fieldValidationModel.isValidated = true;
        me.executeFieldValidationCallbacks(fieldName);
        me.fireEvent('validated', me, fieldName, isValid);
        me.afterValidated([fieldName]);
        if (isValid && !me._suppressValidChangeEvent) {
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
            && (metaDataFieldName !== 'validationErrorMessage')
            && (metaDataFieldName !== 'validationInfoMessage')) {

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
                    result[field.name] = thisModelData[field.name].getRawData();
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
        me.setValidationMessages(fieldName, '', '');
        me.onFieldValidated(fieldName, !errorMessage);
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
                    validateFn.call(me, fieldValue, options, function (errorMessage, infoMessage) {
                        if (modelState === me._modelState && fieldValidationModel.lastValidatingOptions === currentOptions) {
                            me.setValidationMessages(fieldName, errorMessage, infoMessage);
                            me.onFieldValidated(fieldName, !errorMessage);
                        }
                    });
                } else {
                    me.setValidationMessages(fieldName, '', '');
                    me.onFieldValidated(fieldName, true);
                }
            }
        }
    },

    executeFieldValidationCallbacks: function (fieldName) {
        var me = this;
        var fieldValidationModel = me._validationModel[fieldName];
        Ext.each(fieldValidationModel.callbacks, function (fieldValidationCallback) {
            Ext.callback(fieldValidationCallback, null, [!me.getMeta(fieldName, 'validationErrorMessage')]);
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
        var field = Ext.Array.findBy(me.fields, function (f) { return f.name === fieldName; });
        var result = [];
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
                        callback(errorMessages.join('</br>'), infoMessages.join('</br>'));
                    }
                }
                Ext.Array.each(asyncRules, function(asyncRule) {
                    asyncRule.call(me, fieldValue, options, asyncRuleCallback);
                });
            } else {
                callback(errorMessages.join('</br>'), infoMessages.join('</br>'));
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
            if (field.name != me.idProperty) {
                if (!excludedFields || !Ext.Array.contains(excludedFields, field.name)) {
                    me.clearField(field.name);
                }
            }
        });
        me.endEdit();
    },

    clearField: function (fieldName) {
        var me = this;
        var field = Ext.Array.findBy(me.fields, function (f) { return f.name === fieldName; });
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

    setValidationMessages: function (fieldName, errorMessage, infoMessage) {
        var me = this;
        me.setMetaInternal(fieldName, 'validationInfoMessage', infoMessage, true);
        me.setMetaInternal(fieldName, 'validationErrorMessage', errorMessage, true);
    },

    setMetaInternal: function (fieldName, metaDataFieldName, value, suppressValidation) {
        var me = this;

        if (me._metaData[fieldName][metaDataFieldName] !== value) {
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

    onNestedStoreChange: function (store, options) {
        var me = this;
        if (me.editing) {
            me._modifiedNestedFieldNames.push(options.fieldName);
        } else {
            me.afterEdit([options.fieldName]);
        }
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
///#source 1 1 /src/AsyncStore.js
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

    validate: function (validatePresence, callback) {
        var me = this;
        if (!validatePresence && me.isValidated()) {
            Ext.callback(callback, null, [me.isValid()]);
            return;
        }
        if (callback) {
            me._validationCallbacks.push(callback);
        }
        if (me.isValidating) {
            return;
        }
        var syncCounter = me.count();
        var recordValidationCallback = function () {
            syncCounter--;
            if (syncCounter === 0) {
                me.isValidating = false;
                if (me.isValidated()) {
                    me.onStoreValidated(me.isValid());
                } else {
                    me.validate(validatePresence);
                }
            }
        };
        if (syncCounter) {
            me.isValidating = true;
            me.each(function (record) {
                record.validate(validatePresence, recordValidationCallback);
            });
        } else {
            me.onStoreValidated(true);
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

    onStoreValidated: function (isValid) {
        var me = this;
        Ext.each(me._validationCallbacks, function (validationCallback) {
            Ext.callback(validationCallback, isValid);
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
