describe('api.Schema tests', function () {
    beforeEach(function () {
        api.globals.schema = null;
    });

    const withSchema = (callback) => {
        api.globals.schema = new api.Schema(schema);
        callback();
    };

    it('components.getFieldsOfType returns fields', function () {
        withSchema(() => {
            const fields = api.globals.schema.components.getFieldsOfType('testcomponent', 'entity');
            expect(fields).to.deep.equal(['entityRef', 'entityArrayRef', 'nestedEntityRef.*.entity']);
            expect(api.globals.schema.components.getFieldsOfType('model', 'asset')).to.deep.equal(['mapping.*']);
        });
    });

    it('components.resolvePath resolves fixed fields and open maps', function () {
        withSchema(() => {
            expect(api.globals.schema.components.resolvePath('testcomponent', 'entityRef')).to.include({
                default: null,
                hasDefault: true,
                open: false,
                optional: false
            });
            expect(api.globals.schema.components.resolvePath('testcomponent', 'nestedEntityRef.item.entity')).to.include({
                hasDefault: false,
                open: false,
                optional: false
            });
            expect(api.globals.schema.components.resolvePath('script', 'scripts.rotate.attributes.speed')).to.include({
                open: true,
                optional: true
            });
            expect(api.globals.schema.components.resolvePath('testcomponent', 'missing')).to.equal(null);
        });
    });

    it('assets.resolvePath resolves fixed fields, arrays and open maps', function () {
        withSchema(() => {
            expect(api.globals.schema.assets.resolvePath('material', 'diffuse')).to.deep.include({
                default: [0, 0, 0],
                hasDefault: true,
                open: false,
                optional: false
            });
            expect(api.globals.schema.assets.resolvePath('model', 'mapping.0.material')).to.include({
                hasDefault: false,
                open: false,
                optional: false
            });
            expect(api.globals.schema.assets.resolvePath('test', 'nestedAssetRef.item.asset')).to.include({
                default: null,
                hasDefault: true,
                open: false,
                optional: false
            });
            expect(api.globals.schema.assets.resolvePath('test', 'nestedAssetRef.item')).to.include({
                hasDefault: false,
                open: true,
                optional: true
            });
            expect(api.globals.schema.assets.resolvePath('model', 'mapping.nope.material')).to.equal(null);
            expect(api.globals.schema.assets.resolvePath('material', 'missing')).to.equal(null);
        });
    });

    it('resolves open maps without value schemas and keeps typed arrays numeric-only', function () {
        withSchema(() => {
            expect(api.globals.schema.assets.resolvePath('font', 'kerning.anyKey')).to.deep.equal({
                field: null,
                default: undefined,
                hasDefault: false,
                open: true,
                optional: true
            });
            expect(api.globals.schema.assets.resolvePath('model', 'mapping.anyKey.material')).to.equal(null);
            expect(api.globals.schema.assets.resolvePath('model', 'mapping.-1.material')).to.equal(null);
        });
    });

    it('only marks the final dynamic map segment as open', function () {
        withSchema(() => {
            const root = api.globals.schema.getDocument('settings');
            expect(api.globals.schema.resolvePath(root, 'batchGroups.group')).to.include({
                hasDefault: false,
                open: true,
                optional: true
            });
            expect(api.globals.schema.resolvePath(root, 'batchGroups.group.maxAabbSize')).to.include({
                default: 100,
                hasDefault: true,
                open: false,
                optional: false
            });
        });
    });

    it('marks only fields omitted from the parent required list as optional', function () {
        withSchema(() => {
            const root = api.globals.schema.getDocument('settings');
            expect(api.globals.schema.resolvePath(root, 'nested.projectUserValue')).to.include({ optional: false });
            expect(api.globals.schema.resolvePath(root, 'nested.optionalValue')).to.include({ optional: true });

            const scene = api.globals.schema.getDocument('scene');
            expect(api.globals.schema.resolvePath(scene, 'entities.item.components.model')).to.include({
                open: false,
                optional: true
            });
        });
    });

    it('preserves falsey and nested defaults', function () {
        withSchema(() => {
            expect(api.globals.schema.assets.getDefaultData('material')).to.deep.equal({
                diffuse: [0, 0, 0],
                opacity: 1,
                useLighting: false,
                blendType: 0
            });
            expect(api.globals.schema.assets.getDefaultData('animstategraph')).to.deep.equal({ testData: 0 });
            expect(api.globals.schema.assets.getDefaultData('missing')).to.equal(null);
            expect(api.globals.schema.components.getDefaultData('testcomponent')).to.deep.equal({
                enabled: false,
                count: 0,
                vector: [0, 0, 0],
                nestedDefault: { enabled: false, count: 0 },
                entityRef: null,
                entityArrayRef: [],
                assetRef: null,
                assetArrayRef: []
            });
        });
    });

    it('preserves scene and scoped settings defaults', function () {
        withSchema(() => {
            expect(api.globals.schema.scene.getDefaultPhysicsSettings()).to.deep.equal({
                gravity: [0, -9.8, 0],
                enabled: false
            });
            expect(api.globals.schema.scene.getDefaultRenderSettings()).to.deep.equal({ fog: 'none', exposure: 0 });
            expect(api.globals.schema.settings.getDefaultProjectSettings()).to.deep.equal({ projectFlag: false });
            expect(api.globals.schema.settings.getDefaultUserSettings()).to.deep.equal({ userCount: 0 });
            expect(api.globals.schema.settings.getDefaultProjectUserSettings()).to.deep.equal({
                nested: { projectUserValue: '' }
            });
        });
    });

    it('preserves types, metadata, lists and reference paths', function () {
        withSchema(() => {
            const vec2 = { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 };
            expect(api.globals.schema.getType(vec2)).to.equal('vec2');
            expect(api.globals.schema.components.list()).to.deep.equal(['model', 'script', 'testcomponent']);
            expect(api.globals.schema.assets.getFieldsOfType('test', 'asset')).to.deep.equal([
                'data.assetRef',
                'data.assetArrayRef',
                'data.nestedAssetRef.*.asset'
            ]);
            expect(api.globals.schema.getAssetTypes()).to.deep.equal(['material', 'model', 'font', 'test']);
            const field = api.globals.schema.assets.resolvePath('model', 'mapping').field;
            expect(field['x-merge-method']).to.equal('stop_and_report_conflict');
        });
    });

    it('preserves the loose caller path separately from typed resolution', function () {
        withSchema(() => {
            const model = api.globals.schema.getAssetData('model');
            expect(api.globals.schema.getTypeForPath(model, 'mapping.anyKey.material', false)).to.equal('asset');
            expect(api.globals.schema.assets.resolvePath('model', 'mapping.anyKey.material')).to.equal(null);
        });
    });

    it('rejects unsupported versioned payloads', function () {
        expect(() => new api.Schema({ documents: {}, assetData: {} })).to.throw(
            'Unsupported Editor schema version: undefined'
        );
        expect(() => new api.Schema({ version: 2, documents: {}, assetData: {} })).to.throw(
            'Unsupported Editor schema version: 2'
        );
        expect(() => new api.Schema({ version: 0, documents: {}, assetData: {} })).to.throw(
            'Unsupported Editor schema version: 0'
        );
        expect(() => new api.Schema({ version: 1 })).to.throw('Unsupported Editor schema version: 1');
    });

    it('getFields sees through a nullability wrapper', function () {
        const schema = new api.Schema({
            version: 1,
            documents: {
                asset: { type: 'object', properties: {} },
                scene: { type: 'object', properties: {} },
                settings: {
                    type: 'object',
                    properties: {
                        editor: {
                            default: null,
                            anyOf: [
                                { type: 'object', properties: { gizmoSize: { type: 'number', default: 1 } } },
                                { type: 'null' }
                            ]
                        }
                    }
                }
            },
            assetData: {}
        });

        const editorField = schema.getDocument('settings').properties.editor;
        expect(Object.keys(schema.getFields(editorField))).to.deep.equal(['gizmoSize']);
    });

    it('getAssetTypes sees through a nullability wrapper', function () {
        const schema = new api.Schema({
            version: 1,
            documents: {
                asset: {
                    type: 'object',
                    properties: { type: { anyOf: [{ type: 'string', enum: ['material', 'texture'] }, { type: 'null' }] } }
                },
                scene: { type: 'object', properties: {} },
                settings: { type: 'object', properties: {} }
            },
            assetData: {}
        });

        expect(schema.getAssetTypes()).to.deep.equal(['material', 'texture']);
    });

    it('getFieldsOfType finds references inside a nullability wrapper', function () {
        const schema = new api.Schema({
            version: 1,
            documents: {
                asset: { type: 'object', properties: {} },
                scene: {
                    type: 'object',
                    properties: {
                        entities: {
                            'x-open-map': true,
                            additionalProperties: {
                                type: 'object',
                                properties: {
                                    components: {
                                        default: null,
                                        anyOf: [
                                            {
                                                type: 'object',
                                                properties: {
                                                    model: {
                                                        type: 'object',
                                                        properties: {
                                                            materialAsset: { type: 'number', 'x-editor-type': 'asset' }
                                                        }
                                                    }
                                                }
                                            },
                                            { type: 'null' }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                settings: { type: 'object', properties: {} }
            },
            assetData: {}
        });

        expect(schema.components.getFieldsOfType('model', 'asset')).to.deep.equal(['materialAsset']);
    });

    it('reads metadata from the inner branch when it is not hoisted', function () {
        const schema = new api.Schema({
            version: 1,
            documents: {
                asset: { type: 'object', properties: {} },
                scene: { type: 'object', properties: {} },
                settings: {
                    type: 'object',
                    properties: {
                        loadingScreenScript: {
                            default: null,
                            anyOf: [{ type: 'string', 'x-scope': 'project' }, { type: 'null' }]
                        }
                    }
                }
            },
            assetData: {}
        });

        const settings = schema.getDocument('settings');
        expect(schema.getScope(settings.properties.loadingScreenScript)).to.equal('project');
        expect(schema.getScopeForPath(settings, 'loadingScreenScript')).to.equal('project');
    });

    it('materializes children even when the container carries a default', function () {
        const schema = new api.Schema({
            version: 1,
            documents: {
                asset: { type: 'object', properties: {} },
                scene: { type: 'object', properties: {} },
                settings: {
                    type: 'object',
                    properties: {
                        editor: {
                            default: null,
                            type: 'object',
                            properties: {
                                gizmoSize: { type: 'number', default: 1, 'x-scope': 'user' },
                                iconSize: { type: 'number', default: 2, 'x-scope': 'user' }
                            }
                        }
                    }
                }
            },
            assetData: {}
        });

        expect(schema.settings.getDefaultUserSettings()).to.deep.equal({
            editor: { gizmoSize: 1, iconSize: 2 }
        });
    });

    it('produces unchanged settings seeds for a container-default-free catalog', function () {
        // the karma fixture has no container defaults, so the merge refactor must
        // reproduce today's per-scope seeds byte-for-byte
        const s = new api.Schema(schema);
        expect(s.settings.getDefaultProjectSettings()).to.deep.equal({ projectFlag: false });
        expect(s.settings.getDefaultUserSettings()).to.deep.equal({ userCount: 0 });
        expect(s.settings.getDefaultProjectUserSettings()).to.deep.equal({ nested: { projectUserValue: '' } });
    });
});
