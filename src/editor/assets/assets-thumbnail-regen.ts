import { isRemoteWrite } from '@/common/texture-thumbnails';

editor.once('load', () => {
    const serverRegen = (asset) => {
        editor.call('realtime:send', 'pipeline', {
            name: 'thumbnails',
            data: {
                target: asset.get('id')
            }
        });
    };

    // the client that toggled rgbm regenerates; the rest refresh when has_thumbnail flips back
    const clientRegen = (asset) => {
        if (isRemoteWrite(asset) || !editor.call('permissions:write')) {
            return;
        }
        const url = asset.get('file.url');
        if (!url) {
            return;
        }
        fetch(url)
            .then((res) => (res.ok ? res.blob() : Promise.reject(new Error(`${res.status}`))))
            .then((blob) => editor.call('assets:thumbnails:texture', asset, blob))
            .catch(() => serverRegen(asset));
    };

    const watchThumbnailRegen = (asset) => {
        asset.on('data.rgbm:set', () => {
            asset.set('has_thumbnail', false, true);
            clientRegen(asset);
        });
    };

    editor.call('assets:list').forEach(watchThumbnailRegen);
    editor.on('assets:add', watchThumbnailRegen);
});
