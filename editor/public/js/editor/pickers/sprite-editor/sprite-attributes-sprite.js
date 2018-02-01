editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:attributes:sprite', function (args) {
        var atlasAsset = args.atlasAsset;
        var atlasImage = args.atlasImage;
        var spriteAsset = args.spriteAsset;
        var frameKeys = spriteAsset.get('data.frameKeys');
        var frames = frameKeys.map(function (f) {
            return atlasAsset.get('data.frames.' + f);
        });

        var pickingFrames = false;

        var events = [];

        var rootPanel = editor.call('picker:sprites:editor:rightPanel');
        rootPanel.header = 'SPRITE - ' + spriteAsset.get('name');

        editor.call('picker:sprites:attributes:frames:preview', {
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

        var btnAddSprites = new ui.Button({
            text: 'ADD SPRITES'
        });
        btnAddSprites.flexGrow = 1;
        btnAddSprites.class.add('icon', 'wide', 'create');
        panelEdit.append(btnAddSprites);

        btnAddSprites.on('click', function () {
            if (! pickingFrames) {
                editor.call('picker:sprites:editor:pickFrames');
            } else {
                // TODO
            }
        });

        var btnAddSelected = new ui.Button({
            text: 'ADD'
        });
        btnAddSelected.class.add('icon', 'create');
        btnAddSelected.flexGrow = 1;
        btnAddSelected.hidden = true;
        panelEdit.append(btnAddSelected);

        btnAddSelected.on('click', function () {

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

        var panels = {};

        var addFramePanel = function (key, frame, index) {
            var frameEvents = [];

            var panel = new ui.Panel();
            panel.class.add('frame');
            panels[key] = panel;

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

        events.push(spriteAsset.on('*:remove', function (path, value, index) {
            if (! panels[value]) return;
            panels[value].destroy();
            delete panels[value];
        }));

        events.push(spriteAsset.on('*:insert', function (path, value, index) {
            if (panels[value]) return;

            frameKeys = spriteAsset.get('data.frameKeys');
            frames = frameKeys.map(function (f) {
                return atlasAsset.get('data.frames.' + f);
            });

            addFramePanel(frameKeys[index], frames[index], index);
        }));

        events.push(editor.on('picker:sprites:editor:pickFrames:start', function () {
            btnAddSprites.hidden = true;
            btnAddSelected.disabled = true;
            btnAddSelected.hidden = false;
            btnCancel.hidden = false;
        }));

        events.push(editor.on('picker:sprites:editor:pickFrames:end', function () {
            btnAddSprites.hidden = false;
            btnAddSelected.hidden = true;
            btnCancel.hidden = true;
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
            panels = {};
            pickingFrames = false;
        });

    });
});
