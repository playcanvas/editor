import { Menu, MenuItem, Label } from '@playcanvas/pcui';


// list of asset types
const assetTypes = config.schema.asset.type.$enum;

// supported types for a context menu
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
    'layers',
    'entity',
    'array:entity',
    'asset',
    'assets',
    'array:asset'
]);

// add support for specific asset types
for (const type of assetTypes) {
    types.add(`asset:${type}`);
    types.add(`array:asset:${type}`);
}


editor.method('clipboard:types', () => {
    return types;
});


editor.once('load', () => {
    const root = editor.call('layout.root');
    const hasWriteAccess = () => editor.call('permissions:write');

    // use in-built clipboard (uses localStorage)
    const clipboard = editor.api.globals.clipboard;

    let path : string | null = null;
    let schemaType : string | null = null;
    let elementHighlighted = null;

    if (!clipboard) return;

    // types of selected objects currently supported
    const objTypes = new Set([
        'entity'
        // 'asset'
    ]);

    // for menu items, print arrays in more human readable way
    const schemaTypeToHuman = (type:string) => {
        if (type.startsWith('array:')) {
            type = `${type.slice(6)}[]`;
        }

        return type;
    };


    // TODO
    // type to other type conversions, e.g.:
    // asset:* > asset
    // asset > asset:* - if copied asset is of desired type
    // rgb <> rgba


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

    // copy posftix that shows the type to be copied
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
        onIsVisible: hasWriteAccess, // visible only if user has write access
        onIsEnabled: () => {
            // no pasting to labels
            if (schemaType === 'label') return false;

            // ensure that clipboard value is of expected format
            const paste = clipboard.value;
            if (paste && (typeof paste) === 'object' && !Array.isArray(paste) && paste.hasOwnProperty?.('type') && paste.hasOwnProperty?.('value')) {
                // check if clipboard type and target types are matching
                return schemaType === paste.type;
            }

            // by default do not allow pasting
            return false;
        },
        onSelect: () => {
            // should have at least one item in selector
            const items = editor.call('selector:items');
            if (!items.length) return;

            const paste = clipboard.value;
            if ((typeof paste) === 'object' && // should be an object
                !Array.isArray(paste) && // not an array
                paste.hasOwnProperty?.('type') && // should have type
                paste.hasOwnProperty?.('value') && // should have value
                paste.type === schemaType) { // the type of copied and candidate paths should match

                // TODO
                // verify if value is actually valid based on type

                // store list of records and their values before modifying for history undo/redo
                const records = [];

                for (let i = 0; i < items.length; i++) {
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

                    // TODO
                    // setting render-component asset does not update materials - bug in render component inspector
                }

                // custom undo/redo to support multi-selection
                editor.api.globals.history.add({
                    name: 'clipboard.paste',
                    combine: false,
                    undo: () => {
                        for (let i = 0; i < records.length; i++) {
                            const item = records[i].item.latest();
                            if (!item) continue;
                            item.history.enabled = false;
                            item.set(records[i].path, records[i].valueOld);
                            item.history.enabled = true;
                        }
                    },
                    redo: () => {
                        for (let i = 0; i < records.length; i++) {
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

    // paste postfix - shows what is in the clipboard
    const menuItemPasteLabel = new Label({
        class: 'pcui-menu-item-postfix',
        text: ''
    });
    menuItemPaste._containerContent.append(menuItemPasteLabel);

    menu.append(menuItemPaste);
    root.append(menu);


    // when clipboard menu is hidden
    menu.on('hide', () => {
        if (!elementHighlighted) return;

        // remove highlighting
        elementHighlighted.classList.remove('pcui-highlight');
        elementHighlighted = null;
    });


    // method to open context menu
    editor.method('clipboard:contextmenu:open', (x: number, y: number, newPath: string, type: string, element: Element) => {
        // it might not have a path
        if (!newPath) {
            schemaType = null;
            path = null;
            return;
        }

        // selector should have type
        const selectionType = editor.call('selector:type') ?? null;
        if (!selectionType) return;

        // we should support that selection type
        if (!objTypes.has(selectionType)) return;

        // remember target path and value type
        path = newPath;
        schemaType = type;
        menuItemCopyLabel.text = schemaTypeToHuman(schemaType);

        // highlight field
        elementHighlighted = element;
        elementHighlighted?.classList?.add('pcui-highlight');

        // check if paste is possible
        const paste = clipboard.value;
        if (paste && (typeof paste) === 'object' && !Array.isArray(paste) && paste.hasOwnProperty?.('type') && paste.hasOwnProperty?.('value') && paste.type) {
            // if possible, update paste postfix
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
