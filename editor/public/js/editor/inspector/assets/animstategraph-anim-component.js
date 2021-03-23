Object.assign(pcui, (function () {
    'use strict';

    class AnimstategraphAnimComponent {
        constructor(args, view) {
            this._args = args;
            this._view = view;
            this._entities = args.entities;
            this._asset = null;
        }

        link(assets) {
            this.unlink();
            this._asset = assets[0];
            this._onSetStateNameEvent = this._asset.on('*:set', (path, value, prevValue) => {
                if (path.includes('data.states.') && path.includes(`.name`)) {
                    var layerName = this._asset.get(`data.layers.${this._view._selectedLayer}.name`);
                    this._entities.forEach((entity) => {
                        if (entity.entity.anim && entity.entity.anim.stateGraphAsset && entity.entity.anim.stateGraphAsset === this._asset.get('id')) {
                            const entityHistoryEnabled = entity.history.enabled;
                            entity.history.enabled = false;
                            const animationAssets = entity.get('components.anim.animationAssets');
                            if (animationAssets[`${layerName}:${prevValue}`]) {
                                animationAssets[`${layerName}:${value}`] = animationAssets[`${layerName}:${prevValue}`];
                                delete animationAssets[`${layerName}:${prevValue}`];
                            }
                            entity.set('components.anim.animationAssets', animationAssets);
                            entity.history.enabled = entityHistoryEnabled;
                        }
                    });
                }
            });
        }

        unlink() {
            this._asset = null;
            if (this._onSetStateNameEvent) {
                this._onSetStateNameEvent.unbind();
                this._onSetStateNameEvent = null;
            }
        }
    }

    return {
        AnimstategraphAnimComponent: AnimstategraphAnimComponent
    };
})());
