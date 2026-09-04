import { Events } from '@playcanvas/observer';

import { RealtimeSchemaRepair, planSchemaRepair } from '../../common/realtime-schema-repair';
import type { JsonOp } from '../../common/realtime-schema-repair';
import { globals as api } from '../globals';
import type { Realtime } from '../realtime';

import type { RealtimeConnection } from './connection';

/**
 * Represents an asset in sharedb
 *
 * @category Internal
 */
class RealtimeAsset extends Events {
    private _uniqueId: number;

    private _realtime: Realtime;

    private _connection: RealtimeConnection;

    private _document: any;

    private _loaded: boolean;

    private _evtConnection: any;

    private _repair: RealtimeSchemaRepair;

    /**
     * Constructor
     *
     * @param uniqueId - The unique asset id
     * @param realtime - The realtime API
     * @param connection - The realtime connection
     *
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
     * Loads asset from sharedb and subscribes to changes.
     */
    load() {
        if (this._document) {
            return;
        }

        this._document = this._connection.getDocument('assets', this._uniqueId);
        this._document.on('error', this._onError.bind(this));
        this._document.on('load', this._onLoad.bind(this));
        const doc = this._document;
        this._repair = new RealtimeSchemaRepair(
            doc,
            () => planSchemaRepair(api.schema, 'asset', doc.data),
            (ops) => this._onOp(ops, false),
            (err) => this._onError(err as string)
        );

        this._evtConnection = this._realtime.on('disconnect', this.unload.bind(this));

        this._document.subscribe();
    }

    /**
     * Unloads asset from sharedb and unsubscribes from changes.
     */
    unload() {
        if (!this._document) {
            return;
        }

        this._document.destroy();
        this._document = null;
        this._loaded = false;

        this._evtConnection.unbind();
        this._evtConnection = null;

        this.emit('unload');
    }

    /**
     * Submits sharedb operation
     *
     * @param op - The operation
     * @param callback - The callback
     */
    submitOp(op: JsonOp, callback?: (...args: any[]) => unknown) {
        if (!this._loaded) {
            return;
        }

        try {
            void this._repair.submit(op, callback);
        } catch (err) {
            console.error(err);
            this._realtime.emit('error:asset', err, this._uniqueId);
        }
    }

    /**
     * Calls the callback when there are no changes pending to be
     * sent to the server
     *
     * @param callback - The callback
     */
    whenNothingPending(callback: (...args: any[]) => unknown) {
        if (this._document) {
            this._document.whenNothingPending(callback);
        }
    }

    _onError(err: string) {
        if (this._connection.connected) {
            console.warn(err);
        } else {
            this._realtime.emit('error:asset', err, this._uniqueId);
        }
    }

    _onLoad() {
        const assetData = this._document.data;
        if (!assetData) {
            const err = `Could not load asset: ${this._uniqueId}`;
            this._onError(err);
            this.unload();
            this.emit('error:load', err);
            return;
        }

        // notify of operations
        this._document.on('op', this._onOp.bind(this));
        this._loaded = true;
        this.emit('load');
    }

    _onOp(ops: JsonOp[], local: boolean) {
        if (local || !this._loaded) {
            return;
        }

        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            if (op.p[0]) {
                this._realtime.emit('asset:op', op, this._uniqueId);
            }
        }
    }

    /**
     * Whether the asset is loaded
     */
    get loaded() {
        return this._loaded;
    }

    /**
     * The asset data
     */
    get data() {
        return (this._loaded && this._document ? this._document.data : null) as any;
    }

    /**
     * The asset id - used in combination with branch id
     */
    get id() {
        return this.data?.item_id as number;
    }

    /**
     * The asset's unique id
     */
    get uniqueId() {
        return this._uniqueId;
    }
}

export { RealtimeAsset };
