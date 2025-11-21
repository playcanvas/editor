import { Observer } from '@playcanvas/observer';

import { ObserverSync } from '../../common/observer-sync';

editor.once('load', () => {
    const userdata = new Observer();

    editor.on(`userdata:${config.self.id}:raw`, (data) => {

        if (!userdata.sync) {
            userdata.sync = new ObserverSync({
                item: userdata,
                paths: ['cameras']
            });

            // client > server
            userdata.sync.on('op', (op) => {
                if (op.oi === null) {
                    log.error('Tried to send invalid userdata op', op);
                    return;
                }

                editor.call('realtime:userdata:op', op);
            });
        }

        userdata.sync.enabled = false;
        userdata.patch(data);
        userdata.sync.enabled = true;

        editor.emit('userdata:load', userdata);
    });

    editor.method('userdata', () => {
        return userdata;
    });
});
