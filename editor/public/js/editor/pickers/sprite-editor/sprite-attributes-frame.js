editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:attributes:frame', function(args) {
        var rootPanel = editor.call('picker:sprites:editor:attributesPanel');
        rootPanel.header = 'FRAME';

        var events = [];

        var panel = editor.call('attributes:addPanel', {
            parent: rootPanel
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

        events.push(rootPanel.on('clear', function () {
            panel.destroy();
        }));

        panel.on('destroy', function () {
            for (var i = 0, len = events.length; i<len; i++) {
                events[i].unbind();
            }
            events.length = 0;
        });
    });
});
