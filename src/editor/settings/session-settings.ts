import { Observer, ObserverHistory } from '@playcanvas/observer';

editor.once('load', () => {
    const sessionSettings = {
        engineVersion: 'current'
    };

    const settings = new Observer(sessionSettings);

    settings.history = new ObserverHistory({
        item: settings,
        prefix: 'sessionSettings.',
        history: editor.api.globals.history
    });

    editor.method('settings:session', () => {
        return settings;
    });
});
