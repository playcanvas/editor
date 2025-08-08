import * as api from '@playcanvas/editor-api';
import { MenuItem } from '@playcanvas/pcui';

editor.once('load', () => {
    const menu = editor.call('menu:file');

    // create menu items
    let item = new MenuItem({
        class: 'create-new',
        text: 'Create New',
        onIsEnabled: () => {
            return editor.call('editor:command:can:create');
        },
        onSelect: () => {
            return editor.call('editor:command:create', 'script');
        }
    });
    menu.append(item);

    const types = [
        'script',
        'css',
        'html',
        'json',
        'shader',
        'text',
        'folder'
    ];

    const titles = [
        'Script Asset',
        'CSS Asset',
        'HTML Asset',
        'JSON Asset',
        'Shader Asset',
        'Text Asset',
        'Folder'
    ];

    types.forEach((type, index) => {
        item.append(new MenuItem({
            class: 'no-bottom-border',
            text: titles[index],
            onIsEnabled: () => {
                return editor.call('editor:command:can:create');
            },
            onSelect: () => {
                return editor.call('editor:command:create', type);
            }
        }));
    });


    // context menu
    const ctxMenu = editor.call('files:contextmenu');

    item = new MenuItem({
        class: ['create-new', 'no-bottom-border'],
        text: 'Create New',
        onIsEnabled: () => {
            const selection = editor.call('files:contextmenu:selected');
            if (selection.length <= 1) {
                return editor.call('editor:command:can:create', selection[0]);
            }
        },
        onSelect: () => {
            const selection = editor.call('files:contextmenu:selected');
            if (selection.length <= 1) {
                return editor.call('editor:command:create', 'script', selection[0]);
            }
        }
    });
    ctxMenu.append(item);

    types.forEach((type, index) => {
        item.append(new MenuItem({
            class: 'no-bottom-border',
            text: titles[index],
            onIsEnabled: () => {
                const selection = editor.call('files:contextmenu:selected');
                if (selection.length <= 1) {
                    return editor.call('editor:command:can:create', selection[0]);
                }
            },
            onSelect: () => {
                const selection = editor.call('files:contextmenu:selected');
                if (selection.length <= 1) {
                    return editor.call('editor:command:create', type, selection[0]);
                }
            }
        }));
    });


    editor.method('editor:command:can:create', (folder) => {
        return !editor.call('editor:resolveConflictMode') &&
                editor.call('permissions:write') &&
               (!folder || folder.get('type') === 'folder') &&
               !editor.call('errors:hasRealtime');
    });

    editor.method('editor:command:create', (type, folder) => {
        folder = folder || editor.call('assets:selected:folder');
        if (!editor.call('editor:command:can:create', folder)) {
            return;
        }

        if (type === 'script') {
            editor.call('picker:script-create', (filename) => {
                editor.call('assets:create:script', {
                    filename: filename,
                    parent: folder
                }, (_asset) => {
                    // refresh the asset data
                    const asset = editor.call('assets:get', _asset.get('id'));

                    // parse script attributes
                    const parseScript = () => {
                        // set url
                        asset.set('file.url', api.Asset.getFileUrl(asset.get('id'), asset.get('file.filename')));

                        // set variants urls
                        if (asset.has('file.variants')) {
                            const variants = asset.get('file.variants');
                            for (const key in variants) {
                                variants[key].url = api.Asset.getFileUrl(asset.get('id'), variants[key].filename);
                            }
                            asset.set('file.variants', variants);
                        }

                        editor.call('scripts:parse', asset, (err) => {
                            if (err) {
                                editor.call('status:error', err);
                            }

                            // do this in a timeout to give the asset a frame
                            // to be added to the tree
                            setTimeout(() => {
                                editor.call('tabs:temp:lock');
                                editor.call('files:select', asset.get('id'));
                                editor.call('tabs:temp:unlock');
                            });
                        });
                    };
                    if (asset.has('file.filename')) {
                        parseScript();
                    } else {
                        asset.once('file.filename:set', parseScript);
                    }
                });
            });
        } else {
            editor.call(`assets:create:${type}`, {
                parent: folder
            });
        }
    });
});
