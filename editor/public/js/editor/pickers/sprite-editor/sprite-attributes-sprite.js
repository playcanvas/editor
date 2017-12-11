editor.once('load', function() {
    'use strict';

    editor.method('picker:sprite:attributes:sprite', function(args) {
        var panel = editor.call('picker:sprites:editor:addAttributesPanel', {
            title: 'Sprite',
        });
    });
});
