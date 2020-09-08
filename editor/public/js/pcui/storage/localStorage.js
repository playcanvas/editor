Object.assign(pcui, (function () {
    /**
     * @name pcui.LocalStorage
     * @classdesc Wrapper around native local storage
     */
    class LocalStorage {
        constructor() {
            this._cache = {};
        }

        /**
         * @name pcui.LocalStorage#get
         * @description Gets a key from localStorage
         * @param {String} key
         * @returns {Object} The value
         */
        get(key) {
            var value = localStorage.getItem(key);
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
            } else {
                delete this._cache[key];
            }

            return value;
        }

        /**
         * @name pcui.LocalStorage#set
         * @description Stores a key-value to localStorage
         * @param {String} key The key
         * @param {Object} value The value
         */
        set(key, value) {
            const text = JSON.stringify(value);
            localStorage.setItem(key, text);
            this._cache[key] = {
                value: text,
                json: value
            };
        }

        /**
         * @name pcui.LocalStorage#unset
         * @description Removes a key from localStorage
         * @param {String} key The key
         */
        unset(key) {
            localStorage.removeItem(key);
        }

        /**
         * @name pcui.LocalStorage#has
         * @description Checks if key exists in local storage
         * @param {String} key The key
         * @returns {Boolean} True or false
         */
        has(key) {
            return !!localStorage.getItem(key);
        }
    };

    return {
        LocalStorage: LocalStorage
    };

})());