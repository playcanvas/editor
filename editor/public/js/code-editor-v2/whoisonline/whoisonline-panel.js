editor.once('load', function () {
    var panel = editor.call('layout.top');

    var wioPanel = new ui.Panel();
    wioPanel.class.add('whoisonline');
    panel.append(wioPanel);

    var itemsIndex = {};

    var createItem = function (id) {
        var item = document.createElement('a');
        item.href = '/' + id;
        item.target = '_blank';

        var img = new Image();
        img.src = '/api/' + id + '/thumbnail?size=28';
        item.appendChild(img);

        itemsIndex[id] = item;

        wioPanel.append(item);
    };

    var reset = function (whoisonline) {
        // clear old
        for (var id in itemsIndex) {
            var item = itemsIndex[id];
            wioPanel.remove(item);
            delete itemsIndex[id];
        }

        for (var id in whoisonline) {
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
        }
    });

    // when we change documents reset whoisonline panel
    editor.on('documents:focus', function (id) {
        reset(editor.call('whoisonline:get', id));
    });

});