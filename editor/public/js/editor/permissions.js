editor.once('load', function() {
    'use strict';

    var permissions = {};

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
        if (!userId) userId = config.self.id;

        return userId in permissions;
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
        }

        editor.emit('permissions:set:' + userId, accessLevel);
    });

    editor.on('permissions:set:' + config.self.id, function () {
        var connection = editor.call('realtime:connection');
        editor.emit('permissions:writeState', connection && connection.state === 'connected' || false);
    });

    // emit initial event
    if (editor.call('permissions:write')) {
        editor.emit('permissions:set:' + config.self.id, 'write');
    }
});
