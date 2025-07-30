import { Observer, ObserverList } from '@playcanvas/observer';

editor.once('load', () => {
    const entities = new ObserverList({
        index: 'resource_id'
    });

    function createLatestFn(resourceId) {
        return function () {
            return entities.get(resourceId);
        };
    }

    // on adding
    entities.on('add', (obj) => {
        editor.emit('entities:add', obj);
    });

    editor.method('entities:add', (obj) => {
        entities.add(obj);

        // function to get latest version of entity observer
        obj.latestFn = createLatestFn(obj.get('resource_id'));
    });

    // on removing
    entities.on('remove', (obj) => {
        editor.emit('entities:remove', obj);
    });

    editor.method('entities:remove', (obj) => {
        entities.remove(obj);
    });

    // remove all entities
    editor.method('entities:clear', () => {
        entities.clear();
    });

    // Get entity by resource id
    editor.method('entities:get', (resourceId) => {
        return entities.get(resourceId);
    });

    editor.on('scene:raw', (data) => {
        for (const key in data.entities) {
            entities.add(new Observer(data.entities[key]));
        }

        editor.emit('entities:load', data);
    });
});
