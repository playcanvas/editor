import { Events } from '@playcanvas/observer';

import type { Entity } from '../entity';
import type { Realtime } from '../realtime';

import type { RealtimeConnection } from './connection';
import { ensureParentOps } from './ensure-parent-ops';
import type { Op } from './ensure-parent-ops';
import { batchRejections } from './rejections';

// sharedb composes consecutive edits into one pending op; capping its JSON keeps the message under the
// realtime server's 1 MiB limit even if every character takes 3 UTF-8 bytes
const MAX_COMPOSE_CHARS = 300000;

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

    private _onRejected = batchRejections((err, ops) => this._realtime.emit('error:scene', err, this._uniqueId, ops));

    private _composing: { op: unknown; chars: number } | null = null;

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
        if (this._document) {
            return;
        }

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
        if (!this._document) {
            return;
        }

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
        if (!this._loaded) {
            return;
        }

        try {
            const ops = ensureParentOps(this._document.data, op as Op);

            // start a new pending op once composing this one into the last would make it too large
            // to send, e.g. while pasting thousands of entities or editing through a disconnect
            const doc = this._document;
            const chars = JSON.stringify(ops).length;
            const last = doc.pendingOps[doc.pendingOps.length - 1];
            const open = !!last && !last.sentAt && this._composing?.op === last;
            const fits = open && this._composing.chars + chars <= MAX_COMPOSE_CHARS;
            const preventCompose = doc.preventCompose;
            doc.preventCompose = preventCompose || !fits;

            try {
                // a callback keeps the rejected op, which the doc 'error' event drops
                doc.submitOp(ops, (err: unknown) => {
                    if (err) {
                        this._onRejected(err, ops);
                    }
                });
            } finally {
                doc.preventCompose = preventCompose;
            }
            this._composing = {
                op: doc.pendingOps[doc.pendingOps.length - 1],
                chars: (fits ? this._composing.chars : 0) + chars
            };
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
    whenNothingPending(callback: (...args: any[]) => unknown) {
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
        if (local) {
            return;
        }

        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            if (op.p[0]) {
                this._realtime.emit('scene:op', op.p[0], op);
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
        return (this._loaded && this._document ? this._document.data : null) as any;
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
