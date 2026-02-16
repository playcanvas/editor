/**
 * Wrapper around native local storage
 *
 * @category Internal
 */
class LocalStorage {
    private _cache: Record<string, { value: string; json: object | string }> = {};

    /**
     * Gets a key from localStorage
     *
     * @param key - The key
     * @returns The value
     */
    get(key: string) {
        const value = localStorage.getItem(key);
        if (value) {
            if (!this._cache[key] || this._cache[key].value !== value) {
                try {
                    this._cache[key] = {
                        value: value,
                        json: JSON.parse(value)
                    };
                } catch (e) {
                    console.error(e);
                }
            }

            return this._cache[key].json;
        }

        delete this._cache[key];

        return value;
    }

    /**
     * Stores a key-value to localStorage
     *
     * @param key - The key
     * @param value - The value
     */
    set(key: string, value: object | string) {
        const text = JSON.stringify(value);
        localStorage.setItem(key, text);
        this._cache[key] = {
            value: text,
            json: value
        };
    }

    /**
     * Removes a key from localStorage
     *
     * @param key - The key
     */
    unset(key: string) {
        localStorage.removeItem(key);
    }

    /**
     * Checks if key exists in local storage
     *
     * @param key - The key
     * @returns True or false
     */
    has(key: string) {
        return !!localStorage.getItem(key);
    }
}

export { LocalStorage };
