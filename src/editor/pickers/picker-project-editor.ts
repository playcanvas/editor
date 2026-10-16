import { Button } from '@playcanvas/pcui';

import { config } from '@/editor/config';

import { openProjects } from './project-management/tabs';

// the open project's settings in the editor: every menu, and a way to the projects page
editor.once('load', () => {
    const leftPanel = editor.call('picker:project:leftPanel');

    // the projects page has its own tab, so this one keeps the open project
    const seeAll = new Button({ class: 'project-cms-button', text: 'See all projects' });
    leftPanel.append(seeAll);
    seeAll.on('click', () => openProjects());

    editor.method('picker:project', (option?: string) => {
        // version control holds the picker open while its graph shows
        editor.call(
            'picker:project:setCloseGuard',
            option === 'version control' ? () => editor.call('vcgraph:isHidden') : null
        );
        editor.call('picker:project:open', config.project.id, config.owner.id, option);
    });

    // closing was disallowed while no scene was loaded, unless a version control operation holds it
    editor.on('scene:load', () => {
        if (leftPanel.enabled) {
            editor.call('picker:project:setClosable', true);
        }
    });
});
