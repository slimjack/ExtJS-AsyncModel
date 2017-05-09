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
        owner._metaDataBindable = true;
        me._formFields = new DynamicComponentQuery(owner,
            '[isFormField]:not([excludeForm]):not([bindMeta=false])',//query form fields which doesn't reject meta data binding
            '[_metaDataBindable] [isFormField]');//exclude form fields which are placed in container with 'metadatabinding' plugin applied
        me._metaDataBinders = Ext.ux.util.Lookup.fromArray(me.metaDataBinders, function (binder) { return binder.metaDataName(); });
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
        if (bind && bind.value && component.bindMeta !== false) {
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
                            me._modelBindingCallbacks.eachForKey(modelPath, function (callback) { callback(modelInstance); });
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
            Ext.Array.forEach(component._metaBinds, function (metaBind) {
                metaBind.bind.destroy();
                metaBind.binder.onComponentUnbound(component);
            });
        }
    },

    bindComponentToModelField: function (component, modelInstance, fieldName, metaBasePath) {
        var me = this;
        if (modelInstance instanceof Ext.ux.data.AsyncModel) {
            var viewModel = component.lookupViewModel();
            var metaNames = modelInstance.getMetaDataNames(fieldName);
            if (Ext.isObject(component.bindMeta)) {
                metaNames = Ext.Array.filter(metaNames, function (metaName) { return !!component.bindMeta[metaName]; });
            }
            var metaVMBinds = [];
            Ext.Array.forEach(metaNames, function (metaName) {
                var metaBinder = me.getMetaDataBinder(component, metaName);
                if (metaBinder) {
                    metaBinder.onComponentBound(component, modelInstance, fieldName);
                    metaBinder.applyMetaData(component, modelInstance.getMetaValue(fieldName, metaName), modelInstance, fieldName);
                    var metaPath = metaBasePath + me.pathDelimiter + metaName;
                    var bindDescriptor = '{' + metaPath + '}';
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