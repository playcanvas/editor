/**
 * Previously a service worker had been registered to handle the mapping of assets to URLs.
 * This was done by registering a service worker with a URL mapping script.
 * This has now been deprecated and the service worker needs to be explicitly unregistered.
 */
editor.on('load', async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const reg of registrations) {
        if (reg.active?.scriptURL.endsWith('url-map-sw.js')) {
            reg.unregister();
        }
    }
});
