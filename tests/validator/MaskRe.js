﻿/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/jasmine/2.5.2/jasmine.js" />
/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/extjs/6.2.0/ext-all-debug.js" />
/// <reference path="https://github.com/deftjs/DeftJS5/releases/download/v5.0.0-alpha.1/deft-debug.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Utils/releases/download/v0.1.0/ext-utils-all.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Interfaces/releases/download/v1.0.0/InterfaceManager.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Interfaces/releases/download/v1.0.0/InterfaceInjector.j" />
/// <reference path="../../ext-asyncmodel-all.js" />

Ext.define('Ext.ux.data.validator.MaskRe.TestModel', {
    extend: 'Ext.ux.data.AsyncModel',
    fields: [
        { name: 'testField', type: 'string', maskRe: /[a-z]/, allowNull: true }
    ],

    proxy: {
        type: 'memory'
    }
});

describe('Ext.ux.data.validator.MaskRe', function () {
    describe('Available via IValidatorProvider', function () {
        var providers = Deft.Injector.resolve('Ext.ux.validator.IValidatorProvider[]');
        it('If field is of "string" type', function () {
            var validators = Ext.Array.map(providers, function (p) { return p.getValidator({ type: 'string' }); });
            validators = Ext.Array.filter(validators, function (v) { return v instanceof Ext.ux.data.validator.MaskRe; });
            expect(validators.length).toBeGreaterThan(0);
        });
        it('For other field types it is not available', function () {
            var validators = Ext.Array.map(providers, function (p) { return p.getValidator({}); });
            validators = Ext.Array.filter(validators, function (v) { return v instanceof Ext.ux.data.validator.MaskRe; });
            expect(validators.length).toBe(0);
        });
    });

    it('Available via ValidatorFactory.', function () {
        var validator = Ext.ux.data.validator.ValidatorFactory.createValidator({
            type: 'maskre'
        });
        expect(validator instanceof Ext.ux.data.validator.MaskRe).toBe(true);
    });

    it('Implements ISyncValidator.', function () {
        var validator = new Ext.ux.data.validator.MaskRe();
        expect(validator.$is('Ext.ux.validator.ISyncValidator')).toBe(true);
    });

    describe('validateSync', function () {
        var forbiddenSymbolsErrorMessage = (new Ext.XTemplate(AsyncModelTexts.forbiddenSymbols))
            .apply(ValidationContext.create(new Ext.ux.data.validator.MaskRe.TestModel(), 'testField'));

        it('Returns no error message for null value', function () {
            var validator = new Ext.ux.data.validator.MaskRe();
            var testModelRecord = new Ext.ux.data.validator.MaskRe.TestModel();
            testModelRecord.setMetaValue('testField', 'maskRe', /[A-Z]/);
            testModelRecord.set('testField', null);
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });

        it('Returns error message in case of forbidden symbols', function () {
            var validator = new Ext.ux.data.validator.MaskRe();
            var testModelRecord = new Ext.ux.data.validator.MaskRe.TestModel();
            testModelRecord.setMetaValue('testField', 'maskRe', /[A-Z]/);
            testModelRecord.set('testField', 'az');
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: forbiddenSymbolsErrorMessage,
                info: ''
            });
            testModelRecord.set('testField', 'azAZ');
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: forbiddenSymbolsErrorMessage,
                info: ''
            });
            testModelRecord.set('testField', '123');
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: forbiddenSymbolsErrorMessage,
                info: ''
            });
        });

        it('Returns no error message in case value does not contain forbidden symbols', function () {
            var validator = new Ext.ux.data.validator.MaskRe();
            var testModelRecord = new Ext.ux.data.validator.MaskRe.TestModel();
            testModelRecord.setMetaValue('testField', 'maskRe', /[A-Z]/);
            testModelRecord.set('testField', 'AZ');
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });

        it('Returns no error message in case "maskRe" meta is not set', function () {
            var validator = new Ext.ux.data.validator.MaskRe();
            var testModelRecord = new Ext.ux.data.validator.MaskRe.TestModel();
            testModelRecord.setMetaValue('testField', 'maskRe', null);
            testModelRecord.set('testField', 'AZaz');
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });

        it('Trims value before validation if "validateTrimmed" config is set.', function () {
            var validator = new Ext.ux.data.validator.MaskRe();
            var testModelRecord = new Ext.ux.data.validator.MaskRe.TestModel();
            testModelRecord.set('testField', ' az ');
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
            validator.setValidateTrimmed(false);
            var validationResult = validator.validateSync(testModelRecord.get('testField'), 'testField', testModelRecord);
            expect(validationResult).toEqual({
                error: forbiddenSymbolsErrorMessage,
                info: ''
            });
        });
    });
});
