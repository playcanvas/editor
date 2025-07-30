import { ObserverHistory } from '@playcanvas/observer';

editor.once('load', () => {
    editor.on('assets:add', (asset) => {
        if (asset.history) {
            return;
        }

        const id = asset.get('id');

        asset.history = new ObserverHistory({
            item: asset,
            prefix: `asset.${id}.`,
            history: editor.api.globals.history
        });
    });
});
