editor.once('load', function () {
    'use strict';

    var projectSettings = editor.call('settings:project');

    var folded = true;

    editor.on('attributes:inspect[editorSettings]', function () {
        var panelLocalization = editor.call('attributes:addPanel', {
            name: 'Localization'
        });
        panelLocalization.foldable = true;
        panelLocalization.folded = folded;
        panelLocalization.on('fold', function () { folded = true; });
        panelLocalization.on('unfold', function () { folded = false; });
        panelLocalization.class.add('component', 'i18n');

        var fieldAssets = editor.call('attributes:addAssetsList', {
            panel: panelLocalization,
            name: 'Assets',
            type: 'json',
            link: [projectSettings],
            path: 'i18nAssets',
            reference: 'settings:localization:i18nAssets'
        });

        var btnCreate = editor.call('attributes:addField', {
            parent: panelLocalization,
            type: 'button',
            text: 'Create New Asset'
        });
        btnCreate.class.add('add-i18n-asset');
        btnCreate.style.marginTop = '10px';

        btnCreate.on('click', function () {
            editor.call('assets:create:i18n');
        });

        editor.call('attributes:reference:attach', 'settings:localization:createAsset', btnCreate);

    });
});
