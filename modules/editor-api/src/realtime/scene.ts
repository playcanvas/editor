import { Events } from '@playcanvas/observer';

import type { Entity } from '../entity';
import type { Realtime } from '../realtime';
import type { RealtimeConnection } from './connection';

/**
 * Represents a scene in sharedb
 *
 * @category Internal
 */
class RealtimeScene extends Events {
    private _uniqueId: number;

    private _realtime: Realtime;

    private _connection: RealtimeConnection;

    private _document: any;

    private _loaded: boolean;

    private _evtConnection: any;

    /**
     * Constructor
     *
     * @param uniqueId - The unique scene id
     * @param realtime - The realtime API
     * @param connection - The realtime connection
     */
    constructor(uniqueId: number, realtime: Realtime, connection: RealtimeConnection) {
        super();
        this._uniqueId = uniqueId;
        this._realtime = realtime;
        this._connection = connection;
        this._document = null;
        this._loaded = false;

        this._evtConnection = null;
    }

    /**
     * Loads scene from sharedb and subscribes to changes.
     */
    load() {
        if (this._document) return;

        this._document = this._connection.getDocument('scenes', this._uniqueId);
        this._document.on('error', this._onError.bind(this));
        this._document.on('load', this._onLoad.bind(this));

        this._evtConnection = this._realtime.on('disconnect', this.unload.bind(this));

        this._document.subscribe();
    }

    /**
     * Unloads scene from sharedb and unsubscribes from changes.
     */
    unload() {
        if (!this._document) return;

        this._document.destroy();
        this._document = null;
        this._loaded = false;

        this._connection.send(`close:scene:${this._uniqueId}`);

        this._evtConnection.unbind();
        this._evtConnection = null;

        this.emit('unload');
    }

    /**
     * Add entity to scene
     *
     * @param entity - The entity
     */
    addEntity(entity: Entity) {
        this.submitOp({
            p: ['entities', entity.get('resource_id')],
            oi: entity.json()
        });
    }

    /**
     * Removes entity from scene (not from children of another entity)
     *
     * @param entity - The entity
     */
    removeEntity(entity: Entity) {
        this.submitOp({
            p: ['entities', entity.get('resource_id')],
            od: {}
        });
    }

    /**
     * Submits sharedb operation
     *
     * @param op - The operation
     */
    submitOp(op: object) {
        if (!this._loaded) return;

        try {
            this._document.submitOp([op]);
        } catch (err) {
            console.error(err);
            this._realtime.emit('error:scene', err, this._uniqueId);
        }
    }

    /**
     * Calls the callback when there are no changes pending to be
     * sent to the server
     *
     * @param callback - The callback
     */
    whenNothingPending(callback: Function) {
        if (this._document) {
            this._document.whenNothingPending(callback);
        }
    }

    private _onError(err: any) {
        this._realtime.emit('error:scene', err, this._uniqueId);
    }

    private _onLoad() {
        // notify of operations
        this._document.on('op', this._onOp.bind(this));
        this._loaded = true;
        this.emit('load');
    }

    private _onOp(ops: any, local: boolean) {
        if (local) return;

        for (let i = 0; i < ops.length; i++) {
            if (ops[i].p[0]) {
                this._realtime.emit('scene:op', ops[i].p[0], ops[i]);
            }
        }
    }

    /**
     * Whether the scene is loaded
     */
    get loaded() {
        return this._loaded;
    }

    /**
     * The scene data
     */
    get data() {
        return ((this._loaded && this._document) ? this._document.data : null) as any;
    }

    /**
     * The scene id - used in combination with the branch id
     */
    get id() {
        return this.data?.item_id as number;
    }

    /**
     * The scene's unique id
     */
    get uniqueId() {
        return this._uniqueId;
    }
}

export { RealtimeScene };
