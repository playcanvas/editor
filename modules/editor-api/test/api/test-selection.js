describe('api.Selection tests', function () {
    let sandbox;
    let selection;

    beforeEach(function () {
        api.globals.history = null;

        sandbox = sinon.createSandbox();
        api.globals.selection = new api.Selection();
        sandbox.stub(api.globals.selection, 'emit');
    });
    afterEach(function () {
        sandbox.restore();
    });

    it('add selects item', function (done) {
        const item = new api.Entity();
        api.globals.selection.add(item);
        expect(api.globals.selection.items).to.deep.equal([item]);
        expect(api.globals.selection.item).to.equal(item);
        expect(api.globals.selection.emit.calledOnceWith('add', item)).to.equal(true);
        api.globals.selection.emit.resetHistory();
        setTimeout(() => {
            expect(api.globals.selection.emit.calledOnceWith('change', [item])).to.equal(true);
            done();
        }, 100);
    });

    it('remove deselects item', function (done) {
        const item = new api.Entity();
        api.globals.selection.add(item);
        api.globals.selection.emit.resetHistory();
        api.globals.selection.remove(item);
        expect(api.globals.selection.items).to.deep.equal([]);
        expect(api.globals.selection.emit.calledOnceWith('remove', item)).to.equal(true);
        api.globals.selection.emit.resetHistory();
        setTimeout(() => {
            expect(api.globals.selection.emit.calledOnceWith('change', [])).to.equal(true);
            done();
        }, 100);
    });

    it('toggle selects deselected and deselects selected item', function (done) {
        const item = new api.Entity();
        api.globals.selection.toggle(item);
        expect(api.globals.selection.items).to.deep.equal([item]);
        expect(api.globals.selection.emit.calledOnceWith('add', item)).to.equal(true);
        api.globals.selection.emit.resetHistory();
        api.globals.selection.toggle(item);
        expect(api.globals.selection.items).to.deep.equal([]);
        expect(api.globals.selection.emit.calledOnceWith('remove', item)).to.equal(true);
        api.globals.selection.emit.resetHistory();
        setTimeout(() => {
            expect(api.globals.selection.emit.calledOnceWith('change', [])).to.equal(true);
            done();
        }, 100);
    });

    it('has returns true for selected item', function () {
        const item = new api.Entity();
        api.globals.selection.add(item);
        expect(api.globals.selection.has(item)).to.equal(true);

        api.globals.selection.remove(item);
        expect(api.globals.selection.has(item)).to.equal(false);
    });

    it('clear removes all items', function (done) {
        const item = new api.Entity();
        api.globals.selection.add(item);
        api.globals.selection.emit.resetHistory();
        api.globals.selection.clear();
        expect(api.globals.selection.items).to.deep.equal([]);
        expect(api.globals.selection.emit.calledOnceWith('remove', item)).to.equal(true);
        api.globals.selection.emit.resetHistory();
        setTimeout(() => {
            expect(api.globals.selection.emit.calledOnceWith('change', [])).to.equal(true);
            done();
        }, 100);
    });

    it('set items selects them', function (done) {
        const item = new api.Entity();
        api.globals.selection.set([item]);
        expect(api.globals.selection.items).to.deep.equal([item]);
        expect(api.globals.selection.emit.calledOnceWith('add', item)).to.equal(true);
        api.globals.selection.emit.resetHistory();
        setTimeout(() => {
            expect(api.globals.selection.emit.calledOnceWith('change', [item])).to.equal(true);
            done();
        }, 100);
    });

    it('set items deselects previous', function (done) {
        const item = new api.Entity();
        api.globals.selection.add(item);
        const item2 = new api.Entity();
        api.globals.selection.emit.resetHistory();
        api.globals.selection.set([item2]);
        expect(api.globals.selection.items).to.deep.equal([item2]);
        expect(api.globals.selection.emit.getCall(0).args).to.deep.equal(['remove', item]);
        expect(api.globals.selection.emit.getCall(1).args).to.deep.equal(['add', item2]);
        api.globals.selection.emit.resetHistory();
        setTimeout(() => {
            expect(api.globals.selection.emit.calledOnceWith('change', [item2])).to.equal(true);
            done();
        }, 100);
    });

    it('count returns number of selected items', function () {
        const item = new api.Entity();
        api.globals.selection.add(item);
        expect(api.globals.selection.count).to.equal(1);
    });

    it('disabled selection does not allow any editing', function () {
        const item = new api.Entity();
        api.globals.selection.enabled = false;
        api.globals.selection.add(item);
        expect(api.globals.selection.count).to.equal(0);
        api.globals.selection.toggle(item);
        expect(api.globals.selection.count).to.equal(0);
        api.globals.selection.set([item]);
        expect(api.globals.selection.count).to.equal(0);

        api.globals.selection.enabled = true;
        api.globals.selection.add(item);
        api.globals.selection.enabled = false;
        api.globals.selection.remove(item);
        expect(api.globals.selection.count).to.equal(1);
    });

    it('undo / redo add', async function () {
        api.globals.history = new api.History();
        selection = new api.Selection();

        const item = new api.Entities().create();
        api.globals.selection.add(item);
        await api.globals.history.undo();
        expect(api.globals.selection.items).to.deep.equal([]);
        await api.globals.history.redo();
        expect(api.globals.selection.items).to.deep.equal([item]);
    });

    it('undo / redo remove', async function () {
        api.globals.history = new api.History();
        selection = new api.Selection();

        const item = new api.Entities().create();
        api.globals.selection.add(item);
        api.globals.selection.remove(item);
        await api.globals.history.undo();
        expect(api.globals.selection.items).to.deep.equal([item]);
        await api.globals.history.redo();
        expect(api.globals.selection.items).to.deep.equal([]);
    });

    it('undo / redo clear', async function () {
        api.globals.history = new api.History();
        selection = new api.Selection();

        const item = new api.Entities().create();
        api.globals.selection.add(item);
        api.globals.selection.clear();
        await api.globals.history.undo();
        expect(api.globals.selection.items).to.deep.equal([item]);
        await api.globals.history.redo();
        expect(api.globals.selection.items).to.deep.equal([]);
    });

    it('undo / redo toggle', async function () {
        api.globals.history = new api.History();
        selection = new api.Selection();

        const item = new api.Entities().create();
        api.globals.selection.toggle(item);
        await api.globals.history.undo();
        expect(api.globals.selection.items).to.deep.equal([]);
        await api.globals.history.redo();
        expect(api.globals.selection.items).to.deep.equal([item]);
    });

    it('undo / redo set items', async function () {
        api.globals.history = new api.History();
        selection = new api.Selection();

        const item = new api.Entities().create();
        const item2 = new api.Entities().create();
        api.globals.selection.add(item);
        api.globals.selection.set([item2]);
        await api.globals.history.undo();
        expect(api.globals.selection.items).to.deep.equal([item]);
        await api.globals.history.redo();
        expect(api.globals.selection.items).to.deep.equal([item2]);
    });

});
