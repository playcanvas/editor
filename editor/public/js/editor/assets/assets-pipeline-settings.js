editor.once('load', function() {
    'use strict';

    const hasPcuiSettings = editor.call('users:hasFlag', 'hasPcuiSettings');
    if (hasPcuiSettings) {
        return;
    }

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

        var fieldSearchRelatedAssets = editor.call('attributes:addField', {
            parent: panel,
            name: 'Search related assets',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.searchRelatedAssets'
        });
        fieldSearchRelatedAssets.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:asset-tasks:searchRelatedAssets', fieldSearchRelatedAssets.parent.innerElement.firstChild.ui);

        var panelTextureSettings = editor.call('attributes:addPanel', {
            parent: panel,
            name: 'Texture Import Settings'
        });

        var fieldTexturePOT = editor.call('attributes:addField', {
            parent: panelTextureSettings,
            name: 'Textures POT',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.texturePot'
        });
        editor.call('attributes:reference:attach', 'settings:asset-tasks:texturePot', fieldTexturePOT.parent.innerElement.firstChild.ui);

        var fieldPreferTextureAtlas = editor.call('attributes:addField', {
            parent: panelTextureSettings,
            name: 'Create Atlases',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.textureDefaultToAtlas'
        });
        editor.call('attributes:reference:attach', 'settings:asset-tasks:textureDefaultToAtlas', fieldPreferTextureAtlas.parent.innerElement.firstChild.ui);

        var panelModelSettings = editor.call('attributes:addPanel', {
            parent: panel,
            name: 'Model Import Settings'
        });

        var fieldMapping = editor.call('attributes:addField', {
            parent: panelModelSettings,
            name: 'Preserve material mappings',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.preserveMapping'
        });
        fieldMapping.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:asset-tasks:preserveMapping', fieldMapping.parent.innerElement.firstChild.ui);

        var fieldModelV2 = editor.call('attributes:addField', {
            parent: panelModelSettings,
            name: 'Force legacy model v2',
            type: 'checkbox',
            link: projectSettings,
            path: 'useModelV2'
        });
        fieldModelV2.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:asset-tasks:useModelV2', fieldModelV2.parent.innerElement.firstChild.ui);

        var fieldUseGlb = editor.call('attributes:addField', {
            parent: panelModelSettings,
            name: 'Use GLB format',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.useGlb'
        });
        fieldUseGlb.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:asset-tasks:useGlb', fieldUseGlb.parent.innerElement.firstChild.ui);

        var fieldOverwriteModel = editor.call('attributes:addField', {
            parent: panelModelSettings,
            name: 'Overwrite Models',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.overwriteModel'
        });
        fieldOverwriteModel.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:asset-tasks:overwrite:model', fieldOverwriteModel.parent.innerElement.firstChild.ui);

        var fieldOverwriteAnimation = editor.call('attributes:addField', {
            parent: panelModelSettings,
            name: 'Overwrite Animations',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.overwriteAnimation'
        });
        fieldOverwriteAnimation.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:asset-tasks:overwrite:animation', fieldOverwriteAnimation.parent.innerElement.firstChild.ui);

        var fieldOverwriteMaterial = editor.call('attributes:addField', {
            parent: panelModelSettings,
            name: 'Overwrite Materials',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.overwriteMaterial'
        });
        fieldOverwriteMaterial.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:asset-tasks:overwrite:material', fieldOverwriteMaterial.parent.innerElement.firstChild.ui);

        var fieldOverwriteTexture = editor.call('attributes:addField', {
            parent: panelModelSettings,
            name: 'Overwrite Textures',
            type: 'checkbox',
            link: settings,
            path: 'editor.pipeline.overwriteTexture'
        });
        fieldOverwriteTexture.parent.innerElement.firstChild.style.width = 'auto';
        editor.call('attributes:reference:attach', 'settings:asset-tasks:overwrite:texture', fieldOverwriteTexture.parent.innerElement.firstChild.ui);
    });
});
