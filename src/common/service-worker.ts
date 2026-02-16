/**
 * This function registers a url mapping with a service worker
 *
 * @param scriptURL - The URL of the service worker script
 * @param scope - The scope of the service worker
 * @returns A promise that resolves with the service worker container and the service worker
 */
export const registerSW = async (scriptURL = '', scope = '/'): Promise<{
    error?: string;
    swc?: ServiceWorkerContainer;
    worker?: ServiceWorker;
}> => {
    const swc = window.navigator.serviceWorker;
    if (!swc) {
        return {
            error: 'Service workers are not supported in this browser'
        };
    }

    // Register an es module type sw with origin scope
    const registration = await swc.register(scriptURL, { scope, type: 'module' });

    // Wait for the service worker to become active
    await swc.ready;

    // If the service worker is not active, throw an error
    if (!registration.active) {
        return {
            error: 'Service worker registration failed'
        };
    }

    return {
        swc,
        worker: registration.active
    };

};

/**
 * Unregister service workers
 *
 * @param exclude - An array of service worker URLs to exclude from the unregister process
 */
export const unregisterSWs = async (exclude: string[] = []) => {
    const swc = window.navigator.serviceWorker;
    const registrations = await swc.getRegistrations();
    await Promise.all(registrations
    .filter(sw => !exclude.includes(sw.active?.scriptURL))
    .map(sw => sw.unregister()));
};
