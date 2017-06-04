/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/jasmine/2.5.2/jasmine.js" />
/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/extjs/6.2.0/ext-all-debug.js" />
/// <reference path="https://github.com/deftjs/DeftJS5/releases/download/v5.0.0-alpha.1/deft-debug.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Utils/releases/download/v0.1.0/ext-utils-all.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Interfaces/releases/download/v1.0.0/InterfaceManager.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Interfaces/releases/download/v1.0.0/InterfaceInjector.j" />
/// <reference path="../../ext-asyncmodel-all.js" />

describe('Ext.data.validator.Email', function () {
    describe('Available via IValidatorProvider', function () {
        var providers = Deft.Injector.resolve('Ext.ux.validator.IValidatorProvider[]');
        it('If field is of "email" type', function () {
            var validators = Ext.Array.map(providers, function (p) { return p.getValidator({ type: 'email' }); });
            validators = Ext.Array.filter(validators, function (v) { return v instanceof Ext.data.validator.Email; });
            expect(validators.length).toBeGreaterThan(0);
            it('Implements ISyncValidator.', function () {
                expect(Ext.Array.every(validators, function (v) { return v.$is('Ext.ux.validator.ISyncValidator'); })).toBe(true);
            });
        });
        it('For other field types it is not available', function () {
            var validators = Ext.Array.map(providers, function (p) { return p.getValidator({ }); });
            validators = Ext.Array.filter(validators, function (v) { return v instanceof Ext.data.validator.Email; });
            expect(validators.length).toBe(0);
        });
    });

    it('Available via ValidatorFactory.', function () {
        var validator = Ext.ux.data.validator.ValidatorFactory.createValidator({
            type: 'email'
        });
        expect(validator instanceof Ext.data.validator.Email).toBe(true);
        it('Implements ISyncValidator.', function () {
            expect(validator.$is('Ext.ux.validator.ISyncValidator')).toBe(true);
        });
    });
});
