editor.once('load', function () {
    'use strict';

    const settingsArgs = {
        assets: editor.call('assets:raw'),
        entities: editor.call('entities:list'),
        history: editor.call('editor:history'),
        settings: editor.call('settings:projectUser'),
        projectSettings: editor.call('settings:project'),
        userSettings: editor.call('settings:user'),
        sceneSettings: editor.call('sceneSettings')
    };

    const settingsContainer = new pcui.Settings(settingsArgs);

    editor.on('attributes:beforeClear', () => {
        settingsContainer.unlink();
        if (settingsContainer.parent) {
            settingsContainer.parent.remove(settingsContainer);
        }
    });

    editor.on('attributes:inspect[editorSettings]', () => {
        const root = editor.call('attributes.rootPanel');

        if (!settingsContainer.parent)
            root.append(settingsContainer);
        // settingsContainer.link([]);
    });

});

Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'settings';

    const SETTING_TYPES = [
        'editor',
        'physics',
        'rendering',
        'layers',
        'lightmapping',
        'batchgroups',
        'loadingscreen',
        'externalscripts',
        'input',
        'localization',
        'assettasks',
        'scripts'
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
                attributes: SCENE_ATTRIBUTES,
                settings: parent._args.settings,
                projectSettings: parent._args.projectSettings,
                userSettings: parent._args.userSettings,
                sceneSettings: parent._args.sceneSettings
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
                const sceneNameField = this._sceneAttributes.getField('name');
                sceneNameField.value = this._sceneName;
            });
            editor.on('realtime:scene:op:name', (op) => {
                editor.emit('scene:name', op.oi);
            });

            // Load settings panels
            this._settingsPanels = [];

            SETTING_TYPES.forEach(setting => {
                const cls = `${setting[0].toUpperCase()}${setting.substring(1)}SettingsPanel`;
                const panel = new pcui[cls]({
                    history: args.history,
                    assets: args.assets,
                    entities: args.entities,
                    settings: args.settings,
                    projectSettings: args.projectSettings,
                    userSettings: args.userSettings,
                    sceneSettings: args.sceneSettings
                });
                this._settingsPanels[setting] = panel;

                this.append(panel);
            });

            this._linkSceneNameField();

            SCENE_ATTRIBUTES.forEach((attr, i) => {
                if (attr.reference && !attr.tooltip) {
                    const attributeLabel = this._sceneAttributes.getField(attr.path || attr.alias).parent.label;
                    SCENE_ATTRIBUTES[i].tooltip = editor.call('attributes:reference:attach', attr.reference, attributeLabel);
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
    }

    return {
        Settings: Settings
    };
})());
