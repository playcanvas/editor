Object.assign(pcui, (function () {
    'use strict';

    const ATTRIBUTES = [{
        label: 'Type',
        path: 'components.collision.type',
        type: 'select',
        args: {
            type: 'string',
            options: [{
                v: 'box', t: 'Box'
            }, {
                v: 'sphere', t: 'Sphere'
            }, {
                v: 'capsule', t: 'Capsule'
            }, {
                v: 'cylinder', t: 'Cylinder'
            }, {
                v: 'mesh', t: 'Mesh'
            }, {
                v: 'compound', t: 'Compound'
            }, {
                v: 'cone', t: 'Cone'
            }]
        }
    }, {
        label: 'Half Extents',
        path: 'components.collision.halfExtents',
        type: 'vec3',
        args: {
            placeholder: ['X', 'Y', 'Z'],
            precision: 3,
            step: 0.1,
            min: 0
        }
    }, {
        label: 'Radius',
        path: 'components.collision.radius',
        type: 'number',
        args: {
            precision: 2,
            step: 0.1,
            min: 0
        }
    }, {
        label: 'Height',
        path: 'components.collision.height',
        type: 'number',
        args: {
            precision: 2,
            step: 0.1,
            min: 0
        }
    }, {
        label: 'Axis',
        path: 'components.collision.axis',
        type: 'select',
        args: {
            type: 'number',
            options: [{
                v: 0, t: 'X'
            }, {
                v: 1, t: 'Y'
            }, {
                v: 2, t: 'Z'
            }]
        }
    }, {
        label: 'Asset',
        path: 'components.collision.asset',
        type: 'asset',
        args: {
            assetType: 'model'
        }
    }];

    ATTRIBUTES.forEach(attr => {
        const parts = attr.path.split('.');
        attr.reference = `collision:${parts[parts.length - 1]}`;
    });

    class CollisionComponentInspector extends pcui.ComponentInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.component = 'collision';

            super(args);

            this._attributesInspector = new pcui.AttributesInspector({
                assets: args.assets,
                history: args.history,
                attributes: ATTRIBUTES,
                templateOverridesInspector: this._templateOverridesInspector
            });
            this.append(this._attributesInspector);

            this._field('type').on('change', this._toggleFields.bind(this));

            this._suppressToggleFields = false;

            this._importAmmoPanel = editor.call('attributes:appendImportAmmo', this);
            this._importAmmoPanel.hidden = true;
            this._importAmmoPanel.label.text = 'Ammo module not found';
            this._importAmmoPanel.class.add('library-warning');
            this._importAmmoPanel.label.class.add('library-warning-text');
            this._importAmmoPanel.style.margin = '6px';

            this.on('show', () => {
                this._importAmmoPanel.hidden = editor.call('project:settings:hasPhysics');
            });
        }

        _field(name) {
            return this._attributesInspector.getField(`components.collision.${name}`);
        }

        _toggleFields() {
            if (this._suppressToggleFields) return;

            const fieldType = this._field('type');
            this._field('halfExtents').parent.hidden = fieldType.value !== 'box';
            this._field('radius').parent.hidden = ['sphere', 'capsule', 'cylinder', 'cone'].indexOf(fieldType.value) === -1;
            this._field('height').parent.hidden = ['capsule', 'cylinder', 'cone'].indexOf(fieldType.value) === -1;
            this._field('axis').parent.hidden = ['capsule', 'cylinder', 'cone'].indexOf(fieldType.value) === -1;
            this._field('asset').hidden = fieldType.value !== 'mesh';
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
        CollisionComponentInspector: CollisionComponentInspector
    };
})());
