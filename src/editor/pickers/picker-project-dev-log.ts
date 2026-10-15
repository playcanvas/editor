import { Button, Container, Element, Label, TextAreaInput, TextInput } from '@playcanvas/pcui';
import Markdown from 'markdown-it';

import { config } from '@/editor/config';

const TITLE_MAX = 100;
const DELETE_CONFIRM_MS = 3000;

// raw html stays escaped (markdown-it's default), so post text can't inject markup
const md = Markdown({ linkify: true });

editor.once('load', () => {
    let project = null;
    let load = 0;
    let composer: Container | null = null;

    const rest = () => editor.api.globals.rest.posts;
    const canWrite = () => project?.access_level === 'write' || project?.access_level === 'admin';

    // super users, admins, and authors who can still write may edit or delete a post
    const canChange = (post) =>
        !!config.self.flags?.superUser ||
        project?.access_level === 'admin' ||
        (post.userId === config.self.id && canWrite());

    // UI

    const panel = new Container({ class: 'picker-project-dev-log' });
    editor.call('picker:project:registerMenu', 'dev-log', 'DEV LOG', panel, 'Dev log');

    const header = new Container({ class: 'dev-log-header' });
    panel.append(header);
    header.append(new Label({ class: 'dev-log-intro', text: 'Share progress and updates on this project.' }));
    const newButton = new Button({ class: 'dev-log-new', text: 'New post' });
    header.append(newButton);

    const list = new Container({ class: 'dev-log-list' });
    panel.append(list);

    const message = (text: string) => list.append(new Label({ class: 'dev-log-message', text }));

    // a title and markdown body, for a new post or an edit
    const buildComposer = (post, onDone: () => void) => {
        const form = new Container({ class: 'dev-log-editor' });
        // placeholders go on the native fields, so they sit inside them
        const title = new TextInput({ class: 'dev-log-title-input', value: post?.title ?? '' });
        (title.input as HTMLInputElement).maxLength = TITLE_MAX;
        title.input.placeholder = 'Title';
        form.append(title);
        const body = new TextAreaInput({
            class: 'dev-log-text-input',
            value: post?.text ?? '',
            height: 140
        });
        body.input.placeholder = 'What changed? Markdown is supported.';
        form.append(body);
        const error = new Label({ class: 'dev-log-error', hidden: true });
        form.append(error);

        const actions = new Container({ class: 'dev-log-editor-actions' });
        form.append(actions);
        const cancel = new Button({ class: 'dev-log-button', text: 'Cancel' });
        actions.append(cancel);
        const save = new Button({ class: ['dev-log-button', 'primary'], text: post ? 'Save' : 'Post' });
        actions.append(save);

        const fail = (text: string) => {
            error.text = text;
            error.hidden = false;
            save.enabled = true;
        };
        cancel.on('click', onDone);
        save.on('click', () => {
            const data = { title: title.value.trim(), text: body.value };
            if (!data.title || !data.text.trim()) {
                fail('Add a title and some text.');
                return;
            }
            save.enabled = false;
            const request = post
                ? rest().postUpdate(post.id, data)
                : rest().postCreate({ scope: { type: 'project', id: project.id }, ...data });
            request
                .on('load', () => {
                    onDone();
                    loadPosts();
                })
                .on('error', (_status, err) => fail(typeof err === 'string' ? err : 'Could not save the post'));
        });
        return form;
    };

    const closeComposer = () => {
        composer?.destroy();
        composer = null;
        newButton.hidden = !canWrite();
    };

    const buildPost = (post) => {
        const item = new Container({ class: 'dev-log-post' });
        list.append(item);

        const head = new Container({ class: 'dev-log-post-head' });
        item.append(head);
        const avatar = new Element({ dom: 'img', class: 'dev-log-avatar' });
        (avatar.dom as HTMLImageElement).src = `${config.url.api}/users/${post.userId}/thumbnail?size=32`;
        head.append(avatar);
        const info = new Container({ class: 'dev-log-post-info' });
        head.append(info);
        info.append(new Label({ class: 'dev-log-post-title', text: post.title }));
        const date = new Date(post.modifiedAt ?? post.createdAt).toLocaleDateString();
        info.append(new Label({ class: 'dev-log-post-meta', text: [post.username, date].filter(Boolean).join(' · ') }));

        const body = new Element({ class: 'dev-log-post-body' });
        body.dom.innerHTML = md.render(post.text ?? '');
        body.dom.querySelectorAll('a').forEach((a) => {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        });
        item.append(body);

        if (!canChange(post)) {
            return;
        }
        const actions = new Container({ class: 'dev-log-post-actions' });
        item.append(actions);
        const edit = new Button({ class: 'dev-log-button', text: 'Edit' });
        actions.append(edit);
        edit.on('click', () => {
            closeComposer();
            item.hidden = true;
            composer = buildComposer(post, () => {
                item.hidden = false;
                closeComposer();
            });
            list.dom.insertBefore(composer.dom, item.dom);
        });

        // a second click within a few seconds confirms
        const remove = new Button({ class: ['dev-log-button', 'delete'], text: 'Delete' });
        actions.append(remove);
        let armed = null;
        remove.on('click', () => {
            if (!armed) {
                remove.text = 'Click again to delete';
                armed = setTimeout(() => {
                    armed = null;
                    remove.text = 'Delete';
                }, DELETE_CONFIRM_MS);
                return;
            }
            clearTimeout(armed);
            remove.enabled = false;
            rest()
                .postDelete(post.id)
                .on('load', loadPosts)
                .on('error', () => {
                    remove.enabled = true;
                    remove.text = 'Delete';
                    armed = null;
                    editor.call('picker:project:buildAlert', panel, 'Could not delete the post');
                });
        });
    };

    // CONTROLLERS

    // the list leaves out post text, so each post is fetched for its body
    const loadPosts = () => {
        const id = ++load;
        closeComposer();
        list.clear();
        message('Loading posts...');
        rest()
            .postList(project.id)
            .on('load', (_status, res) => {
                const items = res.result ?? [];
                Promise.all(
                    items.map(
                        (post) =>
                            new Promise((resolve) => {
                                rest()
                                    .postGet(post.id)
                                    .on('load', (_s, full) => resolve({ ...post, text: full.text }))
                                    .on('error', () => resolve(post));
                            })
                    )
                ).then((full) => {
                    if (id !== load) {
                        return;
                    }
                    list.clear();
                    if (!full.length) {
                        message(canWrite() ? 'No posts yet. Write the first one.' : 'No posts yet.');
                    }
                    full.forEach(buildPost);
                });
            })
            .on('error', () => {
                if (id === load) {
                    list.clear();
                    message('Could not load posts.');
                }
            });
    };

    newButton.on('click', () => {
        closeComposer();
        newButton.hidden = true;
        composer = buildComposer(null, closeComposer);
        list.dom.insertBefore(composer.dom, list.dom.firstChild);
    });

    // EVENTS

    panel.on('show', () => {
        project = editor.call('picker:project:getCurrent');
        newButton.hidden = !canWrite();
        loadPosts();
    });

    panel.on('hide', () => {
        load++;
        closeComposer();
        editor.call('picker:project:hideAlerts');
    });
});
