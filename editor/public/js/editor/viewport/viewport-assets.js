editor.once('load', function() {
    'use strict';

    var framework = editor.call('viewport:framework');
    var assetRegistry = framework.assets;

    editor.call('assets:registry:bind', assetRegistry);
});
