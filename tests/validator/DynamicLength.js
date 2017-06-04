/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/jasmine/2.5.2/jasmine.js" />
/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/extjs/6.2.0/ext-all-debug.js" />
/// <reference path="https://github.com/deftjs/DeftJS5/releases/download/v5.0.0-alpha.1/deft-debug.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Utils/releases/download/v0.1.0/ext-utils-all.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Interfaces/releases/download/v1.0.0/InterfaceManager.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Interfaces/releases/download/v1.0.0/InterfaceInjector.j" />
/// <reference path="../../ext-asyncmodel-all.js" />

Ext.define('Ext.ux.data.validator.DynamicLength.TestModel', {
    extend: 'Ext.ux.data.AsyncModel',
    fields: [
        { name: 'minField', type: 'string', minLength: 1, allowNull: true },
        { name: 'maxField', type: 'string', maxLength: 1, allowNull: true },
        { name: 'minMaxField', type: 'string', minLength: 1, maxLength: 2, allowNull: true }
    ],

    proxy: {
        type: 'memory'
    }
});

describe('Ext.ux.data.validator.DynamicLength', function () {
    describe('Available via IValidatorProvider', function () {
        var providers = Deft.Injector.resolve('Ext.ux.validator.IValidatorProvider[]');
        it('If field has "minLength" attribute', function () {
            var validators = Ext.Array.map(providers, function (p) { return p.getValidator({ minLength: 10 }); });
            validators = Ext.Array.filter(validators, function (v) { return v instanceof Ext.ux.data.validator.DynamicLength; });
            expect(validators.length).toBeGreaterThan(0);
        });
        it('Or if field has "maxLength" attribute', function () {
            var validators = Ext.Array.map(providers, function (p) { return p.getValidator({ maxLength: 10 }); });
            validators = Ext.Array.filter(validators, function (v) { return v instanceof Ext.ux.data.validator.DynamicLength; });
            expect(validators.length).toBeGreaterThan(0);
        });
        it('Without "minLength"/"maxLength" attributes it is not available', function () {
            var validators = Ext.Array.map(providers, function (p) { return p.getValidator({ }); });
            validators = Ext.Array.filter(validators, function (v) { return v instanceof Ext.ux.data.validator.DynamicLength; });
            expect(validators.length).toBe(0);
        });
    });

    it('Available via ValidatorFactory.', function () {
        var validator = Ext.ux.data.validator.ValidatorFactory.createValidator({
            type: 'dynamiclength'
        });
        expect(validator instanceof Ext.ux.data.validator.DynamicLength).toBe(true);
    });

    it('Implements ISyncValidator.', function () {
        var validator = new Ext.ux.data.validator.DynamicLength();
        expect(validator.$is('Ext.ux.validator.ISyncValidator')).toBe(true);
    });

    describe('validateSync', function () {
        var minLengthErrorMessage = (new Ext.XTemplate(AsyncModelTexts.minLengthViolatedTpl))
            .apply(ValidationContext.create(new Ext.ux.data.validator.DynamicLength.TestModel(), 'minField', { min: 3 }));
        var maxLengthErrorMessage = (new Ext.XTemplate(AsyncModelTexts.maxLengthViolatedTpl))
            .apply(ValidationContext.create(new Ext.ux.data.validator.DynamicLength.TestModel(), 'maxField', { max: 5 }));
        var bothLengthesErrorMessage = (new Ext.XTemplate(AsyncModelTexts.minMaxLengthViolatedTpl))
            .apply(ValidationContext.create(new Ext.ux.data.validator.DynamicLength.TestModel(), 'minMaxField', { min: 3, max: 5 }));

        it('Returns error message for null value', function () {
            var validator = new Ext.ux.data.validator.DynamicLength();
            var testModelRecord = new Ext.ux.data.validator.DynamicLength.TestModel();
            testModelRecord.setMetaValue('minField', 'minLength', 3);
            testModelRecord.set('minField', null);
            var validationResult = validator.validateSync(testModelRecord.get('minField'), 'minField', testModelRecord);
            expect(validationResult).toEqual({
                error: minLengthErrorMessage,
                info: ''
            });
        });

        it('Returns error message in case of min length violation', function () {
            var validator = new Ext.ux.data.validator.DynamicLength();
            var testModelRecord = new Ext.ux.data.validator.DynamicLength.TestModel();
            testModelRecord.setMetaValue('minField', 'minLength', 3);
            testModelRecord.set('minField', '12');
            var validationResult = validator.validateSync(testModelRecord.get('minField'), 'minField', testModelRecord);
            expect(validationResult).toEqual({
                error: minLengthErrorMessage,
                info: ''
            });
        });

        it('Returns error message in case of max length violation', function () {
            var validator = new Ext.ux.data.validator.DynamicLength();
            var testModelRecord = new Ext.ux.data.validator.DynamicLength.TestModel();
            testModelRecord.setMetaValue('maxField', 'maxLength', 5);
            testModelRecord.set('maxField', '123456');
            var validationResult = validator.validateSync(testModelRecord.get('maxField'), 'maxField', testModelRecord);
            expect(validationResult).toEqual({
                error: maxLengthErrorMessage,
                info: ''
            });
        });

        it('Returns error message in case both length limits are violated', function () {
            var validator = new Ext.ux.data.validator.DynamicLength();
            var testModelRecord = new Ext.ux.data.validator.DynamicLength.TestModel();
            testModelRecord.setMetaValue('minMaxField', 'minLength', 3);
            testModelRecord.setMetaValue('minMaxField', 'maxLength', 5);
            testModelRecord.set('minMaxField', '123456');
            var validationResult = validator.validateSync(testModelRecord.get('minMaxField'), 'minMaxField', testModelRecord);
            expect(validationResult).toEqual({
                error: bothLengthesErrorMessage,
                info: ''
            });
            testModelRecord.set('minMaxField', '12');
            var validationResult = validator.validateSync(testModelRecord.get('minMaxField'), 'minMaxField', testModelRecord);
            expect(validationResult).toEqual({
                error: bothLengthesErrorMessage,
                info: ''
            });
        });

        it('Returns no error message in case limits are not violated', function () {
            var validator = new Ext.ux.data.validator.DynamicLength();
            var testModelRecord = new Ext.ux.data.validator.DynamicLength.TestModel();
            testModelRecord.setMetaValue('minMaxField', 'minLength', 3);
            testModelRecord.setMetaValue('minMaxField', 'maxLength', 5);
            testModelRecord.set('minMaxField', '123');
            var validationResult = validator.validateSync(testModelRecord.get('minMaxField'), 'minMaxField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
            testModelRecord.set('minMaxField', '12345');
            var validationResult = validator.validateSync(testModelRecord.get('minMaxField'), 'minMaxField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });
    });
});
