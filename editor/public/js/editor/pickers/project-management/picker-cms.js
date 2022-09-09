editor.once('load', () => {

    // global variables
    let currentProject;
    let rootUser;
    let currentUser;
    let selectedFilter;
    let accountUsage;
    let dropdownOrg;
    let selectedDropdown;
    let selectedSortRadioButton;
    let sortDescending = true;
    let sortPolicy = 'modified';
    let isSceneLoaded = config.scene ? config.scene.id : null;  // assume scene is not loaded to start with
    let projectsToSearch;  // holds all projects that are searchable

    const searchMatches = new Set();
    const projects = {};
    const IS_EMPTY_STATE = !config.project.id;  // if no project loaded, CMS is in empty state
    const EMPTY_THUMBNAIL_IMAGE = "/static/platform/images/home/blank_project.png";

    let events = [];

    // UI

    // displays or hides the loading bar in the CMS main panel based on parameter
    const toggleProgress = function (toggle, progress = 100, label = "") {
        progressBar.value = progress;
        progressBar.hidden = !toggle;
        if (label !== "") {
            progressLabel.hidden = false;
            progressLabel.text = label;
            progressBarContainer.dom.classList.add('progress-container-expand');
        } else {
            progressLabel.hidden = true;
            progressBarContainer.dom.classList.remove('progress-container-expand');
        }
    };

    // builds out the usage modal
    const buildUsageUI = () => {
        upgradeContainer.dom.innerHTML = '';
        toggleSpinner(upgradeContainer, true);

        editor.call('users:getUsage', currentUser.id, (res) => {
            accountUsage = res;
            toggleSpinner(upgradeContainer, false);

            const usage = sizeToString(accountUsage.total);
            const diskAllowance = sizeToString(currentUser.limits.disk_allowance * 1000 * 1000);
            const percentageUsed = ((accountUsage.total / (currentUser.limits.disk_allowance * 1000 * 1000)) * 100).toPrecision(1);

            // build upgrade container
            const usageLabel = new pcui.Label({
                text: `${usage} / ${diskAllowance} Used`,
                class: 'upgrade-label'
            });
            upgradeContainer.dom.appendChild(usageLabel.element);

            const usageBarContainer = new pcui.Element(document.createElement('div'), {
                class: 'usage-bar-container'
            });
            upgradeContainer.dom.appendChild(usageBarContainer.element);

            const usageBar = new pcui.Element(document.createElement('div'), {
                class: 'usage-bar'
            });
            usageBar.dom.style.width = `${percentageUsed}%`;
            usageBarContainer.dom.appendChild(usageBar.dom);

            // upgrade button
            const upgradeButton = new pcui.Button({
                text: 'UPGRADE',
                class: 'upgrade-button'
            });
            upgradeContainer.dom.appendChild(upgradeButton.element);

            upgradeButton.on('click', () => { window.open(`${config.url.home}/upgrade?account=${currentUser.username}`); });
        });
    };

    // builds each of the organization dropdown menu items
    const buildOrganizationsUI = (selected = null) => {
        organizationsToggle.element.childNodes[1].innerHTML = '';

        // new organization button
        const newOrganizationBtn = new pcui.Button({
            class: 'new-organization-button',
            icon: 'E370',
            text: 'NEW ORGANIZATION'
        });
        organizationsToggle.append(newOrganizationBtn);

        newOrganizationBtn.on('click', () => {
            editor.call('picker:project:newOrganization');
        });

        // load Organizations
        rootUser.organizations.forEach((org) => {
            const organizationFilter = new pcui.Container({
                class: 'organization-button'
            });
            organizationFilter.organization = org;  // add field
            organizationsToggle.append(organizationFilter);

            if (selected && selected === org.full_name) setSelectedFilter(organizationFilter);

            const organizationImage = new pcui.Element(document.createElement('img'), {
                class: 'organization-icon'
            });
            organizationImage.element.src = `${config.url.api}/users/${org.id}/thumbnail?size=26`;
            organizationFilter.append(organizationImage);

            const organizationName = new pcui.Label({
                text: org.full_name
            });
            organizationFilter.append(organizationName);

            // dropdown
            const dropdown = new pcui.Button({
                class: 'dropdown',
                icon: 'E159',
                renderChanges: true
            });
            organizationFilter.append(dropdown.element);

            organizationFilter.on('click', (e) => {
                const filterClicks = new Set([
                    organizationFilter.element,
                    organizationImage.element,
                    organizationName.element
                ]);

                if (e.target == dropdown.dom) {
                    if (!dropdown.class.contains('clicked')) {
                        dropdown.class.add('clicked');
                        dropdown.icon = 'E157';  // change arrow
                        dropdownOrg = org;  // select current organization as dropdown organization
                        selectedDropdown = dropdown;  // select current organization dropdown as selected dropdown
                        orgDropdownMenu.open = true;  // open menu

                        // position dropdown menu
                        var rect = dropdown.element.getBoundingClientRect();
                        orgDropdownMenu.position(rect.left, rect.bottom + 3);
                    } else {
                        orgDropdownMenu.open = false;
                    }
                } else if (filterClicks.has(e.target)) {
                    setSelectedFilter(organizationFilter);
                }
            });
        });
    };

    const buildSortingMenuItem = (root, type, label) => {
        const sortingMenuItem = new pcui.Container({ class: 'sorting-menu-item' });
        root.append(sortingMenuItem);

        let booleanInput;
        if (type === 'checkbox') booleanInput = new pcui.BooleanInput({ class: type });
        else booleanInput = new pcui.RadioButton({ class: type });

        const labelElement = new pcui.Label({ text: label });
        sortingMenuItem.append(booleanInput);
        sortingMenuItem.append(labelElement);

        return [sortingMenuItem, booleanInput];
    };

    const updateRadioButtons = (newSelectedRadio) => {
        selectedSortRadioButton.value = false;
        newSelectedRadio.value = true;
        selectedSortRadioButton = newSelectedRadio;
    };

    // builds sorting dropdown with different sorting algorithms
    const buildSortingDropdown = () => {
        const sortingContainer = new pcui.Container({
            flex: true,
            class: 'sorting-container',
            hidden: true
        });
        editor.call('layout.root').append(sortingContainer);

        const [descendingItem, descendingCheckbox] = buildSortingMenuItem(sortingContainer, 'checkbox', 'Descending');  // descending checkbox
        descendingCheckbox.value = true;  // by default we sort in descending order
        const [sortByModified, modifiedRadio] = buildSortingMenuItem(sortingContainer, 'radio', 'Sort By Last Edited');  // sort by last edited
        const [sortByName, nameRadio] = buildSortingMenuItem(sortingContainer, 'radio', 'Sort By Name');  // sort by name
        const [sortByCreated, createdRadio] = buildSortingMenuItem(sortingContainer, 'radio', 'Sort By Created');  // sort by date created

        selectedSortRadioButton = modifiedRadio;
        selectedSortRadioButton.value = true;

        descendingCheckbox.on('click', () => {
            descendingCheckbox.value = !descendingCheckbox.value;
        });

        descendingItem.on('click', () => {
            descendingCheckbox.value = !descendingCheckbox.value;  // update checkbox
            sortDescending = descendingCheckbox.value;

            if (selectedSortRadioButton === nameRadio) sortPolicy = 'name';
            else if (selectedSortRadioButton === createdRadio) sortPolicy = 'created';

            if (sortDescending) sortButton.icon = 'E437';
            else sortButton.icon = 'E438';

            sortProjects(sortPolicy);
        });

        descendingItem.element.id = 'checkbox-menu-item';

        sortByModified.on('click', () => {
            updateRadioButtons(modifiedRadio);
            sortProjects('modified');
        });

        sortByName.on('click', () => {
            updateRadioButtons(nameRadio);
            sortProjects('name');
        });

        sortByCreated.on('click', () => {
            updateRadioButtons(createdRadio);
            sortProjects('created');
        });

        return sortingContainer;
    };

    // updates last ___ text
    const updateLastText = (DOMProjects, projects, sortingPolicy) => {
        for (let i = 0; i < DOMProjects.length; i++) {
            const domProj = DOMProjects[i];
            const proj = projects[i];

            let lastText = `Last Edited ${formatLastText(proj.modified)}`;
            if (sortingPolicy === 'created') lastText = `Created ${formatLastText(proj.created)}`;

            const spanElement = domProj.querySelector('span.project-last-edited');
            spanElement.innerHTML = lastText;
        }
    };

    // builds each of the project CMS UI components
    const buildProjectUI = (root, project) => {
        const projectContainer = new pcui.Container({
            class: 'project-container'
        });
        root.dom.appendChild(projectContainer.element);

        const projectThumbnailContainer = new pcui.Container({
            class: 'project-thumbnail-container'
        });
        projectContainer.append(projectThumbnailContainer);

        const projectThumbnail = new pcui.Element(document.createElement('img'), {
            class: 'project-thumbnail'
        });
        projectThumbnailContainer.append(projectThumbnail);
        projectThumbnail.dom.loading = 'lazy';  // lazy loading of images
        if (project.thumbnails) projectThumbnail.dom.src = project.thumbnails.m;
        else projectThumbnail.dom.src = EMPTY_THUMBNAIL_IMAGE;

        const projectName = new pcui.Label({
            class: 'project-name',
            text: project.name
        });
        projectContainer.append(projectName);

        const projectLastEdited = new pcui.Label({
            class: 'project-last-edited',
            text: `Last Edited ${formatLastText(project.modified)}`
        });
        projectContainer.append(projectLastEdited);

        // Add Editor settings button to currently open project
        if (!IS_EMPTY_STATE && project.id === currentProject.id) {
            projectContainer.element.classList.add('currentlyOpen');

            const extendedSettings = new pcui.Button({
                class: 'extended-settings-button',
                icon: 'E430'
            });
            if (isSceneLoaded) projectThumbnailContainer.append(extendedSettings);

            extendedSettings.on('click', () => {
                editor.call('picker:project:close');
                overlay.hidden = true;  // hide this modal
            });
        }

        projectContainer.on('click', (evt) => {
            // If user clicks on extended settings button, ignore click
            if (evt.target.nodeName === "BUTTON") return;

            // If disabled project, block click event
            if (project.disabled) return;

            if (project.locked) editor.call('picker:project:lockedView', project);
            else if (project.access_level === 'none') editor.call('picker:project:noAdmin', project);
            else if (IS_EMPTY_STATE || (project.id != config.project.id)) editor.call('picker:project:reduced', project);
            else editor.call('picker:project', 'project-main', true);
        });

        // stats container
        const statsContainer = new pcui.Container({
            class: 'project-stats-container'
        });
        if (project.access_level === 'none') statsContainer.class.add('noadmin');
        projectContainer.append(statsContainer);

        if (project.access_level !== 'none') {
            const forksLabel = new pcui.Label({ class: 'stat', text: `${project.fork_count ? project.fork_count : 0}` });  // forks
            forksLabel.element.id = 'forks-stat';
            const viewsLabel = new pcui.Label({ class: 'stat', text: `${project.views}` });  // views
            viewsLabel.element.id = 'views-stat';
            const playsLabel = new pcui.Label({ class: 'stat', text: project.primary_app_url ? `${project.plays}` : 'N/A' });  // plays
            playsLabel.element.id = 'plays-stat';

            statsContainer.append(forksLabel);
            statsContainer.append(viewsLabel);
            statsContainer.append(playsLabel);
        }
        const sizeLabel = new pcui.Label({ class: 'stat', text: sizeToString(project.size.total) });  // size
        statsContainer.append(sizeLabel);

        if (project.disabled) projectContainer.element.classList.add('disabled');
        if (project.access_level === 'none') projectContainer.element.classList.add('noAccess');
        if (project.locked) projectContainer.element.classList.add('locked');

    };

    // reloads all elements in the CMS main view
    const refreshUI = () => {
        loadProjects();
        buildUsageUI();
    };

    const orgDropdownMenu = ui.Menu.fromData({
        'organization-details': {
            title: 'Organization Details',
            select: function () {
                window.open(`${config.url.home}/user/${dropdownOrg.username}/account`, `_blank`);
            }
        },
        'organization-delete': {
            title: 'Delete Organization',
            select: function () {
                editor.call('picker:project:deleteOrganization', projects[dropdownOrg.id]);
            }
        }
    });
    orgDropdownMenu.class.add('organization-dropdown');
    const dropdownOrganizationDetailsMenuItem = orgDropdownMenu.dom.childNodes[1].childNodes[0];
    dropdownOrganizationDetailsMenuItem.id = 'organization-details';
    const dropdownDeleteOrganizationMenuItem = orgDropdownMenu.dom.childNodes[1].childNodes[1];
    dropdownDeleteOrganizationMenuItem.id = 'organization-delete';

    // add menu
    editor.call('layout.root').append(orgDropdownMenu);

    // on closing menu remove 'clicked' class from respective dropdown
    orgDropdownMenu.on('open', function (open) {
        if (!open && selectedDropdown) {
            const clicked = selectedDropdown.element.classList.contains('clicked');
            if (clicked) {
                selectedDropdown.icon = 'E159';
                selectedDropdown.element.classList.remove('clicked');
            }
        }
    });

    // spinner used to reload usage modal on project creation / deletion
    const toggleSpinner = (root, toggle) => {
        var spinnerIcon = editor.call('picker:versioncontrol:svg:spinner', 32);
        spinnerIcon.classList.add('progress-icon');
        spinnerIcon.classList.add('spin');

        if (toggle && !spinnerIcon.classList.contains('hidden')) {
            root.dom.appendChild(spinnerIcon);
            spinnerIcon.classList.remove('hidden');
        } else {
            spinnerIcon.classList.add('hidden');
            root.dom.innerHTML = '';
        }
    };

    // overlay
    const root = editor.call('layout.root');
    const overlay = new ui.Overlay();
    overlay.clickable = false;
    overlay.hidden = true;
    overlay.class.add('picker-project-cms');
    root.append(overlay);

    // main panel
    const panel = new pcui.Panel({
        headerText: 'PLAYCANVAS',
        class: 'cms-root-panel'
    });
    overlay.append(panel);

    // home button
    const homeButton = new pcui.Button({
        icon: IS_EMPTY_STATE ? 'E268' : 'E430',
        class: 'home-button',
        enabled: !IS_EMPTY_STATE
    });
    panel.header.append(homeButton);

    homeButton.on('click', () => {
        if (IS_EMPTY_STATE) return;  // disable button if in empty state

        if (isSceneLoaded) {
            editor.call('picker:project:close');
        } else {
            editor.call('picker:project');
        }
        overlay.hidden = true;
    });

    // header utils container
    const headerUtils = new pcui.Container({
        class: 'header-utils'
    });
    panel.header.append(headerUtils);

    // file picker
    const filePicker = document.createElement('input');
    filePicker.id = "file-picker";
    filePicker.type = "file";
    filePicker.accept = "application/zip";

    filePicker.addEventListener("change", () => {
        importProject(filePicker.files);
    });

    // import project button
    const importProjectButton = new pcui.Button({
        class: 'import-button',
        icon: 'E222'
    });
    headerUtils.append(importProjectButton);

    importProjectButton.on('click', () => {
        filePicker.click();
    });

    // new project button
    const newProjectButton = new pcui.Button({
        class: 'new-project-button',
        text: 'NEW PROJECT'
    });
    headerUtils.append(newProjectButton);

    newProjectButton.on('click', () => {
        editor.call('picker:project:newProject');
    });

    // user icon
    const userIcon = new pcui.Element(document.createElement('div'), {
        class: 'user-icon'
    });
    userIcon.style.backgroundImage = `url(${config.url.api}/users/${config.self.id}/thumbnail?size=24)`;
    headerUtils.append(userIcon);

    userIcon.on('click', () => {
        window.open(`${config.url.home}/account`, '_blank');
    });

    // left panel
    const leftPanel = new pcui.Element(document.createElement('div'), {
        class: 'cms-left-panel'
    });
    panel.append(leftPanel);

    // projects toggle
    const projectsToggle = new pcui.Panel({
        class: 'projects-toggle',
        collapsible: true,
        headerText: 'PROJECTS'
    });
    leftPanel.dom.appendChild(projectsToggle.element);

    // filter list
    const allFilter = new pcui.Button({
        class: 'filter-button',
        icon: 'E139',
        text: 'ALL'
    });
    projectsToggle.append(allFilter);
    selectedFilter = allFilter;  // by default, all filter selected

    allFilter.on('click', () => { setSelectedFilter(allFilter); });

    const myProjectsFilter = new pcui.Button({
        class: 'filter-button',
        icon: 'E337',
        text: 'MY PROJECTS'
    });
    projectsToggle.append(myProjectsFilter);
    myProjectsFilter.on('click', () => { setSelectedFilter(myProjectsFilter); });

    const sharedFilter = new pcui.Button({
        class: 'filter-button',
        icon: 'E301',
        text: 'SHARED WITH ME'
    });
    projectsToggle.append(sharedFilter);
    sharedFilter.on('click', () => { setSelectedFilter(sharedFilter); });

    const privateFilter = new pcui.Button({
        class: 'filter-button',
        icon: 'E341',
        text: 'PRIVATE PROJECTS'
    });
    projectsToggle.append(privateFilter);
    privateFilter.on('click', () => { setSelectedFilter(privateFilter); });

    // organizations toggle
    const organizationsToggle = new pcui.Panel({
        class: 'organizations-toggle',
        collapsible: true,
        collapsed: false,
        headerText: 'ORGANIZATIONS'
    });
    leftPanel.dom.appendChild(organizationsToggle.element);

    const addOrganizationButton = new pcui.Button({
        class: 'organization-add',
        icon: 'E370'
    });
    organizationsToggle.element.childNodes[0].appendChild(addOrganizationButton.element);

    addOrganizationButton.on('click', () => {
        editor.call('picker:project:newOrganization');
    });

    // miscellaneous container
    const miscContainer = new pcui.Container({
        class: 'misc-container',
        flex: true
    });
    leftPanel.dom.appendChild(miscContainer.element);

    // quick links container
    const quickLinksContainer = new pcui.Container({
        class: 'quick-links-container',
        flex: true
    });
    miscContainer.append(quickLinksContainer);

    const exploreLink = new pcui.Button({
        class: 'quick-link',
        icon: 'E129',
        text: 'Explore'
    });  // Explore

    exploreLink.on('click', () => { window.open(`${config.url.home}/explore/featured`, '_blank'); });

    const docsLink = new pcui.Button({
        class: 'quick-link',
        icon: 'E232',
        text: 'Docs and Tutorials'
    });  // Docs

    docsLink.on('click', () => { window.open('https://developer.playcanvas.com/en/', '_blank'); });

    const feedbackLink = new pcui.Button({
        class: 'quick-link',
        icon: 'E119',
        text: 'Feedback'
    });  // Feedback

    feedbackLink.on('click', () => { window.open(`https://forum.playcanvas.com/t/playcanvas-editor-feedback/616`, '_blank'); });

    const githubLink = new pcui.Button({
        class: 'quick-link',
        icon: 'E259',
        text: 'GitHub'
    });  // GitHub

    githubLink.on('click', () => { window.open(`https://github.com/playcanvas/editor`, '_blank'); });

    quickLinksContainer.append(exploreLink);
    quickLinksContainer.append(docsLink);
    quickLinksContainer.append(feedbackLink);
    quickLinksContainer.append(githubLink);

    // upgrade container
    const upgradeContainer = new pcui.Element(document.createElement('div'), {
        class: 'upgrade-container'
    });
    miscContainer.append(upgradeContainer);

    // right panel
    const rightPanel = new pcui.Element(document.createElement('div'), {
        class: 'cms-right-panel'
    });
    panel.append(rightPanel);

    // progress bar and loading label
    const progressBarContainer = new pcui.Container({ class: 'progress-container' });
    const progressBar = new pcui.Progress({ value: 100, class: 'progress' });
    progressBar.hidden = true;
    const progressLabel = new pcui.Label({ text: 'Uploading', hidden: true });
    rightPanel.dom.appendChild(progressBarContainer.dom);
    progressBarContainer.append(progressBar);
    progressBarContainer.append(progressLabel);

    // right panel controls
    const controlsContainer = new pcui.Container({
        class: 'list-project-controls'
    });
    rightPanel.dom.appendChild(controlsContainer.element);

    const searchBar = new pcui.TextInput({
        placeholder: 'Search',
        class: 'search-project',
        keyChange: true
    });
    controlsContainer.append(searchBar);

    searchBar.on('change', () => {
        // reset project matches
        searchMatches.clear();  // reset search matches
        const searchResult = editor.call('search:items', projectsToSearch, searchBar.value);

        if (searchBar.value !== '') searchBar.placeholder = '';
        else searchBar.placeholder = 'Search';

        searchResult.forEach((result) => {
            result.inSearch = true;
            searchMatches.add(result.id);
        });

        refreshProjects();
    });

    const sortButton = new pcui.Button({
        icon: 'E437',
        class: ['sort-btn', 'closed']
    });
    controlsContainer.append(sortButton);

    const sortingDropdown = buildSortingDropdown();

    sortButton.on('click', () => {
        sortingDropdown.hidden = !sortingDropdown.hidden;

        if (sortButton.element.classList.contains('closed')) {
            sortButton.element.classList.remove('closed');
            sortButton.element.classList.add('open');
        } else {
            sortButton.element.classList.remove('open');
            sortButton.element.classList.add('closed');
        }

        // position dropdown menu
        const rect = sortButton.element.getBoundingClientRect();
        const sortingDropdownRect = sortingDropdown.element.getBoundingClientRect();
        sortingDropdown.dom.style.left = `${rect.right - sortingDropdownRect.width}px`;
        sortingDropdown.dom.style.top = `${rect.bottom + 3}px`;
    });

    const layoutButton = new pcui.Button({
        icon: 'E284',
        class: 'layout-btn'
    });
    controlsContainer.append(layoutButton);

    // right panel projects
    const projectsContainer = new pcui.Element(document.createElement('div'), {
        class: 'projects-container-grid'
    });
    rightPanel.dom.appendChild(projectsContainer.element);

    const noProjectsButton = new pcui.Button({
        class: 'no-projects-button',
        icon: 'E370',
        hidden: true,
        renderChanges: true
    });
    rightPanel.dom.appendChild(noProjectsButton.element);

    noProjectsButton.on('click', () => {
        editor.call('picker:project:newProject');
    });

    layoutButton.on('click', () => {
        if (projectsContainer.dom.classList.contains('projects-container-grid')) {
            projectsContainer.dom.classList.remove('projects-container-grid');
            projectsContainer.dom.classList.add('projects-container-list');
            layoutButton.icon = 'E332';
        } else {
            projectsContainer.dom.classList.remove('projects-container-list');
            projectsContainer.dom.classList.add('projects-container-grid');
            layoutButton.icon = 'E284';
        }
    });


    // CONTROLLERS

    // updates current user on selecting new org filter by retrieving it from the API
    const changeCurrentUser = (newUser) => {
        editor.call('users:loadOne', newUser.id, (res) => {
            currentUser = res;

            refreshProjects();
            buildUsageUI();
        });
    };

    // handles the flow for project importing including error and loading states
    const importProject = (files) => {

        // Check if import is disabled or no file submitted
        if (importDisabled() || files.length === 0)
            return;

        toggleProgress(true, 0, 'Uploading... Please stand by');

        // Convert file to form data
        var form = new FormData();
        form.append("file", files[0]);

        editor.call('projects:uploadExport', form, (progress) => {
            // Progress handler function
            progressBar.value = progress * 100;

            if (progress === 1) progressLabel.text = "Upload Complete! Importing... (Please don't close this window)";
        }, async (data) => {
            const result = await data;

            let jobId;
            var evt = editor.on('messenger:job.update', (msg) => {
                if (msg.job.id == jobId) {
                    evt.unbind();
                }

                // get job
                Ajax({
                    url: `{{url.api}}/jobs/${msg.job.id}`,
                    auth: true
                })
                .on('load', function (status, job) {
                    if (job.status === 'complete') {
                        // togglePopup close
                        toggleProgress(false);

                        if (config.self.organization) {
                            // do not redirect organization viewer to project,
                            // because they don't have any access permissions. Instead
                            // add it to the list
                            refreshProjects();
                        } else {
                            editor.call('picker:project:newProjectConfirmation', `/editor/project/${job.data.project_id}`);
                        }
                    } else if (job.status === 'error') {
                        const importError = job.messages[0] || "There was an error while importing";
                        editor.call('picker:project:buildAlert', rightPanel, importError);
                    }
                })
                .on('error', function (error) {
                    editor.call('picker:project:buildAlert', rightPanel, "There was an error while importing");
                });
            });
            events.push(evt);

            editor.call('projects:importNew', result.s3Key, config.self.id, (job) => {
                jobId = job.id;
            }, (error) => {
                toggleProgress(false);
                editor.call('picker:project:buildAlert', rightPanel, "Could not import project");
            });
        }, (err) => {
            toggleProgress(false);
            editor.call('picker:project:buildAlert', rightPanel, "There was an error while importing");
        });

    };

    // loads the current user's projects into the CMS main panel
    const loadProjects = () => {
        toggleProgress(true);
        const promises = [];
        const userOrder = [rootUser.id];
        promises.push(editor.call('projects:list', rootUser.id, editor.call('project:management:showOwnerView', currentUser) ? 'profile' : null));

        rootUser.organizations.forEach((org) => {
            const orgPromise = editor.call('projects:list', org.id, editor.call('project:management:showOwnerView', org) ? 'profile' : null);
            userOrder.push(org.id);
            promises.push(orgPromise);
        });

        Promise.all(promises).then((values) => {
            for (let i = 0; i < Object.keys(values).length; i++) {
                projects[userOrder[i]] = values[i].result;
            }

            sortProjects(sortPolicy);

            refreshProjects();
            toggleProgress(false);
        });
    };

    // reloads the projects that are currently in view in the CMS main panel
    const refreshProjects = () => {
        projectsToSearch = [];  // reset projects in view

        if (!(currentUser.id in projects) || projects[currentUser.id].length == 0) {
            projectsContainer.element.innerHTML = '';
            noProjectsButton.hidden = false;
            projects[currentUser.id] = [];
        } else {
            noProjectsButton.hidden = true;

            if (events.length > 0) destroyEvents();
            projectsContainer.element.innerHTML = '';
            projectsContainer.hidden = projects.length === 0;
            projects[currentUser.id].forEach((proj) => {
                projectsToSearch.push([proj.name, proj]);
                if (shouldShowProject(proj)) {
                    buildProjectUI(projectsContainer, proj);
                }
            });
        }
    };

    // sort apps by primary first and then created date
    const sortProjects = (sorting_policy = 'modified') => {
        const ascending = sortDescending ? 1 : -1;
        switch (sorting_policy) {
            case 'modified':
                projects[currentUser.id].sort((a, b) => {
                    if (a.modified < b.modified) return 1 * ascending;
                    if (a.modified > b.modified) return -1 * ascending;
                    return 0;
                });
                break;
            case 'name':
                projects[currentUser.id].sort((a, b) => {
                    if (a.name.toLowerCase() < b.name.toLowerCase()) return 1 * ascending;
                    if (a.name.toLowerCase() > b.name.toLowerCase()) return -1 * ascending;
                    return 0;
                });
                break;
            case 'created':
                projects[currentUser.id].sort((a, b) => {
                    if (a.created < b.created) return 1 * ascending;
                    if (a.created > b.created) return -1 * ascending;
                    return 0;
                });
                break;
        }

        refreshProjects();
        updateLastText(projectsContainer.element.childNodes, projects[currentUser.id], sorting_policy);
    };

    // LOCAL UTILS

    // checks whether importing is allowed for current user based on permissions
    const importDisabled = () => {
        return editor.call('project:management:getUserPermissions', currentProject, currentUser) !== 'Read';
    };

    // determines which projects should be shown based on current active filters
    const shouldShowProject = (project) => {
        // If we have a search result, make sure to filter
        if (searchBar.value.length > 0 && !(searchMatches.has(project.id))) return false;  // ignore project if not in search result

        if (!selectedFilter.organization) {
            switch (selectedFilter.text.toLowerCase()) {
                case 'all': return true;
                case 'my projects': return project.owner_id === config.self.id;
                case 'shared with me': return project.owner_id !== config.self.id;
                case 'private projects': return project.private;
                default: console.log("No such filter!");
            }
        } else {
            return true;
        }
    };

    // updates the current filter UI and triggers project reloading
    const setSelectedFilter = (filter) => {
        if (selectedFilter)  selectedFilter.style.backgroundColor = 'transparent';  // reset old selected filter styling
        selectedFilter = filter;
        selectedFilter.style.backgroundColor = '#364346';

        if (selectedFilter.organization) changeCurrentUser(selectedFilter.organization);
        else changeCurrentUser(rootUser);

        loadProjects();  // reload projects
    };

    // formats last __ text for project UI (refreshed on sorting policy change)
    const formatLastText = (lastCriteria) => {
        const lastDate = new Date(Date.parse(lastCriteria));
        const now = new Date(Date.now());

        const utcVariable = Date.UTC(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
        const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

        const diffDays = Math.floor((utcNow - utcVariable) / (1000 * 60 * 60 * 24));
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffMonths / 12);

        if (diffYears > 0) return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
        if (diffMonths > 0) return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
        if (diffDays > 0) return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;

        return 'today';  // return today if project modified less than 24 hours ago
    };

    // helper method to return the size fixed to 2 digits precision
    const toFixed = (size) => {
        let result = size.toFixed(2);
        if (result % 1 === 0)
            result = Math.floor(result);

        return result;
    };

    // helper method to convert size in bytes to formatted string in appropriate measure
    const sizeToString = (size) => {
        const base = 1000;
        const sizes = ['KB', 'MB', 'GB', 'TB'];
        let returnString;

        if (isNaN(size)) return '0 Bytes';
        if (size < base) return size + ' Bytes';

        let currentSize = 0;
        while (size > base) {
            size /= base;

            returnString = toFixed(size) + '' + sizes[currentSize];
            currentSize++;
        }

        return returnString;
    };

    // helper method to destroy all outstanding events on close
    const destroyEvents = () => {
        events.forEach((evt) => {
            if (evt) evt.unbind();
        });
        events = [];
    };

    // EVENTS

    // load and show data
    overlay.on('show', () => {
        // determine if a scene has been loaded
        if (config.scene && config.scene.id) isSceneLoaded = true;
        if (editor.call('viewport:inViewport')) editor.emit('viewport:hover', false);
    });

    // clean up
    overlay.on('hide', () => {
        destroyEvents();

        // reset sorting dropdown state
        sortingDropdown.hidden = true;
        sortButton.element.classList.remove('open');
        sortButton.element.classList.add('closed');

        // reset selected to 'All' filter
        setSelectedFilter(allFilter);

        editor.call('picker:project:hideAlerts');

        if (editor.call('viewport:inViewport')) editor.emit('viewport:hover', true);
    });

    // prevent viewport hovering when picker is shown
    editor.on('viewport:hover', function (state) {
        if (state && !overlay.hidden) {
            setTimeout(function () {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // hook to close the CMS modal
    editor.method('picker:project:cms:close', () => {
        overlay.hidden = true;
    });

    // hook to retrieve current user
    editor.method('picker:project:cms:currentUser', () => {
        return currentUser;
    });

    // hook to retrieve root user
    editor.method('picker:project:cms:rootUser', () => {
        return rootUser;
    });

    // hook to reset filter to All (user projects)
    editor.method('picker:project:cms:resetFilter', () => {
        setSelectedFilter(allFilter);
    });

    // hook to retrieve currently selected organization (dropdown)
    editor.method('picker:project:cms:dropdownOrg', () => {
        return dropdownOrg;
    });

    // hook to refresh list of organizations
    editor.method('picker:project:cms:refreshOrgs', (organization, deleteOrg = false) => {
        const orgsList = organizationsToggle.element.childNodes[1];
        orgsList.innerHTML = '';
        if (!deleteOrg) rootUser.organizations.push(organization);
        else rootUser.organizations = rootUser.organizations.filter(org => org.id != organization.id);
        buildOrganizationsUI(organization.full_name);
    });

    // method to display panel
    editor.method('picker:project:cms', () => {
        editor.call('users:loadOne', config.self.id, (user) => {
            rootUser = user;
            currentUser = rootUser;
            loadProjects();
            currentProject = editor.call('picker:project:getCurrent');

            editor.call('users:getUsage', config.self.id, (usage) => {
                accountUsage = usage;

                // all filter selected on load
                selectedFilter = allFilter;
                selectedFilter.style.backgroundColor = '#364346';

                buildUsageUI();
                buildOrganizationsUI();
                overlay.hidden = false;
            });
        });
    });

    // subscribe to project create
    editor.on('messenger:project.create', () => {
        refreshUI();
    });

    // subscribe to project delete
    editor.on('messenger:project.delete', () => {
        refreshUI();
        editor.call('picker:project:cms:toggleProgress', false);
    });

    // subscribe to project thumbnail
    editor.on('messenger:project.user.image', () => {
        refreshUI();
    });

    // hook to retrieve main CMS panel (used to display errors from other files)
    editor.method('picker:project:cms:getPanel', () => {
        return panel;
    });

    // hook to refresh the list of projects
    editor.method('picker:project:cms:refreshProjects', () => {
        refreshUI();
    });

    // hook to toggle CMS progress bar
    editor.method('picker:project:cms:toggleProgress', (toggle) => {
        toggleProgress(toggle);
    });

});
