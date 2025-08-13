import type { Asset } from '@playcanvas/editor-api';
import { Container, Button } from '@playcanvas/pcui';

import { BaseSettingsPanel } from './base.ts';
import { LegacyTooltip } from '../../../common/ui/tooltip.ts';
import type { Attribute } from '../attribute.type.d.ts';

/**
 * @type {Attribute[]}
 */
const ATTRIBUTES = [
    {
        observer: 'projectSettings',
        label: 'Script',
        type: 'asset',
        args: {
            assetType: 'script'
        },
        alias: 'loadingScreenScript'
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

class LoadingScreenSettingsPanel extends BaseSettingsPanel {
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'LOADING SCREEN';
        args.attributes = ATTRIBUTES;
        args._tooltipReference = 'settings:loading-screen';

        super(args);

        this.buildDom(DOM());

        this._selectExistingButton.on('click', this._clickSelectExisting.bind(this));
        this._createDefaultButton.on('click', this._clickCreateDefault.bind(this));
        this._attributesInspector.getField('loadingScreenScript').on('change', (value) => {
            if (this._projectSettings) {
                this._projectSettings.set('loadingScreenScript', value ? value.toString() : null);
            }
        });


        this._selectExistingTooltip = LegacyTooltip.attach({
            target: this._selectExistingButton.element,
            text: 'Select an existing loading screen script',
            align: 'bottom',
            root: editor.call('layout.root')
        });

        this._createDefaultTooltip = LegacyTooltip.attach({
            target: this._createDefaultButton.element,
            text: 'Create a default loading script',
            align: 'bottom',
            root: editor.call('layout.root')
        });

        editor.once('assets:load', () => {
            this._loadLayout();
        });
        this._projectSettings.on('*:set', (path) => {
            if (path === 'loadingScreenScript') {
                this._loadLayout();
            }
        });
    }

    _loadLayout() {
        const scriptId = this._projectSettings.get('loadingScreenScript');
        const asset = this._args.assets.get(scriptId);
        if (scriptId && asset) {
            this._attributesInspector.getField('loadingScreenScript').hidden = false;
            this._buttonContainer.hidden = true;
            this._attributesInspector.getField('loadingScreenScript').value = parseInt(scriptId, 10);
        } else {
            this._attributesInspector.getField('loadingScreenScript').hidden = true;
            this._buttonContainer.hidden = false;
        }
    }

    _setLoadingScreen(asset) {
        const id = asset && asset.get ? asset.get('id') : null;
        if (id) {
            this._projectSettings.set('loadingScreenScript', id.toString());
        }
    }

    _clickSelectExisting() {
        let evtPick = editor.once('picker:asset', (asset) => {
            this._setLoadingScreen(asset);
            evtPick = null;
        });
        // show asset picker
        editor.call('picker:asset', { type: 'script' });
        editor.once('picker:asset:close', () => {
            if (evtPick) {
                evtPick.unbind();
                evtPick = null;
            }
        });
    }

    _clickCreateDefault() {
        const folder = editor.call('sourcefiles:loadingScreen:skeleton');
        editor.call('picker:script-create', (filename) => {
            editor.call('assets:create:script', {
                filename: filename,
                parent: folder && folder.apiAsset,
                text: editor.call('sourcefiles:loadingScreen:skeleton')
            }, (asset: Asset) => {
                this._setLoadingScreen(asset.observer);
            });
        });
    }
}

export { LoadingScreenSettingsPanel };
