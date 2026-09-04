import { Observer } from '@playcanvas/observer';

import { ObserverSync } from '@/common/observer-sync';
import type { JsonOp } from '@/common/realtime-schema-repair';

editor.once('load', () => {
    const userdata = new Observer();

    editor.on(`userdata:${config.self.id}:raw`, (data: unknown) => {
        if (!userdata.sync) {
            userdata.sync = new ObserverSync({
                item: userdata,
                paths: ['cameras']
            });

            // client > server
            userdata.sync.on('op', (op: JsonOp) => {
                if (op.oi === null) {
                    void log.error`tried to send invalid userdata op: ${op}`;
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

    editor.on(`realtime:userdata:${config.self.id}:op:cameras`, (op: JsonOp) => {
        userdata.sync?.write(op);
    });

    editor.method('userdata', () => {
        return userdata;
    });
});
