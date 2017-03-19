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
