import { config } from '@/editor/config';

import { button } from './components/button';
import { openProject } from './tabs';

// project settings opened from the projects page: a project's settings, team and dev log, or less when you
// can't open it, with buttons to open it in its own tab or play it
const VIEWS = {
    // a project you can open
    reduced: { menus: ['project-main', 'team', 'dev-log'] },
    // an organization's project you're not a member of: only the team, to add yourself
    noAdmin: { menus: ['team'], stats: false, thumbnails: false },
    // a locked project: only why, and how to unlock it
    locked: { menus: ['project-main'], thumbnails: false }
};

editor.once('load', () => {
    let canOpen = false;
    const current = () => editor.call('picker:project:getCurrent');

    const leftPanel = editor.call('picker:project:leftPanel');
    const editorBtn = button({
        kind: 'primary',
        class: 'cms-editor-button',
        icon: 'E294',
        text: 'Open editor',
        hidden: true
    });
    leftPanel.append(editorBtn);
    editorBtn.on('click', () => openProject(current().id));

    const playBtn = button({ kind: 'primary', class: 'cms-play-button', icon: 'E286', text: 'Play', hidden: true });
    leftPanel.append(playBtn);
    playBtn.on('click', () => window.open(current().primary_app_url, '_blank'));

    // the id puts it on the left of the footer, set apart from fork and export
    const deleteBtn = button({ kind: 'secondary', tone: 'danger', icon: 'E124', text: 'Delete Project' });
    deleteBtn.dom.id = 'delete-project-button';
    editor.call('picker:project:main:actions').append(deleteBtn);
    deleteBtn.on('click', () => editor.call('picker:project:modal:deleteProjectConfirmation', current()));

    editor.on('picker:project:refresh', (project) => {
        editorBtn.hidden = !canOpen;
        playBtn.hidden = !canOpen;
        playBtn.enabled = !!project.primary_app_url;
        deleteBtn.enabled = project.access_level === 'admin';
    });

    const show = (name: keyof typeof VIEWS, option: string) => (project) => {
        canOpen = name === 'reduced';
        editor.call('picker:project:open', project.id, config.self.id, option, VIEWS[name]);
    };
    editor.method('picker:project:reduced', show('reduced', 'project-main'));
    editor.method('picker:project:noAdmin', show('noAdmin', 'team'));
    editor.method('picker:project:lockedView', show('locked', 'project-main'));
});
