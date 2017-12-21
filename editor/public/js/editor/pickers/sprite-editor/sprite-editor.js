editor.once('load', function() {
    'use strict';

    // overlay
    var overlay = new ui.Overlay();
    overlay.class.add('sprites-editor');
    overlay.hidden = true;

    var rootPanel = new ui.Panel();
    rootPanel.class.add('root-panel');
    rootPanel.header = 'SPRITE EDITOR';
    overlay.append(rootPanel);
    // close button
    var btnClose = new ui.Button({
        text: '&#57650;'
    });
    btnClose.class.add('close');
    btnClose.on('click', function () {
        overlay.hidden = true;
    });
    rootPanel.headerElement.appendChild(btnClose.element);

    var root = editor.call('layout.root');
    root.append(overlay);

    // Canvas
    var canvasRoot = editor.call('picker:sprites:canvas:root');
    rootPanel.append(canvasRoot);

    // Left panel
    var leftPanel = new ui.Panel();
    leftPanel.class.add('left-panel');
    leftPanel.flexible = true;
    leftPanel.flexGrow = true;
    leftPanel.resizable = 'width';
    rootPanel.append(leftPanel);

    // Create/Edit Frame Button
    var editFrameButton = new ui.Button({
        text: 'Create/Edit Frames',
    });
    editFrameButton.class.add('edit-frame-button');
    leftPanel.append(editFrameButton);

    // Bottom panel
    var canvasControl = editor.call('picker:sprites:canvas:control');
    leftPanel.append(canvasControl)

    // Right panel
    var rightPanel;

    var spriteAsset;
    var spriteImage = new Image();

    var editing = false;
    var newFrame;
    var selectedFrame;
    var selectedKnob;
    var frames = [];

    var startFrameEditingMode = function() {
        editing = true;
        editFrameButton.text = 'Done Editing';
        updateRightPanel();
    };

    var stopFrameEditingMode = function() {
        editing = false;
        if (selectedFrame) {
            selectedFrame.highlighted = false;
            selectedFrame = null;
            selectedKnob = KNOB.NONE;
        }
        editFrameButton.text = 'Create/Edit Frames';
        updateCanvas();
        updateRightPanel();
    };

    var updateCanvas = function() {
        editor.call('picker:sprites:canvas:draw', spriteImage, frames);
    };

    var updateRightPanel = function() {
        if (editing) {
            editor.call('picker:sprite:attributes:frameedit');

            if (selectedFrame) {
                editor.call('picker:sprite:attributes:frame', selectedFrame);
            }
        } else {
            editor.call('picker:sprite:attributes:atlas', {
                asset: spriteImage,
            });
            editor.call('picker:sprite:attributes:sprite-assets');
        }
    };

    var updateNewFrame = function(newFrame) {
        if (!newFrame || !newFrame.firstPoint || !newFrame.secondPoint) {
            return;
        }
        newFrame.left = Math.min(newFrame.firstPoint.x, newFrame.secondPoint.x);
        newFrame.top = Math.min(newFrame.firstPoint.y, newFrame.secondPoint.y);
        newFrame.width = Math.max(newFrame.firstPoint.x, newFrame.secondPoint.x) - newFrame.left;
        newFrame.height = Math.max(newFrame.firstPoint.y, newFrame.secondPoint.y) - newFrame.top;
    };

    var framesHitTest = function(frames, p) {
        var frameToReturn = null;
        frames.forEach(function(frame) {
            if (rectContainsPoint(p, frame.left, frame.top, frame.width, frame.height)) {
                frameToReturn = frame;
            }
        });
        return frameToReturn;
    };

    var rectContainsPoint = function(p, left, top, width, height) {
        return left <= p.x && left + width >= p.x && top <= p.y && top + height >= p.y;
    }

    var KNOB = {
        NONE: -1,
        TOP_LEFT: 0,
        TOP: 1,
        TOP_RIGHT: 2,
        LEFT: 3,
        RIGHT: 4,
        BOTTOM_LEFT: 5,
        BOTTOM: 6,
        BOTTOM_RIGHT: 7,
    };

    var knobsHitTest = function(frame, p) {
        var knobWidth = 5;
        var widthWeights = [0, 0.5, 1, 0, 1, 0, 0.5, 1];
        var heightWeights = [0, 0, 0, 0.5, 0.5, 1, 1, 1];
        var leftOffsets = [-1, -0.5, 0, -1, 0, -1, -0.5, 0];
        var topOffsets = [-1, -1, -1, -0.5, -0.5, 0, 0, 0];

        for (var i in KNOB) {
            var knob = KNOB[i];
            if (knob < 0) {
                continue;
            }
            if (rectContainsPoint(p,
                                  frame.left + knobWidth * leftOffsets[knob] + frame.width * widthWeights[knob],
                                  frame.top + knobWidth * topOffsets[knob] + frame.height * heightWeights[knob],
                                  knobWidth,
                                  knobWidth)) {
                return knob;
            }
        }
        return KNOB.NONE;
    };

    editFrameButton.on('click', function() {
        if (editing) {
            stopFrameEditingMode();
        } else {
            startFrameEditingMode();
        }
    });

    canvasRoot.on('mousedown', function(p) {
        if (editing) {
            if (!newFrame) {
                if (selectedFrame) {
                    var knob = knobsHitTest(selectedFrame, p);
                    if (knob != KNOB.NONE) {
                        selectedKnob = knob;
                        return;
                    }
                    selectedFrame.highlighted = false;
                    selectedFrame = null;
                    selectedKnob = knob;
                }
                var frame = framesHitTest(frames, p);
                if (frame) {
                    selectedFrame = frame;
                    selectedFrame.highlighted = true;
                } else {
                    newFrame = {};
                    newFrame.highlighted = true;
                    newFrame.firstPoint = p;
                    newFrame.secondPoint = p;
                    updateNewFrame(newFrame);
                    frames.push(newFrame);
                }
            } else {
                newFrame.secondPoint = p;
                updateNewFrame(newFrame);
                delete newFrame.firstPoint;
                delete newFrame.secondPoint;
                selectedFrame = newFrame;
                newFrame = null;
            }
            updateCanvas();
            updateRightPanel();
        }
    });

    canvasRoot.on('mouseup', function(p) {
        if (editing) {
            if (selectedKnob != KNOB.NONE) {
                selectedKnob = KNOB.NONE;
                if (selectedFrame.width < 0) {
                    selectedFrame.left += selectedFrame.width;
                    selectedFrame.width = -selectedFrame.width;
                }
                if (selectedFrame.height < 0) {
                    selectedFrame.top += selectedFrame.height;
                    selectedFrame.height = -selectedFrame.height;
                }
                updateCanvas();
            }
        }
    });

    canvasRoot.on('mousemove', function(p) {
        if (editing) {
            if (newFrame) {
                newFrame.secondPoint = p;
                updateNewFrame(newFrame);
                updateCanvas();
            } else if (selectedKnob != KNOB.NONE) {
                switch (selectedKnob) {
                    case KNOB.TOP_LEFT: {
                        selectedFrame.width -= p.x - selectedFrame.left;
                        selectedFrame.left = p.x;
                        selectedFrame.height -= p.y - selectedFrame.top;
                        selectedFrame.top = p.y;
                        break;
                    }
                    case KNOB.TOP: {
                        selectedFrame.height -= p.y - selectedFrame.top;
                        selectedFrame.top = p.y;
                        break;
                    }
                    case KNOB.TOP_RIGHT: {
                        selectedFrame.width = p.x - selectedFrame.left;
                        selectedFrame.height -= p.y - selectedFrame.top;
                        selectedFrame.top = p.y;
                        break;
                    }
                    case KNOB.LEFT: {
                        selectedFrame.width -= p.x - selectedFrame.left;
                        selectedFrame.left = p.x;
                        break;
                    }
                    case KNOB.RIGHT: {
                        selectedFrame.width = p.x - selectedFrame.left;
                        break;
                    }
                    case KNOB.BOTTOM_LEFT: {
                        selectedFrame.width -= p.x - selectedFrame.left;
                        selectedFrame.left = p.x;
                        selectedFrame.height = p.y - selectedFrame.top;
                        break;
                    }
                    case KNOB.BOTTOM: {
                        selectedFrame.height = p.y - selectedFrame.top;
                        break;
                    }
                    case KNOB.BOTTOM_RIGHT: {
                        selectedFrame.width = p.x - selectedFrame.left;
                        selectedFrame.height = p.y - selectedFrame.top;
                        break;
                    }
                }
                updateCanvas();
            }
        }
    });

    // call picker
    editor.method('picker:sprites:editor', function(asset) {
        // show overlay
        overlay.hidden = false;
        spriteAsset = asset;
        editing = false;
        newFrame = null;
        selectedFrame = null;
        selectedKnob = KNOB.NONE;
        frames = [];
        spriteImage.onload = function() {
            updateCanvas();
            updateRightPanel();
        };
        spriteImage.src = config.url.home + asset.get('file.url') + '?t=' + asset.get('file.hash');
        editor.call('picker:sprites:canvas:reset');
    });

    editor.method('picker:sprites:editor:attributesPanel', function() {
        return rightPanel;
    });

    editor.method('picker:sprites:editor:addAttributesPanel', function(args) {
        if (rightPanel) {
            rootPanel.remove(rightPanel);
        }
        rightPanel = new ui.Panel(args.title);
        rightPanel.class.add('right-panel');
        rightPanel.class.add('attributes');
        rightPanel.flexShrink = false;
        rightPanel.style.width = '320px';
        rightPanel.innerElement.style.width = '320px';
        rightPanel.horizontal = true;
        rightPanel.foldable = true;
        rightPanel.scroll = true;
        rightPanel.resizable = 'left';
        rightPanel.resizeMin = 256;
        rightPanel.resizeMax = 512;
        rootPanel.append(rightPanel);
        return rightPanel;
    });

    // close picker
    editor.method('picker:sprites:editor:close', function() {
        overlay.hidden = true;
    });
});
