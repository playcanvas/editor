import type { Observer, ObserverList, EventHandle } from '@playcanvas/observer';

import type { AnimStateGraphView } from './view';

interface AnimStateGraphAnimComponentArgs {
    entities?: ObserverList;
}

class AnimStateGraphAnimComponent {
    _view: AnimStateGraphView;

    _entities: ObserverList | null;

    _asset: Observer | null = null;

    _onSetStateNameEvent: EventHandle | null = null;

    constructor(args: AnimStateGraphAnimComponentArgs, view: AnimStateGraphView) {
        this._view = view;
        this._entities = args.entities ?? null;
    }

    link(assets: Observer[]) {
        this.unlink();
        this._asset = assets[0];
        this._onSetStateNameEvent = this._asset.on('*:set', (path, value, prevValue) => {
            if (path.includes('data.states.') && path.includes('.name')) {
                const layerName = this._asset.get(`data.layers.${this._view._selectedLayer}.name`);
                this._entities?.forEach((entity) => {
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

export { AnimStateGraphAnimComponent };
