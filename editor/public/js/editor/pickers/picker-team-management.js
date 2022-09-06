editor.once('load', function () {
    'use strict';

    // GLOBAL VARIABLES
    const isAdmin = editor.call('permissions:admin');
    let owner;
    let currentProject;
    let currentProjectPrivate;
    let currentUser;
    let collaborators = [];
    let invitations = [];
    let uiRefresh = false;
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

        // Update number of members
        membersLabel.text = currentProject.access_level !== 'none' ? `Project\nMembers\n\n${collaborators.length}/64` : '';

        addMeAsAdminButton.hidden = true;
        addMeAsAdminButton.enabled = false;

        // Update invite warning label
        if (currentProject.access_level === 'none' || editor.call('picker:project:showNoAdmin', currentProject, collaborators)) {
            inviteInput.hidden = true;
            inviteSubmit.hidden = true;
            inviteWarning.dom.innerHTML = "You are not currently an admin for this project. Assign yourself as an admin to edit and manage this project";

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
            inviteWarning.dom.innerHTML = "Invite paid/personal organisation users only.";
        } else if (owner.organization && (collaborators.length - 1) < owner.limits.seats && collaborators.length < 60) {
            inviteWarning.dom.innerHTML = `Invite users who already occupy seats on your organisation. New users will occupy 1 seat each once invites are accepted. This organisation has <a class='warning-link--white' href='${config.url.home}/upgrade?account=${owner.username}' target='_blank'>${owner.limits.seats - (collaborators.length - 1)}/${owner.limits.seats} seats</a> left.`;
        } else if (owner.organization && (collaborators.length - 1) === owner.limits.seats && collaborators.length < 60) {
            inviteWarning.dom.innerHTML = `Invite users who already occupy seats on your organisation only. This organisation has no remaining seats for new users. <a class='warning-link' href='${config.url.home}/upgrade?account=${owner.username}' target='_blank'>Buy more seats now</a>`;
        } else if (collaborators.length === 60) {
            inviteInput.hidden = true;
            inviteSubmit.hidden = true;  // don't allow to invite any more members
            inviteWarning.dom.innerHTML = "This project has reached its max member capacity. Please remove inactive users to make space for more.";
        }
    };

    // creates a single collaborator component and renders it on screen
    const createCollaboratorUI = (collaborator) => {
        if (collaborator.inviter_id && currentUser.access_level !== 'admin') return;  // don't display invitees to non-admin users

        const parentContainer = new pcui.Element(document.createElement('div'), {
            class: 'collaborator-container'
        });
        if (collaborator.id === config.self.id) parentContainer.dom.classList.add('user-collaborator');
        membersGrid.element.appendChild(parentContainer.dom);

        // image container (left)
        const image = new pcui.Element(document.createElement('img'), {
            class: 'collaborator-image',
            height: 62,
            width: 62
        });
        // if invitation, image url is different
        if (collaborator.inviter_id) {
            image.dom.src = `${config.url.api}/users/${collaborator.email}/thumbnail?size=80`;
        } else {
            image.dom.src = `${config.url.api}/users/${collaborator.id}/thumbnail?size=80`;
        }
        parentContainer.dom.appendChild(image.dom);

        // right container
        const collaboratorRightContainer = new pcui.Element(document.createElement('div'), {
            class: 'collaborator-right-container'
        });
        parentContainer.dom.appendChild(collaboratorRightContainer.dom);

        // first row
        const firstRow = new pcui.Element(document.createElement('div'), {
            class: 'collaborator-first-row'
        });
        collaboratorRightContainer.dom.appendChild(firstRow.dom);

        const collaboratorName = new pcui.Label({
            text: collaborator.inviter_id ? collaborator.email : collaborator.username
        });
        firstRow.dom.appendChild(collaboratorName.element);

        const deleteCollaboratorBtn = new pcui.Button({ icon: 'E124' });

        if (collaborator.username !== config.self.username) {
            deleteCollaboratorBtn.enabled = currentProject.access_level === 'admin';  // only allow admins to remove collaborators
        } else {
            const configCollaboratorBtn = new pcui.Button({ icon: 'E134' });
            firstRow.dom.appendChild(configCollaboratorBtn.element);

            deleteCollaboratorBtn.enabled = currentProject.owner !== config.self.username && currentProject.id !== config.project.id;

            configCollaboratorBtn.on('click', () => {
                window.open(`${config.url.home}/account`, '_blank');
            });
        }

        deleteCollaboratorBtn.on('click', () => {
            if (collaborator.username == config.self.username) {
                editor.call('picker:project:deleteSelfConfirmation');
            } else if (collaborator.inviter_id) {
                // If invitation, remove invitation
                removeInvitation(collaborator, parentContainer);
            } else {
                removeCollaborator(collaborator, parentContainer);
            }
        });

        firstRow.dom.appendChild(deleteCollaboratorBtn.element);

        // second row (dropdown menu or label)
        if (collaborator.inviter_id || currentUser && (currentUser.id === collaborator.id || currentProject.access_level !== 'admin')) {
            let displayLabel;
            switch (collaborator.access_level) {
                case 'admin': {
                    displayLabel = "Admin";
                    break;
                }
                case 'read': {
                    displayLabel = "Read Only";
                    break;
                }
                case 'write': {
                    displayLabel = "Read & Write";
                    break;
                }
            }

            if (collaborator.inviter_id) displayLabel = 'Pending';
            if (collaborator.organization) displayLabel = 'Organization';

            const accessLevelLabel = new pcui.Label({
                text: displayLabel
            });
            collaboratorRightContainer.dom.appendChild(accessLevelLabel.element);
        } else {
            const accessLevelDropdown = new pcui.SelectInput({
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

            collaboratorRightContainer.dom.appendChild(accessLevelDropdown.element);
        }
    };

    // main panel
    var panel = new pcui.Container({
        flex: true,
        class: 'picker-team-management'
    });

    // register panel with project popup
    editor.call('picker:project:registerMenu', 'team', 'Team', panel);

    // hide button if the user doesn't have the right permissions
    if (!editor.call('permissions:read')) {
        editor.call('picker:project:toggleMenu', 'team', false);
    }

    // if the user permissions change, then change the visibilty of the button
    editor.on('permissions:set', function () {
        editor.call('picker:project:toggleMenu', 'team', editor.call('permissions:read'));
    });

    // holds events that need to be destroyed
    var events = [];

    // Invite Container
    const inviteContainer = new pcui.Container({
        class: 'invite-container'
    });
    panel.append(inviteContainer);

    const inviteLabel = new pcui.Label({
        text: 'Invite',
        class: 'section-label'
    });
    inviteContainer.append(inviteLabel);

    const inviteInputContainer = new pcui.Container({
        class: 'invite-input-container',
        flex: true
    });
    inviteContainer.append(inviteInputContainer);

    const inviteInputGroup = new pcui.Container({
        class: 'invite-input-group'
    });
    inviteInputContainer.append(inviteInputGroup);

    const inviteInput = new pcui.TextInput({
        enabled: isAdmin,
        placeholder: 'Type Username or Email Address',
        class: 'invite-input',
        blurOnEnter: false
    });
    inviteInputGroup.append(inviteInput);

    inviteInput.element.addEventListener('keypress', (evt) => {
        if (evt.key === 'Enter') {
            newCollaborator.user = inviteInput.value;
            createCollaborator();
            inviteInput.value = '';
        }
    });

    const inviteSubmit = new pcui.Button({
        enabled: isAdmin,
        text: 'INVITE',
        class: 'invite-submit'
    });
    inviteInputGroup.append(inviteSubmit);

    const inviteWarning = new pcui.Label({
        class: 'invite-warning',
        text: ''  // by default no label under invite input
    });
    inviteInputContainer.append(inviteWarning);

    inviteSubmit.on('click', () => {
        newCollaborator.user = inviteInput.value;
        createCollaborator();
        inviteInput.value = "";
    });

    // Owner
    const ownerContainer = new pcui.Container({
        class: 'owner-container'
    });
    panel.append(ownerContainer);

    const ownerLabel = new pcui.Label({
        text: 'Owner',
        class: 'section-label'
    });
    ownerContainer.append(ownerLabel);

    // Owner Widget
    const ownerWidgetContainer = new pcui.Container({
        class: 'owner-widget-container'
    });
    ownerContainer.append(ownerWidgetContainer);

    const ownerWidget = new pcui.Container({ class: 'collaborator-container' });
    ownerWidgetContainer.append(ownerWidget);
    ownerWidget.dom.style.width = '307.6px';

    const ownerProfilePic = new pcui.Element(document.createElement('img'), {
        class: 'collaborator-image'
    });
    ownerProfilePic.dom.style.width = '62px';
    ownerProfilePic.dom.style.height = '62px';
    ownerProfilePic.dom.loading = 'lazy';
    ownerWidget.element.appendChild(ownerProfilePic.dom);

    const ownerWidgetRightContainer = new pcui.Container({ class: 'collaborator-right-container' });
    ownerWidget.append(ownerWidgetRightContainer);

    const ownerWidgetFirstRow = new pcui.Container({ class: 'collaborator-first-row' });
    ownerWidgetRightContainer.append(ownerWidgetFirstRow);

    const ownerWidgetName = new pcui.Label({ text: '' });
    ownerWidgetFirstRow.append(ownerWidgetName);

    const ownerWidgetLabel = new pcui.Label({ text: 'Owner' });
    ownerWidgetRightContainer.append(ownerWidgetLabel);

    // Members Container
    const membersContainer = new pcui.Container({
        class: 'members-container'
    });
    panel.append(membersContainer);

    const membersLabel = new pcui.Label({
        text: `Organisation\nMembers\n\n${collaborators.length}/60`,
        class: 'section-label'
    });
    membersContainer.append(membersLabel);

    const membersGrid = new pcui.Element(document.createElement('div'), {
        class: 'members-grid',
        flex: true
    });
    membersContainer.append(membersGrid);

    const addMeAsAdminButton = new pcui.Button({
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
        collaborators = collaborators.sort(function (a, b) {
            if (a.username === owner.username) return -1;
            else if (b.username === owner.username) return 1;
            else if (a.access_level === b.access_level) {
                if (a.full_name < b.full_name) return -1;
                return 1;
            }

            if (a.access_level === 'admin') return -1;
            else if (b.access_level === 'admin') return 1;
            else if (a.access_level === 'write') return -1;
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
                    if (collaborator.username == result.username) {
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
                if (status === 404 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUsername)) {
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
        if (status == 404) text = 'User not found';
        else if (status == 403) {
            if (!text) text = 'You do not have permission to edit the team';
            else if (text === 'Could not retrieve customer') editor.call('picker:project:buildAlert', panel, 'You do not have a credit card on your account', true, 'UPGRADE', { url: `${config.url.home}/upgrade` });
        }

        if (text === 'Reached seats limit' || /reached the user limit/.test(text)) {
            if (owner.plan_type === 'org') {
                // show charge popup
                editor.call('picker:project:buildAlert', panel, errorMessage, true, 'BUY SEAT', { currentUser: owner, errorCallback: handleTeamError });
            } else {
                // show upgrade
                editor.call('picker:project:buildAlert', panel, errorMessage, true, 'UPGRADE', { url: `${config.url.home}/upgrade` });
            }
        } else if (status == 400 && text == 'Could not retrieve customer') {
            editor.call('picker:project:buildAlert', panel, 'You do not have a credit card on your account', true, 'UPGRADE', { url: `${config.url.home}/upgrade` });
        } else {
            editor.call('picker:project:buildAlert', panel, errorMessage);
        }
    };

    // deletes a collaborator from a project and deletes UI element
    const removeCollaborator = (collaborator, container) => {
        if (canRemoveCollaborator()) {
            const index = collaborators.indexOf(collaborator);
            editor.call('users:removeCollaborator', currentProject, collaborator, () => {
                if (index > -1) collaborators.splice(index, 1);
                if (container.dom) container.dom.remove();
                else container.remove();
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
        editor.call('picker:project:cms:refreshProjects');
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
        return collaborator && collaborator.username == config.self.username || hasAdminAccess();
    };

    // determines whether the current user can edit a collaborator's access rights depending on their rights
    const canEditCollaborator = (collaborator) => {
        return collaborator.username !== owner.username && hasAdminAccess();
    };

    // helper method to delete all outstanding events on close
    const destroyEvents = () => {
        events.forEach((evt) => {
            if (evt) evt.unbind();
        });
        events = [];
    };

    // EVENTS

    // on show
    panel.on('show', function () {
        currentProject = editor.call('picker:project:getCurrent');

        // Load owner UI
        ownerProfilePic.dom.src = `${config.url.api}/users/${currentProject.owner_id}/thumbnail?size=80`;
        ownerWidgetName.text = currentProject.owner;

        currentProjectPrivate = editor.call('picker:project:getPrivateSetting');
        editor.call('users:loadOne', currentProject.owner_id, (res) => {
            owner = res;

            if (config.self.id === owner.id) currentUser = owner;

            // Only populate first time around
            if (currentProject.access_level !== 'none' && (membersGrid.element.childNodes.length == 0 || uiRefresh)) {

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
                    if (currentUser && currentUserIsCollaborator) collaborators.unshift(currentUser);  // add current user to top of list (if not organization account)

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

        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', false);
    });

    // on hide
    panel.on('hide', function () {
        destroyEvents();
        editor.call('picker:project:hideAlerts');

        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', true);
    });

    editor.on('viewport:hover', function (state) {
        if (state && !panel.hidden) {
            setTimeout(function () {
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
        collaborators = [];
        inviteInput.enabled = currentProject.access_level === 'admin';
        inviteSubmit.enabled = currentProject.access_level === 'admin';
    });

});
