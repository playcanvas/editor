editor.once('load', function () {
    var canvas = editor.call('viewport:canvas');
    if (!canvas) return;

    function Tap(evt, rect, mouse) {
        this.x = this.lx = this.sx = evt.clientX - rect.left;
        this.y = this.ly = this.sy = evt.clientY - rect.top;
        this.nx = 0;
        this.ny = 0;
        this.move = false;
        this.down = true;
        this.button = evt.button;
        this.mouse = !!mouse;
    }
    Tap.prototype.update = function (evt, rect) {
        var x = evt.clientX - rect.left;
        var y = evt.clientY - rect.top;

        // if it's moved
        if (this.down && !this.move && (Math.abs(this.sx - x) + Math.abs(this.sy - y)) > 8)
            this.move = true;

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
    };

    var taps = [];
    // var tapMouse = new Tap({ clientX: 0, clientY: 0 }, { left: 0, top: 0 });
    var inViewport = false;

    editor.method('viewport:inViewport', function () {
        return inViewport;
    });

    var evtMouseMove = function (evt) {
        var rect = canvas.element.getBoundingClientRect();
        for (let i = 0; i < taps.length; i++) {
            if (!taps[i].mouse)
                continue;

            taps[i].update(evt, rect);
            editor.emit('viewport:tap:move', taps[i], evt);
        }

        editor.emit('viewport:mouse:move', {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top,
            down: taps.length !== 0
        });

        // render if mouse moved within viewport
        if (evt.clientX >= rect.left && evt.clientX <= rect.right && evt.clientY >= rect.top && evt.clientY <= rect.bottom) {
            if (!inViewport) {
                inViewport = true;
                editor.emit('viewport:hover', true);
            }
            editor.call('viewport:render');
        } else if (inViewport) {
            inViewport = false;
            editor.emit('viewport:hover', false);
            editor.call('viewport:render');
        }
    };

    var evtMouseUp = function (evt) {
        var items = taps.slice(0);

        for (let i = 0; i < items.length; i++) {
        // if (tapMouse.down) {
            if (!items[i].mouse || !items[i].down || items[i].button !== evt.button)
                continue;

            items[i].down = false;
            items[i].update(evt, canvas.element.getBoundingClientRect());
            editor.emit('viewport:tap:end', items[i], evt);

            if (!items[i].move)
                editor.emit('viewport:tap:click', items[i], evt);

            var ind = taps.indexOf(items[i]);
            if (ind !== -1)
                taps.splice(ind, 1);
        }

        var rect = canvas.element.getBoundingClientRect();

        editor.emit('viewport:mouse:move', {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top,
            down: taps.length !== 0
        });
    };

    canvas.element.addEventListener('mousedown', function (evt) {
        var rect = canvas.element.getBoundingClientRect();

        editor.emit('viewport:mouse:move', {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top,
            down: true
        });

        var tap = new Tap(evt, rect, true);
        taps.push(tap);

        editor.emit('viewport:tap:start', tap, evt);

        if (document.activeElement && document.activeElement.tagName.toLowerCase() === 'input')
            document.activeElement.blur();

        evt.preventDefault();
    }, false);

    canvas.element.addEventListener('mouseover', function () {
        editor.emit('viewport:hover', true);
        editor.call('viewport:render');
    }, false);

    canvas.element.addEventListener('mouseleave', function (evt) {
        // ignore tooltip
        var target = evt.toElement || evt.relatedTarget;
        if (target && target.classList.contains('cursor-tooltip'))
            return;

        editor.emit('viewport:hover', false);
        editor.call('viewport:render');
    }, false);

    window.addEventListener('mousemove', evtMouseMove, false);
    window.addEventListener('dragover', evtMouseMove, false);
    window.addEventListener('mouseup', evtMouseUp, false);
});
