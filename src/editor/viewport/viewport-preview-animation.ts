editor.once('load', () => {
    const index = { };
    let render = 0;


    editor.on('viewport:update', () => {
        if (render !== 0) {
            editor.call('viewport:render');
        }
    });

    const checkState = function (item, remove) {
        if (remove || !item.entity.entity || !item.entity.entity.animation) {
            if (item.active) {
                render--;
                item.active = false;

                if (item.entity.entity && item.entity.entity.animation) {
                    item.entity.entity.animation.enabled = false;
                }
            }
            return;
        }

        if (!remove && item.entity.get('components.animation.enabled')) {
            if (!item.active) {
                render++;
                item.active = true;

                item.entity.entity.animation.enabled = true;

                editor.call('viewport:render');
            }
        } else if (item.active) {
            render--;
            item.active = false;
            item.entity.entity.animation.enabled = false;
        }
    };

    const add = function (entity) {
        const id = entity.get('resource_id');

        if (index[id]) {
            return;
        }

        const onCheckState = function () {
            checkState(item);
        };

        var item = index[id] = {
            id: id,
            entity: entity,
            active: false,
            evtEnable: entity.on('components.animation.enabled:set', () => {
                setTimeout(onCheckState, 0);
            }),
            evtSet: entity.on('components.animation:set', onCheckState),
            evtUnset: entity.on('components.animation:unset', onCheckState)
        };

        checkState(item);
    };

    const remove = function (item) {
        checkState(item, true);

        item.evtEnable.unbind();
        item.evtSet.unbind();
        item.evtUnset.unbind();

        delete index[item.id];
    };

    const clear = function () {
        const keys = Object.keys(index);

        for (let i = 0; i < keys.length; i++) {
            remove(index[keys[i]]);
        }
    };


    editor.on('selector:change', (type, items) => {
        clear();

        if (type !== 'entity') {
            return;
        }

        for (let i = 0; i < items.length; i++) {
            add(items[i]);
        }
    });
});
