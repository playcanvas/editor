editor.once('load', function() {
    'use strict';

    editor.method('picker:sprite:attributes:frame', function(args) {
        var rootPanel = editor.call('picker:sprites:editor:attributesPanel');

        var panel = editor.call('attributes:addPanel', {
            parent: rootPanel,
            name: 'Frame',
            foldable: true,
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: 'Position',
            type: 'vec2',
            value: [0, 0],
            placeholder: ['X', 'Y'],
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: 'Size',
            type: 'vec2',
            value: [0, 0],
            placeholder: ['W', 'H'],
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: ' ',
            text: 'Trim',
            type: 'button',
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: 'Pivot Preset',
            type: 'string',
            enum: [
                { v: 0, t: 'Left' },
                { v: 1, t: 'Center' },
            ],
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: 'Pivot',
            type: 'vec2',
            value: [0, 0],
            placeholder: ['&#8597', '&#8596'],
        });
    });
});
