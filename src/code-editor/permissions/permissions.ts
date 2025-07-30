editor.once('load', () => {
    const permissions = { };

    // cache permissions in a dictionary
    ['read', 'write', 'admin'].forEach((access) => {
        config.project.permissions[access].forEach((id) => {
            permissions[id] = access;
        });
    });

    editor.method('permissions', () => {
        return config.project.permissions;
    });

    editor.method('permissions:read', (userId) => {
        if (!userId) userId = config.self.id;
        return permissions.hasOwnProperty(userId);
    });

    editor.method('permissions:write', (userId) => {
        if (!userId) userId = config.self.id;

        return permissions[userId] === 'write' || permissions[userId] === 'admin';
    });

    editor.method('permissions:admin', (userId) => {
        if (!userId) userId = config.self.id;

        return permissions[userId] === 'admin';
    });

    // subscribe to messenger
    editor.on('messenger:project.permissions', (msg) => {
        const userId = msg.user.id;

        // remove from read
        let ind = config.project.permissions.read.indexOf(userId);
        if (ind !== -1) {
            config.project.permissions.read.splice(ind, 1);
        }

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

        const accessLevel = msg.user.permission;

        // add new permission
        if (accessLevel) {
            config.project.permissions[accessLevel].push(userId);
            permissions[userId] = accessLevel;
        } else {
            // lock out user if private project
            if (config.self.id === userId && config.project.private) {
                window.location.reload();
            }
        }

        editor.emit(`permissions:set:${userId}`, accessLevel);
        if (userId === config.self.id) {
            editor.emit('permissions:set', accessLevel);
        }
    });

    // subscribe to project private changes
    editor.on('messenger:project.private', (msg) => {
        const projectId = msg.project.id;
        if (config.project.id !== projectId) {
            return;
        }

        config.project.private = msg.project.private;

        if (msg.project.private && !editor.call('permissions:read', config.self.id)) {
            // refresh page so that user gets locked out
            window.location.reload();
        }
    });

    editor.on('messenger:user.logout', (msg) => {
        if (msg.user.id === config.self.id) {
            window.location.reload();
        }
    });

    editor.on(`permissions:set:${config.self.id}`, (accessLevel) => {
        editor.emit('permissions:writeState', accessLevel === 'write' || accessLevel === 'admin');
    });

    // emit initial event
    if (editor.call('permissions:write')) {
        editor.emit(`permissions:set:${config.self.id}`, 'write');
    }
});
