import { ObserverList } from '@playcanvas/observer';

editor.once('load', () => {
    const whoisonline = new ObserverList();

    // Set whoisonline
    editor.method('whoisonline:set', (data) => {
        whoisonline.clear();
        if (data) {
            data.forEach((id) => {
                whoisonline.add(id);
            });
        }
    });

    // Get whoisonline
    editor.method('whoisonline:get', () => {
        return whoisonline;
    });

    // Add to whoiseonline
    editor.method('whoisonline:add', (id) => {
        whoisonline.add(id);
    });

    // Remove from whoisonline
    editor.method('whoisonline:remove', (id) => {
        whoisonline.remove(id);
    });

    // Returns true if specified user id is online
    editor.method('whoisonline:find', (id) => {
        return whoisonline.indexOf(id) >= 0;
    });

    // 'add' event
    whoisonline.on('add', (id) => {
        editor.emit('whoisonline:add', id);
    });

    // 'remove' event
    whoisonline.on('remove', (id, index) => {
        editor.emit('whoisonline:remove', id, index);
    });
});
