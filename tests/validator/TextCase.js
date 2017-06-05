/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/jasmine/2.5.2/jasmine.js" />
/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/extjs/6.2.0/ext-all-debug.js" />
/// <reference path="https://github.com/deftjs/DeftJS5/releases/download/v5.0.0-alpha.1/deft-debug.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Utils/releases/download/v0.1.0/ext-utils-all.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Interfaces/releases/download/v1.0.0/InterfaceManager.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Interfaces/releases/download/v1.0.0/InterfaceInjector.j" />
/// <reference path="../../ext-asyncmodel-all.js" />

Ext.define('Ext.ux.data.validator.TextCase.TestModel', {
    extend: 'Ext.ux.data.AsyncModel',
    fields: [
        { name: 'testField', type: 'string', allowNull: true }
    ],

    proxy: {
        type: 'memory'
    }
});

describe('Ext.ux.data.validator.TextCase', function () {
    describe('Available via IValidatorProvider', function () {
        var providers = Deft.Injector.resolve('Ext.ux.validator.IValidatorProvider[]');
        it('If field is of "string" type', function () {
            var validators = Ext.Array.map(providers, function (p) { return p.getValidator({ type: 'string' }); });
            validators = Ext.Array.filter(validators, function (v) { return v instanceof Ext.ux.data.validator.TextCase; });
            expect(validators.length).toBeGreaterThan(0);
        });
        it('For other field types it is not available', function () {
            var validators = Ext.Array.map(providers, function (p) { return p.getValidator({}); });
            validators = Ext.Array.filter(validators, function (v) { return v instanceof Ext.ux.data.validator.TextCase; });
            expect(validators.length).toBe(0);
        });
    });

    it('Available via ValidatorFactory.', function () {
        var validator = Ext.ux.data.validator.ValidatorFactory.createValidator({
            type: 'textcase'
        });
        expect(validator instanceof Ext.ux.data.validator.TextCase).toBe(true);
    });

    it('Implements ISyncValidator.', function () {
        var validator = new Ext.ux.data.validator.TextCase();
        expect(validator.$is('Ext.ux.validator.ISyncValidator')).toBe(true);
    });

    describe('validateSync', function () {
        var upperCaseErrorMessage = (new Ext.XTemplate(AsyncModelTexts.onlyUpperCaseAllowedTpl))
            .apply(ValidationContext.create(new Ext.ux.data.validator.TextCase.TestModel(), 'testField'));
        var lowerCaseErrorMessage = (new Ext.XTemplate(AsyncModelTexts.onlyLowerCaseAllowedTpl))
            .apply(ValidationContext.create(new Ext.ux.data.validator.TextCase.TestModel(), 'testField'));
        var mixedCaseErrorMessage = (new Ext.XTemplate(AsyncModelTexts.onlyMixedCaseAllowedTpl))
            .apply(ValidationContext.create(new Ext.ux.data.validator.TextCase.TestModel(), 'testField'));

        it('Returns no error message for null value', function () {
            var validator = new Ext.ux.data.validator.TextCase();
            var testModelRecord = new Ext.ux.data.validator.TextCase.TestModel();
            testModelRecord.set('testField', null);
            testModelRecord.setMetaValue('testField', 'textCase', TextCasings.upper);
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
            testModelRecord.setMetaValue('testField', 'textCase', TextCasings.lower);
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
            testModelRecord.setMetaValue('testField', 'textCase', TextCasings.mixed);
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });

        it('Returns error message in case of forbidden symbols', function () {
            var validator = new Ext.ux.data.validator.TextCase();
            var testModelRecord = new Ext.ux.data.validator.TextCase.TestModel();
            testModelRecord.setMetaValue('testField', 'textCase', TextCasings.upper);
            testModelRecord.set('testField', 'azAZ');
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: upperCaseErrorMessage,
                info: ''
            });
            testModelRecord.setMetaValue('testField', 'textCase', TextCasings.lower);
            testModelRecord.set('testField', 'azAZ');
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: lowerCaseErrorMessage,
                info: ''
            });
            testModelRecord.setMetaValue('testField', 'textCase', TextCasings.mixed);
            testModelRecord.set('testField', 'AZ123');
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: mixedCaseErrorMessage,
                info: ''
            });
        });

        it('Returns no error message in case value does not contain forbidden symbols', function () {
            var validator = new Ext.ux.data.validator.TextCase();
            var testModelRecord = new Ext.ux.data.validator.TextCase.TestModel();
            testModelRecord.setMetaValue('testField', 'textCase', TextCasings.mixed);
            testModelRecord.set('testField', 'AZaz123');
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
            testModelRecord.setMetaValue('testField', 'textCase', TextCasings.lower);
            testModelRecord.set('testField', 'az123');
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
            testModelRecord.setMetaValue('testField', 'textCase', TextCasings.upper);
            testModelRecord.set('testField', 'AZ123');
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });

        it('Returns no error message in case "textCase" meta is not set', function () {
            var validator = new Ext.ux.data.validator.TextCase();
            var testModelRecord = new Ext.ux.data.validator.TextCase.TestModel();
            testModelRecord.setMetaValue('testField', 'textCase', null);
            testModelRecord.set('testField', 'az');
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });
    });
});
