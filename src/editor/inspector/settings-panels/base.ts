import type { Observer } from '@playcanvas/observer';
import { Panel, Label } from '@playcanvas/pcui';

import { tooltip, tooltipRefItem } from '@/common/tooltips';

import { AttributesInspector } from '../attributes-inspector';

class BaseSettingsPanel extends Panel {
    _args: Record<string, unknown>;

    _entities: Observer[];

    _settings: Observer;

    _projectSettings: Observer;

    _userSettings: Observer;

    _sceneSettings: Observer;

    _sessionSettings: Observer;

    _attributesInspector: AttributesInspector;

    constructor(args: Record<string, unknown>) {
        args = Object.assign({}, args);
        args.collapsible = true;

        super(args);
        this._args = args;
        this._entities = args.entities as Observer[];
        this._settings = args.settings as Observer;
        this._projectSettings = args.projectSettings as Observer;
        this._userSettings = args.userSettings as Observer;
        this._sceneSettings = args.sceneSettings as Observer;
        this._sessionSettings = args.sessionSettings as Observer;

        this.collapsed = (args.collapsed ?? true) as boolean;

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

    _addTooltip(tooltipReference: string, userOnlySettings?: boolean) {
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
