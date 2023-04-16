import { BaseSettingsPanel } from './base.js';

const ATTRIBUTES = [
    {
        observer: 'projectSettings',
        label: 'Assets',
        type: 'assets',
        path: 'i18nAssets',
        alias: 'localization.i18nAssets',
        args: {
            assetType: 'json'
        }
    },
    {
        label: '',
        type: 'button',
        alias: 'createAsset',
        args: {
            text: 'CREATE NEW ASSET',
            icon: 'E120'
        }
    }
];

class LocalizationSettingsPanel extends BaseSettingsPanel {
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'LOCALIZATION';
        args.attributes = ATTRIBUTES;
        args.splitReferencePath = false;
        args._tooltipReference = 'settings:localization';

        super(args);

        const createNewAssetEvt = this._attributesInspector.getField('createAsset').on('click', () => {
            const folder = editor.call('assets:panel:currentFolder');
            editor.assets.createI18n({
                name: 'Localization',
                folder: folder && folder.apiAsset
            })
            .catch((err) => {
                editor.call('status:error', err);
            });
        });

        this.once('destroy', () => {
            createNewAssetEvt.unbind();
        });
    }

    link(observers) {
        super.link(observers);
        if (!this._createAssetTooltip)
            this._createAssetTooltip = editor.call('attributes:reference:attach', 'settings:localization:createAsset', this._attributesInspector.getField('createAsset'));
    }
}

export { LocalizationSettingsPanel };
