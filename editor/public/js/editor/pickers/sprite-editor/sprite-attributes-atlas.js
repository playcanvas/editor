editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:attributes:atlas', function (atlasAsset) {
        var panel = editor.call('picker:sprites:editor:addAttributesPanel', {
            title: 'TEXTURE ATLAS',
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: 'Width',
            path: 'meta.width',
            link: atlasAsset
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: 'Height',
            path: 'meta.height',
            link: atlasAsset
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: 'Frames',
            value: 0,
        });
    });
});
