Ext.define('Ext.ux.AsyncModel.Texts', {
    alternateClassName: 'AsyncModelTexts',

    singleton: true,

    //Messages
    requiredFieldMessageTpl: '{fieldName} is a required field',
    desiredFieldMessageTpl: '{fieldName} is a desired field',
    invalidValue: 'Value is invalid',
    minLengthViolatedTpl: "{fieldName} cannot be less than {min} length",
    maxLengthViolatedTpl: "{fieldName} cannot be more than {max} length",
    minMaxLengthViolatedTpl: "{fieldName} must be minimum of {min} and maximum of {max} length",
    minBoundViolatedTpl: "{fieldName} cannot be less than {min}",
    maxBoundViolatedTpl: "{fieldName} cannot be more than {max}",
    minMaxBoundViolatedTpl: "{fieldName} must be minimum of {min} and maximum of {max}",
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

Ext.define('Ext.ux.data.validator.ValidationContext', {
    alternateClassName: 'ValidationContext',
    statics: {
        getFieldDisplayName: function (modelRecord, validatedFieldName) {
            var me = this;
            return modelRecord.getMetaValue(validatedFieldName, 'displayName') || validatedFieldName;
        },

        create: function (modelRecord, validatedFieldName, additionalContext) {
            var result = {
                fieldName: (modelRecord instanceof Ext.ux.data.AsyncModel) && validatedFieldName
                    ? this.getFieldDisplayName(modelRecord, validatedFieldName)
                    : validatedFieldName,
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

    register: function (registrationData) {
        var me = this;
        var registryRecord = me.createRegistryRecord(registrationData);
        Ext.Array.each(registryRecord.fieldAttributeNames, function (fieldAttributeName) {
            me._data[fieldAttributeName] = me._data[fieldAttributeName] || [];
            me._data[fieldAttributeName].push(registryRecord);
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
    createRegistryRecord: function (registrationData) {
        var me = this;
        if (!registrationData.fieldAttributeNames) {
            Ext.Error.raise("'fieldAttributeNames' not specified");
        }
        if (!registrationData.validator) {
            Ext.Error.raise("'validator' not specified");
        }
        return {
            fieldAttributeNames: Ext.Array.from(registrationData.fieldAttributeNames),
            validator: validator,
            activator: registrationData.activator || me.defaultActivationRule
        };
    },

    defaultActivationRule: function (model, fieldName, fieldAttributeName) {
        var fieldMetaDataNames = model.getMetaDataNames(fieldName);
        var attributeValue;
        if (Ext.Array.contains(fieldMetaDataNames, fieldAttributeName)) {
            attributeValue = model.getMetaValue(fieldName, fieldAttributeName);
        } else {
            var fieldDescriptor = model.getFieldDescriptor(fieldName);
            attributeValue = fieldDescriptor[fieldAttributeName];
        }
        return Ext.isDefined(attributeValue) && attributeValue !== null && !!attributeValue;
    }
    //endregion

});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.AsyncValidator', {
    implement: 'Ext.ux.validator.IAsyncValidator',
    extend: 'Ext.data.validator.Validator',
    alias: 'data.validator.asyncvalidator',

    type: 'asyncvalidator',

    constructor: function (config) {
        if (typeof config === 'function') {
            this.validateAsync = config;
        } else {
            this.callParent(arguments);
        }
    },

    validate: function (fieldValue, modelRecord) {
        Ext.Error.raise('Synchronous validation cannot be used with "Ext.ux.data.validator.AsyncValidator"');
    },

    validateAsync: Ext.abstractFn(),

    getValidationContext: function (modelRecord, validatedFieldName) {
        var me = this;
        return ValidationContext.create(modelRecord, validatedFieldName);
    }
});

//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.DynamicLength', {
    extend: 'Ext.ux.data.validator.DynamicBound',
    alias: 'data.validator.dynamiclength',
    type: 'dynamiclength',

    minBoundMetadataName: 'minLength',
    maxBoundMetadataName: 'maxLength',

    config: {
        minOnlyMessageTpl: AsyncModelTexts.minLengthViolatedTpl,
        maxOnlyMessageTpl: AsyncModelTexts.maxLengthViolatedTpl,
        bothMessageTpl: AsyncModelTexts.minMaxLengthViolatedTpl
    },

    getValue: function (fieldValue) {
        var me = this;
        if (fieldValue instanceof Ext.data.Store) {
            return fieldValue.count();
        }
        return fieldValue.length;
    }
});

Ext.define('Ext.ux.data.validator.DynamicLengthdValidatorProvider', {
    extend: 'Ext.ux.data.validator.ValidatorProvider',
    associatedFieldProperties: ['minLength', 'maxLength'],
    shareValidatorInstance: true,

    createValidatorInstance: function (fieldDescriptor) {
        return new Ext.ux.data.validator.DynamicLength();
    }
});
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.Required', {
    extend: 'Ext.ux.data.validator.SyncValidator',
    alias: 'data.validator.required',
    type: 'required',

    config: {
        errorMessageTpl: AsyncModelTexts.requiredFieldMessageTpl,
        trimStrings: true
    },

    isValid: function (fieldValue, fieldName, modelRecord, options) {
        var me = this;
        var required = modelRecord.getMetaValue(fieldName, 'required');
        if (!required || !options.validatePresence) {
            return true;
        }
        return me.isEmpty(fieldValue);
    },

    isEmpty: function (fieldValue) {
        if (!fieldValue) {
            return true;
        }
        if (fieldValue instanceof Ext.data.Store) {
            return !fieldValue.count();
        }
        if (Ext.isArray(fieldValue)) {
            return !fieldValue.length;
        }
        return false;
    }
});

Ext.define('Ext.ux.data.validator.RequiredValidatorProvider', {
    extend: 'Ext.ux.data.validator.ValidatorProvider',
    shareValidatorInstance: true,

    createValidatorInstance: function (fieldDescriptor) {
        return new Ext.ux.data.validator.Required();
    }
});
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.Desired', {
    extend: 'Ext.ux.data.validator.SyncValidator',
    alias: 'data.validator.desired',
    type: 'desired',

    config: {
        infoMessageTpl: AsyncModelTexts.desiredFieldMessageTpl,
        trimStrings: true
    },

    validateSync: function (fieldValue, fieldName, modelRecord, options) {
        var me = this;
        var desired = modelRecord.getMetaValue(fieldName, 'desired');
        if (!desired || !options.validatePresence) {
            return me.validResult;
        }
        return me.isEmpty(fieldValue) ? me.infoResult(modelRecord, fieldName) : me.validResult;
    }
});

Ext.define('Ext.ux.data.validator.DesiredValidatorProvider', {
    extend: 'Ext.ux.data.validator.ValidatorProvider',
    shareValidatorInstance: true,

    createValidatorInstance: function (fieldDescriptor) {
        return new Ext.ux.data.validator.Desired();
    }
});
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.TextCase', {
    implement: 'Ext.ux.validator.ISyncValidator',
    extend: 'Ext.data.validator.Validator',
    alias: 'data.validator.textcase',
    type: 'textcase',

    config: {
        validateTrimmed: true,
        upperCaseMessageTpl: AsyncModelTexts.onlyUpperCaseAllowedTpl,
        lowerCaseMessageTpl: AsyncModelTexts.onlyLowerCaseAllowedTpl,
        mixedCaseMessageTpl: AsyncModelTexts.onlyMixedCaseAllowedTpl
    },

    validResult: {
        error: '',
        info: ''
    },

    errorResult: function (error) {
        return {
            error: error,
            info: ''
        };
    },

    applyUpperCaseMessageTpl: function (template) {
        return new Ext.XTemplate(template);
    },

    applyLowerCaseMessageTpl: function (template) {
        return new Ext.XTemplate(template);
    },

    applyMixedCaseMessageTpl: function (template) {
        return new Ext.XTemplate(template);
    },

    validate: function (fieldValue, modelRecord) {
        var me = this;
        var errorMessage = me.validateSync(fieldValue, me.fieldName, modelRecord, {}).error;
        return errorMessage || true;
    },

    validateSync: function (fieldValue, fieldName, modelRecord, options) {
        var me = this;

        var textCase = modelRecord.getMetaValue(fieldName, 'textCase');
        if (!textCase) {
            return me.validResult;
        }

        fieldValue = me.getValidateTrimmed() ? Ext.String.trim(fieldValue) : fieldValue;
        if (!fieldValue) {
            return me.validResult;
        }

        switch (textCase) {
            case TextCasings.upper:
                return fieldValue === fieldValue.toUpperCase()
                    ? me.validResult
                    : me.errorResult(me.getUpperCaseMessageTpl.apply(me.getValidationContext(modelRecord, fieldName)))
            case TextCasings.lower:
                return fieldValue === fieldValue.toLowerCase()
                    ? me.validResult
                    : me.errorResult(me.getLowerCaseMessageTpl.apply(me.getValidationContext(modelRecord, fieldName)))
            case TextCasings.mixed:
                return fieldValue !== fieldValue.toLowerCase() && fieldValue !== fieldValue.toUpperCase()
                    ? me.validResult
                    : me.errorResult(me.getMixedCaseMessageTpl.apply(me.getValidationContext(modelRecord, fieldName)))
            default: throw "Unsupported text case mode: " + textCase;
        }
    }
});

Ext.define('Ext.ux.data.validator.TextCaseValidatorProvider', {
    extend: 'Ext.ux.data.validator.ValidatorProvider',
    associatedFieldTypes: ['string'],
    shareValidatorInstance: true,

    createValidatorInstance: function (fieldDescriptor) {
        return new Ext.ux.data.validator.TextCase();
    }
});
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.Email', {
    extend: 'Ext.ux.data.validator.SyncValidator',
    alias: 'data.validator.email',
    type: 'email',

    config: {
        errorMessageTpl: AsyncModelTexts.incorrectEmail
    },

    statics: {
        emailMatcher: /^(")?(?:[^\."])(?:(?:[\.])?(?:[\w\-!#$%&'*+\/=?\^_`{|}~]))*\1@(\w[\-\w]*\.){1,5}([A-Za-z]){2,6}$/
    },

    isValid: function (fieldValue, fieldName, modelRecord, options) {
        var me = this;
        fieldValue = Ext.String.trim(fieldValue);
        return fieldValue ? Ext.ux.data.validator.Email.emailMatcher.test(fieldValue) : true;
    }
});


Ext.define('Ext.ux.data.validator.EmailValidatorProvider', {
    extend: 'Ext.ux.data.validator.ValidatorProvider',
    associatedFieldTypes: ['email'],
    shareValidatorInstance: true,

    createValidatorInstance: function (fieldDescriptor) {
        return new Ext.ux.data.validator.Email();
    }
});
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.MaskRe', {
    extend: 'Ext.ux.data.validator.SyncValidator',
    alias: 'data.validator.maskre',
    type: 'maskre',

    config: {
        validateTrimmed: true,
        errorMessageTpl: AsyncModelTexts.forbiddenSymbols
    },

    isValid: function (fieldValue, fieldName, modelRecord, options) {
        var me = this;
        var maskRe = modelRecord.getMetaValue(fieldName, 'maskRe');
        if (!maskRe) {
            return true;
        }
        fieldValue = me.getValidateTrimmed() ? Ext.String.trim(fieldValue) : fieldValue;
        if (fieldValue) {
            for (var i = 0; i < fieldValue.length; i++) {
                if (!maskRe.test(fieldValue[i])) {
                    return false;
                }
            }
        }
        return true;
    }
});

Ext.define('Ext.ux.data.validator.MaskReValidatorProvider', {
    extend: 'Ext.ux.data.validator.ValidatorProvider',
    associatedFieldTypes: ['string'],
    shareValidatorInstance: true,

    createValidatorInstance: function (fieldDescriptor) {
        return new Ext.ux.data.validator.MaskRe();
    }
});
//https://github.com/slimjack/ExtJs-AsyncModel

Ext.define('Ext.ux.data.validator.RequireDigit', {
    extend: 'Ext.ux.data.validator.SyncValidator',
    alias: 'data.validator.requiredigit',
    type: 'requiredigit',

    //unicode numeric decimal digits (Nd category)
    digitMatcher: /[0-9a-zªµºß-öø-ÿāăąćĉċčďđēĕėęěĝğġģĥħĩīĭįıĳĵķ-ĸĺļľŀłńņň-ŉŋōŏőœŕŗřśŝşšţťŧũūŭůűųŵŷźżž-ƀƃƅƈƌ-ƍƒƕƙ-ƛƞơƣƥƨƪ-ƫƭưƴƶƹ-ƺƽ-ƿǆǉǌǎǐǒǔǖǘǚǜ-ǝǟǡǣǥǧǩǫǭǯ-ǰǳǵǹǻǽǿȁȃȅȇȉȋȍȏȑȓȕȗșțȝȟȡȣȥȧȩȫȭȯȱȳ-ȹȼȿ-ɀɂɇɉɋɍɏ-ʓʕ-ʯͱͳͷͻ-ͽΐά-ώϐ-ϑϕ-ϗϙϛϝϟϡϣϥϧϩϫϭϯ-ϳϵϸϻ-ϼа-џѡѣѥѧѩѫѭѯѱѳѵѷѹѻѽѿҁҋҍҏґғҕҗҙқҝҟҡңҥҧҩҫҭүұҳҵҷҹһҽҿӂӄӆӈӊӌӎ-ӏӑӓӕӗәӛӝӟӡӣӥӧөӫӭӯӱӳӵӷӹӻӽӿԁԃԅԇԉԋԍԏԑԓԕԗԙԛԝԟԡԣա-և٠-٩۰-۹߀-߉०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯๐-๙໐-໙༠-༩၀-၉႐-႙០-៩᠐-᠙᥆-᥏᧐-᧙᭐-᭙᮰-᮹᱀-᱉᱐-᱙ᴀ-ᴫᵢ-ᵷᵹ-ᶚḁḃḅḇḉḋḍḏḑḓḕḗḙḛḝḟḡḣḥḧḩḫḭḯḱḳḵḷḹḻḽḿṁṃṅṇṉṋṍṏṑṓṕṗṙṛṝṟṡṣṥṧṩṫṭṯṱṳṵṷṹṻṽṿẁẃẅẇẉẋẍẏẑẓẕ-ẝẟạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹỻỽỿ-ἇἐ-ἕἠ-ἧἰ-ἷὀ-ὅὐ-ὗὠ-ὧὰ-ώᾀ-ᾇᾐ-ᾗᾠ-ᾧᾰ-ᾴᾶ-ᾷιῂ-ῄῆ-ῇῐ-ΐῖ-ῗῠ-ῧῲ-ῴῶ-ῷⁱⁿℊℎ-ℏℓℯℴℹℼ-ℽⅆ-ⅉⅎↄⰰ-ⱞⱡⱥ-ⱦⱨⱪⱬⱱⱳ-ⱴⱶ-ⱼⲁⲃⲅⲇⲉⲋⲍⲏⲑⲓⲕⲗⲙⲛⲝⲟⲡⲣⲥⲧⲩⲫⲭⲯⲱⲳⲵⲷⲹⲻⲽⲿⳁⳃⳅⳇⳉⳋⳍⳏⳑⳓⳕⳗⳙⳛⳝⳟⳡⳣ-ⳤⴀ-ⴥ꘠-꘩ꙁꙃꙅꙇꙉꙋꙍꙏꙑꙓꙕꙗꙙꙛꙝꙟꙣꙥꙧꙩꙫꙭꚁꚃꚅꚇꚉꚋꚍꚏꚑꚓꚕꚗꜣꜥꜧꜩꜫꜭꜯ-ꜱꜳꜵꜷꜹꜻꜽꜿꝁꝃꝅꝇꝉꝋꝍꝏꝑꝓꝕꝗꝙꝛꝝꝟꝡꝣꝥꝧꝩꝫꝭꝯꝱ-ꝸꝺꝼꝿꞁꞃꞅꞇꞌ꣐-꣙꤀-꤉꩐-꩙ﬀ-ﬆﬓ-ﬗ０-９ａ-ｚ]|\ud801[\udc28-\udc4f\udca0-\udca9]|\ud835[\udc1a-\udc33\udc4e-\udc54\udc56-\udc67\udc82-\udc9b\udcb6-\udcb9\udcbb\udcbd-\udcc3\udcc5-\udccf\udcea-\udd03\udd1e-\udd37\udd52-\udd6b\udd86-\udd9f\uddba-\uddd3\uddee-\ude07\ude22-\ude3b\ude56-\ude6f\ude8a-\udea5\udec2-\udeda\udedc-\udee1\udefc-\udf14\udf16-\udf1b\udf36-\udf4e\udf50-\udf55\udf70-\udf88\udf8a-\udf8f\udfaa-\udfc2\udfc4-\udfc9\udfcb\udfce-\udfff]/,

    config: {
        errorMessageTpl: AsyncModelTexts.requireDigitTpl
    },

    isValid: function (fieldValue, fieldName, modelRecord, options) {
        var me = this;
        var requireDigit = modelRecord.getMetaValue(fieldName, 'requireDigit');
        if (!requireDigit || !fieldValue) {
            return true;
        }
        return me.digitMatcher.test(fieldValue);
    }
});

Ext.define('Ext.ux.data.validator.RequireDigitValidatorProvider', {
    extend: 'Ext.ux.data.validator.ValidatorProvider',
    associatedFieldTypes: ['string'],
    shareValidatorInstance: true,

    createValidatorInstance: function (fieldDescriptor) {
        return new Ext.ux.data.validator.RequireDigit();
    }
});
//https://github.com/slimjack/ExtJs-AsyncModel
Ext.define('Ext.ux.data.validator.RequireLetter', {
    extend: 'Ext.ux.data.validator.SyncValidator',
    alias: 'data.validator.requireletter',
    type: 'requireletter',

    //any unicode letter
    letterMatcher: /[A-Za-zªµºÀ-ÖØ-öø-ʯͰ-ͳͶ-ͷͻ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԣԱ-Ֆա-ևא-תװ-ײء-ؿف-يٮ-ٯٱ-ۓەۮ-ۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪऄ-हऽॐक़-ॡॲॻ-ॿঅ-ঌএ-ঐও-নপ-রলশ-হঽৎড়-ঢ়য়-ৡৰ-ৱਅ-ਊਏ-ਐਓ-ਨਪ-ਰਲ-ਲ਼ਵ-ਸ਼ਸ-ਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલ-ળવ-હઽૐૠ-ૡଅ-ଌଏ-ଐଓ-ନପ-ରଲ-ଳଵ-ହଽଡ଼-ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கங-சஜஞ-டண-தந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-ళవ-హఽౘ-ౙౠ-ౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠ-ೡഅ-ഌഎ-ഐഒ-നപ-ഹഽൠ-ൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะา-ำเ-ๅກ-ຂຄງ-ຈຊຍດ-ທນ-ຟມ-ຣລວສ-ຫອ-ະາ-ຳຽເ-ໄໜ-ໝༀཀ-ཇཉ-ཬྈ-ྋက-ဪဿၐ-ၕၚ-ၝၡၥ-ၦၮ-ၰၵ-ႁႎႠ-Ⴥა-ჺᄀ-ᅙᅟ-ᆢᆨ-ᇹሀ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙶᚁ-ᚚᚠ-ᛪᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៜᠠ-ᡂᡄ-ᡷᢀ-ᢨᢪᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦩᧁ-ᧇᨀ-ᨖᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮ-ᮯᰀ-ᰣᱍ-ᱏᱚ-ᱷᴀ-ᴫᵢ-ᵷᵹ-ᶚḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎↃ-ↄⰀ-Ⱞⰰ-ⱞⱠ-Ɐⱱ-ⱼⲀ-ⳤⴀ-ⴥⴰ-ⵥⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞ〆〼ぁ-ゖゟァ-ヺヿㄅ-ㄭㄱ-ㆎㆠ-ㆷㇰ-ㇿ㐀-䶵一-鿃ꀀ-ꀔꀖ-ꒌꔀ-ꘋꘐ-ꘟꘪ-ꘫꙀ-ꙟꙢ-ꙮꚀ-ꚗꜢ-ꝯꝱ-ꞇꞋ-ꞌꟻ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꤊ-ꤥꤰ-ꥆꨀ-ꨨꩀ-ꩂꩄ-ꩋ가-힣豈-鶴侮-頻並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּ-סּףּ-פּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ｯｱ-ﾝﾠ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ]|[\ud840-\ud868][\udc00-\udfff]|\ud800[\udc00-\udc0b\udc0d-\udc26\udc28-\udc3a\udc3c-\udc3d\udc3f-\udc4d\udc50-\udc5d\udc80-\udcfa\ude80-\ude9c\udea0-\uded0\udf00-\udf1e\udf30-\udf40\udf42-\udf49\udf80-\udf9d\udfa0-\udfc3\udfc8-\udfcf]|\ud801[\udc00-\udc9d]|\ud802[\udc00-\udc05\udc08\udc0a-\udc35\udc37-\udc38\udc3c\udc3f\udd00-\udd15\udd20-\udd39\ude00\ude10-\ude13\ude15-\ude17\ude19-\ude33]|\ud808[\udc00-\udf6e]|\ud835[\udc00-\udc54\udc56-\udc9c\udc9e-\udc9f\udca2\udca5-\udca6\udca9-\udcac\udcae-\udcb9\udcbb\udcbd-\udcc3\udcc5-\udd05\udd07-\udd0a\udd0d-\udd14\udd16-\udd1c\udd1e-\udd39\udd3b-\udd3e\udd40-\udd44\udd46\udd4a-\udd50\udd52-\udea5\udea8-\udec0\udec2-\udeda\udedc-\udefa\udefc-\udf14\udf16-\udf34\udf36-\udf4e\udf50-\udf6e\udf70-\udf88\udf8a-\udfa8\udfaa-\udfc2\udfc4-\udfcb]|\ud869[\udc00-\uded6]|\ud87e[\udc00-\ude1d]/,

    config: {
        errorMessageTpl: AsyncModelTexts.requireLetterTpl
    },

    isValid: function (fieldValue, fieldName, modelRecord, options) {
        var me = this;
        var requireLetter = modelRecord.getMetaValue(fieldName, 'requireLetter');
        if (!requireLetter || !fieldValue) {
            return true;
        }
        return me.letterMatcher.test(fieldValue);
    }
});

Ext.define('Ext.ux.data.validator.RequireLetterValidatorProvider', {
    extend: 'Ext.ux.data.validator.ValidatorProvider',
    associatedFieldTypes: ['string'],
    shareValidatorInstance: true,

    createValidatorInstance: function (fieldDescriptor) {
        return new Ext.ux.data.validator.RequireLetter();
    }
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
    isEmailField: true,

    getType: function () {
        return 'email';
    }
});
Ext.ux.data.MetaModel.assignDefaultFieldMetaModel('Ext.ux.data.StringFieldMetaModel', 'email');

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
//https://github.com/slimjack/ExtJs-AsyncModel

//Ext.ux.data.AsyncStore can be used only with Ext.ux.data.AsyncModel
Ext.define('Ext.ux.data.AsyncStore', {
    statics: {
        decorate: function (store) {
            Ext.override(store, {
                isAsyncStore: true,
                _businessLogicSyncCallbacks: [],
                _stateCounter: 0,

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
                },

                incrementStateCounter: function () {
                    var me = this;
                    me._stateCounter++;
                }
                //endregion
            });

            store.on('update', store.incrementStateCounter, store)
            store.on('datachanged', store.incrementStateCounter, store)
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
    },

    onComponentBound: function (formField, modelRecord, modelFieldName) {
        var me = this;
        var handler = function (modelRecord, fieldName, metaDataFieldName, value) {
            if (metaDataFieldName === 'readOnly' && modelFieldName === fieldName) {
                var isRequired = modelRecord.getMetaValue(fieldName, 'required');
                me.applyMetaData(formField, isRequired, modelRecord, modelFieldName);
            }
        };
        modelRecord.on('metadatachange', handler);
        formField.__required_binder_disposer = function () {
            modelRecord.un('metadatachange', handler);
            delete formField.__required_binder_disposer;
        }
    },

    onComponentUnbound: function (formField) {
        formField.__required_binder_disposer();
    },

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