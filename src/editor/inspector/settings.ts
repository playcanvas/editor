import { SettingsPanel } from './settings-panel.ts';

editor.once('load', () => {
    const settingsArgs = {
        assets: editor.call('assets:raw'),
        entities: editor.call('entities:list'),
        history: editor.api.globals.history,
        settings: editor.call('settings:projectUser'),
        projectSettings: editor.call('settings:project'),
        userSettings: editor.call('settings:user'),
        sceneSettings: editor.call('sceneSettings'),
        sessionSettings: editor.call('settings:session')
    };

    const settingsContainer = new SettingsPanel(settingsArgs);

    editor.on('attributes:beforeClear', () => {
        settingsContainer.unlink();
        if (settingsContainer.parent) {
            settingsContainer.parent.remove(settingsContainer);
        }
    });

    editor.on('attributes:inspect[editorSettings]', () => {
        const root = editor.call('attributes.rootPanel');

        if (!settingsContainer.parent) {
            root.append(settingsContainer);
        }
    });
});
