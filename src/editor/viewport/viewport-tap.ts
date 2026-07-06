import type { Canvas } from '@playcanvas/pcui';

/** Tap/pointer state passed to viewport:tap:* and viewport:mouse:move handlers */
export type ViewportTap = {
    x: number;
    y: number;
    lx?: number;
    ly?: number;
    button: number;
    mouse?: boolean;
    move?: boolean;
};

editor.once('load', () => {
    const canvas = editor.call('viewport:canvas') as Canvas | null;
    if (!canvas) {
        return;
    }

    class Tap {
        x: number;

        y: number;

        lx: number;

        ly: number;

        sx: number;

        sy: number;

        nx = 0;

        ny = 0;

        move = false;

        down = true;

        button: number;

        mouse: boolean;

        constructor(evt: MouseEvent, rect: DOMRect, mouse: boolean) {
            this.x = this.lx = this.sx = evt.clientX - rect.left;
            this.y = this.ly = this.sy = evt.clientY - rect.top;
            this.button = evt.button;
            this.mouse = !!mouse;
        }

        update(evt: MouseEvent, rect: DOMRect) {
            const x = evt.clientX - rect.left;
            const y = evt.clientY - rect.top;

            // if it's moved
            if (this.down && !this.move && Math.abs(this.sx - x) + Math.abs(this.sy - y) > 8) {
                this.move = true;
            }

            // moving
            if (this.move) {
                this.nx = x - this.lx;
                this.ny = y - this.ly;
                this.lx = this.x;
                this.ly = this.y;
            }

            // coords
            this.x = x;
            this.y = y;
        }
    }

    const taps = [];
    // var tapMouse = new Tap({ clientX: 0, clientY: 0 }, { left: 0, top: 0 });
    let inViewport = false;

    editor.method('viewport:inViewport', () => {
        return inViewport;
    });

    const evtMouseMove = function (evt: MouseEvent) {
        const rect = canvas.dom.getBoundingClientRect();
        for (const tap of taps) {
            if (!tap.mouse) {
                continue;
            }

            tap.update(evt, rect);
            editor.emit('viewport:tap:move', tap, evt);
        }

        editor.emit('viewport:mouse:move', {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top,
            down: taps.length !== 0
        });

        // track hover state as the mouse moves
        if (
            evt.clientX >= rect.left &&
            evt.clientX <= rect.right &&
            evt.clientY >= rect.top &&
            evt.clientY <= rect.bottom
        ) {
            if (!inViewport) {
                inViewport = true;
                editor.emit('viewport:hover', true);
            }
        } else if (inViewport) {
            inViewport = false;
            editor.emit('viewport:hover', false);
        }

        // render only while actively dragging (a pointer is down): drags drive
        // per-frame handlers (camera, gizmos) that must redraw as the mouse moves.
        // plain hovering with no button must NOT render — costly for splats.
        if (taps.length) {
            editor.call('viewport:render');
        }
    };

    // track gizmo dragging state to splice into tap handling (uses pointer events)
    let gizmoDragging = false;
    editor.on('gizmo:transform:drag', (dragging) => {
        gizmoDragging = dragging;
    });
    const gizmoCapture = (evt: MouseEvent) => gizmoDragging && evt.button === 0;

    const evtMouseUp = function (evt: MouseEvent) {
        if (gizmoCapture(evt)) {
            return;
        }
        const items = taps.slice(0);

        for (const item of items) {
            // if (tapMouse.down) {
            if (!item.mouse || !item.down || item.button !== evt.button) {
                continue;
            }

            item.down = false;
            item.update(evt, canvas.dom.getBoundingClientRect());
            editor.emit('viewport:tap:end', item, evt);

            if (!item.move) {
                editor.emit('viewport:tap:click', item, evt);
            }

            const ind = taps.indexOf(item);
            if (ind !== -1) {
                taps.splice(ind, 1);
            }
        }

        const rect = canvas.dom.getBoundingClientRect();

        editor.emit('viewport:mouse:move', {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top,
            down: taps.length !== 0
        });
    };

    canvas.dom.addEventListener(
        'mousedown',
        (evt) => {
            if (gizmoCapture(evt)) {
                return;
            }
            const rect = canvas.dom.getBoundingClientRect();

            editor.emit('viewport:mouse:move', {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top,
                down: true
            });

            const tap = new Tap(evt, rect, true);
            taps.push(tap);

            editor.emit('viewport:tap:start', tap, evt);

            if (document.activeElement && document.activeElement.tagName.toLowerCase() === 'input') {
                (document.activeElement as HTMLElement).blur();
            }

            evt.preventDefault();
        },
        false
    );

    canvas.dom.addEventListener(
        'mouseover',
        () => {
            editor.emit('viewport:hover', true);
        },
        false
    );

    canvas.dom.addEventListener(
        'mouseleave',
        (evt) => {
            // ignore tooltip
            const target = evt.relatedTarget as Element | null;
            if (target && target.classList.contains('cursor-tooltip')) {
                return;
            }

            editor.emit('viewport:hover', false);
        },
        false
    );

    window.addEventListener('mousemove', evtMouseMove, false);
    window.addEventListener('dragover', evtMouseMove, false);
    window.addEventListener('mouseup', evtMouseUp, false);
});
