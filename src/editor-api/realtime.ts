import { Events } from '@playcanvas/observer';

import { RealtimeAssets } from './realtime/assets';
import { RealtimeConnection } from './realtime/connection';
import { RealtimeScenes } from './realtime/scenes';

/**
 * Provides methods to communicate and load / save data to the realtime server
 *
 * @category Internal
 */
class Realtime extends Events {
    private _connection: RealtimeConnection;

    private _scenes: RealtimeScenes;

    private _assets: RealtimeAssets;

    constructor() {
        super();
        this._connection = new RealtimeConnection(this);
        this._scenes = new RealtimeScenes(this, this.connection);
        this._assets = new RealtimeAssets(this, this.connection);
    }

    /**
     * Gets the realtime connection
     */
    get connection() {
        return this._connection;
    }

    /**
     * Gets the realtime scenes API
     */
    get scenes() {
        return this._scenes;
    }

    /**
     * Gets the realtime assets API
     */
    get assets() {
        return this._assets;
    }
}


export { Realtime };
