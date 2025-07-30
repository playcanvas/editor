import { Container } from '@playcanvas/pcui';

import { BaseSettingsPanel } from './base.ts';
import { LayersSettingsPanelLayerPanel } from './layers-layer-panel.ts';
import { LayersSettingsPanelRenderOrderPanel } from './layers-render-order.ts';
import { CLASS_ERROR } from '../../../common/pcui/constants.ts';

/**
 * @import { Attribute } from '../attribute.type.d.ts'
 */

const CLASS_ROOT = 'layers-settings-panel';
const CLASS_LAYERS_CONTAINER = `${CLASS_ROOT}-layers-container`;

const htmlSymbols = ['\'', '\\', '/', '"', '<', '>', '&', '`', '='];

/**
 * @type {Attribute[]}
 */
const ATTRIBUTES = [
    {
        label: 'New Layer',
        alias: 'newLayer',
        type: 'string',
        args: {
            placeholder: 'Name',
            onValidate: value => !!value && !htmlSymbols.some(symbol => value.includes(symbol))
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

const DOM = args => [
    {
        layersContainer: new Container({
            class: CLASS_LAYERS_CONTAINER
        })
    },
    {
        layersRenderOrderPanel: new LayersSettingsPanelRenderOrderPanel({
            settings: args.settings,
            projectSettings: args.projectSettings,
            userSettings: args.userSettings,
            sceneSettings: args.sceneSettings
        })
    }
];

class LayersSettingsPanel extends BaseSettingsPanel {
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'LAYERS';
        args.attributes = ATTRIBUTES;
        args._tooltipReference = 'settings:layers';

        super(args);

        this.buildDom(DOM(args));

        this._layerPanels = [];
        this._layerEvents = [];

        this._attributesInspector.getField('addLayer').on('click', this._addLayer.bind(this));

        this._loadLayers();

        this._layerEvents.push(this._projectSettings.on('*:set', () => {
            this._loadLayers();
        }));
        this._layerEvents.push(this._projectSettings.on('*:unset', () => {
            this._loadLayers();
        }));
    }

    _addLayer() {
        const layerNameField = this._attributesInspector.getField('newLayer');
        if (layerNameField.value === '' || htmlSymbols.some(symbol => layerNameField.value.includes(symbol))) {
            layerNameField.class.add(CLASS_ERROR);
            return;
        }

        const layer = {
            name: layerNameField.value,
            opaqueSortMode: 2,
            transparentSortMode: 3
        };

        let newLayerKey = null;
        let projectSettings = this._projectSettings;

        const redo = () => {
            projectSettings = projectSettings.latest();
            projectSettings.history.enabled = false;
            // find max key to insert new layer
            let maxKey = 1000; // start at 1000 for user layers
            const layers = projectSettings.get('layers');
            for (const key in layers) {
                maxKey = Math.max(parseInt(key, 10) + 1, maxKey);
            }
            // create new layer
            newLayerKey = maxKey;
            projectSettings.set(`layers.${newLayerKey}`, layer);
            projectSettings.history.enabled = true;
        };

        const undo = () => {
            projectSettings = projectSettings.latest();
            projectSettings.history.enabled = false;
            // remove any sublayers that might have
            // been created by another user
            const order = projectSettings.get('layerOrder');
            let i = order.length;
            while (i--) {
                if (order[i].layer === newLayerKey) {
                    projectSettings.remove('layerOrder', i);
                }
            }
            projectSettings.unset(`layers.${newLayerKey}`);
            newLayerKey = null;
            projectSettings.history.enabled = true;
        };

        if (this._args.history) {
            this._args.history.add({
                name: 'new layer',
                undo,
                redo
            });
        }

        redo();
        layerNameField.class.remove(CLASS_ERROR);
    }

    _loadLayers() {
        const layers = this._projectSettings.get('layers');
        if (!layers) return;

        const keepLayerPanels = [];
        this._layerPanels.forEach((layerPanel) => {
            if (layers[layerPanel.layerKey]) {
                keepLayerPanels.push(layerPanel);
            } else {
                this._layersContainer.remove(layerPanel);
            }
        });
        this._layerPanels = keepLayerPanels;

        Object.keys(layers).forEach((layerKey) => {
            let layerPanel = this._layerPanels.find(layerPanel => layerPanel.layerKey === layerKey);
            if (!layerPanel) {
                layerPanel = new LayersSettingsPanelLayerPanel({
                    history: this._args.history,
                    settings: this._args.settings,
                    projectSettings: this._args.projectSettings,
                    userSettings: this._args.userSettings,
                    sceneSettings: this._args.sceneSettings,
                    layerKey
                });
                layerPanel.layerKey = layerKey;
                this._layerPanels.push(layerPanel);
                this._layersContainer.append(layerPanel);
            }
        });
    }
}

export { LayersSettingsPanel };
