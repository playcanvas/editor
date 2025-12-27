import { Observer, type EventHandle } from '@playcanvas/observer';
import { Button, Canvas, Container, Overlay, Panel } from '@playcanvas/pcui';

import { buildQueryUrl, deepCopy } from '@/common/utils';

editor.once('load', () => {
    const handleWidth = 10;
    const pivotWidth = 7;

    const COLOR_GRAY = '#B1B8BA';
    const COLOR_DARKEST = '#20292b';
    const COLOR_DARK = '#1B282B';
    const COLOR_GREEN = '#0f0';
    const COLOR_ORANGE = '#f60';
    const COLOR_TRANSPARENT_ORANGE = '#ff660099';
    const COLOR_BLUE = '#00f';

    let atlasAsset = null;
    let atlasImage = new Image();
    let atlasImageLoaded = false;
    const atlasImageDataCanvas = document.createElement('canvas');
    let atlasImageData = null;

    let shiftDown = false;
    let ctrlDown = false;
    let leftButtonDown = false;
    let middleButtonDown = false;

    let panning = false;
    let spriteEditMode = false;

    let newFrame = null;
    let hoveredFrame = null;
    let oldFrame = null;

    let selectedHandle = null;
    let hoveringHandle = null;
    let startingHandleFrame = null;
    const startingHandleCoords = { x: 0, y: 0 };

    let resizeInterval = null;
    let pivotX = 0;
    let pivotY = 0;
    let pivotOffsetX = 0;
    let pivotOffsetY = 0;
    let zoomOffsetX = 0;
    let zoomOffsetY = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let aspectRatio = 1;
    let canvasRatio = 1;

    let queuedRender = false;

    let suspendCloseUndo = false;

    const HANDLE = {
        TOP_LEFT: 1,
        TOP_RIGHT: 2,
        BOTTOM_LEFT: 3,
        BOTTOM_RIGHT: 4,
        BORDER_TOP_LEFT: 5,
        BORDER_TOP: 6,
        BORDER_TOP_RIGHT: 7,
        BORDER_LEFT: 8,
        BORDER_RIGHT: 9,
        BORDER_BOTTOM_LEFT: 10,
        BORDER_BOTTOM: 11,
        BORDER_BOTTOM_RIGHT: 12,
        PIVOT: 13,
        FRAME: 14,
        TOP: 15,
        RIGHT: 16,
        BOTTOM: 17,
        LEFT: 18
    };

    const events: EventHandle[] = [];

    // create UI
    const root = editor.call('layout.root');

    // overlay
    const overlay = new Overlay({
        hidden: true,
        id: 'sprite-editor'
    });
    root.append(overlay);

    const panel = new Panel({
        class: 'root-panel',
        headerText: 'SPRITE EDITOR'
    });
    overlay.append(panel);

    // close button
    const btnClose = new Button({
        class: ['icon-button', 'close'],
        icon: 'E132'
    });
    btnClose.on('click', () => {
        editor.call('picker:sprites:close');
    });
    panel.header.append(btnClose);

    const leftColumns = new Container({
        class: 'left-columns',
        flex: true,
        flexGrow: '1',
        flexDirection: 'column'
    });
    panel.append(leftColumns);

    const leftRows = new Container({
        class: 'left-rows',
        flex: true,
        flexDirection: 'row'
    });
    leftColumns.append(leftRows);

    const leftPanel = new Panel({
        class: 'left-panel',
        collapseHorizontally: true,
        collapsible: true,
        flexShrink: '0',
        headerText: 'FRAMES IN TEXTURE ATLAS',
        resizable: 'right',
        resizeMin: 256,
        resizeMax: 512,
        scrollable: true,
        width: 320
    });
    leftRows.append(leftPanel);

    // middle panel
    const middlePanel = new Container({
        class: 'middle-panel',
        flex: true,
        flexDirection: 'column',
        flexGrow: '1'
    });
    leftRows.append(middlePanel);

    // canvas
    const canvasPanel = new Container({
        flex: true,
        flexGrow: '1'
    });
    middlePanel.append(canvasPanel);

    const canvas = new Canvas({
        class: 'canvas'
    });
    canvasPanel.append(canvas);

    const canvasElement = canvas.dom as HTMLCanvasElement;
    const ctx = canvasElement.getContext('2d');

    // bottom panel
    const bottomPanel = new Panel({
        class: 'bottom-panel',
        collapsible: true,
        flexShrink: '0',
        headerText: 'SPRITE ASSETS',
        height: 220,
        resizable: 'top',
        resizeMax: 106 * 3,
        resizeMin: 106,
        scrollable: true
    });
    middlePanel.append(bottomPanel);

    // Right panel
    let rightPanel: Panel | null = null;
    let rightPanelContent: Container | null = null;

    // controls observer (for zoom/brightness).
    const controls = new Observer({
        zoom: 1,
        brightness: 100
    });

    const clamp = (value: number, minValue: number, maxValue: number): number => {
        return Math.min(Math.max(value, minValue), maxValue);
    };

    const updateCursor = (): void => {
        const cls = middlePanel.class;

        cls.remove('ew-resize');
        cls.remove('ns-resize');
        cls.remove('nwse-resize');
        cls.remove('nesw-resize');
        cls.remove('move');
        cls.remove('grab');
        cls.remove('grabbing');


        if ((panning || shiftDown) && !selectedHandle) {
            if (panning) {
                cls.add('grabbing');
            } else if (shiftDown) {
                cls.add('grab');
            }
        } else {
            const handle = selectedHandle !== null ? selectedHandle : hoveringHandle;
            if (handle !== null) {
                switch (handle) {
                    case HANDLE.LEFT:
                    case HANDLE.RIGHT:
                    case HANDLE.BORDER_LEFT:
                    case HANDLE.BORDER_RIGHT:
                        cls.add('ew-resize');
                        break;

                    case HANDLE.TOP:
                    case HANDLE.BOTTOM:
                    case HANDLE.BORDER_TOP:
                    case HANDLE.BORDER_BOTTOM:
                        cls.add('ns-resize');
                        break;

                    case HANDLE.TOP_LEFT:
                    case HANDLE.BOTTOM_RIGHT:
                    case HANDLE.BORDER_TOP_LEFT:
                    case HANDLE.BORDER_BOTTOM_RIGHT:
                        cls.add('nwse-resize');
                        break;

                    case HANDLE.TOP_RIGHT:
                    case HANDLE.BOTTOM_LEFT:
                    case HANDLE.BORDER_TOP_RIGHT:
                    case HANDLE.BORDER_BOTTOM_LEFT:
                        cls.add('nesw-resize');
                        break;

                    case HANDLE.PIVOT:
                        if (handle === selectedHandle) {
                            cls.add('grabbing');
                        } else {
                            cls.add('grab');
                        }
                        break;

                    case HANDLE.FRAME:
                        cls.add('move');
                        break;
                }
            }
        }
    };

    const imageWidth = (): number => {
        return controls.get('zoom') * (canvasRatio > aspectRatio ? canvas.height * aspectRatio : canvas.width);
    };

    const imageHeight = (): number => {
        return controls.get('zoom') * (canvasRatio <= aspectRatio ? canvas.width / aspectRatio : canvas.height);
    };

    const imageLeft = (): number => {
        return (pivotX + pivotOffsetX + zoomOffsetX) * canvas.width;
    };

    const imageTop = (): number => {
        return (pivotY + pivotOffsetY + zoomOffsetY) * canvas.height;
    };

    const frameLeft = (frame, leftOffset: number, scaledWidth: number): number => {
        return leftOffset + frame.rect[0] * scaledWidth / atlasImage.width;
    };

    const frameTop = (frame, topOffset: number, scaledHeight: number): number => {
        const inverted = 1 - (frame.rect[1] + frame.rect[3]) / atlasImage.height;
        return topOffset + inverted * scaledHeight;
    };

    const frameWidth = (frame, scaledWidth: number): number => {
        return frame.rect[2] * scaledWidth / atlasImage.width;
    };

    const frameHeight = (frame, scaledHeight: number): number => {
        return frame.rect[3] * scaledHeight / atlasImage.height;
    };

    const setHandle = (handle, frame?, mousePoint?): void => {
        selectedHandle = handle;
        if (handle) {
            // this frame will be used as the source frame
            // when calculating offsets in modifyFrame
            startingHandleFrame = deepCopy(frame);

            // Store the real image coords of the mouse point
            // All offsets in modifyFrame will be calculated based on these coords
            if (mousePoint) {
                startingHandleCoords.x = clamp((mousePoint.x - imageLeft()) * atlasImage.width / imageWidth(), 0, atlasImage.width);
                startingHandleCoords.y = clamp((mousePoint.y - imageTop()) * atlasImage.height / imageHeight(), 0, atlasImage.height);
            }
        }

        updateCursor();
    };

    const windowToCanvas = (windowX: number, windowY: number) => {
        const rect = canvas.dom.getBoundingClientRect();
        return {
            x: Math.round(windowX - rect.left),
            y: Math.round(windowY - rect.top)
        };
    };

    const resizeCanvas = (): boolean => {
        let result = false;

        const width = canvasPanel.dom.clientWidth;
        const height = canvasPanel.dom.clientHeight;

        // If it's resolution does not match change it
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            result = true;
        }

        canvasRatio = canvas.width / canvas.height;

        return result;
    };

    const renderFrame = (frame, left: number, top: number, width: number, height: number, offset?: number, renderPivot?: boolean): void => {
        const x = frameLeft(frame, left, width);
        const y = frameTop(frame, top, height);
        const w = frameWidth(frame, width);
        const h = frameHeight(frame, height);

        offset = offset || 0;

        // render rect
        ctx.moveTo(x - offset, y - offset);
        ctx.lineTo(x - offset, y + offset + h);
        ctx.lineTo(x + offset + w, y + offset + h);
        ctx.lineTo(x + offset + w, y - offset);
        ctx.lineTo(x - offset, y - offset);

        if (renderPivot) {
            // render pivot
            const px = x + frame.pivot[0] * w;
            const py = y + (1 - frame.pivot[1]) * h;
            ctx.moveTo(px, py);
            ctx.arc(px, py, pivotWidth, 0, 2 * Math.PI);
        }
    };

    const renderHandles = (frame, left: number, top: number, width: number, height: number): void => {
        const x = frameLeft(frame, left, width);
        const y = frameTop(frame, top, height);
        const w = frameWidth(frame, width);
        const h = frameHeight(frame, height);
        const px = x + frame.pivot[0] * w;
        const py = y + (1 - frame.pivot[1]) * h;

        ctx.fillStyle = COLOR_BLUE;
        ctx.strokeStyle = COLOR_BLUE;
        ctx.lineWidth = 1;

        const borderWidthModifier = width / atlasImage.width;
        const borderHeightModifier = height / atlasImage.height;
        const lb = x + frame.border[0] * borderWidthModifier;
        const bb = y + h - frame.border[1] * borderHeightModifier;
        const rb = x + w - frame.border[2] * borderWidthModifier;
        const tb = y + frame.border[3] * borderHeightModifier;

        // border lines
        ctx.beginPath();
        ctx.setLineDash([4]);

        // left line
        if (frame.border[0]) {
            ctx.moveTo(lb, y);
            ctx.lineTo(lb, y + h);
        }

        // right line
        if (frame.border[2]) {
            ctx.moveTo(rb, y);
            ctx.lineTo(rb, y + h);
        }

        // bottom line
        if (frame.border[1]) {
            ctx.moveTo(x, bb);
            ctx.lineTo(x + w, bb);
        }

        // top line
        if (frame.border[3]) {
            ctx.moveTo(x, tb);
            ctx.lineTo(x + w, tb);
        }

        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = COLOR_DARK;
        ctx.fillStyle = COLOR_GREEN;
        ctx.lineWidth = 1;

        // top left corner
        ctx.fillRect(
            x - handleWidth / 2,
            y - handleWidth / 2,
            handleWidth,
            handleWidth
        );

        ctx.strokeRect(
            x - handleWidth / 2,
            y - handleWidth / 2,
            handleWidth,
            handleWidth
        );
        // top right corner
        ctx.fillRect(
            x + w - handleWidth / 2,
            y - handleWidth / 2,
            handleWidth,
            handleWidth
        );

        ctx.strokeRect(
            x + w - handleWidth / 2,
            y - handleWidth / 2,
            handleWidth,
            handleWidth
        );

        // bottom left corner
        ctx.fillRect(
            x - handleWidth / 2,
            y + h - handleWidth / 2,
            handleWidth,
            handleWidth
        );

        ctx.strokeRect(
            x - handleWidth / 2,
            y + h - handleWidth / 2,
            handleWidth,
            handleWidth
        );
        // bottom right corner
        ctx.fillRect(
            x + w - handleWidth / 2,
            y + h - handleWidth / 2,
            handleWidth,
            handleWidth
        );

        ctx.strokeRect(
            x + w - handleWidth / 2,
            y + h - handleWidth / 2,
            handleWidth,
            handleWidth
        );


        ctx.fillStyle = COLOR_BLUE;
        ctx.strokeStyle = COLOR_DARK;

        // left border
        ctx.fillRect(
            lb - handleWidth / 2,
            (bb + tb) / 2 - handleWidth / 2,
            handleWidth,
            handleWidth
        );
        ctx.strokeRect(
            lb - handleWidth / 2,
            (bb + tb) / 2 - handleWidth / 2,
            handleWidth,
            handleWidth
        );


        // bottom border
        ctx.fillRect(
            (lb + rb) / 2 - handleWidth / 2,
            bb - handleWidth / 2,
            handleWidth,
            handleWidth
        );
        ctx.strokeRect(
            (lb + rb) / 2 - handleWidth / 2,
            bb - handleWidth / 2,
            handleWidth,
            handleWidth
        );

        // right border
        ctx.fillRect(
            rb - handleWidth / 2,
            (bb + tb) / 2 - handleWidth / 2,
            handleWidth,
            handleWidth
        );
        ctx.strokeRect(
            rb - handleWidth / 2,
            (bb + tb) / 2 - handleWidth / 2,
            handleWidth,
            handleWidth
        );

        // top border
        ctx.fillRect(
            (lb + rb) / 2 - handleWidth / 2,
            tb - handleWidth / 2,
            handleWidth,
            handleWidth
        );
        ctx.strokeRect(
            (lb + rb) / 2 - handleWidth / 2,
            tb - handleWidth / 2,
            handleWidth,
            handleWidth
        );

        // bottom left border
        if (frame.border[0] || frame.border[1]) {
            ctx.fillRect(
                lb - handleWidth / 2,
                bb - handleWidth / 2,
                handleWidth,
                handleWidth
            );
            ctx.strokeRect(
                lb - handleWidth / 2,
                bb - handleWidth / 2,
                handleWidth,
                handleWidth
            );
        }

        // bottom right border
        if (frame.border[1] || frame.border[2]) {
            ctx.fillRect(
                rb - handleWidth / 2,
                bb - handleWidth / 2,
                handleWidth,
                handleWidth
            );
            ctx.strokeRect(
                rb - handleWidth / 2,
                bb - handleWidth / 2,
                handleWidth,
                handleWidth
            );
        }

        // top right border
        if (frame.border[2] || frame.border[3]) {
            ctx.fillRect(
                rb - handleWidth / 2,
                tb - handleWidth / 2,
                handleWidth,
                handleWidth
            );
            ctx.strokeRect(
                rb - handleWidth / 2,
                tb - handleWidth / 2,
                handleWidth,
                handleWidth
            );
        }

        // top left border
        if (frame.border[3] || frame.border[0]) {
            ctx.fillRect(
                lb - handleWidth / 2,
                tb - handleWidth / 2,
                handleWidth,
                handleWidth
            );
            ctx.strokeRect(
                lb - handleWidth / 2,
                tb - handleWidth / 2,
                handleWidth,
                handleWidth
            );
        }

        // pivot
        ctx.beginPath();

        // border
        ctx.lineWidth = 5;
        ctx.strokeStyle = COLOR_DARK;
        ctx.moveTo(px + pivotWidth, py);
        ctx.arc(px, py, pivotWidth, 0, 2 * Math.PI);
        ctx.stroke();

        // inside border
        ctx.lineWidth = 3;
        ctx.strokeStyle = COLOR_GREEN;
        ctx.stroke();
    };

    const renderBorderLines = (frame, left: number, top: number, width: number, height: number): void => {
        const x = frameLeft(frame, left, width);
        const y = frameTop(frame, top, height);
        const w = frameWidth(frame, width);
        const h = frameHeight(frame, height);

        const borderWidthModifier = width / atlasImage.width;
        const borderHeightModifier = height / atlasImage.height;
        const lb = x + frame.border[0] * borderWidthModifier;
        const bb = y + h - frame.border[1] * borderHeightModifier;
        const rb = x + w - frame.border[2] * borderWidthModifier;
        const tb = y + frame.border[3] * borderHeightModifier;

        // left line
        if (frame.border[0]) {
            ctx.moveTo(lb, y);
            ctx.lineTo(lb, y + h);
        }

        // right line
        if (frame.border[2]) {
            ctx.moveTo(rb, y);
            ctx.lineTo(rb, y + h);
        }

        // bottom line
        if (frame.border[1]) {
            ctx.moveTo(x, bb);
            ctx.lineTo(x + w, bb);
        }

        // top line
        if (frame.border[3]) {
            ctx.moveTo(x, tb);
            ctx.lineTo(x + w, tb);
        }
    };

    const renderCanvas = (): void => {
        queuedRender = false;

        if (overlay.hidden) {
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!atlasImageLoaded) {
            return;
        }

        let selected = editor.call('picker:sprites:selectedFrame');

        // clear selection if no longer exists
        if (selected && !atlasAsset.has(`data.frames.${selected}`)) {
            selected = editor.call('picker:sprites:selectFrames', null);
        }

        const left = imageLeft();
        const top = imageTop();
        const width = imageWidth();
        const height = imageHeight();

        const highlightedFrames = editor.call('picker:sprites:highlightedFrames');
        const newSpriteFrames = editor.call('picker:sprites:newSpriteFrames');
        const spriteAsset = editor.call('picker:sprites:selectedSprite');

        // disable smoothing
        ctx.imageSmoothingEnabled = false;

        // draw background outside image
        ctx.fillStyle = COLOR_DARKEST;
        // left
        ctx.fillRect(0, 0, left, canvas.height);
        // top
        ctx.fillRect(0, 0, canvas.width, top);
        // right
        ctx.fillRect(left + width, 0, canvas.width - left - width, canvas.height);
        // bottom
        ctx.fillRect(0, top + height, canvas.width, canvas.height - top - height);

        // draw image
        ctx.drawImage(
            atlasImage,
            0, 0,
            atlasImage.width, atlasImage.height,
            left, top, width, height
        );

        // scroll checkerboard pattern
        const checkLeft = left;
        const checkTop = top;
        canvas.style.backgroundPosition = `${checkLeft}px ${checkTop}px, ${checkLeft + 12}px ${checkTop + 12}px`;

        // draw frames
        const frames = atlasAsset.getRaw('data.frames')._data;
        ctx.beginPath();
        ctx.strokeStyle = COLOR_GRAY;
        ctx.lineWidth = 1;
        for (const key in frames) {
            if (highlightedFrames.indexOf(key) !== -1 || newSpriteFrames.indexOf(key) !== -1) {
                continue;
            }

            renderFrame(frames[key]._data, left, top, width, height);
        }
        ctx.stroke();

        // draw highlighted frames
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = spriteAsset ? COLOR_ORANGE : COLOR_DARK;
        for (let i = 0, len = highlightedFrames.length; i < len; i++) {
            const key = highlightedFrames[i];
            if (selected && selected === key) {
                continue;
            }

            // check if frame no longer exists
            if (!frames[key]) {
                highlightedFrames.splice(i, 1);
                len--;
                i--;
            } else {
                if (newSpriteFrames.indexOf(key) === -1) {
                    renderFrame(frames[key]._data, left, top, width, height, 0, !spriteEditMode);
                }
            }
        }
        ctx.stroke();

        // draw sprite edit mode frames
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = COLOR_DARK;
        for (let i = 0, len = newSpriteFrames.length; i < len; i++) {
            const key = newSpriteFrames[i];

            // check if frame no longer exists
            if (!frames[key]) {
                newSpriteFrames.splice(i, 1);
                len--;
                i--;
            } else {
                renderFrame(frames[key]._data, left, top, width, height, 0, !spriteEditMode);
            }
        }
        ctx.stroke();

        // render border lines
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.setLineDash([4]);
        if (!spriteEditMode) {
            for (let i = 0, len = highlightedFrames.length; i < len; i++) {
                const key = highlightedFrames[i];
                if (selected && selected === key) {
                    continue;
                }
                renderBorderLines(frames[key]._data, left, top, width, height);
            }
        }
        ctx.stroke();
        ctx.setLineDash([]);

        let frame;

        // render hovered frame
        if (hoveredFrame) {
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.fillStyle = COLOR_TRANSPARENT_ORANGE;
            frame = atlasAsset.getRaw(`data.frames.${hoveredFrame}`);
            if (frame) {
                frame = frame._data;
                renderFrame(frame, left, top, width, height, 1);
            }
            ctx.fill();
        }

        frame = newFrame || (selected ? atlasAsset.getRaw(`data.frames.${selected}`) : null);
        if (frame && frame._data) {
            frame = frame._data;
        }

        if (frame) {
            ctx.beginPath();
            ctx.strokeStyle = COLOR_DARK;

            // draw newFrame or selected frame
            if (frame !== newFrame || newFrame.rect[2] !== 0 && newFrame.rect[3] !== 0) {
                renderFrame(frame, left, top, width, height);
            }

            ctx.stroke();

            // draw handles
            if (frame !== newFrame) {
                renderHandles(frame, left, top, width, height);
            }
        }
    };

    const queueRender = (): void => {
        if (queuedRender || overlay.hidden) {
            return;
        }
        queuedRender = true;
        requestAnimationFrame(renderCanvas);
    };

    const rectContainsPoint = (p, left: number, top: number, width: number, height: number): boolean => {
        return left <= p.x && left + width >= p.x && top <= p.y && top + height >= p.y;
    };

    const framesHitTest = (p): string | null => {
        const imgWidth = imageWidth();
        const imgHeight = imageHeight();
        const imgLeft = imageLeft();
        const imgTop = imageTop();

        const frames = atlasAsset.getRaw('data.frames')._data;
        for (const key in frames) {
            const frame = frames[key]._data;
            const left = frameLeft(frame, imgLeft, imgWidth);
            const top = frameTop(frame, imgTop, imgHeight);
            const width = frameWidth(frame, imgWidth);
            const height = frameHeight(frame, imgHeight);

            if (rectContainsPoint(p, left, top, width, height)) {
                return key;
            }
        }

        return null;
    };

    const handlesHitTest = (p, frame) => {
        if (!editor.call('permissions:write')) {
            return false;
        }

        const imgWidth = imageWidth();
        const imgHeight = imageHeight();
        const imgLeft = imageLeft();
        const imgTop = imageTop();

        const left = frameLeft(frame, imgLeft, imgWidth);
        const top = frameTop(frame, imgTop, imgHeight);
        const width = frameWidth(frame, imgWidth);
        const height = frameHeight(frame, imgHeight);

        const borderWidthModifier = imgWidth / atlasImage.width;
        const borderHeightModifier = imgHeight / atlasImage.height;
        const lb = left + frame.border[0] * borderWidthModifier;
        const bb = top + height - frame.border[1] * borderHeightModifier;
        const rb = left + width - frame.border[2] * borderWidthModifier;
        const tb = top + frame.border[3] * borderHeightModifier;

        // pivot
        const pivotX = left + frame.pivot[0] * width;
        const pivotY = top + (1 - frame.pivot[1]) * height;
        const distFromCenter = Math.sqrt((p.x - pivotX) * (p.x - pivotX) + (p.y - pivotY) * (p.y - pivotY));
        if (distFromCenter < pivotWidth + 1 && distFromCenter > pivotWidth - 3) {
            return HANDLE.PIVOT;
        }

        // top left border
        if (frame.border[0] || frame.border[3]) {
            if (rectContainsPoint(p, lb - handleWidth / 2, tb - handleWidth / 2, handleWidth, handleWidth)) {
                return HANDLE.BORDER_TOP_LEFT;
            }
        }

        // top border
        if (rectContainsPoint(p, (lb + rb) / 2 - handleWidth / 2, tb - handleWidth / 2, handleWidth, handleWidth)) {
            return HANDLE.BORDER_TOP;
        }

        // top right border
        if (frame.border[2] || frame.border[3]) {
            if (rectContainsPoint(p, rb - handleWidth / 2, tb - handleWidth / 2, handleWidth, handleWidth)) {
                return HANDLE.BORDER_TOP_RIGHT;
            }
        }

        // left border
        if (rectContainsPoint(p, lb - handleWidth / 2, (bb + tb) / 2 - handleWidth / 2, handleWidth, handleWidth)) {
            return HANDLE.BORDER_LEFT;
        }

        // right border
        if (rectContainsPoint(p, rb - handleWidth / 2, (bb + tb) / 2 - handleWidth / 2, handleWidth, handleWidth)) {
            return HANDLE.BORDER_RIGHT;
        }

        // bottom left border
        if (frame.border[0] || frame.border[1]) {
            if (rectContainsPoint(p, lb - handleWidth / 2, bb - handleWidth / 2, handleWidth, handleWidth)) {
                return HANDLE.BORDER_BOTTOM_LEFT;
            }
        }

        // bottom border
        if (rectContainsPoint(p, (lb + rb) / 2 - handleWidth / 2, bb - handleWidth / 2, handleWidth, handleWidth)) {
            return HANDLE.BORDER_BOTTOM;
        }

        // bottom right border
        if (frame.border[1] || frame.border[2]) {
            if (rectContainsPoint(p, rb - handleWidth / 2, bb - handleWidth / 2, handleWidth, handleWidth)) {
                return HANDLE.BORDER_BOTTOM_RIGHT;
            }
        }

        // top left corner
        if (rectContainsPoint(p, left - handleWidth / 2, top - handleWidth / 2, handleWidth, handleWidth)) {
            return HANDLE.TOP_LEFT;
        }
        // top right corner
        if (rectContainsPoint(p, left + width - handleWidth / 2, top - handleWidth / 2, handleWidth, handleWidth)) {
            return HANDLE.TOP_RIGHT;
        }
        // bottom left corner
        if (rectContainsPoint(p, left - handleWidth / 2, top + height - handleWidth / 2, handleWidth, handleWidth)) {
            return HANDLE.BOTTOM_LEFT;
        }
        // bottom right corner
        if (rectContainsPoint(p, left + width - handleWidth / 2, top + height - handleWidth / 2, handleWidth, handleWidth)) {
            return HANDLE.BOTTOM_RIGHT;
        }

        // left border edge
        if (frame.border[0]) {
            if (rectContainsPoint(p, lb - handleWidth / 2, top + handleWidth / 2, handleWidth, height - handleWidth)) {
                return HANDLE.BORDER_LEFT;
            }
        }
        // right border edge
        if (frame.border[2]) {
            if (rectContainsPoint(p, rb - handleWidth / 2, top + handleWidth / 2, handleWidth, height - handleWidth)) {
                return HANDLE.BORDER_RIGHT;
            }
        }
        // bottom border edge
        if (frame.border[1]) {
            if (rectContainsPoint(p, left + handleWidth / 2, bb - handleWidth / 2, width - handleWidth, handleWidth)) {
                return HANDLE.BORDER_BOTTOM;
            }
        }
        // top border edge
        if (frame.border[3]) {
            if (rectContainsPoint(p, left + handleWidth / 2, tb - handleWidth / 2, width - handleWidth, handleWidth)) {
                return HANDLE.BORDER_TOP;
            }
        }

        // left edge
        if (rectContainsPoint(p, left - handleWidth / 2, top + handleWidth / 2, handleWidth, height - handleWidth)) {
            return HANDLE.LEFT;
        }
        // right edge
        if (rectContainsPoint(p, left + width - handleWidth / 2, top + handleWidth / 2, handleWidth, height - handleWidth)) {
            return HANDLE.RIGHT;
        }
        // top edge
        if (rectContainsPoint(p, left + handleWidth / 2, top - handleWidth / 2, width - handleWidth, handleWidth)) {
            return HANDLE.TOP;
        }
        // bottom edge
        if (rectContainsPoint(p, left + handleWidth / 2, top + height - handleWidth / 2, width - handleWidth, handleWidth)) {
            return HANDLE.BOTTOM;
        }

        // frame
        if (rectContainsPoint(p, left, top, width, height)) {
            return HANDLE.FRAME;
        }

        return null;
    };

    // Modify a frame using the specified handle
    const modifyFrame = (handle, frame, mousePoint): void => {
        const imgWidth = imageWidth();
        const imgHeight = imageHeight();
        const imgLeft = imageLeft();
        const imgTop = imageTop();

        const realWidth = atlasImage.width;
        const realHeight = atlasImage.height;

        const p = mousePoint;

        const currentX = realWidth * (p.x - imgLeft) / imgWidth;
        if (currentX < 0 && startingHandleCoords.x <= 0) {
            return;
        }
        const currentY = realHeight * (p.y - imgTop) / imgHeight;
        if (currentY < 0 && startingHandleCoords.y <= 0) {
            return;
        }

        let dx = Math.floor(currentX - startingHandleCoords.x);
        let dy = Math.floor(currentY - startingHandleCoords.y);

        switch (handle) {
            case HANDLE.TOP_LEFT: {
                // limit x coord between image edges
                const x = clamp(startingHandleFrame.rect[0] + dx, 0, realWidth);
                dx = x - startingHandleFrame.rect[0];
                frame.rect[0] = startingHandleFrame.rect[0] + dx;
                // adjust width
                frame.rect[2] = startingHandleFrame.rect[2] - dx;
                // adjust height and limit between image edges
                frame.rect[3] = startingHandleFrame.rect[3] - dy;
                if (frame.rect[1] + frame.rect[3] > realHeight) {
                    frame.rect[3] = realHeight - frame.rect[1];
                }

                // if width became negative then make it positive and
                // adjust x coord, then switch handle to top right
                if (frame.rect[2] < 0) {
                    frame.rect[2] *= -1;
                    frame.rect[0] -= frame.rect[2];
                    setHandle(HANDLE.TOP_RIGHT, frame, p);
                }
                if (frame.rect[3] < 0) {
                    frame.rect[3] *= -1;
                    frame.rect[1] -= frame.rect[3];
                    setHandle(selectedHandle === HANDLE.TOP_RIGHT ? HANDLE.BOTTOM_RIGHT : HANDLE.BOTTOM_LEFT, frame, p);
                }

                // push right border if necessary
                if (frame.border[2] > frame.rect[2] - frame.border[0]) {
                    frame.border[2] = Math.max(frame.rect[2] - frame.border[0], 0);
                }

                // then push left border if necessary
                if (frame.border[0] > frame.rect[2] - frame.border[2]) {
                    frame.border[0] = Math.max(frame.rect[2] - frame.border[2], 0);
                }

                // push bottom border if necessary
                if (frame.border[1] > frame.rect[3] - frame.border[3]) {
                    frame.border[1] = Math.max(frame.rect[3] - frame.border[3], 0);
                }

                // then push top border if necessary
                if (frame.border[3] > frame.rect[3] - frame.border[1]) {
                    frame.border[3] = Math.max(frame.rect[3] - frame.border[1], 0);
                }

                break;
            }
            case HANDLE.TOP_RIGHT: {
                frame.rect[2] = startingHandleFrame.rect[2] + dx;
                frame.rect[3] = startingHandleFrame.rect[3] - dy;

                if (frame.rect[0] + frame.rect[2] > realWidth) {
                    frame.rect[2] = realWidth - frame.rect[0];
                }
                if (frame.rect[1] + frame.rect[3] > realHeight) {
                    frame.rect[3] = realHeight - frame.rect[1];
                }

                if (frame.rect[2] < 0) {
                    frame.rect[2] *= -1;
                    frame.rect[0] -= frame.rect[2];
                    setHandle(HANDLE.TOP_LEFT, frame, p);
                }
                if (frame.rect[3] < 0) {
                    frame.rect[3] *= -1;
                    frame.rect[1] -= frame.rect[3];
                    setHandle(selectedHandle === HANDLE.TOP_LEFT ? HANDLE.BOTTOM_LEFT : HANDLE.BOTTOM_RIGHT, frame, p);
                }

                if (frame.border[0] > frame.rect[2] - frame.border[2]) {
                    frame.border[0] = Math.max(frame.rect[2] - frame.border[2], 0);
                }

                if (frame.border[2] > frame.rect[2] - frame.border[0]) {
                    frame.border[2] = Math.max(frame.rect[2] - frame.border[0], 0);
                }

                if (frame.border[1] > frame.rect[3] - frame.border[3]) {
                    frame.border[1] = Math.max(frame.rect[3] - frame.border[3], 0);
                }

                if (frame.border[3] > frame.rect[3] - frame.border[1]) {
                    frame.border[3] = Math.max(frame.rect[3] - frame.border[1], 0);
                }

                break;
            }
            case HANDLE.BOTTOM_LEFT: {
                const x = clamp(startingHandleFrame.rect[0] + dx, 0, realWidth);
                dx = x - startingHandleFrame.rect[0];
                frame.rect[0] = startingHandleFrame.rect[0] + dx;
                frame.rect[2] = startingHandleFrame.rect[2] - dx;

                const y = clamp(startingHandleFrame.rect[1] - dy, 0, realHeight);
                dy = y - startingHandleFrame.rect[1];
                frame.rect[1] = startingHandleFrame.rect[1] + dy;
                frame.rect[3] = startingHandleFrame.rect[3] - dy;

                if (frame.rect[2] < 0) {
                    frame.rect[2] *= -1;
                    frame.rect[0] -= frame.rect[2];
                    setHandle(HANDLE.BOTTOM_RIGHT, frame, p);
                }
                if (frame.rect[3] < 0) {
                    frame.rect[3] *= -1;
                    frame.rect[1] -= frame.rect[3];
                    setHandle(selectedHandle === HANDLE.BOTTOM_RIGHT ? HANDLE.TOP_RIGHT : HANDLE.TOP_LEFT, frame, p);
                }

                if (frame.border[2] > frame.rect[2] - frame.border[0]) {
                    frame.border[2] = Math.max(frame.rect[2] - frame.border[0], 0);
                }

                if (frame.border[0] > frame.rect[2] - frame.border[2]) {
                    frame.border[0] = Math.max(frame.rect[2] - frame.border[2], 0);
                }

                if (frame.border[3] > frame.rect[3] - frame.border[1]) {
                    frame.border[3] = Math.max(frame.rect[3] - frame.border[1], 0);
                }

                if (frame.border[1] > frame.rect[3] - frame.border[3]) {
                    frame.border[1] = Math.max(frame.rect[3] - frame.border[3], 0);
                }

                break;
            }
            case HANDLE.BOTTOM_RIGHT: {
                frame.rect[2] = startingHandleFrame.rect[2] + dx;

                const y = clamp(startingHandleFrame.rect[1] - dy, 0, realHeight);
                dy = y - startingHandleFrame.rect[1];
                frame.rect[1] = startingHandleFrame.rect[1] + dy;
                frame.rect[3] = startingHandleFrame.rect[3] - dy;

                if (frame.rect[0] + frame.rect[2] > realWidth) {
                    frame.rect[2] = realWidth - frame.rect[0];
                }
                if (frame.rect[1] + frame.rect[3] > realHeight) {
                    frame.rect[3] = realHeight - frame.rect[1];
                }

                if (frame.rect[2] < 0) {
                    frame.rect[2] *= -1;
                    frame.rect[0] -= frame.rect[2];
                    setHandle(HANDLE.BOTTOM_LEFT, frame, p);
                }
                if (frame.rect[3] < 0) {
                    frame.rect[3] *= -1;
                    frame.rect[1] -= frame.rect[3];
                    setHandle(selectedHandle === HANDLE.BOTTOM_LEFT ? HANDLE.TOP_LEFT : HANDLE.TOP_RIGHT, frame, p);
                }

                if (frame.border[0] > frame.rect[2] - frame.border[2]) {
                    frame.border[0] = Math.max(frame.rect[2] - frame.border[2], 0);
                }

                if (frame.border[2] > frame.rect[2] - frame.border[0]) {
                    frame.border[2] = Math.max(frame.rect[2] - frame.border[0], 0);
                }

                if (frame.border[3] > frame.rect[3] - frame.border[1]) {
                    frame.border[3] = Math.max(frame.rect[3] - frame.border[1], 0);
                }

                if (frame.border[1] > frame.rect[3] - frame.border[3]) {
                    frame.border[1] = Math.max(frame.rect[3] - frame.border[3], 0);
                }

                break;
            }
            case HANDLE.RIGHT: {
                frame.rect[2] = startingHandleFrame.rect[2] + dx;

                if (frame.rect[0] + frame.rect[2] > realWidth) {
                    frame.rect[2] = realWidth - frame.rect[0];
                }

                if (frame.rect[2] < 0) {
                    frame.rect[2] *= -1;
                    frame.rect[0] -= frame.rect[2];
                    setHandle(HANDLE.LEFT, frame, p);
                }

                if (frame.border[0] > frame.rect[2] - frame.border[2]) {
                    frame.border[0] = Math.max(frame.rect[2] - frame.border[2], 0);
                }

                if (frame.border[2] > frame.rect[2] - frame.border[0]) {
                    frame.border[2] = Math.max(frame.rect[2] - frame.border[0], 0);
                }

                break;
            }
            case HANDLE.LEFT: {
                // limit x coord between image edges
                const x = clamp(startingHandleFrame.rect[0] + dx, 0, realWidth);
                dx = x - startingHandleFrame.rect[0];
                frame.rect[0] = startingHandleFrame.rect[0] + dx;
                // adjust width
                frame.rect[2] = startingHandleFrame.rect[2] - dx;

                // if width became negative then make it positive and
                // adjust x coord, then switch handle to top right
                if (frame.rect[2] < 0) {
                    frame.rect[2] *= -1;
                    frame.rect[0] -= frame.rect[2];
                    setHandle(HANDLE.RIGHT, frame, p);
                }

                // push right border if necessary
                if (frame.border[2] > frame.rect[2] - frame.border[0]) {
                    frame.border[2] = Math.max(frame.rect[2] - frame.border[0], 0);
                }

                // then push left border if necessary
                if (frame.border[0] > frame.rect[2] - frame.border[2]) {
                    frame.border[0] = Math.max(frame.rect[2] - frame.border[2], 0);
                }

                break;
            }
            case HANDLE.TOP: {
                // adjust height and limit between image edges
                frame.rect[3] = startingHandleFrame.rect[3] - dy;
                if (frame.rect[1] + frame.rect[3] > realHeight) {
                    frame.rect[3] = realHeight - frame.rect[1];
                }

                if (frame.rect[3] < 0) {
                    frame.rect[3] *= -1;
                    frame.rect[1] -= frame.rect[3];
                    setHandle(HANDLE.BOTTOM, frame, p);
                }

                // push bottom border if necessary
                if (frame.border[1] > frame.rect[3] - frame.border[3]) {
                    frame.border[1] = Math.max(frame.rect[3] - frame.border[3], 0);
                }

                // then push top border if necessary
                if (frame.border[3] > frame.rect[3] - frame.border[1]) {
                    frame.border[3] = Math.max(frame.rect[3] - frame.border[1], 0);
                }

                break;
            }
            case HANDLE.BOTTOM: {
                const y = clamp(startingHandleFrame.rect[1] - dy, 0, realHeight);
                dy = y - startingHandleFrame.rect[1];
                frame.rect[1] = startingHandleFrame.rect[1] + dy;
                frame.rect[3] = startingHandleFrame.rect[3] - dy;


                if (frame.rect[1] + frame.rect[3] > realHeight) {
                    frame.rect[3] = realHeight - frame.rect[1];
                }

                if (frame.rect[3] < 0) {
                    frame.rect[3] *= -1;
                    frame.rect[1] -= frame.rect[3];
                    setHandle(HANDLE.TOP, frame, p);
                }

                if (frame.border[3] > frame.rect[3] - frame.border[1]) {
                    frame.border[3] = Math.max(frame.rect[3] - frame.border[1], 0);
                }

                if (frame.border[1] > frame.rect[3] - frame.border[3]) {
                    frame.border[1] = Math.max(frame.rect[3] - frame.border[3], 0);
                }

                break;
            }
            case HANDLE.BORDER_TOP_LEFT: {
                frame.border[3] = Math.min(Math.max(startingHandleFrame.border[3] + dy, 0), frame.rect[3] - frame.border[1]);
                frame.border[0] = Math.min(Math.max(startingHandleFrame.border[0] + dx, 0), frame.rect[2] - frame.border[2]);
                break;
            }
            case HANDLE.BORDER_TOP: {
                frame.border[3] = Math.min(Math.max(startingHandleFrame.border[3] + dy, 0), frame.rect[3] - frame.border[1]);
                break;
            }
            case HANDLE.BORDER_TOP_RIGHT: {
                frame.border[2] = Math.min(Math.max(startingHandleFrame.border[2] - dx, 0), frame.rect[2] - frame.border[0]);
                frame.border[3] = Math.min(Math.max(startingHandleFrame.border[3] + dy, 0), frame.rect[3] - frame.border[1]);
                break;
            }
            case HANDLE.BORDER_LEFT: {
                frame.border[0] = Math.min(Math.max(startingHandleFrame.border[0] + dx, 0), frame.rect[2] - frame.border[2]);
                break;
            }
            case HANDLE.BORDER_RIGHT: {
                frame.border[2] = Math.min(Math.max(startingHandleFrame.border[2] - dx, 0), frame.rect[2] - frame.border[0]);
                break;
            }
            case HANDLE.BORDER_BOTTOM_LEFT: {
                frame.border[0] = Math.min(Math.max(startingHandleFrame.border[0] + dx, 0), frame.rect[2] - frame.border[2]);
                frame.border[1] = Math.min(Math.max(startingHandleFrame.border[1] - dy, 0), frame.rect[3] - frame.border[3]);
                break;
            }
            case HANDLE.BORDER_BOTTOM: {
                frame.border[1] = Math.min(Math.max(startingHandleFrame.border[1] - dy, 0), frame.rect[3] - frame.border[3]);
                break;
            }
            case HANDLE.BORDER_BOTTOM_RIGHT: {
                frame.border[2] = Math.min(Math.max(startingHandleFrame.border[2] - dx, 0), frame.rect[2] - frame.border[0]);
                frame.border[1] = Math.min(Math.max(startingHandleFrame.border[1] - dy, 0), frame.rect[3] - frame.border[3]);
                break;
            }
            case HANDLE.PIVOT: {
                const left = frameLeft(frame, imgLeft, imgWidth);
                const top = frameTop(frame, imgTop, imgHeight);
                const width = frameWidth(frame, imgWidth);
                const height = frameHeight(frame, imgHeight);
                frame.pivot[0] = clamp((p.x - left) / width, 0, 1);
                frame.pivot[1] = clamp(1 - (p.y - top) / height, 0, 1);
                break;
            }
            case HANDLE.FRAME: {
                frame.rect[0] = clamp(startingHandleFrame.rect[0] + (dx), 0, realWidth - frame.rect[2]);
                frame.rect[1] = clamp(startingHandleFrame.rect[1] - (dy), 0, realHeight - frame.rect[3]);
                break;
            }
        }
    };

    const resetControls = (): void => {
        controls.set('zoom', 1);
        pivotX = 0;
        pivotY = 0;
        pivotOffsetX = 0;
        pivotOffsetY = 0;
        zoomOffsetX = 0;
        zoomOffsetY = 0;
    };

    const startPanning = (x: number, y: number): void => {
        panning = true;
        mouseX = x;
        mouseY = y;
        prevMouseX = x;
        prevMouseY = y;
        updateCursor();
    };

    const stopPanning = (): void => {
        panning = false;
        pivotX += pivotOffsetX;
        pivotY += pivotOffsetY;
        pivotOffsetX = 0;
        pivotOffsetY = 0;
        updateCursor();
    };

    const onKeyDown = (e: KeyboardEvent): void => {
        if (e.shiftKey) {
            shiftDown = true;
            updateCursor();
        }

        ctrlDown = e.ctrlKey || e.metaKey;
    };

    const onKeyUp = (e: KeyboardEvent): void => {
        if (!e.shiftKey) {
            shiftDown = false;
            if (panning) {
                stopPanning();
            }

            updateCursor();
        }

        ctrlDown = e.ctrlKey || e.metaKey;
    };

    const onMouseDown = (e: MouseEvent): void => {
        if (e.button === 0) {
            leftButtonDown = true;
        } else if (e.button === 1) {
            middleButtonDown = true;
        }

        ctrlDown = e.ctrlKey || e.metaKey;

        // start panning with left button and shift
        if (!panning && (leftButtonDown && shiftDown || middleButtonDown)) {
            startPanning(e.clientX, e.clientY);
            return;
        }

        if (e.button !== 0) {
            return;
        }

        const p = windowToCanvas(e.clientX, e.clientY);

        let selected = editor.call('picker:sprites:selectedFrame');

        // if a frame is already selected try to select one of its handles
        if (selected && !ctrlDown) {
            oldFrame = deepCopy(atlasAsset.get(`data.frames.${selected}`));
            if (oldFrame) {
                setHandle(handlesHitTest(p, oldFrame), oldFrame, p);

                if (selectedHandle) {
                    updateCursor();
                    queueRender();
                }

            }
        }

        // if no handle selected try to select the frame under the cursor
        if (!selected || !selectedHandle) {
            const frameUnderCursor = framesHitTest(p);
            if (!frameUnderCursor) {
                // clear selection unless Ctrl is down
                if (!ctrlDown) {
                    selected = editor.call('picker:sprites:selectFrames', null, {
                        history: true,
                        clearSprite: !spriteEditMode
                    });
                }
            } else {
                let keys = spriteEditMode ? editor.call('picker:sprites:newSpriteFrames') : editor.call('picker:sprites:highlightedFrames');
                const idx = keys.indexOf(frameUnderCursor);
                // deselect already highlighted frame if ctrl is pressed
                if (idx !== -1 && ctrlDown) {
                    keys = keys.slice();
                    keys.splice(idx, 1);
                    selected = editor.call('picker:sprites:selectFrames', keys, {
                        history: true,
                        clearSprite: !spriteEditMode
                    });
                } else {
                    // select new frame
                    selected = editor.call('picker:sprites:selectFrames', frameUnderCursor, {
                        history: true,
                        clearSprite: !spriteEditMode,
                        add: ctrlDown
                    });
                }
            }
        }

        // if no frame selected then start a new frame
        if (!selected && !spriteEditMode && editor.call('permissions:write')) {
            const diffX = clamp((p.x - imageLeft()) / imageWidth(), 0, 1);
            const diffY = clamp((1 - (p.y - imageTop()) / imageHeight()), 0, 1);

            const x = Math.floor(atlasImage.width * diffX);
            const y = Math.floor(atlasImage.height * diffY);
            newFrame = {
                rect: [x, y, 0, 0],
                pivot: [0.5, 0.5],
                border: [0, 0, 0, 0]
            };
            setHandle(HANDLE.BOTTOM_RIGHT, newFrame, p);

            updateCursor();
        }
    };

    const onMouseMove = (e: MouseEvent): void => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // keep panning
        if (panning) {
            pivotOffsetX = (mouseX - prevMouseX) / canvas.width;
            pivotOffsetY = (mouseY - prevMouseY) / canvas.height;
            queueRender();
            return;
        }

        const p = windowToCanvas(mouseX, mouseY);

        const selected = editor.call('picker:sprites:selectedFrame');

        const previousHoveringHandle = hoveringHandle;
        hoveringHandle = null;

        // if a handle is selected then modify the selected frame
        if (newFrame) {
            modifyFrame(selectedHandle, newFrame, p);
            queueRender();
        } else if (selected && selectedHandle) {
            const frame = atlasAsset.get(`data.frames.${selected}`);
            modifyFrame(selectedHandle, frame, p);

            // set asset so that other users can see changes too
            const history = atlasAsset.history.enabled;
            atlasAsset.history.enabled = false;
            if (selectedHandle === HANDLE.PIVOT) {
                atlasAsset.set(`data.frames.${selected}.pivot`, frame.pivot);
            } else {
                atlasAsset.set(`data.frames.${selected}.rect`, frame.rect);
                atlasAsset.set(`data.frames.${selected}.border`, frame.border);
            }
            atlasAsset.history.enabled = history;

            queueRender();
        } else if (selected) {
            // if no handle is selected then change cursor if the user hovers over a handle
            let selectedFrame = atlasAsset.getRaw(`data.frames.${selected}`);
            if (selectedFrame) {
                selectedFrame = selectedFrame._data;
                hoveringHandle = handlesHitTest(p, selectedFrame);
            }
        }

        if (hoveringHandle !== previousHoveringHandle) {
            updateCursor();
        }
    };

    const onMouseUp = (e: MouseEvent): void => {
        if (e.button === 0) {
            leftButtonDown = false;
        } else if (e.button === 1) {
            middleButtonDown = false;
        }

        // stop panning
        if (panning && !leftButtonDown && !middleButtonDown) {
            stopPanning();
        }

        if (e.button !== 0) {
            return;
        }

        let selected = editor.call('picker:sprites:selectedFrame');

        // if we've been editing a new frame then create it
        if (newFrame) {

            // don't generate it if it's too small
            if (newFrame.rect[2] !== 0 && newFrame.rect[3] !== 0) {
                // generate key name for new frame
                let key = 1;
                for (const existingKey in atlasAsset.getRaw('data.frames')._data) {
                    key = Math.max(parseInt(existingKey, 10) + 1, key);
                }

                newFrame.name = `Frame ${key}`;

                editor.call('picker:sprites:commitFrameChanges', key.toString(), newFrame);
                selected = editor.call('picker:sprites:selectFrames', key.toString(), {
                    clearSprite: true
                });
            }

            newFrame = null;
            hoveringHandle = null;
            setHandle(null);
            queueRender();
        } else if (selected) {
            // if we have edited the selected frame then commit the changes

            // clear selected handle
            if (selectedHandle) {
                setHandle(null);
                queueRender();
            }

            if (oldFrame) {
                const frame = atlasAsset.getRaw(`data.frames.${selected}`)._data;
                let dirty = false;
                for (let i = 0; i < 4; i++) {
                    if (oldFrame.rect[i] !== frame.rect[i]) {
                        dirty = true;
                        break;
                    }


                    if (oldFrame.border[i] !== frame.border[i]) {
                        dirty = true;
                        break;
                    }
                }

                if (!dirty) {
                    for (let i = 0; i < 2; i++) {
                        if (oldFrame.pivot[i] !== frame.pivot[i]) {
                            dirty = true;
                            break;
                        }
                    }
                }

                if (dirty) {
                    editor.call('picker:sprites:commitFrameChanges', selected, frame, oldFrame);
                    oldFrame = null;
                }
            }
        }
    };

    const onWheel = (e: WheelEvent): void => {
        e.preventDefault();
        e.stopPropagation();

        const wheel = e.deltaY > 0 ? -0.1 : (e.deltaY < 0 ? 0.1 : 0);
        if (wheel !== 0) {
            const newZoom = Math.max(0.7, controls.get('zoom') + wheel);
            controls.set('zoom', newZoom);
        }
    };

    const registerInputListeners = (): void => {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mousemove', onMouseMove);
        canvas.dom.addEventListener('mousedown', onMouseDown);
        canvas.dom.addEventListener('wheel', onWheel);

        // 'F' hotkey to focus canvas
        editor.call('hotkey:register', 'sprite-editor-focus', {
            key: 'f',
            callback: () => {
                editor.call('picker:sprites:focus');
            }
        });

        // Esc to deselect and if no selection close the window
        editor.call('hotkey:register', 'sprite-editor-esc', {
            key: 'Escape',
            callback: () => {
                if (editor.call('picker:isOpen', 'confirm')) {
                    return;
                }

                const spriteAsset = editor.call('picker:sprites:selectedSprite');
                if (spriteAsset) {
                    if (spriteEditMode) {
                        editor.call('picker:sprites:pickFrames:cancel');
                    } else {
                        editor.call('picker:sprites:selectSprite', null, {
                            history: true
                        });
                    }
                } else {
                    let selected = editor.call('picker:sprites:selectedFrame');
                    if (selected) {
                        selected = editor.call('picker:sprites:selectFrames', null, {
                            history: true
                        });
                    } else {
                        overlay.hidden = true;
                    }
                }
            }
        });
    };

    const unregisterInputListeners = (): void => {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('mousemove', onMouseMove);
        canvas.dom.removeEventListener('mousedown', onMouseDown);
        canvas.dom.removeEventListener('wheel', onWheel);

        editor.call('hotkey:unregister', 'sprite-editor-focus');
        editor.call('hotkey:unregister', 'sprite-editor-esc');
    };


    controls.on('zoom:set', (value, oldValue) => {
        if (overlay.hidden) {
            return;
        }

        // store current zoom offset
        pivotX += zoomOffsetX;
        pivotY += zoomOffsetY;
        // reset current zoom offset
        zoomOffsetX = 0;
        zoomOffsetY = 0;

        let x = 0;
        let y = 0;

        // if the mouse cursor is not on the canvas
        // then use canvas center point as zoom pivot
        const canvasRect = canvas.dom.getBoundingClientRect();
        if (mouseX < canvasRect.left || mouseX > canvasRect.right ||
            mouseY < canvasRect.top || mouseY > canvasRect.bottom) {
            x = canvas.width / 2;
            y = canvas.height / 2;
        } else {
            x = mouseX - canvasRect.left;
            y = mouseY - canvasRect.top;
        }

        // calculate zoom difference percentage
        const zoomDiff = (value - oldValue);
        const z = zoomDiff / oldValue;

        // calculate zoom offset based on the current zoom pivot
        zoomOffsetX = -z * (x - imageLeft()) / canvas.width;
        zoomOffsetY = -z * (y - imageTop()) / canvas.height;

        // re-render
        queueRender();
    });

    const updateRightPanel = (): void => {
        if (!rightPanel) {
            rightPanel = new Panel({
                class: ['right-panel', 'attributes'],
                collapseHorizontally: true,
                collapsible: true,
                flexShrink: '0',
                resizable: 'left',
                resizeMax: 512,
                resizeMin: 256,
                scrollable: false,
                width: 320
            });
            panel.append(rightPanel);

            // Create scrollable content area inside the panel
            rightPanelContent = new Container({
                class: 'right-panel-content',
                scrollable: true
            });
            rightPanel.append(rightPanelContent);
        } else {
            // emit 'clear' event to clear existing children of right panel
            rightPanel.emit('clear');

            // Destroy old content container and create new one
            if (rightPanelContent) {
                rightPanelContent.destroy();
            }
            rightPanelContent = new Container({
                class: 'right-panel-content',
                scrollable: true
            });
            rightPanel.append(rightPanelContent);
        }

        if (!atlasImageLoaded) {
            return;
        }

        const spriteAsset = editor.call('picker:sprites:selectedSprite');

        if (spriteAsset) {
            editor.call('picker:sprites:attributes:sprite', { atlasAsset, atlasImage, spriteAsset });
        } else {
            const highlightedFrames = editor.call('picker:sprites:highlightedFrames');
            if (highlightedFrames.length) {
                editor.call('picker:sprites:attributes:frames', { atlasAsset, atlasImage, frames: highlightedFrames });
                editor.call('picker:sprites:attributes:frames:relatedSprites', { atlasAsset, frames: highlightedFrames });
            } else {
                editor.call('picker:sprites:attributes:atlas', atlasAsset);
                editor.call('picker:sprites:attributes:slice', { atlasAsset, atlasImage, atlasImageData });
                editor.call('picker:sprites:attributes:importFrames', { atlasAsset });
            }
        }
    };


    const showEditor = (asset): void => {
        let _spriteAsset = null;
        if (asset.get('type') === 'textureatlas') {
            atlasAsset = asset;
        } else if (asset.get('type') === 'sprite') {
            atlasAsset = editor.call('assets:get', asset.get('data.textureAtlasAsset'));
            _spriteAsset = asset;
        } else {
            atlasAsset = null;
        }

        if (!atlasAsset) {
            return;
        }

        panel.headerText = `SPRITE EDITOR - ${atlasAsset.get('name').toUpperCase()}`;

        // show overlay
        overlay.hidden = false;

        atlasImageLoaded = false;
        atlasImage.onload = () => {
            atlasImageLoaded = true;

            // get image data
            atlasImageDataCanvas.width = atlasImage.width;
            atlasImageDataCanvas.height = atlasImage.height;
            atlasImageDataCanvas.getContext('2d').drawImage(atlasImage, 0, 0, atlasImage.width, atlasImage.height);
            atlasImageData = atlasImageDataCanvas.getContext('2d').getImageData(0, 0, atlasImage.width, atlasImage.height);

            aspectRatio = atlasImage.width / atlasImage.height;

            editor.call('picker:sprites:frames', { atlasAsset });
            editor.call('picker:sprites:spriteassets', { atlasAsset });
            editor.emit('picker:sprites:open');

            if (_spriteAsset) {
                editor.call('picker:sprites:selectSprite', _spriteAsset);
            } else {
                updateRightPanel();
                renderCanvas();
            }

        };

        atlasImage.src = buildQueryUrl(atlasAsset.get('file.url'), { t: atlasAsset.get('file.hash') });

        // listen to atlas changes and render
        events.push(atlasAsset.on('*:set', queueRender));
        events.push(atlasAsset.on('*:unset', queueRender));
        events.push(atlasAsset.on('name:set', (value) => {
            panel.headerText = `SPRITE EDITOR - ${value.toUpperCase()}`;
        }));

        // resize 20 times a second - if size is the same nothing will happen
        if (resizeInterval) {
            clearInterval(resizeInterval);
        }
        resizeInterval = setInterval(() => {
            if (resizeCanvas()) {
                queueRender();
            }
        }, 1000 / 60);

        resizeCanvas();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        updateRightPanel();

        registerInputListeners();

        // clear current selection so that we don't
        // accidentally delete any selected assets when pressing delete
        editor.call('selector:history', false);
        editor.call('selector:clear');
        // restore selector history in a timeout
        // because selector:clear emits a history
        // event also in a timeout... annoying
        setTimeout(() => {
            editor.call('selector:history', true);
        });
    };

    const cleanUp = (): void => {
        // reset controls
        controls.set('zoom', 1);
        controls.set('brightness', 100);

        resetControls();

        if (resizeInterval) {
            clearInterval(resizeInterval);
            resizeInterval = null;
        }

        // destroy right panel
        if (rightPanel) {
            rightPanel.emit('clear');
            rightPanel.destroy();
            rightPanel = null;
            rightPanelContent = null;
        }

        leftPanel.emit('clear');
        bottomPanel.emit('clear');

        newFrame = null;
        hoveredFrame = null;
        startingHandleFrame = null;
        hoveringHandle = null;
        selectedHandle = null;
        atlasImageData = null;
        atlasImageDataCanvas.getContext('2d').clearRect(0, 0, atlasImageDataCanvas.width, atlasImageDataCanvas.height);

        if (atlasImage) {
            atlasImage.onload = null;
        }

        atlasImage = new Image();

        leftButtonDown = false;
        middleButtonDown = false;
        shiftDown = false;

        if (spriteEditMode) {
            editor.call('picker:sprites:pickFrames:cancel');
        }

        atlasAsset = null;

        middlePanel.class.remove('grab');
        middlePanel.class.remove('grabbing');

        events.forEach(event => event.unbind());
        events.length = 0;

        unregisterInputListeners();

        editor.emit('picker:sprites:close');
    };

    // Return canvas
    editor.method('picker:sprites:canvas', () => {
        return canvas.dom;
    });

    // Return left panel
    editor.method('picker:sprites:leftPanel', () => {
        return leftPanel;
    });

    // Return right panel
    editor.method('picker:sprites:rightPanel', () => {
        return rightPanel;
    });

    // Return right panel scrollable content area
    editor.method('picker:sprites:rightPanelContent', () => {
        return rightPanelContent;
    });

    // Return main panel
    editor.method('picker:sprites:mainPanel', () => {
        return panel;
    });

    // Return bottom panel
    editor.method('picker:sprites:bottomPanel', () => {
        return bottomPanel;
    });

    // Return atlas asset
    editor.method('picker:sprites:atlasAsset', () => {
        return atlasAsset;
    });

    // Return atlas image
    editor.method('picker:sprites:atlasImage', () => {
        return atlasImage;
    });

    // Return atlas image data
    editor.method('picker:sprites:atlasImageData', () => {
        return atlasImageData;
    });

    // Return sprite editor controls
    editor.method('picker:sprites:controls', () => {
        return controls;
    });

    editor.method('picker:sprites:hoverFrame', (frameKey) => {
        hoveredFrame = frameKey;
        queueRender();
    });

    // Queue re-render
    editor.method('picker:sprites:queueRender', queueRender);

    // Focus the selected frame if one exists otherwise resets view
    editor.method('picker:sprites:focus', () => {
        const selected = editor.call('picker:sprites:selectedFrame');
        // if we have a selected frame then focus on that
        // otherwise completely reset view
        if (selected) {
            const frame = atlasAsset.getRaw(`data.frames.${selected}`)._data;

            // these are derived by solving the equations so that frameLeft + frameWidth / 2 === canvas.width / 2
            // and frameTop + frameHeight / 2 === canvas.height / 2
            const frameWidthPercentage = (frame.rect[0] + frame.rect[2] / 2) / atlasImage.width;
            const imageWidthPercentage = imageWidth() / canvas.width;

            const frameHeightPercentage = (atlasImage.height - frame.rect[1] - frame.rect[3] * 0.5) / atlasImage.height;
            const imageHeightPercentage = imageHeight() / canvas.height;

            // set pivotX and pivotY and zero out the other offsets
            pivotX = 0.5 - frameWidthPercentage * imageWidthPercentage;
            pivotY = 0.5 - frameHeightPercentage * imageHeightPercentage;
            zoomOffsetX = 0;
            pivotOffsetX = 0;
            zoomOffsetY = 0;
            pivotOffsetY = 0;

        } else {
            resetControls();
        }
        queueRender();
    });

    // Update inspector when selection changes
    editor.on('picker:sprites:framesSelected', () => {
        hoveringHandle = null;
        setHandle(null);
        updateCursor();

        if (!spriteEditMode) {
            updateRightPanel();
        }

        queueRender();
    });

    // Track sprite edit mode
    editor.on('picker:sprites:pickFrames:start', () => {
        spriteEditMode = true;
        queueRender();
    });

    editor.on('picker:sprites:pickFrames:end', () => {
        spriteEditMode = false;
        queueRender();
    });

    // open Sprite Editor (undoable)
    editor.method('picker:sprites', (asset) => {
        editor.api.globals.history.add({
            name: 'open sprite editor',
            combine: false,
            undo: () => {
                overlay.hidden = true;
            },
            redo: () => {
                const currentAsset = editor.call('assets:get', asset.get('id'));
                if (!currentAsset) {
                    return;
                }

                showEditor(currentAsset);
            }
        });

        showEditor(asset);
    });

    // Close Sprite Editor (undoable)
    editor.method('picker:sprites:close', () => {
        overlay.hidden = true;
    });

    overlay.on('show', () => {
        // editor-blocking picker opened
        editor.emit('picker:open', 'sprite-editor');
    });

    // Clean up
    overlay.on('hide', () => {
        if (!suspendCloseUndo) {
            const currentAsset = atlasAsset;

            editor.api.globals.history.add({
                name: 'close sprite editor',
                combine: false,
                undo: () => {
                    const asset = editor.call('assets:get', currentAsset.get('id'));
                    if (!asset) {
                        return;
                    }

                    showEditor(asset);
                },
                redo: () => {
                    suspendCloseUndo = true;
                    overlay.hidden = true;
                    suspendCloseUndo = false;
                }
            });
        }

        cleanUp();

        // editor-blocking picker closed
        editor.emit('picker:close', 'sprite-editor');
    });
});
