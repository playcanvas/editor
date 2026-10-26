import { Button } from '@playcanvas/pcui';

import { backend, UNSUPPORTED_TIP } from '@/common/backend';
import { TooltipHandle } from '@/common/tooltips';
import { config } from '@/editor/config';

import { openProjects } from './project-management/tabs';

// the project settings and project dialogs (fork, project ready, leave, visibility) as the editor needs them
editor.once('load', () => {
    const leftPanel = editor.call('picker:project:leftPanel');

    // the projects page has its own tab, so this one keeps the open project. it needs the backend's project list
    const listed = !!backend().projectList;
    const seeAll = new Button({ class: 'project-cms-button', text: 'See all projects', enabled: listed });
    leftPanel.append(seeAll);
    if (!listed) {
        TooltipHandle.attach({ target: seeAll.dom, ...UNSUPPORTED_TIP, align: 'bottom' });
    }
    seeAll.on('click', () => openProjects());

    // with no scene loaded there's nothing behind settings to go back to
    editor.call('picker:project:setCloseRule', () => !!config.scene.id);

    // version control holds the picker open while its graph shows
    editor.call(
        'picker:project:setCloseGuard',
        () => editor.call('picker:project:selected') !== 'version control' || editor.call('vcgraph:isHidden')
    );

    editor.method('picker:project', (option?: string) => {
        editor.call('picker:project:open', config.project.id, config.owner.id, option, { thumbnails: 'panel' });
    });

    // closing was disallowed while no scene was loaded, unless a version control operation holds it
    editor.on('scene:load', () => {
        if (leftPanel.enabled) {
            editor.call('picker:project:setClosable', true);
        }
    });

    // the publish pickers read the open project's thumbnails from the config
    editor.on('picker:project:imageDeleted', () => {
        config.project.thumbnails = {};
    });
    editor.on('messenger:project.image', (data) => {
        config.project.thumbnails = data.project.thumbnails;
    });
    editor.on('messenger:project.user.image', (data) => {
        config.project.thumbnails = data.project.thumbnails;
    });

    // the viewport stops taking hover while project settings or a project dialog is up
    const isDialog = (name: string) => name === 'project' || name === 'project-new' || name.startsWith('dialog:');
    let dialogs = 0;
    editor.on('picker:open', (name: string) => {
        if (isDialog(name) && dialogs++ === 0 && editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });
    editor.on('picker:close', (name: string) => {
        if (isDialog(name) && --dialogs === 0 && editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });
    editor.on('viewport:hover', (state: boolean) => {
        if (state && dialogs) {
            setTimeout(() => editor.emit('viewport:hover', false), 0);
        }
    });
});
