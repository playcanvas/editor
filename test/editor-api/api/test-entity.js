describe('api.Entity tests', function () {

    let sandbox;

    this.beforeEach(() => {
        sandbox = sinon.createSandbox();
        api.globals.entities = new api.Entities();
    });

    this.afterEach(() => {
        sandbox.restore();

        api.globals.schema = null;
        api.globals.realtime = null;
        api.globals.jobs = null;
        api.globals.history = null;
    });

    function addChildEntity(child, parent) {
        child.set('parent', parent.get('resource_id'));
        parent.insert('children', child.get('resource_id'));
    }

    function stubAddScript() {
        api.globals.schema = new api.Schema(schema);
        api.globals.realtime = new api.Realtime();
        api.globals.jobs = new api.Jobs();

        sandbox.stub(api.globals, 'messenger').value({
            once: (name, fn) => {
                setTimeout(() => {
                    fn({
                        status: 'success'
                    });
                });
            }
        });

        sandbox.stub(api.globals.realtime.scenes, 'current').value({
            id: () => 1,
            addEntity: () => {},
            removeEntity: () => {},
            whenNothingPending: (fn) => fn()
        });
    }

    it('get returns value', function () {
        const e = new api.Entity();
        expect(e.get('position')).to.deep.equal([0, 0, 0]);
    });

    it('set sets value', function () {
        const e = new api.Entity();
        e.set('position', [1, 2, 3]);
        expect(e.get('position')).to.deep.equal([1, 2, 3]);
    });

    it('insert inserts value', function () {
        const e = new api.Entity();
        e.insert('children', 'a');
        e.insert('children', 'b', 0);
        expect(e.get('children')).to.deep.equal(['b', 'a']);
    });

    it('returns children', function () {
        const p = new api.Entity();
        api.globals.entities.add(p);

        const c = new api.Entity();
        addChildEntity(c, p);
        api.globals.entities.add(c);

        expect(p.children).to.deep.equal([c]);
    });

    it('returns parent', function () {
        const p = new api.Entity();
        api.globals.entities.add(p);

        const c = new api.Entity();
        addChildEntity(c, p);
        api.globals.entities.add(c);

        expect(c.parent).to.equal(p);
    });

    it('findByName finds self', function () {
        const e = new api.Entity();
        e.set('name', 'self');
        api.globals.entities.add(e);
        expect(e.findByName('self')).to.equal(e);
    });

    it('findByName finds first child', function () {
        const p = new api.Entity();
        p.set('name', 'parent');
        api.globals.entities.add(p);

        const c = new api.Entity();
        c.set('name', 'child');
        addChildEntity(c, p);
        api.globals.entities.add(c);
        expect(p.findByName('child')).to.equal(c);
    });

    it('findByName finds deep child using DFS', function () {
        const p = new api.Entity();
        p.set('name', 'parent');
        api.globals.entities.add(p);

        const c = new api.Entity();
        c.set('name', 'child 1');
        addChildEntity(c, p);
        api.globals.entities.add(c);

        const c2 = new api.Entity();
        c2.set('name', 'desired');
        addChildEntity(c2, p);
        api.globals.entities.add(c2);

        const c3 = new api.Entity();
        c3.set('name', 'desired');
        addChildEntity(c3, c);
        api.globals.entities.add(c3);

        expect(p.findByName('desired')).to.equal(c3);
    });

    it('listByTag returns empty array if tag not found', function () {
        const p = new api.Entity();
        api.globals.entities.add(p);
        expect(p.listByTag('t')).to.deep.equal([]);
    });

    it('listByTag returns entities for 1 tag', function () {
        const p = new api.Entity();
        p.set('tags', ['t']);
        api.globals.entities.add(p);
        expect(p.listByTag('t')).to.deep.equal([p]);
    });

    it('listByTag returns entities for 2 tags using OR', function () {
        const e = new api.Entity();
        e.set('tags', ['t']);
        api.globals.entities.add(e);

        const e2 = new api.Entity();
        e2.set('tags', ['t2']);
        addChildEntity(e2, e);
        api.globals.entities.add(e2);

        const e3 = new api.Entity();
        e3.set('tags', ['t3']);
        addChildEntity(e3, e);
        api.globals.entities.add(e3);

        expect(e.listByTag('t2', 't3')).to.deep.equal([e2, e3]);
    });

    it('listByTag returns entities for 2 tags using AND', function () {
        const e = new api.Entity();
        e.set('tags', ['t']);
        api.globals.entities.add(e);

        const e2 = new api.Entity();
        e2.set('tags', ['t2', 't3']);
        addChildEntity(e2, e);
        api.globals.entities.add(e2);

        const e3 = new api.Entity();
        e3.set('tags', ['t3']);
        addChildEntity(e3, e);
        api.globals.entities.add(e3);

        expect(e.listByTag(['t2', 't3'])).to.deep.equal([e2]);
    });

    it('filter returns empty array', function () {
        const e = new api.Entity();
        expect(e.filter(entity => false)).to.deep.equal([]);
    });

    it('filter returns results', function () {
        const e = new api.Entity();
        expect(e.filter(entity => entity.get('position')[0] === 0)).to.deep.equal([e]);
    });

    it('addChild adds a child', function () {
        const e = new api.Entity();
        api.globals.entities.add(e);

        const c = new api.Entity();
        e.addChild(c);
        api.globals.entities.add(c);

        expect(e.children).to.deep.equal([c]);
    });

    it('addChild does not add duplicate child', function () {
        const e = new api.Entity();
        api.globals.entities.add(e);

        const c = new api.Entity();
        e.addChild(c);
        api.globals.entities.add(c);

        e.addChild(c);

        expect(e.children).to.deep.equal([c]);
    });

    it('insertChild adds a child at index', function () {
        const e = new api.Entity();
        api.globals.entities.add(e);

        const c = new api.Entity();
        e.addChild(c);
        api.globals.entities.add(c);

        const c2 = new api.Entity();
        e.insertChild(c2, 0);
        api.globals.entities.add(c2);

        expect(e.children).to.deep.equal([c2, c]);
    });

    it('addComponent adds default component data', function () {
        api.globals.schema = new api.Schema(schema);
        const e = api.globals.entities.create();
        e.addComponent('testcomponent');
        expect(e.has('components.testcomponent.entityRef')).to.equal(true);
    });

    it('addComponent accepts partial data', function () {
        api.globals.schema = new api.Schema(schema);
        const e = api.globals.entities.create();
        e.addComponent('testcomponent', {
            entityRef: e.get('resource_id')
        });
        expect(e.get('components.testcomponent.entityRef')).to.equal(e.get('resource_id'));
    });

    it('removeComponent removes component', function () {
        api.globals.schema = new api.Schema(schema);
        const e = api.globals.entities.create();
        e.addComponent('testcomponent');
        expect(e.has('components.testcomponent')).to.equal(true);
        e.removeComponent('testcomponent');
        expect(e.has('components.testcomponent')).to.equal(false);
    });

    it('isDescendant returns true for child', function () {
        const root = api.globals.entities.create();
        const child = api.globals.entities.create({ parent: root });
        expect(child.isDescendantOf(root)).to.equal(true);
        expect(child.isDescendantOf(child)).to.equal(false);
        expect(root.isDescendantOf(child)).to.equal(false);
        expect(root.isDescendantOf(root)).to.equal(false);
    });

    it('observer events are emitted by entity', function () {
        const e = api.globals.entities.create();
        let evtNameSet = false;
        let evtSet = false;
        e.once('name:set', () => {
            evtNameSet = true;
        });
        e.once('*:set', () => {
            evtSet = true;
        });

        e.set('name', 'test');

        expect(evtNameSet).to.equal(true);
        expect(evtSet).to.equal(true);
    });

    it('enabled flag in constructor is respected', function () {
        const e = new api.Entity();
        expect(e.get('enabled')).to.equal(true);

        const e2 = new api.Entity({
            enabled: false
        });
        expect(e2.get('enabled')).to.equal(false);

        const e3 = new api.Entity({
            enabled: true
        });
        expect(e3.get('enabled')).to.equal(true);

        const e4 = new api.Entity({
            enabled: 'something'
        });
        expect(e4.get('enabled')).to.equal(true);
    });

    it('name in constructor is valid', function () {
        const e = new api.Entity();
        expect(e.get('name')).to.equal('New Entity');

        const e2 = new api.Entity({ name: null });
        expect(e2.get('name')).to.equal('New Entity');

        const e3 = new api.Entity({ name: 'test' });
        expect(e3.get('name')).to.equal('test');

        const e4 = new api.Entity({ name: '' });
        expect(e4.get('name')).to.equal('');
    });

    it('depthFirst visits all children', function () {
        const e = api.globals.entities.create({
            name: 'root',
            children: [{
                name: 'child1',
                children: [{
                    name: 'child2'
                }]
            }, {
                name: 'child3'
            }]
        });

        // add a missing child as well to see if it crashes
        e.insert('children', 'missing');

        const visited = [];
        e.depthFirst(entity => {
            visited.push(entity ? entity.get('name') : 'null');
        });

        expect(visited).to.deep.equal(['root', 'child1', 'child2', 'child3', 'null']);
    });

    it('jsonHiearchy returns correct data', function () {
        const root = api.globals.entities.create({ name: 'root' });
        const e = api.globals.entities.create({ name: 'child', parent: root });

        const expected = root.json();
        expected.children[0] = e.json();
        expect(root.jsonHierarchy()).to.deep.equal(expected);
    });

    it('jsonHierarchy works with null children', function () {
        const root = api.globals.entities.create({ name: 'root' });
        root.set('children', ['missing']);
        expect(root.children).to.deep.equal([null]);

        const expected = root.json();
        expected.children = [ null ];
        expect(root.jsonHierarchy()).to.deep.equal(expected);
    });

    it('addScript adds script component if it does not exist', async function () {
        stubAddScript();

        const root = api.globals.entities.create();
        await root.addScript('test');
        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test'],
                scripts: {
                    test: {
                        enabled: true,
                        attributes: {}
                    }
                }
            }
        });
    });

    it('addScript adds script if script component exists', async function () {
        stubAddScript();

        const root = api.globals.entities.create();
        root.addComponent('script');

        await root.addScript('test');
        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test'],
                scripts: {
                    test: {
                        enabled: true,
                        attributes: {}
                    }
                }
            }
        });
    });

    it('addScript adds script to desired index', async function () {
        stubAddScript();

        const root = api.globals.entities.create();
        root.addComponent('script');

        await root.addScript('test');
        await root.addScript('test2');
        await root.addScript('test3', { index: 0 });
        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test3', 'test', 'test2'],
                scripts: {
                    test: {
                        enabled: true,
                        attributes: {}
                    },
                    test2: {
                        enabled: true,
                        attributes: {}
                    },
                    test3: {
                        enabled: true,
                        attributes: {}
                    }
                }
            }
        });
    });

    it('addScript sets default attribute values', async function () {
        stubAddScript();

        const root = api.globals.entities.create();
        await root.addScript('test', { attributes: { attr1: 'value' } });
        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test'],
                scripts: {
                    test: {
                        enabled: true,
                        attributes: {
                            attr1: 'value'
                        }
                    }
                }
            }
        });
    });

    it('addScript does nothing if script already exists', async function () {
        stubAddScript();

        const root = api.globals.entities.create();
        await root.addScript('test');
        await root.addScript('test'); // again

        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test'],
                scripts: {
                    test: {
                        enabled: true,
                        attributes: {}
                    }
                }
            }
        });
    });

    it('addScript works for multiple entities', async function () {
        stubAddScript();

        const root = api.globals.entities.create();
        const child = api.globals.entities.create({ parent: root });
        await api.globals.entities.addScript([root, child], 'test');

        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test'],
                scripts: {
                    test: {
                        enabled: true,
                        attributes: {}
                    }
                }
            }
        });

        expect(child.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test'],
                scripts: {
                    test: {
                        enabled: true,
                        attributes: {}
                    }
                }
            }
        });
    });

    it('undo addScript removes script and script component if script component was added', async function () {
        stubAddScript();
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        await root.addScript('test', { history: true });

        await api.globals.history.undo();
        expect(root.get('components')).to.deep.equal({});
    });

    it('undo addScript removes script and script component if script component was added in one of multiple entities', async function () {
        stubAddScript();
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        const child = api.globals.entities.create({ parent: root });
        child.addComponent('script');
        await api.globals.entities.addScript([root, child], 'test');

        await api.globals.history.undo();
        expect(root.get('components')).to.deep.equal({});
        expect(child.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: [],
                scripts: {}
            }
        });
    });

    it('undo addScript removes script only if script component existed', async function () {
        stubAddScript();
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        root.addComponent('script');
        await root.addScript('test', { history: true });

        await api.globals.history.undo();
        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: [],
                scripts: {}
            }
        });
    });

    it('undo addScript on multiple entities works if one of the entities is missing', async function () {
        stubAddScript();
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        const child = api.globals.entities.create({ parent: root });
        await api.globals.entities.addScript([root, child], 'test');
        await child.delete({ history: false });

        await api.globals.history.undo();
        expect(root.get('components')).to.deep.equal({});
    });

    it('redo addScript adds script again and script component again', async function () {
        stubAddScript();
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        await root.addScript('test', { history: true });

        await api.globals.history.undo();
        await api.globals.history.redo();

        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test'],
                scripts: {
                    test: {
                        enabled: true,
                        attributes: {}
                    }
                }
            }
        });
    });

    it('redo addScript adds script again and script component again for multiple entities', async function () {
        stubAddScript();
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        const child = api.globals.entities.create();
        await api.globals.entities.addScript([root, child], 'test', { history: true });

        await api.globals.history.undo();
        await api.globals.history.redo();

        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test'],
                scripts: {
                    test: {
                        enabled: true,
                        attributes: {}
                    }
                }
            }
        });

        expect(child.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test'],
                scripts: {
                    test: {
                        enabled: true,
                        attributes: {}
                    }
                }
            }
        });
    });

    it('redo addScript on multiple entities works if one of the entities is missing', async function () {
        stubAddScript();
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        const child = api.globals.entities.create({ parent: root });
        await api.globals.entities.addScript([root, child], 'test');
        await child.delete({ history: false });

        await api.globals.history.undo();
        await api.globals.history.redo();
        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test'],
                scripts: {
                    test: {
                        enabled: true,
                        attributes: {}
                    }
                }
            }
        });
    });

    it('removeScript removes script from entity', async function () {
        stubAddScript();

        const root = api.globals.entities.create();
        await root.addScript('test');

        root.removeScript('test');

        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: [],
                scripts: {}
            }
        });
    });

    it('removeScript removes script from multiple entities', async function () {
        stubAddScript();

        const root = api.globals.entities.create();
        const child = api.globals.entities.create({ parent: root });
        await api.globals.entities.addScript([root, child], 'test');

        api.globals.entities.removeScript([root, child], 'test');

        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: [],
                scripts: {}
            }
        });

        expect(child.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: [],
                scripts: {}
            }
        });
    });

    it('undo removeScript adds script back', async function () {
        stubAddScript();
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        await root.addScript('test');

        root.removeScript('test');
        await api.globals.history.undo();

        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test'],
                scripts: {
                    test: {
                        enabled: true,
                        attributes: {}
                    }
                }
            }
        });
    });

    it('undo removeScript adds script back with its previous attribute values', async function () {
        stubAddScript();
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        await root.addScript('test', { attributes: { attr1: 'value' } });

        root.removeScript('test');
        await api.globals.history.undo();

        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test'],
                scripts: {
                    test: {
                        enabled: true,
                        attributes: {
                            attr1: 'value'
                        }
                    }
                }
            }
        });
    });

    it('undo removeScript adds script back to multiple entities', async function () {
        stubAddScript();
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        const child = api.globals.entities.create({ parent: root });
        await api.globals.entities.addScript([root, child], 'test');

        api.globals.entities.removeScript([root, child], 'test');
        await api.globals.history.undo();

        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test'],
                scripts: {
                    test: {
                        enabled: true,
                        attributes: {}
                    }
                }
            }
        });

        expect(child.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test'],
                scripts: {
                    test: {
                        enabled: true,
                        attributes: {}
                    }
                }
            }
        });
    });

    it('redo removeScript removes script again', async function () {
        stubAddScript();
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        await root.addScript('test');

        root.removeScript('test');
        await api.globals.history.undo();
        await api.globals.history.redo();

        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: [],
                scripts: {}
            }
        });
    });

    it('redo removeScript removes script again from multiple entities', async function () {
        stubAddScript();
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        const child = api.globals.entities.create({ parent: root });
        await api.globals.entities.addScript([root, child], 'test');

        api.globals.entities.removeScript([root, child], 'test');
        await api.globals.history.undo();
        await api.globals.history.redo();

        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: [],
                scripts: {}
            }
        });

        expect(child.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: [],
                scripts: {}
            }
        });
    });

    it('undo removeScript does nothing if script component no longer exists', async function () {
        stubAddScript();
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        await root.addScript('test');

        root.removeScript('test');

        root.history.enabled = false;
        root.removeComponent('script');
        root.history.enabled = true;

        await api.globals.history.undo();

        expect(root.get('components')).to.deep.equal({});
    });

    it('undo removeScript adds script back to its old index', async function () {
        stubAddScript();
        api.globals.history = new api.History();

        const root = api.globals.entities.create();
        await root.addScript('test');
        await root.addScript('test2');

        const child = api.globals.entities.create({ parent: root });
        await child.addScript('test2');
        await child.addScript('test');

        api.globals.entities.removeScript([root, child], 'test');
        await api.globals.history.undo();

        expect(root.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test', 'test2'],
                scripts: {
                    test: {
                        enabled: true,
                        attributes: {}
                    },
                    test2: {
                        enabled: true,
                        attributes: {}
                    }
                }
            }
        });

        expect(child.get('components')).to.deep.equal({
            script: {
                enabled: true,
                order: ['test2', 'test'],
                scripts: {
                    test2: {
                        enabled: true,
                        attributes: {}
                    },
                    test: {
                        enabled: true,
                        attributes: {}
                    }
                }
            }
        });
    });
});
