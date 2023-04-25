import { Observer, ObserverHistory } from '@playcanvas/observer';

editor.once('load', function () {
    const sessionSettings = new Observer({
        engineVersion: 'current'
    });

    sessionSettings.history = new ObserverHistory({
        item: sessionSettings,
        prefix: 'sessionSettings.',
        history: editor.call('editor:history')
    });

    editor.method('settings:session', () => {
        return sessionSettings;
    });
});
