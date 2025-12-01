describe('clipboard tests', function () {
    let clipboard;

    beforeEach(() => {
        clipboard = new api.Clipboard('clippy');
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('empty', function () {
        expect(clipboard.empty).to.equal(true);
        clipboard.value = 'test';
        expect(clipboard.empty).to.equal(false);
    });

    it('get / set value', function () {
        expect(clipboard.value).to.equal(null);
        clipboard.value = { value: 1 };
        expect(clipboard.value).to.deep.equal({ value: 1 });
    });

});
