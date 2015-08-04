editor.once('load', function() {
    'use strict';

    var canvas = editor.call('viewport:canvas');

    function Tap(evt, rect) {
        this.x = this.lx = this.sx = evt.clientX - rect.left;
        this.y = this.ly = this.sy = evt.clientY - rect.top;
        this.nx = 0;
        this.ny = 0;
        this.move = false;
        this.down = false;
    };
    Tap.prototype.update = function(evt, rect) {
        var x = evt.clientX - rect.left;
        var y = evt.clientY - rect.top;

        // if it's moved
        if (this.down && ! this.move && (Math.abs(this.sx - x) + Math.abs(this.sy - y)) > 8)
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

    var taps = [ ];
    var tapMouse = new Tap({ clientX: 0, clientY: 0 }, { left: 0, top: 0 });
    var inViewport = false;


    var evtMouseMove = function(evt) {
        var rect = canvas.element.getBoundingClientRect();
        tapMouse.update(evt, rect);
        editor.emit('viewport:tap:move', tapMouse, evt);

        // render if mouse moved within viewport
        if (evt.clientX >= rect.left && evt.clientX <= rect.right && evt.clientY >= rect.top && evt.clientY <= rect.bottom) {
            if (! inViewport) {
                inViewport = true;
                editor.emit('viewport:hover', true);
            }
            editor.call('viewport:render');
        } else if (inViewport) {
            inViewport = false;
            editor.emit('viewport:hover', false);
        }
    };

    var evtMouseUp = function(evt) {
        if (evt.button !== 0)
            return;

        if (tapMouse.down) {
            tapMouse.down = false;
            tapMouse.update(evt, canvas.element.getBoundingClientRect());
            editor.emit('viewport:tap:end', tapMouse, evt);

            if (! tapMouse.move)
                editor.emit('viewport:tap:click', tapMouse, evt);

            var ind = taps.indexOf(tapMouse);
            if (ind !== -1)
                taps.splice(ind, 1);
        }
    };

    canvas.element.addEventListener('mousedown', function(evt) {
        if (evt.button !== 0)
            return;

        var rect = canvas.element.getBoundingClientRect();

        tapMouse.move = false;
        tapMouse.down = true;
        tapMouse.sx = evt.clientX - rect.left;
        tapMouse.sy = evt.clientY - rect.top;
        taps.push(tapMouse);

        editor.emit('viewport:tap:start', tapMouse, evt);

        if (document.activeElement && document.activeElement.tagName.toLowerCase() === 'input')
            document.activeElement.blur();

        evt.preventDefault();
    }, false);

    window.addEventListener('mousemove', evtMouseMove, false);
    window.addEventListener('mouseup', evtMouseUp, false);
});
