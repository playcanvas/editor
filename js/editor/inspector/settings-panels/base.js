import { Panel, Label } from '@playcanvas/pcui';

Object.assign(pcui, (function () {
    class BaseSettingsPanel extends Panel {
        constructor(args) {
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

            this.collapsed = true;

            if (args.attributes) {
                this._attributesInspector = new pcui.AttributesInspector({
                    history: args.history,
                    assets: args.assets,
                    settings: args.settings,
                    projectSettings: args.projectSettings,
                    userSettings: args.userSettings,
                    sceneSettings: args.sceneSettings,
                    sessionSettings: args.sessionSettings,
                    attributes: this._generateAttributeReferences(args.attributes, args.splitReferencePath)
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
                this._panelTooltip = new pcui.TooltipReference({
                    reference: ref
                });

                this._panelTooltip.attach({
                    target: this.header
                });

                this.once('destroy', () => {
                    this._panelTooltip.destroy();
                    this._panelTooltip = null;
                });
                this._panelTooltip.dom.childNodes[1].setAttribute('data-icon', String.fromCodePoint(parseInt(userOnlySettings ? 'E337' : 'E217', 16)));
                this._panelTooltip.dom.childNodes[1].classList.add('settings-scope-tooltip');
                var before = this._panelTooltip.dom.children[1];
                var child = this._panelTooltip.dom.children[2];
                this._panelTooltip.dom.removeChild(child);
                this._panelTooltip.dom.insertBefore(child, before);
            }
        }


        _generateAttributeReferences(attributes, split = true) {
            if (this._args.noReferences)
                return attributes;
            return attributes.map((attr) => {
                if (attr.reference) return attr;

                const path = attr.alias || attr.path;
                if (!path) return attr;
                if (split) {
                    const parts = path.split('.');
                    attr.reference = `settings:${parts[parts.length - 1]}`;
                } else {
                    attr.reference = `settings:${path}`.split('.').join(':');
                }
                return attr;
            });
        }
    }

    return {
        BaseSettingsPanel: BaseSettingsPanel
    };
})());
