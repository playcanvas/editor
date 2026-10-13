editor.once('load', () => {
    editor.method('entities:fuzzy-search', (query) => {
        const items = [];
        const entities = editor.call('entities:list');

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            items.push([entity.get('name'), entity]);
        }

        return editor.call('search:items', items, query);
    });
});
