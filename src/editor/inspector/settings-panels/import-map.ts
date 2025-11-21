import { Container, Button } from '@playcanvas/pcui';

import { BaseSettingsPanel } from './base';
import { LegacyTooltip } from '@/common/ui/tooltip';
import type { Attribute } from '../attribute.type.d';

const ATTRIBUTES: Attribute[] = [
    {
        observer: 'projectSettings',
        label: 'Json',
        type: 'asset',
        args: {
            assetType: 'json'
        },
        alias: 'importMap'
    }
];

const DOM = () => [
    {
        root: {
            buttonContainer: new Container({
                flex: true,
                flexDirection: 'row'
            })
        },
        children: [
            {
                createDefaultButton: new Button({
                    text: 'CREATE DEFAULT',
                    icon: 'E120',
                    flexGrow: 1
                })
            },
            {
                selectExistingButton: new Button({
                    text: 'SELECT EXISTING',
                    icon: 'E184',
                    flexGrow: 1
                })
            }
        ]
    }
];

class ImportMapSettingsPanel extends BaseSettingsPanel {
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'IMPORT MAP';
        args.attributes = ATTRIBUTES;
        args._tooltipReference = 'settings:import-map';

        super(args);

        this.buildDom(DOM());

        this._selectExistingButton.on('click', this._clickSelectExisting.bind(this));
        this._createDefaultButton.on('click', this._clickCreateDefault.bind(this));
        this._attributesInspector.getField('importMap').on('change', (value) => {
            if (this._projectSettings) {
                this._projectSettings.set('importMap', value ? value.toString() : null);
            }
        });


        this._selectExistingTooltip = LegacyTooltip.attach({
            target: this._selectExistingButton.element,
            text: 'Select an existing Import Map',
            align: 'bottom',
            root: editor.call('layout.root')
        });

        this._createDefaultTooltip = LegacyTooltip.attach({
            target: this._createDefaultButton.element,
            text: 'Create a default Import Map',
            align: 'bottom',
            root: editor.call('layout.root')
        });

        editor.once('assets:load', () => {
            this._loadLayout();
        });
        this._projectSettings.on('*:set', (path) => {
            if (path === 'importMap') {
                this._loadLayout();
            }
        });
    }

    _loadLayout() {
        const id = this._projectSettings.get('importMap');
        const asset = this._args.assets.get(id);
        if (id && asset) {
            this._attributesInspector.getField('importMap').hidden = false;
            this._buttonContainer.hidden = true;
            this._attributesInspector.getField('importMap').value = parseInt(id, 10);
        } else {
            this._attributesInspector.getField('importMap').hidden = true;
            this._buttonContainer.hidden = false;
        }
    }

    _setImportMap(asset) {
        const id = asset && asset.get ? asset.get('id') : null;
        if (id) {
            this._projectSettings.set('importMap', id.toString());
        }
    }

    _clickSelectExisting() {
        let evtPick = editor.once('picker:asset', (asset) => {
            this._setImportMap(asset);
            evtPick = null;
        });
        // show asset picker
        editor.call('picker:asset', { type: 'json' });
        editor.once('picker:asset:close', () => {
            if (evtPick) {
                evtPick.unbind();
                evtPick = null;
            }
        });
    }

    _clickCreateDefault() {
        this._createDefaultButton.disabled = true;
        editor.call('assets:create:json', {
            name: 'Import Map',
            json: JSON.stringify({ imports: {} }, null, 2),
            spaces: 2,
            noSelect: true,
            callback: (err, id) => {
                this._createDefaultButton.disabled = false;
                if (err) {
                    console.error(err);
                    return;
                }
                const asset = editor.call('assets:get', id);
                this._setImportMap(asset);
            }
        });
    }
}

export { ImportMapSettingsPanel };
