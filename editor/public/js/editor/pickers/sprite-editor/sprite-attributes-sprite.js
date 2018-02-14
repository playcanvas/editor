editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:attributes:sprite', function (args) {
        var atlasAsset = args.atlasAsset;
        var atlasImage = args.atlasImage;
        var spriteAsset = args.spriteAsset;

        var frameKeys, frames;

        var refreshFrames = function () {
            frameKeys = spriteAsset.get('data.frameKeys').filter(function (f) {
                return atlasAsset.has('data.frames.' + f);
            });
            frames = frameKeys.map(function (f) {
                return atlasAsset.get('data.frames.' + f);
            });
        };

        refreshFrames();

        var spriteEditMode = false;
        var selectedFrames = null;

        var events = [];

        var rootPanel = editor.call('picker:sprites:editor:rightPanel');
        rootPanel.header = 'SPRITE - ' + spriteAsset.get('name');

        var fieldPreview = editor.call('picker:sprites:attributes:frames:preview', {
            atlasAsset: atlasAsset,
            atlasImage: atlasImage,
            frames: frameKeys
        });

        var panel = editor.call('attributes:addPanel', {
            parent: rootPanel
        });

        var fieldName = editor.call('attributes:addField', {
            parent: panel,
            name: 'Name',
            type: 'string',
            link: spriteAsset,
            path: 'name'
        });

        events.push(fieldName.on('change', function (value) {
            rootPanel.header = 'SPRITE - ' + value;
        }));

        var fieldPpu = editor.call('attributes:addField', {
            parent: panel,
            name: 'Pixels Per Unit',
            type: 'number',
            link: spriteAsset,
            path: 'data.pixelsPerUnit'
        });

        var panelEdit = editor.call('attributes:addPanel', {
            parent: rootPanel,
            name: 'SPRITE FRAMES'
        });
        panelEdit.flex = true;
        panelEdit.class.add('buttons');

        var btnAddFrames = new ui.Button({
            text: 'ADD FRAMES'
        });
        btnAddFrames.flexGrow = 1;
        btnAddFrames.class.add('icon', 'wide', 'create');
        panelEdit.append(btnAddFrames);

        btnAddFrames.on('click', function () {
            editor.call('picker:sprites:editor:pickFrames');
        });

        var btnAddSelected = new ui.Button({
            text: 'ADD'
        });
        btnAddSelected.class.add('icon', 'create');
        btnAddSelected.flexGrow = 1;
        btnAddSelected.hidden = true;
        panelEdit.append(btnAddSelected);

        // add selected frames to sprite asset
        btnAddSelected.on('click', function () {
            editor.call('picker:sprites:editor:pickFrames:add');
        });

        var btnCancel = new ui.Button({
            text: 'CANCEL'
        });
        btnCancel.class.add('icon', 'cancel');
        btnCancel.flexGrow = 1;
        btnCancel.hidden = true;
        panelEdit.append(btnCancel);

        btnCancel.on('click', function () {
            editor.call('picker:sprites:editor:pickFrames:cancel');
        });

        var panelFrames = editor.call('attributes:addPanel', {
            parent: panelEdit,
        });
        panelFrames.class.add('frames');

        var panels = [];

        var addFramePanel = function (key, frame, index) {
            var frameEvents = [];

            var panel = new ui.Panel();
            panel.class.add('frame');
            if (index !== undefined) {
                panels.splice(index, 0, panel);
            } else {
                panels.push(panel);
            }

            // preview
            var canvas = new ui.Canvas();
            var previewWidth = 26;
            var previewHeight = 26;
            canvas.class.add('preview');
            canvas.resize(previewWidth, previewHeight);

            panel.append(canvas);

            var ctx = canvas.element.getContext('2d');

            var renderQueued = false;

            var queueRender = function () {
                if (renderQueued) return;
                renderQueued = true;
                requestAnimationFrame(renderPreview);
            };

            var renderPreview = function () {
                ctx.clearRect(0, 0, previewWidth, previewHeight);

                if (! atlasImage) return;

                var x = frame.rect[0] * atlasImage.width;
                // convert bottom left WebGL coord to top left pixel coord
                var y = (1 - frame.rect[1] - frame.rect[3]) * atlasImage.height;
                var w = frame.rect[2] * atlasImage.width;
                var h = frame.rect[3] * atlasImage.height;

                // choose targetWidth and targetHeight keeping the aspect ratio
                var aspectRatio = w / h;
                var targetWidth = previewWidth;
                var targetHeight = previewHeight;

                if (w >= h) {
                    targetHeight = previewWidth / aspectRatio;
                } else {
                    targetWidth = targetHeight * aspectRatio;
                }

                var offsetX = (previewWidth - targetWidth) / 2;
                var offsetY = (previewHeight - targetHeight) / 2;

                ctx.drawImage(atlasImage, x, y, w, h, offsetX, offsetY, targetWidth, targetHeight);
            };

            renderPreview();

            // sprite name
            var fieldName = new ui.Label();
            fieldName.class.add('name');
            fieldName.value = frame.name;
            panel.append(fieldName);

            frameEvents.push(atlasAsset.on('data.frames.' + key + '.name:set', function (value) {
                fieldName.value = value;
            }));

            // remove frame
            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            panel.append(btnRemove);

            btnRemove.on('click', function (e) {
                e.stopPropagation();
                spriteAsset.removeValue('data.frameKeys', key);
            });

            panel.on('click', function () {
                editor.call('picker:sprites:editor:selectFrames', key, {
                    history: true,
                    clearSprite: true
                });
            });

            // clean up events
            panel.on('destroy', function () {
                for (var i = 0, len = frameEvents.length; i<len; i++) {
                    frameEvents[i].unbind();
                }
                frameEvents.length = 0;
            });

            var before = null;
            if (typeof(index) === 'number')
                before = panelFrames.innerElement.childNodes[index];

            if (before) {
                panelFrames.appendBefore(panel, before);
            } else {
                panelFrames.append(panel);
            }
        };

        for (var i = 0, len = frameKeys.length; i<len; i++) {
            addFramePanel(frameKeys[i], frames[i]);
        }

        events.push(spriteAsset.on('data.frameKeys:remove', function (value, index) {
            if (! panels[index]) return;

            panels[index].destroy();
            panels.splice(index, 1);

            refreshFrames();

            fieldPreview.setFrames(frameKeys);
        }));

        events.push(spriteAsset.on('data.frameKeys:insert', function (value, index) {
            refreshFrames();
            addFramePanel(frameKeys[index], frames[index], index);
            fieldPreview.setFrames(frameKeys);
        }));

        events.push(spriteAsset.on('data.frameKeys:set', function (value) {
            var i, len;

            for (i = 0, len = panels.length; i<len; i++) {
                panels[i].destroy();
            }
            panels.length = 0;

            refreshFrames();

            for (i = 0, len = frameKeys.length; i<len; i++) {
                addFramePanel(frameKeys[i], frames[i]);
            }

            fieldPreview.setFrames(frameKeys);
        }));

        events.push(editor.on('picker:sprites:editor:pickFrames:start', function () {
            spriteEditMode = true;
            btnAddFrames.hidden = true;
            btnAddSelected.disabled = true;
            btnAddSelected.hidden = false;
            btnCancel.hidden = false;
        }));

        events.push(editor.on('picker:sprites:editor:pickFrames:end', function () {
            spriteEditMode = false;
            btnAddFrames.hidden = false;
            btnAddSelected.hidden = true;
            btnCancel.hidden = true;

            // restore preview to the actual frames that the sprite currently has
            fieldPreview.setFrames(frameKeys);
        }));

        events.push(editor.on('picker:sprites:editor:framesSelected', function (keys) {
            if (! spriteEditMode) return;

            selectedFrames = keys;

            var len = keys ? keys.length : 0;
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
            for (var i = 0; i < events.length; i++) {
                events[i].unbind();
            }

            events.length = 0;
            panels.length = 0;
            spriteEditMode = false;
        });

    });
});
