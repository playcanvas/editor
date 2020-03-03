Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'layers-settings-panel';
    const CLASS_LAYER_PANEL = CLASS_ROOT + '-layer-panel';

    const ATTRIBUTES = args => [
        {
            observer: 'projectSettings',
            label: 'Name',
            path: `layers.${args.layerKey}.name`,
            type: 'string'
        },
        {
            observer: 'projectSettings',
            label: 'Opaque Sort',
            path: `layers.${args.layerKey}.opaqueSortMode`,
            type: 'select',
            alias: 'layers:opaqueSort',
            args: {
                type: 'number',
                options: [
                    { v: 0, t: 'None' },
                    { v: 1, t: 'Manual' },
                    { v: 2, t: 'Material / Mesh' },
                    { v: 3, t: 'Back To Front' },
                    { v: 4, t: 'Front To Back' }
                ]
            }
        },
        {
            observer: 'projectSettings',
            label: 'Transparent Sort',
            path: `layers.${args.layerKey}.transparentSortMode`,
            type: 'select',
            alias: 'layers:transparentSort',
            args: {
                type: 'number',
                options: [
                    { v: 0, t: 'None' },
                    { v: 1, t: 'Manual' },
                    { v: 2, t: 'Material / Mesh' },
                    { v: 3, t: 'Back To Front' },
                    { v: 4, t: 'Front To Back' }
                ]
            }
        }
    ];

    class LayersSettingsPanelLayerPanel extends pcui.BaseSettingsPanel {
        constructor(args) {
            args = Object.assign({}, args);
            args.attributes = ATTRIBUTES(args);
            args.removable = true;
            args.noReferences = true;

            super(args);

            this._args = args;

            this.class.add(CLASS_LAYER_PANEL);

            const nameChangeEvt = this._attributesInspector.getField(`layers.${this._args.layerKey}.name`).on('change', value => {
                this.headerText = value;
            });

            this.disabled = args.layerKey < 1000;
            const removeLayerEvt = this.on('click:remove', () => {
                this._removeLayer();
            });

            let deleteTooltip;

            if (this.disabled) {
                deleteTooltip = Tooltip.attach({
                    target: this._btnRemove.element,
                    text: 'You cannot delete a built-in layer',
                    align: 'bottom',
                    root: editor.call('layout.root')
                });
            }

            this.once('destroy', () => {
                nameChangeEvt.unbind();
                removeLayerEvt.unbind();
                if (deleteTooltip) deleteTooltip.destroy();
            });
        }

        _removeLayer() {
            let prev = null;
            let prevSublayers = [];
            const projectSettings = this._projectSettings;

            const redo = () => {
                projectSettings.latest();
                const history = projectSettings.history;
                projectSettings.history.enabled = false;
                prev = projectSettings.get('layers.' + this._args.layerKey);
                projectSettings.unset('layers.' + this._args.layerKey);

                prevSublayers = [];
                const order = projectSettings.get('layerOrder');
                let i = order.length;
                while (i--) {
                    if (!projectSettings.get('layers')[order[i].layer]) {
                        projectSettings.remove('layerOrder', i);
                        prevSublayers.unshift({
                            index: i,
                            transparent: order[i].transparent,
                            enabled: order[i].enabled
                        });
                    }
                }

                projectSettings.history.enabled = history;
            };

            const undo = () => {
                projectSettings.latest();
                const history = projectSettings.history;
                projectSettings.history.enabled = false;
                projectSettings.set('layers.' + this._args.layerKey, prev);

                const layerOrder = projectSettings.getRaw('layerOrder');

                for (let i = 0; i < prevSublayers.length; i++) {
                    const idx = prevSublayers[i].index;
                    const transparent = prevSublayers[i].transparent;
                    const enabled = prevSublayers[i].enabled;
                    projectSettings.insert('layerOrder', {
                        layer: parseInt(this._args.layerKey, 10),
                        transparent: transparent,
                        enabled: enabled
                    },  Math.min(idx, layerOrder.length));
                }

                prevSublayers = [];
                prev = null;

                projectSettings.history.enabled = history;
            };

            this._args.history.add({
                name: 'delete layer',
                undo,
                redo
            });

            redo();
        }

        link(observers) {
            super.link(observers);
            this.headerText = this._projectSettings.get('layers')[this._args.layerKey].name;

            this._nameLabel = this._attributesInspector.getField(`layers.${this._args.layerKey}.name`).parent.label;
            if (!this._nameLabelTooltip)
                this._nameLabelTooltip = editor.call('attributes:reference:attach', `settings:layers:name`, this._nameLabel);

            this._opaqueSortLabel = this._attributesInspector.getField(`layers.${this._args.layerKey}.opaqueSortMode`).parent.label;
            if (!this._opaqueSortLabelTooltip)
                this._opaqueSortLabelTooltip = editor.call('attributes:reference:attach', `settings:layers:opaqueSort`, this._opaqueSortLabel);

            this._tansparentSortModeLabel = this._attributesInspector.getField(`layers.${this._args.layerKey}.transparentSortMode`).parent.label;
            if (!this._tansparentSortModeLabelTooltip)
                this._tansparentSortModeLabelTooltip = editor.call('attributes:reference:attach', 'settings:layers:transparentSort', this._tansparentSortModeLabel);
        }

        unlink() {
            super.unlink();
        }
    }

    return {
        LayersSettingsPanelLayerPanel: LayersSettingsPanelLayerPanel
    };
})());
