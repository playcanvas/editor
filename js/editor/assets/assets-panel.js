import { AssetPanel } from './asset-panel.js';

editor.once('load', function () {
    const assetsPanel = editor.call('layout.assets');

    editor.once('assets:load', () => {
        // attach contextmenu in assets:load so that
        // we make sure that the context menu code has been
        // executed first. This should be fixed once we make the
        // context menu a PCUI class
        editor.call('assets:contextmenu:attach', assetsPanel.foldersView);
        // last parameter must be null or context menu will use the root folder
        // TODO: fix that when the context menu becomes a pcui class
        editor.call('assets:contextmenu:attach', assetsPanel.detailsView, null);
        editor.call('assets:contextmenu:attach', assetsPanel.gridView, null);
    });

    editor.on('permissions:writeState', (value) => {
        assetsPanel.writePermissions = value;
    });

    editor.on('assets:load', () => {
        assetsPanel.dropManager = editor.call('editor:dropManager');
        assetsPanel.assets = editor.call('assets:raw');
        assetsPanel.writePermissions = editor.call('permissions:write');
    });

    editor.on('assets:clear', () => {
        assetsPanel.assets = null;
    });


    editor.method('assets:panel:currentFolder', function (asset) {
        if (asset === undefined) {
            // special case for legacy scripts
            if (config.project.settings.useLegacyScripts && assetsPanel.currentFolder && assetsPanel.currentFolder.get('id') === AssetPanel.LEGACY_SCRIPTS_ID) {
                return 'scripts';
            }

            return assetsPanel.currentFolder;
        }

        assetsPanel.currentFolder = asset;
    });

    editor.method('assets:progress', function (progress) {
        assetsPanel.progressBar.value = progress * 100;
    });

    // // select all hotkey
    // // ctrl + a
    editor.call('hotkey:register', 'asset:select-all', {
        ctrl: true,
        key: 'a',
        callback: () => {
            const assets = assetsPanel.visibleAssets;

            if (assets.length) {
                editor.call('selector:set', 'asset', assets);
            } else {
                editor.call('selector:clear');
            }
        }
    });

    // up on folder on backspace
    editor.call('hotkey:register', 'assets:fs:up', {
        key: 'backspace',
        callback: () => {
            assetsPanel.navigateBack();
        }
    });
});
