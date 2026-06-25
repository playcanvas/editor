import { Element, Label, Button, SelectInput, Container, TextInput } from '@playcanvas/pcui';

const ACCESS_LEVEL_LABELS = new Map([
    ['admin', 'Admin'],
    ['read', 'Read Only'],
    ['write', 'Read & Write']
]);

editor.once('load', () => {
    // GLOBAL VARIABLES
    const isAdmin = editor.call('permissions:admin');
    let owner;
    let currentProject;
    let currentProjectPrivate;
    let currentUser;
    let collaborators = [];
    let invitations = [];
    let uiRefresh = false;
    let ownerRendered = false;
    const newCollaborator = {
        id: null,
        user: null,
        access_level: 'read',
        error: null
    };
    const previousAccessLevels = {};  // store previous access levels so we can restore them in case of error

    // UI

    // updates all visible strings in screen to allow for dynamic updates
    const updateLabels = () => {
        // Assume space left in organization
        inviteSubmit.hidden = false;
        inviteInput.hidden = false;

        membersLabel.text = currentProject.access_level !== 'none' ? `${collaborators.length}/64 members` : '';

        addMeAsAdminButton.hidden = true;
        addMeAsAdminButton.enabled = false;

        // Update invite warning label
        if (currentProject.access_level === 'none' || editor.call('picker:project:showNoAdmin', currentProject, collaborators)) {
            inviteInput.hidden = true;
            inviteSubmit.hidden = true;
            inviteWarning.dom.innerHTML = 'You are not currently an admin for this project. Assign yourself as an admin to edit and manage this project';

            addMeAsAdminButton.hidden = false;
            addMeAsAdminButton.enabled = true;
            addMeAsAdminButton.unbind('click').on('click', () => {
                addAdmin(currentProject);
                addMeAsAdminButton.enabled = false;
            });
        } else if (!owner.limits || owner.plan_type === 'free') {
            // if organization does not belong to user or they are on a free account (limits only accessible to org owner)
            inviteWarning.dom.innerHTML = '';
        } else if ((!owner.organization && owner.plan_type !== 'free') || (owner.organization && !currentProjectPrivate)) {
            inviteWarning.dom.innerHTML = 'Invite paid/personal organization users only.';
        } else if (owner.organization && (collaborators.length - 1) < owner.limits.seats && collaborators.length < 60) {
            inviteWarning.dom.innerHTML = `Invite users who already occupy seats on your organization. New users will occupy 1 seat each once invites are accepted. This organization has <a class='warning-link--white' href='${config.url.home}/upgrade?account=${owner.username}' target='_blank'>${owner.limits.seats - (collaborators.length - 1)}/${owner.limits.seats} seats</a> left.`;
        } else if (owner.organization && (collaborators.length - 1) === owner.limits.seats && collaborators.length < 60) {
            inviteWarning.dom.innerHTML = `Invite users who already occupy seats on your organization only. This organization has no remaining seats for new users. <a class='warning-link' href='${config.url.home}/upgrade?account=${owner.username}' target='_blank'>Buy more seats now</a>`;
        } else if (collaborators.length === 60) {
            inviteInput.hidden = true;
            inviteSubmit.hidden = true;  // don't allow to invite any more members
            inviteWarning.dom.innerHTML = 'This project has reached its max member capacity. Please remove inactive users to make space for more.';
        }
    };

    // creates a single collaborator component and renders it on screen
    const createCollaboratorUI = (collaborator) => {
        if (collaborator.inviter_id && currentUser.access_level !== 'admin') {
            return;
        }  // don't display invitees to non-admin users

        const isOwner = collaborator.username === owner.username;
        if (isOwner) {
            if (ownerRendered) {
                return;
            }
            ownerRendered = true;
        }
        const isSelf = collaborator.id === config.self.id;
        const accessLabel = ACCESS_LEVEL_LABELS.get(collaborator.access_level) || 'Read Only';

        const parentContainer = new Element({
            class: 'collaborator-container'
        });
        if (isSelf) {
            parentContainer.class.add('user-collaborator');
        }
        if (isOwner) {
            parentContainer.class.add('owner-collaborator');
        }
        membersGrid.dom.appendChild(parentContainer.dom);

        const memberCell = new Element({
            class: 'member-cell'
        });
        parentContainer.dom.appendChild(memberCell.dom);

        const image = new Element({
            dom: 'img',
            class: 'collaborator-image',
            height: 34,
            width: 34
        });
        // if invitation, image url is different
        if (collaborator.inviter_id) {
            image.dom.src = `${config.url.api}/users/${collaborator.email}/thumbnail?size=80`;
        } else {
            image.dom.src = `${config.url.api}/users/${collaborator.id}/thumbnail?size=80`;
        }
        memberCell.dom.appendChild(image.dom);

        const identity = new Element({
            class: 'collaborator-identity'
        });
        memberCell.dom.appendChild(identity.dom);

        const collaboratorName = new Label({
            class: 'collaborator-name',
            text: collaborator.inviter_id ? collaborator.email : collaborator.username
        });
        identity.dom.appendChild(collaboratorName.dom);

        const collaboratorSubtitle = new Label({
            class: 'collaborator-subtitle',
            text: isOwner ? 'Project owner' : collaborator.inviter_id ? 'Invited user' : collaborator.full_name || collaborator.email || ''
        });
        identity.dom.appendChild(collaboratorSubtitle.dom);

        const accessCell = new Element({
            class: 'access-cell'
        });
        parentContainer.dom.appendChild(accessCell.dom);

        if (isOwner || collaborator.inviter_id || currentUser && (currentUser.id === collaborator.id || currentProject.access_level !== 'admin')) {
            const accessLevelLabel = new Label({
                class: isOwner ? ['team-pill', 'owner'] : ['team-pill', 'muted'],
                text: isOwner ? 'Owner' : collaborator.organization ? 'Organization' : accessLabel
            });
            accessCell.dom.appendChild(accessLevelLabel.dom);
        } else {
            const accessLevelDropdown = new SelectInput({
                class: 'role-select',
                options: [{
                    v: 'read',
                    t: 'Read Only'
                }, {
                    v: 'write',
                    t: 'Read & Write'
                }, {
                    v: 'admin',
                    t: 'Admin'
                }],
                value: collaborator.access_level
            });

            accessLevelDropdown.on('change', () => {
                updateCollaborator(collaborator, accessLevelDropdown.value);
            });

            accessCell.dom.appendChild(accessLevelDropdown.dom);
        }

        const statusLabel = new Label({
            class: isSelf && !isOwner ? ['team-pill', 'green'] : ['team-pill', 'muted'],
            text: isOwner ? 'Active' : collaborator.inviter_id ? 'Pending' : isSelf ? 'You' : 'Member'
        });
        parentContainer.dom.appendChild(statusLabel.dom);

        const actionsCell = new Element({
            class: 'actions-cell'
        });
        parentContainer.dom.appendChild(actionsCell.dom);

        if (collaborator.username === config.self.username) {
            const configCollaboratorBtn = new Button({
                class: 'team-action',
                icon: 'E134'
            });
            actionsCell.dom.appendChild(configCollaboratorBtn.dom);

            configCollaboratorBtn.on('click', () => {
                window.open(`${config.url.home}/account`, '_blank');
            });
        }

        const deleteCollaboratorBtn = new Button({
            class: 'team-action',
            icon: 'E124'
        });

        if (isOwner) {
            deleteCollaboratorBtn.enabled = false;
        } else if (collaborator.username !== config.self.username) {
            deleteCollaboratorBtn.enabled = currentProject.access_level === 'admin';  // only allow admins to remove collaborators
        } else {
            deleteCollaboratorBtn.enabled = currentProject.owner !== config.self.username && currentProject.id !== config.project.id;
        }

        deleteCollaboratorBtn.on('click', () => {
            if (collaborator.username === config.self.username) {
                editor.call('picker:project:deleteSelfConfirmation');
            } else if (collaborator.inviter_id) {
                // If invitation, remove invitation
                removeInvitation(collaborator, parentContainer);
            } else {
                removeCollaborator(collaborator, parentContainer);
            }
        });

        actionsCell.dom.appendChild(deleteCollaboratorBtn.dom);
    };

    // main panel
    const panel = new Container({
        flex: true,
        class: 'picker-team-management'
    });

    // register panel with project popup
    editor.call('picker:project:registerMenu', 'team', 'Team', panel);

    // hide button if the user doesn't have the right permissions
    if (!editor.call('permissions:read')) {
        editor.call('picker:project:toggleMenu', 'team', false);
    }

    // if the user permissions change, then change the visibility of the button
    editor.on('permissions:set', () => {
        editor.call('picker:project:toggleMenu', 'team', editor.call('permissions:read'));
    });

    // holds events that need to be destroyed
    let events = [];

    const inviteContainer = new Container({
        class: 'invite-container'
    });
    panel.append(inviteContainer);

    const inviteInputContainer = new Container({
        class: 'invite-input-container',
        flex: true
    });
    inviteContainer.append(inviteInputContainer);

    const inviteInputGroup = new Container({
        class: 'invite-input-group'
    });
    inviteInputContainer.append(inviteInputGroup);

    const inviteInput = new TextInput({
        enabled: isAdmin,
        placeholder: 'Username or email address',
        class: 'invite-input',
        blurOnEnter: false
    });
    inviteInputGroup.append(inviteInput);

    inviteInput.on('keydown', (evt: KeyboardEvent) => {
        if (inviteInput.value !== '') {
            inviteInput.placeholder = '';
        }

        if (evt.key === 'Enter') {
            newCollaborator.user = inviteInput.value;
            createCollaborator();
            inviteInput.value = '';
        }
    });

    inviteInput.on('blur', () => {
        if (inviteInput.value === '') {
            inviteInput.placeholder = 'Username or email address';
        }
    });

    const inviteSubmit = new Button({
        enabled: isAdmin,
        text: 'Invite',
        class: 'invite-submit'
    });
    inviteInputGroup.append(inviteSubmit);

    const membersLabel = new Label({
        text: '',
        class: 'members-count'
    });
    inviteContainer.append(membersLabel);

    const inviteWarning = new Label({
        class: 'invite-warning',
        text: ''  // by default no label under invite input
    });
    inviteInputContainer.append(inviteWarning);

    inviteSubmit.on('click', () => {
        newCollaborator.user = inviteInput.value;
        createCollaborator();
        inviteInput.value = '';
    });

    const membersContainer = new Container({
        class: 'members-container'
    });
    panel.append(membersContainer);

    const membersHeader = new Element({
        class: 'members-header'
    });
    ['Member', 'Access', 'Status', ''].forEach((text) => {
        const label = new Label({ text });
        membersHeader.dom.appendChild(label.dom);
    });
    membersContainer.dom.appendChild(membersHeader.dom);

    const membersGrid = new Element({
        class: 'members-grid',
        flex: true
    });
    membersContainer.append(membersGrid);

    const addMeAsAdminButton = new Button({
        class: 'add-me-as-admin',
        text: 'ADD ME AS ADMIN',
        icon: 'E375',
        hidden: true,
        enabled: false
    });
    panel.append(addMeAsAdminButton);

    // CONTROLLERS

    // sorts collaborators based on ownership, access level and finally full name
    const sortCollaborators = () => {
        collaborators = collaborators.sort((a, b) => {
            if (a.username === owner.username) {
                return -1;
            }
            if (b.username === owner.username) {
                return 1;
            }
            if (a.access_level === b.access_level) {
                if (a.full_name < b.full_name) {
                    return -1;
                }
                return 1;
            }

            if (a.access_level === 'admin') {
                return -1;
            }
            if (b.access_level === 'admin') {
                return 1;
            }
            if (a.access_level === 'write') {
                return -1;
            }
            return 1;
        });
    };

    // allows a project with 'none' access level to be claimed by the current user
    const addAdmin = (project) => {
        const newCollaborator = {
            user: config.self.username,
            access_level: 'admin'
        };
        editor.call('users:createCollaborator', project.id, newCollaborator, () => {
            project.permissions.admin.push(config.self.username);
            collaborators.push(config.self.username);
            project.access_level = 'admin';
            addMeAsAdminButton.hidden = true;
            editor.call('picker:project:close');
            editor.call('picker:project:reduced', currentProject);
            editor.call('picker:project:cms:refreshProjects');
        }, (err) => {
            editor.call('picker:project:buildAlert', panel, err);
        });
    };

    // creates a collaborator in the database through API call and calls createCollaboratorUI to render it on screen
    const createCollaborator = () => {
        if (newCollaborator.user && canAddCollaborator()) {
            const newUsername = newCollaborator.user;

            editor.call('users:createCollaborator', currentProject.id, newCollaborator, (result) => {
                let added = false;
                newCollaborator.user = null;
                newCollaborator.error = null;

                // update existing or add new one
                collaborators.forEach((collaborator) => {
                    if (collaborator.username === result.username) {
                        added = true;
                        editor.call('picker:project:buildAlert', panel, 'TEAM ERROR: User already exists');
                    }
                });

                if (!added) {
                    collaborators.push(result);
                    createCollaboratorUI(result);
                }

                updateLabels();

                previousAccessLevels[result.username] = result.access_level;

            }, (status, error) => {
                // if the collaborator was not found and this is email,
                // send an email invitation
                if (status === 404 && /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(newUsername)) {
                    editor.call('projects:createInvitation', currentProject, newUsername, 'read', (invitation) => {
                        newCollaborator.user = null;
                        invitations.push(invitation);

                        createCollaboratorUI(invitation);
                    }, (error) => {
                        handleTeamError(status, error);
                    });
                } else {
                    handleTeamError(status, error);
                }
            });
        }
    };

    // updates any collaborator's access level (triggered on dropdown change)
    const updateCollaborator = (collaborator, access_level) => {
        if (canEditCollaborator(collaborator)) {
            const previousAccessLevel = collaborator.access_level;
            collaborator.access_level = access_level;
            const index = collaborators.indexOf(collaborator);
            editor.call('users:updateCollaboratorAccess', currentProject.id, collaborator, (result) => {
                collaborators[index] = result;
                previousAccessLevels[collaborator.username] = result.access_level;
            }, (status, error) => {
                handleTeamError(status, error);
                collaborator.access_level = previousAccessLevel;
            });
        }
    };

    // helper method that parses team management errors and displays suitable error message
    const handleTeamError = (status, error) => {
        let text = error;
        const errorMessage = `Team Error: ${text}`;
        if (status === 404) {
            text = 'User not found';
        } else if (status === 403) {
            if (!text) {
                text = 'You do not have permission to edit the team';
            } else if (text === 'Could not retrieve customer') {
                editor.call('picker:project:buildAlert', panel, 'You do not have a credit card on your account', true, 'UPGRADE', { url: `${config.url.home}/upgrade` });
            }
        }

        if (text === 'Reached seats limit' || /reached the user limit/.test(text)) {
            if (owner.plan_type === 'org') {
                // show charge popup
                editor.call('picker:project:buildAlert', panel, errorMessage, true, 'BUY SEAT', { currentUser: owner, errorCallback: handleTeamError });
            } else {
                // show upgrade
                editor.call('picker:project:buildAlert', panel, errorMessage, true, 'UPGRADE', { url: `${config.url.home}/upgrade` });
            }
        } else if (status === 400 && text === 'Could not retrieve customer') {
            editor.call('picker:project:buildAlert', panel, 'You do not have a credit card on your account', true, 'UPGRADE', { url: `${config.url.home}/upgrade` });
        } else {
            editor.call('picker:project:buildAlert', panel, errorMessage);
        }
    };

    // deletes a collaborator from a project and deletes UI element
    const removeCollaborator = (collaborator, container) => {
        if (canRemoveCollaborator(collaborator)) {
            const index = collaborators.indexOf(collaborator);
            editor.call('users:removeCollaborator', currentProject, collaborator, () => {
                if (index > -1) {
                    collaborators.splice(index, 1);
                }
                if (container.dom) {
                    container.dom.remove();
                } else {
                    container.remove();
                }
                updateLabels();
            });
        }
    };

    // deletes an invitation to a project and deletes UI element
    const removeInvitation = (invitation, container) => {
        const index = invitations.indexOf(invitation);
        editor.call('projects:deleteInvitation', invitation, () => {
            invitations.splice(index, 1);
            container.dom.remove();
        });
    };

    // removes current user from the project
    const removeSelf = () => {
        const rootUserContainer = document.getElementsByClassName('user-collaborator')[0];
        removeCollaborator(currentUser, rootUserContainer);
        editor.call('picker:project:close');
        uiRefresh = true;
        setTimeout(() => {
            editor.call('picker:project:reduced', currentProject);
        }, 750);
    };

    // LOCAL UTILS

    // determines whether the current user has admin access to the project
    const hasAdminAccess = () => {
        // get access level
        const access_level = editor.call('project:management:getAccessLevel', config.self, collaborators);
        return access_level === 'admin';
    };

    // determines whether the current user can add a collaborator depending on their rights
    const canAddCollaborator = () => {
        return hasAdminAccess();
    };

    // determines whether the current user can remove a collaborator depending on their rights
    const canRemoveCollaborator = (collaborator) => {
        return (collaborator && collaborator.username === config.self.username) || hasAdminAccess();
    };

    // determines whether the current user can edit a collaborator's access rights depending on their rights
    const canEditCollaborator = (collaborator) => {
        return collaborator.username !== owner.username && hasAdminAccess();
    };

    // helper method to delete all outstanding events on close
    const destroyEvents = () => {
        events.forEach((evt) => {
            if (evt) {
                evt.unbind();
            }
        });
        events = [];
    };

    // EVENTS

    // on show
    panel.on('show', () => {
        currentProject = editor.call('picker:project:getCurrent');
        currentProjectPrivate = editor.call('picker:project:getPrivateSetting');

        editor.call('users:loadOne', currentProject.owner_id, (res) => {
            owner = res;

            if (config.self.id === owner.id) {
                currentUser = owner;
            }

            const refreshTeam = membersGrid.dom.childNodes.length === 0 || uiRefresh;
            if (refreshTeam) {
                membersGrid.dom.innerHTML = '';
                ownerRendered = false;
                createCollaboratorUI(owner);
            }

            // Only populate first time around
            if (currentProject.access_level !== 'none' && refreshTeam) {

                let currentUserIsCollaborator = false;
                editor.call('projects:getCollaborators', currentProject, (data) => {
                    data.forEach((collaborator) => {
                        if (collaborator) {
                            if (collaborator.id === config.self.id) {
                                currentUserIsCollaborator = true;
                                currentUser = collaborator;
                            } else {
                                collaborators.push(collaborator);
                                previousAccessLevels[collaborator.username] = collaborator.access_level;
                            }
                        }
                    });

                    sortCollaborators();
                    if (currentUser && currentUserIsCollaborator) {
                        collaborators.unshift(currentUser);
                    }  // add current user to top of list (if not organization account)

                    updateLabels();

                    editor.call('projects:invitations', { project: currentProject, pending: true }, (apiInvitations) => {
                        invitations = apiInvitations;

                        collaborators.forEach((collaborator) => {
                            createCollaboratorUI(collaborator);
                        });

                        // only display invited collaborators if current user is admin
                        if (currentProject.access_level === 'admin') {
                            invitations.forEach((invitation) => {
                                createCollaboratorUI(invitation);
                            });
                        }

                    }, (err) => {
                        invitations = [];
                        editor.call('picker:project:buildAlert', panel, err);
                    });
                });

                uiRefresh = false;
            }

            updateLabels();
        });

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // on hide
    panel.on('hide', () => {
        destroyEvents();
        editor.call('picker:project:hideAlerts');

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    editor.on('viewport:hover', (state) => {
        if (state && !panel.hidden) {
            setTimeout(() => {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // show the project management picker
    editor.method('picker:team:management', () => {
        editor.call('picker:project', 'team');
    });

    // hook to create a new collaborator
    editor.method('picker:team:management:createCollaborator', () => {
        createCollaborator();
    });

    // hook to remove current user from collaborators
    editor.method('picker:team:management:removeSelf', () => {
        removeSelf();
    });

    // hook to reload UI on project change
    editor.method('picker:team:management:refreshUI', () => {
        currentProject = editor.call('picker:project:getCurrent');
        uiRefresh = true;
        membersGrid.dom.innerHTML = '';
        ownerRendered = false;
        collaborators = [];
        inviteInput.enabled = currentProject.access_level === 'admin';
        inviteSubmit.enabled = currentProject.access_level === 'admin';
    });

});
