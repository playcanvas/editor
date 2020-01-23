Object.assign(pcui, (function () {
    'use strict';

    const ATTRIBUTES = [{
        label: 'Duration',
        path: 'meta.duration',
        type: 'label',
        args: {
            placeholder: 'Seconds'
        }
    },
    {
        label: 'Name',
        path: 'meta.name',
        type: 'label'
    }];

    class AnimationAssetInspector extends pcui.Panel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'ANIMATION';

            super(args);

            this._attributesInspector = new pcui.AttributesInspector({
                assets: args.assets,
                history: args.history,
                attributes: ATTRIBUTES,
                templateOverridesSidebar: this._templateOverridesSidebar
            });
            this.append(this._attributesInspector);
        }

        link(assets) {
            this.unlink();
            this._attributesInspector.link(assets);
        }

        unlink() {
            this._attributesInspector.unlink();
        }
    }

    return {
        AnimationAssetInspector: AnimationAssetInspector
    };
})());
