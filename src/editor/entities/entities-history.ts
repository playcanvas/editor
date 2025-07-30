import { ObserverHistory } from '@playcanvas/observer';

editor.once('load', () => {
    editor.on('entities:add', (entity) => {
        if (entity.history) {
            return;
        }

        const resourceId = entity.get('resource_id');

        entity.history = new ObserverHistory({
            item: entity,
            prefix: `entity.${resourceId}.`,
            history: editor.api.globals.history
        });
    });
});
