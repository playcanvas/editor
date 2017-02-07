editor.once('load', function () {
    var whoisonline = { };

    editor.method('whoisonline:set', function (assetId, list) {
        if (! whoisonline[assetId])
            whoisonline[assetId] = {};

        for (var i = 0; i < list.length; i++)
            whoisonline[assetId][list[i]] = true;

        editor.emit('whoisonline:set', assetId, whoisonline[assetId]);
    });

    editor.method('whoisonline:get', function (assetId) {
        return whoisonline[assetId] || {};
    });

    editor.method('whoisonline:add', function (assetId, id) {
        if (! whoisonline[assetId])
            whoisonline[assetId] = {};

        whoisonline[assetId][id] = true;
        editor.emit('whoisonline:add', assetId, id);
    });

    editor.method('whoisonline:remove', function (assetId, id) {
        if (! whoisonline[assetId]) return;

        delete whoisonline[assetId][id];
        editor.emit('whoisonline:remove', assetId, id);
    });

    // when a document is closed we will no longer
    // receive messages for it so delete all entries for it
    editor.on('documents:close', function (id) {
        if (! whoisonline[id]) return;

        for (var key in whoisonline[id]) {
            editor.call('whoisonline:remove', id, key);
        }

        delete whoisonline[id];
    });

    // remove all users if we are disconnected
    editor.on('realtime:disconnected', function () {
        for (var assetId in whoisonline) {
            for (var key in whoisonline[assetId]) {
                editor.call('whoisonline:remove', assetId, key);
            }
        }

        whoisonline = {};
    });
});