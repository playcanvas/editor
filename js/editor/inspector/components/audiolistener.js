Object.assign(pcui, (function () {
    'use strict';

    const ATTRIBUTES = [];

    class AudiolistenerComponentInspector extends pcui.ComponentInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.component = 'audiolistener';

            super(args);

            this._attributesInspector = new pcui.AttributesInspector({
                assets: args.assets,
                history: args.history,
                attributes: ATTRIBUTES,
                templateOverridesInspector: this._templateOverridesInspector
            });
            this.append(this._attributesInspector);
        }

        link(entities) {
            super.link(entities);
            this._attributesInspector.link(entities);
        }

        unlink() {
            super.unlink();
            this._attributesInspector.unlink();
        }
    }

    return {
        AudiolistenerComponentInspector: AudiolistenerComponentInspector
    };
})());
