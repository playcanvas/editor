editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:attributes:slice', function(args) {
        var rootPanel = editor.call('picker:sprites:editor:attributesPanel');

        var panel = editor.call('attributes:addPanel', {
            parent: rootPanel,
            name: 'SLICE'
        });

        var events = [];

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
