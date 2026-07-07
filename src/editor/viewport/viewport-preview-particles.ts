import type { EntityObserver } from '@/editor-api';

editor.once('load', () => {
    const index = {};
    let render = 0;

    editor.on('viewport:update', () => {
        if (render !== 0) {
            editor.call('viewport:render');
        }
    });

    const checkState = function (
        item: {
            entity: EntityObserver;
            active: boolean;
            entity?: { entity?: { particlesystem?: { enabled: boolean } }; get: (path: string) => unknown };
        },
        remove?: boolean
    ): void {
        if (remove || !item.entity.entity || !item.entity.entity.particlesystem) {
            if (item.active) {
                render--;
                item.active = false;

                if (item.entity.entity && item.entity.entity.particlesystem) {
                    item.entity.entity.particlesystem.enabled = false;
                }
            }
            return;
        }

        if (!remove && item.entity.get('components.particlesystem.enabled')) {
            if (!item.active) {
                render++;
                item.active = true;

                item.entity.entity.particlesystem.enabled = true;

                editor.call('viewport:render');
            }
        } else if (item.active) {
            render--;
            item.active = false;
            item.entity.entity.particlesystem.enabled = false;
        }
    };

    const add = function (entity: EntityObserver): void {
        const id = entity.get('resource_id');

        if (index[id]) {
            return;
        }

        const onCheckState = function () {
            checkState(item);
        };

        const item = (index[id] = {
            id: id,
            entity: entity,
            active: false,
            evtEnable: entity.on('components.particlesystem.enabled:set', () => {
                setTimeout(onCheckState, 0);
            }),
            evtSet: entity.on('components.particlesystem:set', onCheckState),
            evtUnset: entity.on('components.particlesystem:unset', onCheckState)
        });

        checkState(item);
    };

    const remove = function (item: {
        id: string;
        evtEnable: { unbind: () => void };
        evtSet: { unbind: () => void };
        evtUnset: { unbind: () => void };
    }): void {
        checkState(item, true);

        item.evtEnable.unbind();
        item.evtSet.unbind();
        item.evtUnset.unbind();

        delete index[item.id];
    };

    const clear = function () {
        const keys = Object.keys(index);

        for (const key of keys) {
            remove(index[key]);
        }
    };

    editor.on('selector:change', (type: string, items: EntityObserver[]) => {
        clear();

        if (type !== 'entity') {
            return;
        }

        for (const item of items) {
            add(item);
        }
    });
});
