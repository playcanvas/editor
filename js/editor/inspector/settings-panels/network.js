Object.assign(pcui, (function () {
    const ATTRIBUTES = [
        {
            observer: 'projectSettings',
            label: 'Asset Retries',
            path: 'maxAssetRetries',
            type: 'number',
            reference: 'settings:project:maxAssetRetries',
            args: {
                min: 0,
                precision: 0
            }
        }
    ];

    class NetworkSettingsPanel extends pcui.BaseSettingsPanel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'NETWORK';
            args.attributes = ATTRIBUTES;
            args._tooltipReference = 'settings:network';

            super(args);
        }
    }

    return {
        NetworkSettingsPanel: NetworkSettingsPanel
    };
})());
