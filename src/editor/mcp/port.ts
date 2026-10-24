const MIN_PORT = 1;
const MAX_PORT = 65535;

/**
 * Parse an MCP server port from the port field or local storage. new WebSocket() throws on a
 * port outside 1-65535, so anything that isn't a whole number in that range is rejected.
 *
 * @param value - The raw value: the port field's text or a stored port.
 * @returns The port, or null if the value isn't a valid port.
 */
const parsePort = (value: unknown): number | null => {
    const text = String(value ?? '').trim();
    if (!/^\d{1,5}$/.test(text)) {
        return null;
    }
    const port = Number(text);
    return port >= MIN_PORT && port <= MAX_PORT ? port : null;
};

export { parsePort };
