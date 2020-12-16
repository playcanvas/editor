Object.assign(pcui, (function () {
    'use strict';

    const META_ATTRIBUTES = [{
        label: 'Mesh Instances',
        path: 'meta.meshInstances',
        type: 'label'
    }, {
        label: 'Skinned',
        path: 'meta.skinned',
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
