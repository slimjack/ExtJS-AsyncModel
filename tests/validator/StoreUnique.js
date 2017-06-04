/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/jasmine/2.5.2/jasmine.js" />
/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/extjs/6.2.0/ext-all-debug.js" />
/// <reference path="https://github.com/deftjs/DeftJS5/releases/download/v5.0.0-alpha.1/deft-debug.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Utils/releases/download/v0.1.0/ext-utils-all.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Interfaces/releases/download/v1.0.0/InterfaceManager.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Interfaces/releases/download/v1.0.0/InterfaceInjector.j" />
/// <reference path="../../ext-asyncmodel-all.js" />

Ext.define('Ext.ux.data.validator.StoreUnique.TestModel', {
    extend: 'Ext.ux.data.AsyncModel',
    fields: [
        { name: 'stringField', type: 'string', required: true, allowNull: true },
        { name: 'arrayField', type: 'array', required: true, allowNull: true }
    ],

    hasMany: {
        name: 'storeField',
        model: 'Ext.ux.data.validator.StoreUnique.NestedTestModel',
        field: {
            required: true
        }
    },

    proxy: {
        type: 'memory'
    }
});

Ext.define('Ext.ux.data.validator.StoreUnique.NestedTestModel', {
    extend: 'Ext.ux.data.AsyncModel',
    fields: [
        { name: 'nestedField', type: 'string', storeUnique: true }
    ],

    proxy: {
        type: 'memory'
    }
});

describe('Ext.ux.data.validator.StoreUnique', function () {
    it('Available via IValidatorProvider if field has "storeUnique" attribute', function () {
        var providers = Deft.Injector.resolve('Ext.ux.validator.IValidatorProvider[]');
        var validators = Ext.Array.map(providers, function (p) { return p.getValidator({ storeUnique: true }); });
        validators = Ext.Array.filter(validators, function (v) { return v instanceof Ext.ux.data.validator.StoreUnique; });
        expect(validators.length).toBeGreaterThan(0);
    });
    it('Not available via IValidatorProvider if field does not have "storeUnique" attribute', function () {
        var providers = Deft.Injector.resolve('Ext.ux.validator.IValidatorProvider[]');
        var validators = Ext.Array.map(providers, function (p) { return p.getValidator({}); });
        validators = Ext.Array.filter(validators, function (v) { return v instanceof Ext.ux.data.validator.StoreUnique; });
        expect(validators.length).toBe(0);
    });

    it('Available via ValidatorFactory.', function () {
        var validator = Ext.ux.data.validator.ValidatorFactory.createValidator({
            type: 'storeunique'
        });
        expect(validator instanceof Ext.ux.data.validator.StoreUnique).toBe(true);
    });

    it('Implements ISyncValidator.', function () {
        var validator = new Ext.ux.data.validator.StoreUnique();
        expect(validator.$is('Ext.ux.validator.ISyncValidator')).toBe(true);
    });

    describe('validateSync', function () {
        var storeUniqueErrorMessage = (new Ext.XTemplate(AsyncModelTexts.storeUniqueTpl))
            .apply(ValidationContext.create(new Ext.ux.data.validator.StoreUnique.NestedTestModel(), 'nestedField'));

        it('Returns error message for duplicated record', function () {
            var validator = new Ext.ux.data.validator.StoreUnique();
            var rootModelRecord = new Ext.ux.data.validator.StoreUnique.TestModel();
            rootModelRecord.storeField().add({ nestedField: 'value' });
            var testModelRecord = rootModelRecord.storeField().add({ nestedField: 'value' })[0];
            var validationResult = validator.validateSync(testModelRecord.get('nestedField'), 'nestedField', testModelRecord);
            expect(validationResult).toEqual({
                error: storeUniqueErrorMessage,
                info: ''
            });
        });

        it('Returns no error message for not duplicated record', function () {
            var validator = new Ext.ux.data.validator.StoreUnique();
            var rootModelRecord = new Ext.ux.data.validator.StoreUnique.TestModel();
            rootModelRecord.storeField().add({ nestedField: 'value1' });
            var testModelRecord = rootModelRecord.storeField().add({ nestedField: 'value2' })[0];
            var validationResult = validator.validateSync(testModelRecord.get('nestedField'), 'nestedField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });

        it('Trims string value before validation if "trimStrings" config is set.', function () {
            var validator = new Ext.ux.data.validator.StoreUnique();
            var rootModelRecord = new Ext.ux.data.validator.StoreUnique.TestModel();
            rootModelRecord.storeField().add({ nestedField: '  value' });
            var testModelRecord = rootModelRecord.storeField().add({ nestedField: ' value ' })[0];
            var validationResult = validator.validateSync(testModelRecord.get('nestedField'), 'nestedField', testModelRecord);
            expect(validationResult).toEqual({
                error: storeUniqueErrorMessage,
                info: ''
            });
            validator.setTrimStrings(false);
            var validationResult = validator.validateSync(testModelRecord.get('nestedField'), 'nestedField', testModelRecord);
            expect(validationResult).toEqual({
                error: '',
                info: ''
            });
        });
    });
});
