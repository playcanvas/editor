import { InfoBox } from '@playcanvas/pcui';
import { AttributesInspector } from '../attributes.js';
import { ComponentInspector } from './component.js';

const ATTRIBUTES = [{
    label: 'Active',
    path: 'components.button.active',
    type: 'boolean'
}, {
    label: 'Image',
    path: 'components.button.imageEntity',
    type: 'entity'
}, {
    label: 'Hit Padding',
    path: 'components.button.hitPadding',
    type: 'vec4',
    args: {
        placeholder: ['←', '↓', '→', '↑']
    }
}, {
    label: 'Transition Mode',
    path: 'components.button.transitionMode',
    type: 'select',
    args: {
        type: 'number',
        options: [{
            v: BUTTON_TRANSITION_MODE_TINT, t: 'Tint'
        }, {
            v: BUTTON_TRANSITION_MODE_SPRITE_CHANGE, t: 'Sprite Change'
        }]
    }
}, {
    label: 'Hover Tint',
    path: 'components.button.hoverTint',
    type: 'rgba'
}, {
    label: 'Pressed Tint',
    path: 'components.button.pressedTint',
    type: 'rgba'
}, {
    label: 'Inactive Tint',
    path: 'components.button.inactiveTint',
    type: 'rgba'
}, {
    label: 'Fade Duration',
    path: 'components.button.fadeDuration',
    type: 'number'
}, {
    label: 'Hover Sprite',
    path: 'components.button.hoverSpriteAsset',
    type: 'asset',
    args: {
        assetType: 'sprite'
    }
}, {
    label: 'Hover Frame',
    path: 'components.button.hoverSpriteFrame',
    type: 'number',
    args: {
        min: 0,
        precision: 0,
        step: 1
    }
}, {
    label: 'Pressed Sprite',
    path: 'components.button.pressedSpriteAsset',
    type: 'asset',
    args: {
        assetType: 'sprite'
    }
}, {
    label: 'Pressed Frame',
    path: 'components.button.pressedSpriteFrame',
    type: 'number',
    args: {
        min: 0,
        precision: 0,
        step: 1
    }
}, {
    label: 'Inactive Sprite',
    path: 'components.button.inactiveSpriteAsset',
    type: 'asset',
    args: {
        assetType: 'sprite'
    }
}, {
    label: 'Inactive Frame',
    path: 'components.button.inactiveSpriteFrame',
    type: 'number',
    args: {
        min: 0,
        precision: 0,
        step: 1
    }
}];

ATTRIBUTES.forEach((attr) => {
    const parts = attr.path.split('.');
    attr.reference = `button:${parts[parts.length - 1]}`;
});

class ButtonComponentInspector extends ComponentInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.component = 'button';

        super(args);

        this._inputWarning = new InfoBox({
            icon: 'E218',
            title: 'Warning!',
            text: 'This button will not be active as this entity\'s element component does not have input enabled.'
        });
        this.append(this._inputWarning);

        this._evts = [];

        this._attributesInspector = new AttributesInspector({
            assets: args.assets,
            entities: args.entities,
            history: args.history,
            attributes: ATTRIBUTES,
            templateOverridesInspector: this._templateOverridesInspector
        });
        this.append(this._attributesInspector);

        this._field('transitionMode').on('change', this._toggleFields.bind(this));

        this._suppressToggleFields = false;
    }

    _field(name) {
        return this._attributesInspector.getField(`components.button.${name}`);
    }

    _toggleFields() {
        if (this._suppressToggleFields) return;

        const fieldTransitionMode = this._field('transitionMode');
        const isTintMode = (fieldTransitionMode.value === BUTTON_TRANSITION_MODE_TINT);
        const isSpriteChangeMode = (fieldTransitionMode.value === BUTTON_TRANSITION_MODE_SPRITE_CHANGE);

        [
            'hoverTint',
            'pressedTint',
            'inactiveTint',
            'fadeDuration'
        ].forEach((name) => {
            this._field(name).parent.hidden = !isTintMode;
        });

        [
            'hoverSpriteAsset',
            'pressedSpriteAsset',
            'inactiveSpriteAsset'
        ].forEach((name) => {
            this._field(name).hidden = !isSpriteChangeMode;
        });

        [
            'hoverSpriteFrame',
            'pressedSpriteFrame',
            'inactiveSpriteFrame'
        ].forEach((name) => {
            this._field(name).parent.hidden = !isSpriteChangeMode;
        });
    }

    link(entities) {
        super.link(entities);
        this._entities = entities;
        this._suppressToggleFields = true;
        this._attributesInspector.link(entities);
        this._suppressToggleFields = false;

        this._toggleFields();

        const updateInputWarning = () => {
            this._inputWarning.hidden = entities.length !== 1 || entities[0].get('components.element.useInput') || !entities[0].get('components.button.active');
        };
        this._evts.push(entities[0].on('components.element.useInput:set', updateInputWarning));
        this._evts.push(entities[0].on('components.button.active:set', updateInputWarning));
        updateInputWarning();
    }

    unlink() {
        super.unlink();
        if (this._entities) {
            this._attributesInspector.unlink();
            this._evts.forEach(e => e.unbind());
            this._evts = [];
        }
    }
}

export { ButtonComponentInspector };
