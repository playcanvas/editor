describe('Asset API tests', function () {
    beforeEach(function () {
        api.globals.assets = new api.Assets();
        api.globals.history = new api.History();
    });

    afterEach(function () {
        api.globals.entities = null;
        api.globals.history = null;
        api.globals.assets = null;
        api.globals.schema = null;
        api.globals.realtime = null;
        api.globals.settings = null;
    });

    it('replace replaces component references', async function () {
        api.globals.entities = new api.Entities();
        api.globals.schema = new api.Schema(schema);

        const asset = new api.Asset({ id: 1, type: 'material' });
        api.globals.assets.add(asset);

        const asset2 = new api.Asset({ id: 2, type: 'material' });
        api.globals.assets.add(asset2);

        const e = api.globals.entities.create();
        e.addComponent('testcomponent', {
            assetRef: 1,
            assetArrayRef: [1],
            nestedAssetRef: {
                'key': {
                    asset: 1
                }
            }
        });

        asset.replace(asset2);

        expect(e.get('components.testcomponent.assetRef')).to.equal(2);
        expect(e.get('components.testcomponent.assetArrayRef')).to.deep.equal([2]);
        expect(e.get('components.testcomponent.nestedAssetRef.key.asset')).to.equal(2);

        // undo
        await api.globals.history.undo();

        expect(e.get('components.testcomponent.assetRef')).to.equal(1);
        expect(e.get('components.testcomponent.assetArrayRef')).to.deep.equal([1]);
        expect(e.get('components.testcomponent.nestedAssetRef.key.asset')).to.equal(1);

        // redo
        await api.globals.history.redo();

        expect(e.get('components.testcomponent.assetRef')).to.equal(2);
        expect(e.get('components.testcomponent.assetArrayRef')).to.deep.equal([2]);
        expect(e.get('components.testcomponent.nestedAssetRef.key.asset')).to.equal(2);
    });

    it('replace replaces asset references', async function () {
        api.globals.schema = new api.Schema(schema);

        const asset = new api.Asset({ id: 1, type: 'test' });
        api.globals.assets.add(asset);

        asset.set('i18n', {
            en: 1
        });

        asset.set('data', {
            assetRef: 1,
            assetArrayRef: [1, 3],
            nestedAssetRef: {
                'key': {
                    asset: 1
                },
                'key2': {
                    asset: 3
                }
            }
        });

        const asset2 = new api.Asset({ id: 2, type: 'material' });
        api.globals.assets.add(asset2);

        asset.replace(asset2);

        expect(asset.get('data.assetRef')).to.equal(2);
        expect(asset.get('data.assetArrayRef')).to.deep.equal([2, 3]);
        expect(asset.get('data.nestedAssetRef.key.asset')).to.equal(2);
        expect(asset.get('i18n.en')).to.equal(2);

        // undo
        await api.globals.history.undo();
        expect(asset.get('data.assetRef')).to.equal(1);
        expect(asset.get('data.assetArrayRef')).to.deep.equal([1, 3]);
        expect(asset.get('data.nestedAssetRef.key.asset')).to.equal(1);
        expect(asset.get('i18n.en')).to.equal(1);

        // redo
        await api.globals.history.redo();
        expect(asset.get('data.assetRef')).to.equal(2);
        expect(asset.get('data.assetArrayRef')).to.deep.equal([2, 3]);
        expect(asset.get('data.nestedAssetRef.key.asset')).to.equal(2);
        expect(asset.get('i18n.en')).to.equal(2);
    });

    it('replace replaces script attributes', async function () {
        api.globals.entities = new api.Entities();
        api.globals.schema = new api.Schema(schema);

        const asset = new api.Asset({ id: 1, type: 'material' });
        api.globals.assets.add(asset);

        const asset2 = new api.Asset({ id: 2, type: 'material' });
        api.globals.assets.add(asset2);

        const script = new api.Asset({ id: 3, type: 'script' });
        api.globals.assets.add(script);
        script.set('data', {
            scripts: {
                test: {
                    attributes: {
                        assetRef: {
                            type: 'asset'
                        },
                        assetArrayRef: {
                            type: 'asset',
                            array: true
                        },
                        json: {
                            type: 'json',
                            schema: [{
                                name: 'assetRef',
                                type: 'asset'
                            }, {
                                name: 'assetArrayRef',
                                type: 'asset',
                                array: true
                            }]
                        },
                        jsonArray: {
                            type: 'json',
                            array: true,
                            schema: [{
                                name: 'assetRef',
                                type: 'asset'
                            }, {
                                name: 'assetArrayRef',
                                type: 'asset',
                                array: true
                            }]
                        }
                    }
                }
            }
        });

        const e = api.globals.entities.create();
        e.addComponent('script', {
            order: ['test'],
            scripts: {
                test: {
                    attributes: {
                        assetRef: 1,
                        assetArrayRef: [1],
                        json: {
                            assetRef: 1,
                            assetArrayRef: [1]
                        },
                        jsonArray: [{
                            assetRef: 1,
                            assetArrayRef: [1]
                        }]
                    }
                }
            }
        });

        asset.replace(asset2);

        expect(e.get('components.script.scripts.test.attributes.assetRef')).to.equal(2);
        expect(e.get('components.script.scripts.test.attributes.assetArrayRef')).to.deep.equal([2]);
        expect(e.get('components.script.scripts.test.attributes.json.assetRef')).to.equal(2);
        expect(e.get('components.script.scripts.test.attributes.json.assetArrayRef')).to.deep.equal([2]);
        expect(e.get('components.script.scripts.test.attributes.jsonArray.0.assetRef')).to.equal(2);
        expect(e.get('components.script.scripts.test.attributes.jsonArray.0.assetArrayRef')).to.deep.equal([2]);

        // undo
        await api.globals.history.undo();
        expect(e.get('components.script.scripts.test.attributes.assetRef')).to.equal(1);
        expect(e.get('components.script.scripts.test.attributes.assetArrayRef')).to.deep.equal([1]);
        expect(e.get('components.script.scripts.test.attributes.json.assetRef')).to.equal(1);
        expect(e.get('components.script.scripts.test.attributes.json.assetArrayRef')).to.deep.equal([1]);
        expect(e.get('components.script.scripts.test.attributes.jsonArray.0.assetRef')).to.equal(1);
        expect(e.get('components.script.scripts.test.attributes.jsonArray.0.assetArrayRef')).to.deep.equal([1]);

        // redo
        await api.globals.history.redo();
        expect(e.get('components.script.scripts.test.attributes.assetRef')).to.equal(2);
        expect(e.get('components.script.scripts.test.attributes.assetArrayRef')).to.deep.equal([2]);
        expect(e.get('components.script.scripts.test.attributes.json.assetRef')).to.equal(2);
        expect(e.get('components.script.scripts.test.attributes.json.assetArrayRef')).to.deep.equal([2]);
        expect(e.get('components.script.scripts.test.attributes.jsonArray.0.assetRef')).to.equal(2);
        expect(e.get('components.script.scripts.test.attributes.jsonArray.0.assetArrayRef')).to.deep.equal([2]);
    });

    it('replace model mapping updates meta.userMapping', async function () {
        api.globals.schema = new api.Schema(schema);

        const model = new api.Asset({ id: 1, type: 'model' });
        api.globals.assets.add(model);

        model.set('data', {
            mapping: [{
                material: 1
            }]
        });

        const model2 = new api.Asset({ id: 3, type: 'model' });
        api.globals.assets.add(model2);

        model2.set('data', {
            mapping: [{
                material: 1
            }]
        });
        model2.set('meta', {});

        const asset2 = new api.Asset({ id: 2, type: 'material' });
        api.globals.assets.add(asset2);

        model.replace(asset2);

        expect(model.get('meta')).to.deep.equal({ userMapping: { '0': true } });
        expect(model2.get('meta')).to.deep.equal({ userMapping: { '0': true } });

        // undo
        await api.globals.history.undo();

        expect(model.get('meta')).to.deep.equal({});
        expect(model2.get('meta')).to.deep.equal({});

        // redo
        await api.globals.history.redo();

        expect(model.get('meta')).to.deep.equal({ userMapping: { '0': true } });
        expect(model2.get('meta')).to.deep.equal({ userMapping: { '0': true } });
    });

    it('replace replaces skybox in scene settings', async function () {
        api.globals.realtime = new api.Realtime();
        api.globals.settings = new api.Settings();
        api.globals.schema = new api.Schema(schema);

        const asset = new api.Asset({ id: 1, type: 'cubemap' });
        api.globals.assets.add(asset);

        const asset2 = new api.Asset({ id: 2, type: 'cubemap' });
        api.globals.assets.add(asset2);

        api.globals.settings.scene.set('render.skybox', 1);

        asset.replace(asset2);

        expect(api.globals.settings.scene.get('render.skybox')).to.equal(2);

        // undo
        await api.globals.history.undo();
        expect(api.globals.settings.scene.get('render.skybox')).to.equal(1);

        // redo
        await api.globals.history.redo();
        expect(api.globals.settings.scene.get('render.skybox')).to.equal(2);

        // check unrelated skybox is not updated
        api.globals.settings.scene.set('render.skybox', 3);
        asset.replace(asset2);
        expect(api.globals.settings.scene.get('render.skybox')).to.equal(3);
    });
});
