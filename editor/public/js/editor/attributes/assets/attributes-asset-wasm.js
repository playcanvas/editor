editor.once('load', function() {
    'use strict';

    editor.on('attributes:inspect[asset]', function(assets) {
        if (assets.length !== 1 || assets[0].get('type') !== 'wasm' || assets[0].get('source'))
            return;

        // panel
        var panel = editor.call('attributes:addPanel', {
            name: 'Wasm Module'
        });
        panel.class.add('component');
        // reference
        editor.call('attributes:reference:attach', 'asset:wasm:asset', panel, panel.headerElement);

        // module name
        var moduleName = editor.call('attributes:addField', {
            parent: panel,
            type: 'string',
            name: 'Name',
            link: assets,
            path: 'data.moduleName'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:wasm:moduleName', moduleName._label);

        // glue script
        var glueScript = editor.call('attributes:addField', {
            parent: panel,
            type: 'asset',
            kind: 'script',
            name: 'Glue script',
            link: assets,
            path: 'data.glueScriptId',
        });
        glueScript.parent.class.add('script-picker');

        // reference
        editor.call('attributes:reference:attach', 'asset:wasm:glueScriptId', glueScript._label);        

        // fallback script
        var fallbackScript = editor.call('attributes:addField', {
            parent: panel,
            type: 'asset',
            kind: 'script',
            name: 'Fallback script',
            link: assets,
            path: 'data.fallbackScriptId',
        });
        fallbackScript.parent.class.add('script-picker');

        // reference
        editor.call('attributes:reference:attach', 'asset:wasm:fallbackScriptId', fallbackScript._label);

    });
});