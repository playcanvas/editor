/**
 * project-managment.js
 *
 * A file that contains some of the common utility methods used by
 * the project management pickers exposed as hooks.
 */

editor.once('load', () => {

    const model = {
        currentProject: ''
    };

    // disables / enables field depending on permissions
    editor.method('project:management:handlePermissions', (field, success, errorFn) => {
        field.disabled = !editor.call('permissions:write');
        return editor.on('permissions:set:' + config.self.id, function (accessLevel) {
            if (accessLevel === 'write' || accessLevel == 'admin') {
                field.disabled = false;
            } else {
                field.disabled = true;
            }
        });
    });

    // gets user access level
    editor.method('project:management:getAccessLevel', (user, collaborators) => {
        if (user && collaborators) {
            for (var i = 0, len = collaborators.length; i < len; i++) {
                if (collaborators[i].username == user.username) {
                    return collaborators[i].access_level;
                }
            }
        }

        return false;
    });

    // gets user permissions
    editor.method('project:management:getUserPermissions', (project, user) => {
        let result;

        if (!user)
            result = 'Read';
        else {
            if (project && user.id === project.owner.id)
                result = 'Owner';
            else {
                if (user.access_level === 'read' || !user.access_level) result = 'Read';
                else if (user.access_level === 'write') result = 'Read & Write';
                else return 'Admin';
            }
        }

        return result;
    });

    // helper method to determine whether the owner view should be displayed for a project
    editor.method('project:management:showOwnerView', () => {
        if (config.self) {
            if (config.owner) {
                if (config.owner.id === config.self.id) return true;
                if (editor.call('project:management:isOrgAdmin', config.owner.id, config.self)) return true;
            } else {
                return true;
            }
        }

        return false;
    });

    // method that returns true if current user is admin or owner of organization with specified id
    editor.method('project:management:isOrgAdmin', (orgId, user) => {
        if (user && user.organizations) {
            for (var i = 0; i < user.organizations.length; i++) {
                if (user.organizations[i].id === orgId) {
                    return true;
                }
            }
        }

        return false;
    });

    // method that determines whether user has enterprise account
    editor.method('project:management:isEnterprise', () => {
        return !!config.enterprise;
    });

    // method to determine whether user has write access to project
    editor.method('project:management:hasWriteAccess', () => {
        let collaborators;
        let access_level;

        editor.call('users:getCollaborators', config.self.id, (result) => {
            collaborators = result.sort(function (a, b) {
                if (a.username === config.owner.username) return -1;
                else if (b.username === config.owner.username) return 1;
                else if (a.access_level === b.access_level) {
                    if (a.full_name < b.full_name) return -1;
                    return 1;
                }

                if (a.access_level === 'admin') return -1;
                else if (b.access_level === 'admin') return 1;
                else if (a.access_level === 'write') return -1;
                return 1;
            });
        }, (err) => {
            console.log(err);
        });

        if (config.self) {
            if (collaborators) {
                for (var i = 0, len = collaborators.length; i < len; i++) {
                    if (collaborators[i].username == config.self.username) {
                        access_level = collaborators[i].access_level;
                    }
                }
            }
        }

        return access_level === 'write' || access_level === 'admin';
    });

    // method to create and return metadata for blank project
    editor.method('project:management:createBlankProject', (allowPrivate, fork) => {
        if (config.self) {
            return {
                owner: config.owner.username,
                name: '',
                fork_from: fork,
                private: !!((editor.call('project:management:isEnterprise') || allowPrivate)),
                settings: {
                    useLegacyScripts: false,
                    vr: false
                },
                updatedPrivate: false
            };
        }
    });

    // method to set current state of model variables
    editor.method('project:management:setModel', (updatedModel) => {
        for (const [attrib, value] of Object.entries(updatedModel)) {
            if (attrib in model) model[attrib] = value;
        }
    });

    // method to get upgrade url
    editor.method('project:management:getUpgradeUrl', (plan, username) => {
        let query = '?';
        let url = '/upgrade';
        if (plan) {
            url += query + 'plan=' + plan;
            query = '&';
        }

        if (!username && config.user)
            username = config.user.username;

        if (username) {
            url += query + 'account=' + username;
        }

        return url;
    });

    // method to get current state of model variables
    editor.method('project:management:getModel', () => {
        return model;
    });

});
