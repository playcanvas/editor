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
            value: [args.left, args.top],
            placeholder: ['X', 'Y'],
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: 'Size',
            type: 'vec2',
            value: [args.width, args.height],
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
            placeholder: ['\u2195', '\u2194'],
        });
    });
});
