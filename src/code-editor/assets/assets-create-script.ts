import { Asset } from '@/editor-api';

editor.once('load', () => {
    editor.method('assets:create:script', (args: { filename?: string; parent?: any; text?: string } = {}, callback: (asset: unknown) => void = () => {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const {
            filename = 'script.js',
            parent = editor.call('assets:selected:folder'),
            text
        } = args;

        const parentId = parent ? parent.get('id') : null;

        const hasExistingScript = editor.call('assets:list').some((asset: any) => {
            if (asset.get('type') !== 'script') {
                return false;
            }
            const path = asset.get('path');
            const folder = path && path.length ? path[path.length - 1] : null;
            const isSameFolder = (folder ?? null) === (parentId ?? null);
            const isSameFile = asset.get('name').toLowerCase() === filename.toLowerCase();
            return isSameFolder && isSameFile;
        });

        if (hasExistingScript) {
            editor.call('status:error', `A script named "${filename}" already exists in this folder. Please use another name.`);
            return;
        }

        const folder = parent?.apiAsset ?? parent ?? undefined;

        editor.api.globals.assets.createScript({
            filename,
            folder,
            text
        }).then((asset: Asset) => {
            callback(asset);
        }).catch((err: unknown) => {
            editor.call('status:error', err);
        });
    });
});
