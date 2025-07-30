import { Container, Progress } from '@playcanvas/pcui';

editor.on('load', () => {
    const hierarchyPanel = editor.call('layout.hierarchy');

    const hierarchyOverlay = new Container({
        class: 'progress-overlay',
        flex: true
    });
    hierarchyPanel.append(hierarchyOverlay);

    const progress = new Progress();
    hierarchyOverlay.append(progress);

    let loadedEntities = false;

    editor.method('entities:loaded', () => {
        return loadedEntities;
    });

    editor.on('scene:raw', (data) => {
        editor.call('status:clear');
        editor.call('selector:clear');
        editor.call('entities:clear');
        editor.call('attributes:clear');

        const total = Object.keys(data.entities).length;
        let i = 0;

        // list
        for (const key in data.entities) {
            // consistency check
            if (data.entities[key].template_ent_ids && !data.entities[key].template_ent_ids[key]) {
                console.error(`Entity ${key} has invalid template references and needs to be recreated`);
            }

            editor.api.globals.entities.serverAdd(data.entities[key]);

            // Note that updating the progress bar here will have no effect in a loop.
            // Consider using setTimeout to give the DOM a change to update.
            progress.value = ((++i / total) * 0.8 + 0.1) * 100;
        }

        progress.value = 100;
        hierarchyOverlay.hidden = true;

        loadedEntities = true;
        editor.emit('entities:load');
    });

    editor.on('realtime:disconnected', () => {
        editor.call('selector:clear');
        editor.call('entities:clear');
        editor.call('attributes:clear');
    });

    editor.call('attributes:clear');

    editor.on('scene:unload', () => {
        editor.call('entities:clear');
        editor.call('attributes:clear');
    });

    editor.on('scene:beforeload', () => {
        hierarchyOverlay.hidden = false;
        progress.value = 10;
    });
});
