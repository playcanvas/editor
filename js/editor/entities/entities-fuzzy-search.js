editor.once('load', function () {
    editor.method('entities:fuzzy-search', function (query) {
        var items = [];
        var entities = editor.call('entities:list');

        for (let i = 0; i < entities.length; i++)
            items.push([entities[i].get('name'), entities[i]]);

        return editor.call('search:items', items, query);
    });
});
