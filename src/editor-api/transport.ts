/**
 * Where editor-api sends backend traffic. Clients keep their own protocol logic and only ask the
 * transport for the underlying request or socket, so a page can redirect that traffic without
 * changing request arguments, response handling or events.
 *
 * @category Internal
 */
export type Transport = {
    /**
     * Performs a request, with the native `fetch` signature and response.
     */
    fetch: typeof fetch;

    /**
     * Creates an unopened request with the native `XMLHttpRequest` interface.
     */
    xhr: () => XMLHttpRequest;

    /**
     * Opens a socket, with the native `WebSocket` constructor arguments and interface.
     */
    socket: (url: string | URL, protocols?: string | string[]) => WebSocket;
};

/**
 * The browser's own transport, used unless a page installs another. Globals are read per call so
 * a stubbed global is honored.
 *
 * @category Internal
 */
export const nativeTransport: Transport = {
    fetch: (input, init) => globalThis.fetch(input, init),
    xhr: () => new XMLHttpRequest(),
    socket: (url, protocols) => new WebSocket(url, protocols)
};
