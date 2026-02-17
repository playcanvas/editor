import { Observer, ObserverList } from '@playcanvas/observer';

editor.once('load', () => {
    const entities = new ObserverList({
        index: 'resource_id'
    });

    function createLatestFn(resourceId: string) {
        return function () {
            return entities.get(resourceId);
        };
    }

    // on adding
    entities.on('add', (obj: Observer) => {
        editor.emit('entities:add', obj);
    });

    editor.method('entities:add', (obj: Observer) => {
        entities.add(obj);

        // function to get latest version of entity observer
        obj.latestFn = createLatestFn(obj.get('resource_id'));
    });

    // on removing
    entities.on('remove', (obj: Observer) => {
        editor.emit('entities:remove', obj);
    });

    editor.method('entities:remove', (obj: Observer) => {
        entities.remove(obj);
    });

    // remove all entities
    editor.method('entities:clear', () => {
        entities.clear();
    });

    // Get entity by resource id
    editor.method('entities:get', (resourceId: string) => {
        return entities.get(resourceId);
    });

    editor.on('scene:raw', (data: { entities: Record<string, unknown> }) => {
        for (const key in data.entities) {
            entities.add(new Observer(data.entities[key] as object));
        }

        editor.emit('entities:load', data);
    });
});
