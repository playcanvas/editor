editor.once('load', function() {
    'use strict';

    editor.method('picker:sprite:attributes:atlas', function(args) {
        var atlasAsset = args.asset;

        var panel = editor.call('picker:sprites:editor:addAttributesPanel', {
            title: 'ATLAS',
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: 'Width',
            value: atlasAsset.width,
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: 'Height',
            value: atlasAsset.height,
        });

        editor.call('attributes:addField', {
            parent: panel,
            name: 'Frames',
            value: 0,
        });
    });
});
