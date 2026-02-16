import { Events, Observer, ObserverHistory } from '@playcanvas/observer';

import { globals as api } from '../globals';
import type { RealtimeScene } from '../realtime/scene';

/**
 * Represents an observer for the Scene Settings, extending the base Observer.
 */
export type SceneSettingsObserver = Observer & { history: ObserverHistory };

/**
 * The Scene Settings API provides access to the settings of the currently loaded scene.
 */
class SceneSettings extends Events {
    private _observer: SceneSettingsObserver;

    private _history: ObserverHistory;

    /**
     * Creates new instance of the API
     */
    constructor() {
        super();

        this._initializeObserver();

        if (api.realtime) {
            api.realtime.on('load:scene', this._onLoadScene.bind(this));
        }
    }

    /**
     * Initialize internal observer and history.
     */
    private _initializeObserver() {
        if (!this._observer) {
            this._observer = new Observer() as SceneSettingsObserver;
        }

        if (this._history) {
            this._history.destroy();
        }

        this._history = new ObserverHistory({
            item: this._observer,
            prefix: 'settings.',
            history: api.history
        });
        this._observer.history = this._history as ObserverHistory;
    }

    /**
     * Called when a scene is loaded.
     *
     * @param scene - The loaded scene
     */
    private _onLoadScene(scene: RealtimeScene) {
        this._initializeObserver();

        this._history.enabled = false;
        this._observer.patch(scene.data.settings);
        this._history.enabled = true;

        this.emit('load');
    }

    /**
     * Checks if path exists. See the {@link SceneSettings} overview for a full list of properties.
     *
     * @param path - The path
     * @returns True if path exists
     * @example
     * ```javascript
     * console.log(editor.settings.scene.has('render.fog'));
     * ```
     */
    has(path: string) {
        return this._observer.has(path);
    }

    /**
     * Gets value at path. See the {@link SceneSettings} overview for a full list of properties.
     *
     * @param path - The path
     * @returns The value
     * @example
     * ```javascript
     * console.log(editor.settings.scene.get('render.fog'));
     * ```
     */
    get(path: string) {
        return this._observer.get(path);
    }

    /**
     * Sets value at path. See the {@link SceneSettings} overview for a full list of properties.
     *
     * @param path - The path
     * @param value - The value
     * @returns Whether the value was set
     * @example
     * ```javascript
     * editor.settings.scene.set('render.fog', 'none');
     * ```
     */
    set(path: string, value: any) {
        return this._observer.set(path, value);
    }

    /**
     * Returns JSON representation of scene settings data
     *
     * @returns - The data
     * @example
     * ```javascript
     * console.log(editor.settings.scene.json());
     * ```
     */
    json() {
        return this._observer.json();
    }

    get observer() {
        return this._observer;
    }

    /**
     * Gets the history object for this entity
     */
    get history() {
        return this._history;
    }
}

export { SceneSettings };
