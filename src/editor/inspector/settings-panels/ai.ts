import { BaseSettingsPanel } from './base.ts';
import type { Attribute } from '../attribute.type.js';

const CLASS_ROOT = 'ai-settings-panel';
const CLASS_ATTRIBUTES = `${CLASS_ROOT}-attributes`;

const ATTRIBUTES: Attribute[] = [
    {
        observer: 'userSettings',
        label: 'Autocomplete Enabled',
        type: 'boolean',
        alias: 'autocompleteEnabled',
        reference: 'settings:autocompleteEnabled',
        path: 'editor.ai.autocompleteEnabled'
    },
    {
        observer: 'userSettings',
        label: 'Autocomplete Delay (ms)',
        type: 'slider',
        alias: 'autocompleteDelay',
        reference: 'settings:autocompleteDelay',
        path: 'editor.ai.autocompleteDelay',
        args: {
            precision: 1,
            step: 10,
            min: 100,
            max: 2000
        }
    }
];

class AISettingsPanel extends BaseSettingsPanel {
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'AI';
        args.attributes = ATTRIBUTES;
        args.userOnlySettings = true;
        args._tooltipReference = 'settings:ai';

        super(args);

        this._attributesInspector.class.add(CLASS_ATTRIBUTES);

        // Check if the user is logged in and has access to the autopilot
        const flags = config.self.flags;
        if (!flags || !(flags.hasAutocomplete || flags.superUser)) {
            this._attributesInspector.getField('editor.ai.autocompleteEnabled').parent.hidden = true;
            this._attributesInspector.getField('editor.ai.autocompleteDelay').parent.hidden = true;
        }
    }
}

export { AISettingsPanel };
