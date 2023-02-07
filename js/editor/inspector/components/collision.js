Object.assign(pcui, (function () {
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
        label: 'Model Asset',
        path: 'components.collision.asset',
        type: 'asset',
        args: {
            assetType: 'model'
        }
    }, {
        label: 'Render Asset',
        path: 'components.collision.renderAsset',
        type: 'asset',
        args: {
            assetType: 'render'
        }
    }, {
        label: 'Position Offset',
        path: 'components.collision.linearOffset',
        type: 'vec3',
        args: {
            placeholder: ['X', 'Y', 'Z'],
            precision: 3,
            step: 0.5
        }
    }, {
        label: 'Rotation Offset',
        path: 'components.collision.angularOffset',
        type: 'vec3',
        args: {
            placeholder: ['X', 'Y', 'Z'],
            precision: 3,
            step: 5
        }
    }];

    ATTRIBUTES.forEach((attr) => {
        const parts = attr.path.split('.');
        attr.reference = `collision:${parts[parts.length - 1]}`;
    });

    class CollisionComponentInspector extends pcui.ComponentInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.component = 'collision';

            super(args);

            this._variedTransformScalesWarning = new pcui.InfoBox({
                icon: 'E218',
                title: 'Warning!',
                text: 'This entity has a non-uniform scale. Mesh collision will not work as expected.'
            });
            this.append(this._variedTransformScalesWarning);

            this._evts = [];

            this._attributesInspector = new pcui.AttributesInspector({
                assets: args.assets,
                history: args.history,
                attributes: ATTRIBUTES,
                templateOverridesInspector: this._templateOverridesInspector
            });
            this.append(this._attributesInspector);

            this._field('type').on('change', this._toggleFields.bind(this));
            this._field('asset').on('change', this._toggleFields.bind(this));
            this._field('renderAsset').on('change', this._toggleFields.bind(this));

            this._handleTypeChange(this._field('type'));

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

        _handleTypeChange(fieldType) {
            // when the type changes we need to change the height of the collision
            // component to 2 if it's a capsule or 1 if it's a cylinder or cone.
            fieldType.binding.on('history:init', (context) => {
                // remember previous heights
                if (['cone', 'capsule', 'cylinder'].includes(fieldType.value)) {
                    context.prevHeights = context.observers.map(entity => entity.get('components.collision.height'));
                }
            });

            fieldType.binding.on('history:undo', (context) => {
                if (!context.prevHeights) return;

                context.observers.forEach((entity, i) => {
                    entity = entity.latest();
                    if (!entity) return;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    // set height to previous value
                    entity.set('components.collision.height', context.prevHeights[i]);
                    entity.history.enabled = history;
                });
            });

            fieldType.binding.on('history:redo', (context) => {
                if (!context.prevHeights) return;

                context.observers.forEach((entity) => {
                    entity = entity.latest();
                    if (!entity) return;

                    const history = entity.history.enabled;
                    entity.history.enabled = false;
                    const type = entity.get('components.collision.type');
                    const newHeight = (type === 'cone' || type === 'cylinder') ? 1 : 2;
                    const height = entity.get('components.collision.height');
                    // if setting to a capsule from a cone/cylinder and height is still the default
                    // capsule height then change to new height.
                    // OR if setting to a cylinder/cone from a capsule and height is still the default
                    // cylinder / cone height then change to new height.
                    if (newHeight === 1 && height === 2 ||
                        newHeight === 2 && height === 1) {
                        entity.set('components.collision.height', newHeight);
                    }
                    entity.history.enabled = history;
                });
            });
        }

        _toggleFields() {
            if (this._suppressToggleFields) return;

            const fieldType = this._field('type');
            this._field('halfExtents').parent.hidden = fieldType.value !== 'box';
            this._field('radius').parent.hidden = ['sphere', 'capsule', 'cylinder', 'cone'].indexOf(fieldType.value) === -1;
            this._field('height').parent.hidden = ['capsule', 'cylinder', 'cone'].indexOf(fieldType.value) === -1;
            this._field('axis').parent.hidden = ['capsule', 'cylinder', 'cone'].indexOf(fieldType.value) === -1;

            const modelAsset = this._field('asset').value;
            const renderAsset = this._field('renderAsset').value;

            this._field('asset').hidden = fieldType.value !== 'mesh' || !!renderAsset;

            this._field('renderAsset').hidden = fieldType.value !== 'mesh' || !!modelAsset;
        }

        link(entities) {
            super.link(entities);
            this._entities = entities;
            this._suppressToggleFields = true;
            this._attributesInspector.link(entities);

            // Migration at the inspector level
            // We shouldn't need to do this but to allow creation of new
            // components of properties that have no default value, I need to also add them
            // here as well as support existing components in editor-ui/js/editor/entities/entities-migrations.js
            setTimeout(() => {
                for (const entity of entities) {
                    if (!entity.has('components.collision.linearOffset')) {
                        entity.set('components.collision.linearOffset', [0.0, 0.0, 0.0]);
                    }

                    if (!entity.has('components.collision.angularOffset')) {
                        entity.set('components.collision.angularOffset', [0.0, 0.0, 0.0]);
                    }
                }
            });

            this._suppressToggleFields = false;
            this._toggleFields();

            const updateVariedTransformScalesWarning = () => {
                if (entities.length !== 1 || entities[0].get('components.collision.type') !== 'mesh') {
                    this._variedTransformScalesWarning.hidden = true;
                    return;
                }

                const scale = entities[0].get('scale');
                if (scale[0] === scale[1] && scale[1] === scale[2]) {
                    this._variedTransformScalesWarning.hidden = true;
                    return;
                }
                this._variedTransformScalesWarning.hidden = false;
            };
            this._evts.push(entities[0].on('*:set', (path) => {
                if (path === 'components.collision.type' || path.indexOf('scale.') === 0) {
                    updateVariedTransformScalesWarning();
                }
            }));
            updateVariedTransformScalesWarning();
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

    return {
        CollisionComponentInspector: CollisionComponentInspector
    };
})());
