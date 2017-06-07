/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/jasmine/2.5.2/jasmine.js" />
/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/extjs/6.2.0/ext-all-debug.js" />
/// <reference path="https://github.com/deftjs/DeftJS5/releases/download/v5.0.0-alpha.1/deft-debug.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Utils/releases/download/v0.1.0/ext-utils-all.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Interfaces/releases/download/v1.0.0/InterfaceManager.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Interfaces/releases/download/v1.0.0/InterfaceInjector.j" />
/// <reference path="../../ext-asyncmodel-all.js" />

Ext.define('Ext.ux.data.validator.Required.TestModel', {
    extend: 'Ext.ux.data.AsyncModel',
    fields: [
        { name: 'stringField', type: 'string', required: true, allowNull: true },
        { name: 'boolField', type: 'boolean', required: true, allowNull: true },
        { name: 'arrayField', type: 'array', required: true, allowNull: true }
    ],

    hasMany: {
        name: 'storeField',
        model: 'Ext.ux.data.validator.Required.NestedTestModel',
        field: {
            required: true
        }
    },

    proxy: {
        type: 'memory'
    }
});

Ext.define('Ext.ux.data.validator.Required.NestedTestModel', {
    extend: 'Ext.ux.data.AsyncModel',
    fields: [
        { name: 'nestedField', type: 'string', required: true }
    ],

    proxy: {
        type: 'memory'
    }
});

describe('Ext.ux.data.validator.Required', function () {
    it('Available via IValidatorProvider.', function () {
        var providers = Deft.Injector.resolve('Ext.ux.validator.IValidatorProvider[]');
        var validators = Ext.Array.map(providers, function (p) { return p.getValidator({}); });
        validators = Ext.Array.filter(validators, function (v) { return v instanceof Ext.ux.data.validator.Required; });
        expect(validators.length).toBeGreaterThan(0);
    });

    it('Available via ValidatorFactory.', function () {
        var validator = Ext.ux.data.validator.ValidatorFactory.createValidator({
            type: 'required'
        });
        expect(validator instanceof Ext.ux.data.validator.Required).toBe(true);
    });

    it('Implements ISyncValidator.', function () {
        var validator = new Ext.ux.data.validator.Required();
        expect(validator.$is('Ext.ux.validator.ISyncValidator')).toBe(true);
    });

    describe('validateSync', function () {
        var stringFieldErrorMessage = (new Ext.XTemplate(AsyncModelTexts.requiredFieldMessageTpl))
            .apply(ValidationContext.create(new Ext.ux.data.validator.Required.TestModel(), 'stringField'));
        var arrayFieldErrorMessage = (new Ext.XTemplate(AsyncModelTexts.requiredFieldMessageTpl))
            .apply(ValidationContext.create(new Ext.ux.data.validator.Required.TestModel(), 'arrayField'));
        var storeFieldErrorMessage = (new Ext.XTemplate(AsyncModelTexts.requiredFieldMessageTpl))
            .apply(ValidationContext.create(new Ext.ux.data.validator.Required.TestModel(), 'storeField'));

        it('Returns error message for null value', function () {
            var validator = new Ext.ux.data.validator.Required();
            var testModelRecord = new Ext.ux.data.validator.Required.TestModel();
            testModelRecord.set('stringField', null);
            var validationResult = validator.validateSync(testModelRecord.get('stringField'), 'stringField', testModelRecord, { validatePresence: true });
            expect(validationResult).toEqual({
                error: stringFieldErrorMessage,
                info: ''
            });
        });

        it('Returns no error message for false boolean value', function () {
            var validator = new Ext.ux.data.validator.Required();
            var testModelRecord = new Ext.ux.data.validator.Required.TestModel();
            testModelRecord.set('boolField', false);
            var validationResult = validator.validateSync(testModelRecord.get('boolField'), 'boolField', testModelRecord, { validatePresence: true });
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });

        it('Returns error message for empty string value', function () {
            var validator = new Ext.ux.data.validator.Required();
            var testModelRecord = new Ext.ux.data.validator.Required.TestModel();
            testModelRecord.set('stringField', '');
            var validationResult = validator.validateSync(testModelRecord.get('stringField'), 'stringField', testModelRecord, { validatePresence: true });
            expect(validationResult).toEqual({
                error: stringFieldErrorMessage,
                info: ''
            });
        });

        it('Returns no error message for non-empty string value', function () {
            var validator = new Ext.ux.data.validator.Required();
            var testModelRecord = new Ext.ux.data.validator.Required.TestModel();
            testModelRecord.set('stringField', 'v');
            var validationResult = validator.validateSync(testModelRecord.get('stringField'), 'stringField', testModelRecord, { validatePresence: true });
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });

        it('Returns error message for empty store value', function () {
            var validator = new Ext.ux.data.validator.Required();
            var testModelRecord = new Ext.ux.data.validator.Required.TestModel();
            var validationResult = validator.validateSync(testModelRecord.storeField(), 'storeField', testModelRecord, { validatePresence: true });
            expect(validationResult).toEqual({
                error: storeFieldErrorMessage,
                info: ''
            });
        });

        it('Returns no error message for non-empty store value', function () {
            var validator = new Ext.ux.data.validator.Required();
            var testModelRecord = new Ext.ux.data.validator.Required.TestModel();
            testModelRecord.storeField().add({ nestedField: 'nested value' });
            var validationResult = validator.validateSync(testModelRecord.storeField(), 'storeField', testModelRecord, { validatePresence: true });
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });

        it('Returns error message for empty array value', function () {
            var validator = new Ext.ux.data.validator.Required();
            var testModelRecord = new Ext.ux.data.validator.Required.TestModel();
            testModelRecord.set('arrayField', []);
            var validationResult = validator.validateSync(testModelRecord.get('arrayField'), 'arrayField', testModelRecord, { validatePresence: true });
            expect(validationResult).toEqual({
                error: arrayFieldErrorMessage,
                info: ''
            });
        });

        it('Returns no error message for non-empty array value', function () {
            var validator = new Ext.ux.data.validator.Required();
            var testModelRecord = new Ext.ux.data.validator.Required.TestModel();
            testModelRecord.set('arrayField', [1]);
            var validationResult = validator.validateSync(testModelRecord.get('arrayField'), 'arrayField', testModelRecord, { validatePresence: true });
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });

        it('Validates only if field is "required"', function () {
            var validator = new Ext.ux.data.validator.Required();
            var testModelRecord = new Ext.ux.data.validator.Required.TestModel();
            testModelRecord.setMetaValue('stringField', 'required', false);
            var validationResult = validator.validateSync('', 'stringField', testModelRecord, { validatePresence: true });
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });

        it('Validates only if "validatePresence" validation option is set', function () {
            var validator = new Ext.ux.data.validator.Required();
            var testModelRecord = new Ext.ux.data.validator.Required.TestModel();
            var validationResult = validator.validateSync('', 'stringField', testModelRecord, { validatePresence: false });
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });

        it('Trims string value before validation if "trimStrings" config is set', function () {
            var validator = new Ext.ux.data.validator.Required();
            var testModelRecord = new Ext.ux.data.validator.Required.TestModel();
            var validationResult = validator.validateSync('   ', 'stringField', testModelRecord, { validatePresence: true });
            expect(validationResult).toEqual({
                error: stringFieldErrorMessage,
                info: ''
            });
            validator.setTrimStrings(false);
            var validationResult = validator.validateSync('   ', 'stringField', testModelRecord, { validatePresence: true });
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });
    });
});
