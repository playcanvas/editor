import { Button, Menu } from '@playcanvas/pcui';

import { LegacyTooltip } from '@/common/ui/tooltip';
import { formatShortcut } from '@/common/utils';

editor.once('load', () => {
    const root = editor.call('layout.root');
    const toolbar = editor.call('layout.toolbar');
    const legacyScripts = editor.call('settings:project').get('useLegacyScripts');
    const history = editor.api.globals.history;
    const ctrl = editor.call('hotkey:ctrl:string');

    // Helper functions
    const hasWriteAccess = () => editor.call('permissions:write');
    const getSelectedItems = () => editor.call('selector:items');
    const getSelectorType = () => editor.call('selector:type');
    const isEntitySelected = () => getSelectorType() === 'entity';
    const isAssetSelected = () => getSelectorType() === 'asset';

    /**
     * Determines whether to show the Enable/Disable menu item based on selection state.
     * Shows "Enable" when entities are disabled, "Disable" when enabled.
     * For mixed selection states, shows both options.
     *
     * @param showWhenEnabled - If true, show when entities are enabled (for Disable item).
     * If false, show when entities are disabled (for Enable item).
     * @returns Whether to show the menu item.
     */
    const shouldShowEnableToggle = (showWhenEnabled: boolean) => {
        if (!isEntitySelected()) {
            return false;
        }
        const items = getSelectedItems();
        if (items.length === 1) {
            return items[0].get('enabled') === showWhenEnabled;
        }
        // Check for mixed state - show both options when entities have different states
        const first = items[0].get('enabled');
        const hasMixedState = items.some(item => item.get('enabled') !== first);
        return hasMixedState || first === showWhenEnabled;
    };

    const logo = new Button({
        class: 'logo'
    });
    toolbar.append(logo);

    const setField = (items, field, value) => {
        const records = [];

        for (const item of items) {
            records.push({
                item,
                value,
                valueOld: item.get(field)
            });

            item.history.enabled = false;
            item.set(field, value);
            item.history.enabled = true;
        }

        history.add({
            name: `entities.set[${field}]`,
            undo: () => {
                for (const record of records) {
                    const item = record.item.latest();
                    if (!item) {
                        continue;
                    }

                    item.history.enabled = false;
                    item.set(field, record.valueOld);
                    item.history.enabled = true;
                }
            },
            redo: () => {
                for (const record of records) {
                    const item = record.item.latest();
                    if (!item) {
                        continue;
                    }

                    item.history.enabled = false;
                    item.set(field, record.value);
                    item.history.enabled = true;
                }
            }
        });
    };

    const menu = new Menu({
        items: [{
            // Scene management (like "File" menu)
            text: 'Scenes',
            icon: 'E147',
            onSelect: () => editor.call('picker:scene')
        }, {
            // Standard editing operations
            text: 'Edit',
            icon: 'E130',
            onIsEnabled: () => hasWriteAccess(),
            items: [{
                text: 'Undo',
                icon: 'E114',
                shortcut: formatShortcut(`${ctrl}+Z`),
                onIsEnabled: () => history.canUndo,
                onSelect: () => history.undo()
            }, {
                text: 'Redo',
                icon: 'E115',
                shortcut: formatShortcut(`${ctrl}+Y`),
                onIsEnabled: () => history.canRedo,
                onSelect: () => history.redo()
            }, {
                text: 'Copy',
                icon: 'E351',
                shortcut: formatShortcut(`${ctrl}+C`),
                onIsEnabled: () => {
                    const selector = getSelectorType();
                    if (selector === 'asset' && editor.call('assets:panel:currentFolder') === 'scripts') {
                        return false;
                    }

                    if (selector === 'entity' || selector === 'asset') {
                        return getSelectedItems().length > 0;
                    }

                    return false;
                },
                onSelect: () => {
                    const items = getSelectedItems();
                    const selector = getSelectorType();
                    if (selector === 'entity') {
                        editor.call('entities:copy', items);
                    } else if (selector === 'asset') {
                        editor.call('assets:copy', items);
                    }
                }
            }, {
                text: 'Paste',
                icon: 'E348',
                shortcut: formatShortcut(`${ctrl}+V`),
                onIsEnabled: () => {
                    if (!hasWriteAccess()) {
                        return false;
                    }

                    const clipboard = editor.call('clipboard');
                    const value = clipboard.value;
                    if (value) {
                        const items = getSelectedItems();
                        if (items.length === 0 || items.length === 1) {
                            const selector = getSelectorType();
                            if (selector === value.type) {
                                if (selector === 'asset') {
                                    if (editor.call('assets:panel:currentFolder') === 'scripts') {
                                        return false;
                                    }
                                    if (!items[0] || items[0].get('type') === 'folder') {
                                        return true;
                                    }

                                } else {
                                    return true;
                                }
                            }
                        }
                    }

                    return false;
                },
                onSelect: (mouseEvt?: MouseEvent) => {
                    const items = getSelectedItems();
                    if (isEntitySelected()) {
                        editor.call('entities:paste', items[0]);
                    } else if (isAssetSelected()) {
                        const keepFolderStructure = mouseEvt?.shiftKey;
                        editor.call('assets:paste', items[0], keepFolderStructure);
                    }
                }
            }, {
                text: 'Duplicate',
                icon: 'E126',
                shortcut: formatShortcut(`${ctrl}+D`),
                onIsEnabled: () => {
                    if (!hasWriteAccess()) {
                        return false;
                    }

                    const type = getSelectorType();
                    if (!type) {
                        return false;
                    }

                    const items = getSelectedItems();

                    if (type === 'entity') {
                        if (items.includes(editor.call('entities:root'))) {
                            return false;
                        }

                        return items.length > 0;
                    }
                    if (type === 'asset') {
                        return items.length === 1 && items[0].get('type') === 'material';
                    }
                    return false;
                },
                onSelect: () => {
                    const type = getSelectorType();
                    if (!type) {
                        return;
                    }
                    const items = getSelectedItems();

                    if (type === 'entity') {
                        editor.call('entities:duplicate', items);
                    } else if (type === 'asset') {
                        editor.call('assets:duplicate', items[0]);
                    }
                }
            }, {
                text: 'Delete',
                icon: 'E124',
                shortcut: formatShortcut('Delete'),
                onIsEnabled: () => {
                    if (!hasWriteAccess()) {
                        return false;
                    }

                    const type = getSelectorType();
                    if (!type) {
                        return false;
                    }

                    if (type === 'entity') {
                        const root = editor.call('entities:root');
                        const items = getSelectedItems();
                        if (items.includes(root)) {
                            return false;
                        }
                    }

                    return true;
                },
                onSelect: () => {
                    const type = getSelectorType();
                    if (!type) {
                        return;
                    }
                    const items = getSelectedItems();

                    if (type === 'entity') {
                        const root = editor.call('entities:root');
                        if (items.includes(root)) {
                            return;
                        }
                        editor.call('entities:delete', items);
                    } else if (type === 'asset') {
                        editor.call('assets:delete:picker', items);
                    }
                }
            }, {
                text: 'Edit Asset',
                icon: 'E130',
                onIsEnabled: () => {
                    if (!isAssetSelected()) {
                        return false;
                    }

                    const items = getSelectedItems();
                    const editableTypes = ['html', 'css', 'json', 'text', 'script', 'shader'];
                    return items.length === 1 && editableTypes.includes(items[0].get('type'));
                },
                onSelect: () => {
                    if (!isAssetSelected()) {
                        return;
                    }
                    const items = getSelectedItems();
                    editor.call('assets:edit', items[0]);
                }
            }]
        }, {
            // Entity-specific operations
            text: 'Entity',
            icon: 'E185',
            onIsEnabled: () => isEntitySelected() && hasWriteAccess(),
            items: [{
                text: 'New Entity',
                onIsEnabled: () => getSelectedItems().length === 1,
                onSelect: () => {
                    editor.call('entities:new', { parent: editor.call('entities:selectedFirst') });
                },
                items: editor.call('menu:entities:new')
            }, {
                text: 'Add Component',
                onIsEnabled: () => isEntitySelected(),
                items: editor.call('menu:entities:add-component')
            }, {
                text: 'Enable',
                icon: 'E133',
                onIsEnabled: () => hasWriteAccess() && isEntitySelected(),
                onIsVisible: () => shouldShowEnableToggle(false),
                onSelect: () => setField(getSelectedItems(), 'enabled', true)
            }, {
                text: 'Disable',
                icon: 'E132',
                onIsEnabled: () => hasWriteAccess() && isEntitySelected(),
                onIsVisible: () => shouldShowEnableToggle(true),
                onSelect: () => setField(getSelectedItems(), 'enabled', false)
            }, {
                text: 'Template',
                onIsEnabled: () => isEntitySelected() && getSelectedItems().length === 1,
                onIsVisible: () => !legacyScripts,
                items: editor.call('menu:entities:template')
            }]
        }, {
            // Testing
            text: 'Launch',
            icon: 'E131',
            shortcut: formatShortcut(`${ctrl}+Enter`),
            onSelect: () => editor.call('launch', 'default')
        }, {
            // Development tools
            text: 'Code Editor',
            icon: 'E130',
            onIsVisible: () => !editor.call('settings:project').get('useLegacyScripts'),
            onSelect: () => editor.call('picker:codeeditor')
        }, {
            // Build tools
            text: 'Bake LightMaps',
            icon: 'E191',
            onSelect: () => {
                editor.call('lightmapper:bake');
                editor.call('entities:shadows:update');
            }
        }, {
            // Deployment
            text: 'Publishing',
            icon: 'E237',
            onSelect: () => editor.call('picker:builds-publish')
        }, {
            // Source control
            text: 'Version Control',
            icon: 'E399',
            onIsVisible: () => !legacyScripts && editor.call('permissions:read'),
            onSelect: () => editor.call('picker:versioncontrol')
        }, {
            // Configuration
            text: 'Settings',
            icon: 'E134',
            onIsEnabled: () => getSelectorType() !== 'editorSettings' && !editor.call('viewport:expand:state'),
            onSelect: () => editor.call('selector:set', 'editorSettings', [editor.call('settings:projectUser')])
        }, {
            // Legacy only
            text: 'Script Priority',
            icon: 'E134',
            onIsVisible: () => legacyScripts,
            onIsEnabled: () => hasWriteAccess(),
            onSelect: () => editor.call('sceneSettings:priorityScripts')
        }, {
            // Help (conventionally last)
            text: 'Help',
            icon: 'E138',
            items: [{
                text: 'Controls',
                icon: 'E136',
                shortcut: formatShortcut('Shift+?'),
                onSelect: () => editor.call('help:controls')
            }, {
                text: 'User Manual',
                icon: 'E232',
                onSelect: () => window.open('https://developer.playcanvas.com/user-manual/')
            }, {
                text: 'Tutorials',
                icon: 'E232',
                onSelect: () => window.open('https://developer.playcanvas.com/tutorials/')
            }, {
                text: 'API Reference',
                icon: 'E232',
                onSelect: () => window.open('https://api.playcanvas.com/engine/')
            }, {
                text: 'Forum',
                icon: 'E233',
                onSelect: () => window.open('https://forum.playcanvas.com/')
            }, {
                text: 'Log Issue',
                icon: 'E259',
                onSelect: () => window.open('https://github.com/playcanvas/editor/issues')
            }, {
                text: 'How do I...',
                icon: 'E138',
                shortcut: formatShortcut(`${ctrl}+Space`),
                onSelect: () => editor.call('help:howdoi')
            }, {
                text: 'Reset Tips',
                icon: 'E138',
                onSelect: () => editor.call('editor:tips:reset')
            }]
        }]
    });
    menu.position(45, 0);
    root.append(menu);

    const tooltip = LegacyTooltip.attach({
        target: logo.dom,
        text: 'Menu',
        align: 'left',
        root
    });
    menu.on('show', () => {
        tooltip.disabled = true;
    });

    menu.on('hide', () => {
        tooltip.disabled = false;
    });

    logo.on('click', () => {
        menu.hidden = false;
    });
});
