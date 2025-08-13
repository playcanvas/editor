import { ComponentInspector } from './component.ts';
import { TONEMAPPING } from '../../../core/constants.ts';
import type { Attribute, Divider } from '../attribute.type.d.ts';
import { AttributesInspector } from '../attributes-inspector.ts';


/**
 * @type {(Attribute | Divider)[]}
 */
const ATTRIBUTES = [{
    label: 'Clear Color Buffer',
    path: 'components.camera.clearColorBuffer',
    reference: 'camera:clearColorBuffer',
    type: 'boolean'
}, {
    label: 'Clear Depth Buffer',
    path: 'components.camera.clearDepthBuffer',
    reference: 'camera:clearDepthBuffer',
    type: 'boolean'
}, {
    label: 'Clear Color',
    path: 'components.camera.clearColor',
    reference: 'camera:clearColor',
    type: 'rgba'
}, {
    label: 'Depth Grabpass',
    path: 'components.camera.renderSceneDepthMap',
    reference: 'camera:renderSceneDepthMap',
    type: 'boolean'
}, {
    label: 'Color Grabpass',
    path: 'components.camera.renderSceneColorMap',
    reference: 'camera:renderSceneColorMap',
    type: 'boolean'
}, {
    label: 'Projection',
    path: 'components.camera.projection',
    reference: 'camera:projection',
    type: 'select',
    args: {
        type: 'number',
        options: [{
            v: 0, t: 'Perspective'
        }, {
            v: 1, t: 'Orthographic'
        }]
    }
}, {
    label: 'Frustum Culling',
    path: 'components.camera.frustumCulling',
    reference: 'camera:frustumCulling',
    type: 'boolean'
}, {
    label: 'Field Of View',
    path: 'components.camera.fov',
    reference: 'camera:fov',
    type: 'slider',
    args: {
        min: 0,
        sliderMax: 90,
        precision: 2,
        step: 1,
        placeholder: '\u00B0'
    }
}, {
    label: 'Ortho Height',
    path: 'components.camera.orthoHeight',
    reference: 'camera:orthoHeight',
    type: 'number'
}, {
    label: 'Near Clip',
    path: 'components.camera.nearClip',
    reference: 'camera:nearClip',
    type: 'number',
    args: {
        precision: 4,
        step: 0.1,
        min: 0
    }
}, {
    label: 'Far Clip',
    path: 'components.camera.farClip',
    reference: 'camera:farClip',
    type: 'number',
    args: {
        precision: 4,
        step: 0.1,
        min: 0
    }
}, {
    label: 'Priority',
    path: 'components.camera.priority',
    reference: 'camera:priority',
    type: 'number',
    args: {
        min: 0,
        precision: 1,
        step: 1
    }
}, {
    label: 'Viewport',
    path: 'components.camera.rect',
    reference: 'camera:rect',
    type: 'vec4',
    args: {
        precision: 3,
        step: 0.01,
        min: 0,
        max: 1,
        placeholder: ['X', 'Y', 'W', 'H']
    }
}, {
    label: 'Layers',
    path: 'components.camera.layers',
    reference: 'camera:layers',
    type: 'layers'
}, {
    alias: 'divider:0',
    type: 'divider'
}, {
    label: 'Tonemapping',
    path: 'components.camera.toneMapping',
    reference: 'camera:toneMapping',
    type: 'select',
    args: {
        type: 'number',
        options: TONEMAPPING.map((v, i) => {
            return {
                v: i,
                t: v
            };
        })
    }
}, {
    label: 'Gamma',
    path: 'components.camera.gammaCorrection',
    reference: 'camera:gammaCorrection',
    type: 'select',
    args: {
        type: 'number',
        options: [
            {
                v: 0,
                t: '1.0'
            },
            {
                v: 1,
                t: '2.2'
            }
        ]
    }
}];

class CameraComponentInspector extends ComponentInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.component = 'camera';

        super(args);

        this._attributesInspector = new AttributesInspector({
            assets: args.assets,
            projectSettings: args.projectSettings,
            history: args.history,
            attributes: ATTRIBUTES,
            templateOverridesInspector: this._templateOverridesInspector
        });
        this.append(this._attributesInspector);

        ['clearColorBuffer', 'projection'].forEach((field) => {
            this._field(field).on('change', this._toggleFields.bind(this));
        });

        this._suppressToggleFields = false;

        this._attributesInspector.getField('divider:0').hidden = !editor.projectEngineV2;
        this._field('toneMapping').parent.hidden = !editor.projectEngineV2;
        this._field('gammaCorrection').parent.hidden = !editor.projectEngineV2;
    }

    _field(name) {
        return this._attributesInspector.getField(`components.camera.${name}`);
    }

    _toggleFields() {
        if (this._suppressToggleFields) {
            return;
        }

        const fieldColorBuffer = this._field('clearColorBuffer');
        const fieldProjection = this._field('projection');
        this._field('clearColor').parent.hidden = !fieldColorBuffer.value;
        this._field('fov').parent.hidden = fieldProjection.value !== 0;
        this._field('orthoHeight').parent.hidden = fieldProjection.value !== 1;
    }

    link(entities) {
        super.link(entities);
        this._suppressToggleFields = true;
        this._attributesInspector.link(entities);
        this._suppressToggleFields = false;
        this._toggleFields();
    }

    unlink() {
        super.unlink();
        this._attributesInspector.unlink();
    }
}

export { CameraComponentInspector };
