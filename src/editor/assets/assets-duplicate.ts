editor.once('load', () => {
    editor.method('assets:duplicate', (asset) => {
        if (asset.get('type') !== 'material' && asset.get('type') !== 'sprite') return;

        const path = asset.get('path');
        const parent = path.length ? path[path.length - 1] : null;

        const raw = {
            // only materials can be duplicated at the moment
            type: asset.get('type'),
            name: `${asset.get('name')} Copy`,
            tags: asset.get('tags'),
            source: false,
            data: asset.get('data'),
            preload: asset.get('preload'),
            parent: parent ? editor.call('assets:get', parent) : null,
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', raw);
    });
});
