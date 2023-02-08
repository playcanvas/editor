import { Container, Label } from '@playcanvas/pcui';

editor.once('load', function () {
    const root = editor.call('layout.root');
    const viewport = editor.call('layout.viewport');

    const panel = new Container({
        class: 'widget-title'
    });
    viewport.append(panel);

    editor.method('layout.toolbar.scene', function () {
        return panel;
    });

    const projectName = new Label({
        class: 'project-name'
    });
    panel.append(projectName);

    projectName.on('click', function (argument) {
        window.open(`/project/${config.project.id}`, '_blank');
    });

    Tooltip.attach({
        target: projectName.element,
        text: 'Home',
        align: 'top',
        root: root
    });

    const sceneName = new Label({
        class: 'scene-name'
    });
    panel.append(sceneName);

    Tooltip.attach({
        target: sceneName.element,
        text: 'Settings',
        align: 'top',
        root: root
    });

    sceneName.on('click', function () {
        editor.call('selector:set', 'editorSettings', [editor.call('settings:projectUser')]);
    });

    editor.on('attributes:clear', function () {
        sceneName.class.remove('active');
    });

    editor.on('attributes:inspect[editorSettings]', function () {
        sceneName.class.add('active');
    });

    if (!config.project.settings.useLegacyScripts) {
        let name = config.self.branch.name;
        if (name.length > 33) {
            name = name.substring(0, 30) + '...';
        }
        const branchButton = new Label({
            class: 'branch-name',
            text: name
        });
        panel.append(branchButton);
        branchButton.on('click', function () {
            editor.call('picker:versioncontrol');
        });

        Tooltip.attach({
            target: branchButton.element,
            text: 'Version Control',
            align: 'top',
            root: root
        });

        // hide version control picker if we are not part of the team
        if (!editor.call('permissions:read')) {
            branchButton.hidden = true;
        }
        editor.on('permissions:set', function () {
            branchButton.hidden = !editor.call('permissions:read');
        });
    }

    const sceneList = new Label({
        class: 'scene-list'
    });
    panel.append(sceneList);

    editor.on('scene:name', function (name) {
        sceneList.text = name;
    });

    Tooltip.attach({
        target: sceneList.element,
        text: 'Manage Scenes',
        align: 'top',
        root: root
    });

    sceneList.on('click', function () {
        editor.call('picker:scene');
    });

    editor.on('picker:scene:open', function () {
        sceneList.class.add('active');
    });

    editor.on('picker:scene:close', function () {
        sceneList.class.remove('active');
    });
});
