import type { EntityObserver } from '@/editor-api';

import { ComponentInspector, type ComponentInspectorArgs } from './component';
import type { Attribute } from '../attribute.type.d';
import { AttributesInspector } from '../attributes-inspector';


const ATTRIBUTES: Attribute[] = [{
    label: 'Assets',
    path: 'components.audiosource.assets',
    reference: 'audiosource:assets',
    type: 'assets',
    args: {
        assetType: 'audio'
    }
}, {
    label: 'Activate',
    path: 'components.audiosource.activate',
    reference: 'audiosource:activate',
    type: 'boolean'
}, {
    label: 'Loop',
    path: 'components.audiosource.loop',
    reference: 'audiosource:loop',
    type: 'boolean'
}, {
    label: '3D',
    path: 'components.audiosource.3d',
    reference: 'audiosource:3d',
    type: 'boolean'
}, {
    label: 'Volume',
    path: 'components.audiosource.volume',
    reference: 'audiosource:volume',
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
    reference: 'audiosource:pitch',
    type: 'slider',
    args: {
        precision: 2,
        min: 0,
        step: 0.1
    }
}, {
    label: 'Min Distance',
    path: 'components.audiosource.minDistance',
    reference: 'audiosource:minDistance',
    type: 'number',
    args: {
        precision: 2,
        min: 0,
        step: 1
    }
}, {
    label: 'Max Distance',
    path: 'components.audiosource.maxDistance',
    reference: 'audiosource:maxDistance',
    type: 'number',
    args: {
        precision: 2,
        min: 0,
        step: 1
    }
}, {
    label: 'Roll-off Factor',
    path: 'components.audiosource.rollOffFactor',
    reference: 'audiosource:rollOffFactor',
    type: 'number',
    args: {
        precision: 2,
        step: 0.1,
        min: 0
    }
}];

class AudiosourceComponentInspector extends ComponentInspector {
    _suppressToggleFields = false;

    constructor(args: ComponentInspectorArgs) {
        args = Object.assign({}, args);
        args.component = 'audiosource';

        super(args);

        this.headerText += editor.projectEngineV2 ? ' (REMOVED)' : ' (LEGACY)';

        this._attributesInspector = new AttributesInspector({
            assets: args.assets,
            history: args.history,
            attributes: ATTRIBUTES,
            templateOverridesInspector: this._templateOverridesInspector
        });
        this.append(this._attributesInspector);

        this._field('3d').on('change', this._toggleFields.bind(this));

        if (editor.projectEngineV2) {
            this._attributesInspector.enabled = false;
        }
    }

    _toggleFields() {
        if (this._suppressToggleFields) {
            return;
        }

        const is3d = this._field('3d').value === true;

        this._field('minDistance').parent.hidden = !is3d;
        this._field('maxDistance').parent.hidden = !is3d;
        this._field('rollOffFactor').parent.hidden = !is3d;
    }

    link(entities: EntityObserver[]) {
        this._suppressToggleFields = true;
        super.link(entities);
        this._suppressToggleFields = false;
        this._toggleFields();
    }
}

export { AudiosourceComponentInspector };
