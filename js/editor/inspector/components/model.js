import { Label, Container, Button, BindingTwoWay, BindingElementToObservers } from '@playcanvas/pcui';
import { ComponentInspector } from './component.js';

const ATTRIBUTES = [{
    label: 'Type',
    path: 'components.model.type',
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
    label: 'Model',
    path: 'components.model.asset',
    type: 'asset',
    args: {
        assetType: 'model'
    }
}, {
    label: 'Material',
    path: 'components.model.materialAsset',
    type: 'asset',
    args: {
        assetType: 'material'
    }
}, {
    label: 'Cast Shadows',
    path: 'components.model.castShadows',
    type: 'boolean'
}, {
    label: 'Cast Lightmap Shadows',
    path: 'components.model.castShadowsLightmap',
    type: 'boolean'
}, {
    label: 'Receive Shadows',
    path: 'components.model.receiveShadows',
    type: 'boolean'
}, {
    label: 'Static',
    path: 'components.model.isStatic',
    type: 'boolean'
}, {
    label: 'Lightmapped',
    path: 'components.model.lightmapped',
    type: 'boolean'
}, {
    label: 'Lightmap Size',
    type: 'label',
    alias: 'components.model.lightmapSize'
}, {
    label: 'Lightmap Size Multiplier',
    path: 'components.model.lightmapSizeMultiplier',
    type: 'number',
    args: {
        min: 0
    }
}, {
    label: 'Custom AABB',
    alias: 'components.model.customAabb',
    type: 'boolean',
    reference: 'model:customAabb',
    args: {
        renderChanges: false
    }
}, {
    label: 'AABB Center',
    path: 'components.model.aabbCenter',
    type: 'vec3'
}, {
    label: 'AABB Half Extents',
    path: 'components.model.aabbHalfExtents',
    type: 'vec3',
    args: {
        min: 0
    }
}, {
    label: 'Batch Group',
    path: 'components.model.batchGroupId',
    type: 'batchgroup'
}, {
    label: 'Layers',
    path: 'components.model.layers',
    type: 'layers',
    args: {
        excludeLayers: [
            LAYERID_DEPTH,
            LAYERID_SKYBOX,
            LAYERID_IMMEDIATE
        ]
    }
}];

ATTRIBUTES.forEach((attr) => {
    if (attr.reference) return;
    if (!attr.path) return;
    const parts = attr.path.split('.');
    attr.reference = `model:${parts[parts.length - 1]}`;
});

const CLASS_NOT_EVERYWHERE = 'model-component-inspector-mapping-not-everywhere';

const REGEX_MAPPING = /^components.model.mapping.(\d+)$/;

// Custom binding for asset field so that when we change the asset we
// reset the model's mapping
class AssetElementToObserversBinding extends BindingElementToObservers {
    constructor(assets, args) {
        super(args);
        this._assets = assets;
    }

    clone() {
        return new AssetElementToObserversBinding(this._assets, {
            history: this._history,
            historyPrefix: this._historyPrefix,
            historyPostfix: this._historyPostfix,
            historyName: this._historyName,
            historyCombine: this._historyCombine
        });
    }

    // Override setValue to set additional fields
    setValue(value) {
        if (this.applyingChange) return;
        if (!this._observers) return;

        this.applyingChange = true;

        // make copy of observers if we are using history
        // so that we can undo on the same observers in the future
        const observers = this._observers.slice();
        const paths = this._paths.slice();

        let previous = {};

        const undo = () => {
            for (let i = 0; i < observers.length; i++) {
                const latest = observers[i].latest();
                if (!latest || !latest.has('components.model')) continue;

                let history = false;
                if (latest.history) {
                    history = latest.history.enabled;
                    latest.history.enabled = false;
                }

                const path = this._pathAt(paths, i);

                const prevEntry = previous[latest.get('resource_id')];

                latest.set(path, prevEntry.value);

                if (prevEntry.hasOwnProperty('mapping')) {
                    latest.set('components.model.mapping', prevEntry.mapping);
                }

                if (history) {
                    latest.history.enabled = true;
                }
            }
        };

        const redo = () => {
            previous = {};

            for (let i = 0; i < observers.length; i++) {
                const latest = observers[i].latest();
                if (!latest || !latest.has('components.model')) continue;

                let history = false;
                if (latest.history) {
                    history = latest.history.enabled;
                    latest.history.enabled = false;
                }

                const path = this._pathAt(paths, i);
                const oldValue = latest.get(path);

                const entry = {
                    value: oldValue
                };

                latest.set(path, value);

                if (value !== oldValue && latest.get('components.model.mapping')) {
                    const mapping = latest.get('components.model.mapping');
                    if (mapping) {
                        entry.mapping = mapping;
                        latest.unset('components.model.mapping');
                    }
                }

                previous[latest.get('resource_id')] = entry;

                if (history) {
                    latest.history.enabled = true;
                }
            }
        };

        if (this._history) {
            this._history.add({
                name: this._getHistoryActionName(paths),
                redo: redo,
                undo: undo
            });

        }

        redo();

        this.applyingChange = false;
    }
}

class ModelComponentInspector extends ComponentInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.component = 'model';

        super(args);

        this._assets = args.assets;

        this._attributesInspector = new pcui.AttributesInspector({
            assets: args.assets,
            projectSettings: args.projectSettings,
            history: args.history,
            attributes: ATTRIBUTES,
            templateOverridesInspector: this._templateOverridesInspector
        });
        this.append(this._attributesInspector);

        this._labelUv1Missing = new Label({
            text: 'UV1 is missing',
            class: pcui.CLASS_ERROR
        });
        this._labelUv1Missing.style.marginLeft = 'auto';
        this._field('lightmapped').parent.append(this._labelUv1Missing);

        this._containerButtons = new Container({
            flex: true,
            flexDirection: 'row'
        });

        const btnAssetMaterials = new Button({
            text: 'ASSET MATERIALS',
            icon: 'E184',
            flexGrow: 1
        });

        btnAssetMaterials.on('click', this._onClickAssetMaterials.bind(this));

        this._containerButtons.append(btnAssetMaterials);

        const btnEntityMaterials = new Button({
            text: 'ENTITY MATERIALS',
            icon: 'E184',
            flexGrow: 1
        });

        btnEntityMaterials.on('click', this._onClickEntityMaterials.bind(this));

        this._containerButtons.append(btnEntityMaterials);

        this.append(this._containerButtons);

        this._containerMappings = new Container({
            flex: true
        });
        this.append(this._containerMappings);

        this._mappingInspectors = {};

        this._suppressToggleFields = false;
        this._suppressAssetChange = false;
        this._suppressCustomAabb = false;

        ['type', 'asset', 'lightmapped', 'lightmapSizeMultiplier', 'customAabb'].forEach((field) => {
            this._field(field).on('change', this._toggleFields.bind(this));
        });

        this._field('customAabb').on('change', this._onCustomAabbChange.bind(this));

        this._field('asset').on('change', this._onAssetChange.bind(this));

        this._field('asset').binding = new BindingTwoWay({
            history: this._history,
            bindingElementToObservers: new AssetElementToObserversBinding(this._assets, {
                history: this._history
            })
        });
    }

    _field(name) {
        return this._attributesInspector.getField(`components.model.${name}`);
    }

    _onClickAssetMaterials() {
        if (!this._entities) return;

        // select model asset
        const modelAsset = this._assets.get(this._entities[0].get('components.model.asset'));
        if (modelAsset) {
            editor.call('selector:set', 'asset', [modelAsset]);
        }
    }

    _onClickEntityMaterials() {
        if (!this._entities) return;

        // open entity materials picker
        editor.call('picker:node', this._entities);
    }

    _groupMappingsByKey() {
        const result = {};
        this._entities.forEach((e) => {
            const mapping = e.get('components.model.mapping');
            if (!mapping) return;

            for (const key in mapping) {
                if (!result[key]) {
                    result[key] = [];
                }

                result[key].push(e);
            }
        });

        return result;
    }

    _getMeshInstanceName(index, entities) {
        // get name of meshinstance from engine
        let meshInstanceName;
        for (let i = 0; i < entities.length; i++) {
            if (entities[i].entity && entities[i].entity.model && entities[i].entity.model.meshInstances) {
                const mi = entities[i].entity.model.meshInstances[index];
                if (mi) {
                    if (!meshInstanceName) {
                        meshInstanceName = mi.node.name;
                        break;
                    }
                }
            }
        }

        if (!meshInstanceName) {
            meshInstanceName = 'Node ' + index;
        }

        return meshInstanceName;
    }

    _createMappingInspector(key, entities) {
        const index = parseInt(key, 10);

        if (this._mappingInspectors[key]) {
            this._mappingInspectors[key].destroy();
        }

        const container = new Container({
            flex: true,
            flexDirection: 'row'
        });

        let previousMappings;

        const fieldMaterial = new pcui.AssetInput({
            assetType: 'material',
            assets: this._assets,
            text: this._getMeshInstanceName(index, entities),
            flexGrow: 1,
            renderChanges: true,
            binding: new BindingTwoWay({
                history: this._history
            }),
            allowDragDrop: true,
            // update viewport materials on drag enter
            dragEnterFn: (dropType, dropData) => {
                previousMappings = entities.map((e) => {
                    return e.get('components.model.mapping.' + key);
                });

                entities.forEach((e) => {
                    if (!e.entity || !e.entity.model) return;

                    const mapping = e.entity.model.mapping;
                    if (!mapping || !mapping.hasOwnProperty(key)) return;

                    mapping[key] = parseInt(dropData.id, 10);
                    e.entity.model.mapping = mapping;

                    editor.call('viewport:render');
                });
            },
            // restore viewport materials on drag leave
            dragLeaveFn: () => {
                entities.forEach((e, i) => {
                    if (!e.entity || !e.entity.model) return;

                    const mapping = e.entity.model.mapping;
                    if (!mapping || !mapping.hasOwnProperty(key)) return;

                    mapping[key] = previousMappings[i];
                    e.entity.model.mapping = mapping;

                    editor.call('viewport:render');
                });
            }
        });

        if (entities.length !== this._entities.length) {
            fieldMaterial.class.add(CLASS_NOT_EVERYWHERE);
        }

        container.append(fieldMaterial);

        fieldMaterial.link(entities, `components.model.mapping.${key}`);

        const btnRemove = new Button({
            icon: 'E289',
            size: 'small',
            flexShrink: 0
        });
        btnRemove.style.alignSelf = 'flex-end';
        btnRemove.style.marginBottom = '9px';
        btnRemove.style.marginLeft = '0px';
        container.append(btnRemove);

        btnRemove.on('click', () => {
            fieldMaterial.binding.setValue(undefined);
        });

        const nextSibling = this._containerMappings.dom.childNodes[index];

        this._containerMappings.appendBefore(container, nextSibling);

        this._mappingInspectors[key] = container;

        this._timeoutRefreshMappings = null;
        this._dirtyMappings = {};

        return container;
    }

    _refreshMappings(dirtyMappings) {
        if (this._timeoutRefreshMappings) {
            cancelAnimationFrame(this._timeoutRefreshMappings);
        }

        this._timeoutRefreshMappings = requestAnimationFrame(() => {
            this._timeoutRefreshMappings = null;

            const mappings = this._groupMappingsByKey();
            dirtyMappings = dirtyMappings || mappings;

            for (const key in this._mappingInspectors) {
                if (!mappings[key]) {
                    // destroy mappings that do not exist anymore
                    if (this._mappingInspectors[key]) {
                        this._mappingInspectors[key].destroy();
                        delete this._mappingInspectors[key];
                    }
                }
            }

            for (const key in dirtyMappings) {
                if (mappings[key]) {
                    // recreate dirty mappings
                    this._createMappingInspector(key, mappings[key]);
                }
            }
        });
    }

    _refreshCustomAabb() {
        if (!this._entities) return;

        this._suppressCustomAabb = true;
        this._suppressToggleFields = true;

        const customAabbs = this._entities.map(e => e.has('components.model.aabbCenter'));
        this._field('customAabb').values = customAabbs;

        this._suppressCustomAabb = false;
        this._suppressToggleFields = false;

        this._toggleFields();
    }

    _getLightmapSize() {
        const app = editor.call('viewport:app');
        let value = '?';
        if (app && this._entities) {
            const lightmapper = app.lightmapper;

            let min = Infinity;
            let max = -Infinity;
            this._entities.forEach((e) => {
                if (!e.get('components.model.lightmapped') ||
                    !e.entity || !e.entity.model ||
                    !e.entity.model.asset && e.entity.model.type === 'asset' ||
                    e.entity.model.asset && !app.assets.get(e.entity.model.asset)) {

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
        for (let i = 0; this._entities && i < this._entities.length; i++) {
            const e = this._entities[i];
            if (e.has('components.model') &&
                e.get('components.model.type') === 'asset') {
                const assetId = e.get('components.model.asset');
                const asset = assetId && this._assets.get(assetId);
                if (asset &&
                    !asset.has('meta.attributes.texCoord1') &&
                    !asset.has('meta.attributes.TEXCOORD_1')) {
                    return true;
                }
            }
        }

        return false;
    }

    _onAssetChange() {
        if (this._suppressAssetChange) return;

        this._refreshMappings();
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

        this._containerButtons.hidden = this._field('type').value !== 'asset' || !this._field('asset').value;
        this._containerMappings.hidden = this._containerButtons.hidden;

        this._field('asset').hidden = this._field('type').value !== 'asset';
        this._field('materialAsset').hidden = this._field('type').value === 'asset' || this._field('type').value === null;

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
            this._entities.forEach((e) => {
                e = e.latest();
                if (!e || !e.has('components.model')) return;

                const history = e.history.enabled;
                e.history.enabled = false;
                if (value) {
                    if (!e.has('components.model.aabbCenter')) {
                        prev[e.get('resource_id')] = {};
                        e.set('components.model.aabbCenter', [0, 0, 0]);
                        e.set('components.model.aabbHalfExtents', [0.5, 0.5, 0.5]);
                    }
                } else {
                    if (e.has('components.model.aabbCenter')) {
                        prev[e.get('resource_id')] = {
                            center: e.get('components.model.aabbCenter'),
                            halfExtents: e.get('components.model.aabbHalfExtents')
                        };

                        e.unset('components.model.aabbCenter');
                        e.unset('components.model.aabbHalfExtents');
                    }
                }
                e.history.enabled = history;
            });
        };

        const undo = () => {
            this._entities.forEach((e) => {
                e = e.latest();
                if (!e || !e.has('components.model')) return;

                const previous = prev[e.get('resource_id')];
                if (!previous) return;

                const history = e.history.enabled;
                e.history.enabled = false;
                if (previous.center) {
                    e.set('components.model.aabbCenter', previous.center);
                } else {
                    e.unset('components.model.aabbCenter');
                }

                if (previous.halfExtents) {
                    e.set('components.model.aabbHalfExtents', previous.halfExtents);
                } else {
                    e.unset('components.model.aabbHalfExtents');
                }
                e.history.enabled = history;
            });
        };

        redo();

        if (this._history) {
            this._history.add({
                name: 'entities.model.customAabb',
                undo: undo,
                redo: redo
            });
        }
    }

    link(entities) {
        super.link(entities);

        this._suppressToggleFields = true;
        this._suppressAssetChange = true;
        this._suppressCustomAabb = true;

        this._attributesInspector.link(entities);

        const mappings = this._groupMappingsByKey();
        for (const key in mappings) {
            this._createMappingInspector(key, mappings[key]);
        }

        const customAabbValues = [];

        entities.forEach((e) => {
            this._entityEvents.push(e.on('*:set', (path) => {
                const match = path.match(REGEX_MAPPING);
                if (!match) return;

                this._dirtyMappings[match[1]] = true;

                this._refreshMappings(this._dirtyMappings);
            }));

            this._entityEvents.push(e.on('*:unset', (path) => {
                const match = path.match(REGEX_MAPPING);
                if (!match) return;

                this._dirtyMappings[match[1]] = true;

                this._refreshMappings(this._dirtyMappings);
            }));

            this._entityEvents.push(e.on('components.model.mapping:set', () => {
                this._refreshMappings();
            }));

            this._entityEvents.push(e.on('components.model.mapping:unset', () => {
                this._refreshMappings();
            }));

            customAabbValues.push(e.has('components.model.aabbCenter'));

            this._entityEvents.push(e.on('components.model.aabbCenter:set', this._refreshCustomAabb.bind(this)));
            this._entityEvents.push(e.on('components.model.aabbCenter:unset', this._refreshCustomAabb.bind(this)));
        });

        this._field('customAabb').values = customAabbValues;

        this._suppressCustomAabb = false;
        this._suppressAssetChange = false;
        this._suppressToggleFields = false;

        this._toggleFields();
    }

    unlink() {
        super.unlink();
        this._attributesInspector.unlink();
        this._containerMappings.clear();
        this._mappingInspectors = {};

        if (this._timeoutRefreshMappings) {
            cancelAnimationFrame(this._timeoutRefreshMappings);
            this._timeoutRefreshMappings = null;
        }
        this._dirtyMappings = {};
    }
}

export { ModelComponentInspector };
