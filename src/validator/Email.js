//https://github.com/slimjack/ExtJs-AsyncModel

ValidatorRegistry.register(['isEmailField', 'email'], function (fieldConfig) {
    return new Ext.data.validator.Format({
        matcher: /^(")?(?:[^\."])(?:(?:[\.])?(?:[\w\-!#$%&'*+\/=?\^_`{|}~]))*\1@(\w[\-\w]*\.){1,5}([A-Za-z]){2,6}$/,
        message: AsyncModelTexts.incorrectEmail,
        ignoreEmpty: true,
        validateTrimmed: fieldConfig.validateTrimmed
    });
});
