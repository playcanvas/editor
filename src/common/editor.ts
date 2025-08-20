import * as api from '@playcanvas/editor-api';
import * as observer from '@playcanvas/observer';

import { Caller } from './caller.ts';

type EditorMethods = {
    'load': () => void;
    'loaded': () => void;
    'visibility': () => boolean;
} & Record<string, (...args: any[]) => any>;

class Editor<T extends EditorMethods> extends Caller<T> {
    /**
     * Exposed API for the Editor.
     */
    api: typeof api = api;

    /**
     * Exposed Observer for the Editor.
     */
    observer: typeof observer = observer;

    /**
     * Whether the Editor is a code editor.
     */
    isCodeEditor: boolean = false;

    /**
     * Whether the Editor project is using engine v2.
     */
    projectEngineV2: boolean = config.project?.settings?.engineV2 ?? false;

    /**
     * Editor API history global
     */
    history: typeof api.globals.history;

    /**
     * Editor API selection global
     */
    selection: typeof api.globals.selection;

    /**
     * Editor API schema global
     */
    schema: typeof api.globals.schema;

    /**
     * Editor API realtime global
     */
    realtime: typeof api.globals.realtime;

    /**
     * Editor API settings global
     */
    settings: typeof api.globals.settings;

    /**
     * Editor API messenger global
     */
    messenger: typeof api.globals.messenger;

    /**
     * Editor API assets global
     */
    assets: typeof api.globals.assets;

    /**
     * Editor API entities global
     */
    entities: typeof api.globals.entities;

    /**
     * Editor API jobs global
     */
    jobs: typeof api.globals.jobs;

    /**
     * Editor API clipboard global
     */
    clipboard: typeof api.globals.clipboard;

    /**
     * @param name - The name of the Editor.
     */
    constructor(name: string = 'Editor') {
        super(name);

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
     */
    private _registerVisibility() {
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
     */
    private _registerLoad() {
        document.addEventListener('DOMContentLoaded', () => {
            this.emit('load');
            queueMicrotask(() => this.emit('loaded'));
        }, false);
    }

    /**
     * Register the API for the Editor.
     */
    protected _registerApi() {
        // Initialize API globals - order matters
        console.log(`PlayCanvas Editor API v${api.version} revision ${api.revision}`);
        api.globals.accessToken = config.accessToken;
        api.globals.projectId = config.project.id;
        api.globals.branchId = config.self.branch.id;
        api.globals.apiUrl = config.url.api;
        api.globals.homeUrl = config.url.home;
        api.globals.rest = new api.Rest();
    }
}

export {
    type EditorMethods,
    Editor
};
