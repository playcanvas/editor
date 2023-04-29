import { Events } from '@playcanvas/observer';
import { Ajax } from '../common/ajax.js';

class Editor extends Events {
    constructor() {
        super();

        /** @type {Map<string, Function>} */
        this.methods = new Map();
    }

    /**
     * @param {string} name - The name of the method to add.
     * @param {Function} fn - The function to call when the method is called.
     */
    method(name, fn) {
        if (this.methods.get(name)) {
            throw new Error(`Editor method '${name}' already registered`);
        }
        this.methods.set(name, fn);
    }

    /**
     * @param {string} name - The name of the method to remove.
     */
    methodRemove(name) {
        this.methods.delete(name);
    }

    /**
     * @param {string} name - The name of the method to call.
     * @param {...*} args - The arguments to pass to the method.
     * @returns {*} The return value of the method.
     */
    call(name, ...args) {
        const fn = this.methods.get(name);
        if (fn) {
            try {
                return fn(...args);
            } catch (error) {
                console.info('%c%s %c(editor.method error)', 'color: #06f', name, 'color: #f00');
                log.error(error);
            }
        }
        return null;
    }
}

// editor
window.editor = new Editor();

// config
(function () {

    const applyConfig = function (path, value) {
        if (typeof value === 'object') {
            for (const key in value) {
                applyConfig((path ? path + '.' : '') + key, value[key]);
            }
        } else {
            Ajax.param(path, value);
        }
    };

    applyConfig('', config);
})();
