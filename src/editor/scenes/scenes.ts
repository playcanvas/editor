editor.once('load', () => {
    // Fetch list of scenes from the server and
    // pass them to the callback
    editor.method('scenes:list', (callback?: (result: unknown) => void) => {
        editor.api.globals.rest.projects.projectScenes()
        .on('load', (_status: number, data: { result: unknown }) => {
            if (callback) {
                callback(data.result);
            }
        });
    });

    // Get a specific scene from the server and pass result to callback
    editor.method('scenes:get', (sceneId: string, callback?: (err: unknown, data?: unknown) => void) => {
        editor.api.globals.rest.scenes.sceneGet(sceneId)
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
    editor.method('scenes:new', (name: string, callback?: (data: unknown) => void) => {
        const data = {
            projectId: config.project.id,
            branchId: config.self.branch.id
        };

        if (name) {
            data.name = name;
        }

        editor.api.globals.rest.scenes.sceneCreate(data)
        .on('load', (_status: number, data: unknown) => {
            if (callback) {
                callback(data);
            }
        });
    });

    // Duplicate scene and pass result to callback
    editor.method('scenes:duplicate', (sceneId: string, newName: string, callback?: (data: unknown) => void) => {
        editor.api.globals.rest.scenes.sceneCreate({
            projectId: config.project.id,
            duplicateFrom: parseInt(sceneId, 10),
            branchId: config.self.branch.id,
            name: newName
        })
        .on('load', (_status: number, data: unknown) => {
            if (callback) {
                callback(data);
            }
        });
    });


    // Delete a scene
    editor.method('scenes:delete', (sceneId: string, callback?: () => void) => {
        editor.api.globals.rest.scenes.sceneDelete(sceneId)
        .on('load', (_status: number, _data: unknown) => {
            if (callback) {
                callback();
            }
        });
    });

});
