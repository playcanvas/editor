import { Panel, Label } from '@playcanvas/pcui';

import { tooltip, tooltipRefItem } from '@/common/tooltips';

import { AttributesInspector } from '../attributes-inspector';

class BaseSettingsPanel extends Panel {
    constructor(args: Record<string, unknown>) {
        args = Object.assign({}, args);
        args.collapsible = true;

        super(args);
        this._args = args;
        this._entities = args.entities;
        this._settings = args.settings;
        this._projectSettings = args.projectSettings;
        this._userSettings = args.userSettings;
        this._sceneSettings = args.sceneSettings;
        this._sessionSettings = args.sessionSettings;

        this.collapsed = args.collapsed ?? true;

        if (args.attributes) {
            this._attributesInspector = new AttributesInspector({
                history: args.history,
                assets: args.assets,
                settings: args.settings,
                projectSettings: args.projectSettings,
                userSettings: args.userSettings,
                sceneSettings: args.sceneSettings,
                sessionSettings: args.sessionSettings,
                attributes: args.attributes
            });
            this._attributesInspector.link([]);
            this.append(this._attributesInspector);
        }

        this.class.add('settings-panel');

        if (!args.hideIcon) {
            const settingsScopeIcon = new Label({ class: 'settings-scope-icon' });
            settingsScopeIcon.dom.setAttribute('data-icon', String.fromCodePoint(parseInt(args.userOnlySettings ? 'E337' : 'E217', 16)));
            this.header.append(settingsScopeIcon);
        }

        if (args._tooltipReference) {
            this._addTooltip(args._tooltipReference, args.userOnlySettings);
        }
    }

    _addTooltip(tooltipReference, userOnlySettings) {
        let ref = editor.call('attributes:reference:get', tooltipReference);
        if (!ref) {
            ref = {};
        }
        ref.subTitle = userOnlySettings ? 'These settings affect only you' : 'These settings affect all users on this branch';
        if (ref) {
            const item = tooltipRefItem({
                reference: ref
            });

            const subtitle = item.dom.children[1];
            if (userOnlySettings) {
                subtitle.classList.add('user-only');
            }
            subtitle.classList.add('settings-scope-tooltip');

            tooltip().attach({
                container: item,
                target: this.header
            });

            this.once('destroy', () => {
                item.destroy();
            });
        }
    }
}

export { BaseSettingsPanel };
