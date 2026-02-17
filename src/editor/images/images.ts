editor.once('load', () => {
    editor.method('images:upload', (file: File, project: { id: string }, callback?: (data: unknown) => void, error?: (status: number, data: unknown) => void) => {
        if (!file || !file.size) {
            return;
        }

        editor.api.globals.rest.projects.projectImage(project.id, file)
        .on('load', (status, data) => {
            if (callback) {
                callback(data);
            }
        })
        .on('progress', (progress) => {
        })
        .on('error', (status, data) => {
            if (error) {
                error(status, data);
            }
        });
    });
});
