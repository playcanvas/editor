Object.assign(pcui, (function () {
    'use strict';

    const ATTRIBUTES = [{
        label: 'Clear Color Buffer',
        path: 'components.camera.clearColorBuffer',
        type: 'boolean'
    }, {
        label: 'Clear Depth Buffer',
        path: 'components.camera.clearDepthBuffer',
        type: 'boolean'
    }, {
        label: 'Clear Color',
        path: 'components.camera.clearColor',
        type: 'rgba'
    }, {
        label: 'Depth Grabpass',
        path: 'components.camera.renderSceneDepthMap',
        type: 'boolean'
    }, {
        label: 'Color Grabpass',
        path: 'components.camera.renderSceneColorMap',
        type: 'boolean'
    }, {
        label: 'Projection',
        path: 'components.camera.projection',
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
        type: 'boolean'
    }, {
        label: 'Field Of View',
        path: 'components.camera.fov',
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
        type: 'number'
    }, {
        label: 'Near Clip',
        path: 'components.camera.nearClip',
        type: 'number',
        args: {
            precision: 4,
            step: 0.1,
            min: 0
        }
    }, {
        label: 'Far Clip',
        path: 'components.camera.farClip',
        type: 'number',
        args: {
            precision: 4,
            step: 0.1,
            min: 0
        }
    }, {
        label: 'Priority',
        path: 'components.camera.priority',
        type: 'number',
        args: {
            min: 0,
            precision: 1,
            step: 1
        }
    }, {
        label: 'Viewport',
        path: 'components.camera.rect',
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
        type: 'layers'
    }];

    ATTRIBUTES.forEach((attr) => {
        const parts = attr.path.split('.');
        attr.reference = `camera:${parts[parts.length - 1]}`;
    });

    class CameraComponentInspector extends pcui.ComponentInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.component = 'camera';

            super(args);

            this._attributesInspector = new pcui.AttributesInspector({
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
        }

        _field(name) {
            return this._attributesInspector.getField(`components.camera.${name}`);
        }

        _toggleFields() {
            if (this._suppressToggleFields) return;

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

    return {
        CameraComponentInspector: CameraComponentInspector
    };
})());
