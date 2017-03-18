var now = function() {
    return performance.timing.navigationStart + performance.now();
};

if (! performance || ! performance.now || ! performance.timing)
    now = Date.now;

var start = now();

editor.once('load', function() {
    'use strict';

    // times
    var timeBeginning = performance.timing ? performance.timing.responseEnd : start;
    var timeNow = now() - timeBeginning;
    var timeHover = 0;

    var epoc = ! window.performance || ! performance.now || ! performance.timing;
    editor.method('tools:epoc', function() {
        return epoc;
    });

    editor.method('tools:time:now', function() { return now() - timeBeginning; });
    editor.method('tools:time:beginning', function() { return timeBeginning; });
    editor.method('tools:time:hover', function() { return timeHover; });

    editor.method('tools:time:toHuman', function(ms, precision) {
        var s = ms / 1000;
        var m = ('00' + Math.floor(s / 60)).slice(-2);
        if (precision) {
            s = ('00.0' + (s % 60).toFixed(precision)).slice(-4);
        } else {
            s = ('00' + Math.floor(s % 60)).slice(-2);
        }
        return m + ':' + s;
    });

    // root panel
    var root = document.createElement('div');
    root.id = 'dev-tools';
    root.style.display = 'none';
    document.body.appendChild(root);
    editor.method('tools:root', function() {
        return root;
    });

    // variabled
    var updateInterval;
    var enabled = false;

    if (location.search && location.search.indexOf('profile=true') !== -1)
        enabled = true;

    if (enabled)
        root.style.display = 'block';

    // view
    var scale = .2; // how many pixels in a ms
    var capacity = 0; // how many ms can fit
    var scroll = {
        time: 0, // how many ms start from
        auto: true, // auto scroll to the end
        drag: {
            x: 0,
            time: 0,
            bar: false,
            barTime: 0,
            barMove: false
        }
    };

    editor.method('tools:enabled', function() { return enabled; });

    editor.method('tools:enable', function() {
        if (enabled)
            return;

        enabled = true;
        root.style.display = 'block';
        resize();
        editor.emit('tools:clear');
        editor.emit('tools:state', true);

        // updateInterval = setInterval(function() {
        //     update();
        //     editor.emit('tools:render');
        // }, 1000 / 60);
    });

    editor.method('tools:disable', function() {
        if (! enabled)
            return;

        enabled = false;
        root.style.display = 'none';
        editor.emit('tools:clear');
        editor.emit('tools:state', false);
        // clearInterval(updateInterval);
    });

    // methods to access view params
    editor.method('tools:time:capacity', function() { return capacity; });
    editor.method('tools:scroll:time', function() { return scroll.time; });

    // size
    var left = 300;
    var right = 0;
    var width = 0;
    var height = 0;
    // resizing
    var resize = function() {
        var rect = root.getBoundingClientRect();

        if (width === rect.width && height === rect.height)
            return;

        width = rect.width;
        height = rect.height;
        capacity = Math.floor((width - left - right) / scale);
        scroll.time = Math.max(0, Math.min(timeNow - capacity, Math.floor(scroll.time)));

        editor.emit('tools:resize', width, height);
    };
    window.addEventListener('resize', resize, false);
    window.addEventListener('orientationchange', resize, false);
    setInterval(resize, 500);
    resize();
    editor.method('tools:size:width', function() { return width; });
    editor.method('tools:size:height', function() { return height; });

    editor.on('tools:clear', function() {
        timeBeginning = now();
        timeNow = 0;
        timeHover = 0;
        scroll.time = 0;
        scroll.auto = true;
    });

    var mouse = {
        x: 0,
        y: 0,
        click: false,
        down: false,
        up: false,
        hover: false
    };

    var update = function() {
        timeNow = now() - timeBeginning;

        if (scroll.auto)
            scroll.time = Math.max(0, timeNow - capacity);

        if (mouse.click) {
            scroll.drag.x = mouse.x;
            scroll.drag.time = scroll.time;
            scroll.drag.bar = mouse.y < 23;
            if (scroll.drag.bar) {
                scroll.drag.barTime = ((mouse.x / (width - 300)) * timeNow) - scroll.time;
                scroll.drag.barMove = scroll.drag.barTime >= 0 && scroll.drag.barTime <= capacity;
            }
            scroll.auto = false;
            root.classList.add('dragging');
            editor.emit('tools:scroll:start');
        } else if (mouse.down) {
            if (scroll.drag.bar) {
                if (scroll.drag.barMove) {
                    scroll.time = ((mouse.x / (width - 300)) * timeNow) - scroll.drag.barTime;
                } else {
                    scroll.time = ((mouse.x / (width - 300)) * timeNow) - (capacity / 2);
                }
            } else {
                scroll.time = scroll.drag.time + ((scroll.drag.x - mouse.x) / scale);
            }
            scroll.time = Math.max(0, Math.min(timeNow - capacity, Math.floor(scroll.time)));
        } else if (mouse.up) {
            if (Math.abs((scroll.time + capacity) - timeNow) < 32)
                scroll.auto = true;

            root.classList.remove('dragging');
            editor.emit('tools:scroll:end');
        }

        if (mouse.hover && ! mouse.down) {
            if (mouse.y < 23) {
                timeHover = Math.floor((mouse.x / (width - 300)) * timeNow);
            } else if (mouse.y < 174) {
                timeHover = Math.floor(mouse.x / scale + scroll.time);
            } else {
                timeHover = 0;
            }
        } else {
            timeHover = 0;
        }

        flushMouse();
    };

    root.addEventListener('mousemove', function(evt) {
        evt.stopPropagation();

        var rect = root.getBoundingClientRect();
        mouse.x = evt.clientX - (rect.left + 300);
        mouse.y = evt.clientY - rect.top;
        mouse.hover = mouse.x > 0;
        if (mouse.y < 23) {
            timeHover = Math.floor((mouse.x / (width - 300)) * timeNow);
        } else {
            timeHover = Math.floor(mouse.x / scale + scroll.time);
        }
    }, false);

    root.addEventListener('mousedown', function(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        if (evt.button !== 0 || mouse.click || mouse.down || ! mouse.hover)
            return;

        mouse.click = true;
    }, false);

    root.addEventListener('mouseup', function(evt) {
        evt.stopPropagation();

        if (evt.button !== 0 || ! mouse.down)
            return;

        mouse.down = false;
        mouse.up = true;
    }, false);

    root.addEventListener('mouseleave', function(evt) {
        mouse.hover = false;
        timeHover = 0;
        if (! mouse.down)
            return;

        mouse.down = false;
        mouse.up = true;
    }, false);

    root.addEventListener('mousewheel', function(evt) {
        evt.stopPropagation();

        if (! mouse.hover)
            return;

        scroll.time = Math.max(0, Math.min(timeNow - capacity, Math.floor(scroll.time + evt.deltaX / scale)));
        if (evt.deltaX < 0) {
            scroll.auto = false;
        } else if (Math.abs((scroll.time + capacity) - timeNow) < 16) {
            scroll.auto = true;
        }
    }, false);

    // alt + t
    window.addEventListener('keydown', function(evt) {
        if (evt.keyCode === 84 && evt.altKey) {
            if (enabled) {
                editor.call('tools:disable');
            } else {
                editor.call('tools:enable');
            }
        }
    }, false);

    var flushMouse = function() {
        if (mouse.up)
            mouse.up = false;

        if (mouse.click) {
            mouse.click = false;
            mouse.down = true;
        }
    };

    var app = editor.call('viewport:app');
    var frame = 0;
    var frameLast = 0;

    var onFrame = function() {
        requestAnimationFrame(onFrame);

        if (enabled) {
            var now = Date.now();

            if ((now - frameLast) >= 40) {
                frameLast = now;

                update();
                editor.emit('tools:render');
            }
        }
    };
    requestAnimationFrame(onFrame);
});
