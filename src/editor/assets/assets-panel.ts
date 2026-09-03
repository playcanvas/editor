import { config } from '@/editor/config';

import { AssetPanel } from './asset-panel';

const CLASS_PANEL_ACTIVE = 'pcui-asset-panel-active';

editor.once('load', () => {
    const assetsPanel = editor.call('layout.assets');
    const assetsPanelSecondary = editor.call('layout.assets.secondary');
    const panels = [assetsPanel, assetsPanelSecondary].filter(Boolean);

    // The panel that asset creation, hotkeys and the current folder methods apply to. It is the
    // last panel the user interacted with, so that the split view always has an obvious target.
    let activePanel = assetsPanel;
    assetsPanel.class.add(CLASS_PANEL_ACTIVE);

    const setActivePanel = (panel) => {
        if (!panel || activePanel === panel || !panels.includes(panel)) {
            return;
        }

        activePanel.class.remove(CLASS_PANEL_ACTIVE);
        activePanel = panel;
        activePanel.class.add(CLASS_PANEL_ACTIVE);
    };

    panels.forEach((panel) => {
        const activate = () => {
            if (!panel.hidden) {
                setActivePanel(panel);
            }
        };
        panel.dom.addEventListener('pointerdown', activate, true);
        panel.dom.addEventListener('focusin', activate, true);
    });

    editor.method('assets:panel:active', (panel) => {
        if (panel === undefined) {
            return activePanel;
        }

        setActivePanel(panel);
    });

    editor.once('assets:load', () => {
        // attach contextmenu in assets:load so that
        // we make sure that the context menu code has been
        // executed first. This should be fixed once we make the
        // context menu a PCUI class
        panels.forEach((panel) => {
            editor.call('assets:contextmenu:attach', panel.foldersView);
            // last parameter must be null or context menu will use the root folder
            // TODO: fix that when the context menu becomes a pcui class
            editor.call('assets:contextmenu:attach', panel.detailsView, null);
            editor.call('assets:contextmenu:attach', panel.gridView, null);
        });
    });

    editor.on('permissions:writeState', (value) => {
        panels.forEach((panel) => {
            panel.writePermissions = value;
        });
    });

    // The asset list is not virtualized - a panel builds a grid item, a table row and a few
    // observer bindings for every asset in the project. So the secondary panel is only filled
    // in the first time the split view is opened, and a session that never opens it costs
    // nothing over a single panel.
    let secondaryPopulated = false;

    const populateSecondary = () => {
        if (secondaryPopulated || !assetsPanelSecondary || assetsPanelSecondary.hidden) {
            return;
        }

        const assets = editor.call('assets:raw');
        if (!assets) {
            return;
        }

        secondaryPopulated = true;
        assetsPanelSecondary.assets = assets;
    };

    if (assetsPanelSecondary) {
        assetsPanelSecondary.on('show', populateSecondary);
    }

    editor.on('assets:load', () => {
        panels.forEach((panel) => {
            panel.dropManager = editor.call('editor:dropManager');
            panel.writePermissions = editor.call('permissions:write');
        });

        assetsPanel.assets = editor.call('assets:raw');
        populateSecondary();
    });

    editor.on('assets:clear', () => {
        secondaryPopulated = false;
        panels.forEach((panel) => {
            panel.assets = null;
        });
    });

    editor.method('assets:panel:currentFolder', (asset) => {
        if (asset === undefined) {
            // special case for legacy scripts
            if (
                config.project.settings.useLegacyScripts &&
                activePanel.currentFolder &&
                activePanel.currentFolder.get('id') === AssetPanel.LEGACY_SCRIPTS_ID
            ) {
                return 'scripts';
            }

            return activePanel.currentFolder;
        }

        activePanel.currentFolder = asset;
    });

    editor.method('assets:progress', (progress) => {
        panels.forEach((panel) => {
            panel.progressBar.value = progress * 100;
        });
    });

    // select all hotkey
    // ctrl + a
    editor.call('hotkey:register', 'asset:select-all', {
        key: 'a',
        ctrl: true,
        callback: () => {
            if (editor.call('selector:type') !== 'asset') {
                return;
            }

            const assets = activePanel.visibleAssets;

            if (assets.length) {
                editor.call('selector:set', 'asset', assets);
            } else {
                editor.call('selector:clear');
            }
        }
    });

    // up on folder on backspace
    editor.call('hotkey:register', 'assets:fs:up', {
        key: 'Backspace',
        callback: () => {
            activePanel.navigateBack();
        }
    });
});
