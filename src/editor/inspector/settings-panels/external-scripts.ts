import { BaseSettingsPanel } from './base';
import type { Attribute } from '../attribute.type.d';

const ATTRIBUTES: Attribute[] = [
    {
        observer: 'projectSettings',
        label: 'URLs',
        type: 'array:select',
        path: 'externalScripts',
        alias: 'project.externalScripts',
        reference: 'settings:project:externalScripts',
        args: {
            type: 'string',
            elementArgs: {
                placeholder: 'URL'
            }
        }
    }
];

class ExternalScriptsSettingsPanel extends BaseSettingsPanel {
    constructor(args: Record<string, unknown>) {
        args = Object.assign({}, args);
        args.headerText = 'EXTERNAL SCRIPTS';
        args.attributes = ATTRIBUTES;
        args._tooltipReference = 'settings:external-scripts';

        super(args);
    }
}

export { ExternalScriptsSettingsPanel };
