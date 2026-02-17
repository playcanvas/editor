import { Menu, MenuItem } from '@playcanvas/pcui';
import { GltfExporter, UsdzExporter } from 'playcanvas';

import { formatShortcut } from '../../common/utils';

editor.once('load', () => {
    let entity = null; // the entity that was clicked on to open the context menu
    let items = [];   // the current selection
    const root = editor.call('layout.root');

    const legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    // create data for entity menu
    let menu;

    const getSelection = function () {
        const selection = editor.call('selector:items');

        if (selection.indexOf(entity) !== -1) {
            return selection;
        }
        return [entity];

    };

    const setField = function (field: string, value: boolean) {
        const records = [];

        for (let i = 0; i < items.length; i++) {
            records.push({
                item: items[i],
                value: value,
                valueOld: items[i].get(field)
            });

            items[i].history.enabled = false;
            items[i].set(field, value);
            items[i].history.enabled = true;
        }

        editor.api.globals.history.add({
            name: `entities.set[${field}]`,
            combine: false,
            undo: function () {
                for (let i = 0; i < records.length; i++) {
                    const item = records[i].item.latest();
                    if (!item) {
                        continue;
                    }

                    item.history.enabled = false;
                    item.set(field, records[i].valueOld);
                    item.history.enabled = true;
                }
            },
            redo: function () {
                for (let i = 0; i < records.length; i++) {
                    const item = records[i].item.latest();
                    if (!item) {
                        continue;
                    }

                    item.history.enabled = false;
                    item.set(field, records[i].value);
                    item.history.enabled = true;
                }
            }
        });
    };

    // wait until all entities are loaded
    // before creating the menu to make sure
    // that the menu data for entities have been created
    editor.once('entities:load', () => {
        const menuData = [];

        const isOneSelected = () => items.length === 1;
        const hasWriteAccess = () => editor.call('permissions:write');
        const ctrl = editor.call('hotkey:ctrl:string');

        const exportEntity = async (ExporterClass, mimeType, extension, formatName) => {
            try {
                const entity = items[0].entity;
                const exporter = new ExporterClass();
                const arrayBuffer = await exporter.build(entity);

                const blob = new Blob([arrayBuffer], { type: mimeType });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${items[0].get('name') || 'entity'}.${extension}`;
                link.click();
                URL.revokeObjectURL(link.href);
            } catch (err) {
                console.error(`${formatName} export failed:`, err);
                editor.call('status:error', `Failed to export ${formatName}: ${err.message}`);
            }
        };

        menuData.push({
            text: 'New Entity',
            onIsEnabled: isOneSelected,
            onIsVisible: hasWriteAccess,
            onSelect: () => {
                editor.call('entities:new', { parent: items[0] });
            },
            items: editor.call('menu:entities:new', () => {
                return items[0];
            })
        });

        menuData.push({
            text: 'Add Component',
            onIsVisible: hasWriteAccess,
            items: editor.call('menu:entities:add-component')
        });

        if (!legacyScripts) {
            menuData.push({
                text: 'Template',
                icon: 'E411',
                onIsEnabled: () => {
                    if (isOneSelected()) {
                        return true;
                    }
                    // For multi-select, enable if at least one entity is linked to a template
                    // For instance, allows "Unlink Template" for multiple entity selection.
                    return items.some(e => e.get('template_id'));
                },
                onIsVisible: hasWriteAccess,
                items: editor.call('menu:entities:template')
            });
        }

        menuData.push({
            text: 'Enable',
            icon: 'E133',
            onIsVisible: function () {
                if (!hasWriteAccess()) {
                    return false;
                }

                if (items.length === 1) {
                    return !items[0].get('enabled');
                }
                const enabled = items[0].get('enabled');
                for (let i = 1; i < items.length; i++) {
                    if (enabled !== items[i].get('enabled')) {
                        return true;
                    }
                }
                return !enabled;

            },
            onSelect: function () {
                setField('enabled', true);
            }
        });

        menuData.push({
            text: 'Disable',
            icon: 'E132',
            onIsVisible: function () {
                if (!hasWriteAccess()) {
                    return false;
                }

                if (items.length === 1) {
                    return items[0].get('enabled');
                }
                const disabled = items[0].get('enabled');
                for (let i = 1; i < items.length; i++) {
                    if (disabled !== items[i].get('enabled')) {
                        return true;
                    }
                }
                return disabled;

            },
            onSelect: function () {
                setField('enabled', false);
            }
        });

        menuData.push({
            text: 'Copy',
            icon: 'E351',
            shortcut: formatShortcut(`${ctrl}+C`),
            onSelect: function () {
                editor.call('entities:copy', items);
            }
        });

        menuData.push({
            text: 'Paste',
            icon: 'E348',
            shortcut: formatShortcut(`${ctrl}+V`),
            onIsVisible: hasWriteAccess,
            onIsEnabled: function () {
                if (items.length <= 1) {
                    const clipboard = editor.call('clipboard:get');
                    if (clipboard && clipboard.type === 'entity' && clipboard.branch && clipboard.scene && clipboard.hierarchy) {
                        return true;
                    }
                }

                return false;
            },
            onSelect: function () {
                editor.call('entities:paste', entity);
            }
        });

        menuData.push({
            text: 'Duplicate',
            icon: 'E126',
            shortcut: formatShortcut(`${ctrl}+D`),
            onIsVisible: hasWriteAccess,
            onIsEnabled: function () {
                const items = getSelection();

                if (items.indexOf(editor.call('entities:root')) !== -1) {
                    return false;
                }

                return items.length > 0;
            },
            onSelect: function () {
                editor.call('entities:duplicate', getSelection());
            }
        });

        menuData.push({
            text: 'Export As...',
            icon: 'E228',
            onIsEnabled: () => items.length === 1 && items[0].entity,
            items: [
                {
                    text: 'GLB',
                    onSelect: () => exportEntity(GltfExporter, 'model/gltf-binary', 'glb', 'GLB')
                },
                {
                    text: 'USDZ',
                    onSelect: () => exportEntity(UsdzExporter, 'application/octet-stream', 'usdz', 'USDZ')
                }
            ]
        });

        menuData.push({
            text: 'Item History',
            icon: 'E399',
            onIsVisible: function () {
                return editor.call('permissions:write') && items.length === 1;
            },
            onSelect: function () {
                editor.call('vcgraph:utils', 'launchItemHist', 'entities', items[0].get('resource_id'));
            }
        });

        menuData.push({
            text: 'Delete',
            icon: 'E124',
            shortcut: formatShortcut('Delete'),
            onIsVisible: hasWriteAccess,
            onIsEnabled: function () {
                const root = editor.call('entities:root');
                for (let i = 0; i < items.length; i++) {
                    if (items[i] === root) {
                        return false;
                    }
                }
                return true;
            },
            onSelect: function () {
                editor.call('entities:delete', items);
            }
        });

        // menu
        menu = new Menu({ items: menuData });
        root.append(menu);
    });

    editor.method('entities:contextmenu:add', (data) => {
        var item = new MenuItem({
            text: data.text,
            icon: data.icon,
            items: data.items,
            onSelect: () => {
                data.onSelect.call(item, getSelection());
            },
            onIsEnabled: () => {
                if (data.onIsEnabled) {
                    return data.onIsEnabled.call(item, getSelection());
                }

                return true;
            },
            onIsVisible: () => {
                if (data.onIsVisible) {
                    return data.onIsVisible.call(item, getSelection());
                }

                return true;
            }
        });

        menu.append(item);

        return item;
    });

    editor.method('entities:contextmenu:open', (item, x, y, ignoreSelection) => {
        if (!menu) {
            return;
        }

        entity = item;

        if (ignoreSelection) {
            items = [];
        } else {
            items = getSelection();
        }

        menu.hidden = false;
        menu.position(x + 1, y);

        return true;
    });

    // get the entity that was right-clicked when opening the context menu
    editor.method('entities:contextmenu:entity', () => {
        return entity;
    });

});
