editor.once('load', function () {
    'use strict';

    editor.method('picker:sprites:attributes:importFrames', function (args) {
        var events = [];
        var atlasAsset = args.atlasAsset;

        var rootPanel = editor.call('picker:sprites:rightPanel');

        var panel = editor.call('attributes:addPanel', {
            parent: rootPanel,
            name: 'IMPORT FRAME DATA'
        });
        panel.class.add('component');

        panel.disabled = ! editor.call('permissions:write');

        events.push(editor.on('permissions:writeState', function (canWrite) {
            panel.disabled = ! canWrite;
        }));

        var panelError = new ui.Panel('Invalid JSON file');
        panelError.class.add('import-error');
        panel.append(panelError);
        panelError.flex = true;
        panelError.hidden = true;

        var labelError = new ui.Label({
            text: 'Please upload a valid JSON file that has been created with the Texture Packer application.'
        });
        labelError.flexGrow = 1;
        labelError.renderChanges = false;
        panelError.append(labelError);

        var btnCloseError = new ui.Button({
            text: '&#57650;'
        });
        btnCloseError.class.add('close');
        panelError.headerElement.appendChild(btnCloseError.element);

        btnCloseError.on('click', function () {
            panelError.hidden = true;
        });

        var panelButtons = new ui.Panel();
        panelButtons.flex = true;
        panel.append(panelButtons);

        var hiddenInput = document.createElement('input');
        hiddenInput.type = 'file';
        hiddenInput.accept = '.json';
        hiddenInput.style.display = 'none';
        panel.innerElement.appendChild(hiddenInput);

        var btnImport = new ui.Button({
            text: 'UPLOAD TEXTURE PACKER JSON'
        });
        btnImport.flexGrow = 1;
        btnImport.class.add('icon', 'upload');
        panelButtons.append(btnImport);

        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:import:texturepacker', btnImport, null, panel);

        btnImport.on('click', function () {
            panelError.hidden = true;

            var hasFrames = false;
            var currentFrames = atlasAsset.getRaw('data.frames')._data;
            for (var key in currentFrames) {
                hasFrames = true;
                break;
            }

            if (hasFrames) {
                editor.call('picker:confirm', 'Uploading frame data will replace all current frames - Are you sure you want to upload?', function () {
                    hiddenInput.click();
                });
            } else {
                hiddenInput.click();
            }
        });

        hiddenInput.addEventListener('change', function () {
            if (! hiddenInput.files[0]) return;

            btnImport.disabled = true;
            btnImport.text = 'PROCESSING...';

            var reader = new FileReader();
            reader.onload = function (e) {
                hiddenInput.value = null;
                var text = reader.result;
                var data = null;
                try {
                    data = JSON.parse(text);
                    importFramesFromTexturePacker(data);
                } catch (err) {
                    log.error(err);
                    panelError.hidden = false;
                    return;
                } finally {
                    btnImport.text = 'UPLOAD TEXTURE PACKER JSON';
                    btnImport.disabled = false;
                }
            };
            reader.readAsText(hiddenInput.files[0]);
        });

        var importFramesFromTexturePacker = function (data) {
            var width = data.meta.size.w;
            var height = data.meta.size.h;
            var actualWidth = atlasAsset.get('meta.width');
            var actualHeight = atlasAsset.get('meta.height');

            var scaleWidth = actualWidth / width;
            var scaleHeight = actualHeight / height;

            var newFrames = {};
            var counter = 0;

            for (var key in data.frames) {
                var frameData = data.frames[key];

                // the free version of texturepacker doesn't include the pivot data, so provide defaults if necessary
                if (!frameData.pivot) {
                    frameData.pivot = {
                        x: 0.5,
                        y: 0.5
                    };
                }
                newFrames[counter++] = {
                    name: frameData.filename || key,
                    border: frameData.borders ? [
                        Math.max(0, frameData.borders.x),
                        Math.max(0, frameData.frame.h - frameData.borders.y - frameData.borders.h),
                        Math.max(0, frameData.frame.w - frameData.borders.x - frameData.borders.w),
                        Math.max(0, frameData.borders.y)
                    ] :
                    [0, 0, 0, 0],
                    rect: [
                        frameData.frame.x * scaleWidth,
                        (height - frameData.frame.y - frameData.frame.h) * scaleHeight,
                        frameData.frame.w * scaleWidth,
                        frameData.frame.h * scaleHeight
                    ],
                    pivot: [
                        frameData.pivot.x,
                        frameData.pivot.y
                    ]
                };
            }

            atlasAsset.set('data.frames', newFrames);
        };

        events.push(rootPanel.on('clear', function () {
            panel.destroy();
        }));

        panel.on('destroy', function () {
            for (var i = 0, len = events.length; i<len; i++) {
                events[i].unbind();
            }
            events.length = 0;
        });
    });
});
