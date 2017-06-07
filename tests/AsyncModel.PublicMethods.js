/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/jasmine/2.5.2/jasmine.js" />
/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/extjs/6.2.0/ext-all-debug.js" />
/// <reference path="https://github.com/deftjs/DeftJS5/releases/download/v5.0.0-alpha.1/deft-debug.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Utils/releases/download/v0.1.0/ext-utils-all.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Interfaces/releases/download/v1.0.0/InterfaceManager.js" />
/// <reference path="https://github.com/slimjack/ExtJS-Interfaces/releases/download/v1.0.0/InterfaceInjector.j" />
/// <reference path="../../ext-asyncmodel-all.js" />

Ext.define('Ext.ux.data.AsyncModel.TestModel', {
    extend: 'Ext.ux.data.AsyncModel',
    idProperty: 'idField',
    fields: [
        { name: 'idField', type: 'string' },
        { name: 'stringField', type: 'string', desired: true, allowNull: true, customProperty1: 'customProperty1' },
        { name: 'modelField', reference: 'Ext.ux.data.AsyncModel.NestedTestModel', unique: true, customProperty5: 'customProperty5' },
        { name: 'arrayField', type: 'array', required: true, allowNull: true, customProperty2: 'customProperty2' }
    ],

    hasMany: {
        name: 'storeField',
        model: 'Ext.ux.data.AsyncModel.NestedTestModel',
        field: {
            desired: true,
            customProperty3: 'customProperty3'
        }
    },

    proxy: {
        type: 'memory'
    }
});

Ext.define('Ext.ux.data.AsyncModel.NestedTestModel', {
    extend: 'Ext.ux.data.AsyncModel',
    idProperty: 'idField',
    fields: [
        { name: 'idField', type: 'string' },
        { name: 'nestedField', type: 'string', desired: true, customProperty4: 'customProperty4' }
    ],

    hasMany: {
        name: 'nestedStoreField',
        model: 'Ext.ux.data.AsyncModel.DeepNestedTestModel',
        field: {
            required: true
        }
    },

    proxy: {
        type: 'memory'
    }
});

Ext.define('Ext.ux.data.AsyncModel.DeepNestedTestModel', {
    extend: 'Ext.ux.data.AsyncModel',
    idProperty: 'idField',
    fields: [
        { name: 'idField', type: 'string' },
        { name: 'deepNestedField', type: 'string', desired: true }
    ],

    proxy: {
        type: 'memory'
    }
});

describe('Ext.ux.data.AsyncModel', function () {
    describe('Public methods:', function () {
        describe('getFieldsDescriptors', function () {
            it('Returns field descriptors including "id" field', function () {
                var testModelRecord = new Ext.ux.data.AsyncModel.TestModel();
                var fieldDescriptors = testModelRecord.getFieldsDescriptors();
                expect(fieldDescriptors.length).toBe(5);
                var stringField = Ext.Array.findBy(fieldDescriptors, function (f) { return f.name === 'stringField'; })
                expect(stringField).not.toBeNull();
                expect(stringField.type).toBe('string');
                expect(stringField.desired).toBe(true);
                expect(stringField.allowNull).toBe(true);
                expect(stringField.customProperty1).toBe('customProperty1');
                var storeField = Ext.Array.findBy(fieldDescriptors, function (f) { return f.name === 'storeField'; })
                expect(storeField).not.toBeNull();
                expect(storeField.desired).toBe(true);
                expect(storeField.isStoreField).toBe(true);
                expect(storeField.customProperty3).toBe('customProperty3');
                var modelField = Ext.Array.findBy(fieldDescriptors, function (f) { return f.name === 'modelField'; })
                expect(modelField).not.toBeNull();
                expect(modelField.isModelField).toBe(true);
                expect(modelField.customProperty5).toBe('customProperty5');
            });
        });

        describe('loadData', function () {
            var data = {
                idField: 'Id1',
                stringField: 'val',
                arrayField: [1, 2, 3],
                modelField: {
                    idField: 'Id1',
                    nestedField: 'val'
                },
                storeField: [{
                    idField: 'Id1',
                    nestedField: 'val1',
                    nestedStoreField: [{
                        idField: 'Id1',
                        deepNestedField: 'val1'
                    }, {
                        idField: 'Id2',
                        deepNestedField: 'val2'
                    }]
                }, {
                    idField: 'Id2',
                    nestedField: 'val2',
                    nestedStoreField: []
                }]
            };
            beforeEach(function (done) { done(); });
            it('Sets data', function () {
                var testModelRecord = new Ext.ux.data.AsyncModel.TestModel();
                spyOn(testModelRecord._metaModel, 'reset');
                testModelRecord.loadData(data);
                expect(testModelRecord._metaModel.reset).toHaveBeenCalled();
                var actualData = testModelRecord.getData(true);
                expect(actualData).toEqual(data);
                expect(testModelRecord.get('arrayField')).toEqual(data.arrayField);
                expect(testModelRecord.storeField().getAt(0).get('nestedField')).toEqual(data.storeField[0].nestedField);
                done();
            });
            it('Resets metadata', function () {
                var testModelRecord = new Ext.ux.data.AsyncModel.TestModel();
                spyOn(testModelRecord._metaModel, 'reset');
                testModelRecord.loadData(data);
                expect(testModelRecord._metaModel.reset).toHaveBeenCalled();
                done();
            });
            it('Executes after all business rules are completed', function (done) {
                var testModelRecord = new Ext.ux.data.AsyncModel.TestModel();
                spyOn(testModelRecord._metaModel, 'reset');
                testModelRecord.loadData(data);
                expect(testModelRecord._metaModel.reset).toHaveBeenCalled();
            });
        });
    });
});
