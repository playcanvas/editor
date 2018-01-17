editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:attributes:frames', function(args) {
        var panel = editor.call('picker:sprites:editor:addAttributesPanel', {
            title: 'Frames',
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: 'Position',
            type: 'vec2',
            value: ['multiple', 'multiple'],
            placeholder: ['X', 'Y'],
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: 'Size',
            type: 'vec2',
            value: ['multiple', 'multiple'],
            placeholder: ['W', 'H'],
        });
    });
});
