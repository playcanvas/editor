const object = (properties, data = {}) => ({
    type: 'object',
    properties,
    additionalProperties: false,
    ...data
});

const array = (items, data = {}) => ({ type: 'array', items, ...data });

const map = (additionalProperties, data = {}) => ({
    type: 'object',
    additionalProperties,
    'x-open-map': true,
    ...data
});

const nullable = (field, data = {}) => ({
    anyOf: [field, { type: 'null' }],
    ...data
});

const entity = object({
    components: object({
        model: object({
            mapping: nullable(map(nullable({ type: 'number' }, { 'x-editor-type': 'asset' })))
        }),
        testcomponent: object({
            enabled: { type: 'boolean', default: false },
            count: { type: 'number', default: 0 },
            vector: array({ type: 'number' }, { minItems: 3, maxItems: 3, default: [0, 0, 0] }),
            nestedDefault: object(
                { enabled: { type: 'boolean' }, count: { type: 'number' } },
                { default: { enabled: false, count: 0 } }
            ),
            entityRef: nullable(
                { type: 'string' },
                { default: null, 'x-editor-type': 'entity' }
            ),
            entityArrayRef: { type: 'string', default: [], 'x-editor-type': 'array:entity' },
            nestedEntityRef: map(
                object({
                    entity: { type: 'string', 'x-editor-type': 'entity' }
                })
            ),
            assetRef: nullable(
                { type: 'number' },
                { default: null, 'x-editor-type': 'asset' }
            ),
            assetArrayRef: { type: 'string', default: [], 'x-editor-type': 'array:asset' },
            nestedAssetRef: map(
                object({
                    asset: { type: 'number', default: null, 'x-editor-type': 'asset' }
                })
            )
        }),
        script: object({
            enabled: { type: 'boolean', default: true },
            order: array({ type: 'string' }, { default: [] }),
            scripts: map({}, { default: {} })
        }),
        zone: object({ enabled: { type: 'boolean', default: true } })
    })
});

window.schema = {
    version: 1,
    documents: {
        scene: object({
            settings: object({
                physics: object({
                    gravity: array(
                        { type: 'number' },
                        { minItems: 3, maxItems: 3, default: [0, -9.8, 0] }
                    ),
                    enabled: { type: 'boolean', default: false }
                }),
                render: object({
                    fog: { type: 'string', default: 'none' },
                    exposure: { type: 'number', default: 0 }
                })
            }),
            entities: map(entity)
        }),
        settings: object({
            projectFlag: { type: 'boolean', default: false, 'x-scope': 'project' },
            userCount: { type: 'number', default: 0, 'x-scope': 'user' },
            nested: object({
                projectUserValue: { type: 'string', default: '', 'x-scope': 'projectUser' }
            })
        }),
        asset: object({
            type: { type: 'string', enum: ['material', 'model', 'font', 'test'] }
        })
    },
    assetData: {
        animstategraph: object({ testData: { type: 'number', default: 0 } }),
        material: object({
            diffuse: array({ type: 'number' }, { default: [0, 0, 0] }),
            opacity: { type: 'number', default: 1 },
            useLighting: { type: 'boolean', default: false },
            blendType: { type: 'number', default: 0 }
        }),
        model: object({
            mapping: array(
                object({ material: { type: 'number', 'x-editor-type': 'asset' } }),
                { 'x-merge-method': 'stop_and_report_conflict' }
            )
        }),
        font: object({ kerning: map(false) }),
        test: object({
            assetRef: { type: 'number', default: null, 'x-editor-type': 'asset' },
            assetArrayRef: array(
                { type: 'number', 'x-editor-type': 'asset' },
                { default: [], 'x-editor-type': 'array:asset' }
            ),
            nestedAssetRef: map(
                object({
                    asset: { type: 'number', default: null, 'x-editor-type': 'asset' }
                })
            )
        })
    }
};
