import { Events } from '@playcanvas/observer';

import { RealtimeAsset } from './asset';
import { Realtime } from '../realtime';
import { RealtimeConnection } from './connection';

/**
 * Provides methods to load assets from sharedb
 *
 * @category Internal
 */
class RealtimeAssets extends Events {
    private _realtime: Realtime;

    private _connection: RealtimeConnection;

    private _assets: Record<number, RealtimeAsset>;

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
        this._assets = {};
    }

    /**
     * Loads an asset
     *
     * @param id - The asset's unique id
     * @returns The asset
     */
    load(id: number) {
        let asset = this._assets[id];
        if (!asset) {
            asset = new RealtimeAsset(id, this._realtime, this._connection);
            this._assets[id] = asset;
        }

        if (!asset.loaded) {
            asset.load();
        }

        return asset;
    }

    /**
     * Gets an already loaded asset
     *
     * @param id - The asset's unique id
     * @returns The asset
     */
    get(id: number) {
        return this._assets[id] || null;
    }

    /**
     * Unloads an asset
     *
     * @param id - The asset's unique id
     */
    unload(id: number) {
        if (this._assets[id]) {
            this._assets[id].unload();
            delete this._assets[id];
        }
    }
}

export { RealtimeAssets };
