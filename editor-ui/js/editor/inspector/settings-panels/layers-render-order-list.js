Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'layers-settings-panel';
    const CLASS_RENDER_ORDER_LIST = CLASS_ROOT + '-render-order-list';
    const CLASS_RENDER_ORDER_LIST_CONTAINER = CLASS_RENDER_ORDER_LIST + '-container';
    const CLASS_RENDER_ORDER_LIST_ITEM = CLASS_RENDER_ORDER_LIST + '-item';
    const CLASS_RENDER_ORDER_LIST_ITEM_TRANSPARENT = CLASS_RENDER_ORDER_LIST_ITEM + '-transparent';

    const REGEX_LAYER_ENABLED = /^layerOrder\.(\d+)\.enabled$/;
    class LayersSettingsPanelRenderOrderList extends pcui.Container {
        constructor(args) {
            args = Object.assign({}, args);

            super(args);

            this._args = args;
            this._settings = args.settings;
            this._projectSettings = args.projectSettings;
            this._userSettings = args.userSettings;
            this._sceneSettings = args.sceneSettings;
            this._suspendLayerEvents = false;

            this._layerListContainer = new pcui.Container();
            this.append(this._layerListContainer);

            this._layerListContainer.on('child:dragend', (_, newIndex, oldIndex) => {
                this._projectSettings.move('layerOrder', oldIndex, newIndex);
            });

            this._layerList = [];

            this.class.add(CLASS_RENDER_ORDER_LIST_CONTAINER);

            this._settingsEvnts = [];

            this._settingsEvnts.push(this._projectSettings.on('layerOrder:remove', this._onLayerRemove.bind(this)));
            this._settingsEvnts.push(this._projectSettings.on('layerOrder:insert', this._onLayerInsert.bind(this)));
            this._settingsEvnts.push(this._projectSettings.on('layerOrder:move', this._onLayerMove.bind(this)));
            this._settingsEvnts.push(this._projectSettings.on('*:set', this._onUpdateProjectSettings.bind(this)));

            const order = this._projectSettings.get('layerOrder');
            if (!order) return;

            order.forEach((layer, index) => {
                this._onLayerInsert(layer, index);
            });
        }

        _createLayerElement(layer, name) {
            const transparent = layer.transparent;
            const layerPanel = new pcui.Panel({
                headerText: name,
                sortable: true,
                removable: true,
                class: CLASS_RENDER_ORDER_LIST_ITEM
            });

            const evtName = this._projectSettings.on(`layers.${layer.layer}.name:set`, (value) => {
                layerPanel.headerText = value;
            });
            layerPanel.once('destroy', () => {
                evtName.unbind();
            });

            if (transparent) {
                layerPanel.class.add(CLASS_RENDER_ORDER_LIST_ITEM_TRANSPARENT);
            }
            if (layer.layer < 1000) {
                layerPanel._btnRemove.disabled = true;
            }

            layerPanel.header.append(
                new pcui.Label({
                    text: transparent ? 'Transparent' : 'Opaque'
                })
            );

            const enabledCheckbox = new pcui.BooleanInput({
                value: layer.enabled
            });

            enabledCheckbox.on('change', (value) => {
                if (this._suspendLayerEvents) return;
                const projectSettings = this._projectSettings.latest();
                const order = projectSettings.get('layerOrder');
                for (let i = 0; i < order.length; i++) {
                    if (order[i].layer === layer.layer && order[i].transparent === layer.transparent) {
                        this._suspendLayerEvents = true;
                        projectSettings.set('layerOrder.' + i + '.enabled', value);
                        this._suspendLayerEvents = false;
                        break;
                    }
                }
            });

            layerPanel._fieldEnabled = enabledCheckbox;

            layerPanel.header.append(enabledCheckbox);

            layerPanel.on('click:remove', () => {
                const projectSettings = this._projectSettings.latest();
                const order = projectSettings.get('layerOrder');
                let index = null;
                for (let i = 0, len = order.length; i < len; i++) {
                    if (order[i].layer === layer.layer && order[i].transparent === layer.transparent) {
                        index = i;
                        break;
                    }
                }
                if (index !== null) {
                    projectSettings.remove('layerOrder', index);
                }
            });

            let deleteTooltip;

            if (layer.layer < 1000) {
                deleteTooltip = Tooltip.attach({
                    target: layerPanel._btnRemove.element,
                    text: 'You cannot delete a built-in layer',
                    align: 'bottom',
                    root: editor.call('layout.root')
                });
            }

            layerPanel.once('destroy', () => {
                if (deleteTooltip) deleteTooltip.destroy();
            });

            return layerPanel;
        }

        _onLayerInsert(value, index) {
            if (value instanceof Observer) {
                value = value.json();
            }

            const name = this._projectSettings.get(`layers.${value.layer}.name`);
            const layerPanel = this._createLayerElement(value, name);

            this._layerList.splice(index, 0, layerPanel);
            const beforeElement = this._layerListContainer.dom.childNodes[index];
            this._layerListContainer.appendBefore(layerPanel, beforeElement && beforeElement.ui);
        }

        _onLayerRemove(value, index) {
            const layerPanel = this._layerList[index];
            if (layerPanel) {
                layerPanel.destroy();
                this._layerList.splice(index, 1);
            }
        }

        _onLayerMove(value, newIndex, oldIndex) {
            const layerPanel = this._layerList[oldIndex];
            if (layerPanel) {
                this._layerListContainer.remove(layerPanel);
                this._layerList.splice(oldIndex, 1);
                this._layerList.splice(newIndex, 0, layerPanel);
                const before = this._layerListContainer.dom.childNodes[newIndex];
                this._layerListContainer.appendBefore(layerPanel, before && before.ui);
            }
        }

        _onUpdateProjectSettings(path, value) {
            if (this._suspendLayerEvents) return;
            const match = path.match(REGEX_LAYER_ENABLED);
            if (match) {
                const projectSettings = this._projectSettings.latest();
                const order = projectSettings.get('layerOrder');
                const layer = order[match[1]];
                for (let i = 0; i < order.length; i++) {
                    if (order[i].layer === layer.layer && order[i].transparent === layer.transparent) {
                        const layerPanel = this._layerList[i];
                        if (layerPanel) {
                            this._suspendLayerEvents = true;
                            layerPanel._fieldEnabled.value = value;
                            this._suspendLayerEvents = false;
                        }
                        break;
                    }
                }
            }
        }

        destroy() {
            if (this._destroyed) return;

            this._layerList.length = 0;

            this._settingsEvnts.forEach(evt => evt.unbind());
            this._settingsEvnts.length = 0;

            super.destroy();
        }
    }

    return {
        LayersSettingsPanelRenderOrderList: LayersSettingsPanelRenderOrderList
    };
})());
