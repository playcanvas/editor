describe('api.Schema tests', function () {
    beforeEach(function () {
        api.globals.schema = null;
    });

    it('components.getFieldsOfType returns fields', function () {
        api.globals.schema = new api.Schema(schema);
        const fields = api.globals.schema.components.getFieldsOfType('testcomponent', 'entity');
        expect(fields).to.deep.equal(['entityRef', 'entityArrayRef', 'nestedEntityRef.*.entity']);
    });

    it('components.resolvePath resolves fixed fields and open maps', function () {
        api.globals.schema = new api.Schema(schema);
        expect(api.globals.schema.components.resolvePath('testcomponent', 'entityRef')).to.include({
            default: null,
            hasDefault: true,
            open: false
        });
        expect(api.globals.schema.components.resolvePath('testcomponent', 'nestedEntityRef.item.entity')).to.include({
            hasDefault: false,
            open: true
        });
        expect(api.globals.schema.components.resolvePath('script', 'scripts.rotate.attributes.speed')).to.include({
            open: true
        });
        expect(api.globals.schema.components.resolvePath('testcomponent', 'missing')).to.equal(null);
    });

    it('assets.resolvePath resolves fixed fields, arrays and open maps', function () {
        api.globals.schema = new api.Schema(schema);
        expect(api.globals.schema.assets.resolvePath('material', 'diffuse')).to.deep.include({
            default: [0, 0, 0],
            hasDefault: true,
            open: false
        });
        expect(api.globals.schema.assets.resolvePath('model', 'mapping.0.material')).to.include({
            hasDefault: false,
            open: false
        });
        expect(api.globals.schema.assets.resolvePath('test', 'nestedAssetRef.item.asset')).to.include({
            default: null,
            hasDefault: true,
            open: true
        });
        expect(api.globals.schema.assets.resolvePath('model', 'mapping.nope.material')).to.equal(null);
        expect(api.globals.schema.assets.resolvePath('material', 'missing')).to.equal(null);
    });
});
