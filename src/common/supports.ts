import type { BackendServices } from './backend';
import { backend, UNSUPPORTED, UNSUPPORTED_HTML } from './backend';

/**
 * Whether the backend supplies a service, telling the user when it does not. For the entry points
 * of workflows that need the service.
 *
 * @param name - The service.
 * @returns Whether it is supplied.
 */
export const supports = (name: keyof BackendServices) => {
    if (backend()[name]) {
        return true;
    }
    editor.call('status:text', UNSUPPORTED_HTML);
    return false;
};

/**
 * A service, for code past an entry point that checked `supports()`. Tells the user and throws if a
 * path reaches it without the service, instead of failing on `undefined`.
 *
 * @param name - The service.
 * @returns The service.
 */
export const service = <K extends keyof BackendServices>(name: K) => {
    const svc = backend()[name];
    if (!svc) {
        editor.call('status:text', UNSUPPORTED_HTML);
        throw new Error(`${name}: ${UNSUPPORTED}`);
    }
    return svc as NonNullable<BackendServices[K]>;
};
