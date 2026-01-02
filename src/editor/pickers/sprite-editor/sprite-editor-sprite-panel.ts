import type { EventHandle } from '@playcanvas/observer';
import { Button, Canvas, Container, Label, Panel, type TextInput } from '@playcanvas/pcui';

import type { Attribute } from '@/editor/inspector/attribute.type.d';
import { AttributesInspector } from '@/editor/inspector/attributes-inspector';

import { SpritePreviewContainer } from './sprite-editor-preview-panel';

const SPRITE_ATTRIBUTES: Attribute[] = [
    {
        label: 'ID',
        path: 'id',
        type: 'label',
        reference: 'asset:id'
    },
    {
        label: 'Name',
        alias: 'name',
        type: 'string',
        reference: 'asset:name'
    },
    {
        label: 'Pixels Per Unit',
        path: 'data.pixelsPerUnit',
        type: 'number',
        reference: 'asset:sprite:pixelsPerUnit',
        args: {
            min: 0
        }
    },
    {
        label: 'Render Mode',
        path: 'data.renderMode',
        type: 'select',
        reference: 'asset:sprite:renderMode',
        args: {
            type: 'number',
            options: [
                { v: 0, t: 'Simple' },
                { v: 1, t: 'Sliced' },
                { v: 2, t: 'Tiled' }
            ]
        }
    }
];

editor.once('load', () => {
    editor.method('picker:sprites:attributes:sprite', (args) => {
        const atlasAsset = args.atlasAsset;
        const atlasImage = args.atlasImage;
        const spriteAsset = args.spriteAsset;

        let frameKeys = spriteAsset.get('data.frameKeys');

        let spriteEditMode = false;

        const events: EventHandle[] = [];

        const rootPanel: Panel = editor.call('picker:sprites:rightPanel');
        const rootPanelContent: Container = editor.call('picker:sprites:rightPanelContent');
        rootPanel.headerText = `SPRITE ASSET - ${spriteAsset.get('name')}`;

        // Create preview and prepend to panel (before scrollable content)
        const preview = new SpritePreviewContainer({
            atlasAsset,
            frames: frameKeys
        });
        preview.resizeTarget = rootPanel;
        rootPanel.prepend(preview);

        const inspector = new AttributesInspector({
            history: editor.api.globals.history,
            attributes: SPRITE_ATTRIBUTES
        });
        rootPanelContent.append(inspector);
        inspector.link([spriteAsset]);

        inspector.enabled = editor.call('permissions:write');
        events.push(editor.on('permissions:writeState', (canWrite: boolean) => {
            inspector.enabled = canWrite;
        }));

        // Custom handling for Name field (rename asset)
        let suspendRenameEvt = false;
        const fieldName = inspector.getField('name') as TextInput;
        fieldName.value = spriteAsset.get('name');

        events.push(fieldName.on('change', (value: string) => {
            rootPanel.headerText = `SPRITE ASSET - ${value}`;
            if (value !== spriteAsset.get('name') && !suspendRenameEvt) {
                suspendRenameEvt = true;
                editor.call('assets:rename', spriteAsset, value);
                suspendRenameEvt = false;
            }
        }));

        events.push(spriteAsset.on('name:set', (value: string) => {
            suspendRenameEvt = true;
            fieldName.value = value;
            suspendRenameEvt = false;
        }));

        const panelEdit = new Panel({
            headerText: 'FRAMES IN SPRITE ASSET',
            class: 'buttons'
        });
        rootPanelContent.append(panelEdit);

        panelEdit.enabled = editor.call('permissions:write');
        events.push(editor.on('permissions:writeState', (canWrite: boolean) => {
            panelEdit.enabled = canWrite;
        }));

        // add frames tooltip
        const panelAddFramesInfo = new Panel({
            headerText: 'Adding more frames to a sprite',
            class: 'add-frames-info',
            hidden: true
        });
        panelEdit.append(panelAddFramesInfo);

        const labelInfo = new Label({
            text: 'To add more frames to a sprite asset, select the frames you wish to add either on the texture atlas viewport or from the panel on the left, then click ADD SELECTED FRAMES.'
        });
        panelAddFramesInfo.append(labelInfo);

        const btnAddFrames = new Button({
            text: 'ADD FRAMES TO SPRITE ASSET',
            icon: 'E120',
            class: 'wide'
        });
        btnAddFrames.style.flexGrow = '1';
        panelEdit.append(btnAddFrames);

        btnAddFrames.on('click', () => {
            editor.call('picker:sprites:pickFrames');
        });

        const containerEditButtons = new Container({
            flex: true,
            flexDirection: 'row',
            hidden: true,
            class: 'edit-buttons'
        });
        panelEdit.append(containerEditButtons);

        const btnAddSelected = new Button({
            text: 'ADD SELECTED FRAMES',
            icon: 'E120',
            class: 'wide'
        });
        btnAddSelected.style.flexGrow = '3';
        containerEditButtons.append(btnAddSelected);

        // add selected frames to sprite asset
        btnAddSelected.on('click', () => {
            editor.call('picker:sprites:pickFrames:add');
        });

        const btnCancel = new Button({
            text: 'DONE',
            icon: 'E133',
            class: 'wide'
        });
        btnCancel.style.flexGrow = '1';
        containerEditButtons.append(btnCancel);

        btnCancel.on('click', () => {
            editor.call('picker:sprites:pickFrames:cancel');
        });

        const panelFrames = new Container({
            class: 'frames'
        });
        panelEdit.append(panelFrames);

        let draggedPanel = null;
        let draggedIndex = null;

        const panels = [];

        const addFramePanel = (key: string, index?: number): void => {
            const frameEvents = [];

            const panel = new Container({
                class: 'frame'
            }) as Container & { _frameKey: string; queueRender: () => void };
            panel._frameKey = key;
            if (index !== undefined) {
                panels.splice(index, 0, panel);
            } else {
                panels.push(panel);
            }

            // drag handle
            const handle = document.createElement('div');
            handle.classList.add('handle');
            panel.append(handle);


            const onDragStart = (evt: MouseEvent): void => {
                if (!editor.call('permissions:write')) {
                    return;
                }

                draggedPanel = panel;
                draggedIndex = panels.indexOf(panel);

                panel.class.add('dragged');

                window.addEventListener('mouseup', onDragEnd);
                panelFrames.innerElement.addEventListener('mousemove', onDragMove);
            };

            handle.addEventListener('mousedown', onDragStart);

            // preview
            const canvas = new Canvas({
                class: 'preview'
            });
            const previewWidth = 26;
            const previewHeight = 26;
            canvas.resize(previewWidth, previewHeight);

            panel.append(canvas);

            const ctx = (canvas.dom as HTMLCanvasElement).getContext('2d');

            let renderQueued = false;

            panel.queueRender = (): void => {
                if (renderQueued) {
                    return;
                }
                renderQueued = true;
                requestAnimationFrame(renderPreview);
            };

            const renderPreview = (): void => {
                renderQueued = false;

                ctx.clearRect(0, 0, previewWidth, previewHeight);

                if (!atlasImage) {
                    return;
                }

                let frame = atlasAsset.getRaw(`data.frames.${key}`);
                if (!frame) {
                    return;
                }
                frame = frame._data;

                const x = frame.rect[0];
                // convert bottom left WebGL coord to top left pixel coord
                const y = atlasImage.height - frame.rect[1] - frame.rect[3];
                const w = frame.rect[2];
                const h = frame.rect[3];

                // choose targetWidth and targetHeight keeping the aspect ratio
                const aspectRatio = w / h;
                let targetWidth = previewWidth;
                let targetHeight = previewHeight;

                if (w >= h) {
                    targetHeight = previewWidth / aspectRatio;
                } else {
                    targetWidth = targetHeight * aspectRatio;
                }

                const offsetX = (previewWidth - targetWidth) / 2;
                const offsetY = (previewHeight - targetHeight) / 2;

                ctx.drawImage(atlasImage, x, y, w, h, offsetX, offsetY, targetWidth, targetHeight);
            };

            renderPreview();

            // sprite name
            const fieldName = new Label({
                class: 'name',
                text: atlasAsset.get(`data.frames.${key}.name`) || 'Missing'
            });
            panel.append(fieldName);

            frameEvents.push(atlasAsset.on(`data.frames.${key}.name:set`, (value) => {
                fieldName.value = value;
            }));

            frameEvents.push(atlasAsset.on(`data.frames.${key}:unset`, () => {
                fieldName.value = 'Missing';
                panel.queueRender();
            }));

            // remove frame
            const btnRemove = new Button({
                icon: 'E124',
                class: 'icon-button'
            });
            panel.append(btnRemove);

            btnRemove.on('click', (e: MouseEvent) => {
                e.stopPropagation();

                const idx = panels.indexOf(panel);
                if (idx !== -1) {
                    spriteAsset.remove('data.frameKeys', idx);
                }
            });

            panel.on('click', () => {
                // do not select missing frames
                if (!atlasAsset.has(`data.frames.${key}`)) {
                    return;
                }

                // select frame
                editor.call('picker:sprites:selectFrames', key, {
                    history: true,
                    clearSprite: true
                });
            });

            // clean up events
            panel.once('destroy', () => {
                frameEvents.forEach(event => event.unbind());
                frameEvents.length = 0;

                handle.removeEventListener('mousedown', onDragStart);
                if (draggedPanel === panel) {
                    draggedPanel = null;
                    draggedIndex = null;
                    panelFrames.innerElement.removeEventListener('mousemove', onDragMove);
                    window.removeEventListener('mouseup', onDragEnd);
                }
            });

            let before = null;
            if (typeof index === 'number') {
                before = panelFrames.innerElement.childNodes[index];
            }

            if (before) {
                panelFrames.appendBefore(panel, before);
            } else {
                panelFrames.append(panel);
            }
        };

        const onDragMove = (evt: MouseEvent): void => {
            const rect = panelFrames.innerElement.getBoundingClientRect();
            const height = draggedPanel.element.offsetHeight;
            const top = evt.clientY - rect.top - 6;
            const overPanelIndex = Math.floor(top / height);
            const overPanel = panels[overPanelIndex];

            if (overPanel && overPanel !== draggedPanel) {
                const currentIndex = panels.indexOf(draggedPanel);

                panelFrames.remove(draggedPanel);
                panelFrames.appendBefore(draggedPanel, panelFrames.innerElement.childNodes[overPanelIndex]);

                // Update panels array to match DOM order
                panels.splice(currentIndex, 1);
                panels.splice(overPanelIndex, 0, draggedPanel);
            }
        };

        const onDragEnd = (): void => {
            if (!draggedPanel) {
                return;
            }

            const oldIndex = draggedIndex;
            const newIndex = Array.prototype.indexOf.call(panelFrames.innerElement.childNodes, draggedPanel.element);

            // change order in sprite asset
            if (oldIndex !== newIndex) {
                spriteAsset.move('data.frameKeys', oldIndex, newIndex);
            }

            draggedPanel.class.remove('dragged');
            draggedPanel = null;
            draggedIndex = null;

            panelFrames.innerElement.removeEventListener('mousemove', onDragMove);
            window.removeEventListener('mouseup', onDragEnd);
        };

        for (let i = 0, len = frameKeys.length; i < len; i++) {
            addFramePanel(frameKeys[i]);
        }

        events.push(spriteAsset.on('data.frameKeys:remove', (value, index) => {
            if (!panels[index]) {
                return;
            }

            panels[index].destroy();
            panels.splice(index, 1);

            frameKeys = spriteAsset.get('data.frameKeys');

            preview.setFrames(frameKeys);
        }));

        events.push(spriteAsset.on('data.frameKeys:insert', (value, index) => {
            frameKeys = spriteAsset.get('data.frameKeys');
            addFramePanel(frameKeys[index], index);
            preview.setFrames(frameKeys);
        }));

        events.push(spriteAsset.on('data.frameKeys:move', (value, indNew, indOld) => {
            // update the draggedIndex if another user dragged the same frame we're dragging
            if (indOld === draggedIndex) {
                draggedIndex = indNew;
            }

            if (draggedIndex === indNew) {
                return;
            }

            const movedPanel = panels[indOld];
            if (movedPanel && movedPanel._frameKey === value) {
                panelFrames.remove(movedPanel);
                panelFrames.appendBefore(movedPanel, panelFrames.innerElement.childNodes[indNew]);

                panels.splice(indOld, 1);
                panels.splice(indNew, 0, movedPanel);
            }

            frameKeys = spriteAsset.get('data.frameKeys');
            preview.setFrames(frameKeys);
        }));

        events.push(spriteAsset.on('data.frameKeys:set', (value) => {
            panels.forEach(panel => panel.destroy());
            panels.length = 0;

            frameKeys = spriteAsset.get('data.frameKeys');
            frameKeys.forEach(key => addFramePanel(key));

            preview.setFrames(frameKeys);
        }));

        events.push(atlasAsset.on('*:set', (path: string) => {
            if (!path.startsWith('data.frames')) {
                return;
            }

            const parts = path.split('.');
            const partsLen = parts.length;
            if (partsLen >= 3) {
                // re-render frame preview
                for (let i = 0, len = panels.length; i < len; i++) {
                    if (panels[i]._frameKey === parts[2]) {
                        panels[i].queueRender();

                        // if this frame was added back to the atlas
                        // then re-render preview
                        if (partsLen === 3) {
                            preview.setFrames(frameKeys);
                        }

                        break;
                    }
                }
            }
        }));

        events.push(editor.on('picker:sprites:pickFrames:start', () => {
            spriteEditMode = true;
            btnAddFrames.hidden = true;
            btnAddSelected.enabled = false;
            containerEditButtons.hidden = false;
            panelAddFramesInfo.hidden = false;
        }));

        events.push(editor.on('picker:sprites:pickFrames:end', () => {
            spriteEditMode = false;
            btnAddFrames.hidden = false;
            containerEditButtons.hidden = true;
            panelAddFramesInfo.hidden = true;

            // restore preview to the actual frames that the sprite currently has
            preview.setFrames(frameKeys);
        }));

        events.push(editor.on('picker:sprites:framesSelected', (keys) => {
            if (!spriteEditMode) {
                return;
            }

            const hasKeys = keys?.length > 0;
            btnAddSelected.enabled = hasKeys;

            // update preview to show what sprite would look like after
            // the selected keys were added
            if (hasKeys) {
                preview.setFrames(frameKeys.slice().concat(keys));
            }
        }));

        events.push(rootPanel.on('clear', () => {
            preview.destroy();
            inspector.unlink();
            inspector.destroy();
            panelEdit.destroy();
        }));

        inspector.once('destroy', () => {
            events.forEach(event => event.unbind());
            events.length = 0;

            panels.length = 0;
            spriteEditMode = false;
        });

    });
});
