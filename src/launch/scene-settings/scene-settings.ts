import { Observer } from '@playcanvas/observer';

import { ObserverSync } from '../../common/observer-sync';

editor.once('load', () => {
    const settings = new Observer();

    editor.method('sceneSettings', () => {
        return settings;
    });

    editor.once('scene:raw', (data) => {
        settings.patch(data.settings);

        editor.emit('sceneSettings:load', settings);
    });

    editor.on('sceneSettings:load', (settings) => {
        if (settings.sync) {
            return;
        }

        settings.sync = new ObserverSync({
            item: settings,
            prefix: ['settings']
        });

        // client > server
        settings.sync.on('op', (op) => {
            editor.call('realtime:op', op);
        });

        // server > client
        editor.on('realtime:op:settings', (op) => {
            settings.sync.write(op);
        });
    });
});
