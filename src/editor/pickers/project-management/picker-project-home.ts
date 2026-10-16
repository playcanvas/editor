import { Button } from '@playcanvas/pcui';

import { config } from '@/editor/config';

import { button } from './components/button';
import { openProject } from './tabs';

// project settings opened from the projects page: a project's settings, team and dev log, or less when you
// can't open it, with buttons to open it in its own tab or play it
const VIEWS = {
    // a project you can open
    reduced: { menus: ['project-main', 'team', 'dev-log'] },
    // an organization's project you're not a member of: only the team, to add yourself
    noAdmin: { menus: ['team'], stats: false },
    // a locked project: only why, and how to unlock it
    locked: { menus: ['project-main'] }
};

const NOT_A_MEMBER =
    'You are not currently an admin for this project. Assign yourself as an admin to edit and manage this project';

editor.once('load', () => {
    let canOpen = false;
    const current = () => editor.call('picker:project:getCurrent');

    // above the projects page
    editor.call('picker:project:overlay').class.add('other-project');

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
        // its owner can change the thumbnail straight away
        const owns = name === 'reduced' && project.access_level === 'admin' && project.owner_id === config.self.id;
        editor.call('picker:project:open', project.id, config.self.id, option, {
            ...VIEWS[name],
            thumbnails: owns ? 'shown' : undefined
        });
    };
    editor.method('picker:project:reduced', show('reduced', 'project-main'));
    editor.method('picker:project:noAdmin', show('noAdmin', 'team'));
    editor.method('picker:project:lockedView', show('locked', 'project-main'));

    // joining or leaving a project changes what you can do with it, so reopen its settings
    editor.on('picker:team:membership', (project) => editor.call('picker:project:reduced', project));

    // an organization admin who isn't a member of one of its projects can add themselves as its admin
    const addMe = new Button({ class: 'add-me-as-admin', text: 'ADD ME AS ADMIN', icon: 'E375' });
    addMe.on('click', () => {
        const project = current();
        addMe.enabled = false;
        editor.call(
            'users:createCollaborator',
            project.id,
            { user: config.self.username, access_level: 'admin' },
            () => {
                project.permissions.admin.push(config.self.username);
                project.access_level = 'admin';
                editor.call('picker:project:close');
                editor.emit('picker:team:membership', project);
                editor.emit('projects:changed');
            },
            (err) => {
                addMe.enabled = true;
                editor.call('picker:project:buildAlert', addMe.parent, err);
            }
        );
    });
    editor.method('picker:team:management:restriction', (project, collaborators) => {
        const self = editor.call('picker:project:getOwner');
        const outsider =
            project.access_level === 'none' ||
            (editor.call('project:management:isOrgAdmin', project.owner_id, self) &&
                !project.locked &&
                !collaborators.some((c) => c.id === self.id));
        if (!outsider) {
            return null;
        }
        addMe.enabled = true;
        return { text: NOT_A_MEMBER, action: addMe };
    });
});
