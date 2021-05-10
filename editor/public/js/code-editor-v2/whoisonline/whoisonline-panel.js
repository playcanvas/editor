editor.once('load', function () {
    var panel = editor.call('layout.top');

    var wioPanel = new ui.Panel();
    wioPanel.class.add('whoisonline');
    panel.append(wioPanel);

    var itemsIndex = {};
    var tooltips = {};

    var createItem = function (id) {
        var item = document.createElement('a');
        item.href = '/' + id;
        item.target = '_blank';

        var img = new Image();
        img.onload = function () {
            item.style.borderColor = editor.call('whoisonline:color', id, 'hex');
        };

        img.src = '/api/users/' + id + '/thumbnail?size=28';
        item.appendChild(img);

        itemsIndex[id] = item;

        editor.call('users:loadOne', id, function (user) {
            item.href = '/' + user.username;

            tooltips[id] = Tooltip.attach({
                target: item,
                text: user.username,
                align: 'top',
                root: editor.call('layout.root')
            });
        });

        wioPanel.append(item);
    };


    editor.on('whoisonline:add', function (assetId, userId) {
        // check if this is the focused document
        if (editor.call('documents:getFocused') !== assetId || itemsIndex[userId])
            return;

        createItem(userId);
    });

    editor.on('whoisonline:remove', function (assetId, userId) {
        // check if this is the focused document
        if (editor.call('documents:getFocused') !== assetId)
            return;

        var item = itemsIndex[userId];
        if (item) {
            wioPanel.remove(item);
            delete itemsIndex[userId];

            if (tooltips[userId]) {
                tooltips[userId].destroy();
                delete tooltips[userId];
            }
        }
    });

    // when we change documents reset whoisonline panel
    editor.on('documents:focus', function (id) {
        const whoisonline = editor.call('whoisonline:get', id);

        // clear old
        for (const id in itemsIndex) {
            if (whoisonline[id]) {
                continue;
            }

            const item = itemsIndex[id];
            wioPanel.remove(item);
            delete itemsIndex[id];

            if (tooltips[id]) {
                tooltips[id].destroy();
                delete tooltips[id];
            }
        }

        for (const id in whoisonline) {
            if (! itemsIndex[id])
                createItem(id);
        }
    });
});
