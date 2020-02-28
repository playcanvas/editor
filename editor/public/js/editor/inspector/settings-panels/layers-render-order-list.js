Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'layers-settings-panel';
    const CLASS_RENDER_ORDER_LIST = CLASS_ROOT + '-render-order-list';
    const CLASS_RENDER_ORDER_LIST_CONTAINER = CLASS_RENDER_ORDER_LIST + '-container';
    const CLASS_RENDER_ORDER_LIST_ITEM = CLASS_RENDER_ORDER_LIST + '-item';
    const CLASS_RENDER_ORDER_LIST_ITEM_TRANSPARENT = CLASS_RENDER_ORDER_LIST_ITEM + '-transparent';

    class LayersSettingsPanelRenderOrderList extends pcui.Container {
        constructor(args) {
            args = Object.assign({}, args);

            super(args);

            this._args = args;
            this._layerEvents = [];

            this._layerListContainer = new pcui.Container();
            this.append(this._layerListContainer);

            const dragEndEvt = this._layerListContainer.on('child:dragend', (_, newIndex, oldIndex) => {
                this._projectSettings.move('layerOrder', oldIndex, newIndex);
            });

            this.once('destroy', () => {
                dragEndEvt.unbind();
            });

            this._layerList = [];

            this.class.add(CLASS_RENDER_ORDER_LIST_CONTAINER);
        }

        _updateLayerList() {
            const layers = this._projectSettings.get('layers');
            const order = this._projectSettings.get('layerOrder');
            order.forEach(layer => {
                if (!layers[layer.layer]) return;

                const name = layers[layer.layer].name;
                const transparent = layer.transparent;
                const layerPanel = new pcui.Panel({
                    headerText: name,
                    sortable: true,
                    removable: true,
                    class: CLASS_RENDER_ORDER_LIST_ITEM
                });
                if (transparent) {
                    layerPanel.class.add(CLASS_RENDER_ORDER_LIST_ITEM_TRANSPARENT);
                }
                if (layer.layer < 1000) {
                    layerPanel._btnRemove.disabled = true;
                }

                layerPanel.header.append(new pcui.Label({ text: transparent ? 'Transparent' : 'Opaque' }));
                const enabledCheckbox = new pcui.BooleanInput();
                this._layerEvents.push(enabledCheckbox.on('change', value => {
                    this._projectSettings.latest();
                    const order = this._projectSettings.get('layerOrder');
                    for (let i = 0; i < order.length; i++) {
                        if (order[i].layer === layer.layer && order[i].transparent === layer.transparent) {
                            this._projectSettings.set('layerOrder.' + i + '.enabled', value);
                            break;
                        }
                    }
                }));
                enabledCheckbox.value = layer.enabled;
                layerPanel.header.append(enabledCheckbox);

                this._layerEvents.push(layerPanel.on('click:remove', () => {
                    this._projectSettings.latest();
                    const order = this._projectSettings.get('layerOrder');
                    let index = null;
                    for (let i = 0, len = order.length; i < len; i++) {
                        if (order[i].layer === layer.layer && order[i].transparent === layer.transparent) {
                            index = i;
                            break;
                        }
                    }
                    if (index !== null) {
                        this._projectSettings.remove('layerOrder', index);
                    }
                }));

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


                this._layerList.push(layerPanel);
                this._layerListContainer.append(layerPanel);
            });
        }

        _clearLayerList() {
            this._layerList.forEach(layerPanel => {
                this._layerListContainer.remove(layerPanel);
                layerPanel.destroy();
            });
            this._layerList = [];
            this._layerEvents.forEach(evt => evt.unbind());
        }

        link(projectSettings) {
            this.unlink();
            this._projectSettings = projectSettings;
            this._updateLayerList();
            this._layerUpdateEvts = [];
            const events = ['*:set', '*:unset', 'layerOrder:remove', 'layerOrder:insert', 'layerOrder:move'];
            events.forEach(evt => {
                this._layerUpdateEvts.push(this._projectSettings.on(evt, () => {
                    this._clearLayerList();
                    this._updateLayerList();
                }));
            });
        }

        unlink() {
            if (!this._layerUpdateEvts) return;
            super.unlink();
            this._clearLayerList();
            this._layerUpdateEvts.forEach(evt => evt.unbind());
        }
    }

    return {
        LayersSettingsPanelRenderOrderList: LayersSettingsPanelRenderOrderList
    };
})());
