Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'layers-settings-panel';
    const CLASS_LAYERS_CONTAINER = CLASS_ROOT + '-layers-container';

    const ATTRIBUTES = [
        {
            label: 'New Layer',
            alias: 'newLayer',
            type: 'string',
            args: {
                placeholder: 'Name',
                onValidate: value => value !== '' || value !== undefined || value !== null
            }
        },
        {
            label: ' ',
            alias: 'addLayer',
            type: 'button',
            args: {
                text: 'ADD LAYER',
                icon: 'E120'
            }
        }
    ];

    const DOM = () => [
        {
            layersContainer: new pcui.Container({
                class: CLASS_LAYERS_CONTAINER
            })
        },
        {
            layersRenderOrderPanel: new pcui.LayersSettingsPanelRenderOrderPanel()
        }
    ];

    class LayersSettingsPanel extends pcui.BaseSettingsPanel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'LAYERS';
            args.attributes = ATTRIBUTES;

            super(args);

            this.buildDom(DOM());

            this._layerPanels = [];
            this._layerEvents = [];

            const clickAddLayerEvt = this._attributesInspector.getField('addLayer').on('click', this._addLayer.bind(this));
            this.once('destroy', () => {
                clickAddLayerEvt.unbind();
            });
        }

        _addLayer() {
            const layerNameField = this._attributesInspector.getField('newLayer');
            if (layerNameField.value === '') {
                layerNameField.class.add(pcui.CLASS_ERROR);
                return;
            }

            const layer = {
                name: layerNameField.value,
                opaqueSortMode: 2,
                transparentSortMode: 3
            };

            let newLayerKey = null;
            const projectSettings = this._projectSettings;

            const redo = () => {
                projectSettings.latest();
                projectSettings.history.enabled = false;
                // find max key to insert new layer
                var maxKey = 1000; // start at 1000 for user layers
                var layers = projectSettings.get('layers');
                for (var key in layers) {
                    maxKey = Math.max(parseInt(key, 10) + 1, maxKey);
                }
                // create new layer
                newLayerKey = maxKey;
                projectSettings.set('layers.' + newLayerKey, layer);
                projectSettings.history.enabled = true;
            };

            const undo = () => {
                projectSettings.latest();
                projectSettings.history.enabled = false;
                // remove any sublayers that might have
                // been created by another user
                var order = projectSettings.get('layerOrder');
                var i = order.length;
                while (i--) {
                    if (order[i].layer === newLayerKey) {
                        projectSettings.remove('layerOrder', i);
                    }
                }
                projectSettings.unset('layers.' + newLayerKey);
                newLayerKey = null;
                projectSettings.history.enabled = true;
            };

            this._args.history.add({
                name: 'new layer',
                undo,
                redo
            });

            redo();
            layerNameField.class.remove(pcui.CLASS_ERROR);
        }

        _loadLayers(observers) {
            Object.keys(this._projectSettings.get('layers')).forEach(layerKey => {
                const layerPanel = new pcui.LayersSettingsPanelLayerPanel({ history: this._args.history, layerKey });
                layerPanel.link(observers);
                this._layerPanels.push(layerPanel);
                this._layersContainer.append(layerPanel);
            });
        }

        _removeLayers() {
            this._layerPanels.forEach(layerPanel => {
                layerPanel.unlink();
                this._layersContainer.remove(layerPanel);
            });
            this._layerPanels = [];
        }

        link(observers) {
            super.link(observers);
            this._loadLayers(observers);

            this._layerEvents.push(this._projectSettings.on('*:set', () => {
                this._removeLayers();
                this._loadLayers(observers);
            }));
            this._layerEvents.push(this._projectSettings.on('*:unset', () => {
                this._removeLayers();
                this._loadLayers(observers);
            }));

            this._layersRenderOrderPanel.link(observers);
        }

        unlink() {
            super.unlink();
            this._removeLayers();
            this._layerEvents.forEach(evt => evt.unbind());
            this._layerEvents = [];
            this._layersRenderOrderPanel.unlink();
        }
    }

    return {
        LayersSettingsPanel: LayersSettingsPanel
    };
})());
