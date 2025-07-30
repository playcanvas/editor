editor.once('load', () => {
    const schema = editor.api.globals.schema;
    const userSettings = {
        ide: schema.settings.getDefaultUserSettings().ide,
        editor: schema.settings.getDefaultUserSettings().editor
    };

    const settings = editor.call('settings:create', {
        name: 'user',
        id: `user_${config.self.id}`,
        data: userSettings
    });

    // Get settings
    editor.method('editor:settings', () => {
        return settings;
    });
});
