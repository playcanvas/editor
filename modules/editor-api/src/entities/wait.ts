import type { EventHandle } from '@playcanvas/observer/types/event-handle';

import { Entity } from '../entity';
import { globals as api } from '../globals';

/**
 * Waits for specified entity ids to be added to the scene.
 * Once they are the callback is called with the entities as its argument.
 *
 * @param entityIds - The ids of the entities to wait for
 * @param timeoutMs - Number of ms to wait before stopping to wait
 * @param callback - The callback to call when all entities have been added.
 * The signature is (Entity[]) => void.
 * @returns Returns a cancel function which can be called to cancel calling the
 * callback when the entities are added.
 */
function wait(entityIds: string[], timeoutMs: number, callback: Function) {
    const index: Record<string, any> = {};
    let earlyOut = true;

    entityIds.forEach((id) => {
        index[id] = api.entities.get(id);
        if (!index[id]) {
            earlyOut = false;
        }
    });

    if (earlyOut) {
        callback(entityIds.map(id => index[id]));
        return () => { };
    }

    let timeout: ReturnType<typeof setTimeout>;

    const checkAllThere = () => {
        return entityIds.filter(id => !index[id]).length === 0;
    };

    let evtAdd: EventHandle;

    const cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        if (evtAdd) {
            evtAdd.unbind();
            evtAdd = null;
        }
    };

    const onAdd = (entity: Entity) => {
        const id = entity.get('resource_id');
        if (!index.hasOwnProperty(id)) return;

        index[id] = entity;

        if (checkAllThere()) {
            cancel();
            callback(entityIds.map(id => index[id]));
        }
    };

    evtAdd = api.entities.on('add', onAdd);

    timeout = setTimeout(cancel, timeoutMs);

    return cancel;
}

export { wait };
