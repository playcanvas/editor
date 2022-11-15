Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'layers-settings-panel';
    const CLASS_RENDER_ORDER_PANEL = CLASS_ROOT + '-render-order-panel';

    const ATTRIBUTES = [
        {
            observer: 'projectSettings',
            alias: 'addSubLayerButton',
            label: '',
            type: 'button',
            args: {
                text: 'ADD SUBLAYER',
                icon: 'E120'
            }
        },
        {
            observer: 'projectSettings',
            label: '',
            alias: 'addSubLayerSelect',
            type: 'select',
            args: {
                type: 'string',
                allowInput: true,
                placeholder: 'filter'
            }
        }
    ];

    class LayersSettingsPanelRenderOrderPanel extends pcui.BaseSettingsPanel {
        constructor(args) {
            args = Object.assign({}, args);
            args.attributes = ATTRIBUTES;
            args.headerText = 'RENDER ORDER';
            args.hideIcon = true;

            super(args);

            this._args = args;
            this._settings = args.settings;
            this._projectSettings = args.projectSettings;
            this._userSettings = args.userSettings;
            this._sceneSettings = args.sceneSettings;

            this.class.add(CLASS_RENDER_ORDER_PANEL);

            this._renderOrderList = new pcui.LayersSettingsPanelRenderOrderList(args);
            this.append(this._renderOrderList);

            this._addSubLayerButton = this._attributesInspector.getField('addSubLayerButton');
            this._addSubLayerSelect = this._attributesInspector.getField('addSubLayerSelect');

            this._addSubLayerSelect.hidden = true;

            this._addSubLayerButton.on('click', () => {
                this._addSubLayerButton.hidden = true;
                this._addSubLayerSelect.hidden = false;
                this._addSubLayerSelect.focus();
            });

            this._addSubLayerSelect.on('change', (value) => {
                if (value === '') return;
                const keyAndTransparency = value.split('.');
                const key = parseInt(keyAndTransparency[0], 10);
                const transparent = keyAndTransparency[1].indexOf('transparent') !== -1;
                this._projectSettings.insert('layerOrder', {
                    layer: key,
                    transparent: transparent,
                    enabled: true
                });
                this._addSubLayerSelect.values = [];
                this._addSubLayerSelect.value = null;
                this._updateAddSublayerOptions();
                this._addSubLayerButton.hidden = false;
                this._addSubLayerSelect.hidden = true;
            });

            this._addSubLayerSelect.on('blur', () => {
                let shouldClose = true;

                this._addSubLayerSelect._containerOptions.forEachChild((label) => {
                    if (label.dom.parentElement.querySelector(':hover') === label.dom) shouldClose = false;
                });
                if (shouldClose) {
                    this._addSubLayerButton.hidden = false;
                    this._addSubLayerSelect.hidden = true;
                }
            });

            this._updateAddSublayerOptions();

            this._layerUpdateEvts = [];
            const events = ['*:set', '*:unset', 'layerOrder:remove', 'layerOrder:insert', 'layerOrder:move'];
            events.forEach((evt) => {
                this._layerUpdateEvts.push(this._projectSettings.on(evt, () => {
                    this._updateAddSublayerOptions();
                }));
            });
            this.collapsed = false;
        }

        _updateAddSublayerOptions() {
            const projectSettings = this._projectSettings.latest();
            const layers = projectSettings.get('layers');
            if (!layers) return;

            const options = Object.keys(layers)
            .map((layerKey) => {
                return [{
                    v: layerKey + '.transparent',
                    t: layers[layerKey].name + ' Transparent',
                    layerKey,
                    transparent: true
                }, {
                    v: layerKey + '.opaque',
                    t: layers[layerKey].name + ' Opaque',
                    layerKey,
                    transparent: false
                }];
            })
            .filter((layer) => {
                return layer[0].layerKey >= 1000;
            })
            .flat()
            .filter((layer) => {
                const layerIsInLayerOrder = projectSettings.get('layerOrder').find((option) => {
                    return option.layer === parseInt(layer.layerKey, 10) && option.transparent === layer.transparent;
                });
                return !layerIsInLayerOrder;
            });
            this._addSubLayerSelect.options = options;
        }
    }

    return {
        LayersSettingsPanelRenderOrderPanel: LayersSettingsPanelRenderOrderPanel
    };
})());
