import { LocalStorage } from './localstorage';

/**
 * Represents a custom clipboard with a specific name
 * which stores a value in localStorage under that name
 *
 * @category Internal
 */
class Clipboard {
    private _name: string;

    private _storage: LocalStorage;

    /**
     * Constructor
     *
     * @param name - The name of the clipboard.
     */
    constructor(name: string) {
        this._name = name;
        // we could pass the desired storage as a parameter to change to SessionStorage for example
        this._storage = new LocalStorage();
    }

    /**
     * Gets whether the clipboard is empty
     */
    get empty() {
        return !this._storage.has(this._name);
    }

    /**
     * Sets the value to be stored in the clipboard. Pass null to clear the value from storage.
     */
    set value(value: object | string) {
        if (value !== null) {
            this._storage.set(this._name, value);
        } else {
            this._storage.unset(this._name);
        }
    }

    /**
     * Gets the value stored in the clipboard.
     */
    get value() {
        return this._storage.get(this._name) as (object | string);
    }
}

export { Clipboard };
