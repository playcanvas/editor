import { Button } from '@playcanvas/pcui';

import { ComponentInspector } from './component';
import type { Attribute } from '../attribute.type.d';
import { AttributesInspector } from '../attributes-inspector';


const ATTRIBUTES: Attribute[] = [{
    label: 'Assets',
    path: 'components.animation.assets',
    reference: 'animation:assets',
    type: 'assets',
    args: {
        assetType: 'animation'
    }
}, {
    label: 'Speed',
    path: 'components.animation.speed',
    reference: 'animation:speed',
    type: 'slider',
    args: {
        precision: 3,
        step: 0.1,
        sliderMin: -2,
        sliderMax: 2
    }
}, {
    label: 'Activate',
    path: 'components.animation.activate',
    reference: 'animation:activate',
    type: 'boolean'
}, {
    label: 'Loop',
    path: 'components.animation.loop',
    reference: 'animation:loop',
    type: 'boolean'
}];

const CLASS_BUTTON_PLAY = 'animation-component-inspector-play';

class AnimationComponentInspector extends ComponentInspector {
    constructor(args: Record<string, unknown>) {
        args = Object.assign({}, args);
        args.component = 'animation';

        super(args);

        this._assets = args.assets;

        this._attributesInspector = new AttributesInspector({
            assets: args.assets,
            history: args.history,
            attributes: ATTRIBUTES,
            templateOverridesInspector: this._templateOverridesInspector
        });
        this.append(this._attributesInspector);
    }

    _refreshPlayButtons(entities: import('@playcanvas/observer').Observer[], assetList: { listItems: { assetId: string; element: import('@playcanvas/pcui').Element }[] }) {
        const listItems = assetList.listItems;
        listItems.forEach((item) => {
            this._addPlayButtonForAnimation(entities, item.assetId, item.element);
        });
    }

    _addPlayButtonForAnimation(entities: import('@playcanvas/observer').Observer[], assetId: string, listItem: import('@playcanvas/pcui').Element) {
        // destroy existing button
        const existing = listItem.dom.querySelector(`.${CLASS_BUTTON_PLAY}`);
        if (existing) {
            existing.ui.destroy();
        }

        const label = listItem.dom.querySelector('.pcui-label');
        if (!label) {
            return;
        }

        if (!this._assets.get(assetId)) {
            return;
        }

        const btn = new Button({
            size: 'small',
            icon: 'E131',
            class: CLASS_BUTTON_PLAY
        });

        // play animation on click
        btn.on('click', (evt) => {
            evt.stopPropagation();
            this._playAnimation(entities, assetId);
        });

        listItem.appendAfter(btn, label);
    }

    _playAnimation(entities: import('@playcanvas/observer').Observer[], assetId: string | number) {
        assetId = parseInt(assetId, 10);

        for (let i = 0; i < entities.length; i++) {
            if (!entities[i].entity || !entities[i].entity.animation) {
                continue;
            }

            if (entities[i].entity.animation.assets.indexOf(assetId) === -1) {
                entities[i].entity.animation._stopCurrentAnimation();
                continue;
            }

            const name = entities[i].entity.animation.animationsIndex[assetId];
            if (!name) {
                continue;
            }

            entities[i].entity.animation.play(name);
        }
    }

    _stopAnimation(entities: import('@playcanvas/observer').Observer[]) {
        for (let i = 0; i < entities.length; i++) {
            if (!entities[i].entity || !entities[i].entity.animation) {
                continue;
            }

            entities[i].entity.animation._stopCurrentAnimation();
        }
    }

    link(entities: import('@playcanvas/observer').Observer[]) {
        super.link(entities);

        this._attributesInspector.link(entities);

        const assetList = this._attributesInspector.getField('components.animation.assets');
        this._refreshPlayButtons(entities, assetList);

        // refresh play buttons when animations are added
        assetList.on('change', () => {
            this._refreshPlayButtons(entities, assetList);
        });

        this._stopAnimation(entities);
    }

    unlink() {
        if (this._entities) {
            this._stopAnimation(this._entities);
        }

        super.unlink();
        this._attributesInspector.unlink();
    }
}

export { AnimationComponentInspector };
