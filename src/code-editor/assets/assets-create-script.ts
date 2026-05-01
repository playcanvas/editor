import { Asset } from '@/editor-api';

editor.once('load', () => {
    editor.method('assets:script:checkCollision', (filename: string, parent: any) => {
        const parentId = parent ? parent.get('id') : null;
        const collision = editor.call('assets:list').some((asset: any) => {
            if (asset.get('type') !== 'script') {
                return false;
            }
            const path = asset.get('path');
            const folder = path && path.length ? path[path.length - 1] : null;
            const isSameFolder = (folder ?? null) === (parentId ?? null);
            const isSameFile = asset.get('name').toLowerCase() === filename.toLowerCase();
            return isSameFolder && isSameFile;
        });
        return collision ? `A script named "${filename}" already exists in this folder. Please use another name.` : null;
    });

    editor.method('assets:create:script', (args: { filename?: string; parent?: any; text?: string } = {}, callback: (asset: unknown) => void = () => {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const {
            filename = 'script.js',
            parent = editor.call('assets:selected:folder'),
            text
        } = args;

        const collisionError = editor.call('assets:script:checkCollision', filename, parent);
        if (collisionError) {
            editor.call('status:error', collisionError);
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
