Ext.define('Ext.ux.AsyncModel.Texts', {
    alternateClassName: 'AsyncModelTexts',

    singleton: true,

    //Messages
    requiredFieldMessageTpl: '{fieldName} is a required field',
    desiredFieldMessageTpl: '{fieldName} is a desired field',
    invalidValue: 'Value is invalid',
    minLengthViolatedTpl: "{fieldName} cannot be less than {minLength} characters",
    maxLengthViolatedTpl: "{fieldName} cannot be more than {maxLength} characters",
    minMaxLengthViolatedTpl: "{fieldName} must be minimum of {minLength} and maximum of {maxLength} characters",
    onlyUpperCaseAllowed: "Only upper case is allowed",
    onlyLowerCaseAllowed: "Only lower case is allowed",
    forbiddenSymbols: "Value contains forbidden symbols",
    onlyUpperCaseAllowedTpl: "Only upper case is allowed",
    onlyLowerCaseAllowedTpl: "Only lower case is allowed",
    onlyMixedCaseAllowedTpl: "{fieldName} must contain lowercase and uppercase letters",
    requireLetterTpl: "{fieldName} must contain at least one letter",
    requireDigitTpl: "{fieldName} must contain at least one digit",
    storeUniqueTpl: "Record with same {fieldName} already added",
    incorrectEmail: "Specified e-mail is incorrect"
});
Ext.override(Ext.form.TextField, {
    afterRender: function () {
        var me = this;
        me.callParent(arguments);
        if (me.subscribeFilterKeysAfterRender) {
            me.mon(me.inputEl, 'keypress', me.filterKeys, me);
            me.subscribeFilterKeysAfterRender = false;
        }
    },

    setMaskRe: function (maskRe) {
        var me = this;
        var prevMaskRe = me.maskRe;
        me.maskRe = maskRe;
        if (prevMaskRe && !me.maskRe) {
            if (me.inputEl) {
                me.mun(me.inputEl, 'keypress', me.filterKeys, me);
            } else {
                me.subscribeFilterKeysAfterRender = false;
            }
        } else if (!prevMaskRe && me.maskRe) {
            if (me.inputEl) {
                me.mon(me.inputEl, 'keypress', me.filterKeys, me);
            } else {
                me.subscribeFilterKeysAfterRender = true;
            }
        }
    },

    setMaxLength: function (maxLength) {
        var me = this;
        var isMaxLengthDefined = maxLength !== null && maxLength !== undefined && maxLength >= 0;
        if (isMaxLengthDefined) {
            me.maxLength = maxLength;
            me.enforceMaxLength = true;
            if (me.inputEl && me.inputEl.dom) {
                me.inputEl.dom.maxLength = maxLength !== Number.MAX_VALUE ? maxLength : undefined;
            }
        } else if (me.maxLength && me.maxLength !== Number.MAX_VALUE) {
            me.maxLength = Number.MAX_VALUE;
            me.enforceMaxLength = false;
            if (me.inputEl && me.inputEl.dom) {
                me.inputEl.dom.maxLength = 524288;//default value
            }
        }
    }
});

Ext.override(Ext.data.validator.Format, {
    validate: function (value) {
        var me = this;
        arguments[0] = value && me.validateTrimmed ? Ext.String.trim(value) : value;
        if (!me.ignoreEmpty || !Ext.isEmpty(value)) {
            return me.callParent(arguments);
        } else {
            return true;
        }
    }
});

Ext.override(Ext.data.field.Field, {
    isEqual: function (a, b) {
        var me = this;
        if (Ext.isArray(a) && Ext.isArray(b)) {
            return Ext.Array.equals(a, b);
        } else {
            return me.callParent(arguments);
        }
    }
});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.Context', {
    alternateClassName: 'ValidationContext',
    statics: {
        getFieldDisplayName: function (modelRecord, validatedFieldName) {
            var me = this;
            return modelRecord.getMetaValue(me.getFieldName(), 'displayName') || validatedFieldName;
        },

        create: function (modelRecord, validatedFieldName, additionalContext) {
            var result = {
                fieldName: this.getFieldDisplayName(record, validatedFieldName),
            };
            if (additionalContext) {
                Ext.apply(result, additionalContext);
            }
            return result;

        }
    }
});
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.Registry', {
    alternateClassName: 'ValidatorRegistry',
    singleton: true,

    constructor: function () {
        this._data = {};
    },

    register: function (fieldAttributeNames, validator, activator, aliases) {
        var me = this;
        if (Ext.isObject(fieldAttributeNames)) {
            validator = fieldAttributeNames.validator;
            activator = fieldAttributeNames.validator;
            aliases = fieldAttributeNames.aliases;
            fieldAttributeNames = fieldAttributeNames.fieldAttributeNames;
        }
        if (!fieldAttributeNames) {
            Ext.Error.raise("'fieldAttributeNames' not specified");
        }
        fieldAttributeNames = Ext.Array.from(fieldAttributeNames);
        var registryRecord = me.createRegistryRecord(validator, activator, fieldAttributeNames);
        Ext.Array.each(fieldAttributeNames, function (fieldAttributeName) {
            if (me._data[fieldAttributeName]) {
                Ext.Error.raise("Validator for '" + fieldAttributeName + "' has been already registered");
            }
            me._data[fieldAttributeName] = registryRecord;
        });
    },

    getData: function (additionalRegistrations) {
        var me = this;
        var result = {};
        Ext.Object.each(me._data, function (fieldAttributeName, registryRecord) {
            if (!result[fieldAttributeName]) {
                var resultRecord = {
                    validator: registryRecord.validator,
                    activator: registryRecord.activator
                };
                Ext.Array.each(registryRecord.aliases, function (alias) {
                    result[alias] = resultRecord;
                });
            }
        });
        if (additionalRegistrations) {
            Ext.Object.each(additionalRegistrations, function (fieldAttributeName, data) {
                var registryRecord = me.createRegistryRecord(data.validator, data.activator, [fieldAttributeName]);
                result[fieldAttributeName] = {
                    validator: registryRecord.validator,
                    activator: registryRecord.activator
                };
            });
        }
        return result;
    },

    //region private methods
    createRegistryRecord: function (validator, activator, fieldAttributeNames) {
        var me = this;
        if (!validator) {
            Ext.Error.raise("'validator' not specified");
        }
        activator = activator || me.defaultActivationRule;
        return {
            aliases: fieldAttributeNames,
            validator: validator,
            activator: activator
        };
    },

    defaultActivationRule: function (model, fieldName, fieldAttributeName) {
        var fieldMetaDataNames = model.getMetaDataNames(fieldName);
        if (Ext.Array.contains(fieldMetaDataNames, fieldAttributeName)) {
            return !!model.getMetaValue(fieldName, fieldAttributeName);
        } else {
            var fieldDescriptor = model.getFieldDescriptor(fieldName);
            return !!fieldDescriptor[fieldAttributeName];
        }
    }
    //endregion

});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.AsyncValidator', {
    mixins: [
        'Ext.mixin.Factoryable'
    ],

    alias: 'data.async.validator.base', // also configures Factoryable

    isAsyncValidator: true,
    type: 'base',

    config: {
        fieldName: ''
    },

    statics: {
        all: {},

        register: function (name, cls) {
            var all = this.all;
            all[name.toUpperCase()] = all[name.toLowerCase()] = all[name] = cls.prototype;
        }
    },

    onClassExtended: function (cls, data) {
        if (data.type) {
            Ext.data.validator.AsyncValidator.register(data.type, cls);
        }
    },

    constructor: function (config) {
        if (typeof config === 'function') {
            this.fnOnly = true;
            this.validate = config;
        } else {
            this.initConfig(config);
        }
    },

    validate: function (fieldValue, model, options, callback) {
        Ext.callback(callback, null, ['', '']);
    },

    getValidationContext: function (record) {
        var me = this;
        return ValidationContext.create(modelRecord, me.getFieldName());
    }
},
    function () {
        this.register(this.prototype.type, this);
    });

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.ParametrizedValidator', {
    extend: 'Ext.data.validator.Validator',
    alias: 'data.validator.baseparametrizedvalidator',
    config: {
        fieldName: '',
        infoMessage: '',
        errorMessageTpl: AsyncModelTexts.invalidValue,
    },

    applyInfoMessageTpl: function (template) {
        return new Ext.XTemplate(template);
    },

    applyErrorMessageTpl: function (template) {
        return new Ext.XTemplate(template);
    },

    //region public
    validate: function (fieldValue, modelRecord) {
        var me = this;
        if (!me.isValid()) {
            return Ext.String.format(me.getErrorMessageTpl(), me.getFieldDisplayName());
        }
        return true;
    },

    validateWithOptions: function (fieldValue, modelRecord, options) {
        var me = this;
        var validationResult = me.validate(fieldValue, modelRecord);
        var errorMessage = '';
        if (validationResult !== true) {
            if (!Ext.isString(validationResult) || !validationResult) {
                errorMessage = me.getErrorMessageTpl().apply(me.getValidationContext(modelRecord));
            } else {
                errorMessage = validationResult;
            }
        }

        return {
            errorMessage: errorMessage,
            infoMessage: me.getInfoMessage()
        };
    },
    //endregion

    //region protected
    isValid: function (fieldValue, modelRecord) {
        return true;
    },

    getValidationContext: function (record) {
        var me = this;
        return ValidationContext.create(modelRecord, me.getFieldName());
    },
    //endregion

    statics: {
        decorateStandard: function (standardValidator) {
            if (!standardValidator.validateWithOptions) {
                standardValidator.validateWithOptions = this.validateWithOptions;
            }
        },

        validateWithOptions: function (fieldValue, modelRecord, options) {
            var me = this;
            var validationResult = me.validate(fieldValue, modelRecord);
            var errorMessage = '';
            if (validationResult !== true) {
                if (!Ext.isString(validationResult) || !validationResult) {
                    errorMessage = me.defaultErrorMessage || AsyncModelTexts.invalidValue;
                } else {
                    errorMessage = validationResult;
                }
            }

            return {
                errorMessage: errorMessage,
                infoMessage: ''
            };
        }

    }
});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.DynamicLength', {
    extend: 'Ext.data.validator.Length',
    alias: 'data.validator.dynamiclength',
    type: 'dynamiclength',

    config: {
        trimStrings: true,
        fieldName: '',
        minOnlyMessageTpl: AsyncModelTexts.minLengthViolatedTpl,
        maxOnlyMessageTpl: AsyncModelTexts.maxLengthViolatedTpl,
        bothMessageTpl: AsyncModelTexts.minMaxLengthViolatedTpl
    },

    applyMinOnlyMessageTpl: function (template) {
        return new Ext.XTemplate(template);
    },

    applyMaxOnlyMessageTpl: function (template) {
        return new Ext.XTemplate(template);
    },

    applyBothMessageTpl: function (template) {
        return new Ext.XTemplate(template);
    },

    validateValue: function (value) {
        var me = this;
        return true;
    },

    validate: function (fieldValue, record) {
        var me = this;
        if (fieldValue instanceof Ext.data.Model) {
            return true;
        }

        fieldValue = me.prepareFieldValue(fieldValue);
        if (me.ignoreEmpty && Ext.isEmpty(fieldValue)) {
            return true;
        }

        arguments[0] = fieldValue;
        me.updateConfiguration(record);
        return me.callParent(arguments);
    },

    prepareFieldValue: function (fieldValue) {
        var me = this;
        if (fieldValue instanceof Ext.data.Store) {
            return fieldValue;
        }
        var stringified = String(fieldValue);
        if (me.getTrimStrings()) {
            stringified = Ext.String.trim(stringified);
        }
        return stringified;
    },

    getValue: function (fieldValue) {
        var me = this;
        if (fieldValue instanceof Ext.data.Store) {
            return fieldValue.count();
        }
        return fieldValue.length;
    },

    getValidationContext: function (record) {
        var me = this;
        var fieldName = me.getFieldName();
        return ValidationContext.create(record, fieldName, {
            minLength: record.getMetaValue(fieldName, 'minLength'),
            maxLength: record.getMetaValue(fieldName, 'maxLength')
        });
    },

    updateConfiguration: function (record) {
        var me = this;
        var context = me.getValidationContext(record);
        me.setConfig({
            minOnlyMessage: me.getMinOnlyMessageTpl().apply(context),
            maxOnlyMessage: me.getMaxOnlyMessageTpl().apply(context),
            bothMessage: me.getBothMessageTpl().apply(context),
            min: context.minLength === null ? undefined : context.minLength,
            max: context.maxLength === null ? undefined : context.maxLength
        });
    }
});

ValidatorRegistry.register(['minLength', 'maxLength'], function (fieldConfig) {
    return {
        type: 'dynamiclength',
        minOnlyMessageTpl: fieldConfig.minLengthMessageTpl,
        maxOnlyMessageTpl: fieldConfig.maxLengthMessageTpl,
        bothMessageTpl: fieldConfig.minMaxLengthMessageTpl,
        fieldName: fieldConfig.name,
        trimStrings: fieldConfig.validateTrimmed,
        ignoreEmpty: true
    };
});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.Required', {
    extend: 'Ext.ux.data.validator.ParametrizedValidator',
    alias: 'data.validator.required',
    type: 'required',
    config: {
        trimStrings: true,
        errorMessageTpl: AsyncModelTexts.requiredFieldMessageTpl
    },

    getValue: function (fieldValue) {
        var me = this;
        if (fieldValue instanceof Ext.data.Store) {
            return fieldValue.count();
        }
        if (Ext.isArray(fieldValue)) {
            return fieldValue.length;
        }
        var stringified = String(fieldValue);
        if (me.getTrimStrings()) {
            stringified = Ext.String.trim(stringified);
        }
        return stringified.length;
    },

    isValid: function (fieldValue, modelRecord) {
        var me = this;
        var isValueEmpty = fieldValue === undefined
            || fieldValue === null
            || !me.getValue(fieldValue);
        return !isValueEmpty;
    },

    validateWithOptions: function (fieldValue, modelRecord, options) {
        var me = this;
        if (options.validatePresence) {
            return me.callParent(arguments);
        }
        return {
            errorMessage: '',
            infoMessage: ''
        };
    }
});
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.Desired', {
    extend: 'Ext.ux.data.validator.Required',
    alias: 'data.validator.desired',
    type: 'desired',
    config: {
        trimStrings: true,
        errorMessage: AsyncModelTexts.desiredField
    },

    validate: function (fieldValue) {
        var me = this;
        var requiredValidatorResult = me.callParent(arguments);
        if (Ext.isString(requiredValidatorResult)) {
            me.setInfoMessage(requiredValidatorResult);
        }
        return true;
    }
});
//https://github.com/slimjack/ExtJs-AsyncModel

ValidatorRegistry.register('textCase', function (fieldConfig) {
    var fieldName = fieldConfig.name;
    return new Ext.data.validator.Validator(function (value, record) {
        if (Ext.isString(value) && fieldConfig.validateTrimmed) {
            value = Ext.String.trim(value);
        }

        if (Ext.isEmpty(value)) {
            return true;
        }

        var textCase = record.getMetaValue(fieldName, 'textCase');
        var matcher;
        var messageTpl;
        switch (textCase) {
            case TextCasings.upper:
                matcher = /^[^a-z]*$/;
                messageTpl = new Ext.XTemplate(AsyncModelTexts.onlyUpperCaseAllowedTpl);
                break;
            case TextCasings.lower:
                matcher = /^[^A-Z]*$/;
                messageTpl = new Ext.XTemplate(AsyncModelTexts.onlyLowerCaseAllowedTpl);
                break;
            case TextCasings.mixed:
                matcher = /^(?=.*[a-z])(?=.*[A-Z]).+$/;
                messageTpl = new Ext.XTemplate(AsyncModelTexts.onlyMixedCaseAllowedTpl);
                break;
            default: throw "Unsupported text case mode: " + fieldConfig.textCase;
        }
        if (!matcher.test(value)) {
            return messageTpl.apply(ValidationContext.create(record, fieldName));
        } else {
            return true;
        }
    });
});
//https://github.com/slimjack/ExtJs-AsyncModel

ValidatorRegistry.register(['isEmailField', 'email'], function (fieldConfig) {
    return new Ext.data.validator.Format({
        matcher: /^(")?(?:[^\."])(?:(?:[\.])?(?:[\w\-!#$%&'*+\/=?\^_`{|}~]))*\1@(\w[\-\w]*\.){1,5}([A-Za-z]){2,6}$/,
        message: AsyncModelTexts.incorrectEmail,
        ignoreEmpty: true,
        validateTrimmed: fieldConfig.validateTrimmed
    });
});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.MaskRe', {
    extend: 'Ext.ux.data.validator.ParametrizedValidator',
    alias: 'data.validator.maskre',
    type: 'maskre',
    config: {
        validateTrimmed: false,
        ignoreEmpty: false,
        errorMessageTpl: AsyncModelTexts.forbiddenSymbols
    },

    isValid: function (fieldValue, modelRecord) {
        var me = this;
        var maskRe = modelRecord.getMetaValue(me.getFieldName(), 'maskRe');
        var isValid = true;
        fieldValue = Ext.isString(fieldValue) && me.getValidateTrimmed() ? Ext.String.trim(fieldValue) : fieldValue;
        if (Ext.isString(fieldValue)
            && (!Ext.isEmpty(fieldValue) || !me.getIgnoreEmpty())
            && maskRe) {
            for (var i = 0; i < fieldValue.length; i++) {
                if (!maskRe.test(fieldValue[i])) {
                    isValid = false;
                    break;
                }
            }
        }
        return isValid;
    }
});

ValidatorRegistry.register('maskRe', function (fieldConfig) {
    return new Ext.ux.data.validator.MaskRe({
        errorMessageTpl: fieldConfig.maskReMesage,
        fieldName: fieldConfig.name,
        ignoreEmpty: true,
        validateTrimmed: fieldConfig.validateTrimmed
    });
});

//https://github.com/slimjack/ExtJs-AsyncModel

ValidatorRegistry.register('requireDigit', function (fieldConfig) {
    var messageTpl = new Ext.XTemplate(fieldConfig.requireDigitMessageTpl || AsyncModelTexts.requireDigitTpl);
    var fieldName = fieldConfig.name;
    return new Ext.data.validator.Validator(function (value, record) {
        if (Ext.isString(value) && fieldConfig.validateTrimmed) {
            value = Ext.String.trim(value);
        }

        if (Ext.isEmpty(value)) {
            return true;
        }

        if (!/\d/.test(value)) {
            return messageTpl.apply(ValidationContext.create(record, fieldName));
        } else {
            return true;
        }
    });
});

//https://github.com/slimjack/ExtJs-AsyncModel

ValidatorRegistry.register('requireLetter', function (fieldConfig) {
    var messageTpl = new Ext.XTemplate(fieldConfig.requireLetterMessageTpl || AsyncModelTexts.requireLetterTpl);
    var fieldName = fieldConfig.name;
    return new Ext.data.validator.Validator(function (value, record) {
        if (Ext.isString(value) && fieldConfig.validateTrimmed) {
            value = Ext.String.trim(value);
        }

        if (Ext.isEmpty(value)) {
            return true;
        }

        if (!/\D/.test(value)) {
            return messageTpl.apply(ValidationContext.create(record, fieldName));
        } else {
            return true;
        }
    });
});

//https://github.com/slimjack/ExtJs-AsyncModel

ValidatorRegistry.register({
    fieldAttributeNames: 'storeUnique',

    validator: function (fieldConfig) {
        var messageTpl = new Ext.XTemplate(fieldConfig.storeUniqueMessageTpl || AsyncModelTexts.storeUniqueTpl);
        var fieldName = fieldConfig.name;
        return new Ext.data.validator.Validator(function (value, record) {
            if (Ext.isString(value) && fieldConfig.validateTrimmed) {
                value = Ext.String.trim(value);
            }

            if (Ext.isEmpty(value) || !record.store) {
                return true;
            }

            var duplicateIndex = record.store.findBy(function (r) {
                var anotherValue = r.get(fieldName);
                if (Ext.isString(anotherValue) && fieldConfig.validateTrimmed) {
                    anotherValue = Ext.String.trim(anotherValue);
                }
                return r !== record && anotherValue === value;
            });

            if (duplicateIndex !== -1) {
                return messageTpl.apply(ValidationContext.create(record, fieldName));
            } else {
                return true;
            }
        });
    }
});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.FieldMetaModel', {
    extend: 'Ext.data.Model',
    fields: [
        { name: 'storeUnique', type: 'bool', defaultValue: false },
        { name: 'readOnly', type: 'bool', defaultValue: false },
        { name: 'displayName', type: 'string', defaultValue: '' },
        { name: 'required', type: 'bool', defaultValue: false },
        { name: 'desired', type: 'bool', defaultValue: false },
        { name: 'validationErrorMessages', type: 'auto', defaultValue: [] },
        { name: 'validationInfoMessages', type: 'auto', defaultValue: [] }
    ]
});
//https://github.com/slimjack/ExtJs-AsyncModel

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
            var fieldMetaRecord = Ext.create(field.metaModelName);
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

    getMetaDataNames: function (fieldName) {
        var me = this;
        if (!fieldName) {
            Ext.Error.raise(me.$className + '.getMetaDataNames: "fieldName" parameter is not specified');
        }
        var metaModelField = Ext.Array.findBy(me.fields, function (field) {
            return field.name === fieldName;
        });
        if (!metaModelField) {
            Ext.Error.raise(me.$className + '.getMetaDataNames: Field "' + fieldName + '" not found');
        }
        var metaFields = Ext.ClassManager.get(metaModelField.metaModelName).fields;
        var result = [];
        Ext.Array.each(metaFields, function (metaField) {
            if (!metaField.identifier) {
                result.push(metaField.name);
            }

        });
        return result;
    },

    statics: {
        globalFieldMetaModelMap: {},

        createMetaModel: function (record) {
            var me = this;
            if (!(record instanceof Ext.ux.data.AsyncModel)) {
                Ext.Error.raise('Ext.ux.data.MetaModel can be applied to Ext.ux.data.AsyncModel only');
            }
            var metaModelClassName = Ext.getClassName(record) + '__Meta__';
            if (!Ext.ClassManager.isCreated(metaModelClassName)) {
                var fieldDefinitions = Ext.Array.map(record.getFieldsDescriptors(), function (fieldDescription) {
                    var fieldMetaModelName = me.getFieldMetaModelName(record, fieldDescription);
                    var defaultMetaValues = me.getMetaDefaults(fieldMetaModelName, fieldDescription);
                    return {
                        name: fieldDescription.name,
                        reference: { type: fieldMetaModelName, role: fieldDescription.name },
                        defaultValues: defaultMetaValues,
                        metaModelName: fieldMetaModelName
                    };
                });
                Ext.define(metaModelClassName, {
                    extend: 'Ext.ux.data.MetaModel',
                    fields: fieldDefinitions
                });
            }
            return Ext.create(metaModelClassName);
        },

        getMetaDefaults: function (fieldMetaModelName, fieldDescription) {
            var metaFields = Ext.ClassManager.get(fieldMetaModelName).fields;
            var result = {};
            Ext.Array.forEach(metaFields, function (metaField) {
                result[metaField.name] = fieldDescription[metaField.name] || metaField.defaultValue || null;
            });
            return result;
        },

        getFieldMetaModelName: function (record, fieldDescription) {
            var me = this;
            var result = fieldDescription.metaModelName;
            if (!result && record.fieldMetaModelMap && fieldDescription.type) {
                result = record.fieldMetaModelMap[fieldDescription.type];
            }

            if (!result && fieldDescription.type) {
                result = me.globalFieldMetaModelMap[fieldDescription.type];
            }

            if (!result) {
                result = record.fieldMetaModelName || 'Ext.ux.data.FieldMetaModel';
            }
            return result;
        },

        assignDefaultFieldMetaModel: function (fieldMetaModelName, fieldType) {
            var me = this;
            me.globalFieldMetaModelMap[fieldType] = fieldMetaModelName;
        }
    }
});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.StringFieldMetaModel', {
    extend: 'Ext.ux.data.FieldMetaModel',
    fields: [
        { name: 'requireLetter', type: 'bool', defaultValue: false },
        { name: 'requireDigit', type: 'bool', defaultValue: false },
        { name: 'textCase', type: 'string', defaultValue: null },
        { name: 'maskRe', type: 'auto', defaultValue: null },
        { name: 'maxLength', type: 'integer', allowNull: true, defaultValue: null },
        { name: 'minLength', type: 'integer', allowNull: true, defaultValue: null },
        { name: 'displaySecured', type: 'bool', defaultValue: false }
    ]
});
Ext.ux.data.MetaModel.assignDefaultFieldMetaModel('Ext.ux.data.StringFieldMetaModel', 'string');

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.field.Array', {
    extend: 'Ext.data.field.Field',
    alias: 'data.field.array',
    isArrayField: true,
    compare: function (a, b) {
        var aLength = a.length;
        var bLength = b.length;
        return aLength == bLength ? 0 : aLength < bLength ? -1 : 1;
    },

    isEqual: function (a, b) {
        return Ext.Array.equals(a, b);
    }
});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.field.Email', {
    extend: 'Ext.data.field.String',
    alias: 'data.field.email',
    isEmailField: true
});
Ext.ux.data.MetaModel.assignDefaultFieldMetaModel('Ext.ux.data.StringFieldMetaModel', 'email');

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

    initBinders: function () {
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
            Ext.Array.each(me.gridMetaDataBinders, function (binder) {
                binder.onInit(me._owner, me);
            });
            me._bindersInitialized = true;
        }
    },

    destroy: function () {
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
            gridView.onUpdate = function (store, record, operation, changedFieldNames) {
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
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.defineInterface('IMetaDataBinder', {
    inherit: 'ISingleton',
    methods: [
        'isApplicable',
        'onComponentBound',
        'onComponentUnbound',
        'applyMetaData'//(control, metaDataFieldName, metaValue, model, fieldName)
    ],
    properties: [
        { name: 'listenedMetaDataNames', readOnly: true },
        { name: 'metaDataName', readOnly: true }
    ]
});
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

    getListenedMetaDataNames: function () {
        if (!this.metaDataName) {
            Ext.Error.raise('metaDataName not defined');
        }
        return [this.metaDataName];
    },

    onComponentBound: function (formField, model, modelFieldName) { },

    onComponentUnbound: function (formField) { },

    isApplicable: function (control) {
        return control.isFormField;
    },

    applyMetaData: function (control, metaValue, model, fieldName) { },

    applyPlugin: function (formField, plugin) {
        var ptype = Ext.isString(plugin) ? plugin : plugin.ptype;
        if (!formField.findPlugin(ptype)) {
            formField.addPlugin(plugin);
        }
    }
});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.FormFieldDisplayNameBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',
    metaDataName: 'displayName',

    applyMetaData: function (control, metaValue, model, fieldName) {
        if (Ext.isString(metaValue)) {
            control.setFieldLabel(metaValue);
        }
    }
});

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
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.FormFieldRequiredBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',

    requiredClassName: 'requiredField',
    metaDataName: 'required',

    applyMetaData: function (control, metaValue, modelRecord, fieldName) {
        var me = this;
        var requiredClassName = (control.requiredClassName === undefined) ? me.requiredClassName : control.requiredClassName;
        if (metaValue && !modelRecord.getMetaValue(fieldName, 'readOnly')) {
            control.addCls(requiredClassName);
        } else {
            control.removeCls(requiredClassName);
        }
    }
});
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.FormFieldDesiredBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',

    desiredClassName: 'desiredField',
    metaDataName: 'desired',

    applyMetaData: function (control, metaValue, modelRecord, fieldName) {
        var me = this;
        var desiredClassName = (control.desiredClassName === undefined) ? me.desiredClassName : control.desiredClassName;
        if (metaValue && !modelRecord.getMetaValue(fieldName, 'readOnly')) {
            control.addCls(desiredClassName);
        } else {
            control.removeCls(desiredClassName);
        }
    }
});
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

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.TextFieldCasingBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',
    metaDataName: 'textCase',

    onComponentBound: function (formField, model, modelFieldName) {
        this.applyPlugin(formField, 'fieldcasing');
    },

    applyMetaData: function (formField, metaValue, model, fieldName) {
        var me = this;
        formField.setCasing(metaValue);
    },

    isApplicable: function (control) {
        return this.callParent(arguments) && (control instanceof Ext.form.field.Text);
    }
});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.TextFieldDisplaySecuredBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',
    metaDataName: 'displaySecured',

    applyMetaData: function (formField, metaValue, model, fieldName) {
        if (formField.inputEl && formField.inputEl.dom) {
            if (metaValue === true) {
                formField.__originalInputElType = formField.inputEl.dom.type;
                formField.inputEl.dom.type = 'password';
            } else if (metaValue === false && formField.__originalInputElType && formField.inputEl.dom.type === 'password') {
                formField.inputEl.dom.type = formField.__originalInputElType;
            }
        }
    },

    isApplicable: function (control) {
        var me = this;
        return me.callParent(arguments) && (control instanceof Ext.form.field.Text);
    }
});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.TextFieldMaskReBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',
    metaDataName: 'maskRe',

    applyMetaData: function (formField, metaValue, model, fieldName) {
        var me = this;
        if (metaValue !== null && metaValue !== undefined) {
            formField.setMaskRe(metaValue);
        }
    },

    isApplicable: function (control) {
        var me = this;
        return me.callParent(arguments) && (control instanceof Ext.form.field.Text);
    }
});
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.TextFieldMaxLengthBinder', {
    extend: 'Ext.ux.binder.AbstractFormFieldBinder',
    metaDataName: 'maxLength',

    applyMetaData: function (formField, metaValue, model, fieldName) {
        var me = this;
        if (metaValue !== null && metaValue !== undefined) {
            formField.setMaxLength(metaValue);
        }
    },

    isApplicable: function (control) {
        var me = this;
        return me.callParent(arguments) && (control instanceof Ext.form.field.Text);
    }
});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.defineInterface('IGridMetaDataBinder', {
    inherit: 'ISingleton',
    methods: [
        'onInit',
        'onDestroy',
        'onRender'
    ]
});
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.GridDesiredBinder', {
    implement: 'IGridMetaDataBinder',
    desiredCellCls: 'desiredGridCell',

    onInit: function (grid, plugin) { },
    onDestroy: function (grid, plugin) { },

    onRender: function (metadata, record, rowIndex, colIndex, store, view) {
        var dataIndex = metadata.column.dataIndex;

        if (record.getMetaValue(dataIndex, 'desired') && !record.getMetaValue(dataIndex, 'readOnly')) {
            metadata.tdCls += ' ' + this.desiredCellCls;
        }
    }

});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.GridReadOnlyBinder', {
    implement: 'IGridMetaDataBinder',

    onInit: function (grid, plugin) {
        var me = this;
        grid.on('beforeedit', me.onBeforeCellEdit);
    },

    onDestroy: function (grid, plugin) {
        var me = this;
        grid.un('beforeedit', me.onBeforeCellEdit);
    },

    onRender: function (metadata, record, rowIndex, colIndex, store, view) { },

    onBeforeCellEdit: function (plugin, context) {
        var isEditable = !context.record.getMetaValue(context.column.dataIndex, 'readOnly');
        return isEditable;
    }

});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.GridRequiredBinder', {
    implement: 'IGridMetaDataBinder',
    requiredCellCls: 'requiredGridCell',

    onInit: function (grid, plugin) { },
    onDestroy: function (grid, plugin) { },

    onRender: function (metadata, record, rowIndex, colIndex, store, view) {
        var dataIndex = metadata.column.dataIndex;

        if (record.getMetaValue(dataIndex, 'required') && !record.getMetaValue(dataIndex, 'readOnly')) {
            metadata.tdCls += ' ' + this.requiredCellCls;
        }
    }

});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.binder.GridValidationBinder', {
    implement: 'IGridMetaDataBinder',
    invalidCellCls: 'invalidGridCell',

    onInit: function (grid, plugin) { },
    onDestroy: function (grid, plugin) { },

    onRender: function (metadata, record, rowIndex, colIndex, store, view) {
        var dataIndex = metadata.column.validationDataIndex || metadata.column.dataIndex;
        var validationErrorMessages = record.getMetaValue(dataIndex, 'validationErrorMessages');
        if (validationErrorMessages.length) {
            metadata.tdCls += ' ' + this.invalidCellCls;
            metadata.tdAttr = 'data-errorqtip="' + validationErrorMessages.join('</br>') + '"';
        } else {
            metadata.tdAttr = 'data-errorqtip=""';
        }
    }
});