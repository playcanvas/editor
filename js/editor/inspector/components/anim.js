Object.assign(pcui, (function () {
    'use strict';

    const ATTRIBUTES = [
        {
            label: 'Activate',
            path: 'components.anim.activate',
            type: 'boolean'
        },
        {
            label: 'Speed',
            path: 'components.anim.speed',
            type: 'slider',
            args: {
                precision: 3,
                step: 0.1,
                sliderMin: 0,
                sliderMax: 2
            }
        },
        {
            label: 'Root Bone',
            path: 'components.anim.rootBone',
            type: 'entity'
        },
        {
            label: 'Normalize Weights',
            path: 'components.anim.normalizeWeights',
            type: 'boolean'
        },
        {
            type: 'divider'
        },
        {
            label: 'State Graph',
            alias: 'stateGraphAsset',
            reference: 'anim:stateGraphAsset',
            type: 'asset',
            args: {
                assetType: 'animstategraph',
                allowDragDrop: true
            }
        }
    ];

    ATTRIBUTES.forEach((attr) => {
        if (!attr.path || attr.alias) return;
        const parts = attr.path ? attr.path.split('.') : attr.alias.split('.');
        attr.reference = `anim:${parts[parts.length - 1]}`;
    });

    const CLASS_ROOT = 'anim-component';
    const CLASS_LAYER = CLASS_ROOT + '-layer';
    const CLASS_STATE = CLASS_ROOT + '-state';
    const CLASS_MASK_BUTTON_CONTAINER = CLASS_ROOT + '-mask-button-container';
    const CLASS_EDIT_MASK_BUTTON = CLASS_ROOT + '-edit-mask-button';
    const CLASS_DELETE_MASK_BUTTON = CLASS_ROOT + '-delete-mask-button';
    const CLASS_BOOLEAN_INPUT_ITEM = CLASS_ROOT + '-boolean-input-item';
    const CLASS_MASK_INSPECTOR = CLASS_ROOT + '-mask-inspector';
    const CLASS_MASK_INSPECTOR_CLOSE_BUTTON = CLASS_MASK_INSPECTOR + '-close-button';
    const CLASS_MASK_INSPECTOR_ADD_ALL_BUTTON = CLASS_MASK_INSPECTOR + '-add-all-button';
    const CLASS_MASK_INSPECTOR_REMOVE_ALL_BUTTON = CLASS_MASK_INSPECTOR + '-remove-all-button';

    class AnimComponentInspector extends pcui.ComponentInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.component = 'anim';

            super(args);

            this._args = args;
            this._assets = args.assets;

            this._stateGraphAssetId = null;
            this._stateGraphAsset = null;
            this._entities = null;

            this._maskInspector = null;
            this._contextMenus = [];

            this._evts = [];
            this._maskEvts = [];

            this._attributesInspector = new pcui.AttributesInspector({
                assets: args.assets,
                entities: args.entities,
                history: args.history,
                attributes: ATTRIBUTES,
                templateOverridesInspector: this._templateOverridesInspector
            });
            this.append(this._attributesInspector);

            this._normalizeWeightsMessage = new pcui.InfoBox({
                icon: 'E400',
                title: 'Normalize Weights Migration',
                text: 'This anim component was created before the normalize weights option was introduced. To maintain the component\'s previous behaviour, normalize weights has been turned on. For more info click '
            });
            this._normalizeWeightsMessage.hidden = true;
            const normalizeWeightsField = this._attributesInspector.getField('components.anim.normalizeWeights');
            normalizeWeightsField.parent.parent.appendAfter(this._normalizeWeightsMessage, normalizeWeightsField.parent);
            const normalizeWeightsLink = document.createElement('a');
            normalizeWeightsLink.setAttribute('href', 'https://forum.playcanvas.com/t/anim-component-layer-blending-update/24557');
            normalizeWeightsLink.setAttribute('target', '_blank');
            normalizeWeightsLink.innerText = 'here.';
            this._normalizeWeightsMessage.dom.children[1].appendChild(normalizeWeightsLink);
        }

        _createMask(rootEntity) {
            const mask = {};

            const addEntityAndChildPaths = (entity) => {
                const path = `${rootEntity.name}${entity.path.replace(rootEntity.path, '')}`.replace(/\./g, '%2E');
                mask[path] = { value: true };
                entity.children.forEach((child) => {
                    addEntityAndChildPaths(child);
                });
            };
            addEntityAndChildPaths(rootEntity);

            return mask;
        }

        _addMaskInspector(layerId, layerName) {
            const root = editor.call('layout.root');

            if (this._maskInspector) {
                this._clearMaskInspector();
            }
            this.parent.hidden = true;
            editor.call('layout.attributes').headerText = `${layerName} MASK`.toUpperCase();

            this._maskInspector = new pcui.Container({
                class: CLASS_MASK_INSPECTOR
            });
            this.parent.parent.append(this._maskInspector.dom);

            const entityObserver = this._entities[0];

            const maskTreeView = new pcui.TreeView();

            let masks = entityObserver.get(`components.anim.masks`);
            if (!masks) {
                masks = {};
            }
            if (!masks[layerId]) {

                let rootEntity = entityObserver.entity;

                if (rootEntity.anim.rootBone) {
                    rootEntity = rootEntity.anim.rootBone;
                }

                if (rootEntity.model && rootEntity.model.enabled && rootEntity.model.model && rootEntity.model.type === 'asset') {
                    rootEntity = rootEntity.model.model.graph;
                }

                masks[layerId] = {
                    mask: this._createMask(rootEntity)
                };

                entityObserver.set('components.anim.masks', masks);
            }

            const mask = masks[layerId].mask;

            const createBooleanTreeViewItem = (name, path, args = {}) => {
                var item = new pcui.TreeViewItem(Object.assign({
                    text: name,
                    class: CLASS_BOOLEAN_INPUT_ITEM
                }, args));
                item.path = path;
                const booleanInput = new pcui.BooleanInput({
                    value: entityObserver.get(`components.anim.masks.${layerId}.mask.${path}.value`)
                });
                booleanInput.on('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                });

                let suppressChanges = false;

                booleanInput.on('change', (value) => {
                    if (suppressChanges) return;
                    const redo = () => {
                        const e = entityObserver.latest();
                        if (!e) return;
                        const history = e.history.enabled;
                        e.history.enabled = false;
                        e.set(`components.anim.masks.${layerId}.mask.${path}.value`, value);
                        e.history.enabled = history;
                    };
                    const undo = () => {
                        const e = entityObserver.latest();
                        if (!e) return;
                        const history = e.history.enabled;
                        e.history.enabled = false;
                        e.set(`components.anim.masks.${layerId}.mask.${path}.value`, !value);
                        e.history.enabled = history;
                    };
                    this._args.history.add({
                        name: `edit ${name} mask`,
                        redo,
                        undo
                    });
                    redo();
                });

                this._maskEvts.push(entityObserver.on(`components.anim.masks.${layerId}.mask.${item.path}.value:set`, (value) => {
                    suppressChanges = true;
                    booleanInput.value = value;
                    suppressChanges = false;
                }));

                item._containerContents.prepend(booleanInput);
                const contextMenuDom = new pcui.Container();
                item._containerContents.append(contextMenuDom);

                const updateItemAndChildren = (item, value) => {
                    entityObserver.set(`components.anim.masks.${layerId}.mask.${item.path}.value`, value);
                    item.forEachChild((childItem) => {
                        if (childItem instanceof pcui.TreeViewItem) {
                            updateItemAndChildren(childItem, value);
                        }
                    });
                };

                const contextMenu = new pcui.Menu({
                    items: [
                        {
                            text: 'Add hierarchy',
                            onSelect: () => {
                                const redo = () => {
                                    const e = entityObserver.latest();
                                    if (!e) return;
                                    const history = e.history.enabled;
                                    e.history.enabled = false;
                                    updateItemAndChildren(item, true);
                                    e.history.enabled = history;
                                };
                                const undo = () => {
                                    const e = entityObserver.latest();
                                    if (!e) return;
                                    const history = e.history.enabled;
                                    e.history.enabled = false;
                                    updateItemAndChildren(item, false);
                                    e.history.enabled = history;
                                };
                                this._args.history.add({
                                    name: `Add hierarchy to mask`,
                                    redo,
                                    undo
                                });
                                redo();
                            }
                        },
                        {
                            text: 'Remove hierarchy',
                            onSelect: () => {
                                const redo = () => {
                                    const e = entityObserver.latest();
                                    if (!e) return;
                                    const history = e.history.enabled;
                                    e.history.enabled = false;
                                    updateItemAndChildren(item, false);
                                    e.history.enabled = history;
                                };
                                const undo = () => {
                                    const e = entityObserver.latest();
                                    if (!e) return;
                                    const history = e.history.enabled;
                                    e.history.enabled = false;
                                    updateItemAndChildren(item, true);
                                    e.history.enabled = history;
                                };
                                this._args.history.add({
                                    name: `Remove hierarchy from mask`,
                                    redo,
                                    undo
                                });
                                redo();
                            }
                        }
                    ]
                });

                root.append(contextMenu);
                this._contextMenus.push(contextMenu);

                item.dom.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    contextMenu.position(e.clientX, e.clientY);
                    contextMenu.hidden = false;
                });

                return item;
            };

            const items = {};

            Object.keys(mask).forEach((path) => {
                const pathArr = path.split('/');
                const name = decodeURI(pathArr[pathArr.length - 1]);
                const parent = items[pathArr.splice(0, pathArr.length - 1).join('/')] || maskTreeView;
                const item = createBooleanTreeViewItem(name, path, { class: [CLASS_BOOLEAN_INPUT_ITEM] });
                parent.append(item);
                parent.open = true;
                item.open = true;
                items[path] = item;
            });

            let selectedItem = null;

            const setAllPaths = (value) => {
                const redo = () => {
                    const e = entityObserver.latest();
                    if (!e) return;
                    const history = e.history.enabled;
                    e.history.enabled = false;
                    const mask = e.get(`components.anim.masks.${layerId}.mask`);
                    if (selectedItem) {
                        maskTreeView.selected.forEach((i) => {
                            e.set(`components.anim.masks.${layerId}.mask.${i.path}.value`, value);
                        });
                    } else {
                        Object.keys(mask).forEach((path) => {
                            e.set(`components.anim.masks.${layerId}.mask.${path}.value`, value);
                        });
                    }
                    e.history.enabled = history;
                };
                const undo = () => {
                    const e = entityObserver.latest();
                    if (!e) return;
                    const history = e.history.enabled;
                    e.history.enabled = false;
                    const mask = e.get(`components.anim.masks.${layerId}.mask`);
                    if (selectedItem) {
                        maskTreeView.selected.forEach((i) => {
                            e.set(`components.anim.masks.${layerId}.mask.${i.path}.value`, !value);
                        });
                    } else {
                        Object.keys(mask).forEach((path) => {
                            e.set(`components.anim.masks.${layerId}.mask.${path}.value`, !value);
                        });
                    }
                    e.history.enabled = history;
                };
                this._args.history.add({
                    name: `edit mask`,
                    redo,
                    undo
                });
                redo();
            };

            const maskInspectorOptions = new pcui.Container();

            const addAllPathsButton = new pcui.Button({
                text: 'ADD ALL',
                class: CLASS_MASK_INSPECTOR_ADD_ALL_BUTTON
            });
            addAllPathsButton.on('click', () => {
                setAllPaths(true);
            });
            maskInspectorOptions.append(addAllPathsButton);

            const removeAllPathsButton = new pcui.Button({
                text: 'REMOVE ALL',
                class: CLASS_MASK_INSPECTOR_REMOVE_ALL_BUTTON
            });
            removeAllPathsButton.on('click', () => {
                setAllPaths(false);
            });
            maskInspectorOptions.append(removeAllPathsButton);

            this._maskInspector.append(maskInspectorOptions);

            maskTreeView.on('select', (item) => {
                selectedItem = item;
                addAllPathsButton.text = 'ADD SELECTED';
                removeAllPathsButton.text = 'REMOVE SELECTED';
            });

            maskTreeView.on('deselect', () => {
                addAllPathsButton.text = 'ADD ALL';
                removeAllPathsButton.text = 'REMOVE ALL';
                selectedItem = null;

            });

            const closeButton = new pcui.Button({
                text: '',
                icon: 'E389',
                class: CLASS_MASK_INSPECTOR_CLOSE_BUTTON
            });
            closeButton.on('click', () => {
                this._clearMaskInspector();
            });
            this._maskInspector.prepend(closeButton);

            this._maskInspector.append(maskTreeView);
        }


        _clearMaskInspector() {
            if (this._maskInspector) {
                this.parent.parent.content.dom.removeChild(this._maskInspector.dom);
                this.parent.hidden = false;
                this._maskInspector.destroy();
                this._maskInspector = null;
            }

            for (const contextMenu of this._contextMenus) {
                contextMenu.destroy();
            }
            this._contextMenus.length = 0;

            document.querySelector('#layout-attributes').ui.headerText = 'ENTITY';
            this._maskEvts.forEach(e => e.unbind);
            this._maskEvts.length = 0;
        }

        _addAnimationAssetSlots() {
            this._clearAnimationSlots();
            if (!this._entities) return;

            const stateGraph = this._assets.get(this._stateGraphAssetId);
            if (!stateGraph) return;
            const layers = stateGraph.get('data.layers');
            this._layersContainer = new pcui.Container();
            for (const layerId in layers) {
                const layer = layers[layerId];
                const layerPanel = new pcui.Panel({
                    headerText: `Layer: ${layer.name}`,
                    class: CLASS_LAYER,
                    collapsible: true
                });

                const maskButtonsContainer = new pcui.Container({ class: CLASS_MASK_BUTTON_CONTAINER, flex: true });
                layerPanel.append(maskButtonsContainer);
                const layerMaskButton = new pcui.Button({
                    text: this._entities[0].get(`components.anim.masks.${layerId}.mask`) ? 'EDIT MASK' : 'CREATE MASK',
                    class: CLASS_EDIT_MASK_BUTTON
                });
                layerMaskButton.on('click', () => {
                    this._addMaskInspector(layerId, layer.name);
                });
                maskButtonsContainer.append(layerMaskButton);
                const deleteLayerMaskButton = new pcui.Button({
                    text: '',
                    icon: 'E289',
                    class: CLASS_DELETE_MASK_BUTTON
                });
                deleteLayerMaskButton.on('click', () => {
                    this._entities[0].set(`components.anim.masks.${layerId}`, undefined);
                });
                deleteLayerMaskButton.hidden = !this._entities[0].get(`components.anim.masks.${layerId}.mask`);
                maskButtonsContainer.append(deleteLayerMaskButton);

                this._evts.push(this._entities[0].on('*:set', (path) => {
                    if (path.indexOf(`components.anim.masks`) === 0) {
                        layerMaskButton.text = this._entities[0].get(`components.anim.masks.${layerId}.mask`) ? 'EDIT MASK' : 'CREATE MASK';
                        deleteLayerMaskButton.hidden = !this._entities[0].get(`components.anim.masks.${layerId}.mask`);
                    }
                }));

                layer.states.forEach((stateId) => {
                    const state = stateGraph.get(`data.states.${stateId}`);
                    if (!state) return;
                    if (!['START', 'END', 'ANY'].includes(state.name)) {
                        if (!this._entities[0].get(`components.anim.animationAssets.${layer.name}:${state.name}`)) {
                            var animAssets = this._entities[0].get('components.anim.animationAssets');
                            if (!animAssets[`${layer.name}:${state.name}`]) {
                                animAssets[`${layer.name}:${state.name}`] = { asset: null };
                                const prevHistoryEnabled = this._entities[0].history.enabled;
                                this._entities[0].history.enabled = false;
                                this._entities[0].set(`components.anim.animationAssets`, animAssets);
                                this._entities[0].history.enabled = prevHistoryEnabled;
                            }
                        }
                        const stateAsset = new pcui.AssetInput({
                            text: state.name,
                            assetType: 'animation',
                            allowDragDrop: true,
                            assets: this._assets,
                            binding: new pcui.BindingTwoWay({
                                history: this._args.history
                            }),
                            validateAssetFn: (asset) => {
                                const filename = asset.get('file.filename') || '';
                                return !!filename.toLowerCase().match(/.glb$/);
                            }
                        });
                        stateAsset._thumbnail.on('click', () => {
                            sessionStorage.setItem(`animation-preview-entity-id`, this._entities[0].get('resource_id'));
                        });
                        const statePanel = new pcui.Panel({
                            collapsible: true,
                            class: CLASS_STATE,
                            headerText: state.name
                        });
                        statePanel.content.append(stateAsset);
                        stateAsset.link(this._entities, `components.anim.animationAssets.${layer.name}:${state.name}.asset`);
                        layerPanel.append(statePanel);
                    }
                });
                this._layersContainer.append(layerPanel);
            }
            this.append(this._layersContainer);
        }

        _clearAnimationSlots() {
            if (this._layersContainer) {
                this.remove(this._layersContainer);
            }
        }

        link(entities) {
            this.unlink();
            super.link(entities);
            this._entities = entities;
            this._attributesInspector.link(entities);

            const stateGraphAssetField = this._attributesInspector.getField('stateGraphAsset');
            // handle multiselect
            if (this._entities.length > 1) {
                stateGraphAssetField.hidden = true;
                return;
            }
            stateGraphAssetField.hidden = false;

            this._stateGraphAssetId = this._entities[0].get('components.anim.stateGraphAsset');
            stateGraphAssetField.value = this._stateGraphAssetId;

            // update state graph asset id and animationAssets when state graph asset is changed by the user
            let suppressStateGraphAssetFieldChanges = false;
            this._entityEvents.push(stateGraphAssetField.on('change', (value) => {
                if (suppressStateGraphAssetFieldChanges) return;
                const prevStateGraphAssetId = this._entities[0].get(`components.anim.stateGraphAsset`);
                const prevAnimAssets = this._entities[0].get(`components.anim.animationAssets`);
                const undo = () => {
                    suppressStateGraphAssetFieldChanges = true;
                    stateGraphAssetField.value = prevStateGraphAssetId;
                    suppressStateGraphAssetFieldChanges = false;
                    const prevHistoryEnabled = this._entities[0].history.enabled;
                    this._entities[0].history.enabled = false;
                    this._entities[0].set(`components.anim.stateGraphAsset`, prevStateGraphAssetId);
                    // when undoing a clear of the state graph, restore the previous animation assets
                    if (!value) {
                        this._entities[0].set(`components.anim.animationAssets`, prevAnimAssets);
                    }
                    this._entities[0].history.enabled = prevHistoryEnabled;
                    this._addAnimationAssetSlots();
                };
                const redo = () => {
                    suppressStateGraphAssetFieldChanges = true;
                    stateGraphAssetField.value = value;
                    suppressStateGraphAssetFieldChanges = false;
                    const prevHistoryEnabled = this._entities[0].history.enabled;
                    this._entities[0].history.enabled = false;
                    this._entities[0].set(`components.anim.stateGraphAsset`, value);
                    // when clearing the state graph, remove all animation assets
                    if (!value) {
                        this._entities[0].set(`components.anim.animationAssets`, {});
                    }
                    this._entities[0].history.enabled = prevHistoryEnabled;
                    this._addAnimationAssetSlots();
                };
                this._history.add({
                    name: 'change stateGraphAsset',
                    undo: undo,
                    redo: redo
                });
                redo();
            }));

            if (this._stateGraphAssetId) {
                this._addAnimationAssetSlots();
            }

            // update the state graph asset input and display / hide the animation slots when an incoming change to the state graph asset is detected
            this._entityEvents.push(this._entities[0].on('components.anim.stateGraphAsset:set', (value) => {
                suppressStateGraphAssetFieldChanges = true;
                stateGraphAssetField.value = value;
                suppressStateGraphAssetFieldChanges = false;
                this._stateGraphAssetId = this._entities[0].get('components.anim.stateGraphAsset');
                if (this._stateGraphAssetId) {
                    this._addAnimationAssetSlots();
                } else {
                    this._clearAnimationSlots();
                }
            }));

            // normalize weights migration message
            if (window.sessionStorage.getItem(`${this._entities[0].get('resource_id')}:animNormalizeWeightsMessage`)) {
                this._normalizeWeightsMessage.hidden = false;
                const normalizeWeightsField = this._attributesInspector.getField('components.anim.normalizeWeights');
                normalizeWeightsField.on('change', () => {
                    window.sessionStorage.removeItem(`${this._entities[0].get('resource_id')}:animNormalizeWeightsMessage`);
                });
            } else {
                this._normalizeWeightsMessage.hidden = true;
            }
            if (!entities[0].has('components.anim.normalizeWeights')) {
                setTimeout(() => {
                    const prevHistoryEnabled = this._entities[0].history.enabled;
                    this._entities[0].history.enabled = false;
                    this._entities[0].set('components.anim.normalizeWeights', false);
                    this._entities[0].history.enabled = prevHistoryEnabled;
                }, 0);
            }
        }

        unlink() {
            super.unlink();
            if (this._entities) {
                this._entities = null;
                this._stateGraphAssetId = null;
                this._stateGraphAsset = null;
                if (this._layersContainer) {
                    this.remove(this._layersContainer);
                }
                this._attributesInspector.unlink();
            }
            this._evts.forEach(e => e.unbind());
            this._evts.length = 0;

            this._clearAnimationSlots();
            this._clearMaskInspector();
        }
    }

    return {
        AnimComponentInspector: AnimComponentInspector
    };
})());
