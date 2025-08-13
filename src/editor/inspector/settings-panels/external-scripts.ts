import { BaseSettingsPanel } from './base.ts';

/** @import { Attribute } from '../attribute.type.d.ts' */

/**
 * @type {Attribute[]}
 */
const ATTRIBUTES = [
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
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'EXTERNAL SCRIPTS';
        args.attributes = ATTRIBUTES;
        args._tooltipReference = 'settings:external-scripts';

        super(args);
    }
}

export { ExternalScriptsSettingsPanel };
