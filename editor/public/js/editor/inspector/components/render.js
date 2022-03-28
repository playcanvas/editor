Object.assign(pcui, (function () {
    'use strict';

    const ATTRIBUTES = [{
        label: 'Type',
        path: 'components.render.type',
        type: 'select',
        args: {
            type: 'string',
            options: [{
                v: 'asset', t: 'Asset'
            }, {
                v: 'box', t: 'Box'
            }, {
                v: 'capsule', t: 'Capsule'
            }, {
                v: 'sphere', t: 'Sphere'
            }, {
                v: 'cylinder', t: 'Cylinder'
            }, {
                v: 'cone', t: 'Cone'
            }, {
                v: 'plane', t: 'Plane'
            }]
        }
    }, {
        label: 'Asset',
        path: 'components.render.asset',
        type: 'asset',
        args: {
            assetType: 'render'
        }
    }, {
        label: 'Root Bone',
        path: 'components.render.rootBone',
        type: 'entity'
    }, {
        label: 'Cast Shadows',
        path: 'components.render.castShadows',
        type: 'boolean'
    }, {
        label: 'Cast Lightmap Shadows',
        path: 'components.render.castShadowsLightmap',
        type: 'boolean'
    }, {
        label: 'Receive Shadows',
        path: 'components.render.receiveShadows',
        type: 'boolean'
    }, {
        label: 'Static',
        path: 'components.render.isStatic',
        type: 'boolean'
    }, {
        label: 'Lightmapped',
        path: 'components.render.lightmapped',
        type: 'boolean'
    }, {
        label: 'Lightmap Size',
        type: 'label',
        alias: 'components.render.lightmapSize'
    }, {
        label: 'Lightmap Size Multiplier',
        path: 'components.render.lightmapSizeMultiplier',
        type: 'number',
        args: {
            min: 0
        }
    }, {
        label: 'Custom AABB',
        alias: 'components.render.customAabb',
        type: 'boolean',
        reference: 'render:customAabb',
        args: {
            renderChanges: false
        }
    }, {
        label: 'AABB Center',
        path: 'components.render.aabbCenter',
        type: 'vec3'
    }, {
        label: 'AABB Half Extents',
        path: 'components.render.aabbHalfExtents',
        type: 'vec3',
        args: {
            min: 0
        }
    }, {
        label: 'Batch Group',
        path: 'components.render.batchGroupId',
        type: 'batchgroup'
    }, {
        label: 'Layers',
        path: 'components.render.layers',
        type: 'layers',
        args: {
            excludeLayers: [
                LAYERID_DEPTH,
                LAYERID_SKYBOX,
                LAYERID_IMMEDIATE
            ]
        }
    }, {
        label: 'Materials',
        path: 'components.render.materialAssets',
        type: 'array:asset',
        args: {
            assetType: 'material',
            fixedSize: true
        }
    }];

    ATTRIBUTES.forEach(attr => {
        if (!attr.path) return;
        if (attr.reference) return;
        const parts = attr.path.split('.');
        attr.reference = `render:${parts[parts.length - 1]}`;
    });

    class RenderComponentInspector extends pcui.ComponentInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.component = 'render';

            super(args);

            this._assets = args.assets;

            this._attributesInspector = new pcui.AttributesInspector({
                assets: args.assets,
                entities: args.entities,
                projectSettings: args.projectSettings,
                history: args.history,
                attributes: ATTRIBUTES,
                templateOverridesInspector: this._templateOverridesInspector
            });
            this.append(this._attributesInspector);

            this._labelUv1Missing = new pcui.Label({
                text: 'UV1 is missing',
                class: pcui.CLASS_ERROR
            });
            this._labelUv1Missing.style.marginLeft = 'auto';
            this._field('lightmapped').parent.append(this._labelUv1Missing);

            this._suppressToggleFields = false;
            this._suppressAssetChange = false;
            this._suppressCustomAabb = false;

            ['type', 'asset', 'lightmapped', 'lightmapSizeMultiplier', 'customAabb'].forEach(field => {
                this._field(field).on('change', this._toggleFields.bind(this));
            });

            this._field('materialAssets').on('change', this._onMaterialsChange.bind(this));

            this._field('customAabb').on('change', this._onCustomAabbChange.bind(this));

            this._changeMaterialsOnChange(this._field('asset'));
            this._changeMaterialsOnChange(this._field('type'));
        }

        _field(name) {
            return this._attributesInspector.getField(`components.render.${name}`);
        }

        _onMaterialsChange(value) {
            this._field('materialAssets').forEachArrayElement((assetInput, index) => {
                assetInput.label.text = 'Material #' + index;
            });
        }

        _getNewMaterials(numInstances, previousMaterials) {
            var result = new Array(numInstances).fill(null);
            for (let i = 0; i < previousMaterials.length && i < result.length; i++) {
                result[i] = previousMaterials[i];
            }

            return result;
        }

        // when the render type or the render asset change,
        // also change the materialAssets to the correct length
        _changeMaterialsOnChange(field) {
            const binding = field.binding;
            if (!binding) return;

            binding.on('history:init', (context) => {
                context.prevMaterials = context.observers.map(observer => observer.get('components.render.materialAssets'));
                context.prevAssets = context.observers.map(observer => observer.get('components.render.asset'));
            });

            binding.on('history:redo', (context) => {
                context.observers.forEach(observer => {
                    observer = observer.latest();
                    if (!observer) return;

                    const history = observer.history.enabled;
                    observer.history.enabled = false;

                    let numInstances = 1;

                    const current = observer.get('components.render.materialAssets') || [];
                    const type = observer.get('components.render.type');
                    if (type === 'asset') {
                        const asset = this._assets.get(observer.get('components.render.asset'));
                        numInstances = asset && asset.get('meta.meshes') || asset.get('meta.meshInstances') || 0;
                    } else {
                        observer.set('components.render.asset', null);
                    }

                    const newMaterials = this._getNewMaterials(numInstances, current);
                    observer.set('components.render.materialAssets', newMaterials);

                    observer.history.enabled = history;

                });
            });

            binding.on('history:undo', (context) => {
                context.observers.forEach((observer, index) => {
                    observer = observer.latest();
                    if (!observer) return;

                    const history = observer.history.enabled;
                    observer.history.enabled = false;

                    let numInstances = 1;
                    const type = observer.get('components.render.type');
                    if (type === 'asset') {
                        observer.set('components.render.asset', context.prevAssets[index]);
                        const asset = this._assets.get(observer.get('components.render.asset'));
                        numInstances = asset && asset.get('meta.meshes') || asset.get('meta.meshInstances') || 0;
                    }

                    const newMaterials = this._getNewMaterials(numInstances, context.prevMaterials[index]);
                    observer.set('components.render.materialAssets', newMaterials);

                    observer.history.enabled = history;

                });
            });
        }

        _getLightmapSize() {
            const app = editor.call('viewport:app');
            let value = '?';
            if (app && this._entities) {
                const lightmapper = app.lightmapper;

                let min = Infinity;
                let max = -Infinity;
                this._entities.forEach(e => {
                    if (!e.get('components.render.lightmapped') ||
                        !e.entity || !e.entity.render ||
                        !e.entity.render.asset && e.entity.render.type === 'asset' ||
                        e.entity.render.asset && !app.assets.get(e.entity.render.asset)) {

                        return;
                    }

                    const size = lightmapper.calculateLightmapSize(e.entity);
                    if (size > max) max = size;
                    if (size < min) min = size;
                });

                if (min) {
                    value = (min !== max ? `${min} - ${max}` : min);
                }
            }

            return value;
        }

        _isUv1Missing() {
            let missing = false;

            for (let i = 0; this._entities && i < this._entities.length && !missing; i++) {
                const e = this._entities[i];
                if (!e.has('components.render') ||
                    e.get('components.render.type') !== 'asset' ||
                    !e.get('components.render.asset')) {
                    continue;
                }

                const asset = this._assets.get(e.get('components.render.asset'));
                if (!asset) continue;

                if (!asset.has('meta.attributes.TEXCOORD_1')) {
                    missing = true;
                }
            }

            return missing;
        }

        _toggleFields() {
            if (this._suppressToggleFields) return;

            const fieldLightmapSize = this._field('lightmapSize');
            fieldLightmapSize.parent.hidden = !this._field('lightmapped').value;
            if (!fieldLightmapSize.parent.hidden) {
                fieldLightmapSize.value = this._getLightmapSize();
                this._labelUv1Missing.hidden = !this._isUv1Missing();
            } else {
                this._labelUv1Missing.hidden = true;
            }
            this._field('lightmapSizeMultiplier').parent.hidden = fieldLightmapSize.parent.hidden;

            this._field('asset').hidden = this._field('type').value !== 'asset';

            let renderAsset = this._field('asset').value;
            let showRootBone = false;
            if (renderAsset) {
                renderAsset = this._assets.get(renderAsset);
                if (renderAsset && renderAsset.get('meta.skinned')) {
                    showRootBone = true;
                }
            }

            this._field('rootBone').parent.hidden = !showRootBone;

            const customAabb = this._field('customAabb').value;
            this._field('aabbCenter').parent.hidden = !customAabb;
            this._field('aabbHalfExtents').parent.hidden = !customAabb;

        }

        _onCustomAabbChange(value) {
            if (!this._entities) return;
            if (this._suppressCustomAabb) return;

            let prev;

            const redo = () => {
                prev = {};
                this._entities.forEach(e => {
                    e = e.latest();
                    if (!e || !e.has('components.render')) return;

                    const history = e.history.enabled;
                    e.history.enabled = false;
                    if (value) {
                        if (!e.has('components.render.aabbCenter')) {
                            prev[e.get('resource_id')] = {};
                            e.set('components.render.aabbCenter', [0, 0, 0]);
                            e.set('components.render.aabbHalfExtents', [0.5, 0.5, 0.5]);
                        }
                    } else {
                        if (e.has('components.render.aabbCenter')) {
                            prev[e.get('resource_id')] = {
                                center: e.get('components.render.aabbCenter'),
                                halfExtents: e.get('components.render.aabbHalfExtents')
                            };

                            e.unset('components.render.aabbCenter');
                            e.unset('components.render.aabbHalfExtents');
                        }
                    }
                    e.history.enabled = history;
                });
            };

            const undo = () => {
                this._entities.forEach(e => {
                    e = e.latest();
                    if (!e || !e.has('components.render')) return;

                    const previous = prev[e.get('resource_id')];
                    if (!previous) return;

                    const history = e.history.enabled;
                    e.history.enabled = false;
                    if (previous.center) {
                        e.set('components.render.aabbCenter', previous.center);
                    } else {
                        e.unset('components.render.aabbCenter');
                    }

                    if (previous.halfExtents) {
                        e.set('components.render.aabbHalfExtents', previous.halfExtents);
                    } else {
                        e.unset('components.render.aabbHalfExtents');
                    }
                    e.history.enabled = history;
                });
            };

            redo();

            if (this._history) {
                this._history.add({
                    name: 'entities.render.customAabb',
                    undo: undo,
                    redo: redo
                });
            }
        }


        _refreshCustomAabb() {
            if (!this._entities) return;

            this._suppressCustomAabb = true;
            this._suppressToggleFields = true;

            const customAabbs = this._entities.map(e => e.has('components.render.aabbCenter'));
            this._field('customAabb').values = customAabbs;

            this._suppressCustomAabb = false;
            this._suppressToggleFields = false;

            this._toggleFields();
        }

        link(entities) {
            super.link(entities);

            this._suppressToggleFields = true;
            this._suppressAssetChange = true;
            this._suppressCustomAabb = true;

            const customAabbs = this._entities.map(e => e.has('components.render.aabbCenter'));
            this._field('customAabb').values = customAabbs;

            this._attributesInspector.link(entities);

            entities.forEach(e => {
                this._entityEvents.push(e.on('components.render.aabbCenter:set', this._refreshCustomAabb.bind(this)));
                this._entityEvents.push(e.on('components.render.aabbCenter:unset', this._refreshCustomAabb.bind(this)));
            });

            this._suppressAssetChange = false;
            this._suppressToggleFields = false;
            this._suppressCustomAabb = false;

            this._field('materialAssets').forEachArrayElement((assetInput, index) => {
                assetInput.dragEnterFn = (type, dropData) => {
                    var entity = this._entities && this._entities[0];
                    if (!entity || !entity.entity || !entity.entity.render) return;

                    const materials = entity.entity.render.materialAssets;
                    materials[index] = parseInt(dropData.id, 10);
                    entity.entity.render.materialAssets = materials;

                    editor.call('viewport:render');
                };

                assetInput.dragLeaveFn = () => {
                    var entity = this._entities && this._entities[0];
                    if (!entity || !entity.entity || !entity.entity.render) return;

                    const materials = entity.entity.render.materialAssets;
                    materials[index] = entity.get('components.render.materialAssets.' + index);
                    entity.entity.render.materialAssets = materials;

                    editor.call('viewport:render');
                };
            });

            this._toggleFields();

        }

        unlink() {
            super.unlink();
            this._attributesInspector.unlink();
        }
    }

    return {
        RenderComponentInspector: RenderComponentInspector
    };
})());
