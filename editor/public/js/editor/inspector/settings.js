Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'settings';

    const SETTING_TYPES = [
        'editor'
    ];

    const SCENE_ATTRIBUTES = [
        {
            label: 'Scene Name',
            alias: 'name',
            type: 'string',
            reference: 'settings:name'
        }
    ];

    SCENE_ATTRIBUTES.forEach(attr => {
        const path = attr.alias || attr.path;
        if (!path) return;
        const parts = path.split('.');
        attr.reference = `settings:${parts[parts.length - 1]}`;
    });

    const DOM = parent => [
        {
            sceneAttributes: new pcui.AttributesInspector({
                attributes: SCENE_ATTRIBUTES
            })
        }
    ];

    class Settings extends pcui.Container {
        constructor(args) {
            if (!args) args = {};
            args.flex = true;

            super(args);
            this._args = args;
            this._settingsEvents = [];

            this.class.add(CLASS_ROOT);

            this.buildDom(DOM(this));

            // Setup Scene Name attribute
            this._sceneName = 'Untitled';
            editor.on('scene:raw', (data) => {
                editor.emit('scene:name', data.name);
                this._sceneName = data.name;
            });
            editor.on('realtime:scene:op:name', (op) => {
                editor.emit('scene:name', op.oi);
            });

            // Load settings panels
            this._settingsPanels = [];

            SETTING_TYPES.forEach(setting => {
                // check if class exists
                const cls = `${setting[0].toUpperCase()}${setting.substring(1)}SettingsPanel`;
                if (pcui.hasOwnProperty(cls)) {
                    const panel = new pcui[cls]();
                    this._settingsPanels[setting] = panel;

                    this.append(panel);
                }
            });
        }

        _linkSceneNameField() {
            const sceneNameField = this._sceneAttributes.getField('name');
            sceneNameField.value = this._sceneName;
            this._settingsEvents.push(sceneNameField.on('change', newSceneName => {
                editor.call('realtime:scene:op', {
                    p: ['name'],
                    od: this._sceneName || '',
                    oi: newSceneName || ''
                });
                this._sceneName = newSceneName;
                editor.emit('scene:name', newSceneName);
            }));
        }

        link(settings, projectSettings, userSettings) {
            this.unlink();

            this._linkSceneNameField();

            SETTING_TYPES.forEach(setting => {
                this._settingsPanels[setting].link(settings, projectSettings, userSettings);
            });

            SCENE_ATTRIBUTES.forEach((attr, i) => {
                if (attr.reference && !attr.tooltip) {
                    const attributeLabel = this._sceneAttributes.getField(attr.path || attr.alias).parent.label;
                    SCENE_ATTRIBUTES[i].tooltip = editor.call('attributes:reference:attach', attr.reference, attributeLabel);
                }
            });

            /* TODO: Remove these */
            window._settings = settings;
            window._projectSettings = projectSettings;
            window._userSettings = userSettings;
        }

        unlink() {
            this._settingsEvents.forEach(evt => evt.unbind());
            this._settingsEvents = [];

            SETTING_TYPES.forEach(setting => {
                this._settingsPanels[setting].unlink();
            });
        }
    }

    return {
        Settings: Settings
    };
})());
