editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:attributes:frameedit', function(args) {
        var panel = editor.call('picker:sprites:editor:addAttributesPanel', {
            title: 'Frame Edit Mode',
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: 'Auto slice',
            type: 'string',
            enum: [
                { v: 0, t: 'Append' },
                { v: 1, t: 'Overwrite' },
            ],
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: 'Create Grid',
            type: 'vec3',
            value: [50, 100, 10],
            placeholder: ['W', 'H', 'Count'],
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: ' ',
            text: 'Create',
            type: 'button',
        });
    });
});
