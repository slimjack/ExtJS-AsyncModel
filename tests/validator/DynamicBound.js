/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/jasmine/2.5.2/jasmine.js" />
/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/extjs/6.2.0/ext-all-debug.js" />
/// <reference path="https://github.com/deftjs/DeftJS5/releases/download/v5.0.0-alpha.1/deft-debug.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Utils/releases/download/v0.1.0/ext-utils-all.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Interfaces/releases/download/v1.0.0/InterfaceManager.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Interfaces/releases/download/v1.0.0/InterfaceInjector.j" />
/// <reference path="../../ext-asyncmodel-all.js" />

Ext.define('Ext.ux.data.validator.DynamicBound.TestModel', {
    extend: 'Ext.ux.data.AsyncModel',
    fields: [
        { name: 'minField', type: 'integer', min: 1, allowNull: true },
        { name: 'maxField', type: 'integer', max: 1, allowNull: true },
        { name: 'minMaxField', type: 'integer', min: 1, max: 2, allowNull: true }
    ],

    proxy: {
        type: 'memory'
    }
});

describe('Ext.ux.data.validator.DynamicBound', function () {
    describe('Available via IValidatorProvider', function () {
        var providers = Deft.Injector.resolve('Ext.ux.validator.IValidatorProvider[]');
        it('If field has "min" attribute', function () {
            var validators = Ext.Array.map(providers, function (p) { return p.getValidator({ min: 10 }); });
            validators = Ext.Array.filter(validators, function (v) { return v instanceof Ext.ux.data.validator.DynamicBound; });
            expect(validators.length).toBeGreaterThan(0);
        });
        it('Or if field has "max" attribute', function () {
            var validators = Ext.Array.map(providers, function (p) { return p.getValidator({ max: 10 }); });
            validators = Ext.Array.filter(validators, function (v) { return v instanceof Ext.ux.data.validator.DynamicBound; });
            expect(validators.length).toBeGreaterThan(0);
        });
        it('Without "min"/"max" attributes it is not available', function () {
            var validators = Ext.Array.map(providers, function (p) { return p.getValidator({ }); });
            validators = Ext.Array.filter(validators, function (v) { return v instanceof Ext.ux.data.validator.DynamicBound; });
            expect(validators.length).toBe(0);
        });
    });

    it('Available via ValidatorFactory.', function () {
        var validator = Ext.ux.data.validator.ValidatorFactory.createValidator({
            type: 'dynamicbound'
        });
        expect(validator instanceof Ext.ux.data.validator.DynamicBound).toBe(true);
    });

    it('Implements ISyncValidator.', function () {
        var validator = new Ext.ux.data.validator.DynamicBound();
        expect(validator.$is('Ext.ux.validator.ISyncValidator')).toBe(true);
    });

    describe('validateSync', function () {
        var minBoundErrorMessage = (new Ext.XTemplate(AsyncModelTexts.minBoundViolatedTpl))
            .apply(ValidationContext.create(new Ext.ux.data.validator.DynamicBound.TestModel(), 'minField', { min: 5 }));
        var maxBoundErrorMessage = (new Ext.XTemplate(AsyncModelTexts.maxBoundViolatedTpl))
            .apply(ValidationContext.create(new Ext.ux.data.validator.DynamicBound.TestModel(), 'maxField', { max: 10 }));
        var bothBoundsErrorMessage = (new Ext.XTemplate(AsyncModelTexts.minMaxBoundViolatedTpl))
            .apply(ValidationContext.create(new Ext.ux.data.validator.DynamicBound.TestModel(), 'minMaxField', { min: 5, max: 10 }));

        it('Returns error message for null value', function () {
            var validator = new Ext.ux.data.validator.DynamicBound();
            var testModelRecord = new Ext.ux.data.validator.DynamicBound.TestModel();
            testModelRecord.setMetaValue('minField', 'min', 5);
            testModelRecord.set('minField', null);
            var validationResult = validator.validateSync(testModelRecord.get('minField'), 'minField', testModelRecord);
            expect(validationResult).toEqual({
                error: minBoundErrorMessage,
                info: ''
            });
        });

        it('Returns error message in case of min bound violation', function () {
            var validator = new Ext.ux.data.validator.DynamicBound();
            var testModelRecord = new Ext.ux.data.validator.DynamicBound.TestModel();
            testModelRecord.setMetaValue('minField', 'min', 5);
            testModelRecord.set('minField', 4);
            var validationResult = validator.validateSync(testModelRecord.get('minField'), 'minField', testModelRecord);
            expect(validationResult).toEqual({
                error: minBoundErrorMessage,
                info: ''
            });
        });

        it('Returns error message in case of max bound violation', function () {
            var validator = new Ext.ux.data.validator.DynamicBound();
            var testModelRecord = new Ext.ux.data.validator.DynamicBound.TestModel();
            testModelRecord.setMetaValue('maxField', 'max', 10);
            testModelRecord.set('maxField', 11);
            var validationResult = validator.validateSync(testModelRecord.get('maxField'), 'maxField', testModelRecord);
            expect(validationResult).toEqual({
                error: maxBoundErrorMessage,
                info: ''
            });
        });

        it('Returns error message in case both bounds are violated', function () {
            var validator = new Ext.ux.data.validator.DynamicBound();
            var testModelRecord = new Ext.ux.data.validator.DynamicBound.TestModel();
            testModelRecord.setMetaValue('minMaxField', 'min', 5);
            testModelRecord.setMetaValue('minMaxField', 'max', 10);
            testModelRecord.set('minMaxField', 11);
            var validationResult = validator.validateSync(testModelRecord.get('minMaxField'), 'minMaxField', testModelRecord);
            expect(validationResult).toEqual({
                error: bothBoundsErrorMessage,
                info: ''
            });
            testModelRecord.set('minMaxField', 4);
            var validationResult = validator.validateSync(testModelRecord.get('minMaxField'), 'minMaxField', testModelRecord);
            expect(validationResult).toEqual({
                error: bothBoundsErrorMessage,
                info: ''
            });
        });

        it('Returns no error message in case bounds are not violated', function () {
            var validator = new Ext.ux.data.validator.DynamicBound();
            var testModelRecord = new Ext.ux.data.validator.DynamicBound.TestModel();
            testModelRecord.setMetaValue('minMaxField', 'min', 5);
            testModelRecord.setMetaValue('minMaxField', 'max', 10);
            testModelRecord.set('minMaxField', 5);
            var validationResult = validator.validateSync(testModelRecord.get('minMaxField'), 'minMaxField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
            testModelRecord.set('minMaxField', 10);
            var validationResult = validator.validateSync(testModelRecord.get('minMaxField'), 'minMaxField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });
    });
});
