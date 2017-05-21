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