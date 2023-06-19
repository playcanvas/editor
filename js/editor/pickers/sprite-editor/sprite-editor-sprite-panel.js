editor.once('load', function () {
    editor.method('picker:sprites:attributes:sprite', function (args) {
        const atlasAsset = args.atlasAsset;
        const atlasImage = args.atlasImage;
        const spriteAsset = args.spriteAsset;

        let frameKeys = spriteAsset.get('data.frameKeys');

        let spriteEditMode = false;
        let selectedFrames = null; // eslint-disable-line no-unused-vars

        const events = [];

        /** @type {import('@playcanvas/pcui').Panel} */
        const rootPanel = editor.call('picker:sprites:rightPanel');
        rootPanel.headerText = 'SPRITE ASSET - ' + spriteAsset.get('name');

        const fieldPreview = editor.call('picker:sprites:attributes:frames:preview', {
            atlasAsset: atlasAsset,
            atlasImage: atlasImage,
            frames: frameKeys
        });

        const panel = editor.call('attributes:addPanel', {
            parent: rootPanel
        });
        panel.disabled = !editor.call('permissions:write');
        events.push(editor.on('permissions:writeState', function (canWrite) {
            panel.disabled = !canWrite;
        }));

        const fieldId = editor.call('attributes:addField', {
            parent: panel,
            name: 'ID',
            link: spriteAsset,
            path: 'id'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:id', fieldId.parent.innerElement.firstChild.ui, null, panel);

        let suspendRenameEvt = false;

        const fieldName = editor.call('attributes:addField', {
            parent: panel,
            name: 'Name',
            type: 'string',
            value: spriteAsset.get('name')
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:name', fieldName.parent.innerElement.firstChild.ui, null, panel);

        events.push(fieldName.on('change', function (value) {
            rootPanel.headerText = 'SPRITE ASSET - ' + value;
            if (value !== spriteAsset.get('name') && !suspendRenameEvt) {
                suspendRenameEvt = true;
                editor.call('assets:rename', spriteAsset, value);
                suspendRenameEvt = false;
            }
        }));

        events.push(spriteAsset.on('name:set', function (value) {
            suspendRenameEvt = true;
            fieldName.value = value;
            suspendRenameEvt = false;
        }));

        const fieldPpu = editor.call('attributes:addField', {
            parent: panel,
            name: 'Pixels Per Unit',
            type: 'number',
            link: spriteAsset,
            min: 0,
            path: 'data.pixelsPerUnit'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:sprite:pixelsPerUnit', fieldPpu.parent.innerElement.firstChild.ui, null, panel);

        const fieldRenderMode = editor.call('attributes:addField', {
            parent: panel,
            name: 'Render Mode',
            type: 'number',
            enum: [
                { v: 0, t: 'Simple' },
                { v: 1, t: 'Sliced' },
                { v: 2, t: 'Tiled' }
            ],
            link: spriteAsset,
            path: 'data.renderMode'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:sprite:renderMode', fieldRenderMode.parent.innerElement.firstChild.ui, null, panel);

        const panelEdit = editor.call('attributes:addPanel', {
            parent: rootPanel,
            name: 'FRAMES IN SPRITE ASSET'
        });
        panelEdit.flex = true;
        panelEdit.class.add('buttons');

        panelEdit.disabled = !editor.call('permissions:write');
        events.push(editor.on('permissions:writeState', function (canWrite) {
            panelEdit.disabled = !canWrite;
        }));

        // add frames tooltip
        const panelAddFramesInfo = new ui.Panel('Adding more frames to a sprite');
        panelAddFramesInfo.class.add('add-frames-info');
        panelAddFramesInfo.hidden = true;
        panelEdit.append(panelAddFramesInfo);

        const labelInfo = new ui.Label({
            text: 'To add more frames to a sprite asset, select the frames you wish to add either on the texture atlas viewport or from the panel on the left, then click ADD SELECTED FRAMES.'
        });
        panelAddFramesInfo.append(labelInfo);

        const btnAddFrames = new ui.Button({
            text: 'ADD FRAMES TO SPRITE ASSET'
        });
        btnAddFrames.flexGrow = 1;
        btnAddFrames.class.add('icon', 'wide', 'create');
        panelEdit.append(btnAddFrames);


        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:sprites:addFrames', btnAddFrames, null, panel);

        btnAddFrames.on('click', function () {
            editor.call('picker:sprites:pickFrames');
        });

        const btnAddSelected = new ui.Button({
            text: 'ADD SELECTED FRAMES'
        });
        btnAddSelected.class.add('icon', 'create');
        btnAddSelected.flexGrow = 3;
        btnAddSelected.hidden = true;
        panelEdit.append(btnAddSelected);

        // add selected frames to sprite asset
        btnAddSelected.on('click', function () {
            editor.call('picker:sprites:pickFrames:add');
        });

        const btnCancel = new ui.Button({
            text: 'DONE'
        });
        btnCancel.class.add('icon', 'done');
        btnCancel.flexGrow = 1;
        btnCancel.hidden = true;
        panelEdit.append(btnCancel);

        btnCancel.on('click', function () {
            editor.call('picker:sprites:pickFrames:cancel');
        });

        const panelFrames = editor.call('attributes:addPanel', {
            parent: panelEdit
        });
        panelFrames.class.add('frames');

        let draggedPanel = null;
        let draggedIndex = null;

        const panels = [];

        const addFramePanel = function (key, index) {
            const frameEvents = [];

            const panel = new ui.Panel();
            panel.class.add('frame');
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


            const onDragStart = function (evt) {
                if (!editor.call('permissions:write')) return;

                draggedPanel = panel;
                draggedIndex = panels.indexOf(panel);

                panel.class.add('dragged');

                window.addEventListener('mouseup', onDragEnd);
                panelFrames.innerElement.addEventListener('mousemove', onDragMove);
            };

            handle.addEventListener('mousedown', onDragStart);

            // preview
            const canvas = new ui.Canvas();
            const previewWidth = 26;
            const previewHeight = 26;
            canvas.class.add('preview');
            canvas.resize(previewWidth, previewHeight);

            panel.append(canvas);

            const ctx = canvas.element.getContext('2d');

            let renderQueued = false;

            panel.queueRender = function () {
                if (renderQueued) return;
                renderQueued = true;
                requestAnimationFrame(renderPreview);
            };

            const renderPreview = function () {
                renderQueued = false;

                ctx.clearRect(0, 0, previewWidth, previewHeight);

                if (!atlasImage) return;

                let frame = atlasAsset.getRaw('data.frames.' + key);
                if (!frame) return;
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
            const fieldName = new ui.Label();
            fieldName.class.add('name');
            fieldName.value = atlasAsset.get('data.frames.' + key + '.name') || 'Missing';
            panel.append(fieldName);

            frameEvents.push(atlasAsset.on('data.frames.' + key + '.name:set', function (value) {
                fieldName.value = value;
            }));

            frameEvents.push(atlasAsset.on('data.frames.' + key + ':unset', function () {
                fieldName.value = 'Missing';
                panel.queueRender();
            }));

            // remove frame
            const btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            panel.append(btnRemove);

            btnRemove.on('click', function (e) {
                e.stopPropagation();

                const idx = panels.indexOf(panel);
                if (idx !== -1) {
                    spriteAsset.remove('data.frameKeys', idx);
                }
            });

            panel.on('click', function () {
                // do not select missing frames
                if (!atlasAsset.has('data.frames.' + key)) return;

                // select frame
                editor.call('picker:sprites:selectFrames', key, {
                    history: true,
                    clearSprite: true
                });
            });

            // clean up events
            panel.on('destroy', function () {
                for (let i = 0, len = frameEvents.length; i < len; i++) {
                    frameEvents[i].unbind();
                }
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
            if (typeof index === 'number')
                before = panelFrames.innerElement.childNodes[index];

            if (before) {
                panelFrames.appendBefore(panel, before);
            } else {
                panelFrames.append(panel);
            }
        };

        const onDragMove = function (evt) {
            const rect = panelFrames.innerElement.getBoundingClientRect();
            const height = draggedPanel.element.offsetHeight;
            const top = evt.clientY - rect.top - 6;
            const overPanelIndex = Math.floor(top / height);
            const overPanel = panels[overPanelIndex];// panelFrames.innerElement.childNodes[overPanelIndex];

            if (overPanel && overPanel !== draggedPanel) {
                panelFrames.remove(draggedPanel);
                panelFrames.appendBefore(draggedPanel, panelFrames.innerElement.childNodes[overPanelIndex]);

                panels.splice(overPanelIndex, 0, draggedPanel);
            }
        };

        const onDragEnd = function () {
            if (!draggedPanel) return;

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

        events.push(spriteAsset.on('data.frameKeys:remove', function (value, index) {
            if (!panels[index]) return;

            panels[index].destroy();
            panels.splice(index, 1);

            frameKeys = spriteAsset.get('data.frameKeys');

            fieldPreview.setFrames(frameKeys);
        }));

        events.push(spriteAsset.on('data.frameKeys:insert', function (value, index) {
            frameKeys = spriteAsset.get('data.frameKeys');
            addFramePanel(frameKeys[index], index);
            fieldPreview.setFrames(frameKeys);
        }));

        events.push(spriteAsset.on('data.frameKeys:move', function (value, indNew, indOld) {
            // update the draggedIndex if another user dragged the same frame we're dragging
            if (indOld === draggedIndex) {
                draggedIndex = indNew;
            }

            if (draggedIndex === indNew) return;

            const movedPanel = panels[indOld];
            if (movedPanel && movedPanel._frameKey === value) {
                panelFrames.remove(movedPanel);
                panelFrames.appendBefore(movedPanel, panelFrames.innerElement.childNodes[indNew]);

                panels.splice(indOld, 1);
                panels.splice(indNew, 0, movedPanel);
            }

            frameKeys = spriteAsset.get('data.frameKeys');
            fieldPreview.setFrames(frameKeys);
        }));

        events.push(spriteAsset.on('data.frameKeys:set', function (value) {
            let i, len;

            for (i = 0, len = panels.length; i < len; i++) {
                panels[i].destroy();
            }
            panels.length = 0;

            frameKeys = spriteAsset.get('data.frameKeys');
            for (i = 0, len = frameKeys.length; i < len; i++) {
                addFramePanel(frameKeys[i]);
            }

            fieldPreview.setFrames(frameKeys);
        }));

        events.push(atlasAsset.on('*:set', function (path) {
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
                            fieldPreview.setFrames(frameKeys);
                        }

                        break;
                    }
                }
            }
        }));

        events.push(editor.on('picker:sprites:pickFrames:start', function () {
            spriteEditMode = true;
            btnAddFrames.hidden = true;
            btnAddSelected.disabled = true;
            btnAddSelected.hidden = false;
            btnCancel.hidden = false;
            panelAddFramesInfo.hidden = false;
        }));

        events.push(editor.on('picker:sprites:pickFrames:end', function () {
            spriteEditMode = false;
            btnAddFrames.hidden = false;
            btnAddSelected.hidden = true;
            btnCancel.hidden = true;
            panelAddFramesInfo.hidden = true;

            // restore preview to the actual frames that the sprite currently has
            fieldPreview.setFrames(frameKeys);
        }));

        events.push(editor.on('picker:sprites:framesSelected', function (keys) {
            if (!spriteEditMode) return;

            selectedFrames = keys;

            const len = keys ? keys.length : 0;
            btnAddSelected.disabled = !len;

            // update preview to show what sprite would look like after
            // the selected keys were added
            if (len) {
                fieldPreview.setFrames(frameKeys.slice().concat(keys));
            }
        }));

        events.push(rootPanel.on('clear', function () {
            panel.destroy();
            panelEdit.destroy();
        }));

        panel.on('destroy', function () {
            for (let i = 0; i < events.length; i++) {
                events[i].unbind();
            }

            events.length = 0;
            panels.length = 0;
            spriteEditMode = false;
        });

    });
});
