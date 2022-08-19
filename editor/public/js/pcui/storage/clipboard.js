Object.assign(pcui, (function () {
    'use strict';

    /**
     * @name pcui.Clipboard
     * @classdesc Represents a custom clipboard with a specific name
     * which stores a value in localStorage under that name
     * @property {object} value Gets / sets the value stored in the clipboard. Pass null to clear the value from storage.
     * @property {boolean} empty Gets whether the clipboard is empty
     */
    class Clipboard {
        /**
         * Creates a new instance of pcui.Clipboard
         *
         * @param {string} name - The name of the clipboard.
         */
        constructor(name) {
            this._name = name;
            // we could pass the desired storage as a parameter to change to SessionStorage for example
            this._storage = new api.LocalStorage();
        }

        get empty() {
            return !this._storage.has(this._name);
        }

        get value() {
            return this._storage.get(this._name);
        }

        set value(value) {
            if (value !== null) {
                this._storage.set(this._name, value);
            } else {
                this._storage.unset(this._name);
            }
        }
    }

    return {
        Clipboard: Clipboard
    };
})());
