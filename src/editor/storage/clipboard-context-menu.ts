import { Menu, MenuItem, Label } from '@playcanvas/pcui';


// list of asset types
const assetTypes = config.schema.asset.type.$enum;

// supported types for a context menu
const types = new Set([
    'boolean',
    'label',
    'string',
    'array:string',
    'text',
    'tags',
    'select',
    'number',
    'slider',
    'vec2',
    'vec3',
    'vec4',
    'rgb',
    'rgba',
    'gradient',
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

    let path: string | null = null;
    let schemaType: string | null = null;
    let fieldOptions: string[] | null = null;
    let fieldEnabled: boolean = false;
    let elementHighlighted = null;

    if (!clipboard) {
        return;
    }

    // types of selected objects currently supported
    const objTypes = new Set([
        'entity',
        'asset'
    ]);


    // list of exceptions
    // if object type and path matches,
    // copy/paste will not be provided for such field
    const pathsExceptions = new Set([
        'entity:components.render.materialAssets'
    ]);


    // check if in clipboard we have a valid object
    const isValidClipboardObject = (value) => {
        return value &&
            (typeof value) === 'object' &&
            !Array.isArray(value) &&
            value.hasOwnProperty('type') &&
            value.hasOwnProperty('value') &&
            value.type;
    };


    // TODO:
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
        onSelect: () => {
            editor.call('clipboard:copy', path, schemaType);
        }
    });

    // copy posftix that shows the type to be copied
    const menuItemCopyLabel = new Label({
        class: 'pcui-menu-item-postfix',
        text: ''
    });
    // container content is not exposed on menu item, but we need to access it
    menuItemCopy._containerContent.append(menuItemCopyLabel);

    menu.append(menuItemCopy);

    // paste
    const menuItemPaste = new MenuItem({
        text: 'Paste',
        icon: 'E348',
        onIsVisible: hasWriteAccess, // visible only if user has write access
        onIsEnabled: () => {
            return fieldEnabled && editor.call('clipboard:validPaste', path, schemaType, fieldOptions);
        },
        onSelect: () => {
            editor.call('clipboard:paste', path, schemaType, fieldOptions);
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
        if (!elementHighlighted) {
            return;
        }

        // remove highlighting
        elementHighlighted.classList.remove('pcui-highlight');
        elementHighlighted = null;
    });


    // convert type string to more human-friendly version
    editor.method('clipboard:typeToHuman', (type: string) => {
        if (!type) {
            return '';
        }

        if (type.startsWith('array:')) {
            type = `${type.slice(6)}[]`;
        }

        return type;
    });


    // return current clipboard type
    editor.method('clipboard:type', () => {
        const paste = clipboard.value;
        if (isValidClipboardObject(paste)) {
            return paste.type;
        }
        return null;
    });


    // check if it is possible to copy value
    editor.method('clipboard:validCopy', (path: string, type: string) => {
        if (!path || !type) {
            return false;
        }

        // selector should have type
        const selectionType = editor.call('selector:type') ?? null;
        if (!selectionType) {
            return false;
        }

        // we should support that selection type
        if (!objTypes.has(selectionType)) {
            return false;
        }

        // respect exceptions
        if (pathsExceptions.has(`${selectionType}:${path}`)) {
            return false;
        }

        return true;
    });


    // check if path and type are valid to be pasted in the current selection
    editor.method('clipboard:validPaste', (path: string, type: string, options: string[] | null) => {
        if (!path || !type) {
            return false;
        }

        if (type === 'label') {
            return false;
        }

        // selector should have type
        const selectionType = editor.call('selector:type') ?? null;
        if (!selectionType) {
            return false;
        }

        // we should support that selection type
        if (!objTypes.has(selectionType)) {
            return false;
        }

        const paste = clipboard.value;
        if (!isValidClipboardObject(paste)) {
            return false;
        }

        // types should match
        if (paste.type !== type) {
            return false;
        }

        // if options are provided
        // ensure the clipboard value is one of the options
        if (options) {
            for (const item of options) {
                if (item.v === paste.value) {
                    return true;
                }
            }
            return false;
        }

        return true;
    });


    // method to open context menu
    editor.method('clipboard:contextmenu:open', (x: number, y: number, newPath: string, type: string, options: string[] | null, element: Element, canPaste: boolean = true) => {
        // it might not have a path
        if (!newPath) {
            schemaType = null;
            path = null;
            return;
        }

        // selector should have type
        const selectionType = editor.call('selector:type') ?? null;
        if (!selectionType) {
            return;
        }

        // we should support that selection type
        if (!objTypes.has(selectionType)) {
            return;
        }

        // respect exceptions
        if (pathsExceptions.has(`${selectionType}:${newPath}`)) {
            return;
        }

        // remember target path and value type
        path = newPath;
        schemaType = type;
        fieldOptions = options;
        fieldEnabled = canPaste;
        menuItemCopyLabel.text = editor.call('clipboard:typeToHuman', schemaType);

        // highlight field
        elementHighlighted = element;
        elementHighlighted?.classList?.add('pcui-highlight');

        // check if paste is possible
        const paste = clipboard.value;
        if (isValidClipboardObject(paste)) {
            // if possible, update paste postfix
            menuItemPasteLabel.text = editor.call('clipboard:typeToHuman', paste.type);
            menuItemPasteLabel.enabled = true;
        } else {
            menuItemPasteLabel.enabled = false;
        }

        // show context menu
        menu.hidden = false;
        menu.position(x + 1, y);
    });

    // copy to clipoard value by path from current selection
    editor.method('clipboard:copy', (path: string, type: string) => {
        if (!editor.call('clipboard:validCopy', path, type)) {
            return false;
        }

        const items = editor.call('selector:items');
        if (!items.length) {
            return false;
        }

        clipboard.value = {
            type: type,
            value: items[0].get(path)
        };

        if (elementHighlighted) {
            editor.call('clipboard:flashElement', elementHighlighted);
        }

        return true;
    });

    editor.method('clipboard:paste', (path: string, type: string, options: string[] | null) => {
        if (!editor.call('clipboard:validPaste', path, type, options)) {
            return false;
        }

        // should have at least one item in selector
        const items = editor.call('selector:items');
        if (!items.length) {
            return false;
        }

        const paste = clipboard.value;

        // TODO:
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

            // TODO:
            // setting render-component asset does not update materials - bug in render component inspector
        }

        // custom undo/redo to support multi-selection
        editor.api.globals.history.add({
            name: 'clipboard.paste',
            combine: false,
            undo: () => {
                for (let i = 0; i < records.length; i++) {
                    const item = records[i].item.latest();
                    if (!item) {
                        continue;
                    }
                    item.history.enabled = false;
                    item.set(records[i].path, records[i].valueOld);
                    item.history.enabled = true;
                }
            },
            redo: () => {
                for (let i = 0; i < records.length; i++) {
                    const item = records[i].item.latest();
                    if (!item) {
                        continue;
                    }
                    item.history.enabled = false;
                    item.set(records[i].path, records[i].valueNew);
                    item.history.enabled = true;
                }
            }
        });

        if (elementHighlighted) {
            editor.call('clipboard:flashElement', elementHighlighted);
        }

        return true;
    });

    // flash dom element when copied/pasted
    editor.method('clipboard:flashElement', (domElement: Element) => {
        domElement.classList.add('pcui-highlight-flash');
        setTimeout(() => {
            domElement.classList.remove('pcui-highlight-flash');
        }, 250);
    });
});

// Edge Cases:
// 1. entity.components.anim.stateGraphAsset - created without path, dynamically linked, when changed it changes slots under
// 2. entity.components.render.materialAssets - is a fixed length array of asset ID's, the array length should not be changed, and is defined by a number of meshInstances on a render asset
// 3. entity.components.particlesystem.%curves% - curvesets are more complex types, with multi-paths for fields
// 4. asset material offset/tiling/rotation - texture transform options that apply to all texture slots
// 5. asset texture/cubemap filtering - is a combined field
