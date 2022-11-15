Object.assign(pcui, (function () {
    'use strict';

    const ATTRIBUTES = [
        {
            observer: 'projectSettings',
            label: 'Use Legacy Audio',
            type: 'boolean',
            path: 'useLegacyAudio'
        }
    ];

    class AudioSettingsPanel extends pcui.BaseSettingsPanel {
        constructor(args) {
            args = Object.assign({}, args);
            args.headerText = 'AUDIO';
            args.attributes = ATTRIBUTES;
            args._tooltipReference = 'settings:audio';

            super(args);
        }
    }

    return {
        AudioSettingsPanel: AudioSettingsPanel
    };
})());
