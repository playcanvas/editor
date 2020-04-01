Object.assign(pcui, (function () {
    'use strict';

    class BaseSettingsPanel extends pcui.Panel {
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

            this.collapsed = true;

            if (args.attributes) {
                this._attributesInspector = new pcui.AttributesInspector({
                    history: args.history,
                    assets: args.assets,
                    settings: args.settings,
                    projectSettings: args.projectSettings,
                    userSettings: args.userSettings,
                    sceneSettings: args.sceneSettings,
                    attributes: this._generateAttributeReferences(args.attributes, args.splitReferencePath)
                });
                this._attributesInspector.link([]);
                this.append(this._attributesInspector);
            }

        }


        _generateAttributeReferences(attributes, split = true) {
            if (this._args.noReferences)
                return attributes;
            return attributes.map(attr => {
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
