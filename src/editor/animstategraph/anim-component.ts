import type { Observer, EventHandle } from '@playcanvas/observer';

class AnimstategraphAnimComponent {
    _args: Record<string, unknown>;

    _view: { _selectedLayer: number; link: (assets: Observer[], layer: number) => void };

    _entities: Observer[];

    _asset: Observer | null = null;

    _onSetStateNameEvent: EventHandle | null = null;

    constructor(args: Record<string, unknown>, view: { _selectedLayer: number; link: (assets: Observer[], layer: number) => void }) {
        this._args = args;
        this._view = view;
        this._entities = args.entities as Observer[];
    }

    link(assets: Observer[]) {
        this.unlink();
        this._asset = assets[0];
        this._onSetStateNameEvent = this._asset.on('*:set', (path, value, prevValue) => {
            if (path.includes('data.states.') && path.includes('.name')) {
                const layerName = this._asset.get(`data.layers.${this._view._selectedLayer}.name`);
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

export { AnimstategraphAnimComponent };
