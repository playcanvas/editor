describe('getUniqueName', function () {
    it('returns the desired name when no collision', function () {
        expect(api.getUniqueName('foo.css', new Set())).to.equal('foo.css');
        expect(api.getUniqueName('foo.css', new Set(['bar.css']))).to.equal('foo.css');
    });

    it('appends (1) on first collision', function () {
        expect(api.getUniqueName('foo.css', new Set(['foo.css']))).to.equal('foo (1).css');
    });

    it('increments to next free slot', function () {
        const taken = new Set(['foo.css', 'foo (1).css', 'foo (2).css']);
        expect(api.getUniqueName('foo.css', taken)).to.equal('foo (3).css');
    });

    it('skips gaps in suffix sequence', function () {
        const taken = new Set(['foo.css', 'foo (2).css']);
        expect(api.getUniqueName('foo.css', taken)).to.equal('foo (1).css');
    });

    it('continues from existing suffix on input', function () {
        const taken = new Set(['foo (3).css']);
        expect(api.getUniqueName('foo (3).css', taken)).to.equal('foo (4).css');
    });

    it('handles names without extension', function () {
        expect(api.getUniqueName('folder', new Set(['folder']))).to.equal('folder (1)');
        expect(api.getUniqueName('folder (1)', new Set(['folder', 'folder (1)']))).to.equal('folder (2)');
    });

    it('handles multiple dots in name', function () {
        expect(api.getUniqueName('archive.tar.gz', new Set(['archive.tar.gz'])))
            .to.equal('archive.tar (1).gz');
    });

    it('comparison is case-insensitive', function () {
        expect(api.getUniqueName('foo.css', new Set(['FOO.CSS']))).to.equal('foo (1).css');
        expect(api.getUniqueName('Foo.css', new Set(['foo.css']))).to.equal('Foo (1).css');
    });
});

describe('siblingNames', function () {
    let assets;

    beforeEach(function () {
        api.globals.schema = null;
        api.globals.realtime = null;
        api.globals.assets = new api.Assets();
        assets = api.globals.assets;
    });

    it('returns names for direct siblings only', function () {
        const folder = new api.Asset({ id: 10 });
        const direct = new api.Asset({ id: 11, name: 'a.css', path: [10] });
        const nested = new api.Asset({ id: 12, name: 'b.css', path: [10, 99] });
        const root = new api.Asset({ id: 13, name: 'c.css' });

        assets.add(folder);
        assets.add(direct);
        assets.add(nested);
        assets.add(root);

        const names = api.siblingNames(assets.list(), folder);
        expect(names.has('a.css')).to.equal(true);
        expect(names.has('b.css')).to.equal(false);
        expect(names.has('c.css')).to.equal(false);
    });

    it('treats null folder as project root', function () {
        const root = new api.Asset({ id: 11, name: 'a.css' });
        const inFolder = new api.Asset({ id: 12, name: 'b.css', path: [10] });

        assets.add(root);
        assets.add(inFolder);

        const names = api.siblingNames(assets.list(), null);
        expect(names.has('a.css')).to.equal(true);
        expect(names.has('b.css')).to.equal(false);
    });
});
