import type { EventHandle } from '@playcanvas/observer';
import { Button, Canvas, Container, Label, Panel } from '@playcanvas/pcui';

editor.once('load', () => {
    editor.method('picker:sprites:frames', (args) => {
        const events: EventHandle[] = [];

        const atlasAsset = args.atlasAsset;

        let panels = {};
        let selectedKeys = [];
        let spriteEditModeKeys = [];
        let spriteEditMode = false;
        let selectedSprite = null;

        let shiftDown = false;
        let ctrlDown = false;

        let scrollSelectionIntoView = true;

        const leftPanel: Panel = editor.call('picker:sprites:leftPanel');

        const panelFrames = leftPanel.content;
        panelFrames.class.add('frames');

        const addFramePanel = (key, frame, afterPanel?, beforePanel?) => {
            const frameEvents = [];

            const panel = new Container({
                class: 'frame'
            });
            panel.frameKey = key;

            panels[key] = panel;

            // preview
            const canvas = new Canvas({
                class: 'preview'
            });
            const previewWidth = 26;
            const previewHeight = 26;
            canvas.resize(previewWidth, previewHeight);

            panel.append(canvas);

            let renderQueued = false;

            const renderPreview = (): void => {
                editor.call('picker:sprites:renderFramePreview', frame, canvas.dom);
                renderQueued = false;
            };

            panel.queueRender = (): void => {
                if (renderQueued) {
                    return;
                }
                renderQueued = true;
                requestAnimationFrame(renderPreview);
            };

            renderPreview();

            // sprite name
            const fieldName = new Label({
                class: 'name',
                text: frame.name
            });
            panel.append(fieldName);

            frameEvents.push(atlasAsset.on(`data.frames.${key}.name:set`, (value) => {
                fieldName.text = value;
            }));

            // remove frame
            const btnRemove = new Button({
                icon: 'E124',
                class: 'icon-button'
            });
            panel.append(btnRemove);

            btnRemove.enabled = editor.call('permissions:write');

            frameEvents.push(editor.on('permissions:writeState', (canWrite: boolean) => {
                btnRemove.enabled = canWrite;
            }));

            btnRemove.on('click', (e: MouseEvent) => {
                e.stopPropagation();
                editor.call('picker:sprites:deleteFrames', [key], {
                    history: true
                });
            });

            panel.on('click', () => {
                scrollSelectionIntoView = false;

                if (shiftDown) {
                    // if another frame was selected then add range to selection
                    const keys = spriteEditMode ? spriteEditModeKeys : selectedKeys;
                    const len = keys.length;
                    if (len) {
                        let diff = parseInt(key, 10) - parseInt(keys[len - 1], 10);
                        const dir = diff < 0 ? -1 : 1;
                        let p = panels[keys[len - 1]];
                        const range = [];
                        while (diff !== 0) {
                            p = dir > 0 ? p.dom.nextSibling : p.dom.previousSibling;
                            if (!p) {
                                break;
                            }
                            p = p.ui;

                            range.push(p.frameKey);

                            if (p.frameKey === key) {
                                break;
                            }

                            diff -= dir;
                        }

                        if (range.length) {
                            editor.call('picker:sprites:selectFrames', range, {
                                add: true,
                                history: true,
                                clearSprite: !spriteEditMode
                            });
                        }
                    } else {
                        // otherwise just select single frame
                        editor.call('picker:sprites:selectFrames', key, {
                            history: true,
                            clearSprite: !spriteEditMode
                        });
                    }
                } else if (ctrlDown) {
                    // if not selected add frame to selection
                    const keys = spriteEditMode ? spriteEditModeKeys : selectedKeys;
                    const idx = keys.indexOf(key);
                    if (idx === -1) {
                        editor.call('picker:sprites:selectFrames', key, {
                            add: true,
                            history: true,
                            clearSprite: !spriteEditMode
                        });
                    } else {
                        // if selected remove from selection
                        keys.splice(idx, 1);
                        editor.call('picker:sprites:selectFrames', keys, {
                            history: true,
                            clearSprite: !spriteEditMode
                        });
                    }

                } else {
                    // select single frame
                    editor.call('picker:sprites:selectFrames', key, {
                        history: true,
                        clearSprite: !spriteEditMode
                    });
                }

                scrollSelectionIntoView = true;
            });

            const onMouseEnter = (): void => {
                editor.call('picker:sprites:hoverFrame', key);
            };

            const onMouseLeave = (): void => {
                editor.call('picker:sprites:hoverFrame', null);
            };

            panel.dom.addEventListener('mouseenter', onMouseEnter);
            panel.dom.addEventListener('mouseleave', onMouseLeave);

            // clean up events
            panel.once('destroy', (dom) => {
                frameEvents.forEach(event => event.unbind());
                frameEvents.length = 0;

                dom.removeEventListener('mouseenter', onMouseEnter);
                dom.removeEventListener('mouseleave', onMouseLeave);
            });

            if (afterPanel) {
                panelFrames.appendAfter(panel, afterPanel);
            } else if (beforePanel) {
                panelFrames.appendBefore(panel, beforePanel);
            } else {
                panelFrames.append(panel);
            }
        };

        // create frames
        const frames = atlasAsset.getRaw('data.frames')._data;
        for (const key in frames) {
            addFramePanel(key, frames[key]._data);
        }

        // keydown
        const onKeyDown = (e: KeyboardEvent): void => {
            ctrlDown = e.ctrlKey || e.metaKey;
            shiftDown = e.shiftKey;
        };
        window.addEventListener('keydown', onKeyDown);

        // keyup
        const onKeyUp = (e: KeyboardEvent): void => {
            ctrlDown = e.ctrlKey || e.metaKey;
            shiftDown = e.shiftKey;
        };
        window.addEventListener('keyup', onKeyUp);

        // listen to atlas set event
        events.push(atlasAsset.on('*:set', (path: string, value) => {
            if (!path.startsWith('data.frames')) {
                return;
            }

            const parts = path.split('.');
            if (parts.length === 2) {
                // if all frames are set then re-create all frame panels
                panelFrames.clear();
                panels = {};

                const raw = atlasAsset.getRaw('data.frames')._data;

                for (const key in value) {
                    addFramePanel(key, raw[key]._data);
                }
            } else if (parts.length === 3) {
                // if a frame was set and it doesn't exist create it
                const key = parts[2];
                if (key) {
                    if (!panels[key]) {
                        let panelBefore = null;
                        let panelAfter = null;

                        const search = parseInt(key, 10);
                        for (const k in panels) {
                            if (search < parseInt(k, 10)) {
                                panelBefore = panels[k];
                                break;
                            } else {
                                panelAfter = panels[k];
                            }
                        }


                        const raw = atlasAsset.getRaw('data.frames')._data;
                        addFramePanel(key, raw[key]._data, panelAfter, panelBefore);
                    }
                }
            } else {
                // if a field changed then re-render the preview for that frame
                const key = parts[2];
                if (panels[key]) {
                    panels[key].queueRender();
                }
            }
        }));

        // listen to atlas unset event
        const checkUnsetPath = /^data\.frames\.(\d+)$/;
        events.push(atlasAsset.on('*:unset', (path: string) => {
            const match = path.match(checkUnsetPath);
            if (!match) {
                return;
            }

            const key = match[1];
            if (panels[key]) {
                panels[key].destroy();
                delete panels[key];
            }
        }));

        // Listen to framesSelected event to highlight panels
        events.push(editor.on('picker:sprites:framesSelected', (keys) => {
            const index = {};
            let key;

            if (spriteEditMode) {
                // unhighlight old keys
                const highlighted = panelFrames.innerElement.querySelectorAll('.frame.highlighted');
                for (let i = 0, len = highlighted.length; i < len; i++) {
                    if (!keys || keys.indexOf(highlighted[i].ui.frameKey) === -1) {
                        highlighted[i].ui.class.remove('highlighted');
                    }
                }

                if (keys) {
                    spriteEditModeKeys = keys.slice();
                } else {
                    spriteEditModeKeys.length = 0;
                }

            } else {
                const selected = panelFrames.innerElement.querySelectorAll('.frame.selected');
                for (let i = 0, len = selected.length; i < len; i++) {
                    if (!keys || keys.indexOf(selected[i].ui.frameKey) === -1) {
                        selected[i].ui.class.remove('selected');
                        selected[i].ui.class.remove('sprite-frame');
                    }
                }

                if (keys) {
                    selectedKeys = keys.slice();
                } else {
                    selectedKeys.length = 0;
                }
            }

            // select new keys
            if (keys && keys.length) {
                for (let i = 0, len = keys.length; i < len; i++) {
                    key = keys[i];
                    index[key] = true;

                    if (!panels[key]) {
                        continue;
                    }

                    if (scrollSelectionIntoView) {
                        let scroll = false;
                        if (i === 0) {
                            scroll = spriteEditMode ? !panels[key].class.contains('highlighted') : !panels[key].class.contains('selected');
                            if (scroll) {
                                panelFrames.innerElement.scrollTop = panels[key].dom.offsetTop;
                            }
                        }
                    }

                    panels[key].class.add(spriteEditMode ? 'highlighted' : 'selected');
                    if (selectedSprite && (keys === selectedKeys || selectedKeys.indexOf(key) !== -1)) {
                        panels[key].class.add('sprite-frame');
                    }
                }
            }
        }));

        events.push(editor.on('picker:sprites:pickFrames:start', () => {
            spriteEditMode = true;
        }));

        events.push(editor.on('picker:sprites:pickFrames:end', () => {
            spriteEditMode = false;

            for (const key of spriteEditModeKeys) {
                if (panels[key]) {
                    panels[key].class.remove('highlighted');
                }
            }

            spriteEditModeKeys.length = 0;
        }));

        events.push(editor.on('picker:sprites:spriteSelected', (spriteAsset) => {
            selectedSprite = spriteAsset;
            const keys = spriteEditMode ? spriteEditModeKeys : selectedKeys;
            for (const key of keys) {
                const panel = panels[key];
                if (!panel) {
                    continue;
                }

                if (selectedSprite) {
                    panel.class.add('sprite-frame');
                } else {
                    panel.class.remove('sprite-frame');
                }
            }
        }));

        // clean up
        events.push(leftPanel.on('clear', () => {
            events.forEach(event => event.unbind());
            events.length = 0;

            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);

            panelFrames.clear();
            panels = {};

            selectedKeys.length = 0;
            spriteEditModeKeys.length = 0;
        }));
    });
});
