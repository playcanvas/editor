Object.assign(pcui, (function () {
    'use strict';

    class BaseSettingsPanel extends pcui.Panel {
        constructor(args) {
            args = Object.assign({}, args);
            args.collapsible = true;

            super(args);
            this._args = args;

            this._attributesInspector = new pcui.AttributesInspector({
                history: args.history,
                assets: args.assets,
                attributes: this._generateAttributeReferences(args.attributes, args.splitReferencePath)
            });
            this.append(this._attributesInspector);
        }


        _generateAttributeReferences(attributes, split = true) {
            return attributes.map(attr => {
                const path = attr.alias || attr.path;
                if (!path) return attr;
                if (split) {
                    const parts = path.split('.');
                    attr.reference = `settings:${parts[parts.length - 1]}`;
                } else {
                    attr.reference = `settings:${path}`.replace('.', ':');
                }
                return attr;
            });
        }


        link({ settings, projectSettings, userSettings, sceneSettings }) {
            this.unlink();
            this._settings = settings;
            this._projectSettings = projectSettings;
            this._userSettings = userSettings;
            this._sceneSettings = sceneSettings;

            if (!this._hasVisited) {
                this._hasVisited = true;
                this.collapsed = true;
            }
            this._attributesInspector.link({ settings, projectSettings, userSettings, sceneSettings });
            this._args.attributes.forEach((attr, i) => {
                if (attr.reference && !attr.tooltip) {
                    if (attr.type === 'asset') {
                        const attributeElement = this._attributesInspector.getField(attr.path || attr.alias);
                        this._args.attributes[i].tooltip = editor.call('attributes:reference:attach', attr.reference, attributeElement.label);
                    } else {
                        const attributeLabel = this._attributesInspector.getField(attr.path || attr.alias).parent.label;
                        this._args.attributes[i].tooltip = editor.call('attributes:reference:attach', attr.reference, attributeLabel);
                    }
                }
            });
        }

        unlink() {
            if (!this._settings)
                return;

            this._settings = null;
            this._projectSettings = null;
            this._userSettings = null;
            this._sceneSettings = null;

            this._attributesInspector.unlink();
        }
    }

    return {
        BaseSettingsPanel: BaseSettingsPanel
    };
})());
