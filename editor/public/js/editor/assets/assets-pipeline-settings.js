editor.once('load', function() {
    'use strict';

    var settings = editor.call('settings:projectUser');
    var projectSettings = editor.call('settings:project');

    var foldStates = {
        'pipeline': true
    };

    editor.on('attributes:inspect[editorSettings]', function() {
        var panel = editor.call('attributes:addPanel', {
            name: 'Asset Tasks'
        });
        panel.foldable = true;
        panel.folded = foldStates['pipeline'];
        panel.on('fold', function() { foldStates['pipeline'] = true; });
        panel.on('unfold', function() { foldStates['pipeline'] = false; });
        panel.class.add('component', 'pipeline');
        // reference
        editor.call('attributes:reference:attach', 'settings:asset-tasks', panel, panel.headerElement);

        var fieldAuto = editor.call('attributes:addField', {
            parent: panel,
            name: 'Auto-run',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.autoRun'
        });
        editor.call('attributes:reference:attach', 'settings:asset-tasks:auto', fieldAuto.parent.innerElement.firstChild.ui);

        var fieldTexturePOT = editor.call('attributes:addField', {
            parent: panel,
            name: 'Textures POT',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.texturePot'
        });
        editor.call('attributes:reference:attach', 'settings:asset-tasks:texturePot', fieldTexturePOT.parent.innerElement.firstChild.ui);

        var fieldSearchRelatedAssets = editor.call('attributes:addField', {
            parent: panel,
            name: 'Search related assets',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.searchRelatedAssets'
        });
        fieldSearchRelatedAssets.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:asset-tasks:searchRelatedAssets', fieldSearchRelatedAssets.parent.innerElement.firstChild.ui);

        var fieldMapping = editor.call('attributes:addField', {
            parent: panel,
            name: 'Preserve material mappings',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.preserveMapping'
        });
        fieldMapping.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:asset-tasks:preserveMapping', fieldMapping.parent.innerElement.firstChild.ui);

        var fieldModelV2 = editor.call('attributes:addField', {
            parent: panel,
            name: 'Force legacy model v2',
            type: 'checkbox',
            link: projectSettings,
            path: 'useModelV2'
        });
        fieldModelV2.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:asset-tasks:useModelV2', fieldModelV2.parent.innerElement.firstChild.ui);


        var fieldOverwrite = editor.call('attributes:addField', {
            parent: panel,
            name: 'Overwriting behaviour:'
        });
        fieldOverwrite.parent.innerElement.firstChild.style.width = 'auto';
        fieldOverwrite.destroy();

        var fieldOverwriteModel = editor.call('attributes:addField', {
            parent: panel,
            name: 'Model',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.overwriteModel'
        });
        editor.call('attributes:reference:attach', 'settings:asset-tasks:overwrite:model', fieldOverwriteModel.parent.innerElement.firstChild.ui);

        var fieldOverwriteAnimation = editor.call('attributes:addField', {
            parent: panel,
            name: 'Animation',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.overwriteAnimation'
        });
        editor.call('attributes:reference:attach', 'settings:asset-tasks:overwrite:animation', fieldOverwriteAnimation.parent.innerElement.firstChild.ui);

        var fieldOverwriteMaterial = editor.call('attributes:addField', {
            parent: panel,
            name: 'Material',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.overwriteMaterial'
        });
        editor.call('attributes:reference:attach', 'settings:asset-tasks:overwrite:material', fieldOverwriteMaterial.parent.innerElement.firstChild.ui);

        var fieldOverwriteTexture = editor.call('attributes:addField', {
            parent: panel,
            name: 'Texture',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.overwriteTexture'
        });
        editor.call('attributes:reference:attach', 'settings:asset-tasks:overwrite:texture', fieldOverwriteTexture.parent.innerElement.firstChild.ui);
    });

});
