describe('api.Schema tests', function () {
    beforeEach(function () {
        api.globals.schema = null;
    });

    it('components.getFieldsOfType returns fields', function () {
        api.globals.schema = new api.Schema(schema);
        const fields = api.globals.schema.components.getFieldsOfType('testcomponent', 'entity');
        expect(fields).to.deep.equal(['entityRef', 'entityArrayRef', 'nestedEntityRef.*.entity']);
    });
});
