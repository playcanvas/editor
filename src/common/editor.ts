import * as api from '@playcanvas/editor-api';
import * as observer from '@playcanvas/observer';

class Editor extends observer.Events {
    /**
     * The name of the Editor.
     *
     * @type {string}
     */
    _name = 'Editor';

    /**
     * Exposed API for the Editor.
     *
     * @type {typeof api}
     */
    api = api;

    /**
     * Exposed Observer for the Editor.
     *
     * @type {typeof observer}
     */
    observer = observer;

    /**
     * The methods registered with the Editor.
     *
     * @type {Map<string, Function>}
     */
    methods = new Map();

    /**
     * Whether the Editor is a code editor.
     *
     * @type {boolean}
     */
    isCodeEditor = false;

    /**
     * Whether the Editor project is using engine v2.
     *
     * @type {boolean}
     */
    projectEngineV2 = config.project?.settings?.engineV2 ?? false;

    constructor(name) {
        super();
        this._name = name ?? 'Editor';

        this._registerVisibility();
        this._registerLoad();
        this._registerApi();

        // set globals on editor
        this.history = api.globals.history;
        this.selection = api.globals.selection;
        this.schema = api.globals.schema;
        this.realtime = api.globals.realtime;
        this.settings = api.globals.settings;
        this.messenger = api.globals.messenger;
        this.assets = api.globals.assets;
        this.entities = api.globals.entities;
        this.jobs = api.globals.jobs;
        this.clipboard = api.globals.clipboard;
    }

    /**
     * Register the visibility method and event.
     *
     * @private
     */
    _registerVisibility() {
        this.method('visibility', () => {
            return document.visibilityState === 'visible';
        });

        document.addEventListener('visibilitychange', () => {
            this.emit(document.visibilityState);
            this.emit('visibility', document.visibilityState === 'visible');
        }, false);
    }

    /**
     * Register the load and loaded events.
     *
     * @private
     */
    _registerLoad() {
        document.addEventListener('DOMContentLoaded', () => {
            this.emit('load');
            queueMicrotask(() => this.emit('loaded'));
        }, false);
    }

    /**
     * Register the API for the Editor.
     *
     * @protected
     */
    _registerApi() {
        // Initialize API globals - order matters
        console.log(`PlayCanvas Editor API v${api.version} revision ${api.revision}`);
        api.globals.accessToken = config.accessToken;
        api.globals.projectId = config.project.id;
        api.globals.branchId = config.self.branch.id;
        api.globals.apiUrl = config.url.api;
        api.globals.homeUrl = config.url.home;
        api.globals.rest = new api.Rest();
    }

    /**
     * @param {string} name - The name of the method to add.
     * @param {Function} fn - The function to call when the method is called.
     */
    method(name, fn) {
        if (this.methods.get(name)) {
            throw new Error(`${this._name} method '${name}' already registered`);
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

    /**
     * @param {string} name - The name of the method to call.
     * @param {...*} args - The arguments to pass to the method.
     * @returns {*} The return value of the method.
     */
    invoke(name, ...args) {
        const fn = this.methods.get(name);
        if (fn) {
            return fn(...args);
        }
        return null;
    }

    /**
     * @param {string} path - The path to check in the engine.
     * @returns {boolean} Whether the engine has the property.
     */
    validateEnginePath(path) {
        const parts = path.split('.');
        let obj = pc;
        for (let i = 0; i < parts.length; i++) {
            if (!obj.hasOwnProperty(parts[i]) && obj[parts[i]] === undefined) {
                return false;
            }
            obj = obj[parts[i]];
        }
        return true;
    }
}

export { Editor };
