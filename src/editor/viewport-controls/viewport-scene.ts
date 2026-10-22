import { Button, Container, Label } from '@playcanvas/pcui';

import { TooltipHandle } from '@/common/tooltips';
import { config } from '@/editor/config';
import { openProjects } from '@/editor/pickers/project-management/tabs';

editor.once('load', () => {
    const root = editor.call('layout.root');
    const viewport = editor.call('layout.viewport');

    const panel = new Container({
        class: ['control-strip', 'top-left']
    });
    viewport.append(panel);

    editor.method('layout.toolbar.scene', () => {
        return panel;
    });

    // breadcrumb: projects page, then the project, branch and scene
    const crumbs = new Container({ class: 'control-strip-crumbs' });
    panel.append(crumbs);
    const separator = () => crumbs.append(new Label({ class: 'control-strip-sep' }));

    const projectsButton = new Button({
        class: 'control-strip-btn',
        icon: 'E140',
        text: 'Projects'
    });
    crumbs.append(projectsButton);

    projectsButton.on('click', () => openProjects());

    TooltipHandle.attach({
        target: projectsButton.dom,
        text: 'All Projects',
        align: 'top',
        root: root
    });

    separator();

    const projectButton = new Button({
        class: ['control-strip-btn', 'control-strip-project'],
        icon: 'E139',
        text: config.project.name
    });
    crumbs.append(projectButton);

    projectButton.on('click', () => {
        editor.call('picker:project', 'project-main');
    });

    TooltipHandle.attach({
        target: projectButton.dom,
        text: 'Project Settings',
        align: 'top',
        root: root
    });

    const settingsButton = new Button({
        class: 'control-strip-btn',
        icon: 'E134'
    });

    TooltipHandle.attach({
        target: settingsButton.dom,
        text: 'Settings',
        align: 'top',
        root: root
    });

    settingsButton.on('click', () => {
        editor.call('selector:set', 'editorSettings', [editor.call('settings:projectUser')]);
    });

    editor.on('attributes:clear', () => {
        settingsButton.class.remove('active');
    });

    editor.on('attributes:inspect[editorSettings]', () => {
        settingsButton.class.add('active');
    });

    if (!config.project.settings.useLegacyScripts) {
        let name = config.self.branch.name;
        if (name.length > 33) {
            name = `${name.substring(0, 30)}...`;
        }
        const branchSeparator = new Label({ class: 'control-strip-sep' });
        crumbs.append(branchSeparator);
        const versionControlButton = new Button({
            class: 'control-strip-btn',
            icon: 'E399',
            text: name
        });
        crumbs.append(versionControlButton);
        versionControlButton.dom.dataset.action = 'version-control';

        versionControlButton.on('click', () => {
            editor.call('picker:versioncontrol');
        });

        TooltipHandle.attach({
            target: versionControlButton.dom,
            text: 'Version Control',
            align: 'top',
            root: root
        });

        // hide version control picker if we are not part of the team
        const updateBranch = () => {
            versionControlButton.hidden = !editor.call('permissions:read');
            branchSeparator.hidden = versionControlButton.hidden;
        };
        updateBranch();
        editor.on('permissions:set', updateBranch);
    }

    separator();
    const scenesButton = new Button({
        class: 'control-strip-btn',
        icon: 'E147'
    });
    crumbs.append(scenesButton);
    panel.append(settingsButton);

    editor.on('scene:name', (name) => {
        scenesButton.text = name;
    });

    TooltipHandle.attach({
        target: scenesButton.dom,
        text: 'Manage Scenes',
        align: 'top',
        root: root
    });

    scenesButton.on('click', () => {
        editor.call('picker:scene');
    });

    editor.on('picker:scene:open', () => {
        scenesButton.class.add('active');
    });

    editor.on('picker:scene:close', () => {
        scenesButton.class.remove('active');
    });
});
