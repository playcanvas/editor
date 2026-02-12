describe('localstorage tests', function () {
    let ls;

    beforeEach(function () {
        ls = new api.LocalStorage();
    });

    afterEach(function () {
        localStorage.clear();
    });

    it('gets / sets key', function () {
        expect(ls.get('key')).to.equal(null);
        ls.set('key', 'value');
        expect(ls.get('key')).to.equal('value');

        // check cache
        expect(ls.get('key')).to.equal('value');

        ls.set('key', { value: 1 });
        expect(ls.get('key')).to.deep.equal({ value: 1 });
    });

    it('unsets key', function () {
        ls.set('key', 'value');
        expect(ls.get('key')).to.equal('value');
        ls.unset('key');
        expect(ls.get('key')).to.equal(null);
    });

    it('has key', function () {
        expect(ls.has('key')).to.equal(false);
        ls.set('key', 'value');
        expect(ls.has('key')).to.equal(true);
    });
});
