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

// converts string to vector (2-4 components)
// these formats supported:
// 8, 16, 32
// [ 8, 16 ]
// { "x": 8, "z": 32 }
const convertStringToVec = (string, valueOld) => {
    const valueNew = [];
    for (let i = 0; i < valueOld.length; i++) {
        valueNew[i] = valueOld[i];
    }

    try {
        string = string.trim();

        if (!string.startsWith('[') && !string.startsWith('{')) {
            string = `[${string}`;
        }
        if (!string.endsWith(']') && !string.endsWith('}')) {
            string = `${string}]`;
        }

        const value = JSON.parse(string);

        if (Array.isArray(value)) {
            for (let i = 0; i < Math.min(value.length, valueOld.length); i++) {
                if (typeof (value[i]) === 'number') {
                    valueNew[i] = value[i];
                }
            }
        } else if (typeof (value) === 'object') {
            ['x', 'y', 'z', 'w'].forEach((c, i) => {
                if (i >= valueOld.length) {
                    return;
                }
                if (value.hasOwnProperty(c) && typeof (value[c]) === 'number') {
                    valueNew[i] = value[c];
                }
            });
        }
    } catch (ex) { }

    return valueNew;
};

// converts string to color (with optional alpha)
// these formats supported:
// #ffffffff
// 8, 16, 32
// [ 8, 16 ]
// { "x": 8, "z": 32 }
const convertStringToColor = (string, valueOld) => {
    const valueNew = [];
    for (let i = 0; i < valueOld.length; i++) {
        valueNew[i] = valueOld[i];
    }

    try {
        string = string.trim();

        if (/#[0-9a-f]{6,8}/i.test(string)) {
            const i = parseInt(string.replace('#', '0x'), 16);
            let bytes;
            if (string.length > 7) {
                bytes = pc.math.intToBytes32(i);
            } else {
                bytes = pc.math.intToBytes24(i);
                bytes[3] = 255;
            }

            valueNew[0] = bytes[0] / 255;
            valueNew[1] = bytes[1] / 255;
            valueNew[2] = bytes[2] / 255;
            if (valueOld.length === 4) {
                valueNew[3] = bytes[3] / 255;
            }
        } else {
            if (!string.startsWith('[') && !string.startsWith('{')) {
                string = `[${string}`;
            }
            if (!string.endsWith(']') && !string.endsWith('}')) {
                string = `${string}]`;
            }

            const value = JSON.parse(string);

            if (Array.isArray(value)) {
                for (let i = 0; i < Math.min(value.length, valueOld.length); i++) {
                    if (typeof (value[i]) === 'number') {
                        valueNew[i] = value[i];
                    }
                }
            } else if (typeof (value) === 'object') {
                ['r', 'g', 'b', 'a'].forEach((c, i) => {
                    if (i >= valueOld.length) {
                        return;
                    }
                    if (value.hasOwnProperty(c) && typeof (value[c]) === 'number') {
                        valueNew[i] = value[c];
                    }
                });
            }
        }
    } catch (ex) { }

    return valueNew;
};

// list of conversion methods,
// it uses new value (n) and optionally an old value (o)
const convertTypes = new Map([
    [
        'boolean-string',
        (n, o) => {
            return n ? 'true' : 'false';
        }
    ], [
        'boolean-text',
        (n, o) => {
            return n ? 'true' : 'false';
        }
    ], [
        'boolean-number',
        (n, o) => {
            return n ? 1 : 0;
        }
    ], [
        'boolean-slider',
        (n, o) => {
            return n ? 1 : 0;
        }
    ], [
        'string-text',
        (n, o) => {
            return n;
        }
    ], [
        'string-tags',
        (n, o) => {
            const set = new Set();
            const items = n.split(',');
            for (let i = 0; i < items.length; i++) {
                const tag = items[i].trim();
                if (!tag) {
                    continue;
                }
                set.add(tag);
            }
            if (set.size === 0) {
                return [];
            }
            return Array.from(set);
        }
    ], [
        'string-number',
        (n, o) => {
            const number = parseFloat(n);
            if (isNaN(number)) {
                return 0;
            }
            return number;
        }
    ], [
        'string-slider',
        (n, o) => {
            const number = parseFloat(n);
            if (isNaN(number)) {
                return 0;
            }
            return number;
        }
    ], [
        'string-vec2',
        convertStringToVec
    ], [
        'string-vec3',
        convertStringToVec
    ], [
        'string-vec4',
        convertStringToVec
    ], [
        'string-rgb',
        convertStringToColor
    ], [
        'string-rgba',
        convertStringToColor
    ], [
        'array:string-string',
        (n, o) => {
            return n.join(', ');
        }
    ], [
        'array:string-text',
        (n, o) => {
            return n.join('\n');
        }
    ], [
        'array:string-tags',
        (n, o) => {
            const set = new Set();
            for (let i = 0; i < n.length; i++) {
                if (!n[i]) {
                    continue;
                }
                set.add(n[i]);
            }
            if (set.size === 0) {
                return [];
            }
            return Array.from(set);
        }
    ], [
        'text-string',
        (n, o) => {
            return n;
        }
    ], [
        'text-array:string',
        (n, o) => {
            const items = n.split('\n');
            if (items.length === 1 && items[0] === '') {
                return [];
            }
            return items;
        }
    ], [
        'text-tags',
        (n, o) => {
            const set = new Set();
            const items = n.split('\n');
            for (let i = 0; i < items.length; i++) {
                const tag = items[i].trim();
                if (!tag) {
                    continue;
                }
                set.add(tag);
            }
            if (set.size === 0) {
                return [];
            }
            return Array.from(set);
        }
    ], [
        'tags-string',
        (n, o) => {
            return n.join(', ');
        }
    ], [
        'tags-array:string',
        (n, o) => {
            return n;
        }
    ], [
        'tags-text',
        (n, o) => {
            return n.join('\n');
        }
    ], [
        'number-boolean',
        (n, o) => {
            return !!n;
        }
    ], [
        'number-string',
        (n, o) => {
            return `${n}`;
        }
    ], [
        'number-text',
        (n, o) => {
            return `${n}`;
        }
    ], [
        'number-slider',
        (n, o) => {
            return n;
        }
    ], [
        'number-vec2',
        (n, o) => {
            return [n, o[1]];
        }
    ], [
        'number-vec3',
        (n, o) => {
            return [n, o[1], o[2]];
        }
    ], [
        'number-vec4',
        (n, o) => {
            return [n, o[1], o[2], o[3]];
        }
    ], [
        'number-rgb',
        (n, o) => {
            return [n, o[1], o[2]];
        }
    ], [
        'number-rgba',
        (n, o) => {
            return [n, o[1], o[2], o[3]];
        }
    ], [
        'number-asset',
        (n, o) => {
            if (!n) {
                return o;
            }
            const asset = editor.call('assets:get', n);
            if (!asset) {
                return o;
            }
            return n;
        }
    ], [
        'vec2-string',
        (n, o) => {
            return JSON.stringify(n);
        }
    ], [
        'vec2-text',
        (n, o) => {
            return JSON.stringify(n);
        }
    ], [
        'vec2-vec3',
        (n, o) => {
            return [n[0], n[1], o[2]];
        }
    ], [
        'vec2-vec4',
        (n, o) => {
            return [n[0], n[1], o[2], o[3]];
        }
    ], [
        'vec2-rgb',
        (n, o) => {
            return [n[0], n[1], o[2]];
        }
    ], [
        'vec2-rgba',
        (n, o) => {
            return [n[0], n[1], o[2], o[3]];
        }
    ], [
        'vec3-string',
        (n, o) => {
            return JSON.stringify(n);
        }
    ], [
        'vec3-text',
        (n, o) => {
            return JSON.stringify(n);
        }
    ], [
        'vec3-vec2',
        (n, o) => {
            return [n[0], n[1]];
        }
    ], [
        'vec3-vec4',
        (n, o) => {
            return [n[0], n[1], n[2], o[3]];
        }
    ], [
        'vec3-rgb',
        (n, o) => {
            return [n[0], n[1], n[2]];
        }
    ], [
        'vec3-rgba',
        (n, o) => {
            return [n[0], n[1], n[2], o[3]];
        }
    ], [
        'vec4-string',
        (n, o) => {
            return JSON.stringify(n);
        }
    ], [
        'vec4-text',
        (n, o) => {
            return JSON.stringify(n);
        }
    ], [
        'vec4-vec2',
        (n, o) => {
            return [n[0], n[1]];
        }
    ], [
        'vec4-vec3',
        (n, o) => {
            return [n[0], n[1], n[2]];
        }
    ], [
        'vec4-rgb',
        (n, o) => {
            return [n[0], n[1], n[2]];
        }
    ], [
        'vec4-rgba',
        (n, o) => {
            return [n[0], n[1], n[2], n[3]];
        }
    ], [
        'rgb-string',
        (n, o) => {
            return pc.Color.prototype.toString.call({
                r: n[0],
                g: n[1],
                b: n[2],
                a: 0
            }, false).toUpperCase();
        }
    ], [
        'rgb-text',
        (n, o) => {
            return pc.Color.prototype.toString.call({
                r: n[0],
                g: n[1],
                b: n[2],
                a: 0
            }, false).toUpperCase();
        }
    ], [
        'rgb-vec2',
        (n, o) => {
            return [n[0], n[1]];
        }
    ], [
        'rgb-vec3',
        (n, o) => {
            return [n[0], n[1], n[2]];
        }
    ], [
        'rgb-vec4',
        (n, o) => {
            return [n[0], n[1], n[2], o[3]];
        }
    ], [
        'rgb-rgba',
        (n, o) => {
            return [n[0], n[1], n[2], o[3]];
        }
    ], [
        'rgba-string',
        (n, o) => {
            return pc.Color.prototype.toString.call({
                r: n[0],
                g: n[1],
                b: n[2],
                a: n[3]
            }, true).toUpperCase();
        }
    ], [
        'rgba-text',
        (n, o) => {
            return pc.Color.prototype.toString.call({
                r: n[0],
                g: n[1],
                b: n[2],
                a: n[3]
            }, true).toUpperCase();
        }
    ], [
        'rgba-vec2',
        (n, o) => {
            return [n[0], n[1]];
        }
    ], [
        'rgba-vec3',
        (n, o) => {
            return [n[0], n[1], n[2]];
        }
    ], [
        'rgba-vec4',
        (n, o) => {
            return [n[0], n[1], n[2], n[3]];
        }
    ], [
        'rgba-rgb',
        (n, o) => {
            return [n[0], n[1], n[2]];
        }
    ]
]);


// additional assets conversions
for (const type of assetTypes) {
    convertTypes.set(`asset:${type}-asset`, (n, o) => {
        return n;
    });

    convertTypes.set(`asset-asset:${type}`, (n, o) => {
        if (!n) {
            return null;
        }

        const assetType = editor.call('assets:get', n)?.get('type');
        if (!assetType) {
            return o;
        }

        if (assetType === type) {
            return n;
        }

        return o;
    });

    convertTypes.set(`number-asset:${type}`, (n, o) => {
        if (!n) {
            return o;
        }
        const asset = editor.call('assets:get', n);
        if (!asset) {
            return o;
        }
        if (asset.get('type') !== type) {
            return o;
        }
        return n;
    });
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
    let fieldEnabled: boolean = false;
    let fieldOptions: object[] | null = null;
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
    editor.method('clipboard:validPaste', (path: string, type: string, options: object[] | null) => {
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
        // or there should be a valid conversion option
        if (paste.type !== type) {
            if (!convertTypes.has(`${paste.type}-${type}`)) {
                return false;
            } else if (paste.type === 'asset' && type.startsWith('asset:') && paste.value) {
                const assetType = editor.call('assets:get', paste.value)?.get('type');
                if (!assetType) {
                    return false;
                }
                if (`asset:${assetType}` !== type) {
                    return false;
                }
            } else if (paste.type === 'number' && type === 'asset' && paste.value) {
                const asset = editor.call('assets:get', paste.value);
                if (!asset) {
                    return false;
                }
            } else if (paste.type === 'number' && type.startsWith('asset:') && paste.value) {
                const asset = editor.call('assets:get', paste.value);
                if (!asset) {
                    return false;
                }
                const assetType = asset.get('type');
                if (`asset:${assetType}` !== type) {
                    return false;
                }
            }
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
    editor.method('clipboard:contextmenu:open', (x: number, y: number, newPath: string, type: string, options: object[] | null, element: Element, canPaste: boolean = true) => {
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

    editor.method('clipboard:paste', (path: string, type: string, options: object[] | null) => {
        if (!editor.call('clipboard:validPaste', path, type, options)) {
            return false;
        }

        // should have at least one item in selector
        const items = editor.call('selector:items');
        if (!items.length) {
            return false;
        }

        const paste = clipboard.value;

        const convert = paste.type !== type;
        const conversionTuple = `${paste.type}-${type}`;
        if (convert && !convertTypes.has(conversionTuple)) {
            return false;
        }

        // TODO:
        // verify if value is actually valid based on type

        // store list of records and their values before modifying for history undo/redo
        const records = [];

        for (let i = 0; i < items.length; i++) {
            const valueOld = items[i].get(path);
            const valueNew = convert ? convertTypes.get(conversionTuple)(paste.value, valueOld) : paste.value;

            // create history records
            records.push({
                item: items[i],
                path: path,
                valueOld: valueOld,
                valueNew: valueNew
            });

            // paste new value
            items[i].history.enabled = false;
            items[i].set(path, valueNew);
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
