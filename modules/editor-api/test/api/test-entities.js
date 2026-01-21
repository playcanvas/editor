describe('api.Entities tests', function () {
    function makeScriptAssetWithEntityRefs(id) {
        return new api.Asset({
            id: id || 1,
            uniqueId: id || 1,
            type: 'script',
            name: 'script',
            path: [],
            data: {
                scripts: {
                    test: {
                        attributes: {
                            entity: {
                                type: 'entity'
                            },
                            entityArray: {
                                type: 'entity',
                                array: true
                            },
                            json: {
                                type: 'json',
                                schema: [{
                                    name: 'entity',
                                    type: 'entity'
                                }, {
                                    name: 'entityArray',
                                    type: 'entity',
                                    array: true
                                }]
                            },
                            jsonArray: {
                                type: 'json',
                                array: true,
                                schema: [{
                                    name: 'entity',
                                    type: 'entity'
                                }, {
                                    name: 'entityArray',
                                    type: 'entity',
                                    array: true
                                }]
                            }
                        }
                    }
                }
            }
        });
    }

    function makeScriptAssetWithAssetRefs(id) {
        return new api.Asset({
            id: id || 1,
            uniqueId: id || 1,
            type: 'script',
            name: 'script',
            path: [],
            data: {
                scripts: {
                    test: {
                        attributes: {
                            asset: {
                                type: 'asset'
                            },
                            assetArray: {
                                type: 'asset',
                                array: true
                            },
                            json: {
                                type: 'json',
                                schema: [{
                                    name: 'asset',
                                    type: 'asset'
                                }, {
                                    name: 'assetArray',
                                    type: 'asset',
                                    array: true
                                }]
                            },
                            jsonArray: {
                                type: 'json',
                                array: true,
                                schema: [{
                                    name: 'asset',
                                    type: 'asset'
                                }, {
                                    name: 'assetArray',
                                    type: 'asset',
                                    array: true
                                }]
                            }
                        }
                    }
                }
            }
        });
    }

    function prepareCopyTest() {
        // mock realtime scenes
        api.globals.realtime = {
            scenes: {
                current: {
                    addEntity: () => {},
                    removeEntity: () => {},
                    uniqueId: 1
                }
            },
            assets: {
                unload: () => {}
            }
        };

        api.globals.projectId = 1;
        api.globals.branchId = 'branch';
        api.globals.clipboard = new api.Clipboard('clippy');
        api.globals.schema = new api.Schema(schema);
        api.globals.assets = new api.Assets();
        api.globals.selection = new api.Selection();
        api.globals.history = new api.History();
    }

    beforeEach(() => {
        for (const key in api.globals) {
            api.globals[key] = undefined;
        }
        api.globals.entities = new api.Entities();
    });

    it('add adds entity and get returns entity', function () {
        const e = new api.Entity();
        api.globals.entities.add(e);
        expect(api.globals.entities.get(e.get('resource_id'))).to.equal(e);
    });

    it('add does not add duplicate entity', function () {
        const e = new api.Entity();
        api.globals.entities.add(e);
        api.globals.entities.add(e);
        expect(api.globals.entities.list()).to.deep.equal([e]);
    });

    it('list returns array of entities', function () {
        const e = new api.Entity();
        api.globals.entities.add(e);
        expect(api.globals.entities.list()).to.deep.equal([e]);
    });

    it('returns root', function () {
        const p = new api.Entity();
        const c = new api.Entity();
        c.set('parent', p.get('resource_id'));
        p.insert('children', c.get('resource_id'));
        api.globals.entities.add(p);
        api.globals.entities.add(c);
        expect(api.globals.entities.root).to.equal(p);
    });

    it('creates entity', function () {
        const e = api.globals.entities.create({
            name: 'name'
        });

        expect(e).to.not.equal(null);
        expect(e.get('name')).to.equal('name');
        expect(api.globals.entities.get(e.get('resource_id'))).to.equal(e);
        expect(api.globals.entities.root).to.equal(e);
    });

    it('creates child entity', function () {
        const e = api.globals.entities.create({
            name: 'name'
        });
        const c = api.globals.entities.create({
            name: 'child',
            parent: e
        });

        expect(e.children).to.deep.equal([c]);
        expect(api.globals.entities.root).to.equal(e);
    });

    it('creates entity with component', function () {
        api.globals.schema = new api.Schema(schema);
        const e = api.globals.entities.create({
            components: {
                testcomponent: {
                    entityRef: 'test'
                }
            }
        });

        expect(e.has('components.testcomponent.entityRef')).to.equal(true);
    });

    it('undo create removes entity', async function () {
        api.globals.history = new api.History();

        // create root
        api.globals.entities.create();

        const e = api.globals.entities.create(null, {
            history: true
        });
        await api.globals.history.undo();
        expect(api.globals.entities.get(e.get('resource_id'))).to.equal(null);
    });

    it('redo create adds new entity with same id', async function () {
        api.globals.history = new api.History();

        const e = api.globals.entities.create(null, {
            history: true
        });
        await api.globals.history.undo();
        await api.globals.history.redo();

        expect(api.globals.entities.get(e.get('resource_id'))).to.not.equal(null);
    });

    it('create adds children too', function () {
        const e = api.globals.entities.create({
            name: 'parent',
            children: [{
                name: 'child',
                children: [{
                    name: 'subchild'
                }]
            }, {
                name: 'child2'
            }]
        });

        expect(e.children[0].get('name')).to.equal('child');
        expect(e.children[1].get('name')).to.equal('child2');
        expect(e.children[0].children[0].get('name')).to.equal('subchild');
    });

    it('create calls onCreate for each new entity', function () {
        const called = [];
        const onCreate = (e) => called.push(e);

        const e = api.globals.entities.create({
            onCreate: onCreate,
            children: [{
                onCreate: onCreate,
                children: [{
                    onCreate: onCreate
                }]
            }, {
                onCreate: onCreate
            }]
        });

        expect(called).to.deep.equal([e.children[0].children[0], e.children[0], e.children[1], e]);
    });

    it('delete removes entity', async function () {
        // create root
        api.globals.entities.create();

        const e = api.globals.entities.create();
        await api.globals.entities.delete([e]);
        expect(api.globals.entities.get(e.get('resource_id'))).to.equal(null);
    });

    it('delete removes children', async function () {
        // create root
        api.globals.entities.create();

        const e = api.globals.entities.create({
            name: 'parent',
            children: [{
                name: 'child'
            }]
        });

        const c = e.children[0];

        await api.globals.entities.delete([e]);

        expect(api.globals.entities.get(c.get('resource_id'))).to.equal(null);
        expect(api.globals.entities.get(e.get('resource_id'))).to.equal(null);
    });

    it('delete works when children are passed along with parents', async function () {
        // create root
        api.globals.entities.create();

        const e = api.globals.entities.create({
            name: 'parent',
            children: [{
                name: 'child'
            }]
        });

        const c = e.children[0];

        await api.globals.entities.delete([c, e]);

        expect(api.globals.entities.get(c.get('resource_id'))).to.equal(null);
        expect(api.globals.entities.get(e.get('resource_id'))).to.equal(null);
    });

    it('undo delete brings back entities with same data as before', async function () {
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        const e = api.globals.entities.create({
            parent: root,
            name: 'parent',
            children: [{
                name: 'child'
            }]
        });

        const c = e.children[0];

        const eJson = e.json();
        const cJson = c.json();

        await api.globals.entities.delete([e]);

        await api.globals.history.undo();

        expect(api.globals.entities.get(e.get('resource_id')).json()).to.deep.equal(eJson);
        expect(api.globals.entities.get(c.get('resource_id')).json()).to.deep.equal(cJson);

        await api.globals.history.redo();
        await api.globals.history.undo();

        expect(api.globals.entities.get(e.get('resource_id')).json()).to.deep.equal(eJson);
        expect(api.globals.entities.get(c.get('resource_id')).json()).to.deep.equal(cJson);
    });

    it('undo delete restores original children order', async function () {
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        const e = api.globals.entities.create({ parent: root });
        const children = [];
        for (let i = 0; i < 3; i++) {
            children.push(api.globals.entities.create({ parent: e, name: 'child ' + (i + 1) }));
        }

        expect(e.children).to.deep.equal(children);

        await api.globals.entities.delete([children[1]]);
        expect(e.children).to.deep.equal([children[0], children[2]]);
        await api.globals.history.undo();
        children[1] = children[1].latest();
        expect(e.children).to.deep.equal(children);

        // test undo after redo in case something breaks there
        await api.globals.history.redo();
        await api.globals.history.undo();
        children[1] = children[1].latest();
        expect(e.children).to.deep.equal(children);
    });

    it('undo delete restores original children order when entities are passed in random order', async function () {
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        const e = api.globals.entities.create({ parent: root });
        let children = [];
        for (let i = 0; i < 3; i++) {
            children.push(api.globals.entities.create({ parent: e, name: 'child ' + (i + 1) }));
        }

        expect(e.children).to.deep.equal(children);

        await api.globals.entities.delete([children[2], children[1], children[0]]);
        await api.globals.history.undo();
        children = children.map(c => c.latest());
        expect(e.children).to.deep.equal(children);

        // test undo after redo in case something breaks there
        await api.globals.history.redo();
        await api.globals.history.undo();
        children = children.map(c => c.latest());
        expect(e.children).to.deep.equal(children);
    });

    it('redo delete deletes entities', async function () {
        api.globals.history = new api.History();

        // create root
        api.globals.entities.create();

        const e = api.globals.entities.create({
            name: 'parent',
            children: [{
                name: 'child'
            }]
        });

        const c = e.children[0];

        await api.globals.entities.delete([e]);

        await api.globals.history.undo();
        await api.globals.history.redo();

        expect(api.globals.entities.get(e.get('resource_id'))).to.equal(null);
        expect(api.globals.entities.get(c.get('resource_id'))).to.equal(null);
    });

    it('delete removes from selection', async function () {
        api.globals.history = new api.History();
        api.globals.selection = new api.Selection();

        // create root
        api.globals.entities.create();

        const e = api.globals.entities.create(null, {
            select: true
        });

        expect(api.globals.selection.items).to.deep.equal([e]);
        await api.globals.entities.delete([e]);
        expect(api.globals.selection.items).to.deep.equal([]);

        // check undo brings back selection
        await api.globals.history.undo();
        expect(api.globals.selection.items[0].get('resource_id')).to.equal(e.get('resource_id'));
    });

    it('delete removes entity references', async function () {
        api.globals.schema = new api.Schema(schema);
        api.globals.history = new api.History();
        api.globals.assets = new api.Assets();

        const script = makeScriptAssetWithEntityRefs();
        api.globals.assets.add(script);

        const root = api.globals.entities.create({
            name: 'root',
            children: [{
                name: 'child 1'
            }, {
                name: 'child 2',
                children: [{
                    name: 'sub child'
                }]
            }]
        });

        let c1 = root.findByName('child 1');
        const c2 = root.findByName('child 2');
        const c3 = root.findByName('sub child');

        const reference = c1.get('resource_id');
        [root, c1, c2, c3].forEach(e => {
            e.set('components.testcomponent', {
                entityRef: reference
            });
            e.set('components.script', {
                scripts: {
                    test: {
                        attributes: {
                            entity: reference,
                            entityArray: [reference, reference],
                            json: {
                                entity: reference,
                                entityArray: [reference, reference]
                            },
                            jsonArray: [{
                                entity: reference,
                                entityArray: [reference, reference]
                            }]
                        }
                    }
                }
            });
            expect(e.get('components.testcomponent.entityRef')).to.equal(reference);
            expect(e.get('components.script.scripts.test.attributes.entity')).to.equal(reference);
            expect(e.get('components.script.scripts.test.attributes.entityArray')).to.deep.equal([reference, reference]);
            expect(e.get('components.script.scripts.test.attributes.json.entity')).to.equal(reference);
            expect(e.get('components.script.scripts.test.attributes.json.entityArray')).to.deep.equal([reference, reference]);
            expect(e.get('components.script.scripts.test.attributes.jsonArray.0.entity')).to.equal(reference);
            expect(e.get('components.script.scripts.test.attributes.jsonArray.0.entityArray')).to.deep.equal([reference, reference]);
        });

        await api.globals.entities.delete([c1]);

        [root, c1, c2, c3].forEach(e => {
            expect(e.get('components.testcomponent.entityRef')).to.equal(null);
            expect(e.get('components.script.scripts.test.attributes.entity')).to.equal(null);
            expect(e.get('components.script.scripts.test.attributes.entityArray')).to.deep.equal([null, null]);
            expect(e.get('components.script.scripts.test.attributes.json.entity')).to.equal(null);
            expect(e.get('components.script.scripts.test.attributes.json.entityArray')).to.deep.equal([null, null]);
            expect(e.get('components.script.scripts.test.attributes.jsonArray.0.entity')).to.equal(null);
            expect(e.get('components.script.scripts.test.attributes.jsonArray.0.entityArray')).to.deep.equal([null, null]);
        });

        // test undo brings back references
        await api.globals.history.undo();

        c1 = c1.latest();

        [root, c1, c2, c3].forEach(e => {
            expect(e.get('components.testcomponent.entityRef')).to.equal(reference);
            expect(e.get('components.script.scripts.test.attributes.entity')).to.equal(reference);
            expect(e.get('components.script.scripts.test.attributes.entityArray')).to.deep.equal([reference, reference]);
            expect(e.get('components.script.scripts.test.attributes.json.entity')).to.equal(reference);
            expect(e.get('components.script.scripts.test.attributes.json.entityArray')).to.deep.equal([reference, reference]);
            expect(e.get('components.script.scripts.test.attributes.jsonArray.0.entity')).to.equal(reference);
            expect(e.get('components.script.scripts.test.attributes.jsonArray.0.entityArray')).to.deep.equal([reference, reference]);
        });
    });

    it('create selects entity', function () {
        api.globals.selection = new api.Selection();

        const e = api.globals.entities.create(null, {
            select: true
        });

        expect(api.globals.selection.items).to.deep.equal([e]);
    });

    it('undo create restores previous selection', async function () {
        api.globals.selection = new api.Selection();
        api.globals.history = new api.History();

        const e = api.globals.entities.create({
            name: 'e'
        });
        api.globals.selection.add(e);

        const e2 = api.globals.entities.create({
            name: 'e2'
        }, {
            select: true,
            history: true
        });

        await api.globals.history.undo();

        expect(api.globals.selection.items).to.deep.equal([e]);

        await api.globals.history.redo();

        expect(api.globals.selection.items.length).to.equal(1);
        expect(api.globals.selection.items[0].get('resource_id')).to.equal(e2.get('resource_id'));
    });

    it('reparent reparents entities', function () {
        const root = api.globals.entities.create({
            name: 'root'
        });

        const parent1 = api.globals.entities.create({
            name: 'parent 1',
            parent: root
        });

        const parent2 = api.globals.entities.create({
            name: 'parent 2',
            parent: root
        });

        const child = api.globals.entities.create({
            name: 'child',
            parent: parent1
        });

        api.globals.entities.reparent([{
            entity: child,
            parent: parent2,
            index: 0
        }]);

        expect(parent1.children).to.deep.equal([]);
        expect(parent2.children).to.deep.equal([child]);
        expect(child.parent).to.equal(parent2);

        const child2 = api.globals.entities.create({
            name: 'child 2',
            parent: parent1
        });

        api.globals.entities.reparent([{
            entity: child2,
            parent: parent2,
            index: 0
        }]);

        expect(parent1.children).to.deep.equal([]);
        expect(parent2.children).to.deep.equal([child2, child]);
        expect(child2.parent).to.equal(parent2);

        api.globals.entities.reparent([{
            entity: child2,
            parent: parent2,
            index: 1
        }]);

        expect(parent2.children).to.deep.equal([child, child2]);
    });

    it('reparent child to one of its children is not allowed', function () {
        const root = api.globals.entities.create();
        const parent = api.globals.entities.create({ parent: root });
        const child = api.globals.entities.create({ parent: parent });

        api.globals.entities.reparent([{
            entity: parent,
            parent: child
        }]);

        expect(child.children).to.deep.equal([]);
        expect(parent.parent).to.equal(root);
        expect(parent.children).to.deep.equal([child]);
    });

    it('undo / redo reparent', async function () {
        api.globals.history = new api.History();

        const root = api.globals.entities.create({
            name: 'root'
        });

        const parent1 = api.globals.entities.create({
            name: 'parent 1',
            parent: root
        });

        const parent2 = api.globals.entities.create({
            name: 'parent 2',
            parent: root
        });

        const child = api.globals.entities.create({
            name: 'child',
            parent: parent1
        });

        api.globals.entities.reparent([{
            entity: child,
            parent: parent2,
            index: 0
        }]);

        expect(parent1.children).to.deep.equal([]);
        expect(parent2.children).to.deep.equal([child]);
        expect(child.parent).to.equal(parent2);

        await api.globals.history.undo();

        expect(parent2.children).to.deep.equal([]);
        expect(parent1.children).to.deep.equal([child]);
        expect(child.parent).to.equal(parent1);

        await api.globals.history.redo();

        expect(parent1.children).to.deep.equal([]);
        expect(parent2.children).to.deep.equal([child]);
        expect(child.parent).to.equal(parent2);
    });

    it('reparent multiple children preserves order and selection', async function () {
        api.globals.history = new api.History();
        api.globals.selection = new api.Selection();
        const root = api.globals.entities.create();
        const parent1 = api.globals.entities.create({ parent: root });
        const parent2 = api.globals.entities.create({ parent: root });
        const child1 = api.globals.entities.create({ name: 'child1', parent: parent1 });
        const child2 = api.globals.entities.create({ name: 'child2', parent: parent1 });
        const child3 = api.globals.entities.create({ name: 'child3', parent: parent1 });
        const child4 = api.globals.entities.create({ name: 'child4', parent: parent1 });

        expect(parent1.children).to.deep.equal([child1, child2, child3, child4]);

        api.globals.selection.set([child1, child2, child4], { history: false });

        api.globals.entities.reparent([{
            entity: child1,
            parent: parent2,
            index: 0
        }, {
            entity: child2,
            parent: parent2,
            index: 1
        }, {
            entity: child4,
            parent: parent2,
            index: 2
        }]);
        expect(parent2.children).to.deep.equal([child1, child2, child4]);
        expect(api.globals.selection.items).to.deep.equal([child1, child2, child4]);

        await api.globals.history.undo();

        expect(parent1.children).to.deep.equal([child1, child2, child3, child4]);
        expect(api.globals.selection.items).to.deep.equal([child1, child2, child4]);

        api.globals.entities.reparent([{
            entity: child1,
            parent: parent1,
            index: 3
        }, {
            entity: child2,
            parent: parent1,
            index: 2
        }, {
            entity: child3,
            parent: parent1,
            index: 1
        }, {
            entity: child4,
            parent: parent1,
            index: 0
        }]);
        expect(parent1.children).to.deep.equal([child4, child3, child2, child1]);
        expect(api.globals.selection.items).to.deep.equal([child1, child2, child4]);

        await api.globals.history.undo();

        expect(parent1.children).to.deep.equal([child1, child2, child3, child4]);
        expect(api.globals.selection.items).to.deep.equal([child1, child2, child4]);
    });

    it('undo reparent handles deleted reparented item', async function () {
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        const parent = api.globals.entities.create({ parent: root });
        const child = api.globals.entities.create({ parent: parent });
        const child2 = api.globals.entities.create({ parent: parent });
        const child3 = api.globals.entities.create({ parent: parent });

        expect(parent.children).to.deep.equal([child, child2, child3]);

        api.globals.entities.reparent([{
            entity: child2,
            parent: root
        }]);

        api.globals.entities.delete([child2], { history: false });

        await api.globals.history.undo();

        expect(parent.children).to.deep.equal([child, child3]);
    });

    it('redo reparent handles deleted reparented item', async function () {
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        const parent = api.globals.entities.create({ parent: root });
        const child = api.globals.entities.create({ parent: parent });
        const child2 = api.globals.entities.create({ parent: parent });
        const child3 = api.globals.entities.create({ parent: parent });

        expect(parent.children).to.deep.equal([child, child2, child3]);

        api.globals.entities.reparent([{
            entity: child2,
            parent: root
        }]);

        await api.globals.history.undo();

        api.globals.entities.delete([child2], { history: false });

        await api.globals.history.redo();

        expect(parent.children).to.deep.equal([child, child3]);
    });

    it('undo reparent handles deleted original parent', async function () {
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        const parent = api.globals.entities.create({ parent: root });
        const child = api.globals.entities.create({ parent: parent });
        const child2 = api.globals.entities.create({ parent: parent });
        const child3 = api.globals.entities.create({ parent: parent });

        expect(parent.children).to.deep.equal([child, child2, child3]);

        api.globals.entities.reparent([{
            entity: child2,
            parent: root
        }]);

        api.globals.entities.delete([parent], { history: false });

        await api.globals.history.undo();

        expect(root.children).to.deep.equal([child2]);
    });

    it('redo reparent handles deleted original parent', async function () {
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        const parent = api.globals.entities.create({ parent: root });
        const child = api.globals.entities.create({ parent: parent });
        const child2 = api.globals.entities.create({ parent: parent });
        const child3 = api.globals.entities.create({ parent: parent });

        expect(parent.children).to.deep.equal([child, child2, child3]);

        api.globals.entities.reparent([{
            entity: child2,
            parent: root
        }]);

        await api.globals.history.undo();

        api.globals.entities.delete([parent], { history: false });

        await api.globals.history.redo();

        expect(root.children).to.deep.equal([]);
    });

    it('undo reparent handles deleted new parent', async function () {
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        const parent = api.globals.entities.create({ parent: root });
        const parent2 = api.globals.entities.create({ parent: root });
        const child = api.globals.entities.create({ parent: parent });
        const child2 = api.globals.entities.create({ parent: parent });
        const child3 = api.globals.entities.create({ parent: parent });

        expect(parent.children).to.deep.equal([child, child2, child3]);

        api.globals.entities.reparent([{
            entity: child2,
            parent: parent2
        }]);

        api.globals.entities.delete([parent2], { history: false });

        await api.globals.history.undo();

        expect(parent.children).to.deep.equal([child, child3]);
    });

    it('redo reparent handles deleted new parent', async function () {
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        const parent = api.globals.entities.create({ parent: root });
        const parent2 = api.globals.entities.create({ parent: root });
        const child = api.globals.entities.create({ parent: parent });
        const child2 = api.globals.entities.create({ parent: parent });
        const child3 = api.globals.entities.create({ parent: parent });

        expect(parent.children).to.deep.equal([child, child2, child3]);

        api.globals.entities.reparent([{
            entity: child2,
            parent: parent2
        }]);

        await api.globals.history.undo();

        api.globals.entities.delete([parent2], { history: false });

        await api.globals.history.redo();

        expect(parent.children).to.deep.equal([child, child2, child3]);
    });

    it('duplicate duplicates an entity', async function () {
        api.globals.history = new api.History();
        api.globals.schema = new api.Schema(schema);

        const root = api.globals.entities.create();

        const parent = api.globals.entities.create({
            name: 'parent',
            parent: root
        });

        const child = api.globals.entities.create({
            name: 'child',
            parent: parent
        });

        parent.addComponent('testcomponent', {
            entityRef: child.get('resource_id')
        });

        const duplicated = await api.globals.entities.duplicate([parent], {
            history: true
        });
        expect(duplicated.length).to.equal(1);
        expect(duplicated[0].get('name')).to.equal('parent');
        expect(duplicated[0].children.length).to.equal(1);
        expect(duplicated[0].children[0].get('name')).to.equal('child');
        expect(duplicated[0].get('components.testcomponent.entityRef')).to.equal(duplicated[0].children[0].get('resource_id'));
        expect(root.children).to.deep.equal([parent, duplicated[0]]);

        const jsonParent = duplicated[0].json();
        const jsonChild = duplicated[0].children[0].json();

        // test undo / redo
        await api.globals.history.undo();
        expect(api.globals.entities.get(duplicated[0].get('resource_id'))).to.equal(null);
        expect(root.children).to.deep.equal([parent]);

        await api.globals.history.redo();

        duplicated[0] = duplicated[0].latest();
        expect(duplicated[0].json()).to.deep.equal(jsonParent);
        expect(duplicated[0].children[0].json()).to.deep.equal(jsonChild);
        expect(root.children).to.deep.equal([parent, duplicated[0]]);
    });

    it('duplicate resolves entity references', async function () {
        api.globals.schema = new api.Schema(schema);

        const root = api.globals.entities.create();
        const parent = api.globals.entities.create({ name: 'parent' });
        const child = api.globals.entities.create({
            name: 'child',
            parent: parent
        });
        const parent2 = api.globals.entities.create({ name: 'parent2' });
        const parent3 = api.globals.entities.create({ name: 'parent3' });

        parent.addComponent('testcomponent', {
            entityRef: child.get('resource_id')
        });
        child.addComponent('testcomponent', {
            entityRef: parent.get('resource_id')
        });
        parent2.addComponent('testcomponent', {
            entityRef: parent2.get('resource_id')
        });
        parent3.addComponent('testcomponent', {
            entityRef: root.get('resource_id')
        });

        const dups = await api.globals.entities.duplicate([parent, parent2, parent3]);
        expect(dups[0].children[0].get('components.testcomponent.entityRef')).to.equal(dups[0].get('resource_id'));
        expect(dups[0].get('components.testcomponent.entityRef')).to.equal(dups[0].children[0].get('resource_id'));
        expect(dups[1].get('components.testcomponent.entityRef')).to.equal(dups[1].get('resource_id'));
        expect(dups[2].get('components.testcomponent.entityRef')).to.equal(root.get('resource_id'));
    });

    it('duplicate selects entities', async function () {
        api.globals.selection = new api.Selection();
        api.globals.history = new api.History();

        const root = api.globals.entities.create();

        const parent = api.globals.entities.create({
            name: 'parent',
            parent: root
        });

        const dups = await api.globals.entities.duplicate([parent], {
            history: true,
            select: true
        });

        expect(api.globals.selection.items).to.deep.equal(dups);

        // test undo / redo
        await api.globals.history.undo();
        expect(api.globals.selection.items).to.deep.equal([]);

        await api.globals.history.redo();
        expect(api.globals.selection.items).to.deep.equal(dups.map(e => e.latest()));
    });

    it('renames duplicated entities', async function () {
        const root = api.globals.entities.create();

        const parent = api.globals.entities.create({
            name: 'parent',
            parent: root
        });

        const dups = await api.globals.entities.duplicate([parent], {
            rename: true
        });

        expect(dups[0].get('name')).to.equal('parent2');

        dups[0] = await dups[0].duplicate({
            rename: true
        });

        expect(dups[0].get('name')).to.equal('parent3');

        const child = api.globals.entities.create({
            name: 'child',
            parent: dups[0]
        });

        dups[0] = await dups[0].duplicate({
            rename: true
        });
        expect(dups[0].children[0].get('name')).to.equal('child');

        dups[0] = await parent.duplicate({
            rename: true
        });

        expect(dups[0].get('name')).to.equal('parent5');
    });

    it('duplicate updates script attribute references', async function () {
        api.globals.assets = new api.Assets();
        api.globals.schema = new api.Schema(schema);

        const script = makeScriptAssetWithEntityRefs();

        api.globals.assets.add(script);

        const root = api.globals.entities.create();
        const entity = api.globals.entities.create({ parent: root });
        const id = entity.get('resource_id');

        entity.addComponent('script', {
            scripts: {
                test: {
                    attributes: {
                        entity: id,
                        entityArray: [id, id],
                        json: {
                            entity: id,
                            entityArray: [id, id]
                        },
                        jsonArray: [{
                            entity: id,
                            entityArray: [id, id]
                        }]
                    }
                }
            }
        });

        const child = api.globals.entities.create({ parent: entity });
        child.addComponent('script', {
            scripts: {
                test: {
                    attributes: {
                        entity: id,
                        entityArray: [id, id],
                        json: {
                            entity: id,
                            entityArray: [id, id]
                        },
                        jsonArray: [{
                            entity: id,
                            entityArray: [id, id]
                        }]
                    }
                }
            }
        });

        const dup = await entity.duplicate();
        const newId = dup.get('resource_id');
        expect(dup.get('components.script.scripts.test.attributes.entity')).to.equal(newId);
        expect(dup.get('components.script.scripts.test.attributes.entityArray')).to.deep.equal([newId, newId]);
        expect(dup.get('components.script.scripts.test.attributes.json.entity')).to.equal(newId);
        expect(dup.get('components.script.scripts.test.attributes.json.entityArray')).to.deep.equal([newId, newId]);
        expect(dup.get('components.script.scripts.test.attributes.jsonArray.0.entity')).to.equal(newId);
        expect(dup.get('components.script.scripts.test.attributes.jsonArray.0.entityArray')).to.deep.equal([newId, newId]);

        const dupChild = dup.children[0];
        expect(dupChild.get('components.script.scripts.test.attributes.entity')).to.equal(newId);
        expect(dupChild.get('components.script.scripts.test.attributes.entityArray')).to.deep.equal([newId, newId]);
        expect(dupChild.get('components.script.scripts.test.attributes.json.entity')).to.equal(newId);
        expect(dupChild.get('components.script.scripts.test.attributes.json.entityArray')).to.deep.equal([newId, newId]);
        expect(dupChild.get('components.script.scripts.test.attributes.jsonArray.0.entity')).to.equal(newId);
        expect(dupChild.get('components.script.scripts.test.attributes.jsonArray.0.entityArray')).to.deep.equal([newId, newId]);
    });

    it('duplicate updates template_ent_ids', async function () {
        api.globals.schema = new api.Schema(schema);

        const root = api.globals.entities.create();
        const entity = api.globals.entities.create({ parent: root });
        const child = api.globals.entities.create({ parent: entity });
        const templateEntIds = {};
        templateEntIds[entity.get('resource_id')] = api.Guid.create();
        templateEntIds[child.get('resource_id')] = api.Guid.create();
        // create a missing reference as well
        const missing = api.Guid.create();
        templateEntIds[missing] = api.Guid.create();
        entity.set('template_ent_ids', templateEntIds);

        const dup = await entity.duplicate();
        const newTemplateEntIds = dup.get('template_ent_ids');
        expect(Object.keys(newTemplateEntIds).length).to.equal(3);
        expect(newTemplateEntIds[dup.get('resource_id')]).to.equal(templateEntIds[entity.get('resource_id')]);
        expect(newTemplateEntIds[dup.children[0].get('resource_id')]).to.equal(templateEntIds[child.get('resource_id')]);

        delete newTemplateEntIds[dup.get('resource_id')];
        delete newTemplateEntIds[dup.children[0].get('resource_id')];
        expect(newTemplateEntIds[Object.keys(newTemplateEntIds)[0]]).to.equal(templateEntIds[missing]);
    });

    it('duplicate updates nested template_ent_ids', async function () {
        api.globals.schema = new api.Schema(schema);

        const root = api.globals.entities.create();
        const entity = api.globals.entities.create({ parent: root });
        const child = api.globals.entities.create({ parent: entity });

        // create template_ent_ids for parent
        const templateEntIds = {};
        templateEntIds[entity.get('resource_id')] = api.Guid.create();
        templateEntIds[child.get('resource_id')] = api.Guid.create();

        // create a missing reference as well
        const missing = api.Guid.create();
        templateEntIds[missing] = api.Guid.create();
        entity.set('template_ent_ids', templateEntIds);

        // create template_ent_ids for child
        const childTemplateEntIds = {};
        childTemplateEntIds[child.get('resource_id')] = api.Guid.create();
        // add missing reference from parent - this should be preserved in the new template_ent_ids
        childTemplateEntIds[missing] = templateEntIds[missing];

        // create a missing reference as well
        const missing2 = api.Guid.create();
        childTemplateEntIds[missing2] = api.Guid.create();
        child.set('template_ent_ids', childTemplateEntIds);

        const dup = await entity.duplicate();

        const newTemplateEntIds = dup.get('template_ent_ids');
        expect(Object.keys(newTemplateEntIds).length).to.equal(3);
        expect(newTemplateEntIds[dup.get('resource_id')]).to.equal(templateEntIds[entity.get('resource_id')]);
        expect(newTemplateEntIds[dup.children[0].get('resource_id')]).to.equal(templateEntIds[child.get('resource_id')]);
        delete newTemplateEntIds[dup.get('resource_id')];
        delete newTemplateEntIds[dup.children[0].get('resource_id')];

        const newMissingKey = Object.keys(newTemplateEntIds)[0];

        expect(newMissingKey).to.not.equal(missing);
        expect(newTemplateEntIds[newMissingKey]).to.equal(templateEntIds[missing]);


        const dupChild = dup.children[0];
        const newChildTemplateEntIds = dupChild.get('template_ent_ids');
        expect(Object.keys(newChildTemplateEntIds).length).to.equal(3);
        expect(newChildTemplateEntIds[dupChild.get('resource_id')]).to.equal(childTemplateEntIds[child.get('resource_id')]);
        delete newChildTemplateEntIds[dupChild.get('resource_id')];
        expect(newChildTemplateEntIds[newMissingKey]).to.equal(childTemplateEntIds[missing]);
        delete newChildTemplateEntIds[newMissingKey];

        expect(Object.keys(newChildTemplateEntIds)[0]).to.not.equal(missing2);
        expect(newChildTemplateEntIds[Object.keys(newChildTemplateEntIds)[0]]).to.equal(childTemplateEntIds[missing2]);
    });

    it('duplicate filters children if parents are selected', async function () {
        api.globals.schema = new api.Schema(schema);

        const root = api.globals.entities.create();
        const entity = api.globals.entities.create({ parent: root });
        const child = api.globals.entities.create({ parent: entity });

        const duplicates = await api.globals.entities.duplicate([entity, child]);
        expect(duplicates.length).to.equal(1);
        const json = duplicates[0].json();
        json.resource_id = entity.get('resource_id');
        json.children[0] = child.get('resource_id');
        expect(JSON.stringify(json)).to.equal(JSON.stringify(entity.json()));
    });

    it('waitToExist waits for entities to be added', async function () {
        const e = api.globals.entities.create();
        api.globals.entities.remove(e);

        const promise = new Promise((resolve) => {
            api.globals.entities.waitToExist([e.get('resource_id')], 5000, (entities) => {
                expect(entities).to.deep.equal([e]);
                resolve();
            });
        });

        api.globals.entities.add(e);

        await promise;
    });

    it('cancel waitToExist stops waiting for entities to be added', async function () {
        const e = api.globals.entities.create();
        api.globals.entities.remove(e);

        let cancel;
        const promise = new Promise((resolve, reject) => {
            cancel = api.globals.entities.waitToExist([e.get('resource_id')], 200, (entities) => {
                // we should never get here
                reject(new Error('Wait to exist should have been canceled'));
            });

            setTimeout(() => {
                resolve();
            }, 300);
        });

        cancel();
        api.globals.entities.add(e);

        await promise;
    });

    it('copy entities fails without a current scene', function () {
        const e = api.globals.entities.create();
        try {
            api.globals.entities.copyToClipboard([e]);
            throw new Error('should have thrown exception');
        } catch (err) {
            expect(err.message).to.equal('No current scene loaded');
        }
    });

    it('copies single entity', function () {
        prepareCopyTest();
        const e = api.globals.entities.create();
        api.globals.entities.copyToClipboard([e]);

        expect(JSON.stringify(api.globals.clipboard.value)).to.equal(JSON.stringify({
            project: api.globals.projectId,
            scene: 1,
            branch: api.globals.branchId,
            hierarchy: {
                [e.get('resource_id')]: e.json()
            },
            assets: {},
            type: 'entity',
            value: e.get('resource_id')
        }));
    });

    it('copies 2 unrelated entities', function () {
        prepareCopyTest();
        const root = api.globals.entities.create();
        const e = api.globals.entities.create({ parent: root });
        const e2 = api.globals.entities.create({ parent: root });

        api.globals.entities.copyToClipboard([e, e2]);

        const eJson = e.json();
        eJson.parent = null;
        const e2Json = e2.json();
        e2Json.parent = null;

        expect(JSON.stringify(api.globals.clipboard.value)).to.equal(JSON.stringify({
            project: api.globals.projectId,
            scene: 1,
            branch: api.globals.branchId,
            hierarchy: {
                [e.get('resource_id')]: eJson,
                [e2.get('resource_id')]: e2Json
            },
            assets: {},
            type: 'entity',
            value: [e.get('resource_id'), e2.get('resource_id')]
        }));
    });

    it('copy filters children from parents if parents and children are selected', function () {
        prepareCopyTest();
        const root = api.globals.entities.create();
        const e = api.globals.entities.create({ parent: root });
        const e2 = api.globals.entities.create({ parent: e });

        api.globals.entities.copyToClipboard([e, e2]);

        const eJson = e.json();
        eJson.parent = null;

        const e2Json = e2.json();

        expect(JSON.stringify(api.globals.clipboard.value)).to.equal(JSON.stringify({
            project: api.globals.projectId,
            scene: 1,
            branch: api.globals.branchId,
            hierarchy: {
                [e.get('resource_id')]: eJson,
                [e2.get('resource_id')]: e2Json
            },
            assets: {},
            type: 'entity',
            value: [e.get('resource_id'), e2.get('resource_id')]
        }));
    });

    it('copy picks up asset references', function () {
        prepareCopyTest();

        const assets = [];
        for (let i = 0; i < 4; i++) {
            assets.push(new api.Asset({
                id: i + 1,
                type: 'material',
                path: [],
                name: 'mat ' + (i + 1)
            }));

            api.globals.assets.add(assets[assets.length - 1]);
        }

        const e = api.globals.entities.create();
        const e2 = api.globals.entities.create();
        e.addComponent('testcomponent', {
            assetRef: assets[0].get('id')
        });
        e2.addComponent('testcomponent', {
            assetArrayRef: [assets[1].get('id'), assets[2].get('id')],
            nestedAssetRef: {
                1: {
                    asset: assets[3].get('id')
                }
            }
        });
        api.globals.entities.copyToClipboard([e, e2]);

        expect(JSON.stringify(api.globals.clipboard.value)).to.equal(JSON.stringify({
            project: api.globals.projectId,
            scene: 1,
            branch: api.globals.branchId,
            hierarchy: {
                [e.get('resource_id')]: e.json(),
                [e2.get('resource_id')]: e2.json()
            },
            assets: {
                [assets[0].get('id')]: {
                    path: [assets[0].get('name')],
                    type: assets[0].get('type')
                },
                [assets[1].get('id')]: {
                    path: [assets[1].get('name')],
                    type: assets[1].get('type')
                },
                [assets[2].get('id')]: {
                    path: [assets[2].get('name')],
                    type: assets[2].get('type')
                },
                [assets[3].get('id')]: {
                    path: [assets[3].get('name')],
                    type: assets[3].get('type')
                }
            },
            type: 'entity',
            value: [e.get('resource_id'), e2.get('resource_id')]
        }));
    });

    it('copy picks up assets from script attributes', function () {
        prepareCopyTest();

        const assets = [];
        for (let i = 0; i < 6; i++) {
            assets.push(new api.Asset({
                id: i + 1,
                type: 'material',
                path: [],
                name: 'mat ' + (i + 1)
            }));

            api.globals.assets.add(assets[assets.length - 1]);
        }

        const scriptAsset = makeScriptAssetWithAssetRefs(20);
        api.globals.assets.add(scriptAsset);

        const e = api.globals.entities.create();
        e.addComponent('script', {
            scripts: {
                test: {
                    attributes: {
                        asset: assets[0].get('id'),
                        assetArray: [assets[1].get('id')],
                        json: {
                            asset: assets[2].get('id'),
                            assetArray: [assets[3].get('id')]
                        },
                        jsonArray: [{
                            asset: assets[4].get('id'),
                            assetArray: [assets[5].get('id')]
                        }]
                    }
                }
            }
        });

        api.globals.entities.copyToClipboard([e]);

        const expected = {
            project: api.globals.projectId,
            scene: 1,
            branch: api.globals.branchId,
            hierarchy: {
                [e.get('resource_id')]: e.json()
            },
            assets: {},
            type: 'entity',
            value: e.get('resource_id')
        };

        for (let i = 0; i < assets.length; i++) {
            expected.assets[assets[i].get('id')] = {
                path: [assets[i].get('name')],
                type: assets[i].get('type')
            };
        }

        expect(JSON.stringify(api.globals.clipboard.value)).to.equal(JSON.stringify(expected));
    });

    it('copy picks up assets from legacy script attributes', function () {
        prepareCopyTest();
        api.globals.hasLegacyScripts = true;

        const assets = [];
        for (let i = 0; i < 2; i++) {
            assets.push(new api.Asset({
                id: i + 1,
                type: 'material',
                path: [],
                name: 'mat ' + (i + 1)
            }));

            api.globals.assets.add(assets[assets.length - 1]);
        }

        const e = api.globals.entities.create();
        e.addComponent('script', {
            scripts: [{
                name: 'test',
                attributes: {
                    asset: {
                        type: 'asset',
                        value: [assets[0].get('id')],
                        defaultValue: [assets[1].get('id')]
                    }
                }
            }]
        });

        api.globals.entities.copyToClipboard([e]);

        const expected = {
            project: api.globals.projectId,
            scene: 1,
            branch: api.globals.branchId,
            legacy_scripts: true,
            hierarchy: {
                [e.get('resource_id')]: e.json()
            },
            assets: {},
            type: 'entity',
            value: e.get('resource_id')
        };

        for (let i = 0; i < assets.length; i++) {
            expected.assets[assets[i].get('id')] = {
                path: [assets[i].get('name')],
                type: assets[i].get('type')
            };
        }

        expect(JSON.stringify(api.globals.clipboard.value)).to.equal(JSON.stringify(expected));
    });

    it('paste single entity', async function () {
        prepareCopyTest();
        const root = api.globals.entities.create();
        const e = api.globals.entities.create({ parent: root });
        api.globals.entities.copyToClipboard([e]);
        const newEntities = await api.globals.entities.pasteFromClipboard(root);
        expect(newEntities.length).to.equal(1);

        const json = newEntities[0].json();
        expect(json.resource_id).to.not.equal(e.get('resource_id'));
        json.resource_id = e.get('resource_id');
        expect(JSON.stringify(json)).to.equal(JSON.stringify(e.json()));
        expect(root.children).to.deep.equal([e, newEntities[0]]);
    });

    it('paste multiple entities', async function () {
        prepareCopyTest();
        const root = api.globals.entities.create();
        const e = api.globals.entities.create({ parent: root });
        const e2 = api.globals.entities.create({ parent: root });
        api.globals.entities.copyToClipboard([e, e2]);
        const newEntities = await api.globals.entities.pasteFromClipboard(root);
        expect(newEntities.length).to.equal(2);

        expect(root.children).to.deep.equal([e, e2, ...newEntities]);
    });

    it('paste entity with children', async function () {
        prepareCopyTest();
        const root = api.globals.entities.create();
        const e = api.globals.entities.create({ parent: root, name: 'e' });
        const e2 = api.globals.entities.create({ parent: e, name: 'e2' });
        api.globals.entities.copyToClipboard([e]);
        const newEntities = await api.globals.entities.pasteFromClipboard(root);
        expect(newEntities.length).to.equal(1);

        expect(root.children).to.deep.equal([e, newEntities[0]]);

        expect(newEntities[0].children.length).to.equal(1);

        const json = newEntities[0].children[0].json();
        expect(json.resource_id).to.not.equal(e2.get('resource_id'));
        expect(json.parent).to.equal(newEntities[0].get('resource_id'));
        json.resource_id = e2.get('resource_id');
        json.parent = e.get('resource_id');
        expect(JSON.stringify(json)).to.equal(JSON.stringify(e2.json()));
    });

    it('paste entities only returns top level children', async function () {
        prepareCopyTest();
        const root = api.globals.entities.create();
        const e = api.globals.entities.create({ parent: root, name: 'e' });
        const e2 = api.globals.entities.create({ parent: e, name: 'e2' });
        api.globals.entities.copyToClipboard([e, e2]);
        const newEntities = await api.globals.entities.pasteFromClipboard(root);
        expect(newEntities.length).to.equal(1);
        expect(newEntities[0].get('name')).to.equal('e');
    });

    it('paste updates entity references', async function () {
        prepareCopyTest();

        const scriptAsset = makeScriptAssetWithEntityRefs();
        api.globals.assets.add(scriptAsset);

        const root = api.globals.entities.create();
        const e = api.globals.entities.create({ parent: root, name: 'e' });
        const e2 = api.globals.entities.create({ parent: e, name: 'e2' });

        e.addComponent('testcomponent', {
            entityRef: e2.get('resource_id'),
            entityArrayRef: [e2.get('resource_id')],
            nestedEntityRef: {
                1: {
                    entity: e2.get('resource_id')
                }
            }
        });
        e.addComponent('script', {
            scripts: {
                test: {
                    attributes: {
                        entity: e2.get('resource_id'),
                        entityArray: [e2.get('resource_id')],
                        json: {
                            entity: e2.get('resource_id'),
                            entityArray: [e2.get('resource_id')]
                        },
                        jsonArray: [{
                            entity: e2.get('resource_id'),
                            entityArray: [e2.get('resource_id')]
                        }]
                    }
                }
            }
        });

        e2.addComponent('testcomponent', {
            entityRef: root.get('resource_id'),
            entityArrayRef: [root.get('resource_id')],
            nestedEntityRef: {
                1: {
                    entity: root.get('resource_id')
                }
            }
        });
        e2.addComponent('script', {
            scripts: {
                test: {
                    attributes: {
                        entity: root.get('resource_id'),
                        entityArray: [root.get('resource_id')],
                        json: {
                            entity: root.get('resource_id'),
                            entityArray: [root.get('resource_id')]
                        },
                        jsonArray: [{
                            entity: root.get('resource_id'),
                            entityArray: [root.get('resource_id')]
                        }]
                    }
                }
            }
        });

        api.globals.entities.copyToClipboard([e]);
        let newEntities = await api.globals.entities.pasteFromClipboard(root);
        let newE = newEntities[0];
        let newChild = newEntities[0].children[0];
        expect(newE.get('components.testcomponent.entityRef')).to.equal(newChild.get('resource_id'));
        expect(newE.get('components.testcomponent.entityArrayRef')).to.deep.equal([newChild.get('resource_id')]);
        expect(newE.get('components.testcomponent.nestedEntityRef.1.entity')).to.equal(newChild.get('resource_id'));

        expect(newE.get('components.script.scripts.test.attributes.entity')).to.equal(newChild.get('resource_id'));
        expect(newE.get('components.script.scripts.test.attributes.entityArray')).to.deep.equal([newChild.get('resource_id')]);
        expect(newE.get('components.script.scripts.test.attributes.json.entity')).to.equal(newChild.get('resource_id'));
        expect(newE.get('components.script.scripts.test.attributes.json.entityArray')).to.deep.equal([newChild.get('resource_id')]);
        expect(newE.get('components.script.scripts.test.attributes.jsonArray.0.entity')).to.equal(newChild.get('resource_id'));
        expect(newE.get('components.script.scripts.test.attributes.jsonArray.0.entityArray')).to.deep.equal([newChild.get('resource_id')]);

        expect(newChild.get('components.testcomponent.entityRef')).to.equal(root.get('resource_id'));
        expect(newChild.get('components.testcomponent.entityArrayRef')).to.deep.equal([root.get('resource_id')]);
        expect(newChild.get('components.testcomponent.nestedEntityRef.1.entity')).to.equal(root.get('resource_id'));

        expect(newChild.get('components.script.scripts.test.attributes.entity')).to.equal(root.get('resource_id'));
        expect(newChild.get('components.script.scripts.test.attributes.entityArray')).to.deep.equal([root.get('resource_id')]);
        expect(newChild.get('components.script.scripts.test.attributes.json.entity')).to.equal(root.get('resource_id'));
        expect(newChild.get('components.script.scripts.test.attributes.json.entityArray')).to.deep.equal([root.get('resource_id')]);
        expect(newChild.get('components.script.scripts.test.attributes.jsonArray.0.entity')).to.equal(root.get('resource_id'));
        expect(newChild.get('components.script.scripts.test.attributes.jsonArray.0.entityArray')).to.deep.equal([root.get('resource_id')]);

        api.globals.projectId = 2;
        newEntities = await api.globals.entities.pasteFromClipboard(root);
        newE = newEntities[0];
        newChild = newEntities[0].children[0];
        expect(newE.get('components.testcomponent.entityRef')).to.equal(newChild.get('resource_id'));
        expect(newE.get('components.testcomponent.entityArrayRef')).to.deep.equal([newChild.get('resource_id')]);
        expect(newE.get('components.testcomponent.nestedEntityRef.1.entity')).to.equal(newChild.get('resource_id'));

        expect(newE.get('components.script.scripts.test.attributes.entity')).to.equal(newChild.get('resource_id'));
        expect(newE.get('components.script.scripts.test.attributes.entityArray')).to.deep.equal([newChild.get('resource_id')]);
        expect(newE.get('components.script.scripts.test.attributes.json.entity')).to.equal(newChild.get('resource_id'));
        expect(newE.get('components.script.scripts.test.attributes.json.entityArray')).to.deep.equal([newChild.get('resource_id')]);
        expect(newE.get('components.script.scripts.test.attributes.jsonArray.0.entity')).to.equal(newChild.get('resource_id'));
        expect(newE.get('components.script.scripts.test.attributes.jsonArray.0.entityArray')).to.deep.equal([newChild.get('resource_id')]);

        expect(newChild.get('components.testcomponent.entityRef')).to.equal(null);
        expect(newChild.get('components.testcomponent.entityArrayRef')).to.deep.equal([null]);
        expect(newChild.get('components.testcomponent.nestedEntityRef.1.entity')).to.equal(null);

        expect(newChild.get('components.script.scripts.test.attributes.entity')).to.equal(null);
        expect(newChild.get('components.script.scripts.test.attributes.entityArray')).to.deep.equal([null]);
        expect(newChild.get('components.script.scripts.test.attributes.json.entity')).to.equal(null);
        expect(newChild.get('components.script.scripts.test.attributes.json.entityArray')).to.deep.equal([null]);
        expect(newChild.get('components.script.scripts.test.attributes.jsonArray.0.entity')).to.equal(null);
        expect(newChild.get('components.script.scripts.test.attributes.jsonArray.0.entityArray')).to.deep.equal([null]);
    });

    it('paste updates asset references', async function () {
        prepareCopyTest();

        const scriptAsset = makeScriptAssetWithAssetRefs();
        api.globals.assets.add(scriptAsset);

        const root = api.globals.entities.create();
        const e = api.globals.entities.create({ parent: root, name: 'e' });
        const e2 = api.globals.entities.create({ parent: e, name: 'e2' });

        e.addComponent('testcomponent', {
            assetRef: scriptAsset.get('id'),
            assetArrayRef: [scriptAsset.get('id')],
            nestedAssetRef: {
                1: {
                    asset: scriptAsset.get('id')
                }
            }
        });
        e.addComponent('script', {
            scripts: {
                test: {
                    attributes: {
                        asset: scriptAsset.get('id'),
                        assetArray: [scriptAsset.get('id')],
                        json: {
                            asset: scriptAsset.get('id'),
                            assetArray: [scriptAsset.get('id')]
                        },
                        jsonArray: [{
                            asset: scriptAsset.get('id'),
                            assetArray: [scriptAsset.get('id')]
                        }]
                    }
                }
            }
        });

        e2.addComponent('testcomponent', {
            assetRef: 1000,
            assetArrayRef: [1000],
            nestedAssetRef: {
                1: {
                    asset: 1000
                }
            }
        });
        e2.addComponent('script', {
            scripts: {
                test: {
                    attributes: {
                        asset: 1000,
                        assetArray: [1000],
                        json: {
                            asset: 1000,
                            assetArray: [1000]
                        },
                        jsonArray: [{
                            asset: 1000,
                            assetArray: [1000]
                        }]
                    }
                }
            }
        });

        api.globals.entities.copyToClipboard([e]);
        let newEntities = await api.globals.entities.pasteFromClipboard(root);
        let newE = newEntities[0];
        let newChild = newEntities[0].children[0];
        expect(newE.get('components.testcomponent.assetRef')).to.equal(scriptAsset.get('id'));
        expect(newE.get('components.testcomponent.assetArrayRef')).to.deep.equal([scriptAsset.get('id')]);
        expect(newE.get('components.testcomponent.nestedAssetRef.1.asset')).to.equal(scriptAsset.get('id'));

        expect(newE.get('components.script.scripts.test.attributes.asset')).to.equal(scriptAsset.get('id'));
        expect(newE.get('components.script.scripts.test.attributes.assetArray')).to.deep.equal([scriptAsset.get('id')]);
        expect(newE.get('components.script.scripts.test.attributes.json.asset')).to.equal(scriptAsset.get('id'));
        expect(newE.get('components.script.scripts.test.attributes.json.assetArray')).to.deep.equal([scriptAsset.get('id')]);
        expect(newE.get('components.script.scripts.test.attributes.jsonArray.0.asset')).to.equal(scriptAsset.get('id'));
        expect(newE.get('components.script.scripts.test.attributes.jsonArray.0.assetArray')).to.deep.equal([scriptAsset.get('id')]);

        expect(newChild.get('components.testcomponent.assetRef')).to.equal(1000);
        expect(newChild.get('components.testcomponent.assetArrayRef')).to.deep.equal([1000]);
        expect(newChild.get('components.testcomponent.nestedAssetRef.1.asset')).to.equal(1000);

        expect(newChild.get('components.script.scripts.test.attributes.asset')).to.equal(1000);
        expect(newChild.get('components.script.scripts.test.attributes.assetArray')).to.deep.equal([1000]);
        expect(newChild.get('components.script.scripts.test.attributes.json.asset')).to.equal(1000);
        expect(newChild.get('components.script.scripts.test.attributes.json.assetArray')).to.deep.equal([1000]);
        expect(newChild.get('components.script.scripts.test.attributes.jsonArray.0.asset')).to.equal(1000);
        expect(newChild.get('components.script.scripts.test.attributes.jsonArray.0.assetArray')).to.deep.equal([1000]);

        api.globals.projectId = 2;
        api.globals.assets.remove(scriptAsset);

        const newScriptAsset = makeScriptAssetWithAssetRefs(2);
        api.globals.assets.add(newScriptAsset);
        newEntities = await api.globals.entities.pasteFromClipboard(root);
        newE = newEntities[0];
        newChild = newEntities[0].children[0];
        expect(newE.get('components.testcomponent.assetRef')).to.equal(newScriptAsset.get('id'));
        expect(newE.get('components.testcomponent.assetArrayRef')).to.deep.equal([newScriptAsset.get('id')]);
        expect(newE.get('components.testcomponent.nestedAssetRef.1.asset')).to.equal(newScriptAsset.get('id'));

        expect(newE.get('components.script.scripts.test.attributes.asset')).to.equal(newScriptAsset.get('id'));
        expect(newE.get('components.script.scripts.test.attributes.assetArray')).to.deep.equal([newScriptAsset.get('id')]);
        expect(newE.get('components.script.scripts.test.attributes.json.asset')).to.equal(newScriptAsset.get('id'));
        expect(newE.get('components.script.scripts.test.attributes.json.assetArray')).to.deep.equal([newScriptAsset.get('id')]);
        expect(newE.get('components.script.scripts.test.attributes.jsonArray.0.asset')).to.equal(newScriptAsset.get('id'));
        expect(newE.get('components.script.scripts.test.attributes.jsonArray.0.assetArray')).to.deep.equal([newScriptAsset.get('id')]);

        expect(newChild.get('components.testcomponent.assetRef')).to.equal(null);
        expect(newChild.get('components.testcomponent.assetArrayRef')).to.deep.equal([null]);
        expect(newChild.get('components.testcomponent.nestedAssetRef.1.asset')).to.equal(null);

        expect(newChild.get('components.script.scripts.test.attributes.asset')).to.equal(null);
        expect(newChild.get('components.script.scripts.test.attributes.assetArray')).to.deep.equal([null]);
        expect(newChild.get('components.script.scripts.test.attributes.json.asset')).to.equal(null);
        expect(newChild.get('components.script.scripts.test.attributes.json.assetArray')).to.deep.equal([null]);
        expect(newChild.get('components.script.scripts.test.attributes.jsonArray.0.asset')).to.equal(null);
        expect(newChild.get('components.script.scripts.test.attributes.jsonArray.0.assetArray')).to.deep.equal([null]);
    });

    it('paste remaps assets in new project when assets exist at same paths', async function () {
        prepareCopyTest();
        const folder = new api.Asset({
            id: 1,
            name: 'folder',
            type: 'folder',
            path: []
        });
        api.globals.assets.add(folder);

        const asset = new api.Asset({
            id: 2,
            name: 'asset',
            type: 'material',
            path: [folder.get('id')]
        });
        api.globals.assets.add(asset);

        const root = api.globals.entities.create();
        const e = api.globals.entities.create({ parent: root });
        e.addComponent('testcomponent', {
            assetRef: asset.get('id')
        });

        api.globals.entities.copyToClipboard([e]);

        api.globals.projectId = 2;
        api.globals.assets.remove(asset);
        api.globals.assets.remove(folder);

        folder.set('id', 3);
        asset.set('id', 4);
        asset.set('path', [3]);
        api.globals.assets.add(folder);
        api.globals.assets.add(asset);

        const newEntities = await api.globals.entities.pasteFromClipboard(root);
        expect(newEntities[0].get('components.testcomponent.assetRef')).to.equal(4);
    });

    it('undo / redo paste', async function () {
        prepareCopyTest();
        const root = api.globals.entities.create();
        const e = api.globals.entities.create({ parent: root, name: 'e' });
        const e2 = api.globals.entities.create({ parent: e, name: 'e2' });
        api.globals.entities.copyToClipboard([e]);
        const newEntities = await api.globals.entities.pasteFromClipboard(root, { history: true });

        const jsonE = newEntities[0].json();
        const jsonE2 = newEntities[0].children[0].json();

        await api.globals.history.undo();

        expect(root.children).to.deep.equal([e]);
        expect(e.children).to.deep.equal([e2]);

        await api.globals.history.redo();

        expect(root.children.length).to.equal(2);
        expect(JSON.stringify(root.children[1].json())).to.equal(JSON.stringify(jsonE));
        expect(JSON.stringify(root.children[1].children[0].json())).to.equal(JSON.stringify(jsonE2));
    });

    it('paste remaps template_ent_ids', async function () {
        prepareCopyTest();
        const root = api.globals.entities.create();
        const e = api.globals.entities.create({ parent: root, name: 'e' });
        const e2 = api.globals.entities.create({ parent: e, name: 'e2' });

        const eTemplateId = api.Guid.create();
        const e2TemplateId = api.Guid.create();
        e.set('template_ent_ids', {
            [e.get('resource_id')]: eTemplateId,
            [e2.get('resource_id')]: e2TemplateId
        });

        api.globals.entities.copyToClipboard([e]);
        const newEntities = await api.globals.entities.pasteFromClipboard(root, { history: true });

        expect(newEntities[0].get('template_ent_ids')).to.deep.equal({
            [newEntities[0].get('resource_id')]: eTemplateId,
            [newEntities[0].children[0].get('resource_id')]: e2TemplateId
        });
    });
});
