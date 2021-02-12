Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ANIMSTATEGRAPH = 'asset-animstategraph-inspector';

    const DOM = (parent) => [
        {
            layersPanel: new pcui.AnimstategraphLayers(parent, {
                headerText: 'LAYERS',
                collapsible: true
            })
        },
        {
            parametersPanel: new pcui.AnimstategraphParameters({
                headerText: 'PARAMETERS',
                collapsible: true
            })
        }
    ];

    class AnimstategraphAssetInspector extends pcui.Container {
        constructor(args) {
            args = Object.assign({
                class: CLASS_ANIMSTATEGRAPH
            }, args);
            super(args);
            this._args = args;
            this._assets = null;
            this._view = new pcui.AnimstategraphView(this, args);
            this.history = args.history;

            this.buildDom(DOM(this));

            this._stateContainer = new pcui.AnimstategraphState(args, this._view);
            args.inspectorPanelSecondary.append(this._stateContainer);
            this._transitionsContainer = new pcui.AnimstategraphTransitions(args, this._view);
            args.inspectorPanelSecondary.append(this._transitionsContainer);
        }

        link(assets) {
            this.unlink();
            if (assets.length > 1) return;
            this._assets = assets;

            this._selectedLayer = 0;

            this._view.link(this._assets, this._selectedLayer);
            this._layersPanel.link(this._assets);
            this._parametersPanel.link(this._assets);
            this._stateContainer.hidden = true;

            this._assetEvents = [];
            this._assetEvents.push(
                this._assets[0].on('data.layers:set', () => {
                    this._layersPanel.link(this._assets);
                })
            );
            this.parent.emit('fullscreenMode:on');
        }

        unlink() {
            if (this._assets) {
                super.unlink();
                this._view.unlink();
                this._stateContainer.unlink();
                this._transitionsContainer.unlink();
                this._layersPanel.unlink();
                this._parametersPanel.unlink();
                this.parent.emit('fullscreenMode:off');
                if (this._assetEvents) {
                    this._assetEvents.forEach(evt => {
                        evt.unbind();
                    });
                    this._assetEvents = [];
                }
                this._assets = null;
            }
        }
    }

    return {
        AnimstategraphAssetInspector: AnimstategraphAssetInspector
    };
})());
