import { Events } from '@playcanvas/observer';

import { RealtimeScene } from './scene';
import { Realtime } from '../realtime';
import { RealtimeConnection } from './connection';

/**
 * Provides methods to load scenes from sharedb
 *
 * @category Internal
 */
class RealtimeScenes extends Events {
    private _realtime: Realtime;

    private _connection: RealtimeConnection;

    private _scenes: Record<number, RealtimeScene>;

    private _currentScene: RealtimeScene;

    /**
     * Constructor
     *
     * @param realtime - The realtime API
     * @param connection - The realtime connection
     */
    constructor(realtime: Realtime, connection: RealtimeConnection) {
        super();
        this._realtime = realtime;
        this._connection = connection;
        this._scenes = {};
        this._currentScene = null;
    }

    /**
     * Loads a scene
     *
     * @param sceneId - The scene id
     * @returns The scene
     */
    load(sceneId: number) {
        this._currentScene = this._scenes[sceneId];

        if (!this._currentScene) {
            this._currentScene = new RealtimeScene(sceneId, this._realtime, this._connection);
            this._scenes[sceneId] = this._currentScene;
        }

        if (!this._currentScene.loaded) {
            this._currentScene.load();
            this._currentScene.once('load', () => {
                this._realtime.emit('load:scene', this._currentScene);
            });
        }

        return this._currentScene;
    }

    /**
     * Unloads a scene
     *
     * @param sceneId - The scene id
     */
    unload(sceneId: number) {
        if (this._scenes[sceneId]) {
            this._scenes[sceneId].unload();
            if (this._currentScene === this._scenes[sceneId]) {
                this._currentScene = null;
            }

            delete this._scenes[sceneId];
        }
    }

    /**
     * The current scene
     */
    get current() {
        return this._currentScene;
    }
}

export { RealtimeScenes };
