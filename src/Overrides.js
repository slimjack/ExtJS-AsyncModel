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
