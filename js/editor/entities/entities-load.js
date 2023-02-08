import { Container, Progress } from '@playcanvas/pcui';

editor.on('load', function () {
    const hierarchyPanel = editor.call('layout.hierarchy');

    const hierarchyOverlay = new Container({
        class: 'progress-overlay',
        flex: true
    });
    hierarchyPanel.append(hierarchyOverlay);

    const progress = new Progress();
    hierarchyOverlay.append(progress);

    let loadedEntities = false;

    editor.method('entities:loaded', function () {
        return loadedEntities;
    });

    editor.on('scene:raw', function (data) {
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

            editor.entities.serverAdd(data.entities[key]);

            // Note that updating the progress bar here will have no effect in a loop.
            // Consider using setTimeout to give the DOM a change to update.
            progress.value = ((++i / total) * 0.8 + 0.1) * 100;
        }

        progress.value = 100;
        hierarchyOverlay.hidden = true;

        loadedEntities = true;
        editor.emit('entities:load');
    });

    editor.on('realtime:disconnected', function () {
        editor.call('selector:clear');
        editor.call('entities:clear');
        editor.call('attributes:clear');
    });

    editor.call('attributes:clear');

    editor.on('scene:unload', function () {
        editor.call('entities:clear');
        editor.call('attributes:clear');
    });

    editor.on('scene:beforeload', function () {
        hierarchyOverlay.hidden = false;
        progress.value = 10;
    });
});
