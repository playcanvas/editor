import type { Observer } from '@playcanvas/observer';

import { registerSW } from '../../common/service-worker';


editor.on('load', async () => {
    // Register the service worker
    const { error, swc, worker } = await registerSW('/editor/scene/js/url-map.sw.js');
    if (error) {
        console.error(error);
        return;
    }

    // If the SW is not controlling the current page, we force it to.
    if (swc.controller === null) {
        worker.postMessage({ message: 'importmap:claim' });
    }

    /**
     * Sends a message to the service worker and waits for a response
     *
     * @param {string} message - The message to send to the service worker
     * @param {any} data - The data to send to the service worker
     * @returns {Promise<void>} - A promise that resolves when the service worker responds to the message
     */
    const send = (message, data) => new Promise((resolve, reject) => {
        const onMessage = (event) => {
            navigator.serviceWorker.removeEventListener('message', onMessage);
            switch (event.data.message) {
                case `${message}:success`: {
                    resolve();
                    break;
                }
                case `${message}:error`: {
                    reject(new Error(event.data.error));
                    break;
                }
            }
        };
        navigator.serviceWorker.addEventListener('message', onMessage);
        worker.postMessage({ message, data });
    });

    /**
     * Watches an asset for changes to its name and path
     *
     * @param {string} assetId - The id of the asset to watch
     * @param {function(): void} callback - The callback to call when the asset changes;
     */
    const watchAsset = (assetId, callback) => {
        const asset = editor.call('assets:get', assetId);
        if (!asset) {
            return;
        }

        asset.on('path:set', callback);
        asset.on('name:set', callback);
    };

    /**
     * Unwatches an asset for changes to its name and path
     *
     * @param {string} assetId - The id of the asset to unwatch
     * @param {function(): void} callback - The callback to remove from the asset
     */
    const unwatchAsset = (assetId, callback) => {
        const asset = editor.call('assets:get', assetId);
        if (!asset) {
            return;
        }

        asset.unbind('path:set', callback);
        asset.unbind('name:set', callback);
    };

    /**
     * Creates a url mapping from an asset
     *
     * @param scriptAsset - The asset to create a url mapping from
     * @returns - The url mapping
     */
    const createUrlMapping = (scriptAsset: Observer): { url: string, mappedUrl: string } => {
        const url = new URL(`${pc.app.assets.prefix}${scriptAsset.get('file.url')}`, location.origin);
        return {
            url: `${url.origin}${url.pathname}`,
            mappedUrl: `${url}`
        };
    };

    /**
     * Creates a url mapping and registers it with the service worker
     *
     * @param asset - The asset to add to the service worker
     * @returns - A promise that resolves when the asset has been added to the service worker
     */
    const addScript = (asset: Observer) => {
        const assetId = asset.get('id');
        const { url, mappedUrl } = createUrlMapping(asset);

        const update = async () => {
            // remove the old mapping
            await send('importmap:remove', { url });
            unwatchAsset(assetId, update);
            asset.get('path').forEach(id => unwatchAsset(id, update));

            // add the new mapping
            addScript(asset);
        };

        // listen for path/name changes and register the new script
        watchAsset(assetId, update);
        asset.get('path').forEach(id => watchAsset(id, update));
        return send('importmap:add', { url, mappedUrl });
    };

    /**
     * This method assumes that the asset list has been constructed
     */
    editor.method('sw:initialize', () => {
        const registerAsset = (asset) => {
            // ignore non ESM script assets
            if (!editor.call('assets:isModule', asset)) {
                return Promise.resolve();
            }

            // add script of file url is already set
            if (asset.get('file.url')) {
                return addScript(asset);
            }

            return new Promise((resolve) => {
                asset.once('file.url:set', () => {
                    addScript(asset).then(resolve);
                });
            });
        };

        // But for the initial list, do them in sequence:
        const assets = editor.call('assets:list');

        editor.on('assets:add', registerAsset);

        // Register assets sequentially
        return assets.reduce(
            (p, asset) => p.then(() => registerAsset(asset)), Promise.resolve());

    });

});
