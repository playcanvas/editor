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
        api.globals.apiUrl = '';
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

    it('replace updates model material mappings', function () {
        api.globals.schema = new api.Schema(schema);
        api.globals.entities = new api.Entities();
        const root = api.globals.entities.create();
        const entity = api.globals.entities.create({ parent: root });
        entity.addComponent('model', { mapping: { 0: 1 } });

        const oldAsset = new api.Asset({ type: 'material', id: 1 });
        const newAsset = new api.Asset({ type: 'material', id: 2 });
        assets.add(oldAsset);
        assets.add(newAsset);
        oldAsset.replace(newAsset, { history: false });

        expect(entity.get('components.model.mapping.0')).to.equal(2);
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
        expect(data.get('filename')).to.equal('name');
        expect(data.get('file') instanceof Blob).to.equal(true);
        expect(await data.get('file').text()).to.equal('text');
        expect(data.get('type')).to.equal('css');
        expect(data.get('name')).to.equal('name');
        expect(data.get('parent')).to.equal('10');
        expect(data.get('preload')).to.equal('true');
    });

    it('uses default name new.css when none supplied', function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.branchId = 'branch';
        api.globals.projectId = 1;

        api.globals.assets.createCss({});

        expect(requests.length).to.equal(1);
        const data = requests[0].requestBody;
        expect(data.get('name')).to.equal('new.css');
        expect(data.get('filename')).to.equal('new.css');
    });

    it('suffixes css name when sibling exists', function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };

        api.globals.branchId = 'branch';
        api.globals.projectId = 1;

        const folder = new api.Asset({ id: 10 });
        const sibling = new api.Asset({ id: 11, type: 'css', name: 'new.css', path: [10] });
        api.globals.assets.add(folder);
        api.globals.assets.add(sibling);

        api.globals.assets.createCss({ folder });

        expect(requests.length).to.equal(1);
        const data = requests[0].requestBody;
        expect(data.get('name')).to.equal('new (1).css');
        expect(data.get('filename')).to.equal('new (1).css');
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
        expect(data.get('filename')).to.equal('name');
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
        expect(data.get('filename')).to.equal('name');
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
        expect(data.get('filename')).to.equal('name');
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
            folder: folder,
            data: {
                opacity: 0
            }
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
            diffuse: [0, 0, 0],
            opacity: 0,
            useLighting: false,
            blendType: 0
        }));
    });

    it('serializes scene import pipeline options', function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };
        api.globals.branchId = 'branch';
        api.globals.projectId = 1;

        new api.Rest().assets.assetCreate(
            { type: 'scene', name: 'model.glb' },
            { meshCompression: 'draco', useUniqueIndices: false }
        );

        expect(requests.length).to.equal(1);
        const data = requests[0].requestBody;
        expect(data.get('meshCompression')).to.equal('draco');
        expect(data.get('useUniqueIndices')).to.equal('false');
    });

    it('clones a user asset through the assets route', function () {
        const xhr = sandbox.useFakeXMLHttpRequest();
        const requests = [];
        xhr.onCreate = (fake) => {
            requests.push(fake);
        };
        api.globals.apiUrl = '/api';

        new api.Rest().assets.assetClone('9', {
            scope: { type: 'project', id: 1 },
            targetFolderId: 10
        });

        expect(requests.length).to.equal(1);
        expect(requests[0].method).to.equal('POST');
        expect(requests[0].url).to.equal('/api/assets/9/clone');
        expect(JSON.parse(requests[0].requestBody)).to.deep.equal({
            scope: { type: 'project', id: 1 },
            targetFolderId: 10
        });
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
        expect(data.get('filename')).to.equal('name');
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
        expect(data.get('filename')).to.equal('name');
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

        const entities = Object.values(JSON.parse(data.get('data')).entities);
        for (const entity of entities) {
            for (const field of ['template', 'template_id', 'template_ent_ids']) {
                expect(entity).to.have.own.property(field, null);
            }
        }

        const expected = { entities: {} };

        expected.entities[guids[0]] = root.json();
        expected.entities[guids[0]].resource_id = guids[0];
        expected.entities[guids[0]].children = [guids[1]];

        expected.entities[guids[1]] = child.json();
        expected.entities[guids[1]].resource_id = guids[1];
        expected.entities[guids[1]].parent = guids[0];

        expect(data.get('data')).to.equal(JSON.stringify(expected));
    });

    it('returns the created template asset', async function () {
        api.globals.schema = new api.Schema(schema);
        api.globals.entities = new api.Entities();
        const root = api.globals.entities.create({ name: 'root' });
        const asset = new api.Asset({ id: 1, type: 'template' });
        sandbox.stub(assets, 'upload').resolves(asset);

        expect(await assets.createTemplate({ entity: root })).to.equal(asset);
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
        expected.entities[guids[0]].template_ent_ids = null;

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

    function prepareLocalInstance() {
        const send = sandbox.spy();
        api.globals.schema = new api.Schema(schema);
        api.globals.entities = new api.Entities();
        api.globals.selection = new api.Selection();
        api.globals.history = new api.History();
        api.globals.jobs = new api.Jobs();
        api.globals.messenger = { on: () => {} };
        api.globals.realtime = {
            scenes: { current: { uniqueId: 1, addEntity: () => {}, removeEntity: () => {} } },
            connection: { sendMessage: send }
        };
        return send;
    }

    function makeTemplate(id, entities) {
        const asset = new api.Asset({ id, uniqueId: id, type: 'template', name: `tpl${id}`, data: { entities } });
        api.globals.assets.add(asset);
        return asset;
    }

    // template entity data as createTemplate stores it
    function ent(id, parent, children = [], components = {}) {
        return {
            resource_id: id,
            name: id.toUpperCase(),
            parent,
            children,
            enabled: true,
            tags: [],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            components,
            template: null,
            template_id: null,
            template_ent_ids: null
        };
    }

    // component data with every schema default, as editor entities have
    function full(component, data) {
        return { ...api.globals.schema.components.getDefaultData(component), ...data };
    }

    function smallTemplate() {
        return {
            r: ent('r', null, ['c']),
            c: ent('c', 'r', [], { testcomponent: full('testcomponent', { entityRef: 'r', entityArrayRef: ['r'] }) })
        };
    }

    function bigTemplate(count) {
        const entities = { r: ent('r', null) };
        for (let i = 0; i < count; i++) {
            entities[`e${i}`] = ent(`e${i}`, 'r');
            entities.r.children.push(`e${i}`);
        }
        return entities;
    }

    it('instantiateTemplates builds small templates in the editor', async function () {
        const send = prepareLocalInstance();
        const asset = makeTemplate(1, smallTemplate());
        const root = api.globals.entities.create();

        const [inst] = await api.globals.assets.instantiateTemplates([asset], root);
        const child = inst.children[0];

        expect(send.called).to.equal(false);
        expect(inst.get('name')).to.equal('tpl1');
        expect(inst.get('template_id')).to.equal(1);
        expect(inst.get('parent')).to.equal(root.get('resource_id'));
        expect(root.get('children')).to.deep.equal([inst.get('resource_id')]);
        expect(inst.get(`template_ent_ids.${child.get('resource_id')}`)).to.equal('c');
        expect(child.get('components.testcomponent.entityRef')).to.equal(inst.get('resource_id'));
    });

    it('instantiateTemplates keeps instance components identical to the template', async function () {
        prepareLocalInstance();
        const asset = makeTemplate(1, smallTemplate());
        const root = api.globals.entities.create();

        const [inst] = await api.globals.assets.instantiateTemplates([asset], root);

        // like the pipeline, only top-level fields typed entity are remapped
        expect(inst.children[0].get('components.testcomponent')).to.deep.equal(full('testcomponent', {
            entityRef: inst.get('resource_id'),
            entityArrayRef: ['r']
        }));
        expect(asset.get('data.entities.c.resource_id')).to.equal('c');
        expect(asset.get('data.entities.c.components.testcomponent.entityRef')).to.equal('r');
    });

    it('instantiateTemplates inserts at index 0 without an index, like the backend', async function () {
        prepareLocalInstance();
        const a = makeTemplate(1, smallTemplate());
        const b = makeTemplate(2, smallTemplate());
        const root = api.globals.entities.create();
        const existing = api.globals.entities.create({ parent: root });

        const [i1, i2] = await api.globals.assets.instantiateTemplates([a, b], root);

        expect(root.get('children')).to.deep.equal([
            i1.get('resource_id'),
            i2.get('resource_id'),
            existing.get('resource_id')
        ]);
    });

    it('instantiateTemplates honours the index', async function () {
        prepareLocalInstance();
        const asset = makeTemplate(1, smallTemplate());
        const root = api.globals.entities.create();
        const existing = api.globals.entities.create({ parent: root });

        const [inst] = await api.globals.assets.instantiateTemplates([asset], root, { index: 1 });

        expect(root.get('children')).to.deep.equal([existing.get('resource_id'), inst.get('resource_id')]);
    });

    it('instantiateTemplates selects local instances when asked', async function () {
        prepareLocalInstance();
        const asset = makeTemplate(1, smallTemplate());
        const root = api.globals.entities.create();

        const [inst] = await api.globals.assets.instantiateTemplates([asset], root, { select: true });

        expect(api.globals.selection.items.length).to.equal(1);
        expect(api.globals.selection.items[0]).to.equal(inst);
    });

    it('instantiateTemplates undo removes and redo restores the same local instance', async function () {
        prepareLocalInstance();
        const asset = makeTemplate(1, smallTemplate());
        const root = api.globals.entities.create();
        const [inst] = await api.globals.assets.instantiateTemplates([asset], root, { select: true });
        const id = inst.get('resource_id');

        await api.globals.history.undo();
        expect(inst.latest()).to.equal(null);

        await api.globals.history.redo();
        const restored = api.globals.entities.get(id);
        expect(restored).to.be.ok;
        expect(restored.children.length).to.equal(1);
        expect(restored.children[0].get('components.testcomponent.entityRef')).to.equal(id);
        expect(api.globals.selection.items).to.deep.equal([restored]);
    });

    it('instantiateTemplates uses the backend above 500 entities', function () {
        const send = prepareLocalInstance();
        const asset = makeTemplate(1, bigTemplate(500));
        const root = api.globals.entities.create();

        api.globals.assets.instantiateTemplates([asset], root);

        expect(send.calledOnce).to.equal(true);
    });

    it('instantiateTemplates builds 500 entities in the editor', async function () {
        const send = prepareLocalInstance();
        const asset = makeTemplate(1, bigTemplate(499));
        const root = api.globals.entities.create();

        const [inst] = await api.globals.assets.instantiateTemplates([asset], root);

        expect(send.called).to.equal(false);
        expect(inst.children.length).to.equal(499);
    });

    it('instantiateTemplates counts all templates toward the limit', function () {
        const send = prepareLocalInstance();
        const a = makeTemplate(1, bigTemplate(299));
        const b = makeTemplate(2, bigTemplate(299));
        const root = api.globals.entities.create();

        api.globals.assets.instantiateTemplates([a, b], root);

        expect(send.calledOnce).to.equal(true);
    });

    it('instantiateTemplates uses the backend for extraData', function () {
        const send = prepareLocalInstance();
        const root = api.globals.entities.create();

        api.globals.assets.instantiateTemplates([makeTemplate(1, smallTemplate())], root, {
            extraData: { subtreeRootId: 'c' }
        });

        expect(send.calledOnce).to.equal(true);
    });

    it('instantiateTemplates uses the backend for unloaded or rootless templates', function () {
        const send = prepareLocalInstance();
        const root = api.globals.entities.create();

        api.globals.assets.instantiateTemplates([makeTemplate(2, null)], root);
        api.globals.assets.instantiateTemplates([makeTemplate(3, { a: ent('a', 'x') })], root);

        expect(send.callCount).to.equal(2);
    });

    it('instantiateTemplates uses the backend for templates it would not copy exactly', function () {
        const send = prepareLocalInstance();
        const root = api.globals.entities.create();
        const variants = [
            // child missing from the template
            { r: ent('r', null, ['gone']) },
            // unreachable entity
            { r: ent('r', null), a: ent('a', 'b', ['b']), b: ent('b', 'a', ['a']) },
            // child whose parent points elsewhere
            { r: ent('r', null, ['a']), a: ent('a', 'x') },
            // field the Entity constructor drops, and one it fills in
            { r: { ...ent('r', null), legacy: 1 } },
            { r: { ...ent('r', null), tags: undefined } },
            // components the editor would fill with schema defaults
            { r: ent('r', null, [], { testcomponent: { enabled: true } }) },
            { r: ent('r', null, [], { testcomponent: null }) }
        ];

        variants.forEach((v, i) => api.globals.assets.instantiateTemplates([makeTemplate(10 + i, v)], root));

        expect(send.callCount).to.equal(variants.length);
    });

    it('instantiateTemplates uses the backend for an index outside the children', function () {
        const send = prepareLocalInstance();
        const root = api.globals.entities.create();

        api.globals.assets.instantiateTemplates([makeTemplate(1, smallTemplate())], root, { index: 1 });
        api.globals.assets.instantiateTemplates([makeTemplate(2, smallTemplate())], root, { index: -1 });

        expect(send.callCount).to.equal(2);
    });

    it('instantiateTemplates uses the backend when a script it uses is defined by two assets', function () {
        const send = prepareLocalInstance();
        const def = { attributes: { target: { type: 'entity' } } };
        api.globals.assets.add(new api.Asset({ id: 10, type: 'script', data: { scripts: { mover: def } } }));
        api.globals.assets.add(new api.Asset({ id: 11, type: 'script', data: { scripts: { mover: def } } }));
        const script = full('script', { order: ['mover'], scripts: { mover: { enabled: true, attributes: { target: 'r' } } } });
        const asset = makeTemplate(1, { r: ent('r', null, [], { script }) });

        api.globals.assets.instantiateTemplates([asset], api.globals.entities.create());

        expect(send.calledOnce).to.equal(true);
    });

    it('instantiateTemplates remaps script attributes of a script defined once', async function () {
        const send = prepareLocalInstance();
        const def = { attributes: { target: { type: 'entity' }, other: { type: 'entity' } } };
        api.globals.assets.add(new api.Asset({ id: 10, type: 'script', data: { scripts: { mover: def } } }));
        const script = full('script', { order: ['mover'], scripts: { mover: { enabled: true, attributes: { target: 'r', other: 'x' } } } });
        const asset = makeTemplate(1, { r: ent('r', null, [], { script }) });

        const [inst] = await api.globals.assets.instantiateTemplates([asset], api.globals.entities.create());

        expect(send.called).to.equal(false);
        expect(inst.get('components.script.scripts.mover.attributes')).to.deep.equal({ target: inst.get('resource_id'), other: null });
    });
});
