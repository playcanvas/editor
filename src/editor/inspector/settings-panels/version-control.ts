import type { Attribute } from '../attribute.type.d';

import { BaseSettingsPanel } from './base';
import type { BaseSettingsPanelArgs } from './base';

const ATTRIBUTES: Attribute[] = [
    {
        observer: 'settings',
        label: 'Auto-Load Diffs',
        path: 'editor.vcAutoLoadDiffs',
        alias: 'vcAutoLoadDiffs',
        reference: 'settings:vcAutoLoadDiffs',
        type: 'boolean'
    }
];

class VersionControlSettingsPanel extends BaseSettingsPanel {
    constructor(args: BaseSettingsPanelArgs) {
        args = Object.assign({}, args);
        args.headerText = 'VERSION CONTROL';
        args.attributes = ATTRIBUTES;
        args.userOnlySettings = true;
        args._tooltipReference = 'settings:versionControl';

        super(args);
    }
}

export { VersionControlSettingsPanel };
