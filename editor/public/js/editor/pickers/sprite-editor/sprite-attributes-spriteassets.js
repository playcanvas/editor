editor.once('load', function() {
    'use strict';

    editor.method('picker:sprite:attributes:sprite-assets', function(args) {
        var rootPanel = editor.call('picker:sprites:editor:attributesPanel');

        var panel = editor.call('attributes:addPanel', {
            parent: rootPanel,
            name: 'Sprite Assets',
            foldable: true,
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: 'No. of sprites',
            value: 0,
        });
    });
});
