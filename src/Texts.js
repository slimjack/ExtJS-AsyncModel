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