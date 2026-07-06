editor.once('load', () => {
    editor.method('entities:fuzzy-search', (query) => {
        const items = [];
        const entities = editor.call('entities:list');

        for (const entity of entities) {
            items.push([entity.get('name'), entity]);
        }

        return editor.call('search:items', items, query);
    });
});
