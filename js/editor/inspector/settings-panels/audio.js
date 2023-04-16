import { BaseSettingsPanel } from './base.js';

const ATTRIBUTES = [
    {
        observer: 'projectSettings',
        label: 'Use Legacy Audio',
        type: 'boolean',
        path: 'useLegacyAudio'
    }
];

class AudioSettingsPanel extends BaseSettingsPanel {
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'AUDIO';
        args.attributes = ATTRIBUTES;
        args._tooltipReference = 'settings:audio';

        super(args);
    }
}

export { AudioSettingsPanel };
