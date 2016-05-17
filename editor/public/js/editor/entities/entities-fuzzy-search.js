editor.once('load', function() {
    'use strict';


    editor.method('entities:fuzzy-search', function(query, limit) {
        var items = [ ];
        var entities = editor.call('entities:list');

        for(var i = 0; i < entities.length; i++)
            items.push([ entities[i].get('name'), entities[i] ]);

        var result = editor.call('search:items', items, query, {
            limitResults: limit || 16
        });

        return result;
    });
});
