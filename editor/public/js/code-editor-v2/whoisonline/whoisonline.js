editor.once('load', function () {
    'use strict';

    const whoisonline = { };

    editor.method('whoisonline:set', function (assetId, list) {
        const index = {};
        for (let i = 0; i < list.length; i++)
            index[list[i]] = true;

        const existing = whoisonline[assetId] || {};
        for (const key in existing) {
            if (!index[key]) {
                editor.emit('whoisonline:remove', assetId, key);
            }
        }

        for (const key in index) {
            if (!existing[key]) {
                editor.emit('whoisonline:add', assetId, key);
            }
        }

        if (Object.keys(index).length > 0) {
            whoisonline[assetId] = index;
        } else {
            delete whoisonline[assetId];
        }
    });

    editor.method('whoisonline:get', function (assetId) {
        return whoisonline[assetId] || {};
    });

    editor.method('whoisonline:add', function (assetId, id) {
        if (!whoisonline[assetId])
            whoisonline[assetId] = {};

        whoisonline[assetId][id] = true;
        editor.emit('whoisonline:add', assetId, id);
    });

    editor.method('whoisonline:remove', function (assetId, id) {
        if (!whoisonline[assetId]) return;

        delete whoisonline[assetId][id];
        if (Object.keys(whoisonline[assetId]).length === 0) {
            delete whoisonline[assetId];
        }

        editor.emit('whoisonline:remove', assetId, id);
    });

    function connectToOpenDocs() {
        const openDocuments = editor.call('documents:list');
        openDocuments.forEach(id => onOpenDocument(id));
    }

    editor.on('relay:connected', connectToOpenDocs);
    editor.on('realtime:connected', connectToOpenDocs);

    editor.on('realtime:disconnected', () => {
        for (const id in whoisonline) {
            onCloseDocument(id);
        }
    });

    editor.on('relay:room:join', (data) => {
        if (!data.name.startsWith('document-')) return;

        const id = data.name.substring('document-'.length);
        const asset = editor.call('assets:getUnique', id);
        if (!asset) return;

        if (data.users) {
            editor.call('whoisonline:set', asset.get('id'), data.users);
        } else {
            editor.call('whoisonline:add', asset.get('id'), data.userId);
        }
    });

    editor.on('relay:room:leave', (data) => {
        if (!data.name.startsWith('document-')) return;

        const id = data.name.substring('document-'.length);
        const asset = editor.call('assets:getUnique', id);
        if (!asset) return;

        if (data.userId === config.self.id) {
            editor.call('whoisonline:set', asset.get('id'), []);
        } else {
            editor.call('whoisonline:remove', asset.get('id'), data.userId);
        }
    });

    editor.on('documents:load', (doc, asset) => {
        if (!editor.call('relay:isConnected')) return;
        onOpenDocument(asset.get('id'));
    });

    function onOpenDocument(id) {
        if (whoisonline[id]) return;

        const asset = editor.call('assets:get', id);
        if (!asset) return;

        editor.call('relay:joinRoom', 'document-' + asset.get('uniqueId'));
    }

    function onCloseDocument(id) {
        const asset = editor.call('assets:get', id);
        if (asset) {
            editor.call('relay:leaveRoom', 'document-' + asset.get('uniqueId'));
        }
    }

    // when a document is closed we will no longer
    // receive messages for it so delete all entries for it
    editor.on('documents:close', function (id) {
        onCloseDocument(id);
    });
});
