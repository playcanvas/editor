import { Button, Container } from '@playcanvas/pcui';

import { LegacyTooltip } from '@/common/ui/tooltip';

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

    const homeButton = new Button({
        icon: 'E140'
    });
    panel.append(homeButton);

    homeButton.on('click', () => {
        window.open(`/project/${config.project.id}`, '_blank');
    });

    LegacyTooltip.attach({
        target: homeButton.dom,
        text: 'Home',
        align: 'top',
        root: root
    });

    const settingsButton = new Button({
        icon: 'E134'
    });
    panel.append(settingsButton);

    LegacyTooltip.attach({
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
        const versionControlButton = new Button({
            icon: 'E399',
            text: name
        });
        panel.append(versionControlButton);

        versionControlButton.on('click', () => {
            editor.call('picker:versioncontrol');
        });

        LegacyTooltip.attach({
            target: versionControlButton.dom,
            text: 'Version Control',
            align: 'top',
            root: root
        });

        // hide version control picker if we are not part of the team
        if (!editor.call('permissions:read')) {
            versionControlButton.hidden = true;
        }
        editor.on('permissions:set', () => {
            versionControlButton.hidden = !editor.call('permissions:read');
        });
    }

    const scenesButton = new Button({
        icon: 'E147'
    });
    panel.append(scenesButton);

    editor.on('scene:name', (name) => {
        scenesButton.text = name;
    });

    LegacyTooltip.attach({
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
