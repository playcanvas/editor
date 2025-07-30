let now = function () {
    return performance.timing.navigationStart + performance.now();
};

if (!performance || !performance.now || !performance.timing) {
    now = Date.now;
}

const start = now();

editor.once('load', () => {
    // times
    let timeBeginning = performance.timing ? performance.timing.responseEnd : start;
    let timeNow = now() - timeBeginning;
    let timeHover = 0;

    const epoc = !window.performance || !performance.now || !performance.timing;
    editor.method('tools:epoc', () => {
        return epoc;
    });

    editor.method('tools:time:now', () => {
        return now() - timeBeginning;
    });
    editor.method('tools:time:beginning', () => {
        return timeBeginning;
    });
    editor.method('tools:time:hover', () => {
        return timeHover;
    });

    editor.method('tools:time:toHuman', (ms, precision) => {
        let s = ms / 1000;
        const m = (`00${Math.floor(s / 60)}`).slice(-2);
        if (precision) {
            s = (`00.0${(s % 60).toFixed(precision)}`).slice(-4);
        } else {
            s = (`00${Math.floor(s % 60)}`).slice(-2);
        }
        return `${m}:${s}`;
    });

    // root panel
    const root = document.createElement('div');
    root.id = 'dev-tools';
    root.style.display = 'none';
    document.body.appendChild(root);
    editor.method('tools:root', () => {
        return root;
    });

    // variabled
    // var updateInterval;
    let enabled = false;

    if (location.search && location.search.indexOf('profile=true') !== -1) {
        enabled = true;
    }

    if (enabled) {
        root.style.display = 'block';
    }

    // view
    const scale = 0.2; // how many pixels in a ms
    let capacity = 0; // how many ms can fit
    const scroll = {
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

    var resize;

    editor.method('tools:enabled', () => {
        return enabled;
    });

    editor.method('tools:enable', () => {
        if (enabled) {
            return;
        }

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

    editor.method('tools:disable', () => {
        if (!enabled) {
            return;
        }

        enabled = false;
        root.style.display = 'none';
        editor.emit('tools:clear');
        editor.emit('tools:state', false);
        // clearInterval(updateInterval);
    });

    // methods to access view params
    editor.method('tools:time:capacity', () => {
        return capacity;
    });
    editor.method('tools:scroll:time', () => {
        return scroll.time;
    });

    // size
    const left = 300;
    const right = 0;
    let width = 0;
    let height = 0;
    // resizing
    resize = function () {
        const rect = root.getBoundingClientRect();

        if (width === rect.width && height === rect.height) {
            return;
        }

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
    editor.method('tools:size:width', () => {
        return width;
    });
    editor.method('tools:size:height', () => {
        return height;
    });

    editor.on('tools:clear', () => {
        timeBeginning = now();
        timeNow = 0;
        timeHover = 0;
        scroll.time = 0;
        scroll.auto = true;
    });

    const mouse = {
        x: 0,
        y: 0,
        click: false,
        down: false,
        up: false,
        hover: false
    };

    const flushMouse = function () {
        if (mouse.up) {
            mouse.up = false;
        }

        if (mouse.click) {
            mouse.click = false;
            mouse.down = true;
        }
    };

    const update = function () {
        timeNow = now() - timeBeginning;

        if (scroll.auto) {
            scroll.time = Math.max(0, timeNow - capacity);
        }

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
            if (Math.abs((scroll.time + capacity) - timeNow) < 32) {
                scroll.auto = true;
            }

            root.classList.remove('dragging');
            editor.emit('tools:scroll:end');
        }

        if (mouse.hover && !mouse.down) {
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

    root.addEventListener('mousemove', (evt) => {
        evt.stopPropagation();

        const rect = root.getBoundingClientRect();
        mouse.x = evt.clientX - (rect.left + 300);
        mouse.y = evt.clientY - rect.top;
        mouse.hover = mouse.x > 0;
        if (mouse.y < 23) {
            timeHover = Math.floor((mouse.x / (width - 300)) * timeNow);
        } else {
            timeHover = Math.floor(mouse.x / scale + scroll.time);
        }
    }, false);

    root.addEventListener('mousedown', (evt) => {
        evt.stopPropagation();
        evt.preventDefault();

        if (evt.button !== 0 || mouse.click || mouse.down || !mouse.hover) {
            return;
        }

        mouse.click = true;
    }, false);

    root.addEventListener('mouseup', (evt) => {
        evt.stopPropagation();

        if (evt.button !== 0 || !mouse.down) {
            return;
        }

        mouse.down = false;
        mouse.up = true;
    }, false);

    root.addEventListener('mouseleave', (evt) => {
        mouse.hover = false;
        timeHover = 0;
        if (!mouse.down) {
            return;
        }

        mouse.down = false;
        mouse.up = true;
    }, false);

    root.addEventListener('mousewheel', (evt) => {
        evt.stopPropagation();

        if (!mouse.hover) {
            return;
        }

        scroll.time = Math.max(0, Math.min(timeNow - capacity, Math.floor(scroll.time + evt.deltaX / scale)));
        if (evt.deltaX < 0) {
            scroll.auto = false;
        } else if (Math.abs((scroll.time + capacity) - timeNow) < 16) {
            scroll.auto = true;
        }
    }, false);

    // alt + t
    window.addEventListener('keydown', (evt) => {
        if (evt.keyCode === 84 && evt.altKey) {
            if (enabled) {
                editor.call('tools:disable');
            } else {
                editor.call('tools:enable');
            }
        }
    }, false);

    const app = editor.call('viewport:app');
    if (!app) return; // webgl not available

    let frameLast = 0;

    const onFrame = function () {
        requestAnimationFrame(onFrame);

        if (enabled) {
            const now = Date.now();

            if ((now - frameLast) >= 40) {
                frameLast = now;

                update();
                editor.emit('tools:render');
            }
        }
    };
    requestAnimationFrame(onFrame);
});
