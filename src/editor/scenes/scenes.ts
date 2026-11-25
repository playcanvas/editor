import { backend, UNSUPPORTED } from '@/common/backend';
import { config } from '@/editor/config';

editor.once('load', () => {
    // Fetch list of scenes from the server and
    // pass them to the callback
    editor.method('scenes:list', (callback?: (result: unknown) => void, errorCallback?: (error: unknown) => void) => {
        editor.api.globals.rest.projects
            .projectScenes()
            .on('load', (_status: number, data: { result: unknown }) => callback?.(data.result))
            .on('error', (_status: number, error: unknown) => errorCallback?.(error));
    });

    // Get a specific scene from the server and pass result to callback
    editor.method('scenes:get', (sceneId: string, callback?: (err: unknown, data?: unknown) => void) => {
        editor.api.globals.rest.scenes
            .sceneGet(Number(sceneId))
            .on('error', (_status: number, data: unknown) => {
                if (callback) {
                    callback(data);
                }
            })
            .on('load', (_status: number, data: unknown) => {
                if (callback) {
                    callback(null, data);
                }
            });
    });

    // Create a scene and pass result to callback
    editor.method(
        'scenes:new',
        (name: string, callback?: (data: unknown) => void, errorCallback?: (error: unknown) => void) => {
            const data: { projectId: number; branchId: string; name?: string } = {
                projectId: config.project.id,
                branchId: config.self.branch.id
            };

            if (name) {
                data.name = name;
            }

            const scenes = backend().sceneManagement;
            if (!scenes) {
                errorCallback?.(UNSUPPORTED);
                return;
            }

            scenes
                .sceneCreate(data)
                .on('load', (_status: number, data: unknown) => callback?.(data))
                .on('error', (_status: number, error: unknown) => errorCallback?.(error));
        }
    );

    // Duplicate scene and pass result to callback
    editor.method(
        'scenes:duplicate',
        (
            sceneId: string,
            newName: string,
            callback?: (data: unknown) => void,
            errorCallback?: (error: unknown) => void
        ) => {
            const scenes = backend().sceneManagement;
            if (!scenes) {
                errorCallback?.(UNSUPPORTED);
                return;
            }

            scenes
                .sceneCreate({
                    projectId: config.project.id,
                    duplicateFrom: parseInt(sceneId, 10),
                    branchId: config.self.branch.id,
                    name: newName
                })
                .on('load', (_status: number, data: unknown) => callback?.(data))
                .on('error', (_status: number, error: unknown) => errorCallback?.(error));
        }
    );

    // Rename a scene. There is no REST call for it: the name lives on the scene's realtime doc,
    // which the backend copies to the scene list. The loaded scene is renamed through its open
    // doc, as the settings panel does, so every view of it follows `scene:name`; any other scene
    // through a one-off fetch of its doc, dropped again once the op is acknowledged.
    editor.method(
        'scenes:rename',
        (uniqueId: number | string, name: string, callback?: () => void, errorCallback?: (error: unknown) => void) => {
            if (!editor.call('permissions:write')) {
                errorCallback?.('No write permission');
                return;
            }

            if (String(uniqueId) === String(config.scene.uniqueId)) {
                const current = editor.call('realtime:scene');
                if (!current?.data) {
                    errorCallback?.('Scene is not loaded');
                    return;
                }

                editor.call('realtime:scene:op', {
                    p: ['name'],
                    od: current.data.name || '',
                    oi: name
                });
                editor.emit('scene:name', name);
                callback?.();
                return;
            }

            const connection = editor.call('realtime:connection');
            if (connection?.state !== 'connected') {
                errorCallback?.('Not connected');
                return;
            }

            // reuse a doc something else already holds, and leave it to its owner
            const existing = connection.getExisting('scenes', String(uniqueId));
            const doc = existing ?? connection.get('scenes', String(uniqueId));
            const done = (err?: unknown) => {
                if (!existing) {
                    doc.destroy();
                }
                if (err) {
                    errorCallback?.(err);
                } else {
                    callback?.();
                }
            };

            doc.fetch((err: unknown) => {
                if (err) {
                    done(err);
                    return;
                }
                if (!doc.type) {
                    done('Scene not found');
                    return;
                }

                doc.submitOp([{ p: ['name'], od: doc.data.name || '', oi: name }], (err: unknown) => done(err));
            });
        }
    );

    // Delete a scene
    editor.method(
        'scenes:delete',
        (sceneId: string, callback?: () => void, errorCallback?: (error: unknown) => void) => {
            const scenes = backend().sceneManagement;
            if (!scenes) {
                errorCallback?.(UNSUPPORTED);
                return;
            }

            scenes
                .sceneDelete(Number(sceneId))
                .on('load', () => callback?.())
                .on('error', (_status: number, error: unknown) => errorCallback?.(error));
        }
    );
});
