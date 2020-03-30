Object.assign(pcui, (function () {
    'use strict';

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

    class LocalizationSettingsPanel extends pcui.BaseSettingsPanel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'LOCALIZATION';
            args.attributes = ATTRIBUTES;
            args.splitReferencePath = false;

            super(args);

            const createNewAssetEvt = this._attributesInspector.getField('createAsset').on('click', () => {
                editor.call('assets:create:i18n');
            });

            this.once('destroy', () => {
                createNewAssetEvt.unbind();
            });

            editor.once('assets:load', () => {
                const i18nAssets = this._attributesInspector.getField('i18nAssets');
                const value = i18nAssets.value;
                i18nAssets.value = [];
                i18nAssets.value = value;
            });

        }

        link(observers) {
            super.link(observers);
            if (!this._createAssetTooltip)
                this._createAssetTooltip = editor.call('attributes:reference:attach', 'settings:localization:createAsset', this._attributesInspector.getField('createAsset'));
        }
    }

    return {
        LocalizationSettingsPanel: LocalizationSettingsPanel
    };
})());
