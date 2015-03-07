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
        me._formFields.on('componentsadd', me.onFormFieldsAdded, me);
        me._formFields.on('componentsremove', me.onFormFieldsRemoved, me);
        me._bindableControls.on('componentsadd', me.onBindableControlsAdded, me);
        me._bindableControls.on('componentsremove', me.onBindableControlsRemoved, me);
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
        me._model = model;
        me.bindFormFields();
        me.bindBindableControls();

        me._owner.fireEvent('modelbound', me._owner, me._model);
    },

    clearBinding: function () {
        var me = this;
        if (me._model) {
            me.unbindFormFields();
            me.unbindBindableControls();
            var model = me._model;
            delete me._model;
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
        if (me._model) {
            Ext.Array.each(addedFormFields, function (formField) {
                me.bindFormField(formField);
            });
        }
    },

    onFormFieldsRemoved: function (removedFormFields) {
        var me = this;
        if (me._model) {
            Ext.Array.each(removedFormFields, function(formField) {
                me.unbindFormField(formField);
            });
        }
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

        var model = me._modelFieldsMap[formField.dataField]._model;
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
        if (me._model) {
            Ext.Array.each(addedBindableControls, function(bindableControl) {
                me.bindBindableControl(bindableControl);
            });
        }
    },

    onBindableControlsRemoved: function (removedBindableControls) {
        var me = this;
        if (me._model) {
            Ext.Array.each(removedBindableControls, function(bindableControl) {
                me.unbindBindableControl(bindableControl);
            });
        }
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

        var model = me._modelFieldsMap[bindableControl.dataField]._model;
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
                    metaDataBinder.applyMetaData(formFieldRecord.formField, metaValue, modelFieldRecord._model, modelFieldRecord.modelFieldName);
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
                    metaDataBinder.applyMetaData(controlRecord.formField, metaValue, modelFieldRecord._model, modelFieldRecord.modelFieldName);
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
        modelFieldRecord._model.set(modelFieldRecord.modelFieldName, formField.getValue());
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
        var fieldOwner = me._model;
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

