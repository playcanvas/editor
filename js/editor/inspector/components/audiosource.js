import { AttributesInspector } from '../attributes.js';
import { ComponentInspector } from './component.js';

const ATTRIBUTES = [{
    label: 'Assets',
    path: 'components.audiosource.assets',
    type: 'assets',
    args: {
        assetType: 'audio'
    }
}, {
    label: 'Activate',
    path: 'components.audiosource.activate',
    type: 'boolean'
}, {
    label: 'Loop',
    path: 'components.audiosource.loop',
    type: 'boolean'
}, {
    label: '3D',
    path: 'components.audiosource.3d',
    type: 'boolean'
}, {
    label: 'Volume',
    path: 'components.audiosource.volume',
    type: 'slider',
    args: {
        precision: 2,
        min: 0,
        max: 1,
        step: 0.01
    }
}, {
    label: 'Pitch',
    path: 'components.audiosource.pitch',
    type: 'slider',
    args: {
        precision: 2,
        min: 0,
        step: 0.1
    }
}, {
    label: 'Min Distance',
    path: 'components.audiosource.minDistance',
    type: 'number',
    args: {
        precision: 2,
        min: 0,
        step: 1
    }
}, {
    label: 'Max Distance',
    path: 'components.audiosource.maxDistance',
    type: 'number',
    args: {
        precision: 2,
        min: 0,
        step: 1
    }
}, {
    label: 'Roll-off Factor',
    path: 'components.audiosource.rollOffFactor',
    type: 'number',
    args: {
        precision: 2,
        step: 0.1,
        min: 0
    }
}];

ATTRIBUTES.forEach((attr) => {
    if (!attr.path) return;
    const parts = attr.path.split('.');
    attr.reference = `audiosource:${parts[parts.length - 1]}`;
});

class AudiosourceComponentInspector extends ComponentInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.component = 'audiosource';

        super(args);

        this._attributesInspector = new AttributesInspector({
            assets: args.assets,
            history: args.history,
            attributes: ATTRIBUTES,
            templateOverridesInspector: this._templateOverridesInspector
        });
        this.append(this._attributesInspector);

        this._field('3d').on('change', this._toggleFields.bind(this));

        this._skipToggleFields = false;
    }

    _field(name) {
        return this._attributesInspector.getField(`components.audiosource.${name}`);
    }

    _toggleFields() {
        if (this._skipToggleFields) return;

        const is3d = this._field('3d').value === true;

        this._field('minDistance').parent.hidden = !is3d;
        this._field('maxDistance').parent.hidden = !is3d;
        this._field('rollOffFactor').parent.hidden = !is3d;
    }

    link(entities) {
        super.link(entities);

        this._skipToggleFields = true;
        this._attributesInspector.link(entities);
        this._skipToggleFields = false;
        this._toggleFields();
    }

    unlink() {
        super.unlink();
        this._attributesInspector.unlink();
    }
}

export { AudiosourceComponentInspector };
