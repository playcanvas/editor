import { BaseSettingsPanel } from './base';
import type { Attribute } from '../attribute.type.d';

const CLASS_ROOT = 'launch-page-settings-panel';
const CLASS_ATTRIBUTES = `${CLASS_ROOT}-attributes`;

const ATTRIBUTES: Attribute[] = [
    {
        observer: 'projectSettings',
        label: 'Enable SharedArrayBuffer',
        type: 'boolean',
        path: 'enableSharedArrayBuffer',
        alias: 'project.enableSharedArrayBuffer',
        reference: 'settings:project:enableSharedArrayBuffer'
    }
];

class LaunchPageSettingsPanel extends BaseSettingsPanel {
    constructor(args: Record<string, unknown>) {
        args = Object.assign({}, args);
        args.headerText = 'LAUNCH PAGE';
        args.attributes = ATTRIBUTES;
        args._tooltipReference = 'settings:launch-page';

        super(args);

        this._attributesInspector.class.add(CLASS_ATTRIBUTES);
    }
}

export { LaunchPageSettingsPanel };
