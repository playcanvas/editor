Object.assign(pcui, (function () {
    'use strict';

    const META_ATTRIBUTES = [{
        label: 'Vertices',
        alias: 'vertices',
        path: 'meta.vertices',
        type: 'label'
    }, {
        label: 'Triangles',
        alias: 'triangles',
        path: 'meta.triangles',
        type: 'label'
    }, {
        label: 'Meshes',
        path: 'meta.meshes',
        type: 'label'
    }, {
        label: 'Skinned',
        path: 'meta.skinned',
        type: 'label'
    }, {
        label: 'Attributes',
        path: 'meta.attributes',
        type: 'label'
    }];

    const ATTRIBUTES = [{
        label: 'Index',
        path: 'data.renderIndex',
        type: 'label',
        reference: 'asset:render:renderIndex'
    }, {
        label: 'Container',
        path: 'data.containerAsset',
        type: 'asset',
        reference: 'asset:render:containerAsset',
        args: {
            readOnly: true,
            assetType: 'container'
        }
    }];


    const DOM = parent => [
        {
            root: {
                metaPanel: new pcui.Panel({
                    headerText: 'META'
                })
            },
            children: [
                {
                    metaAttributesInspector: new pcui.AttributesInspector({
                        assets: parent._args.assets,
                        history: parent._args.history,
                        attributes: META_ATTRIBUTES
                    })
                }
            ]
        },
        {
            root: {
                metaPanel: new pcui.Panel({
                    headerText: 'RENDER'
                })
            },
            children: [
                {
                    attributesInspector: new pcui.AttributesInspector({
                        assets: parent._args.assets,
                        history: parent._args.history,
                        attributes: ATTRIBUTES
                    })
                }
            ]
        }
    ];

    class RenderAssetInspector extends pcui.Container {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'RENDER';

            super(args);
            this._args = args;
            this.buildDom(DOM(this));
        }

        link(assets) {
            this.unlink();
            this._metaAttributesInspector.link(assets);
            this._attributesInspector.link(assets);

            // fill attribute meta
            const metaAttributes = {};
            assets.forEach(asset => {
                const currMetaAttributes = asset.get('meta.attributes');
                if (currMetaAttributes) {
                    Object.assign(metaAttributes, currMetaAttributes);
                }
            });

            const metaAttributesString = Object.keys(metaAttributes).join(', ');
            const metaAttributesField = this._metaAttributesInspector.getField('meta.attributes');
            metaAttributesField.parent.hidden = !metaAttributesString;
            metaAttributesField.style.whiteSpace = 'normal';
            metaAttributesField.values = assets.map(asset => {
                return metaAttributesString;
            });
        }

        unlink() {
            this._attributesInspector.unlink();
            this._metaAttributesInspector.unlink();
        }
    }

    return {
        RenderAssetInspector: RenderAssetInspector
    };
})());
