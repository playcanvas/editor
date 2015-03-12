editor.once('load', function() {
    'use strict';

    editor.method('permissions', function () {
        return config.project.permissions;
    });

    editor.method('permissions:read', function (userId) {
        if (!userId) userId = config.self.id;

        return config.project.permissions.read.indexOf(userId) >= 0 ||
               config.project.permissions.write.indexOf(userId) >= 0 ||
               config.project.permissions.admin.indexOf(userId) >= 0;
    });

    editor.method('permissions:write', function (userId) {
        if (!userId) userId = config.self.id;

        return config.project.permissions.write.indexOf(userId) >= 0 ||
               config.project.permissions.admin.indexOf(userId) >= 0;
    });

    editor.method('permissions:admin', function (userId) {
        if (!userId) userId = config.self.id;

        return config.project.permissions.admin.indexOf(userId) >= 0;
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

        var accessLevel = msg.user.permission;

        // add new permission
        if (accessLevel) {
            config.project.permissions[accessLevel].push(userId);
        }

        editor.emit('permissions:set:' + userId, accessLevel);
    });

    // emit initial event
    if (editor.call('permissions:write')) {
        editor.emit('permissions:set:' + config.self.id, 'write');
    }
});
