describe('Assets API tests', function () {
    let assets;
    let sandbox;

    beforeEach(function () {
        api.globals.schema = null;
        api.globals.entities = null;
        api.globals.jobs = null;
        api.globals.realtime = null;
        api.globals.messenger = null;
        api.globals.history = null;
        api.globals.assets = new api.Assets();
        assets = api.globals.assets;
        sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        sandbox.restore();
    });

    function boilerplate(className, scriptName) {
        return `
var ${className} = pc.createScript('${scriptName}');

// initialize code called once per entity
${className}.prototype.initialize = function() {

};

// update code called every frame
${className}.prototype.update = function(dt) {

};

// uncomment the swap method to enable hot-reloading for this script
// update the method body to copy state from the old instance
// ${className}.prototype.swap = function(old) { };

// learn more about scripting here:
// https://developer.playcanvas.com/user-manual/scripting/
        `.trim();
    }

    it('lists assets', function () {
        const asset = new api.Asset({ type: 'material' });
        assets.add(asset);
        expect(assets.list()).to.deep.equal([asset]);
    });

    it('get returns asset', function () {
        const asset = new api.Asset({ type: 'material', id: 1 });
        assets.add(asset);
        expect(assets.get(1)).to.equal(asset);
    });

    it('getUnique returns asset', function () {
        const asset = new api.Asset({ type: 'material', id: 1, uniqueId: 2 });
        assets.add(asset);
        expect(assets.getUnique(2)).to.equal(asset);
    });

    it('add does not add duplicate asset', function () {
        const asset = new api.Asset({ type: 'material', id: 1 });
        assets.add(asset);
        assets.add(asset);
        expect(assets.list()).to.deep.equal([asset]);
    });

    it('add sorts assets alphabetically', function () {
        const asset1 = new api.Asset({ type: 'material', id: 1, name: '1' });
        const asset2 = new api.Asset({ type: 'material', id: 2, name: '2' });
        const asset3 = new api.Asset({ type: 'material', id: 3, name: '3' });
        assets.add(asset2);
        assets.add(asset3);
        assets.add(asset1);
        expect(assets.list()).to.deep.equal([asset1, asset2, asset3]);
    });

    it('add puts folders first', function () {
        const asset1 = new api.Asset({ type: 'material', id: 1, name: '1' });
        const asset2 = new api.Asset({ type: 'material', id: 2, name: '2' });
        const asset3 = new api.Asset({ type: 'folder', id: 3, name: '3' });
        const asset4 = new api.Asset({ type: 'folder', id: 4, name: '4' });
        assets.add(asset1);
        assets.add(asset2);
        assets.add(asset4);
        assets.add(asset3);
        expect(assets.list()).to.deep.equal([asset3, asset4, asset1, asset2]);
    });

    it('add emits events', function () {
        const a = new api.Asset({ id: 1, type: 'material' });
        const evts = {};

        assets.once('add', (asset, pos) => {
            evts.add = { asset, pos };
        });
        assets.once('add[1]', (asset, pos) => {
            evts.addId = { asset, pos };
        });

        assets.add(a);

        expect(evts.add).to.deep.equal({ asset: a, pos: -1 });
        expect(evts.addId).to.deep.equal({ asset: a, pos: -1 });
    });

    it('changing asset name re-sorts assets', function () {
        const asset1 = new api.Asset({ type: 'material', id: 1, name: '1' });
        const asset2 = new api.Asset({ type: 'material', id: 2, name: '2' });
        const asset3 = new api.Asset({ type: 'folder', id: 3, name: '3' });
        const asset4 = new api.Asset({ type: 'folder', id: 4, name: '4' });
        assets.add(asset1);
        assets.add(asset2);
        assets.add(asset4);
        assets.add(asset3);
        expect(assets.list()).to.deep.equal([asset3, asset4, asset1, asset2]);

        asset3.set('name', '5');
        expect(assets.list()).to.deep.equal([asset4, asset3, asset1, asset2]);

        asset1.set('name', '6');
        expect(assets.list()).to.deep.equal([asset4, asset3, asset2, asset1]);
    });

    it('remove removes asset', function () {
        const asset = new api.Asset({ type: 'material', id: 1 });
        assets.add(asset);
        assets.remove(asset);
        expect(assets.list()).to.deep.equal([]);
    });

    it('clear removes all assets', function () {
        const asset = new api.Asset({ type: 'material', id: 1 });
        assets.add(asset);
        assets.clear();
        expect(assets.list()).to.deep.equal([]);
    });

    it('filter returns assets', function () {
        const asset1 = new api.Asset({ name: 'mat', type: 'material', id: 1 });
        const asset2 = new api.Asset({ name: 'tex', type: 'texture', id: 2 });
        assets.add(asset1);
        assets.add(asset2);
        expect(assets.filter(asset => asset.get('type') === 'material')).to.deep.equal([asset1]);
    });

    it('findOne returns asset', function () {
        const asset1 = new api.Asset({ name: 'mat', type: 'material', id: 1 });
        const asset2 = new api.Asset({ name: 'mat2', type: 'material', id: 2 });
        assets.add(asset1);
        assets.add(asset2);
        expect(assets.findOne(asset => asset.get('type') === 'material')).to.equal(asset1);
    });

    it('listByTag returns empty array if tag not found', function () {
        const asset = new api.Asset({ id: 1, type: 'material' });
        assets.add(asset);
        expect(assets.listByTag('t')).to.deep.equal([]);
    });

    it('listByTag returns assets for 1 tag', function () {
        const asset = new api.Asset({ id: 1, type: 'material' });
        asset.set('tags', ['t']);
        assets.add(asset);
        expect(assets.listByTag('t')).to.deep.equal([asset]);
    });

    it('listByTag returns assets for 2 tags using OR', function () {
        const asset1 = new api.Asset({ id: 1, type: 'material', name: '1' });
        asset1.set('tags', ['t']);
        assets.add(asset1);

        const asset2 = new api.Asset({ id: 2, type: 'material', name: '2' });
        asset2.set('tags', ['t2']);
        assets.add(asset2);

        const asset3 = new api.Asset({ id: 3, type: 'material', name: '3' });
        asset3.set('tags', ['t3']);
        assets.add(asset3);

        expect(assets.listByTag('t2', 't3')).to.deep.equal([asset2, asset3]);
    });

    it('listByTag returns assets for 2 tags using AND', function () {
        const asset1 = new api.Asset({ id: 1, type: 'material' });
        asset1.set('tags', ['t']);
        assets.add(asset1);

        const asset2 = new api.Asset({ id: 2, type: 'material' });
        asset2.set('tags', ['t2', 't3']);
        assets.add(asset2);

        const asset3 = new api.Asset({ id: 3, type: 'material' });
        asset3.set('tags', ['t3']);
        assets.add(asset3);

        expect(assets.listByTag(['t2', 't3'])).to.deep.equal([asset2]);
    });

    it('getAssetForScript returns asset', function () {
        const asset = new api.Asset({
            id: 1,
            type: 'script',
            data: {
                scripts: {
                    test: {}
                }
            }

        });
        assets.add(asset);

        expect(assets.getAssetForScript('test')).to.equal(asset);
        expect(assets.getAssetForScript('test2')).to.equal(null);
    });

    it('creates anim state graph', function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.branchId = 'branch';
        api.globals.projectId = 1;
        api.globals.schema = new api.Schema(schema);

        const folder = new api.Asset({ id: 10 });
        api.globals.assets.createAnimStateGraph({
            name: 'name',
            folder: folder
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;
        expect(data.get('branchId')).to.equal('branch');
        expect(data.get('projectId')).to.equal('1');
        expect(data.get('type')).to.equal('animstategraph');
        expect(data.get('name')).to.equal('name');
        expect(data.get('preload')).to.equal('true');
        expect(data.get('parent')).to.equal('10');
        expect(data.get('data')).to.equal(JSON.stringify({
            testData: 0
        }));
    });

    it('creates bundle', function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.branchId = 'branch';
        api.globals.projectId = 1;
        api.globals.schema = new api.Schema(schema);

        const assets = [new api.Asset({ id: 1 })];
        const folder = new api.Asset({ id: 10 });
        api.globals.assets.createBundle({
            name: 'name',
            assets: assets,
            folder: folder
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;
        expect(data.get('branchId')).to.equal('branch');
        expect(data.get('projectId')).to.equal('1');
        expect(data.get('type')).to.equal('bundle');
        expect(data.get('name')).to.equal('name');
        expect(data.get('preload')).to.equal('true');
        expect(data.get('parent')).to.equal('10');
        expect(data.get('data')).to.equal(JSON.stringify({
            assets: [1]
        }));
    });

    it('creates css asset', async function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.branchId = 'branch';
        api.globals.projectId = 1;

        const folder = new api.Asset({ id: 10 });
        api.globals.assets.createCss({
            name: 'name',
            text: 'text',
            folder: folder
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;
        expect(data.get('branchId')).to.equal('branch');
        expect(data.get('projectId')).to.equal('1');
        expect(data.get('filename')).to.equal('asset.css');
        expect(data.get('file') instanceof Blob).to.equal(true);
        expect(await data.get('file').text()).to.equal('text');
        expect(data.get('type')).to.equal('css');
        expect(data.get('name')).to.equal('name');
        expect(data.get('parent')).to.equal('10');
        expect(data.get('preload')).to.equal('true');
    });

    it('creates cubemap asset', function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.branchId = 'branch';
        api.globals.projectId = 1;
        api.globals.schema = new api.Schema(schema);

        const textures = [];
        for (let i = 0; i < 6; i++) {
            textures.push(new api.Asset({ id: i + 1 }));
        }

        const folder = new api.Asset({ id: 10 });
        api.globals.assets.createCubemap({
            name: 'name',
            textures: textures,
            folder: folder
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;
        expect(data.get('branchId')).to.equal('branch');
        expect(data.get('projectId')).to.equal('1');
        expect(data.get('type')).to.equal('cubemap');
        expect(data.get('name')).to.equal('name');
        expect(data.get('preload')).to.equal('true');
        expect(data.get('parent')).to.equal('10');
        expect(data.get('data')).to.equal(JSON.stringify({
            name: 'name',
            textures: [1, 2, 3, 4, 5, 6],
            minFilter: 5,
            magFilter: 1,
            anisotropy: 1
        }));
    });

    it('creates folder asset', function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.branchId = 'branch';
        api.globals.projectId = 1;
        api.globals.schema = new api.Schema(schema);

        const textures = [];
        for (let i = 0; i < 6; i++) {
            textures.push(new api.Asset({ id: i + 1 }));
        }

        const folder = new api.Asset({ id: 10 });
        api.globals.assets.createFolder({
            name: 'name',
            folder: folder
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;
        expect(data.get('branchId')).to.equal('branch');
        expect(data.get('projectId')).to.equal('1');
        expect(data.get('type')).to.equal('folder');
        expect(data.get('name')).to.equal('name');
        expect(data.get('parent')).to.equal('10');
        expect(data.get('preload')).to.equal('true');
    });

    it('creates html asset', async function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.branchId = 'branch';
        api.globals.projectId = 1;

        const folder = new api.Asset({ id: 10 });
        api.globals.assets.createHtml({
            name: 'name',
            text: 'text',
            folder: folder
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;
        expect(data.get('branchId')).to.equal('branch');
        expect(data.get('projectId')).to.equal('1');
        expect(data.get('filename')).to.equal('asset.html');
        expect(data.get('file') instanceof Blob).to.equal(true);
        expect(await data.get('file').text()).to.equal('text');
        expect(data.get('type')).to.equal('html');
        expect(data.get('name')).to.equal('name');
        expect(data.get('parent')).to.equal('10');
        expect(data.get('preload')).to.equal('true');
    });

    it('creates json asset', async function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.branchId = 'branch';
        api.globals.projectId = 1;

        const folder = new api.Asset({ id: 10 });
        api.globals.assets.createJson({
            name: 'name',
            json: { test: 1 },
            folder: folder
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;
        expect(data.get('branchId')).to.equal('branch');
        expect(data.get('projectId')).to.equal('1');
        expect(data.get('filename')).to.equal('asset.json');
        expect(data.get('file') instanceof Blob).to.equal(true);
        expect(await data.get('file').text()).to.equal('{"test":1}');
        expect(data.get('type')).to.equal('json');
        expect(data.get('name')).to.equal('name');
        expect(data.get('parent')).to.equal('10');
        expect(data.get('preload')).to.equal('true');
    });

    it('creates i18n asset', async function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.branchId = 'branch';
        api.globals.projectId = 1;

        const folder = new api.Asset({ id: 10 });
        api.globals.assets.createI18n({
            name: 'name',
            folder: folder
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;
        expect(data.get('branchId')).to.equal('branch');
        expect(data.get('projectId')).to.equal('1');
        expect(data.get('filename')).to.equal('asset.json');
        expect(data.get('file') instanceof Blob).to.equal(true);
        expect(await data.get('file').text()).to.equal(JSON.stringify({
            "header": {
                "version": 1
            },
            "data": [{
                "info": {
                    "locale": "en-US"
                },
                "messages": {
                    "key": "Single key translation",
                    "key plural": ["One key translation", "Translation for {number} keys"]
                }
            }]
        }, null, 4));
        expect(data.get('type')).to.equal('json');
        expect(data.get('name')).to.equal('name');
        expect(data.get('parent')).to.equal('10');
        expect(data.get('preload')).to.equal('true');
    });

    it('creates material asset', function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.branchId = 'branch';
        api.globals.projectId = 1;
        api.globals.schema = new api.Schema(schema);

        const folder = new api.Asset({ id: 10 });
        api.globals.assets.createMaterial({
            name: 'name',
            folder: folder
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;
        expect(data.get('branchId')).to.equal('branch');
        expect(data.get('projectId')).to.equal('1');
        expect(data.get('type')).to.equal('material');
        expect(data.get('name')).to.equal('name');
        expect(data.get('parent')).to.equal('10');
        expect(data.get('preload')).to.equal('true');
        expect(data.get('data')).to.equal(JSON.stringify({
            diffuse: [0, 0, 0]
        }));
    });

    it('creates shader asset', async function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.branchId = 'branch';
        api.globals.projectId = 1;

        const folder = new api.Asset({ id: 10 });
        api.globals.assets.createShader({
            name: 'name',
            text: 'text',
            folder: folder
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;
        expect(data.get('branchId')).to.equal('branch');
        expect(data.get('projectId')).to.equal('1');
        expect(data.get('filename')).to.equal('asset.glsl');
        expect(data.get('file') instanceof Blob).to.equal(true);
        expect(await data.get('file').text()).to.equal('text');
        expect(data.get('type')).to.equal('shader');
        expect(data.get('name')).to.equal('name');
        expect(data.get('parent')).to.equal('10');
        expect(data.get('preload')).to.equal('true');
    });

    it('creates sprite asset', function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.branchId = 'branch';
        api.globals.projectId = 1;

        const atlas = new api.Asset({ id: 1 });
        const folder = new api.Asset({ id: 10 });
        api.globals.assets.createSprite({
            name: 'name',
            textureAtlas: atlas,
            folder: folder
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;
        expect(data.get('branchId')).to.equal('branch');
        expect(data.get('projectId')).to.equal('1');
        expect(data.get('type')).to.equal('sprite');
        expect(data.get('name')).to.equal('name');
        expect(data.get('parent')).to.equal('10');
        expect(data.get('preload')).to.equal('true');
        expect(data.get('data')).to.equal(JSON.stringify({
            pixelsPerUnit: 100,
            frameKeys: [],
            textureAtlasAsset: 1,
            renderMode: 0
        }));
    });

    it('creates text asset', async function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.branchId = 'branch';
        api.globals.projectId = 1;

        const folder = new api.Asset({ id: 10 });
        api.globals.assets.createText({
            name: 'name',
            text: 'text',
            folder: folder
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;
        expect(data.get('branchId')).to.equal('branch');
        expect(data.get('projectId')).to.equal('1');
        expect(data.get('filename')).to.equal('asset.txt');
        expect(data.get('file') instanceof Blob).to.equal(true);
        expect(await data.get('file').text()).to.equal('text');
        expect(data.get('type')).to.equal('text');
        expect(data.get('name')).to.equal('name');
        expect(data.get('parent')).to.equal('10');
        expect(data.get('preload')).to.equal('true');
    });

    it('creates template asset', function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.schema = new api.Schema(schema);
        api.globals.entities = new api.Entities();

        api.globals.branchId = 'branch';
        api.globals.projectId = 1;

        const root = api.globals.entities.create({ name: 'root' });
        const child = api.globals.entities.create({ name: 'child', parent: root });

        const folder = new api.Asset({ id: 10 });

        const guids = [
            'root_guid',
            'child_guid'
        ];
        let guidIndex = 0;
        sandbox.replace(api.Guid, 'create', () => guids[guidIndex++]);

        api.globals.assets.createTemplate({
            entity: root,
            folder: folder
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;
        expect(data.get('branchId')).to.equal('branch');
        expect(data.get('projectId')).to.equal('1');
        expect(data.get('type')).to.equal('template');
        expect(data.get('name')).to.equal('root');
        expect(data.get('parent')).to.equal('10');
        expect(data.get('preload')).to.equal('true');

        const expected = { entities: {} };

        expected.entities[guids[0]] = root.json();
        expected.entities[guids[0]].resource_id = guids[0];
        expected.entities[guids[0]].children = [guids[1]];

        expected.entities[guids[1]] = child.json();
        expected.entities[guids[1]].resource_id = guids[1];
        expected.entities[guids[1]].parent = guids[0];

        expect(data.get('data')).to.equal(JSON.stringify(expected));
    });

    it('template asset remaps entity references', function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.schema = new api.Schema(schema);
        api.globals.entities = new api.Entities();

        const root = api.globals.entities.create({ name: 'root' });
        const child = api.globals.entities.create({ name: 'child', parent: root });
        const subChild = api.globals.entities.create({ name: 'subchild', parent: child });

        root.addComponent('testcomponent', {
            entityRef: child.get('resource_id'),
            entityArrayRef: [child.get('resource_id')]
        });

        child.addComponent('testcomponent', {
            entityRef: subChild.get('resource_id'),
            entityArrayRef: [subChild.get('resource_id')]
        });

        // create missing reference to check it doesn't crash
        subChild.addComponent('testcomponent', {
            entityRef: 'missing',
            entityArrayRef: ['missing']
        });

        const guids = [
            'root_guid',
            'child_guid',
            'subchild_guid'
        ];
        let guidIndex = 0;
        sandbox.replace(api.Guid, 'create', () => guids[guidIndex++]);

        api.globals.assets.createTemplate({
            entity: root
        }).catch(err => {
            console.error(err);
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;

        const expected = { entities: {} };

        expected.entities[guids[0]] = root.json();
        expected.entities[guids[0]].resource_id = guids[0];
        expected.entities[guids[0]].children = [guids[1]];
        expected.entities[guids[0]].components.testcomponent.entityRef = guids[1];
        expected.entities[guids[0]].components.testcomponent.entityArrayRef = [guids[1]];

        expected.entities[guids[1]] = child.json();
        expected.entities[guids[1]].resource_id = guids[1];
        expected.entities[guids[1]].parent = guids[0];
        expected.entities[guids[1]].children = [guids[2]];
        expected.entities[guids[1]].components.testcomponent.entityRef = guids[2];
        expected.entities[guids[1]].components.testcomponent.entityArrayRef = [guids[2]];

        expected.entities[guids[2]] = subChild.json();
        expected.entities[guids[2]].resource_id = guids[2];
        expected.entities[guids[2]].parent = guids[1];
        expected.entities[guids[2]].components.testcomponent.entityRef = null;
        expected.entities[guids[2]].components.testcomponent.entityArrayRef = [null];

        expect(data.get('data')).to.equal(JSON.stringify(expected));
    });

    it('template asset does not remap external entity refs', function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.schema = new api.Schema(schema);
        api.globals.entities = new api.Entities();

        const root = api.globals.entities.create({ name: 'root' });
        const child = api.globals.entities.create({ name: 'child', parent: root });

        child.addComponent('testcomponent', {
            entityRef: root.get('resource_id')
        });

        const guids = [
            'child_guid'
        ];
        let guidIndex = 0;
        sandbox.replace(api.Guid, 'create', () => guids[guidIndex++]);

        api.globals.assets.createTemplate({
            entity: child
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;

        const expected = { entities: {} };

        expected.entities[guids[0]] = child.json();
        expected.entities[guids[0]].parent = null;
        expected.entities[guids[0]].resource_id = guids[0];
        expected.entities[guids[0]].components.testcomponent.entityRef = null;

        expect(data.get('data')).to.equal(JSON.stringify(expected));
    });

    it('template asset remaps template_ent_ids', function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.schema = new api.Schema(schema);
        api.globals.entities = new api.Entities();

        const templateGuids = [
            api.Guid.create(),
            api.Guid.create(),
            api.Guid.create(),
            api.Guid.create()
        ];

        const root = api.globals.entities.create({ name: 'root' });
        const child = api.globals.entities.create({ name: 'child', parent: root });
        const child2 = api.globals.entities.create({ name: 'child2', parent: child });
        const missing = api.Guid.create();

        root.set('template_ent_ids', {
            [root.get('resource_id')]: templateGuids[0],
            [child.get('resource_id')]: templateGuids[1],
            [child2.get('resource_id')]: templateGuids[2],
            [missing]: templateGuids[3]
        });

        child.set('template_ent_ids', {
            [child.get('resource_id')]: templateGuids[1],
            [child2.get('resource_id')]: templateGuids[2],
            [missing]: templateGuids[3]
        });

        child2.set('template_ent_ids', {
            [child2.get('resource_id')]: templateGuids[2],
            [missing]: templateGuids[3]
        });

        const guids = [
            'root_guid',
            'child_guid',
            'missing',
            'child_2_guid'
        ];
        let guidIndex = 0;
        sandbox.replace(api.Guid, 'create', () => guids[guidIndex++]);

        api.globals.assets.createTemplate({
            entity: root
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;

        const expected = { entities: {} };

        expected.entities[guids[0]] = root.json();
        expected.entities[guids[0]].resource_id = guids[0];
        expected.entities[guids[0]].children = [guids[1]];
        delete expected.entities[guids[0]].template_ent_ids;

        expected.entities[guids[1]] = child.json();
        expected.entities[guids[1]].resource_id = guids[1];
        expected.entities[guids[1]].parent = guids[0];
        expected.entities[guids[1]].children = [guids[3]];
        expected.entities[guids[1]].template_ent_ids = {
            [guids[1]]: templateGuids[1],
            [guids[3]]: templateGuids[2],
            [guids[2]]: templateGuids[3]
        };

        expected.entities[guids[3]] = child2.json();
        expected.entities[guids[3]].resource_id = guids[3];
        expected.entities[guids[3]].parent = guids[1];
        expected.entities[guids[3]].template_ent_ids = {
            [guids[3]]: templateGuids[2],
            [guids[2]]: templateGuids[3]
        };

        expect(data.get('data')).to.equal(JSON.stringify(expected));
    });

    it('creates script asset', async function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.branchId = 'branch';
        api.globals.projectId = 1;

        const folder = new api.Asset({ id: 10 });
        api.globals.assets.createScript({
            filename: 'name.js',
            folder: folder
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].requestBody instanceof FormData).to.equal(true);
        const data = requests[0].requestBody;
        expect(data.get('branchId')).to.equal('branch');
        expect(data.get('projectId')).to.equal('1');
        expect(data.get('filename')).to.equal('name.js');
        expect(data.get('type')).to.equal('script');
        expect(data.get('name')).to.equal('name.js');
        expect(data.get('parent')).to.equal('10');
        expect(data.get('preload')).to.equal('true');
        expect(data.get('file') instanceof Blob).to.equal(true);
        expect(await data.get('file').text()).to.equal(boilerplate('Name', 'name'));
        expect(data.get('data')).to.equal(JSON.stringify({
            scripts: {},
            loading: false,
            loadingType: 0
        }));

    });

    it('creates valid script names', async function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        // row format is desired name, expected class name, expected script name
        const names = [
            'name-1.js', 'Name1', 'name1',
            'name-$.js', 'Script', 'name$',
            'name.js.js', 'NameJs', 'nameJs',
            'NameName.js', 'NameName', 'nameName'
        ];

        for (let i = 0; i < names.length; i += 3) {
            api.globals.assets.createScript({
                filename: names[i]
            });

            const request = requests[i / 3];
            expect(request.requestBody instanceof FormData).to.equal(true);
            const data = request.requestBody;
            expect(await data.get('file').text()).to.equal(boilerplate(names[i + 1], names[i + 2])); // eslint-disable-line no-await-in-loop
        }

    });

    it('deletes assets', async function () {
        sandbox.stub(window, 'fetch').resolves({ ok: true });
        const asset = new api.Asset({
            id: 1,
            type: 'material'
        });
        api.globals.assets.add(asset);
        expect(api.globals.assets.list()).to.deep.equal([asset]);

        api.globals.branchId = 'branch';
        await api.globals.assets.delete([asset]);

        const fetchArgs = window.fetch.getCall(0).args;
        expect(fetchArgs[0]).to.equal('/api/assets');
        expect(fetchArgs[1].method).to.equal('DELETE');
        expect(fetchArgs[1].headers).to.deep.equal({
            'Content-Type': 'application/json'
        });
        const data = JSON.parse(fetchArgs[1].body);
        expect(data.assets).to.deep.equal([1]);
        expect(data.branchId).to.equal('branch');

        expect(api.globals.assets.list()).to.deep.equal([]);
    });

    it('instantiateTemplates returns new entities', async function () {
        const asset = new api.Asset({
            id: 1,
            type: 'template'
        });
        api.globals.assets.add(asset);

        api.globals.entities = new api.Entities();
        api.globals.jobs = new api.Jobs();
        api.globals.realtime = new api.Realtime();
        api.globals.history = new api.History();

        let newEntity;

        sandbox.stub(api.globals, 'messenger').value({
            on: (name, fn) => {
                setTimeout(() => {
                    newEntity = api.globals.entities.create();
                    fn({
                        status: 'success',
                        job_id: Object.keys(api.globals.jobs._jobsInProgress)[0],
                        multTaskResults: [{
                            newRootId: newEntity.get('resource_id')
                        }]
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

        const root = api.globals.entities.create();

        const entities = await api.globals.assets.instantiateTemplates([asset], root);
        expect(entities).to.deep.equal([newEntity]);

        // test undo
        await api.globals.history.undo();
        expect(newEntity.latest()).to.equal(null);

        // test redo
        const promise = new Promise(resolve => {
            api.globals.entities.on('add', e => {
                resolve(e);
            });
        });

        await api.globals.history.redo();

        const redoEntity = await promise;
        expect(redoEntity).to.not.equal(null);
    });
});
