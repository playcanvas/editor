editor.once('load', function() {
    'use strict';

    var permissions = { };

    // cache permissions in a dictionary
    ['read', 'write', 'admin'].forEach(function (access) {
        config.project.permissions[access].forEach(function (id) {
            permissions[id] = access;
        });
    });

    editor.method('permissions', function () {
        return config.project.permissions;
    });

    editor.method('permissions:read', function (userId) {
        if (! userId) userId = config.self.id;
        return permissions.hasOwnProperty(userId);
    });

    editor.method('permissions:write', function (userId) {
        if (!userId) userId = config.self.id;

        return permissions[userId] === 'write' || permissions[userId] === 'admin';
    });

    editor.method('permissions:admin', function (userId) {
        if (!userId) userId = config.self.id;

        return permissions[userId] === 'admin';
    });

    // subscribe to messenger
    editor.on('messenger:project.permissions', function (msg) {
        var userId = msg.user.id;

        // remove from read
        var ind = config.project.permissions.read.indexOf(userId);
        if (ind !== -1)
            config.project.permissions.read.splice(ind, 1);

        // remove from write
        ind = config.project.permissions.write.indexOf(userId);
        if (ind !== -1) {
            config.project.permissions.write.splice(ind, 1);
        }

        // remove from admin
        ind = config.project.permissions.admin.indexOf(userId);
        if (ind !== -1) {
            config.project.permissions.admin.splice(ind, 1);
        }

        delete permissions[userId];

        var accessLevel = msg.user.permission;

        // add new permission
        if (accessLevel) {
            config.project.permissions[accessLevel].push(userId);
            permissions[userId] = accessLevel;
        } else {
            // lock out user if private project
            if (config.self.id === userId && config.project.private)
                window.location.reload();
        }

        editor.emit('permissions:set:' + userId, accessLevel);
        if (userId === config.self.id)
            editor.emit('permissions:set', accessLevel);
    });

    // subscribe to project private changes
    editor.on('messenger:project.private', function (msg) {
        var projectId = msg.project.id;
        if (config.project.id !== projectId)
            return;

        config.project.private = msg.project.private;

        if (msg.project.private && ! editor.call('permissions:read', config.self.id)) {
            // refresh page so that user gets locked out
            window.location.reload();
        }
    });

    editor.on('messenger:user.logout', function (msg) {
        if (msg.user.id === config.self.id) {
            window.location.reload();
        }
    });

    editor.on('permissions:set:' + config.self.id, function (accessLevel) {
        var connection = editor.call('realtime:connection');
        editor.emit('permissions:writeState', connection && connection.state === 'connected' && (accessLevel === 'write' || accessLevel === 'admin'));
    });

    // emit initial event
    if (editor.call('permissions:write')) {
        editor.emit('permissions:set:' + config.self.id, 'write');
    }
});
