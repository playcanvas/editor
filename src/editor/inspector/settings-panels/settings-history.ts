import { BaseSettingsPanel } from './base.ts';

/**
 * @import { Attribute } from '../attribute.type.d.ts'
 */

/**
 * Add a section titled 'SHOW SETTINGS HISTORY'
 * to the settings menu on the right, with a button shown
 * when expanded.
 *
 * @type {Attribute[]}
 */
const ATTRIBUTES = [
    {
        label: '',
        type: 'button',
        alias: 'settingsHistBtn',
        args: {
            text: 'SHOW PROJECT SETTINGS HISTORY',
            icon: 'E399'
        }
    }
];

class ProjectHistorySettingsPanel extends BaseSettingsPanel {
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'PROJECT SETTINGS HISTORY';
        args.attributes = ATTRIBUTES;
        args._tooltipReference = 'settings:settings-history';

        super(args);

        const histBtn = this._attributesInspector.getField('settingsHistBtn').on('click', () => {
            const itemId = `project_${config.project.id}`;

            editor.call('vcgraph:utils', 'launchItemHist', 'settings', itemId);
        });

        this.once('destroy', () => {
            histBtn.unbind();
        });
    }
}

export { ProjectHistorySettingsPanel };
