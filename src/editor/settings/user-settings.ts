import { ObserverHistory } from '@playcanvas/observer';

editor.once('load', () => {
    const schema = editor.api.globals.schema;
    const userSettings = {
        editor: schema.settings.getDefaultUserSettings().editor
    };

    const settings = editor.call('settings:create', {
        name: 'user',
        id: `user_${config.self.id}`,
        data: userSettings
    });

    // add history
    settings.history = new ObserverHistory({
        item: settings,
        history: editor.api.globals.history
    });
});
