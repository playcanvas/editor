/**
 * This Service Worker remaps asset urls to custom urls.
 * It contains a url mapping that will intercept any paths under its scope and map it to an associated path in the cache.
 *
 * e.g. `/my/custom/new/file.js` -> `/my/actual/file.js?id=39`
 *
 * You can add a rule to the url map by posting a message with 'importmap:add' scope.
 * @example
 * ```
 * const rule = { url: '/my/actual/file.mjs?id=39', mappedUrl: '/my/custom/new/file.mjs' }
 * postMessage({ message: 'importmap:add', data: rule })
 * ```
 *
 * And remove a rule using the 'importmap:remove' mechanism.
 * @example
 * ```
 * const rule = { url: '/my/actual/file.mjs?id=39' }
 * postMessage({ message: 'importmap:remove', data: rule })
 * ```
 *
 * Then any request to `/my/custom/new/file.mjs` will be mapped to `/my/actual/file.mjs?id=39` at the network level
 */

// Type cast
const worker: ServiceWorkerGlobalScope & self = (self);

// Constants
const SCOPE = '/api/assets/';
const SUPPORTED_FILE_TYPES = ['.mjs'];

const isWithinScope = url => url.startsWith(SCOPE);
const isSupportedFile = url => SUPPORTED_FILE_TYPES.some(suffix => url.endsWith(suffix));
const requestOriginatesFromSupportedFile = (request) => {
    if (!request.referrer) {
        return false;
    }
    const url = new URL(request.referrer);

    // The request did not originate from an asset registry script, so allow it.
    if (!isWithinScope(url.pathname)) {
        return true;
    }

    // The request originated from an asset registry script, so check if it's from a supported 'mjs' file type
    return isSupportedFile(url.pathname);
};

/**
 * Returns the cache storage for the given client. If the client is not connected,
 * it will return the cache storage for the first visible connected client. This is
 * beneficial when the request originates from a worker, which _may_ have a different client id
 * to the originating browser context
 *
 * @param {string} id - The client id
 * @returns {Promise<Cache>} - The cache storage for the given client.
 */
const getCacheStorage = async (id) => {
    let hasCache = await caches.has(id);
    if (hasCache) {
        return caches.open(id);
    }

    // If no cache storage is found, the request may be from a worker, so check all clients
    const allClients = await worker.clients.matchAll({ type: 'window' });
    const client =  allClients.find(({ frameType, visibilityState }) => (frameType === 'top-level' || frameType === 'auxiliary') && visibilityState === 'visible');

    if (!client) {
        return;
    }
    hasCache = await caches.has(client.id);
    if (hasCache) {
        return caches.open(client.id);
    }
};


/**
 * Given a Request object, maps the import to the actual file
 * @param {FetchEvent} event - The fetch event that contains the Request object
 * @returns {Promise<Response>} The response containing the mapped response
 */
const mapImport = async (event) => {
    try {
        const [url] = event.request.url.split('?');

        const cache = await getCacheStorage(event.clientId);

        if (!cache) {
            return fetch(event.request.url);
        }

        const cacheResponse = await cache.match(url);
        const mappedUrl = await cacheResponse?.text();
        const response = fetch(mappedUrl ?? event.request.url);
        return response;

    } catch (error) {
        console.error('Fetch error:', error);
        return new Response('Service Worker fetch error', { status: 500 });
    }
};

/**
 * Deletes the entire cache storage.
 */
const deleteCache = async () => {
    const keys = await caches.keys();
    const deletePromise = keys.map(key => caches.delete(key));
    await Promise.all(deletePromise);
};

/**
 * Deletes the cache storage for all clients that are not currently connected
 */
const deleteCacheForUncontrolledClients = async () => {
    // Return a list of Clients
    const clients = await worker.clients.matchAll();
    const ids = clients.map(({ id }) => id);

    // and the storage keys
    const cacheKeys = await caches.keys();

    // Delete any orphaned storage that doesn't have a corresponding client
    for (const key of cacheKeys) {
        if (!ids.includes(key)) {
            caches.delete(key);
        }
    }
};

const isValidUrlMapping = ({ url, mappedUrl }) => {

    // Check if defined
    if (url === undefined || mappedUrl === undefined) {
        return false;
    }

    // ensure they are strings
    if (typeof url !== 'string' || typeof mappedUrl !== 'string') {
        return false;
    }

    // ensure they are urls
    if (!url.startsWith('http') || !mappedUrl.startsWith('http')) {
        return false;
    }

    const urlObj = new URL(url);
    const mappedUrlObj = new URL(mappedUrl);

    // Ensure the mapped url is within the same origin
    if (mappedUrlObj.origin !== worker.location.origin) {
        return false;
    }

    // ensure correct scope
    if (!isWithinScope(urlObj.pathname) || !isWithinScope(mappedUrlObj.pathname)) {
        return false;
    }

    // ensure correct file type
    if (!isSupportedFile(urlObj.pathname) || !isSupportedFile(mappedUrlObj.pathname)) {
        return false;
    }

    return true;
};

// Event listeners

worker.addEventListener('message', async (event) => {

    const message = event.data?.message;
    if (!message) {
        return;
    }

    switch (message) {
        case 'importmap:claim': {
            worker.clients.claim();
            break;
        }
        case 'importmap:add': {
            const { data } = event.data;

            // sanitize input and return early if invalid
            if (!isValidUrlMapping(data)) {
                event.source.postMessage({ message: 'importmap:add:error', error: 'Invalid url mapping' });
                return;
            }

            try {
                const response = new Response(data.mappedUrl);
                const cache = await caches.open(event.source.id);
                await cache.put(data.url, response);
                event.source.postMessage({ message: 'importmap:add:success' });
            } catch (error) {
                console.error('Cache error:', error);
                event.source.postMessage({ message: 'importmap:add:error', error: error.message });
            }
            break;
        }
        case 'importmap:remove': {
            const { data } = event.data;

            // sanitize input and return early if invalid
            if (!data.url) {
                event.source.postMessage({ message: 'importmap:remove:error', error: 'Invalid url mapping' });
                return;
            }

            // Get the cache storage for the client
            const cache = await getCacheStorage(event.source.id);
            if (!cache) {
                console.warn(`No cache storage found for url '${data.url}'`);
                event.source.postMessage({ message: 'importmap:remove:success' });
                return;
            }

            try {
                await cache.delete(data.url);
                event.source.postMessage({ message: 'importmap:remove:success' });
            } catch (error) {
                console.error('Cache error:', error);
                event.source.postMessage({ message: 'importmap:remove:error', error: error.message });
            }
            break;
        }
    }
});

// Intercept all fetch requests
worker.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // If the request is for an es module, map the import to the actual file
    if (isWithinScope(url.pathname) && isSupportedFile(url.pathname) && requestOriginatesFromSupportedFile(event.request)) {
        event.respondWith(mapImport(event));
    }
});

// These helper functions ensure the SW is active and controlling the page when it' installed
worker.addEventListener('activate', event => event.waitUntil(worker.clients.claim()));
worker.addEventListener('install', event => event.waitUntil(Promise.all([
    deleteCache(), // Flush all cache storage on load
    worker.skipWaiting() // resilient against Ctrl_F5 hard reset
])));
// Purge cache every 10 minutes for any orphaned client storage
setInterval(deleteCacheForUncontrolledClients, 1000 * 60 * 10);
