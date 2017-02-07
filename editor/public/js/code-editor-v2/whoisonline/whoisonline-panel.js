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

        img.src = '/api/' + id + '/thumbnail?size=28';
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

    var reset = function (whoisonline) {
        // clear old
        for (var id in itemsIndex) {
            if (whoisonline[id]) {
                continue;
            };

            var item = itemsIndex[id];
            wioPanel.remove(item);
            delete itemsIndex[id];

            if (tooltips[id]) {
                tooltips[id].destroy();
                delete tooltips[id];
            }
        }

        for (var id in whoisonline) {
            if (! itemsIndex[id])
                createItem(id);
        }
    };

    editor.on('whoisonline:set', function (assetId, whoisonline) {
        // check if this is the focused document
        if (editor.call('documents:getFocused') !== assetId)
            return;

        reset(whoisonline);
    });

    editor.on('whoisonline:add', function (assetId, userId) {
        // check if this is the focused document
        if (editor.call('documents:getFocused') !== assetId)
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
        reset(editor.call('whoisonline:get', id));
    });

});