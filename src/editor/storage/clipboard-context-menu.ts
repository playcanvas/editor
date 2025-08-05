import { Menu, MenuItem, Label } from '@playcanvas/pcui';

const types = new Set([
    'boolean',
    'label',
    'string',
    'text',
    'select',
    'number',
    'slider',
    'vec2',
    'vec3',
    'vec4',
    'rgb',
    'rgba',
    'gradient',
    'array:string',
    'tags',
    'batchgroup',
    'layers'
]);

editor.method('clipboard:types', () => {
    return types;
});

editor.once('load', () => {
    const root = editor.call('layout.root');
    const hasWriteAccess = () => editor.call('permissions:write');
    const clipboard = editor.api.globals.clipboard;
    
    let path : string | null = null;
    let schemaType : string | null = null;

    if (!clipboard) return;

    const schemaByType = {
        'entity': config.schema.scene.entities.$of,
        // 'asset': config.schema.asset
        // 'settings': config.schema.settings,
        // 'sceneSettings': config.schema.scene.settings
    };

    const schemaTypeToHuman = (type:string) => {
        if (type.startsWith('array:'))
            type = type.slice(6) + '[]';

        return type;
    };


    // context menu
    const menu = new Menu({
        class: 'pcui-contextmenu-clipboard'
    });

    // copy
    const menuItemCopy = new MenuItem({
        text: 'Copy',
        icon: 'E351',
        onSelect: function () {
            const items = editor.call('selector:items');
            if (!items.length) return;

            const data = items[0].get(path);
            clipboard.value = {
                type: schemaType,
                value: data
            };
        }
    });

    const menuItemCopyLabel = new Label({
        class: 'pcui-menu-item-postfix',
        text: ''
    });
    menuItemCopy._containerContent.append(menuItemCopyLabel);

    menu.append(menuItemCopy);

    // paste
    const menuItemPaste = new MenuItem({
        text: 'Paste',
        icon: 'E348',
        onIsVisible: hasWriteAccess,
        onIsEnabled: () => {
            if (schemaType === 'label') return false;

            const paste = clipboard.value;
            if (paste && typeof(paste) === 'object' && !Array.isArray(paste) && paste.hasOwnProperty?.('type') && paste.hasOwnProperty?.('value')) {
                return schemaType === paste.type;
            }

            return false;
        },
        onSelect: () => {
            const items = editor.call('selector:items');
            if (!items.length) return;

            const paste = clipboard.value;
            if (typeof(paste) === 'object' // should be an object
                && !Array.isArray(paste) // not an array
                && paste.hasOwnProperty?.('type') // should have type
                && paste.hasOwnProperty?.('value') // should have value
                && paste.type === schemaType) { // the type of copied and candidate paths should match

                // TODO
                // verify if value is actually valid based on type

                const records = [];

                for(let i = 0; i < items.length; i++) {
                    // create history records
                    records.push({
                        item: items[i],
                        path: path,
                        valueOld: items[i].get(path),
                        valueNew: paste.value
                    });

                    // paste new value
                    items[i].history.enabled = false;
                    items[i].set(path, paste.value);
                    items[i].history.enabled = true;
                }

                // custom undo/redo for multiple objects
                editor.api.globals.history.add({
                    name: 'clipboard.paste',
                    combine: false,
                    undo: () => {
                        for(let i = 0; i < records.length; i++) {
                            const item = records[i].item.latest();
                            if (!item) continue;
                            item.history.enabled = false;
                            item.set(records[i].path, records[i].valueOld);
                            item.history.enabled = true;
                        }
                    },
                    redo: () => {
                        for(let i = 0; i < records.length; i++) {
                            const item = records[i].item.latest();
                            if (!item) continue;
                            item.history.enabled = false;
                            item.set(records[i].path, records[i].valueNew);
                            item.history.enabled = true;
                        }
                    }
                });
            }
        }
    });

    const menuItemPasteLabel = new Label({
        class: 'pcui-menu-item-postfix',
        text: ''
    });
    menuItemPaste._containerContent.append(menuItemPasteLabel);

    menu.append(menuItemPaste);

    root.append(menu);

    editor.method('clipboard:contextmenu:open', (x: number, y: number, newPath: string) => {
        console.log(newPath);

        if (!newPath) {
            schemaType = null;
            path = null;
            return;
        }

        let selectionType = editor.call('selector:type') ?? null;
        if (!selectionType) return;

        // copy postfix
        const schemaObject = schemaByType[selectionType];
        if (schemaObject) {
            path = newPath;
            schemaType = editor.call('schema:getTypeForPath', schemaObject, path);

            if (schemaType === 'object') {
                // too generic of a type to copy
                schemaType = null;
                path = null;
                return;
            }
            
            menuItemCopyLabel.text = schemaTypeToHuman(schemaType);
        } else {
            // no schema object to get type
            schemaType = null;
            path = null;
            return;
        }

        // paste postfix
        const paste = clipboard.value;
        if (paste && typeof(paste) === 'object' && !Array.isArray(paste) && paste.hasOwnProperty?.('type') && paste.hasOwnProperty?.('value') && paste.type) {
            menuItemPasteLabel.text = schemaTypeToHuman(paste.type);
            menuItemPasteLabel.enabled = true;
        } else {
            menuItemPasteLabel.enabled = false;
        }

        // show context menu
        menu.hidden = false;
        menu.position(x + 1, y);
    });
});