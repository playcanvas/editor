import { Events } from '@playcanvas/observer';

class CodeEditor extends Events {
    constructor() {
        super();

        /** @type {Map<string, Function>} */
        this.methods = new Map();

        // used by other tabs to identify if this is the code editor
        this.isCodeEditor = true;

        // tab visibility
        document.addEventListener('visibilitychange', () => {
            this.emit(document.visibilityState);
            this.emit('visibility', document.visibilityState === 'visible');
        });

        this.method('visibility', () => {
            return document.visibilityState === 'visible';
        });

        // first load
        document.addEventListener('DOMContentLoaded', () => {
            this.emit('load');
            this.emit('start');

            // if there is a merge in progress for our branch
            if (config.self.branch.merge && !config.self.branch.merge.conflict) {
                this.call('picker:versioncontrol:mergeOverlay');
            }
        });
    }

    /**
     * @param {string} name - The name of the method to add.
     * @param {Function} fn - The function to call when the method is called.
     */
    method(name, fn) {
        if (this.methods.get(name)) {
            throw new Error(`Code Editor method '${name}' already registered`);
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

window.editor = new CodeEditor();

// set window name if necessary
if (!window.name) {
    window.name = 'codeeditor:' + config.project.id;
}

// config
(function () {
    const applyConfig = function (path, value) {
        if (typeof (value) === 'object') {
            for (const key in value) {
                applyConfig((path ? path + '.' : '') + key, value[key]);
            }
        } else {
            Ajax.param(path, value);
        }
    };

    applyConfig('', config);
})();
