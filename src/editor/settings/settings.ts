import { Observer } from '@playcanvas/observer';

import { ObserverSync } from '@/common/observer-sync';
import { RealtimeSchemaRepair, planSchemaRepair } from '@/common/realtime-schema-repair';

const ENVELOPE_KEYS = new Set(['_id', 'name', 'user', 'project', 'item_id', 'branch_id', 'checkpoint_id']);

type SettingsObserver = Observer & {
    id: string;
    reload: (...args: unknown[]) => void;
    disconnect: () => void;
};

editor.once('load', () => {
    editor.method('settings:create', (args) => {
        // settings observer
        const settings = new Observer(args.data) as SettingsObserver;
        settings.id = args.id;

        // Get settings
        editor.method(`settings:${args.name}`, () => {
            return settings;
        });

        let doc;
        let repair: RealtimeSchemaRepair;

        settings.reload = function () {
            const connection = editor.call('realtime:connection');

            const initialize = () => {
                if (doc) {
                    doc.destroy();
                }

                doc = connection.get('settings', settings.id);

                // handle errors
                doc.on('error', (err) => {
                    log.error(err);
                    editor.emit(`settings:${args.name}:error`, err);
                });

                const current = doc;
                repair = new RealtimeSchemaRepair(
                    current,
                    () => planSchemaRepair(editor.api.globals.schema, 'settings', current.data, args.name),
                    (ops) =>
                        ops
                            .filter((op) => !ENVELOPE_KEYS.has(String(op.p[0])))
                            .forEach((op) => settings.sync.write(op)),
                    (err) => {
                        log.error(err);
                        editor.emit(`settings:${args.name}:error`, err);
                    }
                );

                // load settings
                doc.on('load', () => {
                    const data = { ...doc.data };

                    // remove unnecessary fields
                    delete data._id;
                    delete data.name;
                    delete data.user;
                    delete data.project;
                    delete data.item_id;
                    delete data.branch_id;
                    delete data.checkpoint_id;

                    if (!settings.sync) {
                        settings.sync = new ObserverSync({
                            item: settings,
                            paths: Object.keys(settings.json())
                        });

                        // local -> server
                        settings.sync.on('op', (op) => {
                            if (doc) {
                                void repair.submit(op);
                            }
                        });
                    }

                    const history = settings.history?.enabled;
                    if (history) {
                        settings.history.enabled = false;
                    }
                    settings.sync.enabled = false;

                    const set = (key, data) => {
                        if (Array.isArray(data)) {
                            settings.set(key, data.slice(0));
                        } else if (typeof data === 'object') {
                            for (const childKey in data) {
                                set(key ? `${key}.${childKey}` : childKey, data[childKey]);
                            }
                        } else {
                            settings.set(key, data);
                        }
                    };
                    set('', data);

                    settings.sync.enabled = true;
                    if (history) {
                        settings.history.enabled = true;
                    }

                    // server -> local
                    doc.on('op', (ops, local) => {
                        if (local) {
                            return;
                        }

                        const history = settings.history?.enabled;
                        if (history) {
                            settings.history.enabled = false;
                        }
                        for (let i = 0; i < ops.length; i++) {
                            const op = ops[i];
                            if (!ENVELOPE_KEYS.has(String(op.p[0]))) settings.sync.write(op);
                        }
                        if (history) {
                            settings.history.enabled = true;
                        }
                    });

                    editor.emit(`settings:${args.name}:load`, data);
                });

                // subscribe for realtime events
                doc.subscribe();
            };

            if (connection.state === 'connected') {
                initialize();
            } else {
                connection.on('connected', initialize);
            }
        };

        if (!args.deferLoad) {
            editor.on('realtime:authenticated', () => {
                settings.reload();
            });
        }

        editor.on('realtime:disconnected', () => {
            if (doc) {
                doc.destroy();
                doc = null;
            }
        });

        settings.disconnect = function () {
            if (doc) {
                doc.destroy();
                doc = null;
            }

            if (settings.sync) {
                settings.sync.unbind();
                delete settings.sync;
            }
        };

        return settings;
    });
});
